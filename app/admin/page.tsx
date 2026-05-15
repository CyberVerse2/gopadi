"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import Button from "../components/Button";
import ChatPanel from "../components/ChatPanel";
import { MoneyDisplay, MoneyInline } from "../components/MoneyDisplay";
import { useWallet } from "../components/WalletProvider";
import { Errand, Dispute, TrustlessAction } from "../types";
import {
  listErrands,
  listDisputes,
  listTrustlessActions,
  prepareTrustlessAction,
  resolveDispute,
  submitSignedTrustlessAction,
} from "../lib/api-client";

const TABS = [
  { key: "disputes", label: "disputes" },
  { key: "escrows", label: "escrows" },
  { key: "metrics", label: "metrics" },
] as const;
type Tab = (typeof TABS)[number]["key"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function shortAddr(value: string) {
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export default function AdminPage() {
  const wallet = useWallet();
  const [errands, setErrands] = useState<Errand[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [tab, setTab] = useState<Tab>("disputes");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [actionsByErrand, setActionsByErrand] = useState<
    Record<string, TrustlessAction[]>
  >({});

  const refresh = useCallback(
    (signer = wallet.address) => {
      if (!signer) return;
      Promise.all([listErrands(), listDisputes(signer)])
        .then(([errandsResult, disputesResult]) => {
          setErrands(errandsResult.errands);
          setDisputes(disputesResult.disputes);
        })
        .catch((e: unknown) =>
          setError(e instanceof Error ? e.message : "failed to load resolver data."),
        );
    },
    [wallet.address],
  );

  useEffect(() => {
    if (wallet.address) refresh(wallet.address);
  }, [wallet.address, refresh]);

  async function connectResolver() {
    const connected = wallet.address ?? (await wallet.connect());
    refresh(connected);
  }

  function getErrandFor(d: Dispute) {
    return errands.find((e) => e.id === d.errandId);
  }

  async function expandDispute(d: Dispute) {
    const isOpen = expanded === d.id;
    setExpanded(isOpen ? null : d.id);
    if (!isOpen && !actionsByErrand[d.errandId]) {
      try {
        const { actions } = await listTrustlessActions(d.errandId);
        setActionsByErrand((prev) => ({ ...prev, [d.errandId]: actions }));
      } catch {
        // Non-blocking; chat just renders without system events.
      }
    }
  }

  async function handleResolve(
    dispute: Dispute,
    resolution: "release_to_runner" | "refund_customer",
  ) {
    const noteText = (notes[dispute.id] || "").trim();
    if (!noteText) {
      setError("add resolver notes before settling. they are required.");
      return;
    }
    setLoading(dispute.id + resolution);
    setError(null);
    try {
      const errand = getErrandFor(dispute);
      if (!errand) throw new Error("errand not found for this dispute.");
      if (!errand.escrowContractId)
        throw new Error("escrow contract id is missing.");
      if (!errand.adminWallet)
        throw new Error("resolver wallet is not set for this errand.");

      const connected = wallet.address ?? (await wallet.connect());
      if (connected !== errand.adminWallet) {
        throw new Error(
          `connect the resolver wallet. expected ${shortAddr(errand.adminWallet)}, connected ${shortAddr(connected)}.`,
        );
      }

      const { action } = await prepareTrustlessAction({
        errandId: errand.id,
        type: "resolve_dispute",
        signer: connected,
        disputeId: dispute.id,
        resolution,
      });
      const signedXdr = await wallet.signXdr(action.unsignedTransaction, connected);
      await submitSignedTrustlessAction(action.id, signedXdr);
      await resolveDispute(dispute.id, resolution, connected, noteText);
      refresh(connected);
      setExpanded(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed to resolve dispute.");
    } finally {
      setLoading(null);
    }
  }

  const openDisputes = disputes.filter((d) => d.status === "open");
  const resolvedDisputes = disputes.filter((d) => d.status === "resolved");

  // Metrics
  const metrics = useMemo(() => {
    const total = errands.length;
    const released = errands.filter((e) => e.status === "released");
    const refunded = errands.filter((e) => e.status === "refunded");
    const active = errands.filter(
      (e) => !["released", "refunded"].includes(e.status),
    ).length;
    const disputedCount = errands.filter((e) => e.status === "disputed").length;
    const volume = released.reduce((s, e) => s + e.totalEscrowAmountUSDC, 0);
    const settledTotal = released.length + refunded.length;
    const completionRate =
      settledTotal > 0 ? (released.length / settledTotal) * 100 : 0;
    const disputeRate = total > 0 ? (disputedCount / total) * 100 : 0;

    let avgResolutionMs = 0;
    if (resolvedDisputes.length > 0) {
      const sum = resolvedDisputes.reduce((acc, d) => {
        if (!d.resolvedAt) return acc;
        return (
          acc + (new Date(d.resolvedAt).getTime() - new Date(d.createdAt).getTime())
        );
      }, 0);
      avgResolutionMs = sum / resolvedDisputes.length;
    }
    const avgHours = avgResolutionMs / 3_600_000;

    return {
      volume,
      active,
      completionRate,
      disputeRate,
      avgHours,
    };
  }, [errands, resolvedDisputes]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10">
        {/* Crumb */}
        <div className="mono text-xs uppercase tracking-[0.08em] flex items-center gap-3 pb-6 hairline-b">
          <span style={{ color: "var(--color-text-3)" }}>resolver</span>
          {wallet.address && (
            <>
              <span style={{ color: "var(--color-text-4)" }}>·</span>
              <span style={{ color: "var(--color-text-2)" }}>
                {shortAddr(wallet.address)}
              </span>
            </>
          )}
        </div>

        {/* Tabs */}
        <nav className="flex items-center gap-6 mt-5">
          {TABS.map((t) => {
            const active = tab === t.key;
            const count =
              t.key === "disputes"
                ? openDisputes.length
                : t.key === "escrows"
                  ? errands.length
                  : 0;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className="mono text-xs uppercase tracking-[0.08em] press flex items-baseline gap-2"
                style={{
                  color: active ? "var(--color-text)" : "var(--color-text-3)",
                  borderBottom: active
                    ? "1px solid var(--color-signal)"
                    : "1px solid transparent",
                  paddingBottom: 4,
                }}
              >
                {t.label}
                {(t.key === "disputes" || t.key === "escrows") && count > 0 && (
                  <span
                    className="mono text-[0.625rem]"
                    style={{ color: "var(--color-text-4)" }}
                  >
                    {String(count).padStart(2, "0")}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {!wallet.address && (
          <div
            className="mt-8 hairline px-5 py-4 flex items-center justify-between gap-4"
            style={{ background: "var(--color-bg-2)" }}
          >
            <p className="text-sm" style={{ color: "var(--color-text-2)" }}>
              connect the resolver wallet to view dispute data.
            </p>
            <Button variant="primary" onClick={() => void connectResolver()}>
              connect
            </Button>
          </div>
        )}

        {error && (
          <div
            className="mt-6 px-4 py-3 mono text-xs hairline"
            style={{
              borderColor: "var(--color-risk)",
              color: "var(--color-risk)",
            }}
          >
            {error}
          </div>
        )}

        {/* ── DISPUTES ── */}
        {tab === "disputes" && (
          <section className="mt-8">
            {openDisputes.length === 0 ? (
              <div className="py-12">
                <p
                  className="text-base"
                  style={{ color: "var(--color-text-2)" }}
                >
                  all clear. no open disputes.
                </p>
              </div>
            ) : (
              <ul className="hairline-t">
                {openDisputes.map((d) => {
                  const errand = getErrandFor(d);
                  if (!errand) return null;
                  const isOpen = expanded === d.id;
                  return (
                    <li key={d.id} className="hairline-b">
                      <button
                        type="button"
                        onClick={() => void expandDispute(d)}
                        className="w-full text-left row-hover px-4 sm:px-6 py-4 grid grid-cols-[1fr_auto_auto] gap-4 items-baseline"
                        aria-expanded={isOpen}
                      >
                        <div className="min-w-0">
                          <p
                            className="mono text-[0.625rem] uppercase tracking-[0.08em] mb-1"
                            style={{ color: "var(--color-text-3)" }}
                          >
                            opened by {d.openedBy === "runner" ? "padi" : "customer"}{" "}
                            · {formatDate(d.createdAt)}
                          </p>
                          <p
                            className="text-base truncate"
                            style={{ color: "var(--color-text)", fontWeight: 600 }}
                          >
                            {errand.title}
                          </p>
                        </div>
                        <span
                          className="mono"
                          style={{
                            color: "var(--color-signal)",
                            fontSize: "1.125rem",
                          }}
                        >
                          <MoneyInline
                            amount={errand.totalEscrowAmountUSDC}
                            tone="signal"
                          />
                        </span>
                        <span
                          className="mono text-xs uppercase tracking-[0.08em]"
                          style={{ color: "var(--color-text-3)" }}
                        >
                          {isOpen ? "hide ↑" : "review ↓"}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="px-4 sm:px-6 pb-6 motion-fade-up grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 lg:gap-10">
                          <div>
                            <div
                              className="hairline px-4 py-3"
                              style={{ borderColor: "var(--color-risk)" }}
                            >
                              <p
                                className="eyebrow mb-1"
                                style={{ color: "var(--color-risk)" }}
                              >
                                claim
                              </p>
                              <p
                                className="text-sm leading-snug"
                                style={{ color: "var(--color-text)" }}
                              >
                                “{d.reason}”
                              </p>
                              {d.evidenceUrl && (
                                <a
                                  href={d.evidenceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mono text-xs break-all mt-2 inline-block underline underline-offset-2"
                                  style={{ color: "var(--color-risk)" }}
                                >
                                  evidence · {d.evidenceUrl}
                                </a>
                              )}
                            </div>

                            {errand.proofNote && (
                              <div
                                className="hairline px-4 py-3 mt-3"
                                style={{ background: "var(--color-bg-2)" }}
                              >
                                <p className="eyebrow mb-1">padi proof</p>
                                <p
                                  className="text-sm leading-snug"
                                  style={{ color: "var(--color-text)" }}
                                >
                                  “{errand.proofNote}”
                                </p>
                                {errand.proofUrl && (
                                  <a
                                    href={errand.proofUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mono text-xs break-all mt-2 inline-block underline underline-offset-2"
                                    style={{ color: "var(--color-text-2)" }}
                                  >
                                    evidence · {errand.proofUrl}
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Live chat transcript between customer and padi.
                                Resolver gets access automatically once a
                                dispute is open. */}
                            <div className="mt-5">
                              <ChatPanel
                                errand={errand}
                                connectedWallet={wallet.address}
                                actions={actionsByErrand[errand.id] ?? []}
                                dispute={d}
                              />
                            </div>

                            <label
                              className="block eyebrow mt-5 mb-2"
                              style={{ color: "var(--color-text-3)" }}
                            >
                              resolver notes · required
                            </label>
                            <textarea
                              rows={3}
                              value={notes[d.id] || ""}
                              onChange={(e) =>
                                setNotes((n) => ({ ...n, [d.id]: e.target.value }))
                              }
                              placeholder="why this decision settles the matter…"
                              className="w-full bg-transparent hairline-b py-2 outline-none text-sm resize-none"
                              style={{
                                borderColor: "var(--color-rule-strong)",
                                color: "var(--color-text)",
                              }}
                            />

                            <div className="mt-5 flex flex-wrap gap-3">
                              <Button
                                variant="primary"
                                onClick={() =>
                                  handleResolve(d, "release_to_runner")
                                }
                                loading={
                                  loading === d.id + "release_to_runner"
                                }
                                disabled={!!loading}
                              >
                                release to padi
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={() =>
                                  handleResolve(d, "refund_customer")
                                }
                                loading={loading === d.id + "refund_customer"}
                                disabled={!!loading}
                              >
                                refund customer
                              </Button>
                              <Link
                                href={`/errands/${errand.id}`}
                                className="mono text-xs uppercase tracking-[0.08em] underline underline-offset-2 press self-center"
                                style={{ color: "var(--color-text-3)" }}
                              >
                                view errand →
                              </Link>
                            </div>
                          </div>

                          <aside>
                            <p className="eyebrow mb-2">at stake</p>
                            <MoneyDisplay
                              amount={errand.totalEscrowAmountUSDC}
                              size="lg"
                              tone="signal"
                            />
                            <dl className="mt-4 grid grid-cols-[1fr_auto] gap-y-2 text-xs hairline-t pt-3">
                              <dt
                                className="mono uppercase tracking-[0.06em]"
                                style={{ color: "var(--color-text-3)" }}
                              >
                                item budget
                              </dt>
                              <dd className="mono text-right">
                                <MoneyInline
                                  amount={errand.itemBudgetUSDC}
                                  tone="muted"
                                />
                              </dd>
                              <dt
                                className="mono uppercase tracking-[0.06em]"
                                style={{ color: "var(--color-text-3)" }}
                              >
                                padi fee
                              </dt>
                              <dd className="mono text-right">
                                <MoneyInline
                                  amount={errand.runnerFeeUSDC}
                                  tone="signal"
                                />
                              </dd>
                            </dl>
                            <div className="mt-4 hairline-t pt-3 space-y-1">
                              <p
                                className="mono text-xs break-all"
                                style={{ color: "var(--color-text-2)" }}
                              >
                                cust {shortAddr(errand.customerWallet)}
                              </p>
                              <p
                                className="mono text-xs break-all"
                                style={{ color: "var(--color-text-2)" }}
                              >
                                padi{" "}
                                {errand.runnerWallet
                                  ? shortAddr(errand.runnerWallet)
                                  : "—"}
                              </p>
                              {errand.escrowContractId && (
                                <p
                                  className="mono text-xs break-all pt-1"
                                  style={{ color: "var(--color-text-3)" }}
                                >
                                  contract {shortAddr(errand.escrowContractId)}
                                </p>
                              )}
                            </div>
                          </aside>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {resolvedDisputes.length > 0 && (
              <div className="mt-12">
                <p
                  className="eyebrow mb-4"
                  style={{ color: "var(--color-text-4)" }}
                >
                  resolved · {String(resolvedDisputes.length).padStart(2, "0")}
                </p>
                <ul className="hairline-t" style={{ opacity: 0.6 }}>
                  {resolvedDisputes.map((d) => {
                    const errand = getErrandFor(d);
                    return (
                      <li
                        key={d.id}
                        className="grid grid-cols-[1fr_auto] gap-4 items-baseline px-4 sm:px-6 py-3 hairline-b"
                      >
                        <div className="min-w-0">
                          <p
                            className="text-sm truncate"
                            style={{ color: "var(--color-text-2)" }}
                          >
                            {errand?.title ?? "unknown errand"}
                          </p>
                          <p
                            className="mono text-[0.625rem] mt-0.5"
                            style={{ color: "var(--color-text-4)" }}
                          >
                            {d.resolvedAt
                              ? `resolved ${formatDate(d.resolvedAt)}`
                              : ""}
                          </p>
                        </div>
                        <span
                          className="mono text-[0.625rem] uppercase tracking-[0.08em]"
                          style={{
                            color:
                              d.resolution === "release_to_runner"
                                ? "var(--color-ok)"
                                : "var(--color-text-3)",
                          }}
                        >
                          {d.resolution === "release_to_runner"
                            ? "released"
                            : "refunded"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* ── ESCROWS ── */}
        {tab === "escrows" && (
          <section className="mt-8 hairline-t">
            {errands.length === 0 ? (
              <p className="py-10 text-sm" style={{ color: "var(--color-text-3)" }}>
                no errands yet.
              </p>
            ) : (
              <ul>
                {errands.map((e, i) => (
                  <li key={e.id} className="hairline-b row-hover">
                    <Link
                      href={`/errands/${e.id}`}
                      className="grid grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)_auto_auto] gap-x-4 items-baseline px-4 sm:px-6 py-3"
                    >
                      <span
                        className="mono text-xs"
                        style={{ color: "var(--color-text-4)" }}
                      >
                        {String(i + 1).padStart(3, "0")}
                      </span>
                      <div className="min-w-0">
                        <p
                          className="text-sm truncate"
                          style={{ color: "var(--color-text)" }}
                        >
                          {e.title}
                        </p>
                        <p
                          className="mono text-[0.625rem] truncate"
                          style={{ color: "var(--color-text-3)" }}
                        >
                          {e.escrowContractId
                            ? shortAddr(e.escrowContractId)
                            : "no contract"}{" "}
                          · cust {shortAddr(e.customerWallet)}
                        </p>
                      </div>
                      <span
                        className="mono text-xs hidden sm:inline"
                        style={{ color: "var(--color-text-3)" }}
                      >
                        {e.runnerWallet ? shortAddr(e.runnerWallet) : "—"}
                      </span>
                      <span className="mono text-sm">
                        <MoneyInline
                          amount={e.totalEscrowAmountUSDC}
                          tone="default"
                        />
                      </span>
                      <StatusBadge status={e.status} size="sm" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* ── METRICS ── */}
        {tab === "metrics" && (
          <section className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px hairline-t hairline-b" style={{ background: "var(--color-rule)" }}>
            <MetricCell
              label="total volume"
              value={
                <MoneyDisplay
                  amount={metrics.volume}
                  size="lg"
                  tone="default"
                />
              }
              note="cumulative released usdc"
            />
            <MetricCell
              label="active errands"
              value={
                <span
                  className="display"
                  style={{
                    fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
                    fontWeight: 900,
                    color: "var(--color-text)",
                    lineHeight: 0.9,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {metrics.active.toString().padStart(2, "0")}
                </span>
              }
              note="not yet released or refunded"
            />
            <MetricCell
              label="completion rate"
              value={
                <span
                  className="display"
                  style={{
                    fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
                    fontWeight: 900,
                    color: "var(--color-ok)",
                    lineHeight: 0.9,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {metrics.completionRate.toFixed(0)}
                  <span
                    className="mono"
                    style={{
                      color: "var(--color-text-3)",
                      fontSize: "0.875rem",
                      marginLeft: "0.25rem",
                    }}
                  >
                    %
                  </span>
                </span>
              }
              note="released ÷ released + refunded"
            />
            <MetricCell
              label="dispute rate"
              value={
                <span
                  className="display"
                  style={{
                    fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
                    fontWeight: 900,
                    color:
                      metrics.disputeRate > 5
                        ? "var(--color-risk)"
                        : "var(--color-text)",
                    lineHeight: 0.9,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {metrics.disputeRate.toFixed(1)}
                  <span
                    className="mono"
                    style={{
                      color: "var(--color-text-3)",
                      fontSize: "0.875rem",
                      marginLeft: "0.25rem",
                    }}
                  >
                    %
                  </span>
                </span>
              }
              note="disputed ÷ all errands"
            />
            <MetricCell
              label="avg resolution"
              value={
                <span
                  className="display"
                  style={{
                    fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
                    fontWeight: 900,
                    color: "var(--color-text)",
                    lineHeight: 0.9,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {metrics.avgHours > 0 ? metrics.avgHours.toFixed(1) : "—"}
                  <span
                    className="mono"
                    style={{
                      color: "var(--color-text-3)",
                      fontSize: "0.875rem",
                      marginLeft: "0.25rem",
                    }}
                  >
                    h
                  </span>
                </span>
              }
              note="mean across resolved disputes"
            />
            <MetricCell
              label="errands posted"
              value={
                <span
                  className="display"
                  style={{
                    fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
                    fontWeight: 900,
                    color: "var(--color-text)",
                    lineHeight: 0.9,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {errands.length.toString().padStart(2, "0")}
                </span>
              }
              note="lifetime"
            />
          </section>
        )}
      </main>
    </div>
  );
}

function MetricCell({
  label,
  value,
  note,
}: {
  label: string;
  value: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="px-5 py-6" style={{ background: "var(--color-bg)" }}>
      <p className="eyebrow mb-3">{label}</p>
      <div>{value}</div>
      {note && (
        <p
          className="mono text-[0.625rem] mt-3 leading-relaxed"
          style={{ color: "var(--color-text-4)" }}
        >
          {note}
        </p>
      )}
    </div>
  );
}

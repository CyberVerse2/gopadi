"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Button from "../../components/Button";
import { MoneyDisplay, MoneyInline } from "../../components/MoneyDisplay";
import { useWallet } from "../../components/WalletProvider";
import {
  createFundedErrand,
  getWalletUsdcBalance,
  type FundedErrandInput,
} from "../../lib/api-client";

const DRAFT_KEY = "gopadi:pending-funded-errand";
const SELECTED_PADI_WALLET =
  "GACZQ7MEBB6YSA32CPTHKIYLKCU5KAHHUIDMHQBZNEBPLUTXTVEUKMSN";

type Readiness = "idle" | "checking" | "ready" | "blocked";
type FlowStage =
  | "loading"
  | "checking"
  | "searching"
  | "selected"
  | "blocked"
  | "ready"
  | "deploying"
  | "funding"
  | "saving"
  | "created";

type PendingDraft = {
  errand: FundedErrandInput;
  review: {
    title: string;
    route: string;
    itemBudgetUSDC: number;
    runnerFeeUSDC: number;
    totalUSDC: number;
    deadline: string;
  };
};

type BalanceCheck = {
  balanceUSDC: number;
  hasTrustline: boolean;
};

const CANDIDATE = {
  name: "Chinedu",
  rating: "4.8",
  completed: 23,
  distance: "1.4km",
  eta: "12 min",
  wallet: SELECTED_PADI_WALLET,
};

function shortAddr(value: string) {
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function formatDeadline(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusLabel(stage: FlowStage) {
  switch (stage) {
    case "loading":
      return "loading errand";
    case "checking":
      return "checking wallets";
    case "searching":
      return "finding Padis";
    case "selected":
      return "Padi selected";
    case "blocked":
      return "receiver blocked";
    case "ready":
      return "escrow ready";
    case "deploying":
      return "sign escrow deploy";
    case "funding":
      return "sign escrow funding";
    case "saving":
      return "saving funded errand";
    case "created":
      return "errand posted";
  }
}

function checkTone(readiness: Readiness) {
  if (readiness === "ready") return "var(--color-ok)";
  if (readiness === "blocked") return "var(--color-risk)";
  if (readiness === "checking") return "var(--color-signal)";
  return "var(--color-text-4)";
}

export default function MatchingPage() {
  const router = useRouter();
  const wallet = useWallet();

  const [draft, setDraft] = useState<PendingDraft | null>(null);
  const [stage, setStage] = useState<FlowStage>("loading");
  const [customerCheck, setCustomerCheck] = useState<BalanceCheck | null>(null);
  const [padiCheck, setPadiCheck] = useState<BalanceCheck | null>(null);
  const [customerReadiness, setCustomerReadiness] = useState<Readiness>("idle");
  const [padiReadiness, setPadiReadiness] = useState<Readiness>("idle");
  const [error, setError] = useState<string | null>(null);
  const [deploySignedXdr, setDeploySignedXdr] = useState<string | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const raw = window.sessionStorage.getItem(DRAFT_KEY);
      if (!raw) {
        router.replace("/post-errand");
        return;
      }
      try {
        setDraft(JSON.parse(raw) as PendingDraft);
        setStage("checking");
      } catch {
        window.sessionStorage.removeItem(DRAFT_KEY);
        router.replace("/post-errand");
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, [router]);

  const readinessRows = useMemo<Array<{ label: string; readiness: Readiness; body: string }>>(
    () => [
      {
        label: "customer USDC",
        readiness: customerReadiness,
        body: customerCheck
          ? `${customerCheck.balanceUSDC.toFixed(2)} USDC · ${
              customerCheck.hasTrustline ? "trustline ready" : "missing trustline"
            }`
          : "waiting for wallet check",
      },
      {
        label: "selected Padi receiver",
        readiness: padiReadiness,
        body: padiCheck
          ? `${shortAddr(CANDIDATE.wallet)} · ${
              padiCheck.hasTrustline ? "can receive USDC" : "missing USDC trustline"
            }`
          : `${shortAddr(CANDIDATE.wallet)} · not checked yet`,
      },
      {
        label: "escrow listing rule",
        readiness:
          stage === "ready" ||
          stage === "deploying" ||
          stage === "funding" ||
          stage === "saving" ||
          stage === "created"
            ? "ready"
            : stage === "blocked"
              ? "blocked"
              : "idle",
        body: "errand is saved only after deploy and fund signatures submit",
      },
    ],
    [customerCheck, customerReadiness, padiCheck, padiReadiness, stage],
  );

  const runReadiness = useCallback(async () => {
    if (!draft) return;
    setError(null);
    setStage("checking");
    setCustomerReadiness("checking");
    setPadiReadiness("idle");
    try {
      const customerWallet = wallet.address ?? (await wallet.connect());
      const customer = await getWalletUsdcBalance(customerWallet);
      setCustomerCheck(customer);

      if (!customer.hasTrustline) {
        setCustomerReadiness("blocked");
        setStage("blocked");
        setError("Your wallet needs the testnet USDC trustline before posting.");
        return;
      }
      if (customer.balanceUSDC < draft.review.totalUSDC) {
        setCustomerReadiness("blocked");
        setStage("blocked");
        setError(
          `This errand needs ${draft.review.totalUSDC.toFixed(2)} USDC. Your wallet has ${customer.balanceUSDC.toFixed(2)} USDC.`,
        );
        return;
      }
      setCustomerReadiness("ready");
      setStage("searching");

      window.setTimeout(async () => {
        setStage("selected");
        setPadiReadiness("checking");
        try {
          const padi = await getWalletUsdcBalance(CANDIDATE.wallet);
          setPadiCheck(padi);
          if (!padi.hasTrustline) {
            setPadiReadiness("blocked");
            setStage("blocked");
            setError(
              `Selected Padi ${shortAddr(CANDIDATE.wallet)} cannot receive USDC yet. Add the USDC asset to that wallet, then retry receiver check.`,
            );
            return;
          }
          setPadiReadiness("ready");
          setStage("ready");
        } catch (e) {
          setPadiReadiness("blocked");
          setStage("blocked");
          setError(e instanceof Error ? e.message : "Could not verify selected Padi receiver.");
        }
      }, 900);
    } catch (e) {
      setCustomerReadiness("blocked");
      setStage("blocked");
      setError(e instanceof Error ? e.message : "Could not check wallet readiness.");
    }
  }, [draft, wallet]);

  useEffect(() => {
    if (!draft || stage !== "checking") return;
    const t = window.setTimeout(() => {
      void runReadiness();
    }, 0);
    return () => window.clearTimeout(t);
  }, [draft, runReadiness, stage]);

  async function handleDeploy() {
    if (!draft) return;
    setError(null);
    setStage("deploying");
    try {
      const deploy = await createFundedErrand({ errand: draft.errand });
      if (deploy.step !== "sign_deploy") {
        throw new Error("Trustless Work did not return an escrow deploy transaction.");
      }
      const signed = await wallet.signXdr(
        deploy.unsignedTransaction,
        draft.errand.customerWallet,
      );
      setDeploySignedXdr(signed);

      setStage("funding");
      const fund = await createFundedErrand({
        errand: draft.errand,
        deploySignedXdr: signed,
      });
      if (fund.step !== "sign_fund") {
        throw new Error("Trustless Work did not return an escrow funding transaction.");
      }
      setContractId(fund.contractId);
      const fundSignedXdr = await wallet.signXdr(
        fund.unsignedTransaction,
        draft.errand.customerWallet,
      );

      setStage("saving");
      const created = await createFundedErrand({
        errand: draft.errand,
        deploySignedXdr: signed,
        fundSignedXdr,
        preparedContractId: fund.contractId,
        deployTransactionHash: fund.deployTransactionHash,
      });
      if (created.step !== "created") {
        throw new Error("Errand was funded, but the listing was not created.");
      }
      window.sessionStorage.removeItem(DRAFT_KEY);
      setStage("created");
      router.push(`/errands/${created.errand.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not fund escrow.");
      setStage(contractId || deploySignedXdr ? "funding" : "ready");
    }
  }

  const primaryDisabled =
    stage === "loading" ||
    stage === "checking" ||
    stage === "searching" ||
    stage === "selected" ||
    stage === "deploying" ||
    stage === "funding" ||
    stage === "saving";

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 w-full">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-8 lg:px-10 py-8 lg:py-12 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.1fr_0.85fr] gap-8 lg:gap-10 items-start">
            <section className="lg:sticky lg:top-24">
              <p className="eyebrow mb-4">Padi matching</p>
              <h1
                style={{
                  color: "var(--color-text)",
                  fontWeight: 900,
                  fontSize: "2.75rem",
                  lineHeight: 0.95,
                  letterSpacing: 0,
                  maxWidth: "9ch",
                }}
              >
                Finding a Padi near you
              </h1>
              <p
                className="mt-5 text-sm leading-relaxed max-w-[44ch]"
                style={{ color: "var(--color-text-2)" }}
              >
                We check available Padis, receiver readiness, and escrow setup before your errand is listed.
              </p>

              {draft && (
                <div className="mt-8 hairline-t pt-6">
                  <p className="eyebrow mb-2">total to lock</p>
                  <MoneyDisplay amount={draft.review.totalUSDC} size="lg" tone="default" />
                  <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 text-sm">
                    <dt className="eyebrow">route</dt>
                    <dd style={{ color: "var(--color-text)" }}>{draft.review.route}</dd>
                    <dt className="eyebrow">items</dt>
                    <dd>
                      <MoneyInline amount={draft.review.itemBudgetUSDC} tone="default" />
                    </dd>
                    <dt className="eyebrow">Padi fee</dt>
                    <dd>
                      <MoneyInline amount={draft.review.runnerFeeUSDC} tone="signal" />
                    </dd>
                    <dt className="eyebrow">deadline</dt>
                    <dd className="mono text-xs" style={{ color: "var(--color-text)" }}>
                      {formatDeadline(draft.review.deadline)}
                    </dd>
                  </dl>
                </div>
              )}
            </section>

            <section>
              <div
                className="hairline p-5 sm:p-6"
                style={{
                  background: "var(--color-bg-2)",
                  borderRadius: 8,
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="eyebrow">live search</p>
                  <span
                    className="mono text-[0.625rem] uppercase tracking-[0.08em]"
                    style={{ color: "var(--color-signal)" }}
                  >
                    {statusLabel(stage)}
                  </span>
                </div>

                <ol className="mt-7 space-y-0">
                  {[
                    {
                      key: "checked",
                      label: "Errand checked",
                      body: draft?.review.title ?? "loading draft",
                      active: stage === "checking",
                      done: stage !== "loading",
                    },
                    {
                      key: "search",
                      label: "Searching nearby Padis",
                      body: "Scanning route, fee, distance, and completion history.",
                      active: stage === "searching",
                      done: !["loading", "checking", "searching"].includes(stage),
                    },
                    {
                      key: "selected",
                      label: "Best Padi selected",
                      body: `${CANDIDATE.name} · ${CANDIDATE.rating} rating · ${CANDIDATE.completed} errands`,
                      active: stage === "selected",
                      done: !["loading", "checking", "searching", "selected"].includes(stage),
                    },
                    {
                      key: "receiver",
                      label: "USDC receiver check",
                      body:
                        padiReadiness === "blocked"
                          ? "Selected Padi must add USDC before escrow can deploy."
                          : `Receiver ${shortAddr(CANDIDATE.wallet)}`,
                      active: padiReadiness === "checking",
                      done: padiReadiness === "ready",
                      blocked: padiReadiness === "blocked",
                    },
                    {
                      key: "escrow",
                      label: "Escrow ready",
                      body: "Trustless Work deploy and funding signatures come next.",
                      active: stage === "ready",
                      done: ["deploying", "funding", "saving", "created"].includes(stage),
                    },
                    {
                      key: "fund",
                      label: "Lock funds",
                      body: "The errand is saved only after escrow funding succeeds.",
                      active: ["deploying", "funding", "saving"].includes(stage),
                      done: stage === "created",
                    },
                  ].map((item, i, arr) => (
                    <li
                      key={item.key}
                      className="relative grid grid-cols-[18px_1fr] gap-x-4"
                      style={{ minHeight: 76 }}
                    >
                      {i < arr.length - 1 && (
                        <span
                          aria-hidden
                          className="absolute"
                          style={{
                            left: 8,
                            top: 18,
                            bottom: -2,
                            width: 1,
                            background: item.done ? "var(--color-text)" : "var(--color-rule)",
                          }}
                        />
                      )}
                      <span
                        aria-hidden
                        className="relative rounded-full mt-1"
                        style={{
                          width: 18,
                          height: 18,
                          background: item.blocked
                            ? "var(--color-risk)"
                            : item.active
                              ? "var(--color-signal)"
                              : item.done
                                ? "var(--color-text)"
                                : "var(--color-bg)",
                          border: `1px solid ${
                            item.blocked
                              ? "var(--color-risk)"
                              : item.active
                                ? "var(--color-signal)"
                                : item.done
                                  ? "var(--color-text)"
                                  : "var(--color-rule-strong)"
                          }`,
                          animation: item.active
                            ? "signal-pulse 1800ms var(--ease-out-quint) infinite"
                            : undefined,
                        }}
                      />
                      <div className="pb-5">
                        <p
                          className="mono uppercase text-xs tracking-[0.08em] leading-tight"
                          style={{
                            color: item.blocked
                              ? "var(--color-risk)"
                              : item.done || item.active
                                ? "var(--color-text)"
                                : "var(--color-text-3)",
                            fontWeight: item.active ? 800 : 600,
                          }}
                        >
                          {item.label}
                        </p>
                        <p className="text-sm leading-relaxed mt-1" style={{ color: "var(--color-text-3)" }}>
                          {item.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {error && (
                <div
                  className="mt-5 hairline p-4"
                  style={{
                    borderColor: "var(--color-risk)",
                    background: "var(--color-risk-soft)",
                    borderRadius: 8,
                  }}
                >
                  <p className="mono text-xs uppercase tracking-[0.08em]" style={{ color: "var(--color-risk)" }}>
                    escrow readiness blocked
                  </p>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text)" }}>
                    {error}
                  </p>
                </div>
              )}
            </section>

            <aside className="lg:sticky lg:top-24">
              <div className="hairline p-5" style={{ borderRadius: 8 }}>
                <p className="eyebrow mb-4">selected Padi</p>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p style={{ color: "var(--color-text)", fontWeight: 800, fontSize: "1.5rem" }}>
                      {CANDIDATE.name}
                    </p>
                    <p className="mono text-xs mt-1" style={{ color: "var(--color-text-3)" }}>
                      {shortAddr(CANDIDATE.wallet)}
                    </p>
                  </div>
                  <span
                    className="mono text-xs px-2 py-1"
                    style={{
                      color: "var(--color-signal-ink)",
                      background: "var(--color-signal)",
                      borderRadius: 999,
                    }}
                  >
                    {CANDIDATE.eta}
                  </span>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {([
                    ["rating", CANDIDATE.rating],
                    ["done", String(CANDIDATE.completed)],
                    ["away", CANDIDATE.distance],
                  ] as Array<[string, string]>).map(([label, value]) => (
                    <div key={label}>
                      <p className="mono text-[0.625rem] uppercase tracking-[0.08em]" style={{ color: "var(--color-text-4)" }}>
                        {label}
                      </p>
                      <p className="mono text-sm mt-1" style={{ color: "var(--color-text)" }}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 hairline p-5" style={{ borderRadius: 8 }}>
                <p className="eyebrow mb-4">escrow readiness</p>
                <ol className="space-y-4">
                  {readinessRows.map((row) => (
                    <li key={row.label} className="grid grid-cols-[10px_1fr] gap-x-3">
                      <span
                        aria-hidden
                        className="rounded-full mt-1"
                        style={{
                          width: 10,
                          height: 10,
                          background: checkTone(row.readiness),
                        }}
                      />
                      <div>
                        <p className="mono text-[0.6875rem] uppercase tracking-[0.08em]" style={{ color: "var(--color-text)" }}>
                          {row.label}
                        </p>
                        <p className="text-xs leading-relaxed mt-1" style={{ color: "var(--color-text-3)" }}>
                          {row.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </aside>
          </div>
        </div>

        <div
          className="sticky bottom-0 hairline-t"
          style={{
            background: "color-mix(in oklab, var(--color-bg) 92%, transparent)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <div className="mx-auto max-w-[1180px] px-4 sm:px-8 lg:px-10 py-4 flex items-center gap-3">
            <Link href="/post-errand">
              <Button type="button" variant="ghost" disabled={primaryDisabled}>
                edit errand
              </Button>
            </Link>
            <div className="flex-1" />
            {stage === "blocked" ? (
              <Button type="button" variant="secondary" onClick={runReadiness}>
                retry receiver check
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={handleDeploy}
                loading={["deploying", "funding", "saving"].includes(stage)}
                disabled={stage !== "ready"}
              >
                sign escrow
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

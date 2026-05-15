"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import StatusBadge from "../../components/StatusBadge";
import StepIndicator from "../../components/StepIndicator";
import { MoneyDisplay, MoneyInline } from "../../components/MoneyDisplay";
import Button from "../../components/Button";
import ChatDrawer from "../../components/ChatDrawer";
import { useErrandChat } from "../../components/useErrandChat";
import { useWallet } from "../../components/WalletProvider";
import { Errand, Dispute, TrustlessAction } from "../../types";
import {
  acceptErrand,
  getErrand,
  listTrustlessActions,
  openDispute,
  prepareTrustlessAction,
  submitSignedTrustlessAction,
  uploadProof,
} from "../../lib/api-client";
import { CATEGORY_LABELS } from "../../lib/store";

const PLATFORM_FEE_PERCENT = Number.parseFloat(
  process.env.NEXT_PUBLIC_GOPADI_PLATFORM_FEE_PERCENT ?? "5",
);
const TRUSTLESS_WORK_FEE_PERCENT = 0.3;

const DISPUTE_REASONS = [
  {
    code: "delivered_not_confirmed",
    label: "Delivered but not confirmed",
    fast: true,
  },
  {
    code: "funded_not_started",
    label: "Funded but Padi did not start",
    fast: true,
  },
  {
    code: "items_not_delivered",
    label: "Items not delivered",
    fast: false,
  },
  {
    code: "wrong_items",
    label: "Wrong or substituted items",
    fast: false,
  },
  {
    code: "proof_rejected",
    label: "Proof rejected",
    fast: false,
  },
  {
    code: "price_budget",
    label: "Price or budget dispute",
    fast: false,
  },
  {
    code: "unsafe_or_scam",
    label: "Suspected scam or unsafe behavior",
    fast: false,
  },
] as const;

function shortAddr(value: string) {
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function shortErrandId(id: string) {
  const cleaned = id.replace(/[^a-zA-Z0-9]/g, "").slice(-6);
  return (cleaned || id.slice(-6)).toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatRelative(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

function formatDeadline(iso: string) {
  const d = new Date(iso);
  const diffMs = d.getTime() - Date.now();
  if (diffMs < 0) return "deadline passed";
  const h = Math.floor(diffMs / 3_600_000);
  const m = Math.floor((diffMs % 3_600_000) / 60_000);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h left`;
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

function stellarExpertTxUrl(hash: string) {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}

function stellarExpertContractUrl(contractId: string) {
  return `https://stellar.expert/explorer/testnet/contract/${contractId}`;
}

function trustlessWorkViewerUrl(contractId?: string) {
  const base = "https://viewer.trustlesswork.com";
  return contractId ? `${base}/${encodeURIComponent(contractId)}` : base;
}

function parseRoute(location: string): { from: string; to: string } | null {
  for (const sep of [" → ", " -> ", "→", "->"]) {
    if (location.includes(sep)) {
      const [from, to] = location.split(sep);
      if (from && to) return { from: from.trim(), to: to.trim() };
    }
  }
  return null;
}

function mapEmbedUrl(location: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(location)}&output=embed`;
}

function mapOpenUrl(location: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

type ViewerRole = "customer" | "padi" | "resolver" | "observer";

function getViewerRole(errand: Errand, connectedWallet: string | null): ViewerRole {
  if (!connectedWallet) return "observer";
  if (connectedWallet === errand.customerWallet) return "customer";
  if (connectedWallet === errand.runnerWallet) return "padi";
  if (connectedWallet === errand.adminWallet) return "resolver";
  return "observer";
}

function actionLabel(type: TrustlessAction["type"]) {
  return type.replace(/_/g, " ");
}

const STATUS_TIMELINE: Array<{
  key: string;
  label: string;
  statuses: Errand["status"][];
  action?: TrustlessAction["type"];
  receipts?: TrustlessAction["type"][];
}> = [
  { key: "posted", label: "Posted", statuses: ["posted"] },
  {
    key: "accepted",
    label: "Accepted by Padi",
    statuses: ["accepted"],
    receipts: ["initialize_escrow"],
  },
  {
    key: "funded",
    label: "Escrow Funded",
    statuses: ["escrow_created", "escrow_funded"],
    action: "fund_escrow",
    receipts: ["fund_escrow"],
  },
  {
    key: "shopping",
    label: "Shopping Started",
    statuses: ["in_progress"],
    action: "change_milestone_status",
    receipts: ["change_milestone_status"],
  },
  {
    key: "proof",
    label: "Proof Submitted",
    statuses: ["proof_uploaded"],
    action: "change_milestone_status",
  },
  {
    key: "confirmed",
    label: "Delivery Confirmed",
    statuses: ["completed"],
    action: "approve_milestone",
    receipts: ["approve_milestone"],
  },
  {
    key: "released",
    label: "Payment Released",
    statuses: ["released"],
    action: "release_funds",
    receipts: ["release_funds"],
  },
];

function statusRank(status: Errand["status"]) {
  if (status === "disputed") return 4;
  if (status === "refunded") return STATUS_TIMELINE.length - 1;
  const idx = STATUS_TIMELINE.findIndex((step) => step.statuses.includes(status));
  return Math.max(idx, 0);
}

function submittedAt(actions: TrustlessAction[], type: TrustlessAction["type"]) {
  return actions.find((action) => action.type === type && action.status === "submitted")
    ?.submittedAt;
}

function receiptActionsForStep(
  actions: TrustlessAction[],
  step: (typeof STATUS_TIMELINE)[number],
) {
  if (!step.receipts) return [];
  return actions.filter((action) => step.receipts?.includes(action.type));
}

function statusTimestamp(
  errand: Errand,
  actions: TrustlessAction[],
  key: string,
) {
  if (key === "posted") return errand.createdAt;
  if (key === "accepted" && errand.runnerWallet) {
    return submittedAt(actions, "initialize_escrow") ?? undefined;
  }
  const step = STATUS_TIMELINE.find((s) => s.key === key);
  if (step?.action) return submittedAt(actions, step.action);
  return undefined;
}

function proofRequirements(category: Errand["category"]) {
  const base = [
    "Photo of purchased items",
    "Receipt or price list if available",
    "Photo or video at delivery point",
    "Recipient confirmation in chat",
  ];
  if (category === "delivery") return ["Pickup evidence", "Delivery photo", "Recipient confirmation in chat"];
  if (category === "medicine") return ["Item photo with label visible", "Receipt if available", "Delivery confirmation in chat"];
  return base;
}

export default function ErrandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const wallet = useWallet();

  const [errand, setErrand] = useState<Errand | null>(null);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [actions, setActions] = useState<TrustlessAction[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [proofNote, setProofNote] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [showProofForm, setShowProofForm] = useState(false);

  const [disputeReason, setDisputeReason] = useState("");
  const [disputeReasonCode, setDisputeReasonCode] = useState<string>(DISPUTE_REASONS[0].code);
  const [disputeTrack, setDisputeTrack] = useState<"fast" | "normal">("fast");
  const [disputeEvidenceUrl, setDisputeEvidenceUrl] = useState("");
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  const [mapOpen, setMapOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Chat stays open for pre-acceptance questions; a dispute later adds resolver context.
  const chat = useErrandChat(id, wallet.address, true);

  const refreshActions = useCallback(async () => {
    return listTrustlessActions(id);
  }, [id]);

  useEffect(() => {
    getErrand(id)
      .then(({ errand, dispute }) => {
        setErrand(errand);
        setDispute(dispute);
      })
      .catch(() => router.push("/errands"));
    refreshActions()
      .then(({ actions }) => setActions(actions))
      .catch(() => undefined);
  }, [id, router, refreshActions]);

  async function withLoading(key: string, fn: () => Promise<void>) {
    setLoading(key);
    setError(null);
    setNotice(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "action failed.");
    } finally {
      setLoading(null);
    }
  }

  function handleAccept() {
    void withLoading("accept", async () => {
      const runnerWallet = wallet.address ?? (await wallet.connect());
      const { errand } = await acceptErrand(id, runnerWallet);
      setErrand(errand);
    });
  }

  async function prepareSignSubmit(input: {
    type:
      | "initialize_escrow"
      | "fund_escrow"
      | "change_milestone_status"
      | "approve_milestone"
      | "release_funds"
      | "dispute_escrow";
    signer: string;
    proofNote?: string;
  }) {
    if (!errand) throw new Error("errand is not loaded.");
    const { action } = await prepareTrustlessAction({
      errandId: errand.id,
      type: input.type,
      signer: input.signer,
      proofNote: input.proofNote,
    });
    const signedXdr = await wallet.signXdr(action.unsignedTransaction, input.signer);
    await submitSignedTrustlessAction(action.id, signedXdr);
    const refreshed = await getErrand(id);
    setErrand(refreshed.errand);
    setDispute(refreshed.dispute);
    const actionResult = await refreshActions();
    setActions(actionResult.actions);
    setNotice("signed transaction submitted.");
  }

  async function requireRoleWallet(expectedWallet: string | undefined, role: string) {
    if (!expectedWallet) throw new Error(`${role} wallet is not set yet.`);
    const connected = wallet.address ?? (await wallet.connect());
    if (connected !== expectedWallet) {
      throw new Error(
        `connect the ${role} wallet for this step. expected ${shortAddr(expectedWallet)}, connected ${shortAddr(connected)}.`,
      );
    }
    return connected;
  }

  function handleCreateEscrow() {
    if (!errand) return;
    void withLoading("escrow", async () => {
      const signer = await requireRoleWallet(errand.customerWallet, "customer");
      await prepareSignSubmit({ type: "initialize_escrow", signer });
    });
  }

  function handleFundEscrow() {
    if (!errand) return;
    void withLoading("fund", async () => {
      const signer = await requireRoleWallet(errand.customerWallet, "customer");
      await prepareSignSubmit({ type: "fund_escrow", signer });
    });
  }

  function handleStartProgress() {
    void withLoading("start", async () => {
      const signer = await requireRoleWallet(errand?.runnerWallet, "padi");
      await prepareSignSubmit({
        type: "change_milestone_status",
        signer,
        proofNote: "padi started the errand.",
      });
    });
  }

  function handleUploadProof(e: React.FormEvent) {
    e.preventDefault();
    void withLoading("proof", async () => {
      const signer = await requireRoleWallet(errand?.runnerWallet, "padi");
      const result = await uploadProof(id, proofNote, signer, proofUrl || undefined);
      setErrand(result.errand);
      setProofUrl("");
      setShowProofForm(false);
    });
  }

  function handleConfirmCompletion() {
    if (!errand) return;
    void withLoading("confirm", async () => {
      const signer = await requireRoleWallet(errand.customerWallet, "customer");
      await prepareSignSubmit({ type: "approve_milestone", signer });
    });
  }

  function handleReleaseFunds() {
    if (!errand) return;
    void withLoading("release", async () => {
      const signer = await requireRoleWallet(errand.customerWallet, "customer");
      await prepareSignSubmit({ type: "release_funds", signer });
    });
  }

  function handleOpenDispute(e: React.FormEvent) {
    e.preventDefault();
    if (!errand || !disputeReason) return;
    void withLoading("dispute", async () => {
      const openedBy = viewerRole === "padi" ? "runner" : "customer";
      const expectedWallet =
        openedBy === "runner" ? errand.runnerWallet : errand.customerWallet;
      const signer = await requireRoleWallet(
        expectedWallet,
        openedBy === "runner" ? "padi" : "customer",
      );
      await prepareSignSubmit({ type: "dispute_escrow", signer });
      const result = await openDispute(
        errand.id,
        openedBy,
        {
          reasonCode: disputeReasonCode,
          reason: disputeReason,
          track: disputeTrack,
          evidenceUrl: disputeEvidenceUrl || undefined,
        },
        signer,
      );
      setErrand(result.errand);
      setDispute(result.dispute);
      setDisputeEvidenceUrl("");
      setShowDisputeForm(false);
    });
  }

  const connectedWallet = wallet.address;

  if (!errand) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-end justify-start px-6 py-6">
          <p className="mono text-xs uppercase tracking-[0.08em]" style={{ color: "var(--color-text-3)" }}>
            loading errand…
          </p>
        </div>
      </div>
    );
  }

  const viewerRole = getViewerRole(errand, connectedWallet);
  const isDisputed = errand.status === "disputed";
  const isReleased = errand.status === "released";
  const isRefunded = errand.status === "refunded";
  const isTerminal = isReleased || isRefunded;

  const platformFee = Number.isFinite(PLATFORM_FEE_PERCENT)
    ? (errand.totalEscrowAmountUSDC * PLATFORM_FEE_PERCENT) / 100
    : 0;
  const trustlessFee = (errand.totalEscrowAmountUSDC * TRUSTLESS_WORK_FEE_PERCENT) / 100;
  const estimatedPadiEarnings = Math.max(
    errand.runnerFeeUSDC - platformFee - trustlessFee,
    0,
  );
  const route = parseRoute(errand.location);
  const structuredItems = errand.items ?? [];
  const currentStatusRank = statusRank(errand.status);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-10 py-8 lg:py-12 pb-28 lg:pb-12">
        {/* Back link */}
        <Link
          href="/errands"
          className="mono text-xs uppercase tracking-[0.08em] inline-block mb-8 hover:opacity-70 transition-opacity"
          style={{ color: "var(--color-text-3)" }}
        >
          ← back to errands
        </Link>

        <div className="lg:grid lg:grid-cols-[180px_minmax(0,1fr)_300px] lg:gap-x-8 xl:gap-x-12 lg:items-start">

          {/* LEFT RAIL — vertical timeline (lg+ only, sticky) */}
          <aside className="hidden lg:block min-w-0">
            <div className="sticky top-20 pt-1 min-w-0 overflow-hidden">
              <StatusTimeline
                errand={errand}
                actions={actions}
                currentStatusRank={currentStatusRank}
                isRefunded={isRefunded}
              />
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <div className="min-w-0">
            {/* MASTHEAD */}
            <header className="motion-fade-up">
          <div
            className="mono text-xs uppercase tracking-[0.08em] flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-6"
            style={{ color: "var(--color-text-3)" }}
          >
            <span style={{ color: "var(--color-text-2)" }}>
              № {shortErrandId(errand.id)}
            </span>
            <span style={{ color: "var(--color-text-4)" }}>·</span>
            <span>{CATEGORY_LABELS[errand.category]?.toLowerCase()}</span>
            <span style={{ color: "var(--color-text-4)" }}>·</span>
            <span>posted {formatRelative(errand.createdAt)}</span>
            <span style={{ color: "var(--color-text-4)" }}>·</span>
            <StatusBadge status={errand.status} />
            <button
                type="button"
                onClick={() => setChatOpen(true)}
                aria-label={
                  chat.unread > 0
                    ? `open errand chat (${chat.unread} unread)`
                    : "open errand chat"
                }
                title={
                  chat.unread > 0
                    ? `${chat.unread} unread message${chat.unread === 1 ? "" : "s"}`
                    : "open errand chat"
                }
                className="mono uppercase tracking-[0.08em] inline-flex items-center gap-1.5 ml-auto hairline px-2.5 py-1 press transition-colors"
                style={{
                  color: "var(--color-text)",
                  background: "var(--color-bg-2)",
                  fontSize: "0.6875rem",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-signal)";
                  e.currentTarget.style.color = "var(--color-signal)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "";
                  e.currentTarget.style.color = "var(--color-text)";
                }}
              >
                {/* chat glyph — two stacked hairline rectangles, brutalist */}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  aria-hidden
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                >
                  <rect x="1" y="2" width="8" height="5" />
                  <path d="M3 9 L11 9 L11 5" />
                </svg>
                chat
                {chat.unread > 0 && (
                  <span
                    aria-hidden
                    className="mono inline-flex items-center justify-center"
                    style={{
                      background: "var(--color-signal)",
                      color: "var(--color-signal-ink)",
                      fontSize: "0.5625rem",
                      lineHeight: 1,
                      minWidth: "1rem",
                      height: "1rem",
                      padding: "0 0.25rem",
                      fontWeight: 700,
                      letterSpacing: 0,
                      borderRadius: 0,
                    }}
                  >
                    {chat.unread > 99 ? "99+" : chat.unread}
                  </span>
                )}
            </button>
          </div>

          {/* Mobile compact step indicator */}
          <div className="lg:hidden mb-6">
            <StepIndicator status={errand.status} variant="compact" />
          </div>

          {/* Title */}
              <h1
                style={{
                  color: "var(--color-text)",
                  fontWeight: 800,
                  fontSize: "clamp(2rem, 3.6vw, 3.25rem)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                  maxWidth: "20ch",
                }}
              >
                {errand.title}
              </h1>
              <p
                className="mt-6 max-w-[58ch] leading-relaxed"
                style={{ color: "var(--color-text-2)", fontSize: "1rem" }}
              >
                {errand.description}
              </p>

              {structuredItems.length > 0 ? (
                <div className="mt-8 hairline-t pt-6">
                  <p className="eyebrow mb-3">
                    items · {structuredItems.length}
                  </p>
                  <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                    {structuredItems.map((it, i) => (
                      <li
                        key={i}
                        className="grid grid-cols-[1.75rem_1fr] gap-x-2 items-baseline py-3 hairline-b"
                      >
                        <span
                          className="mono text-xs"
                          style={{ color: "var(--color-text-4)" }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <p
                            className="text-sm leading-snug"
                            style={{ color: "var(--color-text)" }}
                          >
                            {it.name}
                            {it.quantity && (
                              <span
                                className="mono text-xs ml-2"
                                style={{ color: "var(--color-text-3)" }}
                              >
                                {it.quantity}
                              </span>
                            )}
                          </p>
                          {it.notes && (
                            <p
                              className="text-xs mt-1 leading-snug"
                              style={{ color: "var(--color-text-3)" }}
                            >
                              {it.notes}
                            </p>
                          )}
                          {it.substitutions.length > 0 && (
                            <p
                              className="mono text-[0.625rem] mt-1 uppercase tracking-[0.06em]"
                              style={{ color: "var(--color-text-3)" }}
                            >
                              alt · {it.substitutions.join(" · ")}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : (
                <div className="mt-8 hairline-t pt-6">
                  <p className="eyebrow mb-3">items checklist</p>
                  <p className="text-sm leading-relaxed max-w-[58ch]" style={{ color: "var(--color-text-3)" }}>
                    This errand was posted before item checklists were saved. Use the description above as the item source of truth.
                  </p>
                </div>
              )}

              {/* Route + deadline strip */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 hairline-t pt-6">
                <div>
                  <p className="eyebrow mb-2">pickup location</p>
                  {route ? (
                    <p style={{ color: "var(--color-text)", fontWeight: 700, fontSize: "1.125rem" }}>
                      {route.from}
                    </p>
                  ) : (
                    <p style={{ color: "var(--color-text)", fontWeight: 700, fontSize: "1.125rem" }}>
                      {errand.location}
                    </p>
                  )}
                </div>
                <div>
                  <p className="eyebrow mb-2">delivery location</p>
                  <p style={{ color: route ? "var(--color-text)" : "var(--color-text-3)", fontWeight: 700, fontSize: "1.125rem" }}>
                    {route ? route.to : "not separated yet"}
                  </p>
                </div>
                <div>
                  <p className="eyebrow mb-2">trip estimate</p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-3)" }}>
                    Add maps/geocoding before showing distance or ride time.
                  </p>
                </div>
                <div>
                  <p className="eyebrow mb-2">deadline</p>
                  <p
                    style={{
                      color:
                        new Date(errand.deadline) < new Date()
                          ? "var(--color-risk)"
                          : "var(--color-text)",
                      fontWeight: 700,
                      fontSize: "1.125rem",
                    }}
                  >
                    {formatDeadline(errand.deadline)}
                  </p>
                  <p className="mono text-xs mt-1" style={{ color: "var(--color-text-4)" }}>
                    {formatDate(errand.deadline)}
                  </p>
                </div>
              </div>

              <section className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-px hairline-t hairline-b" style={{ background: "var(--color-rule)" }}>
                <ContactCell
                  label="requester contact"
                  wallet={errand.customerWallet}
                  phone={errand.customerPhone}
                  email={errand.customerEmail}
                  visible={Boolean(errand.runnerWallet)}
                  note={errand.runnerWallet ? "visible after acceptance" : "hidden until a Padi accepts"}
                />
                <ContactCell
                  label="delivery contact"
                  wallet={errand.customerWallet}
                  phone={errand.customerPhone}
                  email={errand.customerEmail}
                  visible={errand.status !== "posted"}
                  note={errand.status !== "posted" ? "same as requester" : "hidden until accepted"}
                />
              </section>

              <section className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-px hairline-t hairline-b" style={{ background: "var(--color-rule)" }}>
                <ProofRequirementsCard category={errand.category} />
                <SubstitutionPolicyCard errand={errand} />
              </section>

              {/* Map — elevated to upper hierarchy. Expanded by default on
                  desktop; collapsed on mobile to keep above-fold light. */}
              <div className="mt-6">
                <div className="flex items-baseline justify-between gap-4 mb-3">
                  <p className="eyebrow">map</p>
                  <div className="flex items-center gap-4">
                    <a
                      href={mapOpenUrl(errand.location)}
                      target="_blank"
                      rel="noreferrer"
                      className="mono text-xs uppercase tracking-[0.08em] underline underline-offset-2"
                      style={{ color: "var(--color-text-2)" }}
                    >
                      open in maps ↗
                    </a>
                    <button
                      type="button"
                      onClick={() => setMapOpen((v) => !v)}
                      className="mono text-xs uppercase tracking-[0.08em] press sm:hidden"
                      style={{ color: "var(--color-text-3)" }}
                      aria-expanded={mapOpen}
                    >
                      {mapOpen ? "hide ↑" : "show ↓"}
                    </button>
                  </div>
                </div>
                <div
                  className={`hairline overflow-hidden ${mapOpen ? "block" : "hidden"} sm:block`}
                  style={{ background: "var(--color-bg-2)" }}
                >
                  <iframe
                    title={`Map for ${errand.location}`}
                    src={mapEmbedUrl(errand.location)}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="block w-full border-0"
                    style={{
                      height: "clamp(220px, 32vw, 320px)",
                      filter: "invert(0.92) hue-rotate(180deg) saturate(0.6)",
                    }}
                  />
                </div>
              </div>

              {/* Mobile-only inline escrow card. Desktop renders it in the right rail below. */}
              <div className="lg:hidden mt-10 motion-fade-up">
                <EscrowCard
                  errand={errand}
                  role={viewerRole}
                  loading={loading}
                  onAccept={handleAccept}
                  onCreateEscrow={handleCreateEscrow}
                  onFundEscrow={handleFundEscrow}
                  onStartProgress={handleStartProgress}
                  onConfirmCompletion={handleConfirmCompletion}
                  onReleaseFunds={handleReleaseFunds}
                  onOpenProof={() => setShowProofForm(true)}
                  onOpenDispute={() => setShowDisputeForm(true)}
                  onOpenChat={() => setChatOpen(true)}
                  estimatedPadiEarnings={estimatedPadiEarnings}
                  isDisputed={isDisputed}
                  isTerminal={isTerminal}
                />
              </div>
        </header>

        {/* Notices */}
        {error && (
          <div
            className="mt-8 px-4 py-3 mono text-xs hairline motion-fade-in"
            style={{
              borderColor: "var(--color-risk)",
              color: "var(--color-risk)",
            }}
          >
            {error}
          </div>
        )}
        {notice && (
          <div
            className="mt-8 px-4 py-3 mono text-xs hairline motion-fade-in"
            style={{
              borderColor: "var(--color-rule-strong)",
              color: "var(--color-text-2)",
            }}
          >
            {notice}
          </div>
        )}

        {/* Dispute banner */}
        {isDisputed && dispute && (
          <section
            className="mt-10 hairline px-5 py-5 motion-fade-up"
            style={{ borderColor: "var(--color-risk)" }}
          >
            <p className="eyebrow mb-2" style={{ color: "var(--color-risk)" }}>
              dispute open · {dispute.track ?? "normal"} track · filed {formatDate(dispute.createdAt)}
            </p>
            {dispute.reasonCode && (
              <p className="mono text-xs uppercase tracking-[0.08em] mb-2" style={{ color: "var(--color-text-3)" }}>
                {dispute.reasonCode.replace(/_/g, " ")}
              </p>
            )}
            <p
              className="leading-snug max-w-[60ch]"
              style={{ color: "var(--color-text)", fontWeight: 700, fontSize: "1.25rem" }}
            >
              “{dispute.reason}”
            </p>
            {dispute.evidenceUrl && (
              <a
                href={dispute.evidenceUrl}
                target="_blank"
                rel="noreferrer"
                className="mono text-xs break-all mt-3 inline-block underline underline-offset-2"
                style={{ color: "var(--color-risk)" }}
              >
                evidence · {dispute.evidenceUrl}
              </a>
            )}
            {errand.escrowContractId && (
              <a
                href={trustlessWorkViewerUrl(errand.escrowContractId)}
                target="_blank"
                rel="noreferrer"
                className="mono text-xs break-all mt-3 ml-0 sm:ml-4 inline-block underline underline-offset-2"
                style={{ color: "var(--color-text)" }}
              >
                escrow viewer · {shortAddr(errand.escrowContractId)} ↗
              </a>
            )}
            <p className="mt-4 text-sm" style={{ color: "var(--color-text-2)" }}>
              a resolver will review the evidence and settle the escrow shortly.{" "}
              <Link
                href="/admin"
                className="mono text-xs uppercase tracking-[0.08em] underline underline-offset-2 ml-1"
                style={{ color: "var(--color-text)" }}
              >
                resolver →
              </Link>
            </p>
          </section>
        )}

        {/* Terminal banner */}
        {isTerminal && (
          <section
            className="mt-10 hairline px-5 py-6 motion-fade-up"
            style={{ borderColor: isReleased ? "var(--color-ok)" : "var(--color-rule-strong)" }}
          >
            <p
              className="eyebrow mb-3"
              style={{ color: isReleased ? "var(--color-ok)" : "var(--color-text-3)" }}
            >
              {isReleased ? "settled · released to padi" : "settled · refunded to customer"}
            </p>
            <MoneyDisplay
              amount={errand.totalEscrowAmountUSDC}
              size="lg"
              tone={isReleased ? "ok" : "muted"}
            />
            <p className="mt-3 text-sm max-w-[58ch]" style={{ color: "var(--color-text-2)" }}>
              {isReleased
                ? "the escrow contract has paid the padi. the errand is closed."
                : "the escrow contract has returned funds to the customer. the errand is closed."}
            </p>
          </section>
        )}

        {/* PROOF FORM */}
        {showProofForm && (
          <ProofForm
            value={proofNote}
            urlValue={proofUrl}
            loading={loading === "proof"}
            onChange={setProofNote}
            onChangeUrl={setProofUrl}
            onSubmit={handleUploadProof}
            onCancel={() => setShowProofForm(false)}
          />
        )}

        {/* DISPUTE FORM */}
        {showDisputeForm && (
          <DisputeForm
            value={disputeReason}
            reasonCode={disputeReasonCode}
            track={disputeTrack}
            evidenceUrl={disputeEvidenceUrl}
            openedBy={viewerRole === "padi" ? "runner" : "customer"}
            loading={loading === "dispute"}
            onChange={setDisputeReason}
            onChangeReasonCode={(code) => {
              setDisputeReasonCode(code);
              const reason = DISPUTE_REASONS.find((r) => r.code === code);
              if (!reason?.fast) setDisputeTrack("normal");
            }}
            onChangeTrack={setDisputeTrack}
            onChangeEvidenceUrl={setDisputeEvidenceUrl}
            onSubmit={handleOpenDispute}
            onCancel={() => setShowDisputeForm(false)}
          />
        )}

        {/* PROOF SECTION (when uploaded) */}
        {errand.proofNote && !showProofForm && (
          <section className="mt-12 hairline-t pt-8">
            <p className="eyebrow mb-3">proof of completion</p>
            <p
              className="leading-snug max-w-[60ch]"
              style={{ color: "var(--color-text)", fontWeight: 700, fontSize: "1.5rem" }}
            >
              “{errand.proofNote}”
            </p>
            {errand.proofUrl && (
              <a
                href={errand.proofUrl}
                target="_blank"
                rel="noreferrer"
                className="mono text-xs break-all mt-4 inline-block underline underline-offset-2"
                style={{ color: "var(--color-text-2)" }}
              >
                evidence · {errand.proofUrl}
              </a>
            )}
          </section>
        )}

        {/* IDENTITIES */}
        <section className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-px"
                 style={{ background: "var(--color-rule)" }}>
          <IdentityCell
            label="customer"
            wallet={errand.customerWallet}
            connectedWallet={connectedWallet}
          />
          <IdentityCell
            label="padi"
            wallet={errand.runnerWallet}
            connectedWallet={connectedWallet}
          />
        </section>

        {/* Footer */}
        <footer className="mt-16 hairline-t pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <p className="mono leading-relaxed" style={{ color: "var(--color-text-3)" }}>
            take-home is padi fee after {PLATFORM_FEE_PERCENT}% gopadi fee and{" "}
            {TRUSTLESS_WORK_FEE_PERCENT}% trustless work fee. customer locks{" "}
            <MoneyInline amount={errand.totalEscrowAmountUSDC} tone="default" /> up front.
          </p>
          <p
            className="mono sm:text-right leading-relaxed"
            style={{ color: "var(--color-text-3)" }}
          >
            posted {formatDate(errand.createdAt)} · updated {formatDate(errand.updatedAt)}
          </p>
        </footer>
          </div>

          {/* RIGHT RAIL — escrow (lg+ only, sticky) */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 motion-fade-up">
              <EscrowCard
                errand={errand}
                role={viewerRole}
                loading={loading}
                onAccept={handleAccept}
                onCreateEscrow={handleCreateEscrow}
                onFundEscrow={handleFundEscrow}
                onStartProgress={handleStartProgress}
                onConfirmCompletion={handleConfirmCompletion}
                onReleaseFunds={handleReleaseFunds}
                onOpenProof={() => setShowProofForm(true)}
                onOpenDispute={() => setShowDisputeForm(true)}
                onOpenChat={() => setChatOpen(true)}
                estimatedPadiEarnings={estimatedPadiEarnings}
                isDisputed={isDisputed}
                isTerminal={isTerminal}
              />
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile sticky escrow strip — hidden at lg+ where the right-rail card lives */}
      <MobileEscrowBar
        errand={errand}
        role={viewerRole}
        loading={loading}
        onAccept={handleAccept}
        onCreateEscrow={handleCreateEscrow}
        onFundEscrow={handleFundEscrow}
        onStartProgress={handleStartProgress}
        onConfirmCompletion={handleConfirmCompletion}
        onReleaseFunds={handleReleaseFunds}
        onOpenProof={() => setShowProofForm(true)}
        isDisputed={isDisputed}
        isTerminal={isTerminal}
      />

      {/* Chat drawer — slides in from the right. Mounted regardless so
          the slide animation works in both directions. Internally hides
          when the padi hasn't accepted yet. */}
      <ChatDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        errand={errand}
        connectedWallet={connectedWallet}
        actions={actions}
        dispute={dispute}
        chat={chat}
        onOpenDispute={() => setShowDisputeForm(true)}
      />
    </div>
  );
}

/* ────────────────  ESCROW CARD  ──────────────── */

function EscrowCard({
  errand,
  role,
  loading,
  onAccept,
  onCreateEscrow,
  onFundEscrow,
  onStartProgress,
  onConfirmCompletion,
  onReleaseFunds,
  onOpenProof,
  onOpenDispute,
  onOpenChat,
  estimatedPadiEarnings,
  isDisputed,
  isTerminal,
}: {
  errand: Errand;
  role: ViewerRole;
  loading: string | null;
  onAccept: () => void;
  onCreateEscrow: () => void;
  onFundEscrow: () => void;
  onStartProgress: () => void;
  onConfirmCompletion: () => void;
  onReleaseFunds: () => void;
  onOpenProof: () => void;
  onOpenDispute: () => void;
  onOpenChat: () => void;
  estimatedPadiEarnings: number;
  isDisputed: boolean;
  isTerminal: boolean;
}) {
  const totalTone =
    errand.status === "released"
      ? "ok"
      : isDisputed
        ? "signal"
        : errand.status === "refunded"
          ? "muted"
          : "default";

  const action = nextAction({
    errand,
    role,
    loading,
    onAccept,
    onCreateEscrow,
    onFundEscrow,
    onStartProgress,
    onConfirmCompletion,
    onReleaseFunds,
    onOpenProof,
  });

  const canDispute =
    !isDisputed &&
    !isTerminal &&
    (role === "customer" || role === "padi") &&
    ["escrow_funded", "in_progress", "proof_uploaded"].includes(errand.status);

  return (
    <div
      className="hairline p-5 lg:p-6 lg:sticky lg:top-20 motion-fade-up"
      style={{ background: "var(--color-bg-2)" }}
    >
      <p className="eyebrow mb-3">
        {errand.status === "released"
          ? "released"
          : errand.status === "refunded"
            ? "refunded"
            : isDisputed
              ? "locked · disputed"
              : "locked in escrow"}
      </p>
      <MoneyDisplay amount={errand.totalEscrowAmountUSDC} size="hero" tone={totalTone as never} />

      <dl className="mt-6 hairline-t pt-4 grid grid-cols-[1fr_auto] gap-y-2 text-xs">
        <dt className="mono uppercase tracking-[0.06em]" style={{ color: "var(--color-text-3)" }}>
          item budget
        </dt>
        <dd className="mono text-right" style={{ color: "var(--color-text-2)" }}>
          <MoneyInline amount={errand.itemBudgetUSDC} tone="muted" />
        </dd>
        <dt className="mono uppercase tracking-[0.06em]" style={{ color: "var(--color-text-3)" }}>
          padi fee
        </dt>
        <dd className="mono text-right">
          <MoneyInline amount={errand.runnerFeeUSDC} tone="signal" />
        </dd>
        {role === "padi" && !isTerminal && (
          <>
            <dt className="mono uppercase tracking-[0.06em]" style={{ color: "var(--color-text-4)" }}>
              your take-home
            </dt>
            <dd className="mono text-right" style={{ color: "var(--color-text-3)" }}>
              ≈ <MoneyInline amount={estimatedPadiEarnings} tone="muted" />
            </dd>
          </>
        )}
      </dl>

      {action && (
        <div className="mt-6">
          <Button
            variant={action.variant}
            fullWidth
            onClick={action.onClick}
            loading={loading === action.loadingKey}
          >
            {action.label}
          </Button>
          {action.hint && (
            <p
              className="mono text-[0.6875rem] mt-3 leading-relaxed"
              style={{ color: "var(--color-text-3)" }}
            >
              {action.hint}
            </p>
          )}
        </div>
      )}

      {errand.runnerWallet && (
        <div className="mt-6 hairline-t pt-4">
          <p className="eyebrow mb-3">accepted padi</p>
          <dl className="grid grid-cols-[1fr_auto] gap-y-2 text-xs">
            <dt className="mono uppercase tracking-[0.06em]" style={{ color: "var(--color-text-3)" }}>
              wallet
            </dt>
            <dd className="mono text-right" style={{ color: "var(--color-text)" }}>
              {shortAddr(errand.runnerWallet)}
            </dd>
            <dt className="mono uppercase tracking-[0.06em]" style={{ color: "var(--color-text-3)" }}>
              reputation
            </dt>
            <dd className="mono text-right" style={{ color: "var(--color-text-3)" }}>
              not scored yet
            </dd>
            <dt className="mono uppercase tracking-[0.06em]" style={{ color: "var(--color-text-3)" }}>
              deposit
            </dt>
            <dd className="mono text-right" style={{ color: "var(--color-text-3)" }}>
              not required
            </dd>
          </dl>
          <button
            type="button"
            onClick={onOpenChat}
            className="mono text-xs uppercase tracking-[0.08em] mt-4 inline-block underline underline-offset-2 press text-left"
            style={{ color: "var(--color-text)" }}
          >
            message {role === "customer" ? "padi" : "requester"} →
          </button>
        </div>
      )}

      {canDispute && (
        <button
          type="button"
          onClick={onOpenDispute}
          className="mono text-xs uppercase tracking-[0.08em] mt-4 underline underline-offset-2 press"
          style={{ color: "var(--color-risk)" }}
        >
          open a dispute →
        </button>
      )}

      <div className="mt-6 hairline-t pt-4">
        <p className="eyebrow mb-3">protection</p>
        <ul className="space-y-2">
          {[
            "Funds stay in escrow until delivery is confirmed.",
            "Before acceptance, cancelling returns funds to the requester.",
            "If proof is rejected, either side can open a dispute.",
          ].map((item) => (
            <li key={item} className="text-xs leading-relaxed" style={{ color: "var(--color-text-3)" }}>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StatusTimeline({
  errand,
  actions,
  currentStatusRank,
  isRefunded,
}: {
  errand: Errand;
  actions: TrustlessAction[];
  currentStatusRank: number;
  isRefunded: boolean;
}) {
  return (
    <div>
      <p className="eyebrow mb-4">status timeline</p>
      <ol className="space-y-0">
        {STATUS_TIMELINE.map((step, i) => {
          const done = i <= currentStatusRank && !isRefunded;
          const active = i === currentStatusRank && !isRefunded;
          const at = statusTimestamp(errand, actions, step.key);
          const stepActions = receiptActionsForStep(actions, step);
          const showEscrowLinks =
            step.key === "funded" &&
            (errand.escrowContractId || errand.trustlessEngagementId || errand.escrowId);

          return (
            <li
              key={step.key}
              className="relative grid grid-cols-[14px_1fr] gap-x-3 items-start"
              style={{ minHeight: 54 }}
              aria-current={active ? "step" : undefined}
            >
              {i < STATUS_TIMELINE.length - 1 && (
                <span
                  aria-hidden
                  className="absolute"
                  style={{
                    left: 6,
                    top: 14,
                    bottom: -6,
                    width: 1,
                    background: i < currentStatusRank && !isRefunded
                      ? "var(--color-text)"
                      : "var(--color-rule)",
                  }}
                />
              )}
              <span
                aria-hidden
                className="relative rounded-full mt-1"
                style={{
                  width: 14,
                  height: 14,
                  background: active
                    ? "var(--color-signal)"
                    : done
                      ? "var(--color-text)"
                      : "var(--color-bg)",
                  border: `1px solid ${
                    active
                      ? "var(--color-signal)"
                      : done
                        ? "var(--color-text)"
                        : "var(--color-rule-strong)"
                  }`,
                  animation: active
                    ? "signal-pulse 1800ms var(--ease-out-quint) infinite"
                    : undefined,
                  }}
                />
              <div className="pb-4">
                <p
                  className="mono uppercase text-[0.6875rem] tracking-[0.08em] leading-tight"
                  style={{
                    color: done ? "var(--color-text)" : "var(--color-text-3)",
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  {step.label}
                </p>
                <p
                  className="mono text-[0.625rem] mt-1 uppercase tracking-[0.08em] leading-tight"
                  style={{ color: "var(--color-text-4)" }}
                >
                  {at ? formatRelative(at) : done ? "completed" : "pending"}
                </p>
                {(showEscrowLinks || stepActions.length > 0) && (
                  <div className="mt-3 space-y-3 min-w-0">
                    {showEscrowLinks && errand.escrowContractId && (
                      <div className="space-y-2 min-w-0">
                        <TimelineLink
                          label="viewer"
                          value="open in viewer"
                          href={trustlessWorkViewerUrl(errand.escrowContractId)}
                        />
                        <TimelineLink
                          label="contract"
                          value={shortAddr(errand.escrowContractId)}
                          href={stellarExpertContractUrl(errand.escrowContractId)}
                        />
                      </div>
                    )}
                    {stepActions.map((action) => (
                      <TimelineActionReceipt key={action.id} action={action} />
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {isRefunded && (
        <p className="mt-3 pt-3 hairline-t mono uppercase text-[0.6875rem] tracking-[0.08em]" style={{ color: "var(--color-text-3)" }}>
          refunded
        </p>
      )}
    </div>
  );
}

function TimelineLink({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <div className="min-w-0">
      <p className="mono uppercase text-[0.625rem] tracking-[0.08em] leading-tight" style={{ color: "var(--color-text-4)" }}>
        {label}
      </p>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        title={value}
        className="mono text-[0.625rem] mt-1 block truncate underline underline-offset-2"
        style={{ color: "var(--color-text-2)" }}
      >
        {value} ↗
      </a>
    </div>
  );
}

function TimelineActionReceipt({ action }: { action: TrustlessAction }) {
  const ts = new Date(action.submittedAt ?? action.createdAt)
    .toISOString()
    .replace("T", " ")
    .slice(5, 16);
  return (
    <div className="min-w-0">
      <p
        className="mono uppercase text-[0.625rem] tracking-[0.08em] leading-tight truncate"
        style={{ color: "var(--color-text)" }}
        title={actionLabel(action.type)}
      >
        {actionLabel(action.type)}
      </p>
      <p
        className="mono text-[0.625rem] mt-1 leading-tight truncate"
        style={{ color: "var(--color-text-4)" }}
      >
        {ts}
      </p>
      <p
        className="mono text-[0.625rem] leading-tight truncate"
        style={{ color: "var(--color-text-4)" }}
        title={action.signer}
      >
        by {shortAddr(action.signer)}
      </p>
      {action.transactionHash && (
        <a
          href={stellarExpertTxUrl(action.transactionHash)}
          target="_blank"
          rel="noreferrer"
          className="mono text-[0.625rem] mt-1 block truncate underline underline-offset-2"
          style={{ color: "var(--color-text-2)" }}
          title={action.transactionHash}
        >
          tx {shortAddr(action.transactionHash)} ↗
        </a>
      )}
      {action.errorMessage && (
        <p
          className="mono text-[0.625rem] mt-1 leading-tight"
          style={{ color: "var(--color-risk)" }}
        >
          {action.errorMessage}
        </p>
      )}
    </div>
  );
}

type ActionDef = {
  label: string;
  variant: "primary" | "secondary" | "ghost" | "risk";
  loadingKey: string;
  onClick: () => void;
  hint?: string;
};

function nextAction({
  errand,
  role,
  onAccept,
  onCreateEscrow,
  onFundEscrow,
  onStartProgress,
  onConfirmCompletion,
  onReleaseFunds,
  onOpenProof,
}: {
  errand: Errand;
  role: ViewerRole;
  loading: string | null;
  onAccept: () => void;
  onCreateEscrow: () => void;
  onFundEscrow: () => void;
  onStartProgress: () => void;
  onConfirmCompletion: () => void;
  onReleaseFunds: () => void;
  onOpenProof: () => void;
}): ActionDef | null {
  const { status } = errand;

  if (role === "observer") {
    if (status === "posted") {
      return null;
    }
    return null;
  }

  if (status === "posted") {
    return role === "customer"
      ? null
      : {
          label: "Accept errand",
          variant: "primary",
          loadingKey: "accept",
          onClick: onAccept,
          hint: "You become responsible for completing this errand.",
        };
  }

  if (status === "accepted") {
    return role === "customer"
      ? {
          label: "Create escrow",
          variant: "primary",
          loadingKey: "escrow",
          onClick: onCreateEscrow,
          hint: "Initializes the Trustless Work contract.",
        }
      : { label: "Waiting on requester", variant: "ghost", loadingKey: "_", onClick: () => {}, hint: "Requester is creating the escrow contract." };
  }

  if (status === "escrow_created") {
    return role === "customer"
      ? {
          label: "Fund escrow",
          variant: "primary",
          loadingKey: "fund",
          onClick: onFundEscrow,
          hint: "Funds are locked until delivery is confirmed.",
        }
      : { label: "Waiting on requester", variant: "ghost", loadingKey: "_", onClick: () => {}, hint: "Requester is funding the contract." };
  }

  if (status === "escrow_funded") {
    return role === "padi"
      ? {
          label: "Start shopping",
          variant: "primary",
          loadingKey: "start",
          onClick: onStartProgress,
          hint: "Marks the errand as in progress.",
        }
      : { label: "Waiting on Padi", variant: "ghost", loadingKey: "_", onClick: () => {}, hint: "Padi will start the errand." };
  }

  if (status === "in_progress") {
    return role === "padi"
      ? {
          label: "Submit proof",
          variant: "primary",
          loadingKey: "proof",
          onClick: onOpenProof,
          hint: "Add a completion note and optional evidence link.",
        }
      : { label: "Padi is working", variant: "ghost", loadingKey: "_", onClick: () => {}, hint: "Proof will appear here when uploaded." };
  }

  if (status === "proof_uploaded") {
    return role === "customer"
      ? {
          label: "Confirm delivery",
          variant: "primary",
          loadingKey: "confirm",
          onClick: onConfirmCompletion,
          hint: "Approves the milestone.",
        }
      : { label: "Waiting on requester", variant: "ghost", loadingKey: "_", onClick: () => {}, hint: "Requester is reviewing your proof." };
  }

  if (status === "completed") {
    return role === "customer"
      ? {
          label: "Release funds",
          variant: "primary",
          loadingKey: "release",
          onClick: onReleaseFunds,
          hint: "Pays out the escrow to the Padi.",
        }
      : { label: "Waiting on release", variant: "ghost", loadingKey: "_", onClick: () => {}, hint: "Requester will release escrow shortly." };
  }

  return null;
}

/* ────────────────  IDENTITY CELL  ──────────────── */

function IdentityCell({
  label,
  wallet,
  connectedWallet,
}: {
  label: string;
  wallet?: string | null;
  connectedWallet?: string | null;
}) {
  const isMe = Boolean(wallet && connectedWallet && wallet === connectedWallet);

  return (
    <div
      className="px-5 py-5"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="flex items-center gap-3 mb-2">
        <p className="eyebrow">{label}</p>
        {isMe && (
          <span
            className="mono uppercase tracking-[0.08em] text-[0.625rem]"
            style={{ color: "var(--color-signal)" }}
          >
            you
          </span>
        )}
      </div>
      <p
        className="mono text-sm break-all"
        style={{ color: wallet ? "var(--color-text)" : "var(--color-text-4)" }}
      >
        {wallet ? wallet : "awaiting acceptance"}
      </p>
    </div>
  );
}

function ContactCell({
  label,
  wallet,
  phone,
  email,
  visible,
  note,
}: {
  label: string;
  wallet?: string | null;
  phone?: string | null;
  email?: string | null;
  visible: boolean;
  note: string;
}) {
  return (
    <div className="px-5 py-5" style={{ background: "var(--color-bg)" }}>
      <p className="eyebrow mb-2">{label}</p>
      <p
        className="mono text-sm break-all"
        style={{ color: visible && wallet ? "var(--color-text)" : "var(--color-text-4)" }}
      >
        {visible && wallet ? wallet : "hidden"}
      </p>
      {visible && (phone || email) && (
        <div className="mt-3 space-y-1">
          {phone && (
            <p className="mono text-xs break-all" style={{ color: "var(--color-text-2)" }}>
              {phone}
            </p>
          )}
          {email && (
            <p className="mono text-xs break-all" style={{ color: "var(--color-text-2)" }}>
              {email}
            </p>
          )}
        </div>
      )}
      <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--color-text-3)" }}>
        {note}
      </p>
    </div>
  );
}

function ProofRequirementsCard({ category }: { category: Errand["category"] }) {
  const requirements = proofRequirements(category);

  return (
    <div className="px-5 py-5" style={{ background: "var(--color-bg)" }}>
      <p className="eyebrow mb-3">proof needed</p>
      <ul className="space-y-2">
        {requirements.map((item) => (
          <li key={item} className="grid grid-cols-[0.75rem_1fr] gap-x-2 text-sm leading-relaxed">
            <span className="mono text-xs" style={{ color: "var(--color-text-4)" }}>
              +
            </span>
            <span style={{ color: "var(--color-text-2)" }}>{item}</span>
          </li>
        ))}
      </ul>
      <p className="mono text-[0.6875rem] uppercase tracking-[0.08em] mt-4 leading-relaxed" style={{ color: "var(--color-text-3)" }}>
        Required before payment can be released.
      </p>
    </div>
  );
}

function SubstitutionPolicyCard({ errand }: { errand: Errand }) {
  const substitutionItems = (errand.items ?? []).filter((item) => item.substitutions.length > 0);

  return (
    <div className="px-5 py-5" style={{ background: "var(--color-bg)" }}>
      <p className="eyebrow mb-3">substitution policy</p>
      {substitutionItems.length > 0 ? (
        <ul className="space-y-3">
          {substitutionItems.map((item) => (
            <li key={item.name}>
              <p className="text-sm leading-snug" style={{ color: "var(--color-text)" }}>
                {item.name}
              </p>
              <p className="mono text-[0.6875rem] uppercase tracking-[0.06em] mt-1" style={{ color: "var(--color-text-3)" }}>
                allowed · {item.substitutions.join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-2)" }}>
          Other substitutions require requester approval in chat before buying.
        </p>
      )}
      <p className="text-xs leading-relaxed mt-4" style={{ color: "var(--color-text-3)" }}>
        If prices exceed the item budget, the Padi should request extra funds before purchase.
      </p>
    </div>
  );
}

/* ────────────────  PROOF FORM  ──────────────── */

function ProofForm({
  value,
  urlValue,
  loading,
  onChange,
  onChangeUrl,
  onSubmit,
  onCancel,
}: {
  value: string;
  urlValue: string;
  loading: boolean;
  onChange: (v: string) => void;
  onChangeUrl: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-10 hairline p-5 lg:p-6 motion-fade-up"
      style={{ background: "var(--color-bg-2)" }}
    >
      <p className="eyebrow mb-4">upload proof</p>
      <label className="block mono text-xs uppercase tracking-[0.08em] mb-2"
             style={{ color: "var(--color-text-3)" }}>
        describe what was done
      </label>
      <textarea
        required
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="bought 2kg rice, 1L oil, 3 cans tomato paste from ogbete. receipt link added below."
        className="w-full bg-transparent hairline-b py-2 outline-none text-base leading-relaxed resize-none mb-5"
        style={{ borderColor: "var(--color-rule-strong)", color: "var(--color-text)" }}
      />
      <label className="block mono text-xs uppercase tracking-[0.08em] mb-2"
             style={{ color: "var(--color-text-3)" }}>
        evidence link (optional)
      </label>
      <input
        type="url"
        value={urlValue}
        onChange={(e) => onChangeUrl(e.target.value)}
        placeholder="https://..."
        className="w-full bg-transparent hairline-b py-2 outline-none text-sm mb-6 mono"
        style={{ borderColor: "var(--color-rule-strong)", color: "var(--color-text)" }}
      />
      <div className="flex gap-3">
        <Button type="submit" variant="primary" loading={loading}>
          submit proof
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          cancel
        </Button>
      </div>
    </form>
  );
}

/* ────────────────  DISPUTE FORM  ──────────────── */

function DisputeForm({
  value,
  reasonCode,
  track,
  evidenceUrl,
  openedBy,
  loading,
  onChange,
  onChangeReasonCode,
  onChangeTrack,
  onChangeEvidenceUrl,
  onSubmit,
  onCancel,
}: {
  value: string;
  reasonCode: string;
  track: "fast" | "normal";
  evidenceUrl: string;
  openedBy: "customer" | "runner";
  loading: boolean;
  onChange: (v: string) => void;
  onChangeReasonCode: (v: string) => void;
  onChangeTrack: (v: "fast" | "normal") => void;
  onChangeEvidenceUrl: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  const selectedReason = DISPUTE_REASONS.find((reason) => reason.code === reasonCode);
  const evidenceRequired = openedBy === "runner";

  return (
    <form
      onSubmit={onSubmit}
      className="mt-10 hairline p-5 lg:p-6 motion-fade-up"
      style={{ borderColor: "var(--color-risk)" }}
    >
      <p className="eyebrow mb-3" style={{ color: "var(--color-risk)" }}>
        open dispute
      </p>
      <p className="text-sm mb-4 max-w-[58ch]" style={{ color: "var(--color-text-2)" }}>
        A resolver joins the errand chat after this is submitted. Add a clear reason now; upload photos, receipts, or chat screenshots when they exist.
      </p>
      <p className="eyebrow mb-3">reason</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
        {DISPUTE_REASONS.map((reason) => {
          const active = reason.code === reasonCode;
          return (
            <button
              key={reason.code}
              type="button"
              onClick={() => onChangeReasonCode(reason.code)}
              className="mono text-xs uppercase tracking-[0.08em] text-left px-3 py-2 hairline press"
              style={{
                borderColor: active ? "var(--color-risk)" : "var(--color-rule)",
                color: active ? "var(--color-text)" : "var(--color-text-3)",
                background: active ? "var(--color-bg-2)" : "transparent",
              }}
            >
              {reason.label}
            </button>
          );
        })}
      </div>
      <p className="eyebrow mb-3">track</p>
      <div className="flex flex-wrap gap-3 mb-5">
        <button
          type="button"
          onClick={() => selectedReason?.fast && onChangeTrack("fast")}
          disabled={!selectedReason?.fast}
          className="mono text-xs uppercase tracking-[0.08em] px-3 py-2 hairline press disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            borderColor: track === "fast" ? "var(--color-risk)" : "var(--color-rule)",
            color: track === "fast" ? "var(--color-text)" : "var(--color-text-3)",
          }}
        >
          fast track
        </button>
        <button
          type="button"
          onClick={() => onChangeTrack("normal")}
          className="mono text-xs uppercase tracking-[0.08em] px-3 py-2 hairline press"
          style={{
            borderColor: track === "normal" ? "var(--color-risk)" : "var(--color-rule)",
            color: track === "normal" ? "var(--color-text)" : "var(--color-text-3)",
          }}
        >
          normal track
        </button>
      </div>
      <label className="block mono text-xs uppercase tracking-[0.08em] mb-2"
             style={{ color: "var(--color-risk)" }}>
        what&apos;s wrong
      </label>
      <textarea
        required
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="wrong items, item not delivered, proof issue, payment issue..."
        className="w-full bg-transparent hairline-b py-2 outline-none text-base leading-relaxed resize-none mb-6"
        style={{ borderColor: "var(--color-risk)", color: "var(--color-text)" }}
      />
      <label className="block mono text-xs uppercase tracking-[0.08em] mb-2"
             style={{ color: "var(--color-risk)" }}>
        evidence link {evidenceRequired ? "" : "optional"}
      </label>
      <input
        type="url"
        required={evidenceRequired}
        value={evidenceUrl}
        onChange={(e) => onChangeEvidenceUrl(e.target.value)}
        placeholder={evidenceRequired ? "https://..." : "receipt, photo, or chat screenshot link if you have one"}
        className="w-full bg-transparent hairline-b py-2 outline-none text-sm mb-4 mono"
        style={{ borderColor: "var(--color-risk)", color: "var(--color-text)" }}
      />
      <ul className="mb-6 space-y-1">
        {(openedBy === "customer"
          ? [
              "For missing items, describe exactly what is missing and what you expected.",
              "Evidence is optional now; add full screenshots, receipts, or item photos later if you get them.",
              "Do not crop payment, receipt, delivery, or chat evidence when you do upload it.",
              "Resolver normally reviews within 48 hours if both sides respond.",
            ]
          : [
              "Use full, unedited screenshots, receipts, delivery photos, or handoff proof.",
              "Do not crop payment, receipt, delivery, or chat evidence.",
              "Include timestamps, sender/receiver details, and full item photos when relevant.",
              "Resolver normally reviews within 48 hours if both sides respond.",
            ]).map((item) => (
          <li key={item} className="text-xs leading-relaxed" style={{ color: "var(--color-text-3)" }}>
            {item}
          </li>
        ))}
      </ul>
      <div className="flex gap-3">
        <Button type="submit" variant="risk" loading={loading}>
          open dispute
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          cancel
        </Button>
      </div>
    </form>
  );
}

/* ────────────────  MOBILE ESCROW BAR  ──────────────── */

function MobileEscrowBar({
  errand,
  role,
  loading,
  onAccept,
  onCreateEscrow,
  onFundEscrow,
  onStartProgress,
  onConfirmCompletion,
  onReleaseFunds,
  onOpenProof,
  isDisputed,
  isTerminal,
}: {
  errand: Errand;
  role: ViewerRole;
  loading: string | null;
  onAccept: () => void;
  onCreateEscrow: () => void;
  onFundEscrow: () => void;
  onStartProgress: () => void;
  onConfirmCompletion: () => void;
  onReleaseFunds: () => void;
  onOpenProof: () => void;
  isDisputed: boolean;
  isTerminal: boolean;
}) {
  const action = nextAction({
    errand,
    role,
    loading,
    onAccept,
    onCreateEscrow,
    onFundEscrow,
    onStartProgress,
    onConfirmCompletion,
    onReleaseFunds,
    onOpenProof,
  });

  // Hide entirely on terminal/disputed (no contextual action to surface)
  // and when there's nothing to do (observer role).
  if (isTerminal || isDisputed || !action) return null;
  const isPrimary = action.variant === "primary";

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden hairline-t"
      style={{
        background: "color-mix(in oklab, var(--color-bg) 92%, transparent)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
        <div className="min-w-0">
          <p
            className="mono text-[0.625rem] uppercase tracking-[0.08em]"
            style={{ color: "var(--color-text-3)" }}
          >
            {errand.status === "released"
              ? "released"
              : errand.status === "refunded"
                ? "refunded"
                : "locked"}
          </p>
          <p
            className="mono leading-none"
            style={{
              color: isPrimary ? "var(--color-text)" : "var(--color-text-2)",
              fontSize: "1.25rem",
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {errand.totalEscrowAmountUSDC.toLocaleString("en-NG", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            <span
              className="mono uppercase ml-1"
              style={{
                color: "var(--color-text-3)",
                fontSize: "0.625rem",
                letterSpacing: "0.08em",
              }}
            >
              USDC
            </span>
          </p>
        </div>
        <div className="flex-1" />
        <Button
          variant={action.variant}
          onClick={action.onClick}
          loading={loading === action.loadingKey}
          disabled={!isPrimary || loading === action.loadingKey}
        >
          {action.label}
        </Button>
      </div>
    </div>
  );
}

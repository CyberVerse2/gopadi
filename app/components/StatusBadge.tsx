import { ErrandStatus } from "../types";

type Tone = "neutral" | "live" | "ok" | "warn" | "risk";

const statusTone: Record<ErrandStatus, Tone> = {
  posted: "neutral",
  accepted: "live",
  escrow_created: "live",
  escrow_funded: "live",
  in_progress: "live",
  proof_uploaded: "warn",
  completed: "live",
  released: "ok",
  disputed: "risk",
  refunded: "neutral",
};

const STATUS_LABEL: Record<ErrandStatus, string> = {
  posted: "posted",
  accepted: "accepted",
  escrow_created: "escrow created",
  escrow_funded: "funded",
  in_progress: "in progress",
  proof_uploaded: "proof submitted",
  completed: "confirmed",
  released: "released",
  disputed: "disputed",
  refunded: "refunded",
};

const toneStyle: Record<Tone, { fg: string; dot: string }> = {
  neutral: { fg: "var(--color-text-2)", dot: "var(--color-text-4)" },
  live:    { fg: "var(--color-signal)", dot: "var(--color-signal)" },
  ok:      { fg: "var(--color-ok)",     dot: "var(--color-ok)" },
  warn:    { fg: "var(--color-warn)",   dot: "var(--color-warn)" },
  risk:    { fg: "var(--color-risk)",   dot: "var(--color-risk)" },
};

export default function StatusBadge({
  status,
  size = "md",
}: {
  status: ErrandStatus;
  size?: "sm" | "md";
}) {
  const tone = statusTone[status];
  const s = toneStyle[tone];
  const live = tone === "live" || tone === "warn";

  return (
    <span
      className={`mono inline-flex items-center gap-1.5 uppercase tracking-[0.08em] ${
        size === "sm" ? "text-[0.625rem]" : "text-[0.6875rem]"
      } whitespace-nowrap`}
      style={{ color: s.fg }}
    >
      <span
        className="inline-block rounded-full"
        style={{
          width: 6,
          height: 6,
          background: s.dot,
          animation: live ? "signal-pulse 1800ms var(--ease-out-quint) infinite" : undefined,
        }}
        aria-hidden
      />
      {STATUS_LABEL[status]}
    </span>
  );
}

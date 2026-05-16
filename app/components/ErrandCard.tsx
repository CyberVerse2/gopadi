import Link from "next/link";
import { Errand } from "../types";
import StatusBadge from "./StatusBadge";
import { MoneyInline } from "./MoneyDisplay";
import { getPadiProfile } from "../lib/padi-profile";

function formatDeadline(iso: string): string {
  const d = new Date(iso);
  const diffMs = d.getTime() - Date.now();
  if (diffMs < 0) return "overdue";
  const h = Math.floor(diffMs / 3_600_000);
  const m = Math.floor((diffMs % 3_600_000) / 60_000);
  if (h >= 48) return `${Math.floor(h / 24)}d`;
  if (h >= 1) return `${h}h ${m}m`;
  return `${m}m`;
}

function shortAddr(value?: string | null) {
  if (!value) return null;
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export type RowVariant = "padi" | "customer";

export default function ErrandRow({
  errand,
  index,
  variant = "padi",
}: {
  errand: Errand;
  index?: number;
  variant?: RowVariant;
}) {
  const isOverdue = new Date(errand.deadline) < new Date();
  const padiShort = shortAddr(errand.runnerWallet);
  const padiProfile = getPadiProfile(errand.runnerWallet);

  return (
    <Link
      href={`/errands/${errand.id}`}
      className="row-hover group block hairline-b"
    >
      <div className="grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)_auto_auto] gap-x-3 sm:gap-x-6 items-baseline px-4 sm:px-6 py-4 sm:py-5">
        {/* Index */}
        <span
          className="mono text-xs tabular-nums"
          style={{ color: "var(--color-text-4)" }}
        >
          {typeof index === "number" ? String(index + 1).padStart(3, "0") : "—"}
        </span>

        {/* Title + category */}
        <div className="min-w-0">
          <div
            className="mono text-[0.625rem] uppercase tracking-[0.08em] mb-1"
            style={{ color: "var(--color-text-3)" }}
          >
            {errand.category}
            {padiShort && variant === "customer" && (
              <>
                <span className="mx-1.5" style={{ color: "var(--color-text-4)" }}>·</span>
                <span style={{ color: "var(--color-text-3)" }}>
                  padi {padiProfile?.name ?? padiShort}
                </span>
              </>
            )}
          </div>
          <h3
            className="text-sm sm:text-base leading-tight truncate"
            style={{ color: "var(--color-text)", fontWeight: 600 }}
          >
            {errand.title}
          </h3>
        </div>

        {/* Location — hidden on small */}
        <p
          className="hidden sm:block text-xs leading-snug truncate min-w-0"
          style={{ color: "var(--color-text-3)" }}
        >
          {errand.location}
        </p>

        {/* Fee (padi) / Total (customer) */}
        <div className="text-right">
          {variant === "padi" ? (
            <>
              <div
                className="mono text-base sm:text-lg"
                style={{ color: "var(--color-signal)", fontWeight: 600 }}
              >
                <MoneyInline amount={errand.runnerFeeUSDC} tone="signal" />
              </div>
              <p
                className="mono text-[0.625rem] uppercase tracking-[0.08em] mt-0.5"
                style={{ color: "var(--color-text-4)" }}
              >
                {padiProfile && variant === "padi"
                  ? `${padiProfile.rating} rating · `
                  : "fee · "}
                {formatDeadline(errand.deadline)}{isOverdue ? "" : " left"}
              </p>
            </>
          ) : (
            <>
              <div
                className="mono text-base sm:text-lg"
                style={{ color: "var(--color-text)" }}
              >
                <MoneyInline amount={errand.totalEscrowAmountUSDC} tone="default" />
              </div>
              <p
                className="mono text-[0.625rem] uppercase tracking-[0.08em] mt-0.5"
                style={{ color: "var(--color-text-4)" }}
              >
                locked · {formatDeadline(errand.deadline)}{isOverdue ? "" : " left"}
              </p>
            </>
          )}
        </div>

        {/* Status — hidden on small to keep row tight */}
        <div className="hidden sm:block">
          <StatusBadge status={errand.status} size="sm" />
        </div>
      </div>
    </Link>
  );
}

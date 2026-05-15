import { ErrandStatus } from "../types";

export type Step = {
  key: string;
  label: string;
  statuses: ErrandStatus[];
};

export const ERRAND_STEPS: Step[] = [
  { key: "posted",   label: "posted",              statuses: ["posted"] },
  { key: "accepted", label: "accepted by padi",    statuses: ["accepted"] },
  { key: "funded",   label: "escrow funded",       statuses: ["escrow_created", "escrow_funded"] },
  { key: "working",  label: "shopping started",    statuses: ["in_progress"] },
  { key: "proof",    label: "proof submitted",     statuses: ["proof_uploaded"] },
  { key: "confirmed",label: "delivery confirmed",  statuses: ["completed"] },
  { key: "released", label: "payment released",    statuses: ["released"] },
];

export function getStepIndex(status: ErrandStatus): number {
  if (status === "refunded" || status === "disputed") return -1;
  return ERRAND_STEPS.findIndex((s) => s.statuses.includes(status));
}

export default function StepIndicator({
  status,
  variant = "horizontal",
}: {
  status: ErrandStatus;
  variant?: "horizontal" | "compact" | "vertical";
}) {
  const idx = getStepIndex(status);
  const isDisputed = status === "disputed";
  const isRefunded = status === "refunded";

  if (variant === "compact") {
    return (
      <div className="mono text-xs flex items-center gap-1" style={{ color: "var(--color-text-3)" }}>
        <span style={{ color: "var(--color-signal)" }}>
          {String(Math.max(idx, 0) + 1).padStart(2, "0")}
        </span>
        <span>/</span>
        <span>{String(ERRAND_STEPS.length).padStart(2, "0")}</span>
        <span className="ml-2 uppercase tracking-[0.08em]" style={{ color: "var(--color-text-2)" }}>
          {isDisputed ? "disputed" : isRefunded ? "refunded" : ERRAND_STEPS[idx]?.label ?? ""}
        </span>
      </div>
    );
  }

  if (variant === "vertical") {
    return (
      <ol className="relative flex flex-col gap-0" aria-label="errand progress">
        {ERRAND_STEPS.map((step, i) => {
          const done = !isDisputed && !isRefunded && i < idx;
          const active = !isDisputed && !isRefunded && i === idx;
          const color = active
            ? "var(--color-signal)"
            : done
              ? "var(--color-text)"
              : "var(--color-text-4)";
          const lineDone = i < idx;

          return (
            <li
              key={step.key}
              className="relative grid grid-cols-[14px_1fr] gap-x-3 items-start"
              aria-current={active ? "step" : undefined}
              style={{ minHeight: "44px" }}
            >
              {/* Vertical connector below tick (except last) */}
              {i < ERRAND_STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="absolute"
                  style={{
                    left: "6px",
                    top: "14px",
                    bottom: "-6px",
                    width: 1,
                    background: lineDone
                      ? "var(--color-text)"
                      : "var(--color-rule)",
                  }}
                />
              )}
              {/* Tick */}
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
              <span
                className="mono uppercase text-[0.6875rem] tracking-[0.08em] leading-tight pb-3"
                style={{ color, fontWeight: active ? 600 : 400 }}
              >
                {step.label}
              </span>
            </li>
          );
        })}
        {(isDisputed || isRefunded) && (
          <li
            className="mt-3 pt-3 hairline-t mono uppercase text-[0.6875rem] tracking-[0.08em]"
            style={{
              color: isDisputed ? "var(--color-risk)" : "var(--color-text-3)",
            }}
          >
            {isDisputed ? "● disputed" : "refunded"}
          </li>
        )}
      </ol>
    );
  }

  return (
    <ol
      className="grid w-full"
      style={{
        gridTemplateColumns: `repeat(${ERRAND_STEPS.length}, minmax(0, 1fr))`,
      }}
      aria-label="errand progress"
    >
      {ERRAND_STEPS.map((step, i) => {
        const done = !isDisputed && !isRefunded && i < idx;
        const active = !isDisputed && !isRefunded && i === idx;
        const future = !done && !active;

        const color = active
          ? "var(--color-signal)"
          : done
            ? "var(--color-text)"
            : "var(--color-text-4)";

        return (
          <li
            key={step.key}
            className="relative flex flex-col items-start gap-2 pr-2"
            aria-current={active ? "step" : undefined}
          >
            {/* Connector line above tick */}
            {i > 0 && (
              <span
                aria-hidden
                className="absolute top-[7px] left-[-50%] right-[50%] h-px"
                style={{
                  background: i <= idx && !future ? "var(--color-text)" : "var(--color-rule)",
                }}
              />
            )}
            {/* Tick */}
            <span
              aria-hidden
              className="relative rounded-full"
              style={{
                width: 14,
                height: 14,
                background: active ? "var(--color-signal)" : done ? "var(--color-text)" : "var(--color-bg)",
                border: `1px solid ${active ? "var(--color-signal)" : done ? "var(--color-text)" : "var(--color-rule-strong)"}`,
                animation: active ? "signal-pulse 1800ms var(--ease-out-quint) infinite" : undefined,
              }}
            />
            <span
              className="mono uppercase text-[0.625rem] tracking-[0.08em] leading-tight"
              style={{ color }}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

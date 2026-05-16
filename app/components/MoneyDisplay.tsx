type Tone = "default" | "signal" | "ok" | "risk" | "muted";

const toneColor: Record<Tone, string> = {
  default: "var(--color-text)",
  signal:  "var(--color-signal)",
  ok:      "var(--color-ok)",
  risk:    "var(--color-risk)",
  muted:   "var(--color-text-3)",
};

export function MoneyDisplay({
  amount,
  size = "hero",
  tone = "default",
  currency = "USDC",
}: {
  amount: number;
  size?: "hero" | "lg" | "md" | "sm";
  tone?: Tone;
  currency?: string;
}) {
  const sizes = {
    hero: { num: "clamp(3.25rem, 9vw, 6rem)", suffix: "0.875rem" },
    lg:   { num: "clamp(2rem, 4.5vw, 3rem)",  suffix: "0.75rem"  },
    md:   { num: "1.5rem",                    suffix: "0.6875rem" },
    sm:   { num: "1.125rem",                  suffix: "0.625rem"  },
  } as const;
  const s = sizes[size];
  const color = toneColor[tone];

  return (
    <span
      className="inline-flex items-baseline gap-2"
      style={{ color, fontVariantNumeric: "tabular-nums lining-nums" }}
    >
      <span
        className="display"
        style={{
          fontSize: s.num,
          fontWeight: 900,
          lineHeight: 0.9,
          letterSpacing: "-0.02em",
        }}
      >
        {amount.toLocaleString("en-NG", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
      <span
        className="mono uppercase"
        style={{
          fontSize: s.suffix,
          letterSpacing: "0.08em",
          color: "var(--color-text-3)",
        }}
      >
        {currency}
      </span>
    </span>
  );
}

export function MoneyInline({
  amount,
  tone = "default",
  currency = "USDC",
}: {
  amount: number;
  tone?: Tone;
  currency?: string;
}) {
  const color = toneColor[tone];
  return (
    <span className="mono whitespace-nowrap" style={{ color }}>
      {amount.toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
      <span
        className="mono uppercase ml-1"
        style={{ fontSize: "0.75em", color: "var(--color-text-3)", letterSpacing: "0.06em" }}
      >
        {currency}
      </span>
    </span>
  );
}

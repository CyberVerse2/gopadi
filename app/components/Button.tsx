import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "risk";

const variantStyles: Record<
  Variant,
  { bg: string; color: string; border: string; hoverBg: string }
> = {
  primary: {
    bg:      "var(--color-signal)",
    color:   "var(--color-signal-ink)",
    border:  "var(--color-signal)",
    hoverBg: "var(--color-signal-hi)",
  },
  secondary: {
    bg:      "transparent",
    color:   "var(--color-text)",
    border:  "var(--color-rule-strong)",
    hoverBg: "var(--color-bg-2)",
  },
  ghost: {
    bg:      "transparent",
    color:   "var(--color-text-2)",
    border:  "transparent",
    hoverBg: "var(--color-bg-2)",
  },
  risk: {
    bg:      "transparent",
    color:   "var(--color-risk)",
    border:  "var(--color-risk)",
    hoverBg: "var(--color-risk-soft)",
  },
};

export default function Button({
  variant = "primary",
  fullWidth,
  loading,
  children,
  className = "",
  style,
  disabled,
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  variant?: Variant;
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
}) {
  const v = variantStyles[variant];
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`mono uppercase tracking-[0.08em] text-xs font-medium px-4 py-3 press transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${fullWidth ? "w-full" : ""} ${className}`}
      style={{
        background: v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (disabled || loading) return;
        (e.currentTarget as HTMLButtonElement).style.background = v.hoverBg;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = v.bg;
      }}
    >
      <span className="inline-flex items-center justify-between gap-2 w-full">
        <span>{loading ? "working…" : children}</span>
        {variant === "primary" && !loading && (
          <span aria-hidden style={{ marginLeft: "auto", opacity: 0.7 }}>
            →
          </span>
        )}
      </span>
    </button>
  );
}

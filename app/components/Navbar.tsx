"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useWallet } from "./WalletProvider";

const links = [
  { href: "/errands", label: "errands" },
  { href: "/post-errand", label: "post" },
  { href: "/admin", label: "resolver" },
];

export function Wordmark({
  size = "md",
}: {
  size?: "sm" | "md" | "lg";
  withMark?: boolean;
}) {
  const sizes = {
    sm: { width: 92, height: 25 },
    md: { width: 118, height: 32 },
    lg: { width: 154, height: 42 },
  } as const;
  return (
    <Image
      src="/gopadi-logo.svg"
      alt="gopadi"
      width={sizes[size].width}
      height={sizes[size].height}
      className="block"
      style={{ height: sizes[size].height, width: sizes[size].width }}
    />
  );
}

export function LogoMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/gopadi-logo.svg"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: "cover",
        objectPosition: "left center",
      }}
    />
  );
}

function shortAddr(value: string) {
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export default function Navbar() {
  const pathname = usePathname();
  const { address, connect, connecting, disconnect } = useWallet();

  return (
    <header
      className="sticky top-0 z-50 hairline-b"
      style={{
        background:
          "color-mix(in oklab, var(--color-bg) 88%, transparent)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 h-12 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center">
          <Wordmark />
        </Link>

        <nav className="hidden sm:flex items-center gap-6">
          {links.map((l) => {
            const active = pathname === l.href || pathname?.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                className="mono text-xs uppercase tracking-[0.08em] press"
                style={{
                  color: active ? "var(--color-text)" : "var(--color-text-3)",
                  borderBottom: active
                    ? "1px solid var(--color-signal)"
                    : "1px solid transparent",
                  paddingBottom: "2px",
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {address ? (
            <div
              className="mono text-xs uppercase tracking-[0.08em] inline-flex items-center hairline"
              style={{
                color: "var(--color-text)",
                background: "var(--color-bg-2)",
              }}
            >
              <span className="px-3 py-1.5">{shortAddr(address)}</span>
              <button
                type="button"
                onClick={disconnect}
                aria-label="disconnect wallet"
                title="disconnect wallet"
                className="press flex items-center justify-center h-full px-2.5 py-1.5 transition-colors"
                style={{
                  color: "var(--color-text-3)",
                  borderLeft: "1px solid var(--color-rule)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--color-signal)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--color-text-3)";
                }}
              >
                {/* small × glyph rendered as inline SVG so the stroke
                    stays crisp at small sizes and matches the hairline
                    aesthetic */}
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  aria-hidden
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="square"
                >
                  <path d="M1 1 L9 9 M9 1 L1 9" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void connect()}
              disabled={connecting}
              className="mono text-xs uppercase tracking-[0.08em] px-3 py-1.5 hairline press disabled:opacity-50"
              style={{
                color: "var(--color-text-2)",
                background: "transparent",
              }}
            >
              {connecting ? "connecting…" : "connect wallet"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

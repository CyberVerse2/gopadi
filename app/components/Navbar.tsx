"use client";

import Link from "next/link";
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
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  } as const;
  return (
    <span
      className={`mono ${sizes[size]} tracking-tight`}
      style={{ color: "var(--color-text)" }}
      aria-label="gopadi"
    >
      <span style={{ color: "var(--color-text-3)" }}>/</span>
      <span style={{ fontWeight: 600 }}>gopadi</span>
    </span>
  );
}

export function LogoMark(_: { size?: number; className?: string }) {
  return null;
}

function shortAddr(value: string) {
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export default function Navbar() {
  const pathname = usePathname();
  const { address, connect, connecting } = useWallet();

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
          <button
            type="button"
            onClick={() => void connect()}
            disabled={connecting}
            className="mono text-xs uppercase tracking-[0.08em] px-3 py-1.5 hairline press disabled:opacity-50"
            style={{
              color: address ? "var(--color-text)" : "var(--color-text-2)",
              background: address ? "var(--color-bg-2)" : "transparent",
            }}
          >
            {address ? shortAddr(address) : connecting ? "connecting…" : "connect wallet"}
          </button>
        </div>
      </div>
    </header>
  );
}

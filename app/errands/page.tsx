"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import ErrandRow from "../components/ErrandCard";
import { useWallet } from "../components/WalletProvider";
import { Errand, ErrandCategory } from "../types";
import { listErrands } from "../lib/api-client";

const CATEGORIES: { value: ErrandCategory | "all"; label: string }[] = [
  { value: "all", label: "all" },
  { value: "foodstuff", label: "foodstuff" },
  { value: "fuel", label: "fuel" },
  { value: "groceries", label: "groceries" },
  { value: "medicine", label: "medicine" },
  { value: "delivery", label: "delivery" },
  { value: "other", label: "other" },
];

type Sort = "fee_high" | "deadline_soon" | "newest";
const SORTS: { value: Sort; label: string }[] = [
  { value: "fee_high", label: "fee high" },
  { value: "deadline_soon", label: "deadline soon" },
  { value: "newest", label: "newest" },
];

function shortAddr(v: string) {
  return `${v.slice(0, 4)}…${v.slice(-4)}`;
}

export default function ErrandsListPage() {
  const wallet = useWallet();
  const [errands, setErrands] = useState<Errand[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState<ErrandCategory | "all">("all");
  const [sort, setSort] = useState<Sort>("fee_high");
  // padi view vs customer view. Defaults to padi when no wallet (browsing).
  const [view, setView] = useState<"padi" | "customer">("padi");

  useEffect(() => {
    listErrands()
      .then(({ errands }) => setErrands(errands))
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "failed to load."),
      )
      .finally(() => setLoading(false));
  }, []);

  // Auto-flip to customer view if connected wallet has posted errands.
  useEffect(() => {
    if (!wallet.address) return;
    const myPosts = errands.some((e) => e.customerWallet === wallet.address);
    if (!myPosts) return;
    const t = setTimeout(() => setView("customer"), 0);
    return () => clearTimeout(t);
  }, [wallet.address, errands]);

  const filtered = useMemo(() => {
    let pool = errands;
    if (view === "padi") {
      pool = pool.filter((e) => e.status === "escrow_funded");
    } else {
      pool = pool.filter((e) => e.customerWallet === wallet.address);
    }
    if (category !== "all") pool = pool.filter((e) => e.category === category);
    return [...pool].sort((a, b) => {
      if (sort === "fee_high") return b.runnerFeeUSDC - a.runnerFeeUSDC;
      if (sort === "deadline_soon")
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [errands, view, category, sort, wallet.address]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-10 py-8 lg:py-10">
        {/* Header strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 hairline-b">
          <div className="mono text-xs uppercase tracking-[0.08em] flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {wallet.address ? (
              <>
                <span style={{ color: "var(--color-text-3)" }}>
                  {shortAddr(wallet.address)}
                </span>
                <span style={{ color: "var(--color-text-4)" }}>·</span>
                <button
                  type="button"
                  onClick={() => setView("padi")}
                  className="press"
                  style={{
                    color: view === "padi" ? "var(--color-text)" : "var(--color-text-3)",
                    borderBottom:
                      view === "padi"
                        ? "1px solid var(--color-signal)"
                        : "1px solid transparent",
                    paddingBottom: 2,
                  }}
                >
                  padi
                </button>
                <button
                  type="button"
                  onClick={() => setView("customer")}
                  className="press"
                  style={{
                    color:
                      view === "customer" ? "var(--color-text)" : "var(--color-text-3)",
                    borderBottom:
                      view === "customer"
                        ? "1px solid var(--color-signal)"
                        : "1px solid transparent",
                    paddingBottom: 2,
                  }}
                >
                  customer
                </button>
              </>
            ) : (
              <span style={{ color: "var(--color-text-3)" }}>
                browsing as padi · connect wallet to see your posts
              </span>
            )}
          </div>

          <Link
            href="/post-errand"
            className="mono text-xs uppercase tracking-[0.08em] press"
            style={{
              background: "var(--color-signal)",
              color: "var(--color-signal-ink)",
              padding: "0.5rem 0.875rem",
              border: "1px solid var(--color-signal)",
            }}
          >
            post errand →
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-3 mt-5">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span
              className="mono text-[0.625rem] uppercase tracking-[0.08em]"
              style={{ color: "var(--color-text-4)" }}
            >
              category
            </span>
            {CATEGORIES.map((c) => {
              const active = category === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className="mono text-xs uppercase tracking-[0.08em] press"
                  style={{
                    color: active ? "var(--color-text)" : "var(--color-text-3)",
                    borderBottom: active
                      ? "1px solid var(--color-signal)"
                      : "1px solid transparent",
                    paddingBottom: 2,
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span
              className="mono text-[0.625rem] uppercase tracking-[0.08em]"
              style={{ color: "var(--color-text-4)" }}
            >
              sort
            </span>
            {SORTS.map((s) => {
              const active = sort === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSort(s.value)}
                  className="mono text-xs uppercase tracking-[0.08em] press"
                  style={{
                    color: active ? "var(--color-text)" : "var(--color-text-3)",
                    borderBottom: active
                      ? "1px solid var(--color-signal)"
                      : "1px solid transparent",
                    paddingBottom: 2,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          <span
            className="mono text-xs ml-auto"
            style={{ color: "var(--color-text-4)" }}
          >
            {filtered.length} {filtered.length === 1 ? "errand" : "errands"}
          </span>
        </div>

        {error && (
          <div
            className="mt-6 px-4 py-3 mono text-xs hairline"
            style={{ borderColor: "var(--color-risk)", color: "var(--color-risk)" }}
          >
            {error}
          </div>
        )}

        {/* List */}
        <div className="mt-6 hairline-t">
          {loading ? (
            <div className="py-10">
              <p
                className="mono text-xs uppercase tracking-[0.08em]"
                style={{ color: "var(--color-text-3)" }}
              >
                loading errands…
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16">
              <p
                className="text-base leading-relaxed max-w-[58ch]"
                style={{ color: "var(--color-text-2)" }}
              >
                {view === "padi"
                  ? "no open errands in this category right now. check back at lunch — markets get busy after 11."
                  : "you haven't posted anything yet. posting is four steps."}
              </p>
              {view === "customer" && (
                <Link
                  href="/post-errand"
                  className="mono text-xs uppercase tracking-[0.08em] underline underline-offset-2 inline-block mt-4 press"
                  style={{ color: "var(--color-signal)" }}
                >
                  post your first errand →
                </Link>
              )}
            </div>
          ) : (
            filtered.map((errand, i) => (
              <ErrandRow
                key={errand.id}
                errand={errand}
                index={i}
                variant={view}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

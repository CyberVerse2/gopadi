"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Button from "../../components/Button";
import { MoneyDisplay } from "../../components/MoneyDisplay";
import { getPadiProfile } from "../../lib/padi-profile";

function shortAddr(value: string) {
  return value.length > 10 ? `${value.slice(0, 4)}…${value.slice(-4)}` : value;
}

function stellarExpertTxUrl(hash: string) {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}

function trustlessWorkViewerUrl(contractId: string) {
  const url = new URL("https://viewer.trustlesswork.com");
  url.searchParams.set("contractId", contractId);
  return url.toString();
}

export default function PostErrandSuccessPage() {
  return (
    <Suspense fallback={<PostErrandSuccessShell />}>
      <PostErrandSuccessContent />
    </Suspense>
  );
}

function PostErrandSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [seconds, setSeconds] = useState(5);

  const id = searchParams.get("id") ?? "";
  const title = searchParams.get("title") ?? "Your errand";
  const amount = Number.parseFloat(searchParams.get("amount") ?? "0");
  const padi = searchParams.get("padi") ?? "";
  const padiProfile = getPadiProfile(padi);
  const contract = searchParams.get("contract") ?? "";
  const tx = searchParams.get("tx") ?? "";

  const errandHref = id ? `/errands/${id}` : "/errands";
  const viewerHref = useMemo(
    () => (contract ? trustlessWorkViewerUrl(contract) : ""),
    [contract],
  );

  useEffect(() => {
    if (!id) return;
    const redirect = window.setTimeout(() => {
      router.replace(errandHref);
    }, 5000);
    const interval = window.setInterval(() => {
      setSeconds((value) => Math.max(value - 1, 0));
    }, 1000);
    return () => {
      window.clearTimeout(redirect);
      window.clearInterval(interval);
    };
  }, [errandHref, id, router]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 w-full max-w-[1120px] mx-auto px-4 sm:px-8 lg:px-10 py-10 lg:py-16">
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 lg:gap-14 items-start">
          <div>
            <p className="eyebrow mb-5" style={{ color: "var(--color-ok)" }}>
              escrow funded
            </p>
            <h1
              style={{
                color: "var(--color-text)",
                fontWeight: 900,
                fontSize: "clamp(2.5rem, 7vw, 5rem)",
                lineHeight: 0.95,
                letterSpacing: 0,
                maxWidth: "10ch",
              }}
            >
              Your errand is live.
            </h1>
            <p className="mt-6 text-base leading-relaxed max-w-[58ch]" style={{ color: "var(--color-text-2)" }}>
              Funds are locked in Trustless Work escrow. You will be redirected to the errand in{" "}
              <span className="mono" style={{ color: "var(--color-text)" }}>
                {seconds}s
              </span>
              .
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={errandHref}>
                <Button type="button" variant="primary">
                  view errand now
                </Button>
              </Link>
              {viewerHref && (
                <a
                  href={viewerHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mono text-xs uppercase tracking-[0.08em] press inline-flex items-center"
                  style={{
                    color: "var(--color-text)",
                    border: "1px solid var(--color-rule-strong)",
                    padding: "0.75rem 1rem",
                  }}
                >
                  view trustless escrow ↗
                </a>
              )}
            </div>
          </div>

          <aside className="hairline p-5 lg:p-6" style={{ background: "var(--color-bg-2)" }}>
            <p className="eyebrow mb-3">locked amount</p>
            <MoneyDisplay amount={Number.isFinite(amount) ? amount : 0} size="lg" tone="ok" />
            <dl className="mt-6 hairline-t pt-4 grid grid-cols-[1fr_auto] gap-y-3 text-xs">
              <dt className="mono uppercase tracking-[0.06em]" style={{ color: "var(--color-text-3)" }}>
                errand
              </dt>
              <dd className="text-right truncate max-w-[190px]" style={{ color: "var(--color-text)" }}>
                {title}
              </dd>
              {padi && (
                <>
                  <dt className="mono uppercase tracking-[0.06em]" style={{ color: "var(--color-text-3)" }}>
                    padi
                  </dt>
                  <dd className="text-right" style={{ color: "var(--color-text)" }}>
                    {padiProfile?.name ?? shortAddr(padi)}
                    <span className="mono block mt-1" style={{ color: "var(--color-text-3)" }}>
                      {shortAddr(padi)}
                    </span>
                  </dd>
                </>
              )}
              {contract && (
                <>
                  <dt className="mono uppercase tracking-[0.06em]" style={{ color: "var(--color-text-3)" }}>
                    escrow
                  </dt>
                  <dd className="mono text-right" style={{ color: "var(--color-text)" }}>
                    {shortAddr(contract)}
                  </dd>
                </>
              )}
            </dl>

            <div className="mt-5 hairline-t pt-4 space-y-3">
              {viewerHref ? (
                <a
                  href={viewerHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mono text-xs uppercase tracking-[0.08em] block underline underline-offset-2"
                  style={{ color: "var(--color-ok)" }}
                >
                  trustless work viewer ↗
                </a>
              ) : (
                <p className="mono text-xs uppercase tracking-[0.08em]" style={{ color: "var(--color-text-4)" }}>
                  trustless viewer pending
                </p>
              )}
              {tx ? (
                <a
                  href={stellarExpertTxUrl(tx)}
                  target="_blank"
                  rel="noreferrer"
                  className="mono text-xs uppercase tracking-[0.08em] block underline underline-offset-2"
                  style={{ color: "var(--color-text-2)" }}
                  title={tx}
                >
                  funding tx {shortAddr(tx)} ↗
                </a>
              ) : (
                <p className="mono text-xs uppercase tracking-[0.08em]" style={{ color: "var(--color-text-4)" }}>
                  funding tx pending
                </p>
              )}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

function PostErrandSuccessShell() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 w-full max-w-[1120px] mx-auto px-4 sm:px-8 lg:px-10 py-10 lg:py-16">
        <p className="eyebrow" style={{ color: "var(--color-text-3)" }}>
          loading funded errand…
        </p>
      </main>
    </div>
  );
}

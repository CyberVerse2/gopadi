import Link from "next/link";
import Navbar from "./components/Navbar";
import { MoneyDisplay, MoneyInline } from "./components/MoneyDisplay";

const STEPS = [
  {
    n: "01",
    title: "Post the errand",
    body: "Describe what you need bought, picked up, or delivered. Set a budget and deadline.",
  },
  {
    n: "02",
    title: "A Padi accepts",
    body: "A local runner takes the task and becomes responsible for finishing it.",
  },
  {
    n: "03",
    title: "Fund escrow",
    body: "The customer locks the full amount in a Trustless Work contract before the Padi starts.",
  },
  {
    n: "04",
    title: "Padi delivers, uploads proof",
    body: "A completion note and an optional evidence link. Funds stay locked until the customer confirms.",
  },
  {
    n: "05",
    title: "Release on confirm",
    body: "The customer signs to release, or opens a dispute. A resolver settles edge cases.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* HERO */}
        <section className="pt-14 lg:pt-24 pb-20 lg:pb-32 grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-12 items-end">
          <div className="lg:col-span-8">
            <p
              className="mono text-xs uppercase tracking-[0.08em] mb-6"
              style={{ color: "var(--color-text-3)" }}
            >
              GoPadi · local errands with escrow
            </p>
            <h1
              style={{
                color: "var(--color-text)",
                fontWeight: 800,
                fontSize: "clamp(2.75rem, 7.5vw, 6.5rem)",
                lineHeight: 0.98,
                letterSpacing: "-0.03em",
              }}
            >
              local errands{" "}
              <span style={{ color: "var(--color-signal)" }}>without</span>
              <br />
              blind trust.
            </h1>
            <p
              className="mt-8 max-w-[58ch] text-base leading-relaxed"
              style={{ color: "var(--color-text-2)" }}
            >
              Hand off a market run, a fuel pickup, or a pharmacy errand to
              someone nearby. The money sits in a Trustless Work contract until
              the Padi delivers and you confirm. Neither side moves funds alone.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="/post-errand"
                className="mono text-xs uppercase tracking-[0.08em] press"
                style={{
                  background: "var(--color-signal)",
                  color: "var(--color-signal-ink)",
                  padding: "0.875rem 1.25rem",
                  border: "1px solid var(--color-signal)",
                }}
              >
                Post an errand →
              </Link>
              <Link
                href="/errands"
                className="mono text-xs uppercase tracking-[0.08em] press"
                style={{
                  color: "var(--color-text)",
                  padding: "0.875rem 1.25rem",
                  border: "1px solid var(--color-rule-strong)",
                }}
              >
                Browse work
              </Link>
            </div>
          </div>

          {/* Live escrow specimen — what the product actually is */}
          <aside className="lg:col-span-4">
            <div
              className="hairline p-5"
              style={{ background: "var(--color-bg-2)" }}
            >
              <div className="flex items-baseline justify-between mb-4">
                <p className="eyebrow">specimen errand</p>
                <span
                  className="mono text-[0.625rem] uppercase tracking-[0.08em] inline-flex items-center gap-1.5"
                  style={{ color: "var(--color-signal)" }}
                >
                  <span
                    aria-hidden
                    className="inline-block rounded-full"
                    style={{
                      width: 6,
                      height: 6,
                      background: "var(--color-signal)",
                      animation:
                        "signal-pulse 1800ms var(--ease-out-quint) infinite",
                    }}
                  />
                  funded
                </span>
              </div>
              <p
                className="leading-tight"
                style={{
                  color: "var(--color-text)",
                  fontWeight: 700,
                  fontSize: "1.125rem",
                }}
              >
                Buy 2kg rice, 1L oil, tomato paste from Ogbete
              </p>
              <p
                className="mono text-xs mt-2"
                style={{ color: "var(--color-text-3)" }}
              >
                Ogbete market → UNN female hostel
              </p>

              <div className="mt-5 hairline-t pt-4">
                <p className="eyebrow mb-2">locked in escrow</p>
                <MoneyDisplay amount={30} size="lg" tone="default" />
                <dl className="mt-3 grid grid-cols-[1fr_auto] gap-y-1 text-xs">
                  <dt
                    className="mono uppercase tracking-[0.06em]"
                    style={{ color: "var(--color-text-3)" }}
                  >
                    item budget
                  </dt>
                  <dd className="mono text-right">
                    <MoneyInline amount={25} tone="muted" />
                  </dd>
                  <dt
                    className="mono uppercase tracking-[0.06em]"
                    style={{ color: "var(--color-text-3)" }}
                  >
                    padi fee
                  </dt>
                  <dd className="mono text-right">
                    <MoneyInline amount={5} tone="signal" />
                  </dd>
                </dl>
              </div>
            </div>
          </aside>
        </section>

        {/* PROCESS — five hairline rows, not a card grid */}
        <section className="py-16 lg:py-24 hairline-t">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-8 mb-10 items-baseline">
            <p
              className="eyebrow lg:col-span-3"
              style={{ color: "var(--color-text-3)" }}
            >
              how it works
            </p>
            <h2
              className="lg:col-span-9"
              style={{
                color: "var(--color-text)",
                fontWeight: 800,
                fontSize: "clamp(1.75rem, 4vw, 3rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              Five steps. The money only moves after{" "}
              <span style={{ color: "var(--color-signal)" }}>
                proof, confirmation, or dispute resolution.
              </span>
            </h2>
          </div>

          <ol className="hairline-t">
            {STEPS.map((s) => (
              <li
                key={s.n}
                className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-3 py-8 hairline-b items-baseline"
              >
                <span
                  className="display lg:col-span-2"
                  style={{
                    color: "var(--color-signal)",
                    fontSize: "clamp(2.25rem, 4vw, 3.25rem)",
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {s.n}
                </span>
                <h3
                  className="lg:col-span-4"
                  style={{
                    color: "var(--color-text)",
                    fontWeight: 700,
                    fontSize: "1.25rem",
                    lineHeight: 1.15,
                  }}
                >
                  {s.title}
                </h3>
                <p
                  className="lg:col-span-6 max-w-[55ch] leading-relaxed"
                  style={{ color: "var(--color-text-2)" }}
                >
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* TWO-COLUMN VALUE */}
        <section className="py-16 lg:py-24 grid grid-cols-1 sm:grid-cols-2 gap-px hairline-t hairline-b" style={{ background: "var(--color-rule)" }}>
          <div
            className="px-6 py-8 lg:px-10 lg:py-12"
            style={{ background: "var(--color-bg)" }}
          >
            <p className="eyebrow mb-4">for customers</p>
            <p
              className="leading-snug max-w-[42ch]"
              style={{
                color: "var(--color-text)",
                fontWeight: 700,
                fontSize: "1.5rem",
              }}
            >
              Your money stays protected until the errand is completed.
            </p>
            <p
              className="mt-4 max-w-[55ch] leading-relaxed text-sm"
              style={{ color: "var(--color-text-2)" }}
            >
              If the Padi doesn't deliver, open a dispute. A resolver reviews
              the proof, then the contract enforces the release or refund.
            </p>
          </div>
          <div
            className="px-6 py-8 lg:px-10 lg:py-12"
            style={{ background: "var(--color-bg)" }}
          >
            <p
              className="eyebrow mb-4"
              style={{ color: "var(--color-signal)" }}
            >
              for padis
            </p>
            <p
              className="leading-snug max-w-[42ch]"
              style={{
                color: "var(--color-text)",
                fontWeight: 700,
                fontSize: "1.5rem",
              }}
            >
              Payment is locked before you start. You can see it.
            </p>
            <p
              className="mt-4 max-w-[55ch] leading-relaxed text-sm"
              style={{ color: "var(--color-text-2)" }}
            >
              No chasing customers, no "I'll send it later." The escrow
              contract holds the funds. Complete the task, upload proof, get
              paid in USDC.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 lg:py-32 grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-10 items-end">
          <div className="lg:col-span-7">
            <p
              className="eyebrow mb-4"
              style={{ color: "var(--color-signal)" }}
            >
              ready when you are
            </p>
            <h2
              style={{
                color: "var(--color-text)",
                fontWeight: 800,
                fontSize: "clamp(2.25rem, 5.5vw, 4.5rem)",
                lineHeight: 1,
                letterSpacing: "-0.03em",
              }}
            >
              Send someone nearby with{" "}
              <span style={{ color: "var(--color-signal)" }}>
                payment already protected.
              </span>
            </h2>
          </div>
          <div className="lg:col-span-5 flex flex-col gap-3">
            <Link
              href="/post-errand"
              className="mono text-xs uppercase tracking-[0.08em] press flex items-center justify-between gap-4"
              style={{
                background: "var(--color-signal)",
                color: "var(--color-signal-ink)",
                padding: "1rem 1.25rem",
                border: "1px solid var(--color-signal)",
              }}
            >
              Post an errand
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/errands"
              className="mono text-xs uppercase tracking-[0.08em] press flex items-center justify-between gap-4"
              style={{
                color: "var(--color-text)",
                padding: "1rem 1.25rem",
                border: "1px solid var(--color-rule-strong)",
              }}
            >
              Become a Padi
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>

        <footer className="hairline-t py-8 flex flex-wrap items-baseline justify-between gap-3">
          <span
            className="mono text-xs"
            style={{ color: "var(--color-text)" }}
          >
            <span style={{ color: "var(--color-text-3)" }}>/</span>
            <span style={{ fontWeight: 600 }}>gopadi</span>
          </span>
          <span
            className="mono text-xs"
            style={{ color: "var(--color-text-3)" }}
          >
            local errands · Trustless Work on Stellar
          </span>
          <span
            className="mono text-xs uppercase tracking-[0.08em]"
            style={{ color: "var(--color-text-4)" }}
          >
            © 2026
          </span>
        </footer>
      </main>
    </div>
  );
}

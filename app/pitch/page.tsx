"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MoneyDisplay, MoneyInline } from "../components/MoneyDisplay";

const SLIDES = [
  { n: "01", key: "cover", label: "cover" },
  { n: "02", key: "problem", label: "problem" },
  { n: "03", key: "solution", label: "solution" },
  { n: "04", key: "trustless", label: "trustless work" },
  { n: "05", key: "demo", label: "live demo" },
  { n: "06", key: "gtm", label: "go to market" },
  { n: "07", key: "team", label: "team" },
  { n: "08", key: "conclusion", label: "conclusion" },
];

const TOTAL = SLIDES.length;

export default function PitchDeck() {
  const [current, setCurrent] = useState(() => {
    if (typeof window === "undefined") return 0;
    const hash = window.location.hash.slice(1);
    const i = SLIDES.findIndex((s) => s.key === hash);
    return i >= 0 ? i : 0;
  });

  // Reflect current slide in URL hash without polluting history.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const target = `#${SLIDES[current].key}`;
    if (window.location.hash !== target) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${target}`,
      );
    }
  }, [current]);

  const next = useCallback(() => {
    setCurrent((c) => Math.min(c + 1, TOTAL - 1));
  }, []);
  const prev = useCallback(() => {
    setCurrent((c) => Math.max(c - 1, 0));
  }, []);
  const jump = useCallback((i: number) => {
    setCurrent(Math.max(0, Math.min(TOTAL - 1, i)));
  }, []);

  // Keyboard navigation.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) {
        return;
      }
      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
        case " ":
          e.preventDefault();
          next();
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          prev();
          break;
        case "Home":
          e.preventDefault();
          jump(0);
          break;
        case "End":
          e.preventDefault();
          jump(TOTAL - 1);
          break;
        default:
          if (e.key >= "1" && e.key <= "9") {
            const i = parseInt(e.key, 10) - 1;
            if (i < TOTAL) {
              e.preventDefault();
              jump(i);
            }
          }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, jump]);

  const slide = SLIDES[current];
  const atStart = current === 0;
  const atEnd = current === TOTAL - 1;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top chrome — back link + slide counter */}
      <header
        className="hairline-b shrink-0"
        style={{ background: "var(--color-bg)" }}
      >
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 h-12 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="mono text-xs uppercase tracking-[0.08em] press"
            style={{ color: "var(--color-text-3)" }}
          >
            ← back to gopadi
          </Link>
          <p
            className="mono uppercase tracking-[0.08em] text-xs"
            style={{ color: "var(--color-text-3)" }}
          >
            <span style={{ color: "var(--color-text)" }}>{slide.n}</span>
            <span style={{ color: "var(--color-text-4)" }}>
              {" "}/ {String(TOTAL).padStart(2, "0")}
            </span>
            <span style={{ color: "var(--color-text-4)" }}> · </span>
            {slide.label}
          </p>
        </div>
      </header>

      {/* Slide stage — only the current slide is visible. key forces
          remount so the fade-in transition replays on each change.
          min-h-0 lets the flex parent constrain the height; min-h-full
          on the inner wrapper plus justify-center vertically centers
          slides that don't fill the viewport. Slides that are taller
          than the viewport still scroll naturally. */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div
          key={current}
          className="motion-fade-in min-h-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10 flex flex-col justify-center"
        >
          <SlideBody index={current} />
        </div>
      </main>

      {/* Bottom nav — prev / dots / next */}
      <footer
        className="hairline-t shrink-0"
        style={{ background: "var(--color-bg)" }}
      >
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 h-14 flex items-center justify-between gap-6">
          <button
            type="button"
            onClick={prev}
            disabled={atStart}
            aria-label="previous slide"
            className="mono text-xs uppercase tracking-[0.08em] press disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              color: "var(--color-text)",
              padding: "0.5rem 0.875rem",
              border: "1px solid var(--color-rule-strong)",
            }}
          >
            ← prev
          </button>

          {/* Progress dots — click to jump */}
          <nav
            className="flex items-center gap-2"
            aria-label="slide navigation"
          >
            {SLIDES.map((s, i) => {
              const active = i === current;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => jump(i)}
                  aria-label={`go to slide ${i + 1}: ${s.label}`}
                  aria-current={active ? "step" : undefined}
                  title={`${s.n} · ${s.label}`}
                  className="press"
                  style={{
                    width: active ? 24 : 8,
                    height: 8,
                    background: active
                      ? "var(--color-signal)"
                      : i < current
                        ? "var(--color-text-3)"
                        : "var(--color-rule-strong)",
                    transition: "width 200ms var(--ease-out-quint), background 200ms",
                  }}
                />
              );
            })}
          </nav>

          <button
            type="button"
            onClick={next}
            disabled={atEnd}
            aria-label="next slide"
            className="mono text-xs uppercase tracking-[0.08em] press disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: atEnd ? "var(--color-bg-2)" : "var(--color-signal)",
              color: atEnd
                ? "var(--color-text-3)"
                : "var(--color-signal-ink)",
              padding: "0.5rem 0.875rem",
              border: `1px solid ${atEnd ? "var(--color-rule-strong)" : "var(--color-signal)"}`,
            }}
          >
            next →
          </button>
        </div>
      </footer>
    </div>
  );
}

/* ────────────────  SLIDE DISPATCH  ──────────────── */

function SlideBody({ index }: { index: number }) {
  switch (index) {
    case 0:
      return <CoverSlide />;
    case 1:
      return <ProblemSlide />;
    case 2:
      return <SolutionSlide />;
    case 3:
      return <TrustlessSlide />;
    case 4:
      return <DemoSlide />;
    case 5:
      return <GtmSlide />;
    case 6:
      return <TeamSlide />;
    case 7:
      return <ConclusionSlide />;
    default:
      return null;
  }
}

/* ────────────────  SLIDES  ──────────────── */

function CoverSlide() {
  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      <div>
        <h1
          className="display"
          style={{
            color: "var(--color-text)",
            fontSize: "clamp(3.5rem, 13vw, 11rem)",
            lineHeight: 0.86,
            letterSpacing: "-0.04em",
          }}
        >
          GoPadi
        </h1>
        <p
          className="mt-6 max-w-[36ch]"
          style={{
            color: "var(--color-text)",
            fontWeight: 700,
            fontSize: "clamp(1.25rem, 2.6vw, 2rem)",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          Local errands{" "}
          <span style={{ color: "var(--color-signal)" }}>protected by escrow.</span>
        </p>
      </div>

      <p
        className="max-w-[58ch] leading-relaxed"
        style={{ color: "var(--color-text-2)", fontSize: "1rem" }}
      >
        GoPadi helps people hire nearby Runners to buy essentials, pick up
        items, or complete small errands, with payment protected through
        Trustless Work escrow.
      </p>

      <div className="hairline-t pt-4">
        <p className="eyebrow mb-2">one-liner</p>
        <p
          className="max-w-[44ch]"
          style={{
            color: "var(--color-text)",
            fontWeight: 700,
            fontSize: "1.25rem",
            lineHeight: 1.2,
            letterSpacing: "-0.015em",
          }}
        >
          Post an errand. A trusted Padi accepts. Funds stay locked until the
          job is done.
        </p>
      </div>
    </div>
  );
}

function ProblemSlide() {
  return (
    <>
      <SlideHeading
        kicker="the problem"
        title={
          <>
            Everyday errands are still{" "}
            <span style={{ color: "var(--color-signal)" }}>
              messy, risky, and stressful.
            </span>
          </>
        }
      />
      <p
        className="max-w-[62ch] leading-relaxed mt-6"
        style={{ color: "var(--color-text-2)" }}
      >
        People need help buying foodstuff, fuel, groceries, medicine, or
        handling local pickups. The first problem is{" "}
        <em className="not-italic" style={{ color: "var(--color-text)" }}>
          discovery
        </em>{" "}
        — where do they find nearby Runners who are actually available? Even
        when they find someone, the second problem is{" "}
        <em className="not-italic" style={{ color: "var(--color-text)" }}>
          trust
        </em>{" "}
        — for money, items, and the responsibility to finish properly.
      </p>

      <div
        className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-px"
        style={{ background: "var(--color-rule)" }}
      >
        <WorryColumn
          label="customers worry"
          items={[
            "What if the Runner disappears with my money?",
            "What if they buy the wrong item?",
            "What if there is no proof?",
          ]}
        />
        <WorryColumn
          label="runners worry"
          tone="signal"
          items={[
            "What if I do the errand and the customer refuses to pay?",
            "What if I spend my time and transport money for nothing?",
          ]}
        />
      </div>

      <p
        className="mt-6 max-w-[60ch] leading-snug"
        style={{
          color: "var(--color-text)",
          fontWeight: 700,
          fontSize: "1.25rem",
          letterSpacing: "-0.015em",
        }}
      >
        This trust gap makes simple local errands harder than they should be.
      </p>
    </>
  );
}

function SolutionSlide() {
  return (
    <>
      <SlideHeading
        kicker="the solution"
        title={
          <>
            A safer errand marketplace for customers{" "}
            <span style={{ color: "var(--color-signal)" }}>
              and local Runners.
            </span>
          </>
        }
      />

      {/* Two-column on lg so all 7 steps fit a single viewport */}
      <ol className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-x-10 hairline-t">
        {[
          "Customer posts an errand.",
          "A Runner accepts it.",
          "Customer funds escrow.",
          "Runner completes the errand.",
          "Runner uploads proof.",
          "Customer confirms completion.",
          "Funds are released.",
        ].map((step, i) => (
          <li
            key={i}
            className="grid grid-cols-[2.5rem_1fr] gap-x-4 items-baseline py-3 hairline-b"
          >
            <span
              className="display"
              style={{
                color: i === 6 ? "var(--color-ok)" : "var(--color-signal)",
                fontSize: "1.875rem",
                fontWeight: 900,
                lineHeight: 0.9,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <p
              style={{
                color: "var(--color-text)",
                fontWeight: 600,
                fontSize: "1.0625rem",
                lineHeight: 1.3,
              }}
            >
              {step}
            </p>
          </li>
        ))}
      </ol>

      <p
        className="mt-6 max-w-[60ch] leading-snug"
        style={{
          color: "var(--color-text)",
          fontWeight: 700,
          fontSize: "1.25rem",
          letterSpacing: "-0.015em",
        }}
      >
        If something goes wrong, either side can open a dispute. GoPadi makes
        errands feel safer because{" "}
        <span style={{ color: "var(--color-signal)" }}>
          neither side has to rely on blind trust.
        </span>
      </p>
    </>
  );
}

function TrustlessSlide() {
  return (
    <>
      <SlideHeading
        kicker="infrastructure"
        title={
          <>
            Built on{" "}
            <span style={{ color: "var(--color-signal)" }}>
              Trustless Work single-release escrow.
            </span>
          </>
        }
      />

      <p
        className="mt-6 max-w-[62ch] leading-relaxed"
        style={{ color: "var(--color-text-2)" }}
      >
        Every money-backed errand is anchored to a Trustless Work escrow
        contract on Stellar. The protocol enforces the money; GoPadi
        documents the case.
      </p>

      {/* Two columns side-by-side so both tables share a slide */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8">
        <div>
          <p className="eyebrow mb-3">role mapping</p>
          <ul className="hairline-t">
            {[
              ["customer", "funder"],
              ["customer", "approver"],
              ["runner / padi", "receiver"],
              ["admin", "dispute resolver"],
              ["gopadi", "platform"],
            ].map(([left, right]) => (
              <li
                key={`${left}-${right}`}
                className="grid grid-cols-[1fr_auto_1fr] items-baseline gap-x-4 py-2.5 hairline-b"
              >
                <span
                  className="mono uppercase tracking-[0.08em] text-xs"
                  style={{ color: "var(--color-text)" }}
                >
                  {left}
                </span>
                <span
                  className="mono"
                  style={{ color: "var(--color-signal)", fontSize: "0.75rem" }}
                  aria-hidden
                >
                  →
                </span>
                <span
                  className="mono uppercase tracking-[0.08em] text-xs text-right"
                  style={{ color: "var(--color-text-2)" }}
                >
                  {right}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow mb-3">why it matters</p>
          <ul className="hairline-t">
            {[
              {
                who: "customer",
                point: "funds are not released until the task is completed.",
              },
              {
                who: "runner",
                point: "payment is already locked before they start work.",
              },
              {
                who: "either side",
                point:
                  "dispute flow lets a resolver release or refund funds.",
              },
            ].map((row, i) => (
              <li
                key={i}
                className="grid grid-cols-[6rem_1fr] gap-x-4 items-baseline py-2.5 hairline-b"
              >
                <span
                  className="mono uppercase tracking-[0.08em] text-[0.625rem]"
                  style={{ color: "var(--color-text-3)" }}
                >
                  {row.who}
                </span>
                <p
                  className="leading-snug text-sm"
                  style={{ color: "var(--color-text)" }}
                >
                  {row.point}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p
        className="mt-8 max-w-[60ch] leading-snug"
        style={{
          color: "var(--color-text)",
          fontWeight: 700,
          fontSize: "1.25rem",
          letterSpacing: "-0.015em",
        }}
      >
        Trustless Work is the infrastructure layer that makes GoPadi&apos;s
        trust promise{" "}
        <span style={{ color: "var(--color-signal)" }}>real.</span>
      </p>
    </>
  );
}

function DemoSlide() {
  return (
    <>
      <SlideHeading
        kicker="live demo"
        title={
          <>
            From errand to{" "}
            <span style={{ color: "var(--color-signal)" }}>escrow.</span>
          </>
        }
      />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-6 items-start">
        <ol className="lg:col-span-7 hairline-t">
          {[
            'Post an errand, like "Buy foodstuff from Ogbete Market."',
            "Show the errand appearing in the feed.",
            "Accept it as a Runner.",
            "Create and fund the Trustless Work escrow.",
            "Upload proof of completion.",
            "Confirm the errand as the customer.",
            "Show funds ready to be released to the Runner.",
            "Show the dispute option if either side disagrees.",
          ].map((step, i) => (
            <li
              key={i}
              className="grid grid-cols-[2.5rem_1fr] gap-x-4 items-baseline py-2 hairline-b"
            >
              <span
                className="mono text-xs"
                style={{ color: "var(--color-text-4)" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <p
                className="leading-snug text-sm"
                style={{ color: "var(--color-text)" }}
              >
                {step}
              </p>
            </li>
          ))}
        </ol>

        <aside className="lg:col-span-5">
          <div
            className="hairline p-5"
            style={{ background: "var(--color-bg-2)" }}
          >
            <div className="flex items-baseline justify-between mb-3">
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
              ogbete market → unn female hostel
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

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/post-errand"
              className="mono text-xs uppercase tracking-[0.08em] press"
              style={{
                background: "var(--color-signal)",
                color: "var(--color-signal-ink)",
                padding: "0.75rem 1rem",
                border: "1px solid var(--color-signal)",
              }}
            >
              post an errand →
            </Link>
            <Link
              href="/errands"
              className="mono text-xs uppercase tracking-[0.08em] press"
              style={{
                color: "var(--color-text)",
                padding: "0.75rem 1rem",
                border: "1px solid var(--color-rule-strong)",
              }}
            >
              see the feed
            </Link>
          </div>
        </aside>
      </div>

      <p
        className="mt-8 max-w-[60ch] leading-snug"
        style={{
          color: "var(--color-text)",
          fontWeight: 700,
          fontSize: "1.25rem",
          letterSpacing: "-0.015em",
        }}
      >
        This is not just a mock marketplace. The core flow is built around{" "}
        <span style={{ color: "var(--color-signal)" }}>
          escrow-backed errand completion.
        </span>
      </p>
    </>
  );
}

function GtmSlide() {
  return (
    <>
      <SlideHeading
        kicker="go to market"
        title={
          <>
            Start in{" "}
            <span style={{ color: "var(--color-signal)" }}>
              dense local communities.
            </span>{" "}
            Earn trust before scale.
          </>
        }
      />

      <div
        className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-px hairline-t hairline-b"
        style={{ background: "var(--color-rule)" }}
      >
        <GtmCell
          label="beachhead"
          title="Nigerian university towns and dense local communities."
        />
        <GtmCell
          label="initial users"
          items={[
            "Students in hostels",
            "Busy workers",
            "Parents and families",
            "Market shoppers",
            "Local errand Runners looking for income",
          ]}
        />
        <GtmCell
          label="launch strategy"
          items={[
            "Start in high-density communities like Nsukka and Enugu.",
            "Recruit trusted first Runners manually.",
            "Seed common errands: foodstuff, fuel, groceries, medicine, package pickup.",
            "Use campus ambassadors and local WhatsApp groups.",
            "Build trust through visible proof, wallet-backed payments, and resolved dispute history.",
          ]}
        />
      </div>

      <p
        className="mt-6 max-w-[62ch] leading-snug"
        style={{
          color: "var(--color-text)",
          fontWeight: 700,
          fontSize: "1.25rem",
          letterSpacing: "-0.015em",
        }}
      >
        After proving repeat usage in one local market, GoPadi can expand
        city by city.
      </p>
    </>
  );
}

function TeamSlide() {
  return (
    <>
      <SlideHeading
        kicker="team"
        title={
          <>
            Built by a team that understands{" "}
            <span style={{ color: "var(--color-signal)" }}>
              local errand trust.
            </span>
          </>
        }
      />

      <p
        className="mt-6 max-w-[62ch] leading-relaxed"
        style={{ color: "var(--color-text-2)" }}
      >
        GoPadi is built from the reality of how errands actually happen in
        Nigerian communities: fast, mobile-first, informal, and
        trust-sensitive.
      </p>

      <div className="mt-8">
        <p className="eyebrow mb-3">what the team brings</p>
        <ul className="hairline-t">
          {[
            "Product thinking around local marketplaces",
            "Web and wallet integration experience",
            "Escrow-based transaction design",
            "Understanding of Nigerian user behavior",
            "Ability to ship fast and test with real flows",
          ].map((item, i) => (
            <li
              key={i}
              className="grid grid-cols-[2.5rem_1fr] gap-x-4 items-baseline py-2.5 hairline-b"
            >
              <span
                className="mono text-xs"
                style={{ color: "var(--color-text-4)" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <p
                style={{
                  color: "var(--color-text)",
                  fontSize: "0.9375rem",
                  lineHeight: 1.4,
                }}
              >
                {item}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <p
        className="mt-8 max-w-[58ch] leading-tight"
        style={{
          color: "var(--color-text)",
          fontWeight: 800,
          fontSize: "clamp(1.5rem, 2.8vw, 2.25rem)",
          letterSpacing: "-0.02em",
          lineHeight: 1.05,
        }}
      >
        We are not building another delivery app. We are building the{" "}
        <span style={{ color: "var(--color-signal)" }}>
          trust layer for local errands.
        </span>
      </p>
    </>
  );
}

function ConclusionSlide() {
  return (
    <>
      <SlideHeading
        kicker="conclusion"
        title={
          <>
            Everyday errands,{" "}
            <span style={{ color: "var(--color-signal)" }}>
              escrow-backed.
            </span>
          </>
        }
      />

      <div className="mt-8">
        <p className="eyebrow mb-3">gopadi adds</p>
        <ul className="hairline-t grid grid-cols-1 sm:grid-cols-2 gap-x-10">
          {[
            "A simple way to post errands",
            "A way for Runners to earn",
            "Escrow-backed payment protection",
            "Proof of completion",
            "Disputes when something goes wrong",
            "Dispute resolution when needed",
          ].map((item, i) => (
            <li
              key={i}
              className="grid grid-cols-[1.5rem_1fr] gap-x-3 items-baseline py-2 hairline-b"
            >
              <span
                className="mono text-xs"
                style={{ color: "var(--color-signal)" }}
              >
                +
              </span>
              <p style={{ color: "var(--color-text)", fontSize: "0.9375rem" }}>
                {item}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <p
        className="mt-8 max-w-[44ch]"
        style={{
          color: "var(--color-text)",
          fontWeight: 800,
          fontSize: "clamp(1.75rem, 4.2vw, 3.25rem)",
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        GoPadi makes it{" "}
        <span style={{ color: "var(--color-signal)" }}>easier</span> to ask
        for help,{" "}
        <span style={{ color: "var(--color-signal)" }}>safer</span> to run
        errands, and{" "}
        <span style={{ color: "var(--color-signal)" }}>fairer</span> for both
        sides.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/post-errand"
          className="mono text-xs uppercase tracking-[0.08em] press"
          style={{
            background: "var(--color-signal)",
            color: "var(--color-signal-ink)",
            padding: "1rem 1.25rem",
            border: "1px solid var(--color-signal)",
          }}
        >
          post an errand →
        </Link>
        <Link
          href="/errands"
          className="mono text-xs uppercase tracking-[0.08em] press"
          style={{
            color: "var(--color-text)",
            padding: "1rem 1.25rem",
            border: "1px solid var(--color-rule-strong)",
          }}
        >
          see the feed
        </Link>
      </div>
    </>
  );
}

/* ────────────────  SHARED BITS  ──────────────── */

function SlideHeading({
  kicker,
  title,
}: {
  kicker: string;
  title: React.ReactNode;
}) {
  return (
    <div>
      <p className="eyebrow mb-3">{kicker}</p>
      <h2
        style={{
          color: "var(--color-text)",
          fontWeight: 800,
          fontSize: "clamp(1.75rem, 3.8vw, 3rem)",
          lineHeight: 1.05,
          letterSpacing: "-0.025em",
          maxWidth: "22ch",
        }}
      >
        {title}
      </h2>
    </div>
  );
}

function WorryColumn({
  label,
  items,
  tone = "default",
}: {
  label: string;
  items: string[];
  tone?: "default" | "signal";
}) {
  return (
    <div className="px-5 py-6" style={{ background: "var(--color-bg)" }}>
      <p
        className="eyebrow mb-4"
        style={{
          color: tone === "signal" ? "var(--color-signal)" : "var(--color-text-3)",
        }}
      >
        {label}
      </p>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li
            key={i}
            className="grid grid-cols-[1.5rem_1fr] gap-x-3 items-baseline"
          >
            <span
              className="mono text-xs"
              style={{ color: "var(--color-text-4)" }}
            >
              ?
            </span>
            <p className="leading-snug" style={{ color: "var(--color-text)" }}>
              {item}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GtmCell({
  label,
  title,
  items,
}: {
  label: string;
  title?: string;
  items?: string[];
}) {
  return (
    <div
      className="px-5 py-6 lg:px-6 lg:py-8"
      style={{ background: "var(--color-bg)" }}
    >
      <p className="eyebrow mb-4">{label}</p>
      {title && (
        <p
          className="leading-snug"
          style={{
            color: "var(--color-text)",
            fontWeight: 700,
            fontSize: "1.25rem",
          }}
        >
          {title}
        </p>
      )}
      {items && (
        <ul className="space-y-3 mt-1">
          {items.map((item, i) => (
            <li
              key={i}
              className="grid grid-cols-[1.25rem_1fr] gap-x-3 items-baseline"
            >
              <span
                className="mono text-xs"
                style={{ color: "var(--color-signal)" }}
              >
                +
              </span>
              <p
                className="text-sm leading-snug"
                style={{ color: "var(--color-text)" }}
              >
                {item}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import Link from "next/link";
import Navbar from "./components/Navbar";
import { MoneyDisplay, MoneyInline } from "./components/MoneyDisplay";
import { Reveal, RevealGroup } from "./components/Reveal";

const CATEGORIES = [
  {
    tag: "01 / market runs",
    title: "Rice, oil, foodstuff",
    body: "Provisions, toiletries, hostel essentials. Anything a nearby market or shop carries.",
    items: ["rice 2kg", "palm oil", "tomato", "pepper", "garri", "soap"],
    span: "wide" as const,
    art: <MarketPlate />,
  },
  {
    tag: "02 / pharmacy pickup",
    title: "Medicine, baby supplies",
    body: "Wellness items, urgent personal needs, things you cannot leave the hostel for.",
    items: ["paracetamol", "diapers", "ORS", "plaster"],
    span: "narrow" as const,
    art: <PharmacyPlate />,
  },
  {
    tag: "03 / fuel & utilities",
    title: "Fuel, prepaid meter",
    body: "Fuel pickup, prepaid meter help, small neighborhood tasks that eat your afternoon.",
    items: ["PMS 5L", "meter token", "gas refill"],
    span: "narrow" as const,
    art: <FuelPlate />,
  },
  {
    tag: "04 / documents & packages",
    title: "Receipts, forms, parcels",
    body: "Campus-to-campus delivery. Documents that need to physically move across town.",
    items: ["transcript", "ID card", "parcel", "letter"],
    span: "wide" as const,
    art: <DocumentsPlate />,
  },
];

function PlateFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div
      className="relative hairline lift"
      style={{
        background: "var(--color-bg-2)",
        aspectRatio: "16 / 10",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-text) 1px, transparent 1px), linear-gradient(90deg, var(--color-text) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center p-6">
        {children}
      </div>
      <span
        className="mono absolute left-3 top-3 text-[0.625rem] uppercase tracking-[0.08em]"
        style={{ color: "var(--color-text-3)" }}
      >
        plate · {label}
      </span>
      <span
        className="mono absolute right-3 bottom-3 text-[0.625rem] uppercase tracking-[0.08em]"
        style={{ color: "var(--color-text-4)" }}
      >
        gopadi specimen
      </span>
    </div>
  );
}

function MarketPlate() {
  return (
    <PlateFrame label="m-01">
      <svg
        viewBox="0 0 320 180"
        className="w-full h-full"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="square"
        style={{ color: "var(--color-text)" }}
      >
        {/* ground line */}
        <line x1="20" y1="158" x2="300" y2="158" />
        {/* rice sack */}
        <path d="M50 158 L50 78 Q50 60 70 56 L100 56 Q120 60 120 78 L120 158 Z" />
        <line x1="60" y1="72" x2="110" y2="72" />
        <text x="68" y="118" fontFamily="ui-monospace, monospace" fontSize="9" fill="currentColor" stroke="none">
          RICE 2KG
        </text>
        {/* rice tie */}
        <path
          d="M78 56 Q85 44 92 56 M82 56 Q85 50 88 56"
          style={{ color: "var(--color-signal)" }}
          stroke="currentColor"
        />
        {/* oil bottle */}
        <rect x="148" y="98" width="38" height="60" />
        <path d="M156 98 L156 82 L178 82 L178 98" />
        <rect x="158" y="72" width="18" height="10" style={{ color: "var(--color-signal)" }} stroke="currentColor" fill="currentColor" />
        <line x1="153" y1="118" x2="181" y2="118" />
        <text x="156" y="138" fontFamily="ui-monospace, monospace" fontSize="8" fill="currentColor" stroke="none">
          PALM 1L
        </text>
        {/* tomato */}
        <circle cx="222" cy="138" r="20" />
        <path d="M222 118 L218 110 M222 118 L222 108 M222 118 L226 110" style={{ color: "var(--color-signal)" }} stroke="currentColor" />
        {/* pepper */}
        <path d="M262 132 Q278 122 286 138 Q282 150 270 152 Q258 148 262 132 Z" style={{ color: "var(--color-signal)" }} stroke="currentColor" />
        <path d="M262 132 L256 124" style={{ color: "var(--color-signal)" }} stroke="currentColor" />
      </svg>
    </PlateFrame>
  );
}

function PharmacyPlate() {
  return (
    <PlateFrame label="p-02">
      <svg
        viewBox="0 0 320 180"
        className="w-full h-full"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="square"
        style={{ color: "var(--color-text)" }}
      >
        <line x1="20" y1="158" x2="300" y2="158" />
        {/* blister pack */}
        <rect x="40" y="58" width="140" height="80" />
        {[0, 1, 2, 3].map((c) =>
          [0, 1].map((r) => (
            <ellipse
              key={`${c}-${r}`}
              cx={68 + c * 32}
              cy={82 + r * 32}
              rx={11}
              ry={8}
              style={r === 0 && c === 1 ? { color: "var(--color-signal)" } : undefined}
              stroke="currentColor"
            />
          ))
        )}
        <text x="44" y="50" fontFamily="ui-monospace, monospace" fontSize="8" fill="currentColor" stroke="none">
          BLISTER · 8 × 500MG
        </text>
        {/* bottle */}
        <path d="M212 158 L212 92 Q212 84 220 84 L256 84 Q264 84 264 92 L264 158 Z" />
        <rect x="218" y="72" width="40" height="12" />
        <line x1="216" y1="108" x2="260" y2="108" />
        {/* cross */}
        <rect x="228" y="118" width="20" height="6" style={{ color: "var(--color-signal)" }} stroke="currentColor" fill="currentColor" />
        <rect x="235" y="111" width="6" height="20" style={{ color: "var(--color-signal)" }} stroke="currentColor" fill="currentColor" />
      </svg>
    </PlateFrame>
  );
}

function FuelPlate() {
  return (
    <PlateFrame label="f-03">
      <svg
        viewBox="0 0 320 180"
        className="w-full h-full"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="square"
        style={{ color: "var(--color-text)" }}
      >
        <line x1="20" y1="158" x2="300" y2="158" />
        {/* jerry can body */}
        <path d="M70 158 L70 70 L130 60 L210 60 L210 158 Z" />
        {/* handle */}
        <path d="M130 60 L130 44 L168 44 L168 60" />
        {/* spout cap */}
        <rect x="172" y="32" width="22" height="14" style={{ color: "var(--color-signal)" }} stroke="currentColor" fill="currentColor" />
        <line x1="183" y1="46" x2="183" y2="60" />
        {/* ribbing */}
        <line x1="80" y1="90" x2="200" y2="90" />
        <line x1="80" y1="120" x2="200" y2="120" />
        <line x1="80" y1="150" x2="200" y2="150" />
        {/* stencil */}
        <text x="98" y="112" fontFamily="ui-monospace, monospace" fontSize="14" fontWeight="700" fill="currentColor" stroke="none">
          PMS 5L
        </text>
        {/* meter dial */}
        <circle cx="260" cy="120" r="28" />
        <line x1="260" y1="120" x2="260" y2="98" style={{ color: "var(--color-signal)" }} stroke="currentColor" strokeWidth={1.5} />
        <circle cx="260" cy="120" r="2" fill="currentColor" stroke="none" />
        <text x="244" y="158" fontFamily="ui-monospace, monospace" fontSize="7" fill="currentColor" stroke="none">
          METER
        </text>
      </svg>
    </PlateFrame>
  );
}

function DocumentsPlate() {
  return (
    <PlateFrame label="d-04">
      <svg
        viewBox="0 0 320 180"
        className="w-full h-full"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="square"
        style={{ color: "var(--color-text)" }}
      >
        <line x1="20" y1="158" x2="300" y2="158" />
        {/* folded letter behind */}
        <rect x="36" y="40" width="120" height="84" />
        <line x1="48" y1="60" x2="142" y2="60" />
        <line x1="48" y1="74" x2="142" y2="74" />
        <line x1="48" y1="88" x2="120" y2="88" />
        <line x1="48" y1="102" x2="132" y2="102" />
        {/* envelope */}
        <rect x="120" y="68" width="160" height="90" />
        <path d="M120 68 L200 130 L280 68" />
        {/* stamp */}
        <rect x="240" y="78" width="32" height="22" style={{ color: "var(--color-signal)" }} stroke="currentColor" />
        <text x="244" y="93" fontFamily="ui-monospace, monospace" fontSize="7" fill="currentColor" stroke="none" style={{ color: "var(--color-signal)" }}>
          USDC ·
        </text>
        {/* dotted perforation hint */}
        <line x1="240" y1="78" x2="272" y2="78" strokeDasharray="2 2" style={{ color: "var(--color-signal)" }} stroke="currentColor" />
        <line x1="240" y1="100" x2="272" y2="100" strokeDasharray="2 2" style={{ color: "var(--color-signal)" }} stroke="currentColor" />
        {/* address lines */}
        <line x1="132" y1="138" x2="200" y2="138" />
        <line x1="132" y1="148" x2="180" y2="148" />
      </svg>
    </PlateFrame>
  );
}

type StepActor = "customer" | "padi" | "both";
type EscrowState = "empty" | "locked" | "released";
type FlowDir = "none" | "in" | "proof" | "out";

const STEPS: Array<{
  n: string;
  title: string;
  body: string;
  verb: string;
  actor: StepActor;
  escrowState: EscrowState;
  escrowFill: number; // 0 — 1
  balance: number; // USDC
  flow: FlowDir;
}> = [
  {
    n: "01",
    title: "Post the errand",
    body: "Describe what you need, where to pick it up, where it should go, and the item budget.",
    verb: "posted",
    actor: "customer",
    escrowState: "empty",
    escrowFill: 0,
    balance: 0,
    flow: "none",
  },
  {
    n: "02",
    title: "A Padi accepts",
    body: "A nearby runner takes the job and becomes responsible for completing it.",
    verb: "accepted",
    actor: "padi",
    escrowState: "empty",
    escrowFill: 0,
    balance: 0,
    flow: "none",
  },
  {
    n: "03",
    title: "Fund escrow",
    body: "The customer locks the item budget and Padi fee in a Trustless Work escrow before work starts.",
    verb: "funded",
    actor: "customer",
    escrowState: "locked",
    escrowFill: 1,
    balance: 30,
    flow: "in",
  },
  {
    n: "04",
    title: "Padi delivers proof",
    body: "The Padi completes the errand and submits a completion note, with an optional evidence link.",
    verb: "proven",
    actor: "padi",
    escrowState: "locked",
    escrowFill: 1,
    balance: 30,
    flow: "proof",
  },
  {
    n: "05",
    title: "Release or dispute",
    body: "If everything checks out, the customer releases payment. If something is off, either side can open a dispute.",
    verb: "released",
    actor: "customer",
    escrowState: "released",
    escrowFill: 0,
    balance: 30,
    flow: "out",
  },
];

function StateBadge({ state }: { state: EscrowState }) {
  const color =
    state === "locked"
      ? "var(--color-signal)"
      : state === "released"
      ? "var(--color-ok)"
      : "var(--color-text-3)";
  return (
    <span
      className="mono text-[0.625rem] uppercase tracking-[0.08em] inline-flex items-center gap-1.5"
      style={{ color }}
    >
      <span
        aria-hidden
        className="inline-block"
        style={{ width: 6, height: 6, background: color }}
      />
      {state}
    </span>
  );
}

function FlowLane({
  actor,
  flow,
  escrowState,
  balance,
}: {
  actor: StepActor;
  flow: FlowDir;
  escrowState: EscrowState;
  balance: number;
}) {
  const cellBase =
    "hairline px-3 py-3 flex flex-col gap-1 min-w-0";
  const isCustomer = actor === "customer" || actor === "both";
  const isPadi = actor === "padi" || actor === "both";

  const dot = (active: boolean, signal: boolean) => (
    <span
      aria-hidden
      className="inline-block"
      style={{
        width: 8,
        height: 8,
        background: active
          ? signal
            ? "var(--color-signal)"
            : "var(--color-text)"
          : "transparent",
        border: active
          ? "none"
          : "1px solid var(--color-rule-strong)",
      }}
    />
  );

  const arrowLeft = flow === "in" || flow === "proof";
  const arrowRight = flow === "out";

  return (
    <div className="w-full">
      <div className="grid grid-cols-[1fr_auto_1.4fr_auto_1fr] items-stretch gap-0">
        {/* customer cell */}
        <div
          className={cellBase}
          style={{
            background: isCustomer ? "var(--color-bg-2)" : "transparent",
            borderColor: isCustomer
              ? "var(--color-rule-strong)"
              : "var(--color-rule)",
          }}
        >
          <span
            className="mono text-[0.625rem] uppercase tracking-[0.08em]"
            style={{ color: "var(--color-text-3)" }}
          >
            customer
          </span>
          <div className="flex items-center gap-2">
            {dot(isCustomer, isCustomer && flow !== "proof")}
            <span
              className="mono text-[0.6875rem]"
              style={{
                color: isCustomer
                  ? "var(--color-text)"
                  : "var(--color-text-4)",
              }}
            >
              {isCustomer ? "acts" : "—"}
            </span>
          </div>
        </div>

        {/* arrow customer→escrow (in) */}
        <div
          className="flex items-center justify-center px-2"
          aria-hidden
        >
          <span
            className="mono text-sm"
            style={{
              color: arrowLeft
                ? flow === "in"
                  ? "var(--color-signal)"
                  : "var(--color-text-3)"
                : "var(--color-text-4)",
            }}
          >
            {flow === "in" ? "→" : flow === "proof" ? "···" : "·"}
          </span>
        </div>

        {/* escrow cell */}
        <div
          className={cellBase}
          style={{
            background:
              escrowState === "locked"
                ? "var(--color-signal-soft)"
                : escrowState === "released"
                ? "var(--color-ok-soft)"
                : "var(--color-bg-2)",
            borderColor:
              escrowState === "locked"
                ? "var(--color-signal)"
                : escrowState === "released"
                ? "var(--color-ok)"
                : "var(--color-rule)",
          }}
        >
          <span
            className="mono text-[0.625rem] uppercase tracking-[0.08em]"
            style={{
              color:
                escrowState === "locked"
                  ? "var(--color-signal)"
                  : escrowState === "released"
                  ? "var(--color-ok)"
                  : "var(--color-text-3)",
            }}
          >
            escrow · {escrowState}
          </span>
          <span
            className="mono text-sm"
            style={{
              color:
                escrowState === "empty"
                  ? "var(--color-text-4)"
                  : "var(--color-text)",
              fontWeight: 600,
            }}
          >
            {balance > 0 ? `$${balance}.00` : "$0.00"}
          </span>
        </div>

        {/* arrow escrow→padi (out) */}
        <div
          className="flex items-center justify-center px-2"
          aria-hidden
        >
          <span
            className="mono text-sm"
            style={{
              color: arrowRight
                ? "var(--color-ok)"
                : "var(--color-text-4)",
            }}
          >
            {arrowRight ? "→" : "·"}
          </span>
        </div>

        {/* padi cell */}
        <div
          className={cellBase}
          style={{
            background: isPadi ? "var(--color-bg-2)" : "transparent",
            borderColor: isPadi
              ? "var(--color-rule-strong)"
              : "var(--color-rule)",
          }}
        >
          <span
            className="mono text-[0.625rem] uppercase tracking-[0.08em]"
            style={{ color: "var(--color-text-3)" }}
          >
            padi
          </span>
          <div className="flex items-center gap-2">
            {dot(isPadi, flow === "proof")}
            <span
              className="mono text-[0.6875rem]"
              style={{
                color: isPadi
                  ? "var(--color-text)"
                  : "var(--color-text-4)",
              }}
            >
              {isPadi ? (flow === "proof" ? "proof" : "acts") : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const PROOF_POINTS = [
  "Funds locked before work starts",
  "Padi fee visible upfront",
  "Proof required before release",
  "Dispute path when things go wrong",
  "Trustless Work escrow on Stellar",
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* HERO */}
        <RevealGroup autoActivate>
        <section className="pt-14 lg:pt-24 pb-20 lg:pb-32 grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-12 items-end">
          <div className="lg:col-span-8">
            <Reveal index={0}>
              <p
                className="mono text-xs uppercase tracking-[0.08em] mb-6"
                style={{ color: "var(--color-text-3)" }}
              >
                GoPadi · local errands with escrow
              </p>
            </Reveal>
            <Reveal index={1}>
              <h1
                style={{
                  color: "var(--color-text)",
                  fontWeight: 800,
                  fontSize: "clamp(2.5rem, 7vw, 6rem)",
                  lineHeight: 0.98,
                  letterSpacing: "-0.03em",
                }}
              >
                Run errands like your local plug,{" "}
                <span style={{ color: "var(--color-signal)" }}>but safer.</span>
              </h1>
            </Reveal>
            <Reveal index={2}>
              <p
                className="mt-8 max-w-[60ch] text-base leading-relaxed"
                style={{ color: "var(--color-text-2)" }}
              >
                GoPadi sends nearby Padis to buy, pick up, or deliver what you
                need. Market runs, pharmacy pickups, fuel, documents, hostel
                essentials. Post the errand, fund escrow, and release payment
                only when the job is done.
              </p>
            </Reveal>

            <Reveal index={3}>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link
                  href="/post-errand"
                  className="mono text-xs uppercase tracking-[0.08em] press cta-primary"
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
                  className="mono text-xs uppercase tracking-[0.08em] press cta-ghost"
                  style={{
                    color: "var(--color-text)",
                    padding: "0.875rem 1.25rem",
                    border: "1px solid var(--color-rule-strong)",
                  }}
                >
                  Earn as a Padi
                </Link>
              </div>
            </Reveal>

            <Reveal index={4}>
              <p
                className="mono text-xs uppercase tracking-[0.08em] mt-10 inline-flex items-center gap-2"
                style={{ color: "var(--color-text-3)" }}
              >
                <span
                  aria-hidden
                  className="inline-block"
                  style={{
                    width: 6,
                    height: 6,
                    background: "var(--color-signal)",
                  }}
                />
                Powered by Trustless Work escrow on Stellar
              </p>
            </Reveal>
          </div>

          {/* Live escrow specimen — what the product actually is */}
          <Reveal as="aside" index={5} className="lg:col-span-4">
            <div
              className="hairline p-5 lift"
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
          </Reveal>
        </section>
        </RevealGroup>

        {/* WHAT GOPADI IS */}
        <RevealGroup>
        <section className="py-16 lg:py-24 hairline-t grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-8 items-baseline">
          <Reveal index={0} className="lg:col-span-3">
            <p
              className="eyebrow"
              style={{ color: "var(--color-text-3)" }}
            >
              what gopadi is
            </p>
          </Reveal>
          <div className="lg:col-span-9">
            <Reveal index={1}>
              <h2
                style={{
                  color: "var(--color-text)",
                  fontWeight: 800,
                  fontSize: "clamp(1.75rem, 4vw, 3rem)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                }}
              >
                Everyday errands,{" "}
                <span style={{ color: "var(--color-signal)" }}>
                  protected from start to finish.
                </span>
              </h2>
            </Reveal>
            <Reveal index={2}>
              <p
                className="mt-6 max-w-[65ch] leading-relaxed"
                style={{ color: "var(--color-text-2)" }}
              >
                Local errands usually run on trust: send money first, hope the
                person shows up, argue if something goes wrong. GoPadi makes
                the flow clearer. The customer posts the errand, a Padi
                accepts, funds are locked in escrow, proof is submitted, and
                payment is released after confirmation.
              </p>
            </Reveal>
            <Reveal index={3}>
              <p
                className="mt-4 max-w-[65ch] leading-relaxed"
                style={{ color: "var(--color-text-2)" }}
              >
                No disappearing with money. No chasing payment after work.
                Just a cleaner way to get things done nearby.
              </p>
            </Reveal>
          </div>
        </section>
        </RevealGroup>

        {/* WHAT YOU CAN SEND */}
        <RevealGroup>
        <section className="py-16 lg:py-24 hairline-t">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-8 mb-10 items-baseline">
            <Reveal index={0} className="lg:col-span-3">
              <p
                className="eyebrow"
                style={{ color: "var(--color-text-3)" }}
              >
                what you can send
              </p>
            </Reveal>
            <Reveal index={1} className="lg:col-span-9">
              <h2
                style={{
                  color: "var(--color-text)",
                  fontWeight: 800,
                  fontSize: "clamp(1.75rem, 4vw, 3rem)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                }}
              >
                If someone nearby can handle it,{" "}
                <span style={{ color: "var(--color-signal)" }}>post it.</span>
              </h2>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {CATEGORIES.map((c, i) => {
              const colSpan =
                c.span === "wide" ? "lg:col-span-7" : "lg:col-span-5";
              return (
                <Reveal
                  as="article"
                  key={c.tag}
                  index={2 + i}
                  className={`${colSpan} flex flex-col`}
                >
                  {c.art}
                  <div className="pt-6 flex flex-col">
                    <div className="flex items-baseline justify-between gap-4 mb-4">
                      <p
                        className="mono text-[0.6875rem] uppercase tracking-[0.08em]"
                        style={{ color: "var(--color-text-3)" }}
                      >
                        {c.tag}
                      </p>
                      <span
                        className="mono text-[0.625rem] uppercase tracking-[0.08em]"
                        style={{ color: "var(--color-text-4)" }}
                      >
                        n.{String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3
                      style={{
                        color: "var(--color-text)",
                        fontWeight: 700,
                        fontSize: "1.5rem",
                        lineHeight: 1.1,
                        letterSpacing: "-0.015em",
                      }}
                    >
                      {c.title}
                    </h3>
                    <p
                      className="mt-3 max-w-[48ch] leading-relaxed text-sm"
                      style={{ color: "var(--color-text-2)" }}
                    >
                      {c.body}
                    </p>
                    <ul className="mt-5 flex flex-wrap gap-x-2 gap-y-2">
                      {c.items.map((it, idx) => (
                        <li
                          key={it}
                          className="mono text-[0.6875rem] uppercase tracking-[0.06em] hairline px-2 py-1"
                          style={{
                            color:
                              idx === 0
                                ? "var(--color-signal)"
                                : "var(--color-text-2)",
                            borderColor:
                              idx === 0
                                ? "var(--color-signal)"
                                : "var(--color-rule-strong)",
                          }}
                        >
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>
        </RevealGroup>

        {/* HOW IT WORKS */}
        <RevealGroup>
        <section className="py-16 lg:py-24 hairline-t">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-8 mb-10 items-baseline">
            <Reveal index={0} className="lg:col-span-3">
              <p
                className="eyebrow"
                style={{ color: "var(--color-text-3)" }}
              >
                how it works
              </p>
            </Reveal>
            <Reveal index={1} className="lg:col-span-9">
              <h2
                style={{
                  color: "var(--color-text)",
                  fontWeight: 800,
                  fontSize: "clamp(1.75rem, 4vw, 3rem)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                }}
              >
                Five steps.{" "}
                <span style={{ color: "var(--color-signal)" }}>
                  One protected errand.
                </span>
              </h2>
            </Reveal>
          </div>

          {/* ESCROW STATE TIMELINE — the literal money trail across 5 steps */}
          <div className="mb-12 lg:mb-16">
            <div className="flex items-baseline justify-between mb-3">
              <p className="eyebrow">escrow timeline · specimen errand</p>
              <p
                className="mono text-[0.625rem] uppercase tracking-[0.08em]"
                style={{ color: "var(--color-text-4)" }}
              >
                t = 0 → t = release
              </p>
            </div>
            <div
              className="grid grid-cols-5 gap-px hairline-t hairline-b hairline-l hairline-r"
              style={{ background: "var(--color-rule)" }}
            >
              {STEPS.map((s, i) => {
                const isLocked = s.escrowState === "locked";
                const isReleased = s.escrowState === "released";
                const stateColor = isLocked
                  ? "var(--color-signal)"
                  : isReleased
                  ? "var(--color-ok)"
                  : "var(--color-text-3)";
                return (
                  <div
                    key={s.n}
                    className="escrow-cell relative px-3 pt-3 pb-4 flex flex-col"
                    style={{
                      background:
                        isLocked
                          ? "var(--color-signal-soft)"
                          : isReleased
                          ? "var(--color-ok-soft)"
                          : "var(--color-bg)",
                      minHeight: "120px",
                      ["--i" as string]: i,
                      ["--fill" as string]: s.escrowFill,
                    } as React.CSSProperties}
                  >
                    <span
                      className="mono text-[0.625rem] uppercase tracking-[0.08em]"
                      style={{ color: "var(--color-text-3)" }}
                    >
                      step {s.n}
                    </span>
                    <span
                      className="mono mt-2"
                      style={{
                        color: "var(--color-text)",
                        fontWeight: 700,
                        fontSize: "1.125rem",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      ${s.balance.toFixed(2)}
                    </span>
                    <span
                      className="mono text-[0.625rem] uppercase tracking-[0.08em] mt-1"
                      style={{ color: stateColor }}
                    >
                      {s.escrowState}
                    </span>
                    {/* fill bar at bottom — width driven by CSS .fill on group activation */}
                    <div
                      className="absolute left-0 right-0 bottom-0 h-[3px]"
                      style={{ background: "var(--color-rule)" }}
                      aria-hidden
                    >
                      <div
                        className="fill h-full"
                        style={{
                          background: isReleased
                            ? "var(--color-ok)"
                            : "var(--color-signal)",
                        }}
                      />
                    </div>
                    {/* connector arrow between cells */}
                    {s.n !== "05" && (
                      <span
                        aria-hidden
                        className="arrow mono absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-xs px-1"
                        style={{
                          color: "var(--color-text-3)",
                          background: "var(--color-bg)",
                        }}
                      >
                        →
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP ROWS — each with swim-lane diagram */}
          <ol className="hairline-t">
            {STEPS.map((s, i) => (
              <Reveal
                as="li"
                key={s.n}
                index={6 + i}
                className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-6 py-8 lg:py-10 hairline-b row-hover"
              >
                {/* Left: step number + actor */}
                <div className="lg:col-span-2 flex lg:flex-col items-baseline lg:items-start gap-3">
                  <span
                    className="display"
                    style={{
                      color: "var(--color-signal)",
                      fontSize: "clamp(2.5rem, 4vw, 3.5rem)",
                      fontWeight: 900,
                      letterSpacing: "-0.02em",
                      lineHeight: 0.9,
                    }}
                  >
                    {s.n}
                  </span>
                  <span
                    className="mono text-[0.625rem] uppercase tracking-[0.08em]"
                    style={{ color: "var(--color-text-3)" }}
                  >
                    actor · {s.actor}
                  </span>
                </div>

                {/* Middle: title + body + state badge */}
                <div className="lg:col-span-5">
                  <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                    <h3
                      style={{
                        color: "var(--color-text)",
                        fontWeight: 700,
                        fontSize: "1.25rem",
                        lineHeight: 1.15,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {s.title}
                    </h3>
                    <StateBadge state={s.escrowState} />
                  </div>
                  <p
                    className="max-w-[55ch] leading-relaxed text-sm"
                    style={{ color: "var(--color-text-2)" }}
                  >
                    {s.body}
                  </p>
                </div>

                {/* Right: swim-lane flow diagram */}
                <div className="lg:col-span-5 flex items-center">
                  <FlowLane
                    actor={s.actor}
                    flow={s.flow}
                    escrowState={s.escrowState}
                    balance={s.balance}
                  />
                </div>
              </Reveal>
            ))}
          </ol>
        </section>
        </RevealGroup>

        {/* TWO-COLUMN VALUE — for customers / for padis */}
        <RevealGroup>
        <section
          className="py-16 lg:py-24 grid grid-cols-1 sm:grid-cols-2 gap-px hairline-t hairline-b"
          style={{ background: "var(--color-rule)" }}
        >
          <Reveal
            index={0}
            className="px-6 py-10 lg:px-10 lg:py-14"
            style={{ background: "var(--color-bg)" }}
          >
            <p className="eyebrow mb-5">for customers</p>
            <p
              className="leading-snug max-w-[42ch]"
              style={{
                color: "var(--color-text)",
                fontWeight: 700,
                fontSize: "1.625rem",
                letterSpacing: "-0.01em",
              }}
            >
              Send someone without sending money blindly.
            </p>
            <p
              className="mt-5 max-w-[55ch] leading-relaxed text-sm"
              style={{ color: "var(--color-text-2)" }}
            >
              Your funds stay locked until the errand is completed and
              confirmed. If the Padi does not deliver, you can dispute the job
              and let a resolver review what happened.
            </p>
          </Reveal>
          <Reveal
            index={1}
            className="px-6 py-10 lg:px-10 lg:py-14"
            style={{ background: "var(--color-bg)" }}
          >
            <p
              className="eyebrow mb-5"
              style={{ color: "var(--color-signal)" }}
            >
              for padis
            </p>
            <p
              className="leading-snug max-w-[42ch]"
              style={{
                color: "var(--color-text)",
                fontWeight: 700,
                fontSize: "1.625rem",
                letterSpacing: "-0.01em",
              }}
            >
              Do the work knowing payment is already there.
            </p>
            <p
              className="mt-5 max-w-[55ch] leading-relaxed text-sm"
              style={{ color: "var(--color-text-2)" }}
            >
              Before you start, the customer funds escrow. Complete the
              errand, submit proof, and get paid when the customer confirms or
              the resolver settles the case.
            </p>
          </Reveal>
        </section>
        </RevealGroup>

        {/* ESCROW / PROOF POINTS */}
        <RevealGroup>
        <section className="py-16 lg:py-24 hairline-t grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-10 items-start">
          <div className="lg:col-span-6">
            <Reveal index={0}>
              <p className="eyebrow mb-5">
                escrow · powered by{" "}
                <span style={{ color: "var(--color-signal)" }}>
                  trustless work
                </span>
              </p>
            </Reveal>
            <Reveal index={1}>
              <h2
                style={{
                  color: "var(--color-text)",
                  fontWeight: 800,
                  fontSize: "clamp(1.75rem, 4vw, 3rem)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                }}
              >
                Escrow keeps{" "}
                <span style={{ color: "var(--color-signal)" }}>
                  the hustle clean.
                </span>
              </h2>
            </Reveal>
            <Reveal index={2}>
              <p
                className="mt-6 max-w-[55ch] leading-relaxed"
                style={{ color: "var(--color-text-2)" }}
              >
                Every GoPadi errand has a visible money trail: budget, Padi
                fee, receiver, proof, release, and dispute path. The money
                does not move just because someone says so. It moves when the
                workflow is confirmed.
              </p>
            </Reveal>
            <Reveal index={3}>
              <p
                className="mono text-xs uppercase tracking-[0.08em] mt-6 inline-flex items-center gap-2"
                style={{ color: "var(--color-text-3)" }}
              >
                <span
                  aria-hidden
                  className="inline-block"
                  style={{
                    width: 6,
                    height: 6,
                    background: "var(--color-signal)",
                  }}
                />
                Trustless Work escrow · Stellar · USDC
              </p>
            </Reveal>
          </div>

          <ul className="lg:col-span-6 hairline-t">
            {PROOF_POINTS.map((p, i) => (
              <Reveal
                as="li"
                key={p}
                index={2 + i}
                className="flex items-baseline gap-5 py-5 hairline-b"
              >
                <span
                  className="mono text-xs"
                  style={{ color: "var(--color-text-3)", minWidth: "2.25rem" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  style={{
                    color: "var(--color-text)",
                    fontWeight: 600,
                    fontSize: "1.0625rem",
                    lineHeight: 1.35,
                  }}
                >
                  {p}
                </span>
              </Reveal>
            ))}
          </ul>
        </section>
        </RevealGroup>

        {/* CTA */}
        <RevealGroup>
        <section className="py-20 lg:py-32 grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-10 items-end">
          <div className="lg:col-span-7">
            <Reveal index={0}>
              <p
                className="eyebrow mb-4"
                style={{ color: "var(--color-signal)" }}
              >
                ready when you are
              </p>
            </Reveal>
            <Reveal index={1}>
              <h2
                style={{
                  color: "var(--color-text)",
                  fontWeight: 800,
                  fontSize: "clamp(2.25rem, 5.5vw, 4.5rem)",
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                }}
              >
                Need something done{" "}
                <span style={{ color: "var(--color-signal)" }}>today?</span>
              </h2>
            </Reveal>
            <Reveal index={2}>
              <p
                className="mt-6 max-w-[50ch] leading-relaxed"
                style={{ color: "var(--color-text-2)" }}
              >
                Post the errand. Let a nearby Padi handle it. Keep the money
                protected until it is done.
              </p>
            </Reveal>
          </div>
          <div className="lg:col-span-5 flex flex-col gap-3">
            <Reveal index={3}>
              <Link
                href="/post-errand"
                className="mono text-xs uppercase tracking-[0.08em] press cta-primary flex items-center justify-between gap-4"
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
            </Reveal>
            <Reveal index={4}>
              <Link
                href="/errands"
                className="mono text-xs uppercase tracking-[0.08em] press cta-ghost flex items-center justify-between gap-4"
                style={{
                  color: "var(--color-text)",
                  padding: "1rem 1.25rem",
                  border: "1px solid var(--color-rule-strong)",
                }}
              >
                Become a Padi
                <span aria-hidden>→</span>
              </Link>
            </Reveal>
          </div>
        </section>
        </RevealGroup>

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

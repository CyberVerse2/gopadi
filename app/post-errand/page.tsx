"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import { MoneyDisplay, MoneyInline } from "../components/MoneyDisplay";
import { useWallet } from "../components/WalletProvider";
import { DecodedErrand, ErrandCategory } from "../types";
import {
  createErrand,
  decodeErrand,
  getWalletUsdcBalance,
} from "../lib/api-client";

const CATEGORIES: { value: ErrandCategory; label: string }[] = [
  { value: "foodstuff", label: "foodstuff" },
  { value: "fuel", label: "fuel" },
  { value: "groceries", label: "groceries" },
  { value: "medicine", label: "medicine" },
  { value: "delivery", label: "delivery" },
  { value: "other", label: "other" },
];

const RUNNER_FEE_PERCENT = 20;
const MIN_RUNNER_FEE_USDC = 2;
const MAX_RUNNER_FEE_USDC = 15;

const STEPS = [
  { idx: 1, label: "task" },
  { idx: 2, label: "place" },
  { idx: 3, label: "money" },
  { idx: 4, label: "review" },
];

function calculateRunnerFee(itemBudget: number) {
  if (!Number.isFinite(itemBudget) || itemBudget <= 0) return 0;
  const fee = itemBudget * (RUNNER_FEE_PERCENT / 100);
  return Math.min(Math.max(fee, MIN_RUNNER_FEE_USDC), MAX_RUNNER_FEE_USDC);
}

function shortAddr(value: string) {
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function buildErrandBrief(form: {
  description: string;
  aiBrief: string;
  deliveryInstructions: string;
  refundPreference: string;
  shopperNotes: string;
}) {
  const sections = [
    form.aiBrief.trim() || form.description.trim(),
    form.deliveryInstructions.trim()
      ? `Delivery instructions: ${form.deliveryInstructions.trim()}`
      : "",
    form.refundPreference.trim()
      ? `Substitution/refund rule: ${form.refundPreference.trim()}`
      : "",
    form.shopperNotes.trim() ? `Padi notes:\n${form.shopperNotes.trim()}` : "",
  ].filter(Boolean);

  return sections.join("\n\n");
}

export default function PostErrandPage() {
  const router = useRouter();
  const wallet = useWallet();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decodeStatus, setDecodeStatus] = useState<string | null>(null);
  const [decoded, setDecoded] = useState<DecodedErrand | null>(null);

  const [form, setForm] = useState({
    title: "",
    category: "" as ErrandCategory | "",
    description: "",
    aiBrief: "",
    location: "",
    itemBudget: "",
    deadline: "",
    deliveryInstructions: "",
    refundPreference: "",
    shopperNotes: "",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const itemBudget = parseFloat(form.itemBudget) || 0;
  const runnerFee = calculateRunnerFee(itemBudget);
  const total = itemBudget + runnerFee;

  // Background decode triggered on description change. Never blocks Continue.
  const decodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (decodeTimer.current) clearTimeout(decodeTimer.current);
    if (!form.description.trim() || form.description.trim().length < 30) {
      decodeTimer.current = setTimeout(() => setDecodeStatus(null), 0);
      return;
    }
    decodeTimer.current = setTimeout(async () => {
      setDecodeStatus("reading your errand…");
      try {
        const { decoded } = await decodeErrand(form.description);
        setDecoded(decoded);
        setForm((f) => ({
          ...f,
          title: f.title || decoded.title || "",
          category: f.category || decoded.category || "",
          aiBrief: decoded.description || f.aiBrief,
          itemBudget:
            f.itemBudget ||
            (typeof decoded.itemBudgetUSDC === "number"
              ? String(decoded.itemBudgetUSDC)
              : ""),
          location: f.location || decoded.location || "",
          deliveryInstructions:
            f.deliveryInstructions || decoded.deliveryInstructions || "",
          refundPreference: f.refundPreference || decoded.refundPreference || "",
          shopperNotes:
            f.shopperNotes ||
            (decoded.shopperNotes.length > 0 ? decoded.shopperNotes.join("\n") : ""),
        }));
        const n = decoded.items.length;
        setDecodeStatus(`found ${n} item${n === 1 ? "" : "s"}, prefilled.`);
      } catch {
        setDecodeStatus(null);
      }
    }, 800);
    return () => {
      if (decodeTimer.current) clearTimeout(decodeTimer.current);
    };
  }, [form.description]);

  function canContinue(): boolean {
    if (step === 1) {
      return Boolean(form.title.trim()) && Boolean(form.category) && Boolean(form.description.trim());
    }
    if (step === 2) {
      return Boolean(form.location.trim());
    }
    if (step === 3) {
      return itemBudget > 0 && Boolean(form.deadline);
    }
    return true;
  }

  async function handlePost() {
    if (!form.category) return;
    setLoading(true);
    setError(null);
    try {
      const customerWallet = wallet.address ?? (await wallet.connect());
      const bal = await getWalletUsdcBalance(customerWallet);
      if (!bal.hasTrustline) {
        throw new Error(
          "this wallet needs the testnet usdc trustline before posting.",
        );
      }
      if (bal.balanceUSDC < total) {
        throw new Error(
          `errand needs ${total.toFixed(2)} usdc. wallet has ${bal.balanceUSDC.toFixed(2)}.`,
        );
      }
      const { errand } = await createErrand({
        customerWallet,
        title: form.title,
        description: buildErrandBrief(form),
        category: form.category,
        location: form.location,
        itemBudgetUSDC: itemBudget,
        runnerFeeUSDC: runnerFee,
        deadline: new Date(form.deadline).toISOString(),
        items:
          decoded && decoded.items.length > 0
            ? decoded.items.map((it) => ({
                name: it.name,
                quantity: it.quantity,
                notes: it.notes,
                substitutions: it.substitutions,
              }))
            : undefined,
      });
      router.push(`/errands/${errand.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "could not post errand.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 w-full">
        <div className="max-w-[520px] ml-4 sm:ml-12 lg:ml-24 mr-4 py-8 lg:py-12 pb-32">
          {/* Step indicator */}
          <ol className="flex items-center gap-3 mb-10">
            {STEPS.map((s) => {
              const done = s.idx < step;
              const active = s.idx === step;
              return (
                <li key={s.idx} className="flex items-center gap-3 first:ml-0">
                  <span
                    className="mono text-[0.625rem] uppercase tracking-[0.08em] flex items-center gap-1.5"
                    style={{
                      color: active
                        ? "var(--color-signal)"
                        : done
                          ? "var(--color-text)"
                          : "var(--color-text-4)",
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        display: "inline-block",
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: active
                          ? "var(--color-signal)"
                          : done
                            ? "var(--color-text)"
                            : "transparent",
                        border: `1px solid ${active ? "var(--color-signal)" : done ? "var(--color-text)" : "var(--color-rule-strong)"}`,
                      }}
                    />
                    {String(s.idx).padStart(2, "0")} {s.label}
                  </span>
                  {s.idx < STEPS.length && (
                    <span
                      aria-hidden
                      style={{
                        width: 16,
                        height: 1,
                        background:
                          s.idx < step ? "var(--color-text)" : "var(--color-rule)",
                      }}
                    />
                  )}
                </li>
              );
            })}
          </ol>

          {step === 1 && (
            <section className="motion-fade-up">
              <p className="eyebrow mb-3">step 01 · the task</p>
              <h1
                style={{
                  color: "var(--color-text)",
                  fontWeight: 800,
                  fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                }}
              >
                what needs doing?
              </h1>
              <p
                className="mt-3 text-sm leading-relaxed"
                style={{ color: "var(--color-text-2)" }}
              >
                describe it like a message. we&apos;ll quietly read it and prefill
                the rest without rewriting this box.
              </p>

              <label
                className="block eyebrow mt-8 mb-2"
                style={{ color: "var(--color-text-3)" }}
              >
                describe the errand
              </label>
              <textarea
                rows={6}
                placeholder="buy rice, oil, beans and tomato paste from ogbete. drop at unn female hostel before 6pm. budget 25 usdc."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="w-full bg-transparent hairline-b py-2 outline-none text-base leading-relaxed resize-none"
                style={{
                  borderColor: "var(--color-rule-strong)",
                  color: "var(--color-text)",
                }}
              />
              {decodeStatus && (
                <p
                  className="mono text-[0.6875rem] uppercase tracking-[0.08em] mt-2"
                  style={{ color: "var(--color-text-3)" }}
                >
                  {decodeStatus}
                </p>
              )}

              {decoded && decoded.items.length > 0 && (
                <div className="mt-6 hairline-t pt-5">
                  <p className="eyebrow mb-3">decoded items</p>
                  <ol>
                    {decoded.items.map((item, i) => (
                      <li
                        key={`${item.name}-${i}`}
                        className="grid grid-cols-[1.75rem_1fr] gap-x-3 py-2 hairline-b"
                      >
                        <span
                          className="mono text-xs"
                          style={{ color: "var(--color-text-4)" }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span
                          className="text-sm"
                          style={{ color: "var(--color-text)" }}
                        >
                          {item.name}
                          {item.quantity && (
                            <span
                              className="mono ml-2 text-xs"
                              style={{ color: "var(--color-text-3)" }}
                            >
                              {item.quantity}
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {form.aiBrief && (
                <div className="mt-6 hairline-t pt-5">
                  <p className="eyebrow mb-3">AI brief</p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-2)" }}>
                    {form.aiBrief}
                  </p>
                </div>
              )}

              <label
                className="block eyebrow mt-8 mb-2"
                style={{ color: "var(--color-text-3)" }}
              >
                title
              </label>
              <input
                type="text"
                placeholder="buy foodstuff from ogbete market"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                className="w-full bg-transparent hairline-b py-2 outline-none text-base"
                style={{
                  borderColor: "var(--color-rule-strong)",
                  color: "var(--color-text)",
                }}
              />

              <p
                className="eyebrow mt-8 mb-3"
                style={{ color: "var(--color-text-3)" }}
              >
                category
              </p>
              <div className="flex flex-wrap gap-3">
                {CATEGORIES.map((c) => {
                  const active = form.category === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => set("category", c.value)}
                      className="mono text-xs uppercase tracking-[0.08em] press"
                      style={{
                        color: active
                          ? "var(--color-text)"
                          : "var(--color-text-3)",
                        borderBottom: active
                          ? "1px solid var(--color-signal)"
                          : "1px solid var(--color-rule)",
                        paddingBottom: 4,
                      }}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>

            </section>
          )}

          {step === 2 && (
            <section className="motion-fade-up">
              <p className="eyebrow mb-3">step 02 · the place</p>
              <h1
                style={{
                  color: "var(--color-text)",
                  fontWeight: 800,
                  fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                }}
              >
                where does it start and end?
              </h1>

              <label
                className="block eyebrow mt-8 mb-2"
                style={{ color: "var(--color-text-3)" }}
              >
                pickup → delivery
              </label>
              <input
                type="text"
                placeholder="ogbete market → unn female hostel, block c"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                className="w-full bg-transparent hairline-b py-2 outline-none text-base"
                style={{
                  borderColor: "var(--color-rule-strong)",
                  color: "var(--color-text)",
                }}
              />
              <p
                className="mono text-[0.6875rem] mt-3"
                style={{ color: "var(--color-text-4)" }}
              >
                use the arrow → to separate pickup from drop. the padi will see
                a map.
              </p>

              <label
                className="block eyebrow mt-8 mb-2"
                style={{ color: "var(--color-text-3)" }}
              >
                delivery instructions
              </label>
              <textarea
                rows={3}
                placeholder="recipient, hostel block, call-on-arrival note, handoff details..."
                value={form.deliveryInstructions}
                onChange={(e) => set("deliveryInstructions", e.target.value)}
                className="w-full bg-transparent hairline-b py-2 outline-none text-base leading-relaxed resize-none"
                style={{
                  borderColor: "var(--color-rule-strong)",
                  color: "var(--color-text)",
                }}
              />

              <label
                className="block eyebrow mt-8 mb-2"
                style={{ color: "var(--color-text-3)" }}
              >
                substitution / refund rule
              </label>
              <textarea
                rows={3}
                placeholder="call before replacing, refund unavailable items, approved alternatives..."
                value={form.refundPreference}
                onChange={(e) => set("refundPreference", e.target.value)}
                className="w-full bg-transparent hairline-b py-2 outline-none text-base leading-relaxed resize-none"
                style={{
                  borderColor: "var(--color-rule-strong)",
                  color: "var(--color-text)",
                }}
              />
            </section>
          )}

          {step === 3 && (
            <section className="motion-fade-up">
              <p className="eyebrow mb-3">step 03 · the money</p>
              <h1
                style={{
                  color: "var(--color-text)",
                  fontWeight: 800,
                  fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                }}
              >
                how much, by when?
              </h1>

              <label
                className="block eyebrow mt-8 mb-2"
                style={{ color: "var(--color-text-3)" }}
              >
                item budget
              </label>
              <div
                className="flex items-baseline gap-3 hairline-b py-2"
                style={{ borderColor: "var(--color-rule-strong)" }}
              >
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="25.00"
                  value={form.itemBudget}
                  onChange={(e) => set("itemBudget", e.target.value)}
                  className="mono bg-transparent border-0 outline-none w-full"
                  style={{
                    color: "var(--color-text)",
                    fontSize: "clamp(2rem, 5vw, 3rem)",
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
                <span
                  className="mono uppercase tracking-[0.08em] text-xs"
                  style={{ color: "var(--color-text-3)" }}
                >
                  usdc
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-6 hairline-t pt-5">
                <div>
                  <p className="eyebrow mb-1">padi fee · auto</p>
                  <MoneyDisplay
                    amount={runnerFee}
                    size="md"
                    tone={runnerFee > 0 ? "signal" : "muted"}
                  />
                  <p
                    className="mono text-[0.625rem] mt-2"
                    style={{ color: "var(--color-text-4)" }}
                  >
                    {RUNNER_FEE_PERCENT}% of budget · min {MIN_RUNNER_FEE_USDC} · max{" "}
                    {MAX_RUNNER_FEE_USDC}
                  </p>
                </div>
                <div>
                  <p className="eyebrow mb-1">total to lock</p>
                  <MoneyDisplay amount={total} size="md" tone={total > 0 ? "default" : "muted"} />
                </div>
              </div>

              <label
                className="block eyebrow mt-10 mb-2"
                style={{ color: "var(--color-text-3)" }}
              >
                deadline
              </label>
              <input
                type="datetime-local"
                value={form.deadline}
                onChange={(e) => set("deadline", e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full bg-transparent hairline-b py-2 outline-none mono text-base"
                style={{
                  borderColor: "var(--color-rule-strong)",
                  color: "var(--color-text)",
                  colorScheme: "dark",
                }}
              />

              {decoded?.deadlineText && (
                <p
                  className="mono text-[0.6875rem] mt-3"
                  style={{ color: "var(--color-text-4)" }}
                >
                  AI read the request as: {decoded.deadlineText}. Choose the exact date and time above.
                </p>
              )}

              <label
                className="block eyebrow mt-8 mb-2"
                style={{ color: "var(--color-text-3)" }}
              >
                Padi notes
              </label>
              <textarea
                rows={4}
                placeholder="send receipt, pack well, call on arrival..."
                value={form.shopperNotes}
                onChange={(e) => set("shopperNotes", e.target.value)}
                className="w-full bg-transparent hairline-b py-2 outline-none text-base leading-relaxed resize-none"
                style={{
                  borderColor: "var(--color-rule-strong)",
                  color: "var(--color-text)",
                }}
              />
            </section>
          )}

          {step === 4 && (
            <section className="motion-fade-up">
              <p className="eyebrow mb-3">step 04 · review</p>
              <h1
                style={{
                  color: "var(--color-text)",
                  fontWeight: 800,
                  fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                }}
              >
                ready to post?
              </h1>

              <div className="mt-8 hairline-t pt-6">
                <p className="eyebrow mb-2">total locked in escrow</p>
                <MoneyDisplay amount={total} size="hero" tone="default" />
              </div>

              <dl className="mt-8 grid grid-cols-[auto_1fr] gap-y-3 gap-x-6 text-sm">
                <dt className="eyebrow self-baseline">title</dt>
                <dd style={{ color: "var(--color-text)" }}>{form.title || "—"}</dd>

                <dt className="eyebrow self-baseline">category</dt>
                <dd
                  className="mono uppercase tracking-[0.08em] text-xs"
                  style={{ color: "var(--color-text)" }}
                >
                  {form.category || "—"}
                </dd>

                <dt className="eyebrow self-baseline">route</dt>
                <dd style={{ color: "var(--color-text)" }}>{form.location || "—"}</dd>

                <dt className="eyebrow self-baseline">brief</dt>
                <dd className="leading-relaxed" style={{ color: "var(--color-text)" }}>
                  {form.aiBrief || form.description || "—"}
                </dd>

                <dt className="eyebrow self-baseline">item budget</dt>
                <dd className="mono" style={{ color: "var(--color-text)" }}>
                  <MoneyInline amount={itemBudget} tone="default" />
                </dd>

                <dt className="eyebrow self-baseline">padi fee</dt>
                <dd className="mono">
                  <MoneyInline amount={runnerFee} tone="signal" />
                </dd>

                <dt className="eyebrow self-baseline">deadline</dt>
                <dd className="mono text-sm" style={{ color: "var(--color-text)" }}>
                  {form.deadline
                    ? new Date(form.deadline).toLocaleString("en-NG", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "—"}
                </dd>

                <dt className="eyebrow self-baseline">delivery</dt>
                <dd style={{ color: "var(--color-text)" }}>
                  {form.deliveryInstructions || "—"}
                </dd>

                <dt className="eyebrow self-baseline">refund rule</dt>
                <dd style={{ color: "var(--color-text)" }}>
                  {form.refundPreference || "—"}
                </dd>

                <dt className="eyebrow self-baseline">Padi notes</dt>
                <dd className="whitespace-pre-wrap" style={{ color: "var(--color-text)" }}>
                  {form.shopperNotes || "—"}
                </dd>
              </dl>

              <div className="mt-10 hairline-t pt-5">
                {wallet.address ? (
                  <p
                    className="mono text-xs"
                    style={{ color: "var(--color-text-3)" }}
                  >
                    posting from {shortAddr(wallet.address)} ·{" "}
                    <span style={{ color: "var(--color-text-2)" }}>
                      you&apos;ll fund escrow on the next screen
                    </span>
                  </p>
                ) : (
                  <p
                    className="mono text-xs"
                    style={{ color: "var(--color-text-3)" }}
                  >
                    we&apos;ll prompt you to connect a wallet when you press post.
                  </p>
                )}
              </div>
            </section>
          )}

          {error && (
            <div
              className="mt-8 px-4 py-3 mono text-xs hairline"
              style={{
                borderColor: "var(--color-risk)",
                color: "var(--color-risk)",
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Sticky bottom action bar */}
        <div
          className="sticky bottom-0 hairline-t"
          style={{
            background:
              "color-mix(in oklab, var(--color-bg) 92%, transparent)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <div className="max-w-[520px] ml-4 sm:ml-12 lg:ml-24 mr-4 py-4 flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1 || loading}
            >
              ← back
            </Button>
            <div className="flex-1" />
            {step < 4 ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => setStep((s) => Math.min(4, s + 1))}
                disabled={!canContinue()}
              >
                continue
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={handlePost}
                loading={loading}
                disabled={loading || total <= 0}
              >
                post errand
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

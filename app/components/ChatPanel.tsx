"use client";

import { useState, useRef } from "react";
import type { Errand, ErrandMessage, TrustlessAction, Dispute } from "../types";
import Button from "./Button";
import type { ChatState } from "./useErrandChat";

type Props = {
  errand: Errand;
  connectedWallet: string | null;
  actions: TrustlessAction[];
  dispute: Dispute | null;
  chat: ChatState;
  onOpenDispute?: () => void;
};

function shortAddr(v: string) {
  return `${v.slice(0, 4)}…${v.slice(-4)}`;
}

function formatRelativeTime(iso: string) {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

function roleFor(wallet: string, errand: Errand): "customer" | "padi" | "resolver" | "unknown" {
  if (wallet === errand.customerWallet) return "customer";
  if (wallet === errand.runnerWallet) return "padi";
  if (wallet === errand.adminWallet) return "resolver";
  return "unknown";
}

function roleColor(role: ReturnType<typeof roleFor>): string {
  switch (role) {
    case "customer":
      return "var(--color-text)";
    case "padi":
      return "var(--color-signal)";
    case "resolver":
      return "var(--color-warn)";
    default:
      return "var(--color-text-3)";
  }
}

type SystemEvent = {
  kind: "system";
  id: string;
  at: string;
  label: string;
};

type MessageEntry = ErrandMessage & { kind: "message" };
type Entry = SystemEvent | MessageEntry;

function deriveSystemEvents(
  errand: Errand,
  actions: TrustlessAction[],
  dispute: Dispute | null,
): SystemEvent[] {
  const events: SystemEvent[] = [];

  if (errand.runnerWallet) {
    const earliestAction = actions
      .map((a) => a.submittedAt ?? a.createdAt)
      .filter(Boolean)
      .sort()[0];
    const at = earliestAction ?? errand.updatedAt;
    events.push({
      kind: "system",
      id: "sys_accepted",
      at,
      label: `padi accepted · ${shortAddr(errand.runnerWallet)}`,
    });
  }

  for (const a of actions) {
    if (a.status !== "submitted") continue;
    const at = a.submittedAt ?? a.createdAt;
    const label = (() => {
      switch (a.type) {
        case "initialize_escrow":
          return "escrow contract created";
        case "fund_escrow":
          return "escrow funded";
        case "change_milestone_status":
          return "padi started the errand";
        case "approve_milestone":
          return "customer confirmed completion";
        case "release_funds":
          return "funds released to padi";
        case "dispute_escrow":
          return "dispute opened on-chain";
        case "resolve_dispute":
          return "dispute resolved";
      }
    })();
    events.push({
      kind: "system",
      id: `sys_${a.id}`,
      at,
      label,
    });
  }

  if (errand.proofNote) {
    const proofAt = actions.find((a) => a.type === "change_milestone_status")?.submittedAt;
    if (!proofAt) {
      events.push({
        kind: "system",
        id: "sys_proof",
        at: errand.updatedAt,
        label: "proof uploaded",
      });
    }
  }

  if (dispute) {
    events.push({
      kind: "system",
      id: `sys_dispute_${dispute.id}`,
      at: dispute.createdAt,
      label: `${dispute.track === "fast" ? "fast track" : "normal track"} dispute opened by ${dispute.openedBy === "runner" ? "padi" : "customer"}`,
    });
    events.push({
      kind: "system",
      id: `sys_resolver_joined_${dispute.id}`,
      at: dispute.createdAt,
      label: "resolver joined dispute chat",
    });
    if (dispute.resolvedAt && dispute.resolution) {
      events.push({
        kind: "system",
        id: `sys_dispute_resolved_${dispute.id}`,
        at: dispute.resolvedAt,
        label:
          dispute.resolution === "release_to_runner"
            ? "resolver released to padi"
            : "resolver refunded customer",
      });
    }
  }

  return events;
}

export default function ChatPanel({
  errand,
  connectedWallet,
  actions,
  dispute,
  chat,
  onOpenDispute,
}: Props) {
  const { messages, access, loading, error, post } = chat;
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!connectedWallet) return;
    const body = draft.trim();
    if (!body) return;
    setPosting(true);
    setPostError(null);
    try {
      await post(body);
      setDraft("");
      composerRef.current?.focus();
    } catch (e) {
      setPostError(e instanceof Error ? e.message : "Failed to send.");
    } finally {
      setPosting(false);
    }
  }

  const tsOf = (e: Entry) => (e.kind === "message" ? e.createdAt : e.at);
  const events: Entry[] = [
    ...messages.map((m): MessageEntry => ({ ...m, kind: "message" as const })),
    ...deriveSystemEvents(errand, actions, dispute),
  ].sort((a, b) => new Date(tsOf(a)).getTime() - new Date(tsOf(b)).getTime());

  const canOpenDispute =
    Boolean(onOpenDispute) &&
    !dispute &&
    (access === "customer" || access === "padi") &&
    ["escrow_funded", "in_progress", "proof_uploaded", "completed"].includes(errand.status);

  if (!connectedWallet) {
    return (
      <section id="errand-chat" className="pt-2">
        <p className="text-sm max-w-[60ch]" style={{ color: "var(--color-text-3)" }}>
          the customer and padi coordinate here. connect your wallet to read or write.
        </p>
      </section>
    );
  }

  if (connectedWallet && !access && !loading) {
    return (
      <section id="errand-chat" className="pt-2">
        <p className="text-sm" style={{ color: "var(--color-text-3)" }}>
          this chat is open for deal questions. resolvers join when a dispute opens.
        </p>
      </section>
    );
  }

  return (
    <section id="errand-chat" className="pt-2">
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <span
          className="mono text-xs uppercase tracking-[0.08em]"
          style={{ color: "var(--color-text-3)" }}
        >
          {messages.length} {messages.length === 1 ? "message" : "messages"}
          {access ? ` · you are the ${access}` : ""}
        </span>
        {canOpenDispute && (
          <button
            type="button"
            onClick={onOpenDispute}
            className="mono text-xs uppercase tracking-[0.08em] underline underline-offset-2 press"
            style={{ color: "var(--color-risk)" }}
          >
            turn into dispute chat →
          </button>
        )}
      </div>

      {events.length === 0 && !loading ? (
        <div className="py-8">
          <p
            className="text-sm leading-relaxed max-w-[58ch]"
            style={{ color: "var(--color-text-3)" }}
          >
            no messages yet. coordinate substitutions, pickup timing, proof
            questions — anything that helps the errand finish cleanly.
          </p>
        </div>
      ) : (
        <ol className="space-y-0">
          {events.map((entry) => {
            if (entry.kind === "system") {
              return (
                <li
                  key={entry.id}
                  className="grid grid-cols-[auto_1fr_auto] gap-x-4 items-baseline py-3"
                >
                  <span
                    aria-hidden
                    className="inline-block rounded-full"
                    style={{
                      width: 6,
                      height: 6,
                      background: "var(--color-text-4)",
                    }}
                  />
                  <p
                    className="mono text-xs uppercase tracking-[0.08em]"
                    style={{ color: "var(--color-text-3)" }}
                  >
                    {entry.label}
                  </p>
                  <span
                    className="mono text-[0.625rem]"
                    style={{ color: "var(--color-text-4)" }}
                  >
                    {formatRelativeTime(entry.at)}
                  </span>
                </li>
              );
            }
            const role = roleFor(entry.authorWallet, errand);
            const isMe = entry.authorWallet === connectedWallet;
            return (
              <li
                key={entry.id}
                className="grid grid-cols-1 gap-1 py-4 hairline-b"
              >
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span
                    className="mono text-xs"
                    style={{ color: roleColor(role), fontWeight: 600 }}
                  >
                    {shortAddr(entry.authorWallet)}
                  </span>
                  <span
                    className="mono uppercase text-[0.625rem] tracking-[0.08em]"
                    style={{ color: roleColor(role), opacity: 0.7 }}
                  >
                    {role}
                  </span>
                  {isMe && (
                    <span
                      className="mono uppercase text-[0.625rem] tracking-[0.08em]"
                      style={{ color: "var(--color-text-4)" }}
                    >
                      you
                    </span>
                  )}
                  <span
                    className="mono text-[0.625rem] ml-auto"
                    style={{ color: "var(--color-text-4)" }}
                  >
                    {formatRelativeTime(entry.createdAt)}
                  </span>
                </div>
                <p
                  className="text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ color: "var(--color-text)" }}
                >
                  {entry.body}
                </p>
              </li>
            );
          })}
        </ol>
      )}

      {(error || postError) && (
        <div
          className="mt-4 px-3 py-2 mono text-xs hairline"
          style={{
            borderColor: "var(--color-risk)",
            color: "var(--color-risk)",
          }}
        >
          {postError ?? error}
        </div>
      )}

      {access && (
        <form onSubmit={handlePost} className="mt-6">
          <label
            className="block eyebrow mb-2"
            style={{ color: "var(--color-text-3)" }}
          >
            send a message
          </label>
          <textarea
            ref={composerRef}
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handlePost(e as unknown as React.FormEvent);
              }
            }}
            placeholder={
              access === "padi"
                ? "ask a question, share a substitution, or call out a blocker…"
                : access === "resolver"
                  ? "ask either side for clarification before settling…"
                  : "ask a question or coordinate with your padi…"
            }
            className="w-full bg-transparent hairline-b py-2 outline-none text-sm leading-relaxed resize-none"
            style={{
              borderColor: "var(--color-rule-strong)",
              color: "var(--color-text)",
            }}
            maxLength={2000}
          />
          <div className="flex items-baseline justify-between mt-3 gap-3">
            <span
              className="mono text-[0.625rem]"
              style={{ color: "var(--color-text-4)" }}
            >
              {draft.length}/2000 · ⌘↵ to send
            </span>
            <Button
              type="submit"
              variant="primary"
              loading={posting}
              disabled={posting || !draft.trim()}
            >
              send
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

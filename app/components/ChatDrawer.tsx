"use client";

import { useEffect } from "react";
import ChatPanel from "./ChatPanel";
import type { ChatState } from "./useErrandChat";
import type { Errand, TrustlessAction, Dispute } from "../types";

type Props = {
  open: boolean;
  onClose: () => void;
  errand: Errand;
  connectedWallet: string | null;
  actions: TrustlessAction[];
  dispute: Dispute | null;
  chat: ChatState;
  onOpenDispute?: () => void;
};

export default function ChatDrawer({
  open,
  onClose,
  errand,
  connectedWallet,
  actions,
  dispute,
  chat,
  onOpenDispute,
}: Props) {
  const { messages, markAllSeen } = chat;

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll while the drawer is open on mobile.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // Mark messages as seen while the drawer is open. Runs on initial
  // open and on each new message arrival, so the unread badge clears
  // without the user having to do anything explicit.
  useEffect(() => {
    if (!open) return;
    markAllSeen();
  }, [open, messages, markAllSeen]);

  return (
    <>
      {/* Backdrop — closes the chat when the user clicks outside the drawer. */}
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-40 transition-opacity duration-200 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{
          background:
            "color-mix(in oklab, var(--color-bg) 70%, transparent)",
        }}
      />

      <aside
        role="dialog"
        aria-label="errand chat"
        aria-modal="true"
        className={`fixed top-0 right-0 bottom-0 z-50 flex flex-col w-full lg:w-[420px] hairline-l transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background: "var(--color-bg)",
          transitionTimingFunction: "var(--ease-out-quint)",
          willChange: "transform",
        }}
      >
        {/* Header */}
        <header
          className="flex items-center justify-between gap-4 px-5 py-3 hairline-b"
          style={{ background: "var(--color-bg)" }}
        >
          <p
            className="mono text-xs uppercase tracking-[0.08em]"
            style={{ color: "var(--color-text)" }}
          >
            errand chat
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="close chat"
            className="press flex items-center justify-center w-7 h-7 hairline"
            style={{
              color: "var(--color-text-3)",
              background: "var(--color-bg-2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--color-signal)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--color-text-3)";
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              aria-hidden
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="square"
            >
              <path d="M1.5 1.5 L10.5 10.5 M10.5 1.5 L1.5 10.5" />
            </svg>
          </button>
        </header>

        {/* Body — let ChatPanel render. It already handles the
            access-gated states (no wallet / no access / loading). */}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          <ChatPanel
            errand={errand}
            connectedWallet={connectedWallet}
            actions={actions}
            dispute={dispute}
            chat={chat}
            onOpenDispute={onOpenDispute}
          />
        </div>
      </aside>
    </>
  );
}

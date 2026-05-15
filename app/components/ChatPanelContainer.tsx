"use client";

import ChatPanel from "./ChatPanel";
import { useErrandChat } from "./useErrandChat";
import type { Errand, TrustlessAction, Dispute } from "../types";

/**
 * Thin wrapper that owns its own useErrandChat hook. Useful when a
 * ChatPanel is rendered inside a map (e.g. admin dispute list) where
 * each panel needs its own chat state but the parent can't call the
 * hook per-row. Prefer wiring the hook directly when there's a single
 * panel; this is the convenience escape hatch.
 */
export default function ChatPanelContainer({
  errand,
  connectedWallet,
  actions,
  dispute,
  enabled = true,
  onOpenDispute,
}: {
  errand: Errand;
  connectedWallet: string | null;
  actions: TrustlessAction[];
  dispute: Dispute | null;
  enabled?: boolean;
  onOpenDispute?: () => void;
}) {
  const chat = useErrandChat(errand.id, connectedWallet, enabled);
  return (
    <ChatPanel
      errand={errand}
      connectedWallet={connectedWallet}
      actions={actions}
      dispute={dispute}
      chat={chat}
      onOpenDispute={onOpenDispute}
    />
  );
}

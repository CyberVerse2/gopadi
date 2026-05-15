"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { ErrandMessage } from "../types";
import {
  listErrandMessages,
  postErrandMessage,
  type ChatAccess,
} from "../lib/api-client";

const LAST_SEEN_PREFIX = "gopadi:lastseen";

export type ChatState = {
  messages: ErrandMessage[];
  access: ChatAccess;
  loading: boolean;
  error: string | null;
  unread: number;
  post: (body: string, image?: { url: string; name?: string }) => Promise<void>;
  refresh: () => Promise<void>;
  markAllSeen: () => void;
};

/**
 * Fetches and polls errand messages, tracks "last seen" per
 * (errand, wallet) in localStorage so the trigger button can show an
 * unread badge. Polls every 12s; hook re-fetches when wallet or
 * `enabled` flips. Pass `enabled=false` to keep the hook mounted but
 * skip the network — useful before the padi accepts.
 */
export function useErrandChat(
  errandId: string,
  wallet: string | null,
  enabled: boolean = true,
): ChatState {
  const [messages, setMessages] = useState<ErrandMessage[]>([]);
  const [access, setAccess] = useState<ChatAccess>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);

  const storageKey = wallet ? `${LAST_SEEN_PREFIX}:${errandId}:${wallet}` : null;

  // Load last-seen from localStorage when the key changes (mount, wallet swap).
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!storageKey || typeof window === "undefined") {
        setLastSeenAt(null);
        return;
      }
      setLastSeenAt(window.localStorage.getItem(storageKey));
    }, 0);
    return () => window.clearTimeout(t);
  }, [storageKey]);

  const refresh = useCallback(async () => {
    if (!wallet || !enabled) {
      setMessages([]);
      setAccess(null);
      return;
    }
    setLoading(true);
    try {
      const result = await listErrandMessages(errandId, wallet);
      setMessages(result.messages);
      setAccess(result.access);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load chat.");
    } finally {
      setLoading(false);
    }
  }, [errandId, wallet, enabled]);

  // Initial fetch.
  useEffect(() => {
    const t = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(t);
  }, [refresh]);

  // Light polling while we have access.
  useEffect(() => {
    if (!access) return;
    const t = setInterval(() => {
      void refresh();
    }, 12_000);
    return () => clearInterval(t);
  }, [access, refresh]);

  const unread = useMemo(() => {
    if (!wallet) return 0;
    return messages.filter(
      (m) =>
        m.authorWallet !== wallet &&
        (!lastSeenAt || m.createdAt > lastSeenAt),
    ).length;
  }, [messages, wallet, lastSeenAt]);

  const markAllSeen = useCallback(() => {
    if (!storageKey || typeof window === "undefined") {
      return;
    }
    const latest = messages.at(-1)?.createdAt ?? new Date().toISOString();
    if (lastSeenAt === latest) return;
    window.localStorage.setItem(storageKey, latest);
    setLastSeenAt(latest);
  }, [storageKey, messages, lastSeenAt]);

  const post = useCallback(
    async (body: string, image?: { url: string; name?: string }) => {
      if (!wallet) throw new Error("Wallet not connected.");
      const trimmed = body.trim();
      if (!trimmed && !image?.url) return;
      await postErrandMessage(errandId, trimmed, wallet, image);
      await refresh();
    },
    [errandId, wallet, refresh],
  );

  return {
    messages,
    access,
    loading,
    error,
    unread,
    post,
    refresh,
    markAllSeen,
  };
}

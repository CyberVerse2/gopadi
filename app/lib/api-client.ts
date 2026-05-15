import type {
  DecodedErrand,
  Dispute,
  DisputeResolution,
  Errand,
  ErrandCategory,
  ErrandItem,
  ErrandMessage,
  TrustlessAction,
} from "../types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof body.error === "string" ? body.error : "Request failed.");
  }
  return body as T;
}

export function listErrands(options: { escrowOnly?: boolean } = {}) {
  return request<{ errands: Errand[] }>(
    `/api/errands${options.escrowOnly ? "?scope=escrow" : ""}`,
  );
}

export function createErrand(input: {
  customerWallet: string;
  title: string;
  description: string;
  category: ErrandCategory;
  location: string;
  itemBudgetUSDC: number;
  runnerFeeUSDC: number;
  deadline: string;
  items?: ErrandItem[];
}) {
  return request<{ errand: Errand }>("/api/errands", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function decodeErrand(text: string) {
  return request<{ decoded: DecodedErrand }>("/api/errands/decode", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export function getWalletUsdcBalance(address: string) {
  return request<{ balanceUSDC: number; hasTrustline: boolean }>(
    `/api/wallets/${address}/usdc`,
  );
}

export function getErrand(id: string) {
  return request<{ errand: Errand; dispute: Dispute | null }>(`/api/errands/${id}`);
}

export function listTrustlessActions(id: string) {
  return request<{ actions: TrustlessAction[] }>(`/api/errands/${id}/actions`);
}

export function acceptErrand(id: string, runnerWallet: string) {
  return request<{ errand: Errand }>(`/api/errands/${id}/accept`, {
    method: "POST",
    body: JSON.stringify({ runnerWallet }),
  });
}

export function uploadProof(id: string, proofNote: string, signer: string, proofUrl?: string) {
  return request<{ errand: Errand }>(`/api/errands/${id}/proof`, {
    method: "POST",
    body: JSON.stringify({ proofNote, proofUrl, signer }),
  });
}

export function openDispute(
  id: string,
  openedBy: "customer" | "runner",
  reason: string,
  signer: string,
  evidenceUrl?: string,
) {
  return request<{ errand: Errand; dispute: Dispute }>(`/api/errands/${id}/dispute`, {
    method: "POST",
    body: JSON.stringify({ openedBy, reason, signer, evidenceUrl }),
  });
}

export function listDisputes(signer: string) {
  return request<{ disputes: Dispute[] }>(`/api/disputes?signer=${encodeURIComponent(signer)}`, {
    cache: "no-store",
  });
}

export function resolveDispute(
  id: string,
  resolution: DisputeResolution,
  signer: string,
  resolverNotes?: string,
) {
  return request<{ errand: Errand; dispute: Dispute }>(`/api/disputes/${id}/resolve`, {
    method: "POST",
    body: JSON.stringify({ resolution, signer, resolverNotes }),
  });
}

export type ChatAccess = "customer" | "padi" | "resolver" | null;

export function listErrandMessages(id: string, wallet: string) {
  return request<{ messages: ErrandMessage[]; access: ChatAccess }>(
    `/api/errands/${id}/messages?wallet=${encodeURIComponent(wallet)}`,
    { cache: "no-store" },
  );
}

export function postErrandMessage(
  id: string,
  body: string,
  authorWallet: string,
) {
  return request<{ message: ErrandMessage }>(`/api/errands/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ body, authorWallet }),
  });
}

export function prepareTrustlessAction(input: {
  errandId: string;
  type:
    | "initialize_escrow"
    | "fund_escrow"
    | "change_milestone_status"
    | "approve_milestone"
    | "release_funds"
    | "dispute_escrow"
    | "resolve_dispute";
  signer: string;
  disputeId?: string;
  resolution?: DisputeResolution;
  proofNote?: string;
}) {
  return request<{ action: { id: string; unsignedTransaction: string } }>(
    "/api/trustless/actions",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function submitSignedTrustlessAction(actionId: string, signedXdr: string) {
  return request<{ action: { id: string; status: string; transactionHash?: string } }>(
    "/api/trustless/submit",
    {
      method: "POST",
      body: JSON.stringify({ actionId, signedXdr }),
    },
  );
}

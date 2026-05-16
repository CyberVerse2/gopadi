import { desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { trustlessActions } from "../db/schema";
import type { DisputeResolution, Errand } from "../types";
import { generateId } from "./ids";
import { setEscrowCreated, setEscrowContract, updateErrandStatus } from "./errands-repository";
import { serializeTrustlessAction } from "./serializers";

const TRUSTLESS_WORK_BASE_URL =
  process.env.TRUSTLESS_WORK_BASE_URL ?? "https://dev.api.trustlesswork.com";

const TRUSTLESS_WORK_API_KEY =
  process.env.TRUSTLESS_WORK_API_KEY ?? process.env.NEXT_PUBLIC_API_KEY;

const USDC_TRUSTLINE_ADDRESS = process.env.USDC_TRUSTLINE_ADDRESS;
const PLATFORM_WALLET = process.env.GOPADI_PLATFORM_WALLET;
const RESOLVER_WALLET = process.env.GOPADI_RESOLVER_WALLET;
const PLATFORM_FEE_PERCENT = parsePlatformFeePercent();

export type TrustlessActionType =
  | "initialize_escrow"
  | "fund_escrow"
  | "change_milestone_status"
  | "approve_milestone"
  | "release_funds"
  | "dispute_escrow"
  | "resolve_dispute";

export type TrustlessCreateErrand = Pick<
  Errand,
  | "id"
  | "customerWallet"
  | "customerPhone"
  | "customerEmail"
  | "runnerWallet"
  | "title"
  | "description"
  | "category"
  | "location"
  | "itemBudgetUSDC"
  | "runnerFeeUSDC"
  | "totalEscrowAmountUSDC"
  | "deadline"
  | "items"
  | "trustlessEngagementId"
  | "handoffCode"
>;

export type PreparedTrustlessTransaction = {
  endpoint: string;
  payload: Record<string, unknown>;
  response: Record<string, unknown>;
  unsignedTransaction: string;
};

export async function prepareTrustlessCreateEscrow(
  errand: TrustlessCreateErrand,
  signer: string,
) {
  const payload = buildPayload(errandForTrustless(errand), "initialize_escrow", {
    signer,
  });
  return prepareTrustlessTransaction("/deployer/single-release", payload);
}

export async function prepareTrustlessFundEscrow(input: {
  contractId: string;
  signer: string;
  amount: number;
}) {
  const payload = {
    contractId: input.contractId,
    signer: input.signer,
    amount: input.amount,
  };
  return prepareTrustlessTransaction("/escrow/single-release/fund-escrow", payload);
}

export async function sendTrustlessSignedTransaction(signedXdr: string) {
  if (!signedXdr.trim()) throw new Error("Signed XDR is required.");
  return callTrustlessWork("/helper/send-transaction", { signedXdr });
}

export function extractTrustlessTransactionHash(response: Record<string, unknown>) {
  return typeof response.hash === "string"
    ? response.hash
    : typeof response.transactionHash === "string"
      ? response.transactionHash
      : undefined;
}

export function extractTrustlessContractId(response: Record<string, unknown>) {
  return typeof response.contractId === "string"
    ? response.contractId
    : typeof response.escrowContractId === "string"
      ? response.escrowContractId
      : undefined;
}

async function prepareTrustlessTransaction(
  endpoint: string,
  payload: Record<string, unknown>,
): Promise<PreparedTrustlessTransaction> {
  const response = await callTrustlessWork(endpoint, payload);
  const unsignedTransaction = response.unsignedTransaction;

  if (!unsignedTransaction || typeof unsignedTransaction !== "string") {
    throw new Error("Trustless Work did not return an unsigned transaction.");
  }

  return {
    endpoint,
    payload,
    response,
    unsignedTransaction,
  };
}

export async function prepareTrustlessAction(
  errand: Errand,
  type: TrustlessActionType,
  options: {
    signer: string;
    disputeId?: string;
    resolution?: DisputeResolution;
    proofNote?: string;
  },
) {
  const payload = buildPayload(errand, type, options);
  const endpoint = endpointFor(type);
  const prepared = await prepareTrustlessTransaction(endpoint, payload);

  const [row] = await getDb()
    .insert(trustlessActions)
    .values({
      id: generateId("tw_action"),
      errandId: errand.id,
      disputeId: options.disputeId,
      type,
      signer: options.signer,
      unsignedTransaction: prepared.unsignedTransaction,
      requestPayload: payload,
      responsePayload: prepared.response,
    })
    .returning();

  if (type === "initialize_escrow") {
    await setEscrowCreated(
      errand.id,
      payload.engagementId as string,
      RESOLVER_WALLET,
    );
  }

  return row;
}

export async function submitSignedTrustlessAction(actionId: string, signedXdr: string) {
  if (!signedXdr.trim()) throw new Error("Signed XDR is required.");

  const [action] = await getDb()
    .select()
    .from(trustlessActions)
    .where(eq(trustlessActions.id, actionId))
    .limit(1);

  if (!action) throw new Error("Trustless action not found.");
  if (action.status !== "pending_signature") {
    throw new Error("Trustless action has already been submitted.");
  }

  try {
    const response = await sendTrustlessSignedTransaction(signedXdr);

    const transactionHash = extractTrustlessTransactionHash(response);
    const contractId = extractTrustlessContractId(response);

    const [updated] = await getDb()
      .update(trustlessActions)
      .set({
        status: "submitted",
        signedXdr,
        transactionHash,
        responsePayload: response,
        submittedAt: new Date(),
      })
      .where(eq(trustlessActions.id, action.id))
      .returning();

    await applySubmittedState(
      action.type,
      action.errandId,
      contractId,
      action.requestPayload,
    );

    return updated;
  } catch (error) {
    await getDb()
      .update(trustlessActions)
      .set({
        status: "failed",
        signedXdr,
        errorMessage: error instanceof Error ? error.message : "Unknown Trustless Work error",
        submittedAt: new Date(),
      })
      .where(eq(trustlessActions.id, action.id));
    throw error;
  }
}

export async function listTrustlessActions(errandId: string) {
  const rows = await getDb()
    .select()
    .from(trustlessActions)
    .where(eq(trustlessActions.errandId, errandId))
    .orderBy(desc(trustlessActions.createdAt));
  return rows.map(serializeTrustlessAction);
}

function errandForTrustless(errand: TrustlessCreateErrand): Errand {
  const now = new Date().toISOString();
  return {
    ...errand,
    runnerWallet: errand.runnerWallet,
    status: "accepted",
    createdAt: now,
    updatedAt: now,
  };
}

function buildPayload(
  errand: Errand,
  type: TrustlessActionType,
  options: {
    signer: string;
    resolution?: DisputeResolution;
    proofNote?: string;
  },
) {
  switch (type) {
    case "initialize_escrow": {
      requireConfig(PLATFORM_WALLET, "GOPADI_PLATFORM_WALLET");
      requireConfig(RESOLVER_WALLET, "GOPADI_RESOLVER_WALLET");
      requireConfig(USDC_TRUSTLINE_ADDRESS, "USDC_TRUSTLINE_ADDRESS");
      if (!errand.runnerWallet) throw new Error("Padi wallet is required before escrow creation.");
      const engagementId = errand.trustlessEngagementId ?? `gopadi-${errand.id}`;
      const platformAddress = PLATFORM_WALLET;
      const disputeResolver = RESOLVER_WALLET;
      return {
        signer: options.signer,
        engagementId,
        title: errand.title,
        description: errand.description,
        roles: {
          approver: errand.customerWallet,
          serviceProvider: errand.runnerWallet,
          // Every GoPadi escrow carries platform/resolver roles for dashboard visibility and operations.
          platformAddress,
          releaseSigner: errand.customerWallet,
          disputeResolver,
          receiver: errand.runnerWallet,
        },
        amount: errand.totalEscrowAmountUSDC,
        platformFee: PLATFORM_FEE_PERCENT,
        milestones: [
          {
            description: `Complete errand: ${errand.title}`,
          },
        ],
        trustline: {
          address: USDC_TRUSTLINE_ADDRESS,
          symbol: "USDC",
        },
      };
    }
    case "fund_escrow":
      requireContract(errand);
      return {
        contractId: errand.escrowContractId,
        signer: options.signer,
        amount: errand.totalEscrowAmountUSDC,
      };
    case "change_milestone_status":
      requireContract(errand);
      if (!errand.runnerWallet) throw new Error("Runner wallet is required.");
      return {
        contractId: errand.escrowContractId,
        milestoneIndex: "0",
        newEvidence: options.proofNote ?? errand.proofNote ?? "Errand completed.",
        newStatus: "Completed",
        serviceProvider: options.signer,
      };
    case "approve_milestone":
      requireContract(errand);
      return {
        contractId: errand.escrowContractId,
        milestoneIndex: "0",
        approver: options.signer,
      };
    case "release_funds":
      requireContract(errand);
      return {
        contractId: errand.escrowContractId,
        releaseSigner: options.signer,
      };
    case "dispute_escrow":
      requireContract(errand);
      return {
        contractId: errand.escrowContractId,
        signer: options.signer,
      };
    case "resolve_dispute":
      requireContract(errand);
      requireConfig(RESOLVER_WALLET, "GOPADI_RESOLVER_WALLET");
      return {
        contractId: errand.escrowContractId,
        disputeResolver: options.signer,
        distributions: [
          {
            address:
              options.resolution === "refund_customer"
                ? errand.customerWallet
                : errand.runnerWallet,
            amount: errand.totalEscrowAmountUSDC,
          },
        ],
      };
  }
}

function endpointFor(type: TrustlessActionType) {
  switch (type) {
    case "initialize_escrow":
      return "/deployer/single-release";
    case "fund_escrow":
      return "/escrow/single-release/fund-escrow";
    case "change_milestone_status":
      return "/escrow/single-release/change-milestone-status";
    case "approve_milestone":
      return "/escrow/single-release/approve-milestone";
    case "release_funds":
      return "/escrow/single-release/release-funds";
    case "dispute_escrow":
      return "/escrow/single-release/dispute-escrow";
    case "resolve_dispute":
      return "/escrow/single-release/resolve-dispute";
  }
}

async function callTrustlessWork(endpoint: string, payload: Record<string, unknown>) {
  requireConfig(TRUSTLESS_WORK_API_KEY, "TRUSTLESS_WORK_API_KEY or NEXT_PUBLIC_API_KEY");

  const response = await fetch(`${TRUSTLESS_WORK_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": TRUSTLESS_WORK_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const message =
      typeof body.message === "string"
        ? body.message
        : typeof body.error === "string"
          ? body.error
          : `Trustless Work ${endpoint} failed with ${response.status}.`;
    throw new Error(`${message}: ${JSON.stringify(body)}`);
  }

  return body;
}

async function applySubmittedState(
  type: TrustlessActionType,
  errandId: string,
  contractId?: string,
  requestPayload?: unknown,
) {
  if (contractId) {
    await setEscrowContract(errandId, contractId);
  }

  if (type === "fund_escrow") await updateErrandStatus(errandId, "escrow_funded");
  if (type === "change_milestone_status") await updateErrandStatus(errandId, "proof_uploaded");
  if (type === "approve_milestone") await updateErrandStatus(errandId, "completed");
  if (type === "release_funds") await updateErrandStatus(errandId, "released");
  if (type === "dispute_escrow") await updateErrandStatus(errandId, "disputed");
  if (type === "resolve_dispute") {
    // Derive winner from the action's request payload. The first
    // distribution.address tells us who the resolver settled in favour of:
    // the customer (refund) or the runner (release).
    const errand = await getErrandRow(errandId);
    if (!errand) return;
    const winner = extractResolveWinner(requestPayload);
    if (winner && winner === errand.customerWallet) {
      await updateErrandStatus(errandId, "refunded");
    } else if (winner && winner === errand.runnerWallet) {
      await updateErrandStatus(errandId, "released");
    }
  }
}

async function getErrandRow(errandId: string) {
  const { errands } = await import("../db/schema");
  const [row] = await getDb()
    .select()
    .from(errands)
    .where(eq(errands.id, errandId))
    .limit(1);
  return row ?? null;
}

function extractResolveWinner(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const distributions = p.distributions;
  if (!Array.isArray(distributions) || distributions.length === 0) return null;
  const first = distributions[0];
  if (!first || typeof first !== "object") return null;
  const addr = (first as Record<string, unknown>).address;
  return typeof addr === "string" ? addr : null;
}

function requireContract(errand: Errand) {
  if (!errand.escrowContractId) {
    throw new Error("Escrow contract ID is required for this action.");
  }
}

function requireConfig(value: string | undefined, name: string): asserts value is string {
  if (!value) throw new Error(`${name} is required.`);
}

function parsePlatformFeePercent() {
  const raw = process.env.GOPADI_PLATFORM_FEE_PERCENT;
  requireConfig(raw, "GOPADI_PLATFORM_FEE_PERCENT");

  const fee = Number.parseFloat(raw);
  if (!Number.isFinite(fee) || fee < 0 || fee > 99) {
    throw new Error("GOPADI_PLATFORM_FEE_PERCENT must be a number between 0 and 99.");
  }

  return fee;
}

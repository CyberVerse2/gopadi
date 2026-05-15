import { and, asc, desc, eq, isNotNull } from "drizzle-orm";
import { getDb } from "../db";
import { disputes, errandMessages, errands } from "../db/schema";
import type {
  DisputeResolution,
  DisputeTrack,
  ErrandCategory,
  ErrandItem,
  ErrandStatus,
} from "../types";
import { generateId } from "./ids";
import {
  serializeDispute,
  serializeErrand,
  serializeErrandMessage,
} from "./serializers";

export type CreateErrandInput = {
  customerWallet: string;
  customerPhone: string;
  customerEmail: string;
  title: string;
  description: string;
  category: ErrandCategory;
  location: string;
  itemBudgetUSDC: number;
  runnerFeeUSDC: number;
  deadline: string;
  items?: ErrandItem[];
};

export type CreateFundedErrandInput = CreateErrandInput & {
  runnerWallet: string;
  adminWallet?: string;
  escrowId: string;
  escrowContractId: string;
  trustlessEngagementId: string;
};

export async function listErrands(options: { escrowOnly?: boolean } = {}) {
  const query = getDb().select().from(errands);
  const rows = options.escrowOnly
    ? await query.where(isNotNull(errands.escrowContractId)).orderBy(desc(errands.createdAt))
    : await query.where(isNotNull(errands.escrowContractId)).orderBy(desc(errands.createdAt));
  return rows.map(serializeErrand);
}

export async function findErrand(id: string) {
  const [row] = await getDb().select().from(errands).where(eq(errands.id, id)).limit(1);
  return row ? serializeErrand(row) : null;
}

export async function createFundedErrand(input: CreateFundedErrandInput) {
  const total = validateCreateErrandInput(input);
  if (!input.runnerWallet.trim()) throw new Error("Padi wallet is required.");
  if (!input.escrowId.trim()) throw new Error("Escrow ID is required.");
  if (!input.escrowContractId.trim()) throw new Error("Escrow contract ID is required.");
  if (!input.trustlessEngagementId.trim()) {
    throw new Error("Trustless Work engagement ID is required.");
  }

  const now = new Date();
  const [row] = await getDb()
    .insert(errands)
    .values({
      id: generateId("errand"),
      customerWallet: input.customerWallet,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      runnerWallet: input.runnerWallet,
      adminWallet: input.adminWallet,
      title: input.title,
      description: input.description,
      category: input.category,
      location: input.location,
      itemBudgetUSDC: input.itemBudgetUSDC,
      runnerFeeUSDC: input.runnerFeeUSDC,
      totalEscrowAmountUSDC: total,
      items: input.items && input.items.length > 0 ? input.items : undefined,
      deadline: new Date(input.deadline),
      escrowId: input.escrowId,
      escrowContractId: input.escrowContractId,
      trustlessEngagementId: input.trustlessEngagementId,
      status: "escrow_funded",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return serializeErrand(row);
}

export async function createErrand(input: CreateErrandInput) {
  const total = validateCreateErrandInput(input);
  const now = new Date();
  const [row] = await getDb()
    .insert(errands)
    .values({
      id: generateId("errand"),
      customerWallet: input.customerWallet,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      title: input.title,
      description: input.description,
      category: input.category,
      location: input.location,
      itemBudgetUSDC: input.itemBudgetUSDC,
      runnerFeeUSDC: input.runnerFeeUSDC,
      totalEscrowAmountUSDC: total,
      items: input.items && input.items.length > 0 ? input.items : undefined,
      deadline: new Date(input.deadline),
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return serializeErrand(row);
}

function validateCreateErrandInput(input: CreateErrandInput) {
  assertPositiveAmount(input.itemBudgetUSDC, "Item budget");
  assertPositiveAmount(input.runnerFeeUSDC, "Runner fee");
  if (!input.customerWallet.trim()) throw new Error("Customer wallet is required.");
  if (!input.customerPhone.trim()) throw new Error("Phone number is required.");
  if (!input.customerEmail.trim()) throw new Error("Email is required.");
  if (!input.customerEmail.includes("@")) throw new Error("Valid email is required.");
  if (!input.title.trim()) throw new Error("Title is required.");
  if (!input.description.trim()) throw new Error("Description is required.");
  if (!input.location.trim()) throw new Error("Location is required.");
  const total = input.itemBudgetUSDC + input.runnerFeeUSDC;
  return total;
}

export async function acceptErrand(id: string, runnerWallet: string) {
  if (!runnerWallet.trim()) throw new Error("Runner wallet is required.");
  const errand = await requireErrand(id);
  requireStatus(errand.status, ["posted"]);
  if (runnerWallet === errand.customerWallet) {
    throw new Error("The customer cannot accept their own errand as a Padi.");
  }

  const [row] = await getDb()
    .update(errands)
    .set({ runnerWallet, status: "accepted", updatedAt: new Date() })
    .where(eq(errands.id, id))
    .returning();

  return serializeErrand(row);
}

export async function updateErrandStatus(id: string, status: ErrandStatus) {
  const [row] = await getDb()
    .update(errands)
    .set({ status, updatedAt: new Date() })
    .where(eq(errands.id, id))
    .returning();
  if (!row) throw new Error("Errand not found.");
  return serializeErrand(row);
}

export async function setEscrowCreated(
  id: string,
  engagementId: string,
  adminWallet?: string,
) {
  const [row] = await getDb()
    .update(errands)
    .set({
      adminWallet,
      escrowId: engagementId,
      trustlessEngagementId: engagementId,
      status: "escrow_created",
      updatedAt: new Date(),
    })
    .where(eq(errands.id, id))
    .returning();
  if (!row) throw new Error("Errand not found.");
  return serializeErrand(row);
}

export async function setEscrowContract(id: string, contractId: string) {
  const [row] = await getDb()
    .update(errands)
    .set({ escrowContractId: contractId, updatedAt: new Date() })
    .where(eq(errands.id, id))
    .returning();
  if (!row) throw new Error("Errand not found.");
  return serializeErrand(row);
}

export async function uploadProof(id: string, proofNote: string, proofUrl?: string) {
  if (!proofNote.trim()) throw new Error("Proof note is required.");
  const errand = await requireErrand(id);
  requireStatus(errand.status, ["in_progress"]);

  const [row] = await getDb()
    .update(errands)
    .set({
      proofNote,
      proofUrl,
      status: "proof_uploaded",
      updatedAt: new Date(),
    })
    .where(eq(errands.id, id))
    .returning();

  return serializeErrand(row);
}

// Records the local dispute case. The on-chain dispute_escrow action is
// what actually flips the errand to "disputed" via applySubmittedState in
// trustless-work.ts. This function only persists the case record (reason,
// evidence, opener) and refuses to run if the on-chain step hasn't
// happened yet (i.e. errand status isn't "disputed" or beyond).
export async function openDispute(
  id: string,
  openedBy: "customer" | "runner",
  input: {
    reasonCode?: string;
    reason: string;
    track?: DisputeTrack;
    evidenceUrl?: string;
  },
) {
  if (!input.reason.trim()) throw new Error("Dispute reason is required.");
  const errand = await requireErrand(id);
  if (errand.status !== "disputed") {
    throw new Error(
      "The on-chain dispute transaction must be submitted before opening the local case.",
    );
  }
  if (openedBy === "runner" && !errand.runnerWallet) {
    throw new Error("Padi wallet is required before opening a Padi dispute.");
  }

  const [dispute] = await getDb()
    .insert(disputes)
    .values({
      id: generateId("dispute"),
      errandId: id,
      openedBy,
      reasonCode: input.reasonCode,
      reason: input.reason,
      track: input.track,
      evidenceUrl: input.evidenceUrl,
      createdAt: new Date(),
    })
    .returning();

  return {
    errand,
    dispute: serializeDispute(dispute),
  };
}

export async function listDisputes() {
  const rows = await getDb().select().from(disputes).orderBy(desc(disputes.createdAt));
  return rows.map(serializeDispute);
}

export async function findDisputeForErrand(errandId: string) {
  const [row] = await getDb()
    .select()
    .from(disputes)
    .where(and(eq(disputes.errandId, errandId), eq(disputes.status, "open")))
    .limit(1);
  return row ? serializeDispute(row) : null;
}

// Records the resolver's choice and notes against the local dispute case.
// The on-chain resolve_dispute action is what actually moves funds and
// updates errand status via applySubmittedState in trustless-work.ts.
// Refuses to run unless the errand is already in a settled state, which
// only happens after the chain action submits.
export async function resolveDispute(
  disputeId: string,
  resolution: DisputeResolution,
  resolverNotes?: string,
) {
  const [dispute] = await getDb()
    .select()
    .from(disputes)
    .where(eq(disputes.id, disputeId))
    .limit(1);
  if (!dispute) throw new Error("Dispute not found.");
  if (dispute.status !== "open") throw new Error("Dispute is already resolved.");

  const [errand] = await getDb()
    .select()
    .from(errands)
    .where(eq(errands.id, dispute.errandId))
    .limit(1);
  if (!errand) throw new Error("Errand for dispute not found.");

  const expected =
    resolution === "release_to_runner" ? "released" : "refunded";
  if (errand.status !== expected) {
    throw new Error(
      `On-chain resolve_dispute has not settled this errand yet. Submit it first.`,
    );
  }

  const [updatedDispute] = await getDb()
    .update(disputes)
    .set({
      status: "resolved",
      resolution,
      resolverNotes,
      resolvedAt: new Date(),
    })
    .where(eq(disputes.id, disputeId))
    .returning();

  return {
    dispute: serializeDispute(updatedDispute),
    errand: serializeErrand(errand),
  };
}

export type ChatParticipant = "customer" | "padi" | "resolver";

export async function getChatAccess(
  errandId: string,
  wallet: string,
): Promise<ChatParticipant | null> {
  const errand = await requireErrand(errandId);
  if (wallet === errand.customerWallet) return "customer";
  if (wallet === errand.adminWallet && errand.status === "disputed") {
    return "resolver";
  }
  return "padi";
}

export async function listErrandMessages(errandId: string, wallet: string) {
  const access = await getChatAccess(errandId, wallet);
  if (!access) throw new Error("You don't have access to this chat.");
  const rows = await getDb()
    .select()
    .from(errandMessages)
    .where(eq(errandMessages.errandId, errandId))
    .orderBy(asc(errandMessages.createdAt));
  return rows.map(serializeErrandMessage);
}

export async function createErrandMessage(input: {
  errandId: string;
  authorWallet: string;
  body: string;
  imageUrl?: string;
  imageName?: string;
}) {
  if (!input.authorWallet.trim()) throw new Error("Author wallet is required.");
  if (!input.body.trim() && !input.imageUrl?.trim()) {
    throw new Error("Message body or image is required.");
  }
  if (input.body.length > 2000) throw new Error("Message is too long.");
  const access = await getChatAccess(input.errandId, input.authorWallet);
  if (!access) throw new Error("Only the customer, padi, or resolver can post.");

  const [row] = await getDb()
    .insert(errandMessages)
    .values({
      id: generateId("msg"),
      errandId: input.errandId,
      authorWallet: input.authorWallet,
      body: input.body.trim(),
      imageUrl: input.imageUrl?.trim() || null,
      imageName: input.imageName?.trim() || null,
      createdAt: new Date(),
    })
    .returning();

  return serializeErrandMessage(row);
}

async function requireErrand(id: string) {
  const errand = await findErrand(id);
  if (!errand) throw new Error("Errand not found.");
  return errand;
}

function requireStatus(current: ErrandStatus, allowed: ErrandStatus[]) {
  if (!allowed.includes(current)) {
    throw new Error(`Invalid errand state: expected ${allowed.join(" or ")}, got ${current}.`);
  }
}

function assertPositiveAmount(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be greater than zero.`);
  }
}

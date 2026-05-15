import type { Dispute, Errand, ErrandMessage, TrustlessAction } from "../types";
import type {
  disputes,
  errandMessages,
  errands,
  trustlessActions,
} from "../db/schema";

type ErrandRow = typeof errands.$inferSelect;
type DisputeRow = typeof disputes.$inferSelect;
type TrustlessActionRow = typeof trustlessActions.$inferSelect;
type ErrandMessageRow = typeof errandMessages.$inferSelect;

export function serializeErrand(row: ErrandRow): Errand {
  return {
    id: row.id,
    customerWallet: row.customerWallet,
    customerPhone: row.customerPhone,
    customerEmail: row.customerEmail,
    runnerWallet: row.runnerWallet ?? undefined,
    adminWallet: row.adminWallet ?? undefined,
    title: row.title,
    description: row.description,
    category: row.category,
    location: row.location,
    itemBudgetUSDC: row.itemBudgetUSDC,
    runnerFeeUSDC: row.runnerFeeUSDC,
    totalEscrowAmountUSDC: row.totalEscrowAmountUSDC,
    items: row.items ?? undefined,
    deadline: row.deadline.toISOString(),
    escrowId: row.escrowId ?? undefined,
    escrowContractId: row.escrowContractId ?? undefined,
    trustlessEngagementId: row.trustlessEngagementId ?? undefined,
    status: row.status,
    proofUrl: row.proofUrl ?? undefined,
    proofNote: row.proofNote ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function serializeDispute(row: DisputeRow): Dispute {
  return {
    id: row.id,
    errandId: row.errandId,
    openedBy: row.openedBy as "customer" | "runner",
    reasonCode: row.reasonCode ?? undefined,
    reason: row.reason,
    track: row.track === "fast" || row.track === "normal" ? row.track : undefined,
    evidenceUrl: row.evidenceUrl ?? undefined,
    status: row.status,
    resolution: row.resolution ?? undefined,
    resolverNotes: row.resolverNotes ?? undefined,
    createdAt: row.createdAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString(),
  };
}

export function serializeErrandMessage(row: ErrandMessageRow): ErrandMessage {
  return {
    id: row.id,
    errandId: row.errandId,
    authorWallet: row.authorWallet,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}

export function serializeTrustlessAction(row: TrustlessActionRow): TrustlessAction {
  return {
    id: row.id,
    errandId: row.errandId,
    disputeId: row.disputeId ?? undefined,
    type: row.type,
    status: row.status,
    signer: row.signer,
    transactionHash: row.transactionHash ?? undefined,
    errorMessage: row.errorMessage ?? undefined,
    createdAt: row.createdAt.toISOString(),
    submittedAt: row.submittedAt?.toISOString(),
  };
}

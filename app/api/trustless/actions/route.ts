import { badRequest, readJson } from "../../../lib/http";
import { findErrand } from "../../../lib/errands-repository";
import {
  prepareTrustlessAction,
  type TrustlessActionType,
} from "../../../lib/trustless-work";
import type { DisputeResolution } from "../../../types";

export async function POST(request: Request) {
  try {
    const body = await readJson<{
      errandId: string;
      type: TrustlessActionType;
      signer: string;
      disputeId?: string;
      resolution?: DisputeResolution;
      proofNote?: string;
    }>(request);
    const errand = await findErrand(body.errandId);
    if (!errand) return badRequest("Errand not found.", 404);
    const policyError = validateTrustlessActionPolicy(errand, body.type, body.signer);
    if (policyError) return badRequest(policyError, 403);
    const action = await prepareTrustlessAction(errand, body.type, body);
    return Response.json({ action }, { status: 201 });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to prepare Trustless Work action.");
  }
}

type PolicyErrand = NonNullable<Awaited<ReturnType<typeof findErrand>>>;

function validateTrustlessActionPolicy(
  errand: PolicyErrand,
  type: TrustlessActionType,
  signer: string,
) {
  if (!signer) return "Signer wallet is required.";

  switch (type) {
    case "initialize_escrow":
      if (errand.status !== "accepted") return "Escrow can only be created after a Padi accepts.";
      if (signer !== errand.customerWallet) return "Only the customer can create escrow.";
      if (!errand.runnerWallet) return "Padi wallet is required before escrow creation.";
      return null;
    case "fund_escrow":
      if (errand.status !== "escrow_created") return "Escrow can only be funded after creation.";
      if (signer !== errand.customerWallet) return "Only the customer can fund escrow.";
      return null;
    case "change_milestone_status":
      if (errand.status !== "in_progress") return "Proof can only be submitted after the Padi starts shopping.";
      if (signer !== errand.runnerWallet) return "Only the assigned Padi can update progress.";
      return null;
    case "approve_milestone":
      if (errand.status !== "proof_uploaded") return "Completion can only be confirmed after proof is uploaded.";
      if (signer !== errand.customerWallet) return "Only the customer can confirm completion.";
      return null;
    case "release_funds":
      if (errand.status !== "completed") return "Funds can only be released after completion is confirmed.";
      if (signer !== errand.customerWallet) return "Only the customer can release funds.";
      return null;
    case "dispute_escrow":
      if (!["escrow_funded", "in_progress", "proof_uploaded", "completed"].includes(errand.status)) {
        return "Escrow cannot be disputed in this state.";
      }
      if (signer !== errand.customerWallet && signer !== errand.runnerWallet) {
        return "Only the customer or assigned Padi can dispute escrow.";
      }
      return null;
    case "resolve_dispute":
      if (errand.status !== "disputed") return "Only disputed errands can be resolved.";
      if (signer !== errand.adminWallet) return "Only the assigned resolver can resolve this dispute.";
      return null;
  }
}

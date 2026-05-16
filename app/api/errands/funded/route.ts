import { getDb } from "../../../db";
import { trustlessActions } from "../../../db/schema";
import { badRequest, readJson } from "../../../lib/http";
import {
  createFundedErrand,
  type CreateErrandInput,
} from "../../../lib/errands-repository";
import { generateId } from "../../../lib/ids";
import {
  extractTrustlessContractId,
  extractTrustlessTransactionHash,
  prepareTrustlessCreateEscrow,
  prepareTrustlessFundEscrow,
  sendTrustlessSignedTransaction,
} from "../../../lib/trustless-work";

const SIMULATED_PADI_WALLET =
  process.env.GOPADI_SIMULATED_PADI_WALLET ??
  "GACZQ7MEBB6YSA32CPTHKIYLKCU5KAHHUIDMHQBZNEBPLUTXTVEUKMSN";

const RESOLVER_WALLET = process.env.GOPADI_RESOLVER_WALLET;

export async function POST(request: Request) {
  try {
    const body = await readJson<{
      errand: CreateErrandInput;
      deploySignedXdr?: string;
      fundSignedXdr?: string;
      preparedContractId?: string;
      deployTransactionHash?: string;
    }>(request);

    if (!body.deploySignedXdr && !body.fundSignedXdr) {
      const prepared = await prepareTrustlessCreateEscrow(
        pendingTrustlessErrand(body.errand),
        body.errand.customerWallet,
      );
      return Response.json({
        step: "sign_deploy",
        unsignedTransaction: prepared.unsignedTransaction,
      });
    }

    if (body.deploySignedXdr && !body.fundSignedXdr) {
      const deployResponse = await sendTrustlessSignedTransaction(body.deploySignedXdr);
      const contractId = extractTrustlessContractId(deployResponse);
      const deployHash = extractTrustlessTransactionHash(deployResponse);
      if (!contractId) {
        throw new Error("Trustless Work deploy did not return an escrow contract ID.");
      }

      const preparedFund = await prepareTrustlessFundEscrow({
        contractId,
        signer: body.errand.customerWallet,
        amount: body.errand.itemBudgetUSDC + body.errand.runnerFeeUSDC,
      });

      return Response.json({
        step: "sign_fund",
        contractId,
        deployTransactionHash: deployHash,
        unsignedTransaction: preparedFund.unsignedTransaction,
      });
    }

    if (!body.preparedContractId) {
      throw new Error("Prepared escrow contract ID is required before funding.");
    }
    if (!body.deploySignedXdr || !body.fundSignedXdr) {
      throw new Error("Deploy and fund signatures are required before creating an errand.");
    }

    const engagementId = pendingEngagementId(body.errand);
    const fundResponse = await sendTrustlessSignedTransaction(body.fundSignedXdr);
    const fundHash = extractTrustlessTransactionHash(fundResponse);
    const errand = await createFundedErrand({
      ...body.errand,
      runnerWallet: SIMULATED_PADI_WALLET,
      adminWallet: RESOLVER_WALLET,
      escrowId: engagementId,
      trustlessEngagementId: engagementId,
      escrowContractId: body.preparedContractId,
    });

    await recordSubmittedAction({
      errandId: errand.id,
      type: "initialize_escrow",
      signer: body.errand.customerWallet,
      signedXdr: body.deploySignedXdr,
      transactionHash: body.deployTransactionHash,
      requestPayload: {
        engagementId,
        signer: body.errand.customerWallet,
        contractId: body.preparedContractId,
      },
      responsePayload: {
        contractId: body.preparedContractId,
        transactionHash: body.deployTransactionHash,
      },
    });

    await recordSubmittedAction({
      errandId: errand.id,
      type: "fund_escrow",
      signer: body.errand.customerWallet,
      signedXdr: body.fundSignedXdr,
      transactionHash: fundHash,
      requestPayload: {
        contractId: body.preparedContractId,
        signer: body.errand.customerWallet,
        amount: body.errand.itemBudgetUSDC + body.errand.runnerFeeUSDC,
      },
      responsePayload: fundResponse,
    });

    return Response.json(
      {
        step: "created",
        errand,
        escrowContractId: body.preparedContractId,
        deployTransactionHash: body.deployTransactionHash,
        fundTransactionHash: fundHash,
      },
      { status: 201 },
    );
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Failed to fund and create errand.");
  }
}

function pendingTrustlessErrand(input: CreateErrandInput) {
  const now = new Date().toISOString();
  return {
    id: pendingErrandId(input),
    customerWallet: input.customerWallet,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail,
    runnerWallet: SIMULATED_PADI_WALLET,
    title: input.title,
    description: input.description,
    category: input.category,
    location: input.location,
    itemBudgetUSDC: input.itemBudgetUSDC,
    runnerFeeUSDC: input.runnerFeeUSDC,
    totalEscrowAmountUSDC: input.itemBudgetUSDC + input.runnerFeeUSDC,
    deadline: new Date(input.deadline).toISOString(),
    items: input.items,
    trustlessEngagementId: pendingEngagementId(input),
    status: "accepted" as const,
    createdAt: now,
    updatedAt: now,
  };
}

function pendingErrandId(input: CreateErrandInput) {
  return `pending_${stableKey(input)}`;
}

function pendingEngagementId(input: CreateErrandInput) {
  return `gopadi-${pendingErrandId(input)}`;
}

function stableKey(input: CreateErrandInput) {
  return Buffer.from(
    `${input.customerWallet}:${input.customerEmail}:${input.customerPhone}:${input.title}:${input.deadline}:${input.itemBudgetUSDC}:${input.runnerFeeUSDC}`,
  )
    .toString("base64url")
    .slice(0, 48);
}

async function recordSubmittedAction(input: {
  errandId: string;
  type: "initialize_escrow" | "fund_escrow";
  signer: string;
  signedXdr: string;
  transactionHash?: string;
  requestPayload: Record<string, unknown>;
  responsePayload: Record<string, unknown>;
}) {
  await getDb().insert(trustlessActions).values({
    id: generateId("tw_action"),
    errandId: input.errandId,
    type: input.type,
    status: "submitted",
    signer: input.signer,
    unsignedTransaction: "funded-create-flow",
    signedXdr: input.signedXdr,
    transactionHash: input.transactionHash,
    requestPayload: input.requestPayload,
    responsePayload: input.responsePayload,
    submittedAt: new Date(),
  });
}

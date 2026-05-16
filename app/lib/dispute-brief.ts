import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { Dispute, Errand, ErrandMessage, TrustlessAction } from "../types";

const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

const DISPUTE_BRIEF_SYSTEM_PROMPT = `You are GoPadi's resolver assistant.

Goal:
Prepare a concise, evidence-grounded dispute brief for a human resolver deciding whether to release escrow funds to the Padi or refund the customer.

Context:
- GoPadi is an escrow-backed local errands marketplace.
- A Padi is the local helper or runner.
- Trustless Work actions describe money-moving milestones and signatures.
- The human resolver makes the final decision. You assist, but do not claim legal finality.

Rules:
1. Use only the provided errand, dispute, proof, chat, and Trustless Work action data.
2. Do not invent missing facts, motives, locations, prices, messages, or proof.
3. Preserve local place names exactly as written.
4. Separate facts, gaps, and recommended questions.
5. If the evidence is mixed or incomplete, say so clearly.
6. Recommendation must be one of: release_to_runner, refund_customer, needs_more_evidence.
7. Confidence should reflect available evidence, from 0 to 1.
8. Keep language clear, calm, and practical for a Nigerian local errand resolver.`;

const disputeBriefSchema = z.object({
  summary: z.string(),
  timeline: z.array(z.string()).min(1),
  customerClaim: z.string(),
  padiPosition: z.string(),
  evidenceForCustomer: z.array(z.string()),
  evidenceForPadi: z.array(z.string()),
  missingEvidence: z.array(z.string()),
  recommendedQuestions: z.array(z.string()),
  recommendation: z.enum([
    "release_to_runner",
    "refund_customer",
    "needs_more_evidence",
  ]),
  confidence: z.number().min(0).max(1),
});

export type SmartDisputeBrief = z.infer<typeof disputeBriefSchema>;

export async function generateDisputeBrief(input: {
  errand: Errand;
  dispute: Dispute;
  messages: ErrandMessage[];
  actions: TrustlessAction[];
}): Promise<SmartDisputeBrief> {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required.");

  const { object } = await generateObject({
    model: openai(OPENAI_MODEL),
    schema: disputeBriefSchema,
    schemaName: "smart_dispute_brief",
    schemaDescription:
      "Resolver-facing GoPadi dispute brief grounded in errand, chat, proof, and escrow action evidence.",
    system: DISPUTE_BRIEF_SYSTEM_PROMPT,
    prompt: JSON.stringify(buildBriefPayload(input), null, 2),
  });

  return object;
}

function buildBriefPayload(input: {
  errand: Errand;
  dispute: Dispute;
  messages: ErrandMessage[];
  actions: TrustlessAction[];
}) {
  return {
    errand: {
      id: input.errand.id,
      title: input.errand.title,
      description: input.errand.description,
      category: input.errand.category,
      location: input.errand.location,
      status: input.errand.status,
      itemBudgetUSDC: input.errand.itemBudgetUSDC,
      runnerFeeUSDC: input.errand.runnerFeeUSDC,
      totalEscrowAmountUSDC: input.errand.totalEscrowAmountUSDC,
      deadline: input.errand.deadline,
      customerWallet: input.errand.customerWallet,
      runnerWallet: input.errand.runnerWallet,
      items: input.errand.items ?? [],
      proofNote: input.errand.proofNote ?? null,
      proofUrl: input.errand.proofUrl ?? null,
      createdAt: input.errand.createdAt,
      updatedAt: input.errand.updatedAt,
    },
    dispute: input.dispute,
    chat: input.messages.map((message) => ({
      authorWallet: message.authorWallet,
      body: message.body,
      imageUrl: message.imageUrl ?? null,
      createdAt: message.createdAt,
    })),
    trustlessActions: input.actions.map((action) => ({
      type: action.type,
      status: action.status,
      signer: action.signer,
      transactionHash: action.transactionHash ?? null,
      errorMessage: action.errorMessage ?? null,
      createdAt: action.createdAt,
      submittedAt: action.submittedAt ?? null,
    })),
  };
}

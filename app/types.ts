export type ErrandCategory =
  | "foodstuff"
  | "fuel"
  | "groceries"
  | "medicine"
  | "delivery"
  | "other";

export type ErrandStatus =
  | "posted"
  | "accepted"
  | "escrow_created"
  | "escrow_funded"
  | "in_progress"
  | "proof_uploaded"
  | "completed"
  | "released"
  | "disputed"
  | "refunded";

export type ErrandItem = {
  name: string;
  quantity: string | null;
  notes: string | null;
  substitutions: string[];
};

export type Errand = {
  id: string;
  customerWallet: string;
  runnerWallet?: string;
  adminWallet?: string;

  title: string;
  description: string;
  category: ErrandCategory;

  location: string;
  itemBudgetUSDC: number;
  runnerFeeUSDC: number;
  totalEscrowAmountUSDC: number;

  items?: ErrandItem[];

  deadline: string;

  escrowId?: string;
  escrowContractId?: string;
  trustlessEngagementId?: string;

  status: ErrandStatus;

  proofUrl?: string;
  proofNote?: string;

  createdAt: string;
  updatedAt: string;
};

export type DecodedErrand = {
  title: string;
  category: ErrandCategory;
  description: string;
  location: string;
  itemBudgetUSDC: number | null;
  deadlineText: string | null;
  items: Array<{
    name: string;
    quantity: string | null;
    notes: string | null;
    substitutions: string[];
  }>;
  shopperNotes: string[];
  deliveryInstructions: string | null;
  refundPreference: string | null;
  confidence: number;
};

export type ErrandMessage = {
  id: string;
  errandId: string;
  authorWallet: string;
  body: string;
  createdAt: string;
};

export type DisputeStatus = "open" | "resolved";
export type DisputeResolution = "release_to_runner" | "refund_customer";

export type Dispute = {
  id: string;
  errandId: string;
  openedBy: "customer" | "runner";
  reason: string;
  evidenceUrl?: string;
  status: DisputeStatus;
  resolution?: DisputeResolution;
  resolverNotes?: string;
  createdAt: string;
  resolvedAt?: string;
};

export type TrustlessAction = {
  id: string;
  errandId: string;
  disputeId?: string;
  type:
    | "initialize_escrow"
    | "fund_escrow"
    | "change_milestone_status"
    | "approve_milestone"
    | "release_funds"
    | "dispute_escrow"
    | "resolve_dispute";
  status: "pending_signature" | "submitted" | "failed";
  signer: string;
  transactionHash?: string;
  errorMessage?: string;
  createdAt: string;
  submittedAt?: string;
};

import {
  index,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const errandCategoryEnum = pgEnum("errand_category", [
  "foodstuff",
  "fuel",
  "groceries",
  "medicine",
  "delivery",
  "other",
]);

export const errandStatusEnum = pgEnum("errand_status", [
  "posted",
  "accepted",
  "escrow_created",
  "escrow_funded",
  "in_progress",
  "proof_uploaded",
  "completed",
  "released",
  "disputed",
  "refunded",
]);

export const disputeStatusEnum = pgEnum("dispute_status", ["open", "resolved"]);

export const disputeResolutionEnum = pgEnum("dispute_resolution", [
  "release_to_runner",
  "refund_customer",
]);

export const trustlessActionTypeEnum = pgEnum("trustless_action_type", [
  "initialize_escrow",
  "fund_escrow",
  "change_milestone_status",
  "approve_milestone",
  "release_funds",
  "dispute_escrow",
  "resolve_dispute",
]);

export const trustlessActionStatusEnum = pgEnum("trustless_action_status", [
  "pending_signature",
  "submitted",
  "failed",
]);

export const errands = pgTable(
  "errands",
  {
    id: text("id").primaryKey(),
    customerWallet: text("customer_wallet").notNull(),
    runnerWallet: text("runner_wallet"),
    adminWallet: text("admin_wallet"),

    title: text("title").notNull(),
    description: text("description").notNull(),
    category: errandCategoryEnum("category").notNull(),
    location: text("location").notNull(),

    itemBudgetUSDC: numeric("item_budget_usdc", {
      precision: 12,
      scale: 2,
      mode: "number",
    }).notNull(),
    runnerFeeUSDC: numeric("runner_fee_usdc", {
      precision: 12,
      scale: 2,
      mode: "number",
    }).notNull(),
    totalEscrowAmountUSDC: numeric("total_escrow_amount_usdc", {
      precision: 12,
      scale: 2,
      mode: "number",
    }).notNull(),

    deadline: timestamp("deadline", { withTimezone: true }).notNull(),
    items: jsonb("items").$type<
      Array<{
        name: string;
        quantity: string | null;
        notes: string | null;
        substitutions: string[];
      }>
    >(),
    escrowId: text("escrow_id"),
    escrowContractId: text("escrow_contract_id"),
    trustlessEngagementId: text("trustless_engagement_id"),

    status: errandStatusEnum("status").notNull().default("posted"),
    proofUrl: text("proof_url"),
    proofNote: text("proof_note"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("errands_status_idx").on(table.status),
    index("errands_category_idx").on(table.category),
  ],
);

export const disputes = pgTable(
  "disputes",
  {
    id: text("id").primaryKey(),
    errandId: text("errand_id")
      .notNull()
      .references(() => errands.id, { onDelete: "cascade" }),
    openedBy: text("opened_by").notNull(),
    reason: text("reason").notNull(),
    evidenceUrl: text("evidence_url"),
    status: disputeStatusEnum("status").notNull().default("open"),
    resolution: disputeResolutionEnum("resolution"),
    resolverNotes: text("resolver_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => [
    index("disputes_errand_id_idx").on(table.errandId),
    index("disputes_status_idx").on(table.status),
  ],
);

export const errandMessages = pgTable(
  "errand_messages",
  {
    id: text("id").primaryKey(),
    errandId: text("errand_id")
      .notNull()
      .references(() => errands.id, { onDelete: "cascade" }),
    authorWallet: text("author_wallet").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("errand_messages_errand_id_idx").on(table.errandId),
    index("errand_messages_created_at_idx").on(table.createdAt),
  ],
);

export const trustlessActions = pgTable(
  "trustless_actions",
  {
    id: text("id").primaryKey(),
    errandId: text("errand_id")
      .notNull()
      .references(() => errands.id, { onDelete: "cascade" }),
    disputeId: text("dispute_id").references(() => disputes.id, {
      onDelete: "set null",
    }),
    type: trustlessActionTypeEnum("type").notNull(),
    status: trustlessActionStatusEnum("status").notNull().default("pending_signature"),
    signer: text("signer").notNull(),
    unsignedTransaction: text("unsigned_transaction").notNull(),
    signedXdr: text("signed_xdr"),
    transactionHash: text("transaction_hash"),
    requestPayload: jsonb("request_payload").notNull(),
    responsePayload: jsonb("response_payload"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
  },
  (table) => [
    index("trustless_actions_errand_id_idx").on(table.errandId),
    index("trustless_actions_status_idx").on(table.status),
  ],
);

CREATE TYPE "public"."dispute_resolution" AS ENUM('release_to_runner', 'refund_customer');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('open', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."errand_category" AS ENUM('foodstuff', 'fuel', 'groceries', 'medicine', 'delivery', 'other');--> statement-breakpoint
CREATE TYPE "public"."errand_status" AS ENUM('posted', 'accepted', 'escrow_created', 'escrow_funded', 'in_progress', 'proof_uploaded', 'completed', 'released', 'disputed', 'resolved', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."trustless_action_status" AS ENUM('pending_signature', 'submitted', 'failed');--> statement-breakpoint
CREATE TYPE "public"."trustless_action_type" AS ENUM('initialize_escrow', 'fund_escrow', 'change_milestone_status', 'approve_milestone', 'release_funds', 'dispute_escrow', 'resolve_dispute');--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" text PRIMARY KEY NOT NULL,
	"errand_id" text NOT NULL,
	"opened_by" text NOT NULL,
	"reason" text NOT NULL,
	"evidence_url" text,
	"status" "dispute_status" DEFAULT 'open' NOT NULL,
	"resolution" "dispute_resolution",
	"resolver_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "errands" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_wallet" text NOT NULL,
	"runner_wallet" text,
	"admin_wallet" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" "errand_category" NOT NULL,
	"location" text NOT NULL,
	"item_budget_usdc" numeric(12, 2) NOT NULL,
	"runner_fee_usdc" numeric(12, 2) NOT NULL,
	"total_escrow_amount_usdc" numeric(12, 2) NOT NULL,
	"deadline" timestamp with time zone NOT NULL,
	"escrow_id" text,
	"escrow_contract_id" text,
	"trustless_engagement_id" text,
	"status" "errand_status" DEFAULT 'posted' NOT NULL,
	"proof_url" text,
	"proof_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trustless_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"errand_id" text NOT NULL,
	"dispute_id" text,
	"type" "trustless_action_type" NOT NULL,
	"status" "trustless_action_status" DEFAULT 'pending_signature' NOT NULL,
	"signer" text NOT NULL,
	"unsigned_transaction" text NOT NULL,
	"signed_xdr" text,
	"transaction_hash" text,
	"request_payload" jsonb NOT NULL,
	"response_payload" jsonb,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_errand_id_errands_id_fk" FOREIGN KEY ("errand_id") REFERENCES "public"."errands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trustless_actions" ADD CONSTRAINT "trustless_actions_errand_id_errands_id_fk" FOREIGN KEY ("errand_id") REFERENCES "public"."errands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trustless_actions" ADD CONSTRAINT "trustless_actions_dispute_id_disputes_id_fk" FOREIGN KEY ("dispute_id") REFERENCES "public"."disputes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "disputes_errand_id_idx" ON "disputes" USING btree ("errand_id");--> statement-breakpoint
CREATE INDEX "disputes_status_idx" ON "disputes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "errands_status_idx" ON "errands" USING btree ("status");--> statement-breakpoint
CREATE INDEX "errands_category_idx" ON "errands" USING btree ("category");--> statement-breakpoint
CREATE INDEX "trustless_actions_errand_id_idx" ON "trustless_actions" USING btree ("errand_id");--> statement-breakpoint
CREATE INDEX "trustless_actions_status_idx" ON "trustless_actions" USING btree ("status");
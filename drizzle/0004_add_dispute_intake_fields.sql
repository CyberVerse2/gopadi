ALTER TABLE "disputes" ADD COLUMN IF NOT EXISTS "reason_code" text;--> statement-breakpoint
ALTER TABLE "disputes" ADD COLUMN IF NOT EXISTS "track" text;

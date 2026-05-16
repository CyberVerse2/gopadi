ALTER TABLE "errands" ADD COLUMN IF NOT EXISTS "handoff_code" text;
--> statement-breakpoint
UPDATE "errands"
SET "handoff_code" = upper(right(regexp_replace("id", '[^a-zA-Z0-9]', '', 'g'), 6))
WHERE "handoff_code" IS NULL OR btrim("handoff_code") = '';
--> statement-breakpoint
ALTER TABLE "errands" ALTER COLUMN "handoff_code" SET NOT NULL;

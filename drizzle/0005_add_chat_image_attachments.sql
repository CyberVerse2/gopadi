ALTER TABLE "errand_messages" ADD COLUMN IF NOT EXISTS "image_url" text;
--> statement-breakpoint
ALTER TABLE "errand_messages" ADD COLUMN IF NOT EXISTS "image_name" text;

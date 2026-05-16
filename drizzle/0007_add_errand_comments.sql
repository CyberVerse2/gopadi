CREATE TABLE IF NOT EXISTS "errand_comments" (
  "id" text PRIMARY KEY NOT NULL,
  "errand_id" text NOT NULL,
  "author_wallet" text NOT NULL,
  "body" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "errand_comments" ADD CONSTRAINT "errand_comments_errand_id_errands_id_fk" FOREIGN KEY ("errand_id") REFERENCES "public"."errands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "errand_comments_errand_id_idx" ON "errand_comments" USING btree ("errand_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "errand_comments_created_at_idx" ON "errand_comments" USING btree ("created_at");

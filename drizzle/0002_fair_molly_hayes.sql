CREATE TABLE "errand_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"errand_id" text NOT NULL,
	"author_wallet" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "errand_messages" ADD CONSTRAINT "errand_messages_errand_id_errands_id_fk" FOREIGN KEY ("errand_id") REFERENCES "public"."errands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "errand_messages_errand_id_idx" ON "errand_messages" USING btree ("errand_id");--> statement-breakpoint
CREATE INDEX "errand_messages_created_at_idx" ON "errand_messages" USING btree ("created_at");
ALTER TABLE "obligations" ADD COLUMN "recipient_set_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "obligations" ADD COLUMN "recipient_set_by" text;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "approval_policy" jsonb;--> statement-breakpoint
ALTER TABLE "obligations" ADD CONSTRAINT "obligations_recipient_set_by_users_id_fk" FOREIGN KEY ("recipient_set_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Existing payees: the last update is the latest the address can have changed, so the hold is measured from it.
UPDATE "obligations" SET "recipient_set_at" = "updated_at" WHERE "recipient_address" IS NOT NULL AND "recipient_set_at" IS NULL;

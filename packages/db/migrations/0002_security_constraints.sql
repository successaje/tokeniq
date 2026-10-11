DROP INDEX "executions_chain_tx_uq";--> statement-breakpoint
DROP INDEX "executions_proposal_idx";--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "transfer_log_index" integer;--> statement-breakpoint
CREATE UNIQUE INDEX "approvals_proposal_user_uq" ON "approvals" USING btree ("proposal_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "executions_proposal_tx_uq" ON "executions" USING btree ("proposal_id","tx_hash");--> statement-breakpoint
CREATE INDEX "executions_chain_tx_idx" ON "executions" USING btree ("chain_id","tx_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_transfer_uq" ON "payments" USING btree ("organization_id","chain_id","tx_hash","transfer_log_index") WHERE "payments"."transfer_log_index" is not null;
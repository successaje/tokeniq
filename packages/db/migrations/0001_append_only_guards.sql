-- Append-only guards: audit history, approval decisions, Safe signatures and policy
-- versions can be inserted but never edited or deleted by the application role.
CREATE OR REPLACE FUNCTION tokeniq_reject_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% is append-only (attempted %)', TG_TABLE_NAME, TG_OP USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER audit_events_append_only BEFORE UPDATE OR DELETE ON audit_events FOR EACH ROW EXECUTE FUNCTION tokeniq_reject_mutation();
--> statement-breakpoint
CREATE TRIGGER approvals_append_only BEFORE UPDATE OR DELETE ON approvals FOR EACH ROW EXECUTE FUNCTION tokeniq_reject_mutation();
--> statement-breakpoint
CREATE TRIGGER safe_signatures_append_only BEFORE UPDATE ON safe_signatures FOR EACH ROW EXECUTE FUNCTION tokeniq_reject_mutation();
--> statement-breakpoint
CREATE TRIGGER policy_versions_append_only BEFORE UPDATE OR DELETE ON policy_versions FOR EACH ROW EXECUTE FUNCTION tokeniq_reject_mutation();

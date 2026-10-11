import type { PgBoss } from "pg-boss";
import { schema } from "@tokeniq/db";
import type { Deps } from "../context.js";
import { reconcileAlerts } from "../modules/monitoring.js";
import { refreshRecommendations } from "../modules/opportunities.js";
import { notifyNewAlerts } from "../services/notify.js";
import { loadOrgState } from "../services/state.js";

export const EVALUATE_ORG = "evaluate-org";
export const EVALUATE_ALL = "evaluate-all";

/** Re-run risk rules and recommendations for an organization after its data changes. */
export async function evaluateOrg(deps: Deps, orgId: string) {
  const state = await loadOrgState(deps.db, orgId, deps.now());
  const { opened } = await reconcileAlerts(deps, state);
  await refreshRecommendations(deps, state);
  if (opened.length && !state.isSample) await notifyNewAlerts(deps, orgId, opened);
}

export async function registerEvaluateJobs(boss: PgBoss, deps: Deps) {
  await boss.createQueue(EVALUATE_ORG);
  await boss.createQueue(EVALUATE_ALL);
  await boss.work<{ orgId: string }>(EVALUATE_ORG, async (jobs) => {
    for (const job of jobs) await evaluateOrg(deps, job.data.orgId);
  });
  await boss.work(EVALUATE_ALL, async () => {
    const orgs = await deps.db.select({ id: schema.organizations.id }).from(schema.organizations);
    for (const o of orgs) await boss.send(EVALUATE_ORG, { orgId: o.id }, { singletonKey: o.id, singletonSeconds: 60 });
  });
  await boss.schedule(EVALUATE_ALL, "*/10 * * * *");
}

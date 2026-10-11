import type { App, Deps } from "../context.js";
import { registerMonitoring } from "./monitoring.js";
import { registerObligations } from "./obligations.js";
import { registerOpportunities } from "./opportunities.js";
import { registerOrganizations } from "./organizations.js";
import { registerPolicies } from "./policies.js";
import { registerReports } from "./reports.js";
import { registerStatus } from "./status.js";
import { registerTreasury } from "./treasury.js";

export function registerModules(app: App, deps: Deps) {
  registerStatus(app, deps);
  registerOrganizations(app, deps);
  registerPolicies(app, deps);
  registerTreasury(app, deps);
  registerObligations(app, deps);
  registerOpportunities(app, deps);
  registerMonitoring(app, deps);
  registerReports(app, deps);
}

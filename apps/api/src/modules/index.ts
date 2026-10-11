import type { App, Deps } from "../context.js";
import { registerAccounts } from "./accounts.js";
import { registerCopilot } from "./copilot.js";
import { registerMonitoring } from "./monitoring.js";
import { registerPayments } from "./payments.js";
import { registerObligations } from "./obligations.js";
import { registerOpportunities } from "./opportunities.js";
import { registerOrganizations } from "./organizations.js";
import { registerPolicies } from "./policies.js";
import { registerProposals } from "./proposals.js";
import { registerReports } from "./reports.js";
import { registerSample } from "./sample.js";
import { registerStatus } from "./status.js";
import { registerTreasury } from "./treasury.js";

export function registerModules(app: App, deps: Deps) {
  registerStatus(app, deps);
  registerOrganizations(app, deps);
  registerPolicies(app, deps);
  registerTreasury(app, deps);
  registerObligations(app, deps);
  registerAccounts(app, deps);
  registerPayments(app, deps);
  registerOpportunities(app, deps);
  registerProposals(app, deps);
  registerMonitoring(app, deps);
  registerReports(app, deps);
  registerSample(app, deps);
  registerCopilot(app, deps);
}

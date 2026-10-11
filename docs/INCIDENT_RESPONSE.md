# Incident response

TokenIQ never holds customer funds or keys, so incidents fall into four kinds:
- wrong information that could lead to a bad decision;
- unauthorized access to organization data;
- compromise of the automation path, for organizations that installed bounded automation;
- availability.

## Severity

| Level | Examples | First response |
|---|---|---|
| SEV-1 | Wrong figures that change what is deployable (calculation bug, bad price data accepted as fresh); a cross-organization data leak; a compromised automation key with the guard installed; a forged or misattributed approval | Within 15 min: switch off `proposals,signatures` (and `copilot` if relevant); notify affected owners |
| SEV-2 | Stale data shown without a stale label; a provider outage that degrades accuracy; a failed execution not reported correctly | Within 1 hour |
| SEV-3 | UI defect without financial impact; a copilot answer that is wrong but correctly cited | Next business day |

## Playbooks

**Suspected calculation or data error (SEV-1)**
1. Set `DISABLED_FEATURES=proposals,signatures` and restart the API.
2. Reproduce with the organization's inputs. The engine is pure, so a test case in `packages/core/test` reproduces it exactly.
3. Fix, add the regression test and redeploy.
4. Tell affected organizations which figures were wrong, between which times, and whether any proposals were created on them. Use `audit_events` for `proposal.*`.

**Bad price or venue data**
1. Check `price_observations` (the feed's own `updated_at`) and `provider_health`.
2. If a feed reports a wrong but fresh price, remove its token's `feed` (the token becomes unpriced and figures say so) or disable `sync`.
3. If venue data is wrong, disable `opportunities`. Listing and addresses come from code, so execution targets are unaffected.

**Cross-organization access or account compromise**
1. Revoke sessions: delete affected users' rows in `sessions`, or rotate `BETTER_AUTH_SECRET` to end all sessions.
2. Review `audit_events` (IP, user agent and actions) for the window.
3. Remove compromised memberships. Rotate any credentials involved.

**Automation key compromised (organizations with bounded automation)**
1. A guardian calls `pause()` on `TreasuryReserveGuard`. This takes one signature and stops every module transaction.
2. Owners remove the Roles member or the module, using a normal multisig transaction.
3. The guard limited losses to the outflow limit per window, above the reserve floors. Check `ModuleTransactionChecked` events for what ran.

**Execution stuck in `submitted`**
1. Check the transaction on the explorer link. If it was dropped or replaced, the Safe nonce may have moved: the proposal becomes `stale` at the next action and owners re-sign.
2. Never re-submit the same signatures for a different nonce; the API prevents this.

## Communication

- Status page: `/status` reflects measured provider health. Add incident notes there manually if needed.
- Tell organization owners by email: what happened, what data or figures were affected, what they should check, and what was done.
- Post-incident: within 5 business days, a write-up in `audits/REMEDIATION_LOG.md` covering timeline, root cause, fix and regression test.

## Responsible disclosure

Security reports go to the address configured as `NEXT_PUBLIC_SECURITY_EMAIL` (shown on `/security`). Acknowledge within 2 business days. Coordinate disclosure; do not publish exploitable details before a fix.

# 0006 — Bounded automation

**Decision.**
- Autonomy levels are `observe`, `approval_required` (the default) and `bounded_automation`.
- Bounded automation cannot be switched on from settings (the API returns 422). It requires on-chain setup, all signed by the Safe owners:
  - a Zodiac Roles Modifier v2.1.1 scoping the automation key to approve/deposit/withdraw on listed venues, with the receiver equal to the Safe;
  - `TreasuryReserveGuard` installed as the Safe v1.5.0 module guard, which enforces reserve floors, outflow limits per window, a module allowlist, guardian pause and forbidden targets.

**Consequences.**
- Automation can never take the Safe below its floors and can be paused with one signature.
- Owner-signed transactions stay unrestricted.
- Safes on 1.4.1 cannot use bounded automation because they have no module guards.
- The guard has had an internal review only. It must not hold authority over real funds before an independent audit.

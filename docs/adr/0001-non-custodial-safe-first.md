# 0001 — Funds stay in the customer's Safe

**Context.** In the legacy design, a single-owner custodial `TreasuryVault` let an AI executor move the whole balance to any "strategy" address. Treasury teams already trust Safe multisigs. A new asset-holding contract would concentrate risk and require an audit before anyone could reasonably use it.

**Decision.** TokenIQ never takes custody:
- It reads balances from the organization's existing Safes and wallets.
- It prepares Safe transactions, and humans sign them in their own wallets.
- Optional automation is bounded on-chain by audited Zodiac Roles plus a minimal module guard (ADR 0006).

**Consequences.**
- No deposit or withdrawal contracts and no TVL held by TokenIQ.
- Execution requires a Safe at version 1.3.0 or later. EOAs can be tracked but not executed through.
- Product value comes from information, policy and coordination, not from custody.

# 0004 — Reserve model

**Decision.**
- **Requirement:** the maximum of three enabled rules:
  - a fixed floor;
  - runway months × monthly burn, where burn is the larger of the declared figure and itemized recurring obligations, so an understated estimate cannot shrink the reserve;
  - unpaid obligations due within the horizon, plus overdue ones, plus a buffer.
- **What counts toward it:** only liquid stablecoins in verified accounts, valued at the oracle price but never above $1 for USD stablecoins, less policy haircuts.
- **What doesn't:** positions in protocols, non-stable assets and unverified accounts. Unverified accounts can be included only by an explicit, audited policy switch.
- **Deployable:** additionally capped by a maximum share of the treasury deployed.

**Alternatives considered.** Summing the rules double-counts recurring obligations that are already part of burn. Counting positions toward the reserve depends on venue liquidity, which can vanish in exactly the scenarios the reserve exists for.

**Consequences.** The UI shows the binding rule and the arithmetic, and states which inputs are missing or estimated.

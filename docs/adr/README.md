# Architecture decision records

| ADR | Decision | Status |
|---|---|---|
| [0001](0001-non-custodial-safe-first.md) | Funds stay in the customer's Safe; no custodial vault | Accepted |
| [0002](0002-deterministic-engine-ai-explains.md) | A deterministic engine makes every financial calculation; the AI only explains | Accepted |
| [0003](0003-exact-money-arithmetic.md) | Money is bigint fixed-point, never floating point | Accepted |
| [0004](0004-reserve-model.md) | Reserve = strictest rule; conservative valuation; positions don't count | Accepted |
| [0005](0005-signatures-in-tokeniq.md) | TokenIQ collects owner signatures itself; no Safe Transaction Service dependency | Accepted |
| [0006](0006-bounded-automation.md) | Automation only through Zodiac Roles + TreasuryReserveGuard, off by default | Accepted |
| [0007](0007-stack.md) | Hono, Drizzle, pg-boss, Better Auth, Next.js 16 | Accepted |
| [0008](0008-venue-listing-in-code.md) | The vetted venue listing lives in code, not in data | Accepted |

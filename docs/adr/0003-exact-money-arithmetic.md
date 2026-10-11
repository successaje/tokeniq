# 0003 — Exact money arithmetic

**Decision.**
- **Engine:** reporting-currency values are bigint with 18 decimals ("wad"); token amounts keep their native decimals. Rounding is explicit: requirements round up, availability rounds down.
- **Database:** stores `numeric(38,18)` for USD and `numeric(78,0)` for raw token amounts. The driver returns them as strings.
- **API:** sends decimal strings.
- **Web app:** formats from strings with the engine's formatter.
- **Floats:** used only for chart geometry.

**Consequences.**
- Property tests prove round-tripping and bracketing of rounding.
- External APIs that return floats (the Morpho API) are converted through fixed-precision strings and rounded conservatively, as documented in `packages/chain/src/morpho.ts`.

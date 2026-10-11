# 0008 — The vetted venue listing lives in code

**Decision.**
- `packages/chain/src/listing.ts` lists the venue ids that may become executable proposals, together with the listing criteria and review date.
- Adapters may return many venues for reference, but `listed` is always recomputed from code, never taken from the data source.
- The transaction builder takes vault and pool addresses only from that listing.

**Consequences.**
- A compromised or wrong data source (for example the Morpho API) cannot point execution at a different contract.
- Changing the listing requires a code review and a deploy, which is deliberate.

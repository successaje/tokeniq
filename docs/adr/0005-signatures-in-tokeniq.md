# 0005 — Collect Safe signatures in TokenIQ

**Context.** The Safe Transaction Service now requires an API key, and unauthenticated access is limited to about 2 requests per second and 5,000 per month (`docs/research/integration-facts.md`, section B).

**Decision.**
- TokenIQ computes the EIP-712 `safeTxHash` itself and accepts owner signatures, both EIP-712 and `eth_sign`.
- It recovers each signer and checks it against the owners it reads live from the chain.
- It stores signatures append-only and encodes them in the order the Safe requires.
- Any wallet can submit `execTransaction`.
- Before signing and before submission, TokenIQ re-checks the nonce, threshold, policy and simulation.

**Consequences.**
- No third-party dependency is needed for execution.
- Transactions do not appear in the Safe{Wallet} queue unless an integration is added later (roadmap).
- A nonce taken by another transaction marks the proposal `stale` and requires re-signing.

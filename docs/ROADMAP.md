# Roadmap

What comes after this release, in order of priority. Nothing here has a date. Items move up when their prerequisites are met, and evidence from real teams can reorder everything. Scope for the current release is in the [PRD](PRD.md); known gaps are in [Known limitations](KNOWN_LIMITATIONS.md).

## 1. Before early access with real treasuries

Hardening that should land before any team relies on TokenIQ for decisions about real funds.

| Item | Why | Notes |
|---|---|---|
| **Second approval for loosening policy** | One owner or admin can still loosen treasury limits, and those apply at once (BE-16 residual). | Changes that widen limits or reduce approvals need another owner's approval, and every policy change is notified to owners. |
| **Approver must differ from whoever changed the payee** | Closes the remaining step of payee-change fraud (BE-17 residual). | The 48-hour hold, audit trail and owner notification already exist. |
| **On-chain rejection when cancelling a signed proposal** | Cancelling in TokenIQ does not invalidate owner signatures already collected (BE-11). | Prepare a zero-value Safe transaction at the same nonce, as Safe{Wallet}'s "reject" does, so the signed transaction can never execute. |
| **Execution recovery** | A dropped transaction keeps a proposal `submitted`, and a failed one has no retry control. | Timeouts for unseen transactions, manual entry of a transaction hash (checked to target the Safe), and retry or cancel from `failed`. |
| **Step-up authentication for approvals** | An approval should be a deliberate act, not just an active session. | Passkey re-authentication on approve and reject. |
| **Payment proposals in the web app** | The API, engine checks, payee hold and settlement exist; no screen creates them. | Includes payee capture on obligations and batch payments. |
| **Sender check on payment verification** | Today a transfer from anyone to the payee can verify a payment (BE-26). | Only transfers from the organization's own accounts should verify. |
| **Shared rate limiting** | The API rate limiter is in-memory, so each instance counts separately. | Postgres or Redis store before running more than one API instance. |
| **Supply-chain controls** | No SBOM or provenance checks; Docker base images not pinned by digest. | SBOM in CI, `npm` provenance where available, digest-pinned images. |
| **A "leaving TokenIQ" guide** | No lock-in is a product principle ([Vision](PRODUCT_VISION.md)). | Export everything (CSV and JSON), delete the organization, and the on-chain steps if a guard or module was ever installed. |

## 2. Next

| Item | Why | Prerequisite |
|---|---|---|
| **Leading venue risk indicators** | Venue warnings fire late (see [market opportunities](research/market-opportunities.md)). | Morpho `pendingConfigs` and timelocks, oracle type, look-through to collateral, curator concentration. |
| **Morpho Vault V2 venues** | Curators are moving to V2. | Compute exit liquidity without ERC-4626 `max*` views, which return 0 on V2. |
| **Nested-Safe and contract signers (EIP-1271)** | Mature DAOs use Safes as owners of Safes. | Contract-signature verification in the signature collector. |
| **Signer nudges** | Obligations have deadlines; signatures shouldn't wait for someone to open the app. | Email, then Slack or Telegram, with per-user settings. |
| **Accounting connectors** | Integrate with existing subledgers rather than build one. | Choice of first partner (Cryptio, Bitwave, or an ERP). |
| **Tokenized treasury funds as venues** | The DeFi premium over T-bill products is thin at times; teams should see both. | Listing criteria for permissioned assets: eligibility, KYC, redemption terms. |

## 3. Later

| Item | Prerequisite |
|---|---|
| **Deploy `TreasuryReserveGuard`** for teams that want on-chain enforcement of reserve rules. | An independent audit, Safe v1.5.0, a decision on TRG-10 (module recovery), and each Safe's owners choosing to install it. |
| **Compile treasury policy into Zodiac Roles permissions**, so bounded actions can run without a full multisig round. | Roles v2 integration design that keeps "widening scope needs a human". |
| **Bounded automation** within those on-chain permissions. | The two items above. |
| **More currencies** beyond USD and EUR. | A reliable FX feed and stablecoin coverage per currency. |
| **Pricing and billing.** | Willingness-to-pay evidence. The vision rules out fees on yield or assets under management. |

## Not planned

- Holding keys or custody, in any form.
- Fees taken from yield or assets.
- Bridging, fiat rails or cards.
- Letting a language model approve, sign, execute or widen its own permissions.

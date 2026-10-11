# Leaving TokenIQ

TokenIQ is designed so that you can stop using it at any time without moving funds or asking anyone's permission. This guide covers what to take with you, what to switch off, and what is still missing.

## What TokenIQ never had

- **No keys.** TokenIQ never held a private key, seed phrase or signing device, and it was never an owner of your Safe.
- **No on-chain footprint.** TokenIQ installs no module or guard on your Safe and changes no owners, threshold or settings. The optional `TreasuryReserveGuard` exists only in source code and is not deployed. If your team deployed and installed it yourselves, see the last section.
- **No funds in transit.** Every transaction executed through TokenIQ was a normal Safe transaction signed by your owners. Positions it helped create (vault shares, aTokens) sit in your Safe and are managed from any interface: Morpho, Aave, Safe{Wallet} or a block explorer.

## 1. Export your records

On **Reports**, download each CSV. Any member can export, viewers included: the exports contain what every member can already see in the app.

| Export | Contents |
|---|---|
| `activity.csv` | The complete audit trail: who did what, when, with the details of each change |
| `obligations.csv` | Every obligation with amount, currency, schedule, certainty, payee and invoice number |
| `payments.csv` | Every recorded payment, its status (verified on-chain, marked paid, skipped) and transaction |
| `balances.csv` | Balance observations per account and asset, with block numbers |
| `proposals.csv` | Every proposal, its status, approvals and execution transactions |
| `policies.csv` | Every version of your treasury and approval policies, with author and reason |

Spreadsheet formulas are neutralised in these files, so values starting with `=`, `+`, `-` or `@` are prefixed and will not execute when opened.

Uploaded obligation documents (invoices, contracts) can be downloaded one at a time from each obligation's page. Bulk document export is not available yet.

## 2. Stop anything in progress

- **Cancel open proposals** on Approvals.
- **Signed but unexecuted transactions:** if owners already signed a proposal's Safe transaction, cancelling it in TokenIQ does **not** invalidate those signatures. To guarantee it can never execute, have your owners execute any other transaction at the same Safe nonce, for example a "reject" transaction in Safe{Wallet}. This is planned to become a TokenIQ action ([Roadmap](ROADMAP.md)).
- **Wallet sessions:** disconnect TokenIQ from your wallet, and remove any WalletConnect session for TokenIQ in your wallet app.

## 3. Remove access and data

- **Members** can leave from Team. Owners can remove other members. The last owner cannot leave while others remain; transfer ownership first.
- **Accounts** can be removed from tracking on Accounts. Their history stays in the audit trail.
- **Sample workspaces** can be deleted by their owner.
- **Deleting a real organization and its data** is not self-service yet. Ask the operator of your TokenIQ deployment (see the contact address on `/contact`). The audit trail is append-only by design, so deletion is an operator action on the database, recorded outside the app.

## 4. If you installed the guard yourselves

`TreasuryReserveGuard` is not part of the hosted product. If your owners deployed it and set it as the Safe's module guard, remove it with a Safe transaction that calls `setModuleGuard(address(0))` on the Safe, signed by your owners. Removing the guard does not move funds. See [Contracts](CONTRACTS.md).

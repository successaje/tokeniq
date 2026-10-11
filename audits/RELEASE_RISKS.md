# Release risks: TokenIQ 2.0.0-rc.1

Assessment of the `tokeniq-2` branch at commit `78515fa8` (2026-10-11), written by the team that built it. **It is not an independent audit.** Read it together with [Known limitations](../docs/KNOWN_LIMITATIONS.md).

## Verdict

| Use | Ready? | Conditions |
|---|---|---|
| **Read-only treasury intelligence** (balances, obligations, reserve, deployable surplus, scenarios, recommendations, risk alerts, reports) | **Ready for a private pilot** | Owner actions in §4 done; dedicated RPC endpoints; teams told it is pre-release. |
| **Controlled execution through Safe** (proposals, internal approval, owner signatures, execution) | **Pilot only, with small amounts and supervision** | Safe owners compare the full `safeTxHash` with their hardware wallet; first transactions on Base Sepolia, then small mainnet amounts; the open items in §3 understood. |
| **Unsupervised production use with significant funds** | **Not yet** | Needs an independent security review of the API, web signing path and engine; a hardware-wallet check of the signing panel; and the High/Medium open items in §3 closed. |
| **`TreasuryReserveGuard` on-chain** | **Not ready; not deployed** | Independent audit, a decision on TRG-10 (recovery modules), and each Safe's owners choosing to install it. |

## 1. Evidence

All counts are from CI on `78515fa8` unless marked local.

| Layer | Result | What it shows |
|---|---|---|
| Engine (`packages/core`) | 73 passed (property tests with fast-check) | Exact money arithmetic, reserve rules, deployable surplus, policy validation, approval rules (including policy snapshots and current membership), payee hold, recommendations, risk, scenarios |
| Chain (`packages/chain`) | 62 passed offline; 11 live tests (mainnet reads) run on request | Safe hashing and signer recovery, MultiSend encoding, venue adapters, staleness |
| API (`apps/api`) | 118 passed, 6 skipped (the fork suite) | Auth, isolation, roles, lifecycle, 49 adversarial security tests, governance, idempotency, gap regressions, copilot boundaries |
| Base fork end to end | 6 passed (**local only**: the CI job skips until `BASE_RPC_URL` is set) | A real 2-of-3 Safe v1.4.1 verified, approved, simulated, signed by two owners, executed into Gauntlet USDC Prime, tracked to confirmation depth and reconciled |
| Web unit tests | 22 passed | Client-side checks of typed data before signing; link sanitising |
| Browser end to end (Playwright) | 41 passed (Linux CI and macOS) | Onboarding, invitation by email, sample workspace on every page, security headers and isolation, axe WCAG 2.2 A/AA in light and dark on every public and app page, phone layouts, performance budgets |
| Performance (lab, production build, no throttling) | LCP 216–500 ms, CLS 0, 253–344 KB JavaScript transferred | Well inside the budgets (2.5 s, 0.1, 450 KB public / 900 KB app) |
| Contracts (Foundry) | 85 passed | Guard unit, fuzz, invariant, deploy script and fork tests |
| Dependencies | `pnpm audit --prod`: no known vulnerabilities | Overrides for transitive axios and esbuild advisories |
| Secrets | gitleaks in CI on every commit | No findings on the branch |

## 2. What the internal reviews found

| Review | Findings | Fixed | Open or accepted |
|---|---|---|---|
| Backend ([`BACKEND_REVIEW.md`](BACKEND_REVIEW.md)) | 2 High, 10 Medium, 15 Low, 5 Info | Both High; 8 of 10 Medium (BE-16 and BE-17 with residuals) | BE-11 (Medium), BE-18 accepted; Lows listed in the review |
| Frontend ([`FRONTEND_REVIEW.md`](FRONTEND_REVIEW.md)) | 1 High, 15 Medium, 27 Low, 3 Info | 40, including the High (FR-01, typed data checked before signing) | FR-07 CSP, FR-32 Safe App sessions, FR-34, FR-29, FR-30, FR-33 |
| Contract ([`CONTRACT_REVIEW.md`](CONTRACT_REVIEW.md)) | TRG-01 to TRG-22 | Fixed, mitigated or accepted with rationale | TRG-10 (recovery modules) is an open product decision |
| Dependencies ([`DEPENDENCY_REVIEW.md`](DEPENDENCY_REVIEW.md)) | Licence and supply-chain review | Advisories removed by overrides | WalletConnect/Reown licence decision; no SBOM |

## 3. Open risks, ranked

| # | Risk | Severity | Mitigation today | To close |
|---|---|---|---|---|
| R1 | **No independent review.** Self-reviews miss what their authors miss. | High | Adversarial tests, a fork test of the full money path, two internal review passes, Safe threshold enforced on-chain | Independent review of the signing path, the policy engine and the API |
| R2 | **Signing panel not checked with a hardware wallet.** The client recomputes and displays the hashes, but nobody has compared them with a Ledger or Trezor screen. | High for execution | The Safe threshold and the owners' own wallets remain the final check | Prepare a proposal on a Base Sepolia Safe and compare all three hashes on a hardware wallet |
| R3 | **Cancelling does not invalidate collected signatures** (BE-11). | Medium | Execution data is refused for cancelled proposals; the exit guide explains the nonce rejection | Build the on-chain rejection transaction into TokenIQ |
| R4 | **CSP allows inline scripts** (FR-07, BE-30). | Medium | React escaping; the copilot renders no HTML; links sanitised | Nonce-based CSP, at least on app and auth routes |
| R5 | **RPC trust** (BE-18). A dishonest RPC could misreport balances or owners. | Medium | Block pinning, Safe code-hash checks, simulation before signing | Dedicated providers, and optionally a second RPC cross-check |
| R6 | **Single-admin limit changes** (BE-16 residual). | Medium | Versioned, audited; cannot loosen approval for proposals in flight | Second-owner approval for loosening changes |
| R7 | **Deployment not exercised.** Images not built locally; no environment deployed. | Medium | CI builds the web app; configs reviewed | Build images in CI; deploy a staging environment; run the release checklist smoke test |
| R8 | **Safe App sessions** (FR-32): the session cookie is not sent inside Safe{Wallet}'s iframe. | Low | The standalone app works | SameSite=None for the Safe App origin, or a token handoff |
| R9 | **Service worker updates** depend on a hand-bumped version (FR-30). It was also missing from git until `8e5f8022`. | Low | It never caches API data or signed-in pages | Stamp the build id at build time |
| R10 | **In-memory rate limits**, single worker. | Low | Documented; one instance of each | Shared store before scaling out |

## 4. Owner actions before any pilot

1. Choose a licence (there is no `LICENSE`).
2. Rotate or retire the legacy v1 hosted-database keys (details are in the private contracts repository).
3. Enable private vulnerability reporting, and set `NEXT_PUBLIC_SECURITY_EMAIL` and `NEXT_PUBLIC_CONTACT_EMAIL`.
4. Decide on WalletConnect: accept the Reown/WalletConnect community licences, or ship without WalletConnect.
5. Have counsel review `/legal/terms`, `/legal/privacy` and `/legal/risks`.
6. Set the `BASE_RPC_URL` repository secret so the fork test runs in CI.
7. Decide whether the copilot is on. If it is, `ANTHROPIC_API_KEY` is needed, and treasury data is sent to Anthropic's API when it is used.
8. Decide when `tokeniq-2` replaces `main`. Merging removes the legacy lockfiles behind 100 open Dependabot alerts.

## 5. Not verified

- No real wallet or hardware wallet was used. All signing in tests used local keys.
- No real organization data. The sample workspace and tests use simulated or forked state.
- No manual screen-reader pass. Accessibility evidence is automated axe checks plus keyboard tests.
- No load testing beyond the lab performance budgets.
- Docker images were not built (the Docker daemon was unavailable).
- The live copilot was not exercised against Anthropic's API. Tests use a fake client that checks request shape, tool execution and persistence.

> Public edition. Two findings (LF-01, LF-15) are summarised without detail pending owner remediation.

# Legacy TokenIQ web app: frontend architecture and QA audit

Audit date: 2026-10-11
Repository: `/Users/finisher/Documents/github/tokeniq` (public: `successaje/tokeniq`, branch `main`, HEAD `6855918`)
Purpose: decide what, if anything, carries forward into TokenIQ 2.0 (treasury intelligence and operations for crypto-native orgs).

Classification legend used throughout:
A functional · B demonstrative/mocked · C incomplete/broken · D outdated · E insecure/fragile · F reusable confidently · G needs refactor · H remove · I replace with modern infra · J preserve for history

---

## 1. Summary

The legacy app is a hackathon-style Next.js 15 front end. It looks like a broad DeFi/RWA treasury product, but very little of it is real.

- **Build:** `npm ci` succeeds (1,647 packages, 9m48s, 33 deprecation warnings). `next build` exits 0, but only because `next.config.js` sets `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds`. A real type check fails: the `tsc --noEmit` run stops on 6 syntax errors in one dead file. With that file excluded, there are **270 type errors in 55 files**. `next lint` reports **423 errors and 33 warnings**, including 7 `rules-of-hooks` violations.
- **Real vs mocked:** of 30 user-facing pages, **2 work end to end (7%)**: a docs redirect and the Supabase onboarding write. **4 are partly real (13%)**: some real chain reads or writes mixed with mocks. **20 are demo or mocked (67%)**. **4 are broken or incomplete (13%)**. So roughly **80% of the surface is mock or broken**. 22 flows fake progress with `setTimeout(resolve, …)` and then show success toasts.
- **Verified at runtime** with `next start` and the built-in browser: `/vaults/aave-vault` and `/profile` crash to the root error boundary. `/` crashes when Supabase env vars are missing. `/portfolio` shows a fabricated $12,545 portfolio with no wallet connected. `/api/users/[address]` accepts unauthenticated PATCHes. `/api/balance` passes raw upstream RPC errors to the client.
- **Secrets:** no live secret values are committed in the current tree (only `process.env` references, a placeholder and public wallet-registry IDs). Git history contained a Supabase credential that was removed the same day; combined with a weak legacy access policy it is a live risk for the legacy Supabase project if that project still exists (LF-01, LF-15). Details withheld from this public repository until the owner rotates the credential and fixes or retires the legacy Supabase project. The full record is in the private security review (TokenIQ-X/tokeniq-contracts, branch `security-review-2026-10`). The Pinata secret key is read from a `NEXT_PUBLIC_` variable, so it would ship in the client bundle (LF-02).
- **Highest-severity issues:**
  - A legacy database access-policy weakness affecting profile data (LF-01, details withheld; see above).
  - A "BTC vault deposit" sends a real transaction with hand-written `sweep(address,uint256)` calldata and then reports "Deposit Successful" no matter what happened (LF-03).
  - A payments page invents transaction hashes and links them to BscScan (LF-05).
- **Reuse recommendation:** keep **brand assets** (`public/tokeniq-*-logo.png`, `TokenIQ_*.PNG`, favicon, chain/token icons, after licence review) and a few **chain facts** (CCIP router addresses and chain selectors, testnet chain IDs, after correcting the Core 1114/1115 mix-up). Treat everything else as reference only. Rebuild the app shell, providers, data layer, Supabase schema, API routes and AI layer from scratch. Keep the repo read-only (archived) for history.

---

## 2. Method and limitations

**Method**
1. Read every route under `src/app`, every API route, the providers and contexts, all 37 hooks, `src/config/*`, `src/lib/*`, `src/services/*`, the ElizaOS agent files, the Supabase migrations, and the deploy configs. For each action I traced onClick → handler → hook/context → contract call, API call or `setTimeout`.
2. Grepped the tracked tree for secret patterns (OpenAI `sk-`, JWT `eyJ…`, Google `AIza`, GitHub `ghp_`, 32-byte hex keys, `PRIVATE_KEY`, `service_role`, `projectId`, `NEXT_PUBLIC_*`). Every 64-hex hit was contract bytecode in ABI artifacts, not a key.
3. Copied the repo (without `.git`) to `scratchpad/legacy-frontend-work/` and ran `npm ci`, `next build`, `tsc --noEmit` and `next lint` there.
4. Ran `next start` on port 3917 and visited `/`, `/vaults`, `/vaults/aave-vault`, `/profile` and `/portfolio` in the built-in browser, reading the console errors. I also curled the four API routes. The PATCH test only touched the local in-memory store.
5. Checked deprecations with `npm view <pkg> deprecated` and the `npm ci` warnings.
6. Resolved the hand-written calldata selector `0x6ea056a9` with viem: it is `sweep(address,uint256)`.

**Limitations**
- No `.env` was available, so nothing ran with a WalletConnect project ID, Supabase project or Pinata keys. I traced wallet-signing flows statically and did not execute them on a testnet.
- I did not verify on-chain deployment or bytecode at the configured addresses. "Real" here means "the code issues a real RPC call or transaction".
- The local clone is **shallow (1 commit)**. The background `git fetch --unshallow` stopped without finishing; it left an orphan `tmp_pack` in `.git/objects/pack`, and the repo is still shallow. I ran no write commands in that repo. For history I bare-cloned the public repo into `scratchpad/tokeniq-history.git` (74 commits, 6 branches; see §8.1 and §11).
- The audit covers `main` @ `6855918` (2025-09-30), which matches the local checkout. Two later unmerged branches (`feat_cxm`, `feature/ui-v2-arbitrum`, up to 2026-06-13) were only diff-scanned (§11).
- Contract (Solidity) quality is out of scope here; see `legacy-contracts-audit.md`.

---

## 3. Build, type-check and lint results

| Step | Command | Result |
|---|---|---|
| Install | `npm ci --no-audit --no-fund` (Node 24.2.0, npm 11.3.0) | **Pass**: 1,647 packages, 9m48s. 33 `deprecated` warnings (§9). Native `keccak` build compiled with clang. |
| Production build | `npx next build` | **Exit 0 in 1m24s**, "Compiled with warnings". 39 static pages generated. Types and lint skipped (`next.config.js:52` `ignoreBuildErrors: true`, `:57` `ignoreDuringBuilds: true`). |
| Build warning 1 | — | `'useNetwork' is not exported from 'wagmi'` (`src/components/NetworkSwitcher.tsx:3`). This is a wagmi v1 API on wagmi v2, and it **crashes `/vaults/aave-vault` at runtime** (confirmed in the browser). |
| Build warning 2 | — | `Can't resolve 'pino-pretty'` (from WalletConnect via `@web3modal/wagmi`). Harmless, but noisy. |
| Bundle size | — | `/vaults` first-load JS is **731 kB** and `/discover/overview` is 412 kB. Shared baseline is 105 kB. |
| Type check | `npx tsc --noEmit` | **Fail, exit 2**: 6 TS1xxx *syntax* errors in `src/app/(protected)/tokenize/components/tokenize-form.tsx` (unreferenced file), which stop the check early. |
| Type check (that file excluded) | `npx tsc --noEmit -p tsconfig.audit.json` (scratch-only config) | **Fail: 270 errors in 55 files**. Top codes: TS2339 (86, property does not exist), TS2322 (25), TS18048 (23), TS2304 (19), TS2307 (10, missing modules: `@elizaos/core`, `use-debounce`, `./Web3Providers`, `viem/contract`, `../ABI/*`, `next-themes/dist/types`), TS2305 (10). Worst files: `contexts/ContractContext.tsx` (32), `hooks/useVaultGovernance.ts` (27), `hooks/useVaultStaking.ts` (22). |
| Lint | `npx next lint` | **423 errors, 33 warnings**: no-unused-vars 314, no-explicit-any 77, react-hooks/exhaustive-deps 22, no-unescaped-entities 18, no-img-element 11, **rules-of-hooks 7** (`ContractContext.tsx:832,859,1000`; `useAssetCreation.ts:25,32`; `useVaultPositions.ts:66`; `ThemeSync.tsx:117`). |
| CSS output check | grep of `.next/static/css/*.css` | **Semantic tokens missing**: `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `bg-card`, `border-border`, `bg-gradient-primary` are not generated. Tailwind 4 (`@import "tailwindcss"`) ignores the v3-style `tailwind.config.ts` because there is no `@config` or `@theme`. `dark:` compiles to `@media (prefers-color-scheme:dark)`, so the theme toggle cannot drive `dark:` utilities. |
| Runtime smoke (`next start`, no env) | browser + curl | `/` → "Something went wrong" (`supabaseUrl is required.`: the Supabase client is created at module load, `src/lib/supabase/client.ts:30`). `/vaults/aave-vault` → crash (`useNetwork is not a function`). `/profile` → crash (`useUser must be used within a UserProvider`). `/portfolio` → renders a hardcoded portfolio. `/vaults` → renders hardcoded vaults and "Total Vaults 0". Console also shows `projectId is undefined` from Web3Modal. |
| Tests | — | No frontend test runner or tests. `contract-test-scripts/*.test.js` are Hardhat tests that need a Hardhat project that is not in this repo. |

Scratch cleanup: `node_modules` and `.next` were deleted from the scratch copy after these runs (§13).

---

## 4. Route inventory

Route groups: `(protected)` adds no URL prefix and **no auth**. `src/app/(protected)/layout.tsx` only renders the header, sidebar and `ElizaProvider`; it has no wallet or session gate. `src/app/Providers.tsx:70-72` treats every path not starting with `/protected` as "public" and wraps it in `PublicLayout`, which renders a header. Every `(protected)` page therefore gets **two headers**, which the runtime screenshot confirms. The whole app is client-only (`ClientLayoutWrapper.tsx:10` and `ClientLayout.tsx:9` use `ssr:false`), so there is no SSR or SEO, and every page is a spinner until JS loads.

| Route | Purpose | Class | Evidence (path:line) |
|---|---|---|---|
| `/` | Marketing landing plus wallet-gated Supabase onboarding modal | B, E | `src/app/page.tsx` (1,219 lines of marketing copy). Onboarding upsert at `:180-231` uses the header-spoofable RLS (LF-01). On success it redirects to `/dashboard` (`:225`), **which does not exist (404)**. Crashes without Supabase env (runtime). |
| `/onboarding` | Username → Supabase `profiles` upsert | A (writes), E | `src/app/onboarding/page.tsx:29-37`. Redirects to nonexistent `/dashboard` (`:41`). |
| `/discover` | Vault "marketplace" | B | `src/components/discover/DiscoverContent.tsx:75-90` random-walk chart (`Math.random`). `:124` hardcoded allocation. Vaults come from `src/config/vaults.ts` with hardcoded APY/TVL (`:41-42`, `:60-61`, …). `src/app/(protected)/discover/DiscoverContent.tsx` + `discoverData.ts` (`MOCK_TOKENS`, `:15`) is a second, unused implementation. |
| `/discover/overview` | Treasury overview | B | `src/app/(protected)/discover/overview/page.tsx:20-84` (assets, chains, yieldHistory, strategies all literals). |
| `/portfolio` | Portfolio overview | B | `src/components/portfolio/PortfolioOverview.tsx:8-62` ("Mock data – replace with real data fetching"). `ActivityFeed.tsx:5`. Renders $12,545 with no wallet (runtime). |
| `/strategies` | Strategy catalog plus "schedule" modal | B | `src/app/(protected)/strategies/page.tsx:23-24` (`strategiesData` mock), `:123-137` simulated load. Scheduling only updates local state (`:142`). |
| `/strategy` | Pick an AI strategy | B | `src/app/(protected)/strategy/page.tsx:12` literals, `:82` `setTimeout` then success toast. |
| `/crosschain` | Chainlink CCIP bridge | C, B | Submit calls `estimateCrossChainFee`, which is **not on the context value** (defined inside `aaveDeposit` at `ContractContext.tsx:832` and missing from `contextValue` at `:1240-1267`), so it always throws. Even if reached, the top-level `sendCrossChainTokens` (`:1094-1189`) sends no CCIP `value`. Fees are mocked (`components/fees-estimator.tsx:10,56`), history is mocked (`transactions-history.tsx:11`), and CCIP status is mocked (`page.tsx:60-69`). The ERC-20 balance read in `cross-chain-bridge.tsx:92-111` is real. |
| `/bridge` | Second bridge UI | B | `src/app/(protected)/bridge/page.tsx:56` "Simulated delay" then success. |
| `/vaults` | Vault list, stats, BTC section | partly A, B, C | Real: `VaultFactory.getAllVaults` through a Proxy reader (`hooks/useContracts.ts:69-96`, `ContractContext.tsx:523-563`), but the addresses are Fuji-only while reads use the wallet's current chain. Mocked: Yei vaults with 12.8%/8.9% APY and $5M/$3M TVL at placeholder addresses `0x…01`/`0x…02` (`vaults/components/vault-list.tsx:58-101`), and a hardcoded Aave card at 3.25% / $1.2M (`:204,208`). Broken: the deposit dialog uses `vault.assetAddress`/`vault.vaultAddress` (undefined on this type) and `AaveVault.abi` (the JSON is a bare array, so `.abi` is undefined), and calls `refetchVaults`, which the context doesn't provide (`vault-deposit-dialog.tsx:33,48-63`). The BTC section's network-switch check uses a stale `chainId`, so it always throws after a successful switch (`btc-vaults-section.tsx:97-111`). |
| `/vaults/[vaultId]` | Vault detail | B | `vaults/[vaultId]/page.tsx:12-13` "Mock data". Rebalance is a no-op `console.log` (`:62-75`). |
| `/vaults/aave-vault` | Aave V3 strategy vault | C (crashes) | `NetworkSwitcher` (`:138`) calls nonexistent `wagmi.useNetwork`, crashing the page (runtime). Behind that: deposit goes to `aaveDeposit`, which only defines nested `useCallback`s (rules-of-hooks violation) and does no deposit (`ContractContext.tsx:819-1013`). `aaveWithdraw`/`aaveRebalance` are stubs that `return true` (`:1015-1057`), so the page would show "Successfully withdrew/rebalanced". Withdraw uses `parseEther` (18 dp) for 6-dp USDC (`hooks/useAaveVault.ts:157`). |
| `/vaults/btc/[vaultId]` | BTC vault deposit | B, E (LF-03) | `vaults/btc/[vaultId]/page.tsx:99-152` raw `eth_sendTransaction` to `0xC310…FE54` with hand-written calldata `0x6ea056a9…01` (= `sweep(address,uint256)`, malformed). `:250-266` shows "Network Switched" **without switching**. `:181-188` shows "Deposit Successful … BTC has been deposited" after `setTimeout(2000)` without checking a receipt. APY/TVL are literals (`:18-45`). |
| `/tokenize` | RWA tokenization (IPFS + AssetFactory) | partly A, C, E | Real: Pinata upload (`utils/ipfs.ts:85-95`) and `writeContractAsync` to AssetFactory `0x0240…E168` (`hooks/useTokenization.ts:19,74,208`). Broken: the receipt is awaited on a hardcoded "Core Testnet 2" client whose id 1115 and RPC belong to a different network than the 1114 AssetFactory (`lib/viem.ts:5-8`, `lib/chains.ts:5`, `tasks.md:7`). The success toast reads `result.address`, but the hook returns `tokenAddress` (`tokenize-form-fixed.tsx:410-413`). Fake: "Chainlink Proof of Reserve"/"KYC" verification is a 5-minute countdown that then sets `verified` (`:104-115, :336-346`). Insecure: Pinata secret in a `NEXT_PUBLIC_` var (LF-02). |
| `/rwa` | RWA asset list plus tokenize modal | B, C | `rwa/page.tsx:18-19` `MOCK_RWA_ASSETS`. `components/modals/TokenizeAssetModal.tsx:87-88` "Mock score" 85 after 2s, then `writeContract({address:'0x...'})` (`:98-101`), which can only fail. |
| `/rwa/tokenize` | RWA tokenize form | C | `rwa/tokenize/page.tsx:41-44` `handleSubmit` is `// TODO`. |
| `/assets` | Asset table | B | `assets/page.tsx:13-26,81` `mockData`. |
| `/liquidity` | Lending pools / loan quotes | B | `liquidity/page.tsx:22,56` mock data. |
| `/loans` | Request a loan | B | `loans/page.tsx:13` literals, `:69` `setTimeout` then success. |
| `/stake` | Staking | B | `stake/page.tsx:14,70`. |
| `/payments` | "Yei Finance" payments | B, E (LF-05) | `payments/page.tsx:34-38` fabricates `0x${Math.random()…}` as a tx hash. `:112` links it to `testnet.bscscan.com`. |
| `/monitor` | Strategy monitor | B | `monitor/page.tsx:12-42` literals, `:78` simulated adjustment. |
| `/reports` | Report generator | B | `reports/page.tsx:69` simulated. Nothing is generated. |
| `/analytics` | Protocol analytics charts | B | `analytics/page.tsx:38-78` "Mock data" for TVL, distribution, users and volume. |
| `/insights` | AI insight panel | B, partly A | Hardcoded `marketData`/`strategyData` (`insights/page.tsx:19,34`). "Accept/Adjust/Explain" buttons only `console.log` (`:146-178, :302-347`). `DeepAnalysis` reads real **mainnet** ETH/USDC/WBTC balances via `useReadContract` (`components/DeepAnalysis.tsx:50-90`) but gets a **canned** "AI" report from `/api/analyze-portfolio`. Chat goes to `localhost:11434` (see `/chat`). |
| `/chat` | "Deepseek" chat | C | `components/chat/DeepseekChat.tsx:167` and `services/chat.ts:23-24` POST from the browser to `http://localhost:11434/api/chat` (local Ollama, `deepseek-r1:1.5b`). Only works on the developer's own machine. The balance command uses `/api/token-balance` (mainnet only). |
| `/settings` | Account/API/notification settings | B | `settings/page.tsx:34-39` "Settings saved" toast, nothing persisted. Fake `tk_prod_••••` API key and a no-op Regenerate button (`:569-580`). |
| `/profile` | Edit profile | C (crashes) | `profile/page.tsx:14` `useUser()`. `UserProvider` is never mounted, so it throws (runtime). The context would call nonexistent `/api/profiles/*` (`contexts/UserContext.tsx:39,64`). |
| `/whitepaper` | Static whitepaper | J | `src/app/whitepaper/page.tsx` (static copy). |
| `/documentation` | Redirect to GitBook | A | `documentation/page.tsx:12`. |
| `/protected/assets`, `/protected/dashboard` | Older duplicates under a literal `/protected` prefix | H | `src/app/protected/*`. The dashboard only prints the address. The sidebar in `components/layouts/Sidebar.tsx` links ~12 more `/protected/*` routes that don't exist. |
| `/test-imports`, `/test-supabase` | Dev scaffolding | H | `src/app/test-imports/page.tsx`, `src/app/(protected)/test-supabase/page.tsx`. Shipped to production builds. |
| `src/app/rwa/layout.tsx` | Orphan layout (no sibling page) | H | Uses the older `Sidebar`. |
| `src/app/(public)/*.page.tsx.bak` | Backups | H | 3 `.bak` files. |

**API routes**

| Route | Purpose | Class | Evidence |
|---|---|---|---|
| `POST /api/analyze-portfolio` | "AI portfolio analysis" | B | `api/analyze-portfolio/route.ts:8-58` returns the same markdown for every caller ("4.94 SEI", "210 Sepolia ETH", fixed APYs) after a 1s sleep (`:61`). Input ignored. |
| `GET /api/balance` | Native/ERC-20 balance (mainnet/Sepolia/Fuji) | A, E (LF-06) | `api/balance/route.ts`: no address validation, default public RPC `transport: http()` (`:24-27`), upstream error text returned to the client (`:66`). Runtime: returned the upstream URL and an HTML 429 body. **No callers.** |
| `GET /api/token-balance` | Mainnet ERC-20 balance | A, E | `api/token-balance/route.ts:42-45` "Default to mainnet". Map of chains `:6-9` unused. No RPC timeout: a runtime request hung for over 2 minutes. Used by `DeepseekChat.tsx:86`. |
| `GET/PATCH /api/users/[address]` | User profile | B, E (LF-04) | `api/users/[address]/route.ts:4-5` in-memory `Map` ("TODO: Replace with actual database"). PATCH has no auth (`:29-60`); a runtime test overwrote another address's profile. **No callers** (`UserContext` calls `/api/profiles`). |

**Navigation integrity.** 46 distinct internal link targets; **24 point to routes that don't exist**: `/dashboard`, `/help`, `/signup`, `/ai-insights`, `/discover/{yield,liquidity,assets,analytics}`, `/tokens/*`, `/docs/*` (6), and `/protected/{team,strategies,settings,rwa,rwa/tokenize,rwa/collateral,reports,payments,bridge,analytics,portfolio}`. The live sidebar (`components/layouts/NewSidebar.tsx`) links `/help` (`:133`). The header (`components/layouts/Header.tsx:10-14`) duplicates five sidebar links, and the header plus sidebar both render on protected pages.

---

## 5. Component, hook and context inventory

### 5.1 Providers, contexts and app shell

| Item | Class | Evidence and notes |
|---|---|---|
| `src/app/layout.tsx` | G, E (a11y) | `viewport.maximumScale: 1` (`:28`) blocks pinch-zoom (WCAG 1.4.4). Metadata icons `/favicon-16x16.png` and `/favicon-32x32.png` (`:56-57`) are not in `public/`. Duplicate `theme-color` metas (`:73-74` and the `viewport` export). |
| `ClientLayoutWrapper` → `ClientLayout` → `AppProviders` | G, H | Three nested "mounted" gates plus `ssr:false` dynamic imports (`ClientLayoutWrapper.tsx:7-17`, `ClientLayout.tsx:7-46`, `Providers.tsx:53-68`); `Web3Provider.tsx:204-255,278-288` adds two more. Each shows a spinner. |
| `src/components/providers/Web3Provider.tsx` | E, D, I | Two wallet stacks on one wagmi config: **Web3Modal v5** (deprecated, `:11-12,113-148,211-232`; created twice; `enableAnalytics: true`, `:132,216`) and **RainbowKit** (`:260-268`). Metadata says **"CoreIQ"** / `coreiq.xyz` (`:118-121`) while the ToS links point to `tokeniq.xyz`. A second `createConfig` (`:176-201`) is built and never used. Sei mainnet transport is `http('wss://sei.drpc.org')` (`:90`), a WebSocket URL in an HTTP transport. Hardcoded public RPCs (llamarpc, rpc.sepolia.org, drpc). |
| `src/config/wagmi.ts`, `src/lib/wagmi.ts` | H | Two more wagmi configs, unused. `utils/tokens.ts:2` imports a nonexistent `publicClient` from `@/config/wagmi` (TS2305). |
| `src/contexts/ContractContext.tsx` (1,310 lines) | C, E, H | The hub every vault, bridge and Aave flow goes through. Duplicate `ChainConfig` interface (`:15,59`). `createVault` matches the event topic `'0x...'` (`:697`), so it can never succeed. `aaveDeposit` body is broken scaffolding with nested hooks (`:819-1013`). Five methods are stubs that **return `true`** with no transaction (`aaveWithdraw :1015`, `aaveRebalance :1037`, `processTreasuryDecision :1191`, `performTreasuryUpkeep :1218`). Fee estimate is a formula, "For now, we'll return a mock response" (`:438-450`). Transaction history always returns `[]` (`:403-406`). `refreshVaults` is wired to `fetchAllVaults` (`:1252`), which doesn't set state. `.tsx.new` sibling is a stale copy. |
| `src/hooks/useContracts.ts` (`useContractInstances`) | G | A generic Proxy over `publicClient.readContract`/`walletClient.writeContract` (`:69-129`). It swallows read errors to `null` (`:90-93`), and writes are called with positional args although the Proxy expects an args array, so `ContractContext` writes pass the wrong shape. Addresses come from Fuji/Sepolia config no matter which chain is connected (`:139-145`). |
| `src/hooks/useContractInstances.ts` | H | A second copy of the same idea, used by `useVaultsData`/`useVaultActions`/`useVaultBalances`. |
| `src/contexts/UserContext.tsx` | C, H | Never mounted. Calls nonexistent `/api/profiles/:address` (`:39,64`). |
| `src/providers/ElizaProvider.tsx` + `components/eliza/ElizaOS.tsx` | B | A floating "ElizaOS" widget that rotates `MOCK_INSIGHTS` at random (`ElizaOS.tsx:74`). Not an agent. |
| Theme system | G, H | **Five** theme providers or contexts: `components/ThemeProvider.tsx`, `components/providers/ThemeProvider.tsx`, `components/theme/ThemeProviderWrapper.tsx` (the one in use, default dark), `contexts/ThemeContext.tsx` (its own `localStorage['theme']`), and `context/theme-context.tsx` (`ThemeContextProvider`). Plus `ThemeSync` (an unreachable effect after `return null`, `ThemeSync.tsx:113-131`), `ThemeVariables`, `ThemeInitializer`, `ThemeWrapper`, 13 `Theme*` wrappers, and three toggles (`ThemeToggle.tsx`, `theme-toggle.tsx`, `theme/ThemeToggle.tsx`). `next-themes` is a **devDependency** used at runtime. Web3Modal and RainbowKit are fixed to dark. The Tailwind 4 setup means the toggle cannot drive `dark:` utilities (§3). |
| Layouts | G, H | `layouts/NewSidebar.tsx` (in use) and `layouts/Sidebar.tsx` (old, `/protected/*` links), `Header.tsx`, `Topbar.tsx`, `DashboardLayout.tsx`, `DocsHeader.tsx`, `Footer.tsx` (unused), `navbar.tsx` + `NavbarWrapper.tsx` (unused). |

### 5.2 Hooks (37 files in `src/hooks`)

| Hook(s) | Reachable from a route? | Class | Notes |
|---|---|---|---|
| `useTokenization` | yes (`/tokenize`) | A, C | Real `writeContractAsync` to AssetFactory. Receipt polled on the wrong network (`lib/viem.ts`). Event parsing does a manual `keccak256` over `TokenCreated(...)` (`:117-128`). ABIs come from root `ABI/*.json` (Hardhat artifacts). |
| `useIPFSUpload` + `utils/ipfs.ts` | yes | A, E | Real Pinata upload, but with the secret key in the browser (LF-02). 500 ms "simulate preparation" (`useIPFSUpload.ts:44`). |
| `useAaveVault` | yes (crashing page) | C | Wraps the stubbed context methods. TVL read is real (`getTotalValue`). |
| `useVaultsData` | yes (`/discover`) | B, G | Config vaults (hardcoded APY/TVL). TVL "from config for now" (`:131`). Calls `aaveVault.read.getTotalValue([vaultAddress])` with an argument the ABI doesn't take (`:48`). |
| `useUserProfile` | yes (`/`, `/test-supabase`) | A, E | Supabase `profiles` lookup. Logs session and address to the console (`:28,41,44`). |
| `useNetwork` (local), `FeatureGuard` | yes | G | Small chain/feature gate. The idea is reusable; the code isn't needed. |
| `use-toast` | yes | F (pattern) | shadcn toast; regenerate from upstream rather than copying. |
| `useYeiIntegration` → `services/yei/yeiService.ts` | only via unused `YeiVaultCard` | B, C | Yei addresses are literally `'0x...'` (`yeiService.ts:7-9`). |
| `useCrossChainRouter` | only via unused `CrossChainTransfer` | C, H | Own chain/token tables duplicating `ContractContext`. |
| `useVaultGovernance`, `useVaultStaking`, `useVaultStrategies`, `useVaultMetrics`, `useVaultPositions`, `useVaultTransactions`, `useVaultDashboard`, `useVaultNotifications`, `useVaultAnalytics`, `useVaultTransactionHistory`, `useVaultToken`, `useVaultDeposit`, `useVaultWithdraw`, `useVaultCreation`, `useVaultCreationForm`, `useVaults`, `useTokenApproval`, `useCrossChainVault`, `useSwitchNetwork`, `useERC721NFT`, `useAssetCreation`, `useAssetFactory`, `useTokenizedVault`, `useVaultActions`, `useVaultBalances` | **No.** They only reference each other or unused components (`VaultList.tsx`, `VaultStats.tsx`, `VaultCard`, `TokenizeVaultForm`). | H | About 25 speculative hooks: 111 of the 270 type errors, governance/staking calls to functions that aren't in any committed ABI, `useVaultAnalytics` "Mock data generator" (`:49-143`), and wagmi-v1 APIs (`usePrepareContractWrite`, `useContractWrite`) called inside callbacks (`useAssetCreation.ts:25,32`). |
| `use-theme` | via unused theme components | H | — |

### 5.3 Components (non-ui)

- **Unreferenced (H):** `NavbarWrapper`, `ProtocolHealthChart`, `TokenAllocationChart`, `TokenChart`, `VolumeChart`, `YieldPerformanceChart`, `TokenizeVaultForm`, `WalletConnectButton`, `cross-chain/CrossChainTransfer`, `discover/DiscoverSidebar`, `layouts/Footer`, `modals/DepositModal`, `modals/StrategyMonitorModal`, `providers/ClientProviders` (imports nonexistent `./Web3Providers`), `providers/ThemeProvider`, `providers/Web3Provider.backup`, `theme/ThemeInitializer`, `theme/ThemeWrapper`, `vaults/YeiVaultCard`, `vaults/VaultCard.tsx.bak`, `(protected)/vaults/components/{VaultList,VaultStats}.tsx` (PascalCase duplicates of the kebab-case files in use), and tokenize forms `tokenize-form.tsx` (doesn't parse), `tokenize-form-clean.tsx`, `minimal-form.tsx`. `tokenize-form.fixed.tsx` only exports a type. About 40% of non-ui component files are dead.
- **`src/components/ui/*` (26 shadcn/Radix primitives):** G/I. They're stock shadcn, but their token classes (`bg-background`, …) are not generated under this Tailwind 4 setup (§3). Regenerate with the current shadcn CLI in 2.0 rather than copying.
- **Charts:** two libraries for the same job, Recharts (10 files) and Chart.js + react-chart-js-2 (1 file). Every chart dataset is a literal or `Math.random`.

### 5.4 ElizaOS agent (server-side)

| Item | Class | Evidence |
|---|---|---|
| `src/index.ts` (character + project) | C, J | Imports `@elizaos/core`, **which is not in `package.json`** (TS2307). Not imported by the Next app. Picks plugin-anthropic/openai/local-ai based on env (`:21-23`). |
| `src/plugins/tokeniq.plugin.ts` | B, C | `ANALYZE_ASSET` and `TOKENIZE_ASSET` actions return constants: New York real estate worth 1,000,000, `tokenAddress: '0x...'` (`:156-193`). |
| `src/characters/tokeniq.character.json`, `src/lib/prompts.ts` | J | Persona and prompt copy; keep as product history. |
| `.gitignore:12-14` mentions `tokeniq-agent/`, but that directory is not in the tree. | — | The agent appears to have lived in a separate untracked folder. |

---

## 6. Data-source inventory (real vs mocked)

| Data shown | Source | Real? | Evidence |
|---|---|---|---|
| Wallet address / connection | wagmi + RainbowKit/Web3Modal | Real (needs WC project ID) | `Web3Provider.tsx` |
| Supabase profile exists / username | Supabase `profiles` | Real, insecure | `useUserProfile.ts:30-34`, `page.tsx:197-217` |
| ETH/USDC/WBTC balances in Deep Analysis | `useReadContract` on **mainnet** (`chainId: mainnet.id`) | Real | `DeepAnalysis.tsx:50-90` |
| Bridge token balance | `publicClient.readContract(balanceOf)` | Real | `cross-chain-bridge.tsx:92-111` |
| Vault list (factory vaults) | `VaultFactory.getAllVaults()` on Fuji address, current-chain client | Real call, usually empty | `ContractContext.tsx:523-563`; runtime "Total Vaults 0" |
| Aave vault TVL | `AaveVault.getTotalValue()` (Sepolia address) | Real call, page crashes first | `ContractContext.tsx:1059-1092` |
| Vault APYs / TVLs (all vault cards) | Literals in `config/vaults.ts`, `vault-list.tsx`, `btc/[vaultId]/page.tsx`, `btc-vaults-section.tsx` | **Mock** | `config/vaults.ts:41-42,60-61,79-80,98-99,117-118,135-136`; `vault-list.tsx:66-67,86-87,204,208` |
| Vault APY from chain | — | Never computed | `ContractContext.tsx:513` "TODO: Calculate APY" |
| Portfolio tokens, values, prices, activity | Literals | **Mock** | `PortfolioOverview.tsx:11-62`, `ActivityFeed.tsx:5-52` |
| Token prices / market caps on Discover | `MOCK_TOKENS` (unused path) and config | **Mock** | `discover/discoverData.ts:15` |
| Performance / yield charts | `Math.random` random walk | **Mock** | `components/discover/DiscoverContent.tsx:75-90`; `useVaultAnalytics.ts:49-143` |
| Analytics (TVL growth, users, volume) | Literals | **Mock** | `analytics/page.tsx:38-78` |
| Insights, market data, strategies, news ticker | Literals | **Mock** | `insights/page.tsx:19-34`; `components/NewsTicker.tsx` |
| "AI" portfolio analysis | Static markdown in API route | **Mock** | `api/analyze-portfolio/route.ts:8-58` |
| "ElizaOS" insights widget | `MOCK_INSIGHTS[random]` | **Mock** | `components/eliza/ElizaOS.tsx:74` |
| AI chat | Local Ollama at `localhost:11434` | Dev-only | `services/chat.ts:23`; `DeepseekChat.tsx:167` |
| CCIP fees, ETAs, status, history | Literals or formula | **Mock** | `fees-estimator.tsx:10-75`; `crosschain/page.tsx:69`; `transactions-history.tsx:11`; `ContractContext.tsx:438-450` |
| Transaction history (context) | Always `[]` | **Stub** | `ContractContext.tsx:403-406` |
| Payment tx hash | `Math.random` | **Fabricated** | `payments/page.tsx:38` |
| RWA assets, verification score | Literals; score fixed at 85 | **Mock** | `rwa/page.tsx:19`; `TokenizeAssetModal.tsx:88` |
| PoR / KYC verification | 5-minute client countdown | **Fake** | `tokenize-form-fixed.tsx:104-115,336-346` |
| Settings / API key / notifications | Local state; masked literal | **Mock** | `settings/page.tsx:34-39,569-580` |
| Loans, stake, strategy select, monitor, reports, bridge | `setTimeout(2000)` then success | **Simulated** | `loans:69`, `stake:70`, `strategy:82`, `monitor:78`, `reports:69`, `bridge:56` |
| IPFS documents | Pinata pinning API | Real | `utils/ipfs.ts:85-140` |
| Token mint / asset creation | AssetFactory `writeContractAsync` | Real tx, broken receipt wait | `useTokenization.ts:74,208` |

---

## 7. Chains and contract addresses configured

Chains are defined in **six places**, with conflicting values: `config/chains.ts`, `config/constants.ts`, `lib/chains.ts`, `contexts/ContractContext.tsx:26-57`, `hooks/useCrossChainRouter.ts`, `components/providers/Web3Provider.tsx:36-93`, plus `utils/networks.ts`.

| Chain | ID(s) used | Issues |
|---|---|---|
| Ethereum mainnet | 1 | Public `eth.llamarpc.com` / viem default (`eth.merkle.io`, which returned a 429 at runtime). |
| Sepolia | 11155111 | CCIP router `0xD1d6…eb71`, selector `16015286609057818161` (`ContractContext.tsx:27-36`). AaveVault `0xd7b5…f277` (`config/contracts.ts:12`). Test USDC/DAI/USDT in `aave-vault/page.tsx:21-35`. |
| Avalanche Fuji | 43113 | VaultManager `0xF673…9b40`, VaultFactory `0xC310…FE54`, TreasuryAIManager `0x86C4…0dBc` (`config/contracts.ts:7-9`). CCIP router `0x6444…1b9c`, selector `14767482510784806043`. |
| Base Sepolia | 84532 | CCIP router `0x7CC3…68f6`, selector `10344971235874465080`. USDC `0x036C…23a1` (`useCrossChainRouter.ts:77`). |
| Sei testnet (EVM) | 1328 | Router `0x59F5…a98A` (`config/contracts.ts:28`). "Token templates (Sei Testnet)" `0xCaFF…`, `0xc9C0…`, `0x8e82…`, `0xd6D6…`, `0x7b65…` (`config/contracts.ts:15-21`; README lists the same). |
| Sei mainnet (EVM) | 1329 | `config/chains.ts:20` RPC `rpc-sei.keplr.app` is a **Cosmos/Tendermint** endpoint, not EVM. `Web3Provider.tsx:90` uses a `wss://` URL in `http()`. |
| Core mainnet | 1116 | `rpc.coredao.org`. |
| Core testnet | **1114 vs 1115 conflict** | `config/chains.ts:5` `CORE_TESTNET_ID = 1115`, but the `CORE_TESTNET` object is `id: 1114` with RPC `rpc.test.btcs.network` (`:116-127`). `lib/chains.ts:5` calls 1115 "Core Testnet 2". `tasks.md:7-10` says the AssetFactory proxy `0x0240…E168` is on **test2** (1114). `btc-vaults-section.tsx:94` hardcodes 1114; `btc/[vaultId]/page.tsx` uses the 1115 constant. |
| Bitcoin | `id: 2` | A made-up EVM-style chain object (`config/chains.ts:188-203`). |
| Polygon, Arbitrum, Optimism, Goerli, BSC, Fantom | various | Listed in `config/chains.ts` and `config/constants.ts:9-32`. Goerli is deprecated. None are in the wagmi config. |

**Address-label inconsistencies.** The same addresses carry different meanings in different files:
- `0xC310…FE54` is "VaultFactory (Fuji)" in `config/contracts.ts:8`, "ERC20VaultToken" in `utils/contracts.ts:15` and `tasks.md:8`, "USDC" `tokenAddress` in `config/vaults.ts:46`, and the BTC deposit target in `btc/[vaultId]/page.tsx:126`.
- `0xc9C0…82b5` is "WBTC (Sei)" in `config/contracts.ts:17` and the README, "ERC1155HybridAsset (Core)" in `utils/contracts.ts:17` and `tasks.md:10`, and "WAVAX" in `config/vaults.ts:84`.
- Vault configs pair mainnet WBTC/USDC with placeholder vaults `0x…01/02/03` (`config/vaults.ts:27-31`).

**Reusable facts.** CCIP router addresses and chain selectors for Sepolia, Fuji and Base Sepolia are public Chainlink values. Re-verify them against Chainlink's CCIP directory before reuse (F, after verification). Everything TokenIQ deployed is testnet-only and belongs to the contracts audit.

---

## 8. Security findings

Severity uses impact on users or the org if this code were deployed as-is. No secret values appear in this report.

| ID | Severity | Component | Evidence | Impact | Recommendation |
|---|---|---|---|---|---|
| LF-01 | **Critical** | Legacy Supabase access policies (`public.profiles`) | Details withheld from this public repository until the owner rotates the credential and fixes or retires the legacy Supabase project. The full record is in the private security review (TokenIQ-X/tokeniq-contracts, branch `security-review-2026-10`). | Profile data integrity and confidentiality in the legacy project. | Owner: fix or retire the legacy Supabase project. 2.0 does not use Supabase. |
| LF-02 | High | IPFS upload (Pinata) | `src/utils/ipfs.ts:13-14,92-93,135-136`; `tokenize-form-fixed.tsx:238-239` read `NEXT_PUBLIC_PINATA_API_KEY` and **`NEXT_PUBLIC_PINATA_SECRET_API_KEY`** in browser code. | When configured, Next inlines the Pinata secret into the public JS bundle. Anyone can then pin, unpin or list on the org's Pinata account (cost and data integrity). | Upload through a server route using a short-lived, scoped JWT (Pinata signed upload URLs) or a server-held key. Never put secrets in a `NEXT_PUBLIC_` variable. If a key was ever set in a deployed environment, rotate it. |
| LF-03 | High | BTC vault "deposit" | `src/app/(protected)/vaults/btc/[vaultId]/page.tsx:99-152` (raw `eth_sendTransaction` to `0xC310…FE54`, `data: 0x6ea056a9…01` = `sweep(address,uint256)` with a truncated argument, `gas: 0x7a120`); `:250-266` (claims "Network Switched" without switching); `:181-188` (claims "Deposit Successful" after 2s without checking a receipt). | Users are asked to sign an unexplained contract call on **whatever chain they're on**. Gas is spent and the call reverts or does something unexpected, yet the UI says the BTC was deposited. Deceptive UX; it would be a legal and reputational problem in production. | Remove. Every write in 2.0 must decode and show calldata (function and args), pin `chainId`, simulate first, and report success only from a confirmed receipt. |
| LF-04 | High | `PATCH /api/users/[address]` | `src/app/api/users/[address]/route.ts:29-60`. Confirmed at runtime: an unauthenticated PATCH overwrote another address's `profile`. | Any caller can overwrite any user's name, email, company or country. The store is in-memory, so it also leaks across tenants on the same instance and is lost on restart. | Delete the route. 2.0 profile writes need an authenticated session bound to the address (SIWE) and schema validation (zod). |
| LF-05 | Medium | Payments | `src/app/(protected)/payments/page.tsx:34-38` builds a `Math.random()` "transaction hash"; `:112` links it to `testnet.bscscan.com`. | Fabricated payment confirmations. A user could think a payment was made. | Remove. Show only real hashes from receipts. |
| LF-06 | Medium | `GET /api/balance`, `GET /api/token-balance` | `api/balance/route.ts:6-9,24-27,66`; `api/token-balance/route.ts:26-45`. No input validation (an invalid address went straight to the RPC), unauthenticated, no rate limit, default public RPCs, no timeout (a runtime request hung for over 2 minutes), and upstream error bodies returned to the client (runtime: the RPC URL and an HTML 429 page). | Open RPC relay: anyone can use the server to make RPC calls, exhausting quota and risking IP bans. Function timeouts and cost amplification. Internal details leak. Not SSRF, since the RPC URLs are fixed. | Remove. In 2.0, read balances through a server data layer with an allow-listed chain/token registry, zod-validated addresses, a paid RPC with timeouts, per-session rate limits, and generic error messages. |
| LF-07 | Medium | False success from stubbed writes | `contexts/ContractContext.tsx:1015-1057` (`aaveWithdraw`, `aaveRebalance` return `true`), `:1191-1238` (treasury decision/upkeep return `true`); `vaults/aave-vault/page.tsx:104-125` shows "Successfully withdrew/rebalanced". Also 22 `setTimeout(resolve, …)` simulated flows. | Users would see success for operations that never happened (masked today only because the page crashes first). | For 2.0, make it a rule that no success state appears without a receipt or server acknowledgment. Add a lint or code-review check for `setTimeout(resolve` in non-test code. |
| LF-08 | Medium | Wallet/chain correctness | Core testnet 1114/1115 mix-up (`config/chains.ts:5,116-127`; `lib/chains.ts:5`; `lib/viem.ts:5-8`). Writes (`useTokenization.ts:74,208`) don't pin `chainId`. Reads use Fuji/Sepolia addresses against whatever chain is connected (`hooks/useContracts.ts:139-145`). | Transactions can land on the wrong network. Receipts are polled on a different chain, so the UI fails after a successful mint. Reads return null or garbage. | Use one typed chain registry (viem `defineChain`), set `chainId` on every read and write, and verify `getChainId()` before signing. |
| LF-09 | Medium | Client-side LLM endpoint | `services/chat.ts:23-24`, `components/chat/DeepseekChat.tsx:167` call `http://localhost:11434` from the browser. | In production this either fails or, worse, reaches a service on the *visitor's* own localhost (a local Ollama) and sends their portfolio context to it. Mixed content over HTTPS. | Route all model calls through a server endpoint with auth, rate limits and deterministic guardrails (the 2.0 copilot design). |
| LF-10 | Low | Privacy / telemetry | `Web3Provider.tsx:132,216` `enableAnalytics: true` (WalletConnect/Reown analytics) with no consent UI. `useUserProfile.ts:28,41,44` and 255 `console.*` calls log sessions, addresses and tx params. Public `SELECT` on emails (LF-01). | Data sent to third parties without consent; noisy logs with PII. | Turn analytics off by default and add a consent banner. Strip logs in production builds. |
| LF-11 | Low | Build hygiene | `next.config.js:52,57` ignore TS and ESLint errors. `:65` deprecated `images.domains`. `:7` `experimental.serverActions: {}`. `package.json:6,9` has a duplicate `"start"` key. `package-lock.json` **and** `yarn.lock` are committed even though `.gitignore:47-48` lists both. | Type and lint regressions ship silently (270 TS errors today). The lockfile choice is ambiguous. | 2.0 CI: `tsc --noEmit`, `eslint` and tests must pass. One package manager and one lockfile. |
| LF-12 | Low | Deployment configs | `netlify.toml` redirects `/*` to `/index.html` with status 200 and `publish = ".next"` (wrong for Next; breaks API routes and deep links); `NODE_VERSION = "18"` (EOL). `vercel.json` uses the legacy `builds` array, which disables zero-config Next features. | Broken or fragile deploys. | Don't carry these over. 2.0 has its own deploy config. |
| LF-13 | Info | Public identifiers in tree | `src/config/constants.ts:2` placeholder `'YOUR_WALLET_CONNECT_PROJECT_ID'`. `Web3Provider.tsx:140-143,224-227` WalletConnect Explorer **wallet IDs** (MetaMask, Trust, Rainbow, OKX). These are public registry identifiers, not credentials. | None. | None. |
| LF-14 | Info | Committed secrets (current tree) | Grep over all 392 tracked files: **no** API keys, JWTs (Supabase anon or service-role), private keys, mnemonics, Pinata/web3.storage tokens, or WalletConnect project IDs. All 64-hex matches are contract bytecode in `ABI/*.json`. `.gitignore` covers `.env*`. | — | See LF-15 and §8.1 for history. |

| LF-15 | **Medium** (High while LF-01 is unresolved) | Supabase credential in public git history (removed the same day) | Details withheld from this public repository until the owner rotates the credential and fixes or retires the legacy Supabase project. The full record is in the private security review (TokenIQ-X/tokeniq-contracts, branch `security-review-2026-10`). | See LF-01. | Owner: rotate the Supabase keys. |

### 8.1 Git history secret scan

Method: bare-cloned `https://github.com/successaje/tokeniq` into scratch (74 commits, all 6 branches). Generated `git log --all -p` excluding `node_modules`, lockfiles, ABI JSON, `dist/` and source maps (4.3 MB of patches). Scanned added lines for OpenAI/Anthropic `sk-`, JWT, `AIza`, `gh?_`, 32-byte hex, `private_key`/`mnemonic`/`secret` assignments, WalletConnect `projectId` literals, Pinata keys, `*.supabase.co` URLs, `KEY/TOKEN/SECRET=` env assignments, `gsk_`/`xai-`/`r8_`, and `did:key:`. Listed every path ever added that looks like an env or key file.

Results:
- **One real finding (LF-15):** a Supabase credential in a reverted commit (details withheld; see LF-15).
- 32-byte hex hits (8) in `src/components/providers/Web3Provider.tsx` are public WalletConnect Explorer wallet IDs, not keys.
- "Key-like" literal hits were contract addresses (`erc20VaultToken`, `ERC20_VAULT_TOKEN`).
- No `.env*`, `.pem`, keystore or mnemonic file was ever committed. `my-agent/.eliza/config.json` and `tokeniq-agent/.eliza/config.json` were committed, and the scan found no credentials in them.
- No OpenAI, Anthropic, Deepseek, Pinata, web3.storage or WalletConnect project-ID values were found.

---

## 9. Dependency status

| Package (declared) | Status | Verified via | Used in `src`? | Action |
|---|---|---|---|---|
| `@web3modal/wagmi` 5.1.11, `@web3modal/ethers` 5.1.11 | **Deprecated**: "Web3Modal is now Reown AppKit" | `npm view … deprecated` | wagmi: 4 files; ethers: 0 | I: Reown AppKit, or RainbowKit/ConnectKit alone |
| `@web3modal/react` 2.7.1 | **Deprecated** ("use @web3modal/wagmi") | npm view | 1 file | H |
| `@supabase/auth-helpers-nextjs` 0.10.0 | **Deprecated** ("no longer supported"; use `@supabase/ssr`) | npm view, npm ci | 0 | H |
| `@supabase/auth-ui-react`, `@supabase/auth-ui-shared` | Not deprecated, but unused (the upstream repo is in maintenance) | npm view | 0 | H |
| `@supabase/ssr` 0.6.1 | Current is 0.12.7 | npm view | 0 (declared, unused) | Use `@supabase/ssr` properly in 2.0 if Supabase is kept |
| `web3.storage` 4.5.5 | **Deprecated**: old API sunset 9 Jan 2024 | npm view, npm ci | 0 | H |
| `@web3-storage/w3up-client` 17.3.0 | npm ci prints a deprecation warning for 17.3.0 (the w3up client was later published as `@storacha/client`, current 2.1.4) | npm ci log, npm view | 0 | H (choose IPFS/Filecoin pinning separately if needed) |
| `@ipld/car` | Fine | — | 0 | H |
| `@types/react-dropzone` | **Deprecated** stub (react-dropzone ships its own types) | npm view | — | H |
| `@tailwindcss/nesting` `0.0.0-insiders…` | Insiders build pinned; redundant on Tailwind 4 | npm view | — | H |
| `next` 15.3.3 | Latest is 16.4.0 | npm view | — | 2.0 starts on current Next |
| `wagmi` ^2.15 / `viem` ^2.31 | wagmi 3.7.7 and viem 2.57.4 are current | npm view | — | 2.0: wagmi v3 + viem latest |
| `@rainbow-me/rainbowkit` 2.2.6 | Current is 2.2.11; maintained | npm view | — | Option for 2.0 |
| `recharts` 2.15 **and** `chart.js` 4.5 + `react-chartjs-2` | Two charting libraries; recharts 3.x is current | npm view | 10 files vs 1 | Pick one in 2.0 |
| `zod` 3.25 | zod 4.x is current | npm view | 2 | 2.0 on zod 4 |
| `@elizaos/core` | **Imported but not declared** in `package.json` | tsc TS2307 | 2 | I (2.0 copilot needs its own design) |
| `next-themes` | In **devDependencies** but runtime-critical | package.json | 20+ files | — |
| `typechain`, `@typechain/*` | Dev-only; `scripts/generate-abi-types.ts` targets ethers-v6 while the app uses viem | — | — | I: use viem/wagmi CLI ABI typing |
| Transitive | 33 deprecation warnings: `@walletconnect/{sign-client,ethereum-provider}@2.16.1`, `@walletconnect/modal`, `@motionone/vue`, `@paulmillr/qr`, `glob@7/8`, `inflight`, `ipfs-core-*`, `multiaddr*`, `lodash.isequal`, `@web3-storage/*` | npm ci log | — | All disappear if the deprecated direct deps above are removed |

---

## 10. Accessibility and design observations

- **Zoom blocked:** `layout.tsx:28` `maximumScale: 1` fails WCAG 1.4.4 (Resize text).
- **No SSR:** blank page or spinner until JS runs (`ssr:false` at the root). No content without JS, poor LCP, and nothing for screen readers until hydration.
- **Duplicate navigation:** on every `(protected)` page the public header (Discover/Portfolio/Analytics/Liquidity/Whitepaper + Connect Wallet) sits above a sidebar with the same entries (confirmed in a screenshot). 24 dead internal links (§4).
- **Theme system:** five providers/contexts, three toggles, 13 `Theme*` wrapper components, and a `README.md` in `components/theme/`. Under Tailwind 4 the semantic tokens (`bg-background`, `text-muted-foreground`, …) are never generated and `dark:` follows the OS, not the toggle. Wallet modals are fixed to dark. Theming in 2.0 needs one token source (CSS variables plus Tailwind 4 `@theme`) and one provider.
- **Semantics:** 23 `aria-*` attributes and 21 `sr-only` in the whole app. Images have `alt` text. Many icon-only buttons rely on Lucide icons with no label. 18 unescaped-entity lint errors in copy.
- **Landing page:** 1,219-line single client component with animated rotators (`page.tsx:27-60`, no `prefers-reduced-motion` handling). Copy pitches "Decentralized BlackRock", "AI Treasury Manager", Chainlink PoR and CCIP. None of that is implemented. Footer links to X, LinkedIn and GitHub (`page.tsx:1168-1192`). Keep the copy only as history.
- **Brand inconsistency:** "TokenIQ" in UI, "CoreIQ" in wallet metadata (`Web3Provider.tsx:118`), "TokenIQ – Token Analytics Platform" as the page title.
- **Visual assets:** `public/` holds 80 files (6.4 MB), including light/dark TokenIQ logos (`tokeniq-lightmode-logo.png`, `tokeniq-darkmode-logo.png`, `TokenIQ_light*.PNG`, `TokenIQ_dark.PNG`, `tokeniq.png`), ElizaOS logos, and chain/token icons (duplicated across `public/`, `public/icons/chains/` and `public/icons/tokens/`). `site.webmanifest` exists, but the favicon PNGs referenced in metadata do not.

---

## 11. Git history facts

Source: a bare clone of the public repo in scratch (`scratchpad/tokeniq-history.git`, 109 MiB pack). The local working repo is still **shallow (1 commit)** because the background unshallow fetch didn't finish, and I ran no write commands there.

- **Commits:** 74 across all branches; `main` has 66 (5 merge commits overall). No tags.
- **Timeline:** first commit 2025-06-07 ("Initial commit from Create Next App"). Activity bursts in **Jun 2025 (37 commits)** and **Aug 2025 (25)**, then sporadic: Jul 2, Sep 2, Oct 2, Nov 1, **Mar 2026 4, Jun 2026 1**. `main` HEAD is `6855918` (2025-09-30, "inisghts panel ret").
- **Authors (by name):** Success Aje 64, Sukuna 7, Olaoluwa 2, D Finisher 1. So effectively a single-maintainer hackathon codebase.
- **Branches:** `main`; `feat/chart`, `feat/wallet-connect`, `feat/dark-mode` (Jun 2025, merged-era); **`feat_cxm`** (+7 over main, to 2026-03-20: Creditcoin RWA vault, Polkadot Hub/XCM UI, README "focus entirely on Polkadot"); **`feature/ui-v2-arbitrum`** (+4 over main, to 2026-06-13: "UI redesign for hackathon demo", 83 files, +13.7k/−4.5k lines, adds `/treasury`, `/approval`, `/proposal`, `/assessment`, `/copilot`, `/dashboard` and `src/abis/arbitrum/*`). **This audit covers `main`.** A quick diff scan of the two newer branches found 28 and 44 added mock/simulation markers respectively and 0 and 4 added contract read/write lines. The Arbitrum branch's treasury page plots `mockTreasuryGrowth`, and its approval page animates execution steps with `setTimeout`. They follow the same demo pattern and keep `ignoreBuildErrors`. Its treasury/approval/copilot page *concepts* are the closest thing to 2.0's scope and are worth viewing as **UX history (J)**, not as code to reuse.
- **Repository bloat:** about 24,400 of 24,946 historical paths are under **`my-agent/node_modules/`** (an ElizaOS starter committed with dependencies, plus `tokeniq-agent/`, 28 paths). This explains the 109 MiB pack for a ~10 MB app.
- **Notable events:** Tailwind v3→v4 migration on day 1 (`5eee4e59`, "update Tailwind CSS to v4 with proper configuration"), whose leftover `tailwind.config.ts` is the cause of the missing tokens (§3). A credential was committed and reverted the same day (LF-15; details withheld). The "Revert 'updated Ai staking reccomendation'" on 2025-09-30 is the last change on `main`.
- **Hackathon lineage** (from the README and branches): Chainlink CCIP (Sepolia/Fuji/Base Sepolia), Core (BTCFi), Sei (Yei Finance), Creditcoin (RWA), Polkadot Hub (XCM), Arbitrum (UI v2). The same UI was re-targeted at each event, which is why chain config is spread across six places.

---

## 12. Recommendations: reuse, remove, preserve

### 12.1 Reuse (F), after review
1. **Brand assets:** `public/tokeniq-lightmode-logo.png`, `public/tokeniq-darkmode-logo.png`, `public/TokenIQ_light-removebg-preview.png`, `public/TokenIQ-removebg-preview.png`, `public/TokenIQ_dark.PNG`, `public/TokenIQ_light.PNG`, `public/tokeniq.png`, `src/app/favicon.ico`. Re-export as SVG or optimized PNG and add the missing 16/32 px favicons.
2. **Chain/token icons** in `public/icons/{chains,tokens}`: usable, but they're third-party marks. Check trademark and usage terms, or source from an icon set with a clear licence.
3. **Chain facts**, rewritten as a single typed registry and re-verified at source: Chainlink CCIP router addresses and selectors for Sepolia, Fuji and Base Sepolia (`ContractContext.tsx:26-57`); chain IDs for Sei EVM testnet/mainnet (1328/1329) and Core (1116; testnet **1114** = test2; fix the 1115 confusion); mainnet USDC/WBTC/USDT/DAI addresses (`config/tokens.ts`, `DeepseekChat.tsx:20-27`).
4. **Ideas and patterns, not code:** `FeatureGuard` (feature availability by chain), the decode-event-log approach in `useTokenization`, the toast pattern, the shadcn primitive list (regenerate from upstream).
5. **ABIs** (`ABI/*.json`, `src/abis/*.json`): reuse only if 2.0 talks to the same deployed testnet contracts. The contracts audit decides that.

### 12.2 Remove (H) or replace (I) in 2.0
- **Replace (I):** the wallet stack (Web3Modal v5 + RainbowKit + 3 unused wagmi configs) with one connector library on wagmi v3/viem; the Supabase header-auth model with SIWE + server sessions + claim-based RLS (or Postgres with app-level auth); all client-side secrets with server routes; local Ollama/canned "AI" with a server-side copilot with deterministic guardrails; the `ContractContext` god-object with typed per-domain query hooks (TanStack Query) over a server data layer; the Tailwind 3-style config under v4 with Tailwind 4 `@theme` tokens.
- **Remove (H):** every mocked page and data file (§4, §6); `api/analyze-portfolio`, `api/users/[address]`, `api/balance`, `api/token-balance`; the ~25 orphan vault hooks; dead components (§5.3); `.bak`, `.new`, `.backup` and `.fixed` files; `test-imports`, `test-supabase`, and the `protected/` routes; root scripts `fix-imports.js`, `fix-app-imports.js`, `fix-imports.sh`, `update-imports.js`, `update-all-imports.js`, `rename-ui-components.sh`, `paths.js`; `jsconfig.json` (duplicates `tsconfig`); `netlify.toml`, `vercel.json`; `contract-test-scripts/` (belongs in the contracts repo); `scripts/generate-abi-types.ts` (ethers typechain); unused dependencies (§9).

### 12.3 Preserve for history (J)
Archive the legacy repo read-only (GitHub "Archive"); don't delete it. Rotate the Supabase keys first (LF-15). Specifically worth keeping as reference:
- Branch `feature/ui-v2-arbitrum` (2026-06): `/treasury`, `/approval`, `/proposal`, `/assessment`, `/copilot` UX concepts, the closest prior art to 2.0's treasury, approvals and copilot scope. They're mocked, so use them for UX reference only.
- `README.md`, `contract-documentation.md`, `tasks.md`: the original vision, deployments and Sei/Core/CCIP narrative.
- `src/app/whitepaper/page.tsx`, `src/app/page.tsx` landing copy.
- ElizaOS character and persona: `src/characters/tokeniq.character.json`, `src/index.ts`, `src/lib/prompts.ts`.
- `supabase/migrations/*`, only as an example of what not to do (LF-01).
- The hackathon deploy addresses listed in §7, for continuity of on-chain history.

### 12.4 Carry-forward guardrails for 2.0, drawn from these findings
1. CI blocks on `tsc`, `eslint` (including `react-hooks/rules-of-hooks`) and tests. No `ignoreBuildErrors`.
2. No mock data in production routes. Fixtures live only in tests or Storybook, behind an explicit `DEMO_MODE` banner if demos are needed.
3. Every write flow pins `chainId`, simulates, shows decoded calldata, waits for the receipt, and only then shows success.
4. Server-only secrets; nothing secret behind `NEXT_PUBLIC_`.
5. Authenticated sessions (SIWE) and RLS keyed to verified identity, not headers.
6. One chain/token registry, one theme provider, one chart library, one wallet library.
7. SSR or RSC for shell and content; client components only where interaction needs them. Don't block zoom.

---

## 13. Artifacts and cleanup

- Scratch copy: `scratchpad/legacy-frontend-work/` (its `node_modules` (~1 GB) and `.next` were deleted after the runs). Logs kept in `scratchpad/`: `npm-ci.log`, `next-build.log`, `tsc.log`, `tsc-audit.log`, `lint.log`. `tsconfig.audit.json` exists only in the scratch copy.
- History clone: `scratchpad/tokeniq-history.git` (bare, ~113 MB, public data) is kept for follow-up history questions; delete it when no longer needed. The intermediate patch dump used for the secret scan was deleted because it contained the LF-15 key.
- No tracked file in `/Users/finisher/Documents/github/tokeniq` was modified, and no git write command was run there. The orphan `.git/objects/pack/tmp_pack_*` (≈56 MB) was left by the interrupted background `fetch --unshallow`, not by this audit.

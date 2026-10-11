/**
 * TokenIQ's vetted venue list.
 *
 * Only venues listed here may become executable proposals; everything else that
 * the adapters return is shown for reference only (`Opportunity.listed = false`).
 * Listing is an integration review by TokenIQ engineering — it is NOT an
 * endorsement, an audit, or a guarantee of safety or returns. Each organization's
 * treasury policy still applies on top of this list.
 */

export const LISTING_REVIEW = {
  date: "2026-10-11",
  reviewer: "TokenIQ engineering (internal)",
  note: "Listing is an integration review, not an endorsement or audit. It records that the venue met the criteria below on the review date; market conditions change and listings are re-reviewed.",
} as const;

/** Machine-readable form of the criteria (kept in sync with {@link LISTING_CRITERIA}). */
export const LISTING_RULES = {
  assets: ["USDC"],
  morpho: {
    chainIds: [8453, 1],
    vaultVersion: "V1 (MetaMorpho)",
    minTvlUsd: 50_000_000,
    /** Independent risk-curation firms. Protocol-run curators (e.g. SparkDAO) are excluded for now. */
    curators: ["Gauntlet", "Steakhouse Financial"],
    noCriticalWarnings: true,
    withdrawal: "instant_subject_to_liquidity",
  },
  aave: {
    chainIds: [8453, 1, 42161, 10],
    market: "Aave v3 core market",
    reserve: "native USDC",
  },
} as const;

export const LISTING_CRITERIA = `TokenIQ vetted venue criteria (review ${LISTING_REVIEW.date}, ${LISTING_REVIEW.reviewer})
1. Asset: USDC only (Circle-issued native USDC; bridged variants are excluded).
2. Morpho vaults: Vault V1 (MetaMorpho) on Base or Ethereum mainnet, listed by Morpho, with at least $50M TVL at review,
   curated by an independent risk curator (Gauntlet or Steakhouse Financial), no RED/critical warnings from the Morpho API at review,
   and withdrawals instant subject to market liquidity (no queue or lock). Vault V2 vaults are not listed yet because their
   ERC-4626 max* views return 0, so per-account withdrawable liquidity cannot be read on-chain.
3. Aave v3: the native USDC reserve of the Aave v3 core market on Base, Ethereum, Arbitrum One or OP Mainnet.
4. Every address was checked on-chain (asset, Morpho Blue singleton or Aave aToken) on the review date.
${LISTING_REVIEW.note}`;

export interface ListedVenue {
  /** Opportunity id: `morpho:${chainId}:${vault}` or `aave-v3:${chainId}:${aToken}` (lowercase address). */
  id: string;
  protocol: "morpho" | "aave-v3";
  chainId: number;
  /** Morpho vault, or the Aave reserve's aToken. */
  address: string;
  name: string;
  asset: "USDC";
  curator: string | null;
  /** Why it qualified, with the figures observed at review. */
  rationale: string;
  /** Where the address came from. */
  source: string;
}

const MORPHO_SOURCE =
  'Morpho API https://api.morpho.org/graphql `vaults(where:{chainId_in:[8453,1], assetSymbol_in:["USDC"], listed:true})`, 2026-10-11; on-chain asset() = USDC and MORPHO() = 0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb (Morpho Blue, docs.morpho.org/developers/contracts/addresses)';
const AAVE_SOURCE =
  "aave-dao/aave-address-book main (AaveV3<Chain>.sol ASSETS.USDC/USDCn.A_TOKEN), 2026-10-11; on-chain Pool.getReserveData(USDC).aTokenAddress matches";

export const LISTED_VENUES: readonly ListedVenue[] = [
  {
    id: "morpho:8453:0xee8f4ec5672f09119b96ab6fb59c27e1b7e44b61",
    protocol: "morpho",
    chainId: 8453,
    address: "0xeE8F4eC5672F09119b96Ab6fB59C27E1b7e44b61",
    name: "Gauntlet USDC Prime",
    asset: "USDC",
    curator: "Gauntlet",
    rationale: "TVL ≈ $414M, liquidity ≈ $182M, fee 0%, timelock 7 days, no API warnings at review.",
    source: MORPHO_SOURCE,
  },
  {
    id: "morpho:8453:0xbeef010f9cb27031ad51e3333f9af9c6b1228183",
    protocol: "morpho",
    chainId: 8453,
    address: "0xbeeF010f9cb27031ad51e3333f9aF9C6B1228183",
    name: "Steakhouse USDC",
    asset: "USDC",
    curator: "Steakhouse Financial",
    rationale: "TVL ≈ $121M, liquidity ≈ $120M, fee 25%, timelock 7 days, no API warnings at review.",
    source: MORPHO_SOURCE,
  },
  {
    id: "morpho:1:0xbeef01735c132ada46aa9aa4c54623caa92a64cb",
    protocol: "morpho",
    chainId: 1,
    address: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    name: "Steakhouse USDC",
    asset: "USDC",
    curator: "Steakhouse Financial",
    rationale: "TVL ≈ $65M, liquidity ≈ $49M, fee 5%, timelock 7 days, no API warnings at review.",
    source: MORPHO_SOURCE,
  },
  {
    id: "aave-v3:8453:0x4e65fe4dba92790696d040ac24aa414708f5c0ab",
    protocol: "aave-v3",
    chainId: 8453,
    address: "0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB",
    name: "Aave v3 USDC (Base)",
    asset: "USDC",
    curator: null,
    rationale: "Core market USDC reserve; ≈ $181M supplied, active, not frozen or paused, reserve factor 10% at review.",
    source: AAVE_SOURCE,
  },
  {
    id: "aave-v3:1:0x98c23e9d8f34fefb1b7bd6a91b7ff122f4e16f5c",
    protocol: "aave-v3",
    chainId: 1,
    address: "0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c",
    name: "Aave v3 USDC (Ethereum)",
    asset: "USDC",
    curator: null,
    rationale: "Core market USDC reserve; ≈ $2.4B supplied, active, not frozen or paused, reserve factor 10% at review.",
    source: AAVE_SOURCE,
  },
  {
    id: "aave-v3:42161:0x724dc807b04555b71ed48a6896b6f41593b8c637",
    protocol: "aave-v3",
    chainId: 42161,
    address: "0x724dc807b04555b71ed48a6896b6F41593b8C637",
    name: "Aave v3 USDC (Arbitrum One)",
    asset: "USDC",
    curator: null,
    rationale: "Core market native USDC (USDCn) reserve; ≈ $179M supplied, active, not frozen or paused, reserve factor 10% at review.",
    source: AAVE_SOURCE,
  },
  {
    id: "aave-v3:10:0x38d693ce1df5aadf7bc62595a37d667ad57922e5",
    protocol: "aave-v3",
    chainId: 10,
    address: "0x38d693cE1dF5AaDF7bC62595A37D667aD57922e5",
    name: "Aave v3 USDC (OP Mainnet)",
    asset: "USDC",
    curator: null,
    rationale: "Core market native USDC (USDCn) reserve; ≈ $10.8M supplied, active, not frozen or paused, reserve factor 10% at review.",
    source: AAVE_SOURCE,
  },
];

/** Venues considered at this review and deliberately not listed (kept for the audit trail). */
export const CONSIDERED_NOT_LISTED: ReadonlyArray<{ id: string; name: string; reason: string }> = [
  {
    id: "morpho:8453:0x7bfa7c4f149e7415b73bdedfe609237e29cbf34a",
    name: "Spark USDC Vault (Base)",
    reason: "TVL ≈ $391M, but curated by SparkDAO, a protocol DAO rather than an independent risk curator.",
  },
  {
    id: "morpho:8453:0xbeef0e0834849acc03f0089f01f4f1eeb06873c9",
    name: "Steakhouse Prime USDC (Base, Vault V2)",
    reason: "Vault V2: ERC-4626 max* views return 0, so per-account withdrawable liquidity cannot be verified on-chain. Same for the other V2 vaults.",
  },
  {
    id: "morpho:1:0xdd0f28e19c1780eb6396170735d45153d261490d",
    name: "Gauntlet USDC Prime (Ethereum)",
    reason: "TVL ≈ $22M, below the $50M minimum.",
  },
];

const index = new Map(LISTED_VENUES.map((v) => [v.id, v]));

/** True when the opportunity id is on TokenIQ's vetted list (ids are compared case-insensitively). */
export function isListed(id: string): boolean {
  return index.has(id.toLowerCase());
}

export function getListedVenue(id: string): ListedVenue | undefined {
  return index.get(id.toLowerCase());
}

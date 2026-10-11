/**
 * Wire types returned by the TokenIQ API. USD values are decimal strings,
 * raw token amounts and bps are integer strings, dates are ISO strings.
 * Mirrors apps/api/src/services/dto.ts.
 */

export type Role = "owner" | "admin" | "finance" | "approver" | "viewer";

export interface OrgDto {
  id: string;
  name: string;
  slug: string;
  role: Role;
  purpose: string | null;
  reportingCurrency: string;
  isSample: boolean;
  onboardingSteps: string[];
  onboardingCompletedAt: string | null;
  createdAt: string;
}

export interface MeDto {
  user: { id: string; email: string; name: string; emailVerified: boolean; hasRealEmail: boolean };
  organizations: OrgDto[];
  passkeys: number;
  wallets: Array<{ address: string; chainId: number }>;
}

export interface Breakdown {
  key: string;
  label: string;
  value: string;
  shareBps: string;
}

export interface DataIssue {
  code: "price_missing" | "price_stale" | "account_never_synced" | "account_stale" | "unverified_excluded";
  message: string;
  ref: string;
}

export interface TreasuryDto {
  asOf: string;
  gross: string;
  liquid: { total: string; stable: string; other: string };
  allocated: { total: string; withdrawableNow: string; unknownWithdrawable: string };
  reserveEligible: string;
  unverifiedValue: string;
  byAsset: Breakdown[];
  byChain: Breakdown[];
  byAccount: Breakdown[];
  byProtocol: Breakdown[];
  issues: DataIssue[];
  complete: boolean;
}

export interface OccurrenceDto {
  obligationId: string;
  title: string;
  category: string;
  direction: "outflow" | "inflow";
  dueDate: string;
  index: number;
  amount: string;
  currency: "USD" | "EUR";
  usd: string | null;
  certainty: "estimate" | "committed" | "invoiced";
  priority: "critical" | "high" | "normal" | "low";
  overdue: boolean;
}

export interface ReserveDto {
  asOf: string;
  horizonEnd: string;
  required: string;
  bindingRule: "floor" | "runway" | "obligations" | null;
  rules: Array<{ id: "floor" | "runway" | "obligations"; label: string; enabled: boolean; amount: string; binding: boolean; explanation: string }>;
  burn: { declared: string | null; itemized: string; used: string; basis: "declared" | "itemized" | "itemized_exceeds_declared" | "none" };
  obligations: { total: string; overdue: string; byCertainty: Record<string, string>; excludedEstimates: string; occurrences: OccurrenceDto[]; unconvertible: number };
  expectedInflows: string;
  available: string;
  pendingOutflows: string;
  pendingAllocations: string;
  coverageBps: string | null;
  status: "covered" | "thin" | "shortfall" | "no_requirement";
  shortfall: string;
  runwayCoveredMonths: string | null;
  surplus: { afterReserve: string; capRemaining: string; deployable: string; limitedBy: "reserve" | "deployment_cap" | "nothing_available"; explanation: string };
  currencyMismatches: Array<{ currency: string; obligations: string; holdings: string; message: string }>;
  uncertainty: { level: "low" | "medium" | "high"; reasons: Array<{ level: "medium" | "high"; message: string }> };
}

export interface AccountDto {
  id: string;
  label: string;
  chainId: number;
  chain: string;
  address: string;
  kind: "safe" | "eoa" | "contract";
  purpose: string;
  verified: boolean;
  includeInTreasury: boolean;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
  explorer: string | null;
}

export interface HoldingDto {
  accountId: string;
  accountLabel: string;
  chainId: number;
  chain: string;
  symbol: string;
  assetAddress: string;
  assetClass: "stablecoin" | "native" | "volatile";
  raw: string;
  decimals: number;
  valueUsd: string | null;
  price: { value: string; decimals: number; updatedAt: string; source: string; stale: boolean } | null;
}

export interface PositionDto {
  id: string;
  accountId: string;
  accountLabel: string;
  protocol: string;
  venueId: string;
  venueName: string;
  chainId: number;
  chain: string;
  symbol: string;
  assetsRaw: string;
  withdrawableRaw: string | null;
  decimals: number;
  valueUsd: string | null;
  venue: { netApyBps: number } | null;
}

export interface OverviewDto {
  organizationId: string;
  isSample: boolean;
  asOf: string;
  computedAt: string;
  lastObservedAt: string | null;
  policyVersion: number;
  autonomy: "observe" | "approval_required" | "bounded_automation";
  policy: PolicyDto;
  treasury: TreasuryDto;
  reserve: ReserveDto;
  projection: { points: Array<{ date: string; outflow: string; inflow: string; balance: string; balanceWithInflows: string }>; lowest: { date: string; balance: string }; firstNegative: string | null; reserveFloor: string };
  accounts: AccountDto[];
  holdings: HoldingDto[];
  positions: PositionDto[];
}

export interface ObligationDto {
  id: string;
  title: string;
  category: string;
  direction: "outflow" | "inflow";
  amount: string;
  currency: "USD" | "EUR";
  firstDueDate: string;
  recurrence: { freq: "once" } | { freq: "weekly" | "monthly" | "quarterly" | "yearly"; interval: number; until?: string | null; count?: number | null };
  certainty: "estimate" | "committed" | "invoiced";
  priority: "critical" | "high" | "normal" | "low";
  status: "active" | "paused" | "cancelled" | "completed";
  counterparty: string | null;
  recipientAddress: string | null;
  recipientChainId: number | null;
  paymentAsset: string | null;
  invoiceNumber: string | null;
  notes: string | null;
  nextDueDate: string | null;
  documents: number;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyCheck {
  id: string;
  label: string;
  status: "pass" | "fail" | "warn";
  detail: string;
}

export interface OpportunityDto {
  id: string;
  protocol: "morpho" | "aave-v3";
  kind: "erc4626_vault" | "lending_market";
  chainId: number;
  chain: string;
  address: string;
  name: string;
  asset: { symbol: string; address: string; decimals: number; chainId: number };
  apy: { nativeBps: number; rewardsBps: number; netBps: number; measurement: "instantaneous" | "1d_average" | "7d_average" | "30d_average" };
  tvlUsd: string;
  availableLiquidityUsd: string;
  feeBps: number | null;
  curator: { name: string; url?: string | null } | null;
  withdrawal: "instant_subject_to_liquidity" | "queued" | "locked";
  warnings: Array<{ code: string; level: "info" | "warning" | "critical"; message: string }>;
  dependencies: string[];
  audits: Array<{ name: string; url: string }>;
  listed: boolean;
  source: { name: string; url: string; fetchedAt: number };
  suitability: { suitable: boolean; checks: PolicyCheck[] };
  maxPositionByLiquidity: string;
  illustrativeYieldOn100k: string;
}

export interface ActionJson {
  type: "allocate" | "withdraw" | "payment";
  accountId: string;
  amountUsd: string;
  assetAmountRaw: string;
  opportunityId?: string;
  positionId?: string;
  obligationId?: string;
  dueDate?: string;
  assetSymbol?: string;
  recipient?: string;
}

export interface ValidationDto {
  valid: boolean;
  checks: PolicyCheck[];
  after: { reserveEligible: string; coverageBps: string | null; deployable: string; deployedShareBps: string; protocolShareBps: string | null; venueShareBps: string | null };
}

export interface RecommendationDto {
  id: string;
  status: "open" | "accepted" | "dismissed" | "superseded";
  createdAt: string;
  resolvedAt: string | null;
  resolution: string | null;
  fingerprint: string;
  kind: "deploy_surplus" | "restore_reserve" | "reduce_concentration" | "hold";
  title: string;
  summary: string;
  trigger: string;
  objective: string;
  evidence: Array<{ label: string; value: string; ref: string }>;
  action: ActionJson | null;
  validation: ValidationDto | null;
  upside: string;
  downside: string[];
  liquidityImpact: string;
  whatCouldGoWrong: string[];
  alternatives: Array<{ title: string; consequence: string }>;
  basis: string;
}

export interface AlertDto {
  id: string;
  kind: string;
  severity: "info" | "warning" | "critical";
  title: string;
  condition: string;
  evidence: Array<{ label: string; value: string }>;
  recommendedAction: string;
  ref: string | null;
  status: "open" | "acknowledged" | "resolved";
  firstSeenAt: string;
  lastSeenAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
}

export interface ActivityEventDto {
  id: string;
  action: string;
  actorType: "user" | "system" | "copilot";
  actor: string;
  targetType: string | null;
  targetId: string | null;
  data: Record<string, unknown> | null;
  createdAt: string;
}

export interface MemberDto {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: Role;
  joinedAt: string;
  isYou: boolean;
}

export interface PolicyDto {
  monthlyBurnUsd: string | null;
  runwayMonths: number;
  minimumReserveUsd: string;
  obligationHorizonDays: number;
  obligationBufferBps: number;
  includeEstimatedObligations: boolean;
  thinCoverageBps: number;
  haircutsBps: Record<string, number>;
  includeUnverifiedInReserve: boolean;
  reserveAssets: string[];
  maxDataAgeMinutes: number;
  maxDeployedBps: number;
  maxPerProtocolBps: number;
  maxPerVenueBps: number;
  maxShareOfVenueLiquidityBps: number;
  minVenueTvlUsd: string;
  maxVenueFeeBps: number;
  allowedChains: number[];
  allowedAssets: string[];
  allowedProtocols: Array<"morpho" | "aave-v3">;
  minActionUsd: string;
  autonomy: "observe" | "approval_required" | "bounded_automation";
}

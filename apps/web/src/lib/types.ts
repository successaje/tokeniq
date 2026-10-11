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

// --- Planning & treasury pages (obligations, reserves, balances, allocations) ---

export type RecurrenceDto = ObligationDto["recurrence"];

/** Body of POST /obligations (PATCH accepts any subset plus `status`). */
export interface ObligationInputDto {
  title: string;
  category: string;
  direction: "outflow" | "inflow";
  amount: string;
  currency: "USD" | "EUR";
  firstDueDate: string;
  recurrence: RecurrenceDto;
  certainty: "estimate" | "committed" | "invoiced";
  priority: "critical" | "high" | "normal" | "low";
  counterparty?: string | null;
  recipientAddress?: string | null;
  recipientChainId?: number | null;
  paymentAsset?: string | null;
  invoiceNumber?: string | null;
  notes?: string | null;
}

export interface SettledOccurrenceDto {
  id: string;
  obligationId: string;
  title: string;
  dueDate: string;
  status: "paid_verified" | "paid_unverified" | "skipped";
  txHash: string | null;
  chainId: number | null;
  verifiedAt: string | null;
  amount: string | null;
}

export interface ObligationScheduleDto {
  asOf: string;
  through: string;
  occurrences: OccurrenceDto[];
  settled: SettledOccurrenceDto[];
}

export interface ObligationPaymentDto {
  id: string;
  dueDate: string;
  status: "paid_verified" | "paid_unverified" | "skipped";
  txHash: string | null;
  chainId: number | null;
  amount: string | null;
  tokenAmountRaw: string | null;
  assetSymbol: string | null;
  verifiedAt: string | null;
  verification: unknown;
  note: string | null;
  createdAt: string;
}

export interface ObligationDocumentDto {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  sha256: string;
  createdAt: string;
}

export interface ObligationDetailDto {
  obligation: ObligationDto;
  upcoming: Array<{ dueDate: string; overdue: boolean; amount: string; currency: "USD" | "EUR" }>;
  payments: ObligationPaymentDto[];
  documents: ObligationDocumentDto[];
}

export interface PolicyPresetDto {
  label: string;
  description: string;
  policy: PolicyDto;
}

export interface PoliciesDto {
  treasury: PolicyDto;
  treasuryVersion: number;
  approval: unknown;
  approvalVersion: number;
  presets: Record<"conservative" | "balanced" | "growth", PolicyPresetDto>;
}

export interface PolicyChangeDto {
  field: string;
  from: unknown;
  to: unknown;
}

export interface PolicyVersionDto {
  id: string;
  kind: "treasury" | "approval";
  version: number;
  reason: string | null;
  createdAt: string;
  author: string;
  changes: PolicyChangeDto[];
}

export type ScenarioShockDto =
  | { type: "depeg"; symbol: string; price: string }
  | { type: "new_obligation"; title: string; amount: string; dueDate: string; monthly: boolean }
  | { type: "burn_change"; monthlyBurnUsd: string }
  | { type: "runway_months"; months: number }
  | { type: "venue_frozen"; venueId: string };

export interface ScenarioResultDto {
  label: string;
  shocks: ScenarioShockDto[];
  base: { treasury: TreasuryDto; reserve: ReserveDto };
  scenario: { treasury: TreasuryDto; reserve: ReserveDto };
  delta: { required: string; available: string; deployable: string };
}

export interface TreasuryHistoryDto {
  points: Array<{ date: string; stableRaw: Array<{ accountId: string; chainId: number; symbol: string; asset: string; raw: string }> }>;
  coverageStart: string | null;
}

export interface TreasurySyncStatusDto {
  accounts: Array<{ id: string; label: string; chainId: number; chain: string; lastSyncedAt: string | null; lastSyncError: string | null }>;
  providers: Array<{ provider: string; status: string; lastOkAt: string | null; lastErrorAt: string | null; lastError: string | null; latencyMs: number | null }>;
  opportunitiesFetchedAt: string | null;
  pricesObservedAt: string | null;
  horizonEnd: string;
}

export interface MetaChainDto {
  id: number;
  key: string;
  name: string;
  shortName: string;
  testnet: boolean;
  explorer: string;
}

export interface MetaTokenDto {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  assetClass: "stablecoin" | "native" | "volatile";
  pegCurrency: "USD" | "EUR" | null;
  variant: string | null;
  priceFeed: { pair: string; address: string; heartbeatSec: number } | null;
}

export interface MetaDto {
  chains: MetaChainDto[];
  tokens: MetaTokenDto[];
  features: { copilot: boolean; email: boolean; disabled: string[] };
}

// --- Decide, monitor and admin pages (recommendations, opportunities, risk, activity, reports, team, settings, invitations) ---

export interface OpportunitiesResponse {
  opportunities: OpportunityDto[];
  fetchedAt: string | null;
  policyVersion: number;
}

export interface RecommendationsResponse {
  recommendations: RecommendationDto[];
  whyNone: string | null;
  isSample: boolean;
}

export interface AlertsResponse {
  alerts: AlertDto[];
}

export interface ActivityPageDto {
  events: ActivityEventDto[];
  nextCursor: string | null;
}

/** GET /reports/snapshot: the overview plus report framing. */
export interface SnapshotDto extends OverviewDto {
  organization: string;
  generatedAt: string;
  sentence: string;
  disclaimer: string;
}

export interface InvitationDto {
  id: string;
  email: string;
  role: Role;
  status: string;
  expiresAt: string;
  createdAt: string;
}

/** GET /api/v1/invitations/{id}: only returned to the addressee. */
export interface InvitationDetailDto {
  id: string;
  organizationName: string;
  role: Role;
  inviterName: string;
  email: string;
  status: "pending" | "accepted" | "revoked" | "superseded" | "expired" | (string & {});
  expiresAt: string;
  emailMatches: boolean;
}

export type ApproverRole = Exclude<Role, "viewer">;

export interface ApprovalTierDto {
  /** Inclusive upper bound in USD; null = no upper bound (must be the last tier). */
  upToUsd: string | null;
  requiredApprovals: number;
  requiredRole: ApproverRole | null;
}

export interface ApprovalPolicyDto {
  tiers: ApprovalTierDto[];
  allowSelfApproval: boolean;
  proposalTtlHours: number;
}

export type ProposalStatus =
  | "pending_approval"
  | "approved"
  | "rejected"
  | "expired"
  | "cancelled"
  | "awaiting_signatures"
  | "ready_to_execute"
  | "submitted"
  | "executed"
  | "failed"
  | "stale";

export interface ProposalListItem {
  id: string;
  title: string;
  kind: "allocate" | "withdraw" | "payment";
  status: ProposalStatus;
  amountUsd: string;
  chainId: number;
  proposer: string;
  proposerIsYou: boolean;
  createdAt: string;
  expiresAt: string;
  approvals: { have: number; need: number; roleRequirementMet: boolean; needs: string };
  yourDecision: "approve" | "reject" | null;
  signatures: number;
}

export interface SafeTxCall {
  to: string;
  value: string;
  data: string;
  description: string;
}

export interface ProposalDetail {
  id: string;
  title: string;
  kind: "allocate" | "withdraw" | "payment";
  status: ProposalStatus;
  amountUsd: string;
  chainId: number;
  action: ActionJson;
  createdAt: string;
  expiresAt: string;
  proposer: { id: string; name: string; isYou: boolean };
  recommendationId: string | null;
  isSample: boolean;
  account: { id: string; label: string; address: string; chainId: number; safeThreshold: number | null; safeOwners: string[]; safeVersion: string | null; verified: boolean } | null;
  validationAtCreation: ValidationDto;
  validationNow: ValidationDto;
  approval: { state: string; requiredApprovals: number; approvals: number; remaining: number; roleRequirementMet: boolean; requiredRole: string | null; needs: string; expiresAt: string };
  you: { canApprove: boolean; reason: string; decision: "approve" | "reject" | null; canCreate: boolean };
  approvals: Array<{ id: string; user: string; role: string; decision: "approve" | "reject"; comment: string | null; at: string }>;
  comments: Array<{ id: string; user: string; body: string; at: string }>;
  safeTx: null | {
    to: string;
    value: string;
    data: string;
    operation: number;
    nonce: string;
    calls: SafeTxCall[];
    typedData: { domain: { chainId: number | string; verifyingContract: string }; types: Record<string, Array<{ name: string; type: string }>>; primaryType: string; message: Record<string, string | number> };
    safeVersion: string;
    safeAddress: string;
    threshold: number;
    owners: string[];
  };
  safeTxHash: string | null;
  simulation: null | { success: boolean; gasUsed: string; error: string | null; at: string; blockNumber: string };
  signatures: Array<{ signer: string; at: string }>;
  executions: Array<{ txHash: string; status: string; submittedAt: string; blockNumber: string | null; safeSuccess: boolean | null; explorer: string | null }>;
}

// --- Accounts, payments and onboarding (accounts, payments, onboarding steps 2–4) ---

export type AccountPurpose = "operating" | "reserve" | "grants" | "other";
export type AccountKind = "safe" | "eoa" | "contract";

export interface SafeStateDto {
  owners: string[];
  threshold: number | null;
  version: string | null;
  nonce: string | null;
  guard: string | null;
  modules: string[];
}

/** GET /accounts row: AccountDto plus verification evidence and Safe state. */
export interface TreasuryAccountDto {
  id: string;
  label: string;
  chainId: number;
  chain: string;
  address: string;
  kind: AccountKind;
  purpose: AccountPurpose;
  includeInTreasury: boolean;
  verified: boolean;
  verifiedAt: string | null;
  verificationMethod: "siwe_owner" | "siwe_address" | "sample" | null;
  verificationSigner: string | null;
  safe: SafeStateDto | null;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
  explorer: string | null;
  createdAt: string;
}

export interface AccountSyncResultDto {
  ok: boolean;
  blockNumber: string | null;
  /** Number of allowlisted token balances read (including zero balances). */
  balances: number;
  positions: number;
  failures: string[];
  verificationRevoked: boolean;
}

export interface AddAccountResponseDto {
  account: TreasuryAccountDto;
  sync: AccountSyncResultDto;
}

export interface VerifyChallengeDto {
  challengeId: string;
  message: string;
  expiresAt: string;
}

export interface PaymentVerificationDto {
  status: "verified" | "pending" | "mismatch" | "reverted" | "not_found";
  reason: string | null;
  confirmations: number;
  requiredConfirmations: number;
  amountChecked: boolean;
  matched?: { from: string; to: string; amountRaw: string; logIndex: number } | null;
}

/** GET /payments row. `title` is null on responses from POST /payments/{id}/verify. */
export interface PaymentDto {
  id: string;
  obligationId: string;
  title: string | null;
  dueDate: string;
  status: "paid_verified" | "paid_unverified" | "skipped";
  amount: string | null;
  assetSymbol: string | null;
  tokenAmountRaw: string | null;
  chainId: number | null;
  chain: string | null;
  txHash: string | null;
  explorer: string | null;
  fromAddress: string | null;
  toAddress: string | null;
  verifiedAt: string | null;
  verification: PaymentVerificationDto | null;
  note: string | null;
  createdAt: string;
}

import { z } from "zod";
import { parseDecimal, WAD_DECIMALS } from "./money";

/**
 * A non-negative decimal string with up to 18 fractional digits, e.g. "125000" or "99.5".
 * At most 20 integer digits, so every value fits the numeric(38,18) columns it is stored in.
 */
export const decimalString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,18})?$/, "Enter a positive amount using digits and an optional decimal point")
  .refine((v) => v.split(".")[0]!.replace(/^0+(?=\d)/, "").length <= 20, "Amount is too large")
  .refine((v) => {
    try {
      parseDecimal(v, WAD_DECIMALS);
      return true;
    } catch {
      return false;
    }
  }, "Amount is not valid");

export const AUTONOMY_LEVELS = ["observe", "approval_required", "bounded_automation"] as const;
export type AutonomyLevel = (typeof AUTONOMY_LEVELS)[number];

export const PROTOCOLS = ["morpho", "aave-v3"] as const;
export type ProtocolId = (typeof PROTOCOLS)[number];

/**
 * The organization's treasury policy. Every field is deterministic input to
 * the engine; nothing here is interpreted by a language model.
 */
export const treasuryPolicySchema = z.object({
  // --- Reserve rules: the requirement is the strictest enabled rule. ---
  /** Declared monthly operating spend in USD. Null when the team has not estimated it. */
  monthlyBurnUsd: decimalString.nullable(),
  /** Months of operating spend that must stay protected (0 disables the rule). */
  runwayMonths: z.number().int().min(0).max(36),
  /** Absolute floor in USD (0 disables the rule). */
  minimumReserveUsd: decimalString,
  /** Unpaid obligations due within this many days must be covered. */
  obligationHorizonDays: z.number().int().min(7).max(365),
  /** Extra cover on top of obligations in the horizon, in bps (1000 = +10%). */
  obligationBufferBps: z.number().int().min(0).max(10_000),
  /** Count "estimate" obligations, not only committed and invoiced ones. */
  includeEstimatedObligations: z.boolean(),
  /** Coverage below this ratio (bps of the requirement) is reported as thin. */
  thinCoverageBps: z.number().int().min(10_000).max(30_000),

  // --- Valuation ---
  haircutsBps: z.record(z.string(), z.number().int().min(0).max(10_000)),
  includeUnverifiedInReserve: z.boolean(),
  reserveAssets: z.array(z.string()),
  maxDataAgeMinutes: z.number().int().min(5).max(24 * 60),

  // --- Allocation limits ---
  /** Maximum share of gross treasury that may be deployed into protocols. */
  maxDeployedBps: z.number().int().min(0).max(10_000),
  maxPerProtocolBps: z.number().int().min(0).max(10_000),
  maxPerVenueBps: z.number().int().min(0).max(10_000),
  /** Our position may not exceed this share of a venue's available liquidity. */
  maxShareOfVenueLiquidityBps: z.number().int().min(1).max(10_000),
  minVenueTvlUsd: decimalString,
  maxVenueFeeBps: z.number().int().min(0).max(10_000),
  allowedChains: z.array(z.number().int().positive()),
  allowedAssets: z.array(z.string()),
  allowedProtocols: z.array(z.enum(PROTOCOLS)),
  /** Actions smaller than this are not recommended (gas and attention cost). */
  minActionUsd: decimalString,
  autonomy: z.enum(AUTONOMY_LEVELS),
});

export type TreasuryPolicy = z.infer<typeof treasuryPolicySchema>;

export const approvalTierSchema = z.object({
  /** Upper bound (inclusive) in USD for this tier; null = no upper bound. */
  upToUsd: decimalString.nullable(),
  requiredApprovals: z.number().int().min(1).max(10),
  /** When set, at least one approver must hold this role. */
  requiredRole: z.enum(["owner", "admin", "finance", "approver"]).nullable(),
});

export const approvalPolicySchema = z.object({
  tiers: z.array(approvalTierSchema).min(1).max(6),
  /** The member who proposed an action may also approve it. */
  allowSelfApproval: z.boolean(),
  /** Proposals expire if not fully approved within this many hours. */
  proposalTtlHours: z.number().int().min(1).max(24 * 30),
  /**
   * Payments to a payee address that was added or changed less than this many hours ago are refused.
   * A changed address is the classic invoice-fraud vector; the hold gives the team time to notice. 0 disables.
   */
  newPayeeHoldHours: z.number().int().min(0).max(24 * 14).default(48),
});

export type ApprovalTier = z.infer<typeof approvalTierSchema>;
export type ApprovalPolicy = z.infer<typeof approvalPolicySchema>;

export const DEFAULT_TREASURY_POLICY: TreasuryPolicy = {
  monthlyBurnUsd: null,
  runwayMonths: 6,
  minimumReserveUsd: "0",
  obligationHorizonDays: 90,
  obligationBufferBps: 1_000,
  includeEstimatedObligations: true,
  thinCoverageBps: 11_000,
  haircutsBps: {},
  includeUnverifiedInReserve: false,
  reserveAssets: [],
  maxDataAgeMinutes: 60,
  maxDeployedBps: 5_000,
  maxPerProtocolBps: 2_500,
  maxPerVenueBps: 2_000,
  maxShareOfVenueLiquidityBps: 500,
  minVenueTvlUsd: "25000000",
  maxVenueFeeBps: 2_500,
  allowedChains: [1, 8453, 42161, 10],
  allowedAssets: ["USDC"],
  allowedProtocols: ["morpho", "aave-v3"],
  minActionUsd: "5000",
  autonomy: "approval_required",
};

export const DEFAULT_APPROVAL_POLICY: ApprovalPolicy = {
  tiers: [
    { upToUsd: "25000", requiredApprovals: 1, requiredRole: null },
    { upToUsd: "250000", requiredApprovals: 2, requiredRole: null },
    { upToUsd: null, requiredApprovals: 3, requiredRole: "owner" },
  ],
  allowSelfApproval: false,
  proposalTtlHours: 72,
  newPayeeHoldHours: 48,
};

/** Starting policies offered during onboarding. */
export const POLICY_PRESETS = {
  conservative: {
    label: "Conservative",
    description: "12 months of runway, all obligations for the next six months covered with a 20% buffer, at most 30% of the treasury deployed.",
    policy: { ...DEFAULT_TREASURY_POLICY, runwayMonths: 12, obligationHorizonDays: 180, obligationBufferBps: 2_000, maxDeployedBps: 3_000, maxPerProtocolBps: 1_500, maxPerVenueBps: 1_000 },
  },
  balanced: {
    label: "Balanced",
    description: "6 months of runway, 90 days of obligations covered with a 10% buffer, at most 50% of the treasury deployed.",
    policy: DEFAULT_TREASURY_POLICY,
  },
  growth: {
    label: "Growth",
    description: "3 months of runway, 60 days of obligations covered with a 10% buffer, at most 70% of the treasury deployed.",
    policy: { ...DEFAULT_TREASURY_POLICY, runwayMonths: 3, obligationHorizonDays: 60, maxDeployedBps: 7_000, maxPerProtocolBps: 3_500, maxPerVenueBps: 2_500 },
  },
} as const satisfies Record<string, { label: string; description: string; policy: TreasuryPolicy }>;

export type PolicyPresetId = keyof typeof POLICY_PRESETS;

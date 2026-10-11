import { applyBps, clampZero, formatBps, formatUsd, parseDecimal, ratioBps, type Bps, type Wad } from "./money";
import { assessSuitability, liquidityLimit, type Opportunity, type PolicyCheck } from "./opportunities";
import type { TreasuryPolicy } from "./policy";
import type { ReserveAssessment } from "./reserve";
import type { AccountRef, Position, TreasurySnapshot } from "./treasury";
import { exposureByVenue } from "./treasury";

/**
 * A structured treasury action. This is the only shape that can move toward
 * execution; free text (including model output) must be converted into one of
 * these and pass `validateAction` first.
 */
export type TreasuryAction =
  | { type: "allocate"; accountId: string; opportunityId: string; amountUsd: Wad; assetAmountRaw: bigint }
  | { type: "withdraw"; accountId: string; positionId: string; amountUsd: Wad; assetAmountRaw: bigint }
  | { type: "payment"; accountId: string; obligationId: string; dueDate: string; amountUsd: Wad; assetAmountRaw: bigint; assetSymbol: string; recipient: string };

export interface ValidationContext {
  nowSec: number;
  policy: TreasuryPolicy;
  treasury: TreasurySnapshot;
  reserve: ReserveAssessment;
  accounts: AccountRef[];
  positions: Position[];
  opportunities: Opportunity[];
  /** Raw liquid balance of the action's asset in the action's account. */
  accountAssetBalanceRaw: bigint | null;
  /** Unsettled occurrence lookup for payments: `${obligationId}|${dueDate}` -> USD amount. */
  unsettledOccurrences?: Map<string, Wad>;
}

export interface ActionValidation {
  valid: boolean;
  checks: PolicyCheck[];
  after: {
    reserveEligible: Wad;
    coverageBps: Bps | null;
    deployable: Wad;
    deployedShareBps: Bps;
    protocolShareBps: Bps | null;
    venueShareBps: Bps | null;
  };
}

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export function validateAction(action: TreasuryAction, ctx: ValidationContext): ActionValidation {
  const { policy, treasury, reserve } = ctx;
  const checks: PolicyCheck[] = [];
  const check = (id: string, label: string, ok: boolean, detail: string, warnOnly = false) =>
    checks.push({ id, label, status: ok ? "pass" : warnOnly ? "warn" : "fail", detail });

  check("autonomy", "Policy allows proposals", policy.autonomy !== "observe", policy.autonomy === "observe" ? "The organization is in observe-only mode" : "Proposals require human approval and Safe signatures");

  if (action.amountUsd <= 0n || action.assetAmountRaw <= 0n) {
    check("amount_positive", "Amount is positive", false, "Amount must be greater than zero");
  }

  const account = ctx.accounts.find((a) => a.id === action.accountId);
  check("account_known", "Source account is part of the treasury", !!account && account.includeInTreasury, account ? account.label : "Unknown account");
  if (account) {
    check("account_verified", "Control of the account is verified", account.verified, account.verified ? "An organization member proved control of this account" : "Verify control of this account before proposing transactions from it");
    check("account_safe", "Executes through a Safe multisig", account.kind === "safe", account.kind === "safe" ? "Signers will review and sign in their own wallets" : "TokenIQ only prepares transactions for Safe multisig accounts");
  }
  check("data_complete", "Treasury data is complete and fresh", treasury.complete, treasury.complete ? "All balances and prices are current" : `${treasury.issues.length} data issue(s) must be resolved first`);

  if (ctx.accountAssetBalanceRaw !== null && action.type !== "withdraw") {
    check("balance", "Account holds enough of the asset", ctx.accountAssetBalanceRaw >= action.assetAmountRaw, "Liquid balance in the source account covers the amount");
  }

  const { byProtocol, byVenue } = exposureByVenue(ctx.positions, ctx.accounts);
  let reserveAfter = reserve.available - reserve.pendingOutflows;
  let deployedAfter = treasury.allocated.total;
  let protocolShareBps: Bps | null = null;
  let venueShareBps: Bps | null = null;

  if (action.type === "allocate") {
    const opp = ctx.opportunities.find((o) => o.id === action.opportunityId);
    if (!opp) {
      check("venue_known", "Venue is known", false, "The venue is not in the current opportunity list");
    } else {
      for (const c of assessSuitability(opp, policy, ctx.nowSec).checks) checks.push(c);
      const minAction = parseDecimal(policy.minActionUsd);
      check("min_action", "Above the minimum action size", action.amountUsd >= minAction, `Minimum is ${formatUsd(minAction)}`);
      check("deployable", "Within deployable surplus", action.amountUsd <= reserve.surplus.deployable, `Deployable surplus is ${formatUsd(reserve.surplus.deployable)}`);
      reserveAfter -= action.amountUsd;
      check("reserve_after", "Reserve stays covered afterwards", reserveAfter >= reserve.required, `${formatUsd(clampZero(reserveAfter))} would remain against a ${formatUsd(reserve.required)} requirement`);
      deployedAfter += action.amountUsd + reserve.pendingAllocations;
      const deployCap = applyBps(treasury.gross, policy.maxDeployedBps, "down");
      check("deploy_cap", "Within maximum deployed share", deployedAfter <= deployCap, `${formatUsd(deployedAfter)} deployed vs ${formatBps(policy.maxDeployedBps, 0)} limit (${formatUsd(deployCap)})`);
      const protocolAfter = (byProtocol.get(opp.protocol) ?? 0n) + action.amountUsd;
      const protocolCap = applyBps(treasury.gross, policy.maxPerProtocolBps, "down");
      protocolShareBps = ratioBps(protocolAfter, treasury.gross);
      check("protocol_cap", "Within per-protocol exposure limit", protocolAfter <= protocolCap, `${formatUsd(protocolAfter)} in ${opp.protocol} vs ${formatUsd(protocolCap)} limit`);
      const venueAfter = (byVenue.get(opp.id) ?? 0n) + action.amountUsd;
      const venueCap = applyBps(treasury.gross, policy.maxPerVenueBps, "down");
      venueShareBps = ratioBps(venueAfter, treasury.gross);
      check("venue_cap", "Within per-venue exposure limit", venueAfter <= venueCap, `${formatUsd(venueAfter)} in this venue vs ${formatUsd(venueCap)} limit`);
      const liqLimit = liquidityLimit(opp, policy);
      check(
        "venue_liquidity",
        "Position is small relative to venue liquidity",
        venueAfter <= liqLimit,
        `Position would be ${formatUsd(venueAfter)}; policy allows up to ${formatBps(policy.maxShareOfVenueLiquidityBps, 1)} of ${formatUsd(opp.availableLiquidityUsd)} available liquidity`,
      );
    }
  }

  if (action.type === "withdraw") {
    const position = ctx.positions.find((p) => p.id === action.positionId);
    check("position_known", "Position exists", !!position && position.accountId === action.accountId, position ? position.venueName : "Unknown position");
    if (position) {
      if (position.withdrawableRaw === null) {
        check("withdrawable", "Withdrawable amount is known", false, "Available liquidity could not be read; the withdrawal may only partially succeed", true);
      } else {
        check("withdrawable", "Venue has enough liquidity", action.assetAmountRaw <= position.withdrawableRaw, "Amount is within what the venue reports as withdrawable now");
      }
      check("position_size", "Amount within position", action.assetAmountRaw <= position.assetsRaw, "Cannot withdraw more than the position holds");
    }
    reserveAfter += action.amountUsd;
    deployedAfter = clampZero(deployedAfter - action.amountUsd);
  }

  if (action.type === "payment") {
    const key = `${action.obligationId}|${action.dueDate}`;
    const owed = ctx.unsettledOccurrences?.get(key);
    check("obligation_open", "Obligation occurrence is unpaid", owed !== undefined, owed !== undefined ? `Due ${action.dueDate}` : "This occurrence is already settled or does not exist");
    check("recipient", "Recipient address is valid", ADDRESS_RE.test(action.recipient), ADDRESS_RE.test(action.recipient) ? action.recipient : "Recipient must be a 0x address");
    if (owed !== undefined) {
      check("amount_matches", "Amount matches the obligation", action.amountUsd <= owed + owed / 100n, `Obligation is ${formatUsd(owed)}; payment is ${formatUsd(action.amountUsd)}`, true);
    }
    reserveAfter -= action.amountUsd;
  }

  const requiredAfter = action.type === "payment" ? clampZero(reserve.required - action.amountUsd) : reserve.required;
  const coverageBps = ratioBps(clampZero(reserveAfter), requiredAfter);
  const deployableAfter = clampZero(reserveAfter - requiredAfter);

  return {
    valid: !checks.some((c) => c.status === "fail"),
    checks,
    after: {
      reserveEligible: reserveAfter,
      coverageBps,
      deployable: deployableAfter,
      deployedShareBps: ratioBps(deployedAfter, treasury.gross) ?? 0n,
      protocolShareBps,
      venueShareBps,
    },
  };
}

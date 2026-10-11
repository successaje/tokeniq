import {
  AAVE_V3_MARKETS,
  batchForSafe,
  buildAaveSupply,
  buildAaveWithdraw,
  buildErc4626Deposit,
  buildErc4626Withdraw,
  buildSafeTransaction,
  computeSafeTxHash,
  ERC20_ABI,
  findTokenBySymbol,
  getListedVenue,
  getSafeTxTypedData,
  type MetaTx,
  type SafeInfo,
  type SafeTransaction,
} from "@tokeniq/chain";
import type { TreasuryAction } from "@tokeniq/core";
import { encodeFunctionData, getAddress, type Hex, type PublicClient } from "viem";

/**
 * Turn a validated TreasuryAction into the exact Safe transaction owners will
 * sign. Every target address comes from code (the static venue listing and the
 * token allowlist), never from API data or user input, and every receiver is the
 * Safe itself. This is the only place calldata is created.
 */
export interface BuiltSafeTx {
  calls: Array<{ to: string; value: string; data: Hex; description: string }>;
  safeTx: SafeTransaction;
  safeTxHash: Hex;
  typedData: ReturnType<typeof getSafeTxTypedData>;
  description: string;
}

export class BuildError extends Error {}

export async function buildSafeTxForAction(input: {
  client: PublicClient;
  chainId: number;
  safe: SafeInfo;
  action: TreasuryAction;
  /** Venue id for withdrawals (positions are keyed account:venue). */
  venueIdForPosition?: string;
}): Promise<BuiltSafeTx> {
  const { client, chainId, safe, action } = input;
  const safeAddress = getAddress(safe.address);
  const calls: Array<MetaTx & { description: string }> = [];
  // Every call target must be one of these (filled from code-defined addresses only).
  const allowedTargets = new Set<string>();

  if (action.type === "allocate" || action.type === "withdraw") {
    const venueId = action.type === "allocate" ? action.opportunityId : (input.venueIdForPosition ?? "");
    const venue = getListedVenue(venueId);
    if (!venue) throw new BuildError(`Venue ${venueId} is not on the TokenIQ listing, so no transaction can be prepared`);
    if (venue.chainId !== chainId) throw new BuildError("Venue is on a different network than the Safe");
    const asset = findTokenBySymbol(chainId, venue.asset);
    if (!asset || asset.address === "native") throw new BuildError(`No ${venue.asset} token configured on chain ${chainId}`);
    const assetAddress = getAddress(asset.address);
    allowedTargets.add(assetAddress);

    if (venue.protocol === "morpho") {
      const vault = getAddress(venue.address);
      allowedTargets.add(vault);
      if (action.type === "allocate") {
        const allowance = await client.readContract({ address: assetAddress, abi: ERC20_ABI, functionName: "allowance", args: [safeAddress, vault] });
        const txs = buildErc4626Deposit({ asset: assetAddress, vault, amount: action.assetAmountRaw, receiver: safeAddress, currentAllowance: allowance });
        txs.forEach((t, i) => calls.push({ ...t, description: i === txs.length - 1 ? `Deposit ${action.assetAmountRaw} ${asset.symbol} units into ${venue.name}` : t.data.startsWith("0x095ea7b3") ? `Approve ${venue.name} to pull exactly the deposit amount` : "Approval step" }));
      } else {
        const txs = buildErc4626Withdraw({ vault, assets: action.assetAmountRaw, receiver: safeAddress, owner: safeAddress });
        txs.forEach((t) => calls.push({ ...t, description: `Withdraw ${action.assetAmountRaw} ${asset.symbol} units from ${venue.name} to the Safe` }));
      }
    } else {
      const market = AAVE_V3_MARKETS[chainId];
      if (!market) throw new BuildError("Aave v3 is not configured on this network");
      allowedTargets.add(getAddress(market.pool));
      if (action.type === "allocate") {
        const allowance = await client.readContract({ address: assetAddress, abi: ERC20_ABI, functionName: "allowance", args: [safeAddress, getAddress(market.pool)] });
        const txs = buildAaveSupply({ chainId, asset: assetAddress, amount: action.assetAmountRaw, onBehalfOf: safeAddress, currentAllowance: allowance });
        txs.forEach((t, i) => calls.push({ ...t, description: i === txs.length - 1 ? `Supply ${action.assetAmountRaw} ${asset.symbol} units to Aave v3` : "Approve Aave v3 Pool for exactly the supply amount" }));
      } else {
        const txs = buildAaveWithdraw({ chainId, asset: assetAddress, amount: action.assetAmountRaw, to: safeAddress });
        txs.forEach((t) => calls.push({ ...t, description: `Withdraw ${action.assetAmountRaw} ${asset.symbol} units from Aave v3 to the Safe` }));
      }
    }
  } else if (action.type === "payment") {
    const token = findTokenBySymbol(chainId, action.assetSymbol);
    if (!token || token.address === "native" || token.assetClass !== "stablecoin") throw new BuildError(`Payments in ${action.assetSymbol} are not supported on this network`);
    const to = getAddress(action.recipient);
    allowedTargets.add(getAddress(token.address));
    if (to === safeAddress) throw new BuildError("A payment cannot be sent to the paying Safe itself");
    calls.push({
      to: getAddress(token.address),
      value: 0n,
      data: encodeFunctionData({ abi: ERC20_ABI, functionName: "transfer", args: [to, action.assetAmountRaw] }),
      operation: 0,
      description: `Transfer ${action.assetAmountRaw} ${token.symbol} units to ${to}`,
    });
  }

  if (calls.length === 0) throw new BuildError("Nothing to execute");
  for (const c of calls) {
    // Defence in depth: builders may only call the allowlisted token, the listed venue or the Aave pool.
    if (!allowedTargets.has(getAddress(c.to))) throw new BuildError(`Unexpected call target ${c.to}`);
    if (c.operation !== 0) throw new BuildError("Builders may only produce CALL operations");
  }
  const meta = batchForSafe(chainId, safe.version, calls.map(({ description: _d, ...t }) => t));
  const safeTx = buildSafeTransaction(meta, safe.nonce);
  const safeTxHash = computeSafeTxHash(chainId, safeAddress, safeTx, safe.version);
  return {
    calls: calls.map((c) => ({ to: getAddress(c.to), value: c.value.toString(), data: c.data, description: c.description })),
    safeTx,
    safeTxHash,
    typedData: getSafeTxTypedData(chainId, safeAddress, safeTx, safe.version),
    description: calls.map((c) => c.description).join("; "),
  };
}

/** JSON-safe form of a SafeTransaction for storage and the client. */
export function safeTxToJson(tx: SafeTransaction) {
  return { ...tx, value: tx.value.toString(), safeTxGas: tx.safeTxGas.toString(), baseGas: tx.baseGas.toString(), gasPrice: tx.gasPrice.toString(), nonce: tx.nonce.toString() };
}

export type SafeTxJson = ReturnType<typeof safeTxToJson>;

export function safeTxFromJson(j: SafeTxJson): SafeTransaction {
  return { ...j, value: BigInt(j.value), safeTxGas: BigInt(j.safeTxGas), baseGas: BigInt(j.baseGas), gasPrice: BigInt(j.gasPrice), nonce: BigInt(j.nonce) } as SafeTransaction;
}

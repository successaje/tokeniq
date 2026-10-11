import { encodeFunctionData, getAddress, zeroAddress, type Address, type PublicClient } from "viem";
import { ERC20_ABI, ERC4626_ABI } from "./abis.js";
import { pinBlock } from "./blocks.js";
import { OPERATION, type MetaTx } from "./types.js";

function call(to: Address, data: `0x${string}`): MetaTx {
  return { to, value: 0n, data, operation: OPERATION.CALL };
}

function requireRecipient(address: string, label: string): Address {
  const a = getAddress(address);
  if (a === zeroAddress) throw new Error(`${label} must not be the zero address`);
  return a;
}

/**
 * Exact-amount approval of `spender` for `amount` of `token`, never infinite.
 * When the current allowance is non-zero an `approve(spender, 0)` is prepended:
 * tokens such as USDT on Ethereum revert when changing a non-zero allowance to
 * another non-zero value, and resetting first is harmless for every other ERC-20.
 */
export function buildExactApproval(params: { token: string; spender: string; amount: bigint; currentAllowance: bigint }): MetaTx[] {
  const token = getAddress(params.token);
  const spender = requireRecipient(params.spender, "spender");
  if (params.amount <= 0n) throw new Error("approval amount must be positive");
  if (params.currentAllowance < 0n) throw new Error("current allowance cannot be negative");
  const txs: MetaTx[] = [];
  if (params.currentAllowance !== 0n) {
    txs.push(call(token, encodeFunctionData({ abi: ERC20_ABI, functionName: "approve", args: [spender, 0n] })));
  }
  txs.push(call(token, encodeFunctionData({ abi: ERC20_ABI, functionName: "approve", args: [spender, params.amount] })));
  return txs;
}

export interface Erc4626DepositParams {
  /** Underlying asset (must equal `vault.asset()`; callers verify this on-chain). */
  asset: string;
  vault: string;
  /** Underlying amount in raw units. */
  amount: bigint;
  /** Who receives the shares (normally the Safe itself). */
  receiver: string;
  /** Current `asset.allowance(safe, vault)`, read by the caller. Non-zero triggers a reset to 0 first. */
  currentAllowance: bigint;
}

/** `[approve(vault, 0)?, approve(vault, amount), vault.deposit(amount, receiver)]`, all CALLs. */
export function buildErc4626Deposit(params: Erc4626DepositParams): MetaTx[] {
  const vault = requireRecipient(params.vault, "vault");
  const receiver = requireRecipient(params.receiver, "receiver");
  return [
    ...buildExactApproval({ token: params.asset, spender: vault, amount: params.amount, currentAllowance: params.currentAllowance }),
    call(vault, encodeFunctionData({ abi: ERC4626_ABI, functionName: "deposit", args: [params.amount, receiver] })),
  ];
}

/** `vault.withdraw(assets, receiver, owner)`: withdraw an exact amount of the underlying. */
export function buildErc4626Withdraw(params: { vault: string; assets: bigint; receiver: string; owner: string }): MetaTx[] {
  if (params.assets <= 0n) throw new Error("withdraw amount must be positive");
  const vault = requireRecipient(params.vault, "vault");
  return [
    call(
      vault,
      encodeFunctionData({
        abi: ERC4626_ABI,
        functionName: "withdraw",
        args: [params.assets, requireRecipient(params.receiver, "receiver"), requireRecipient(params.owner, "owner")],
      }),
    ),
  ];
}

/** `vault.redeem(shares, receiver, owner)`: exit by shares (use for full exits so no dust is left). */
export function buildErc4626Redeem(params: { vault: string; shares: bigint; receiver: string; owner: string }): MetaTx[] {
  if (params.shares <= 0n) throw new Error("redeem shares must be positive");
  const vault = requireRecipient(params.vault, "vault");
  return [
    call(
      vault,
      encodeFunctionData({
        abi: ERC4626_ABI,
        functionName: "redeem",
        args: [params.shares, requireRecipient(params.receiver, "receiver"), requireRecipient(params.owner, "owner")],
      }),
    ),
  ];
}

export interface Erc4626Position {
  vault: Address;
  owner: Address;
  /** Underlying asset of the vault. */
  asset: Address;
  shares: bigint;
  /** `convertToAssets(shares)`: what the shares are worth, rounded down by the vault. */
  assets: bigint;
  /** Raw `maxWithdraw(owner)` (Morpho Vault V2 always returns 0). */
  maxWithdraw: bigint;
  /**
   * Underlying that can be withdrawn now, or null when unknown. Equals
   * min(maxWithdraw, assets) unless `trustMaxWithdraw` is false (e.g. Morpho Vault V2).
   */
  withdrawable: bigint | null;
  blockNumber: bigint;
}

/**
 * Position of `owner` in an ERC-4626 vault at one pinned block (two multicalls at
 * the same block number: balance/asset/maxWithdraw, then convertToAssets).
 * Throws when any call fails, because a partial position must not be reported.
 */
export async function readErc4626Position(
  client: PublicClient,
  params: { vault: string; owner: string; blockNumber?: bigint; trustMaxWithdraw?: boolean },
): Promise<Erc4626Position> {
  const vault = getAddress(params.vault);
  const owner = getAddress(params.owner);
  const block = await pinBlock(client, params.blockNumber);
  const [shares, asset, maxWithdraw] = await client.multicall({
    contracts: [
      { address: vault, abi: ERC4626_ABI, functionName: "balanceOf", args: [owner] },
      { address: vault, abi: ERC4626_ABI, functionName: "asset" },
      { address: vault, abi: ERC4626_ABI, functionName: "maxWithdraw", args: [owner] },
    ],
    allowFailure: false,
    blockNumber: block.number,
  });
  const assets =
    shares === 0n
      ? 0n
      : await client.readContract({ address: vault, abi: ERC4626_ABI, functionName: "convertToAssets", args: [shares], blockNumber: block.number });
  const trust = params.trustMaxWithdraw ?? true;
  return {
    vault,
    owner,
    asset: getAddress(asset),
    shares,
    assets,
    maxWithdraw,
    withdrawable: trust ? (maxWithdraw < assets ? maxWithdraw : assets) : null,
    blockNumber: block.number,
  };
}

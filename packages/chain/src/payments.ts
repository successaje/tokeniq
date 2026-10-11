import {
  decodeEventLog,
  getAddress,
  isAddressEqual,
  toEventSelector,
  TransactionNotFoundError,
  TransactionReceiptNotFoundError,
  type Address,
  type Hex,
  type PublicClient,
} from "viem";
import { ERC20_ABI } from "./abis.js";
import { clientChainId } from "./blocks.js";
import { requireChain } from "./chains.js";

export const TRANSFER_TOPIC = toEventSelector("Transfer(address,address,uint256)");
export const SAFE_EXECUTION_SUCCESS_TOPIC = toEventSelector("ExecutionSuccess(bytes32,uint256)");
export const SAFE_EXECUTION_FAILURE_TOPIC = toEventSelector("ExecutionFailure(bytes32,uint256)");

/** The subset of a receipt log the matchers need. */
export interface LogLike {
  address: Address;
  topics: readonly Hex[];
  data: Hex;
  logIndex: number | null;
}

export interface MatchedTransfer {
  from: Address;
  to: Address;
  amountRaw: bigint;
  logIndex: number;
}

export interface TransferCriteria {
  token: string;
  to: string;
  from?: string;
  minAmountRaw?: bigint;
}

/** Decode every ERC-20 `Transfer` emitted by `token` (3 topics; ERC-721 transfers have 4 and are ignored). */
export function decodeTransfers(logs: readonly LogLike[], token: string): MatchedTransfer[] {
  const out: MatchedTransfer[] = [];
  for (const log of logs) {
    if (!isAddressEqual(log.address, getAddress(token)) || log.topics[0] !== TRANSFER_TOPIC || log.topics.length !== 3) continue;
    try {
      const ev = decodeEventLog({ abi: ERC20_ABI, eventName: "Transfer", data: log.data, topics: log.topics as [Hex, ...Hex[]], strict: true });
      out.push({ from: getAddress(ev.args.from), to: getAddress(ev.args.to), amountRaw: ev.args.value, logIndex: log.logIndex ?? -1 });
    } catch {
      // Not a well-formed ERC-20 Transfer; ignore.
    }
  }
  return out;
}

/**
 * Find the first Transfer of `token` to `to` (and from `from`, when given) of at
 * least `minAmountRaw`. Payments executed by a Safe show the Safe as `from`.
 */
export function matchTransfer(logs: readonly LogLike[], criteria: TransferCriteria): { matched: MatchedTransfer | null; reason: string } {
  const transfers = decodeTransfers(logs, criteria.token);
  const to = getAddress(criteria.to);
  const safeFailed = logs.some((l) => l.topics[0] === SAFE_EXECUTION_FAILURE_TOPIC);
  const hint = safeFailed ? " (a Safe in this transaction emitted ExecutionFailure: its inner call failed)" : "";
  if (transfers.length === 0) return { matched: null, reason: `no Transfer of ${getAddress(criteria.token)} in this transaction${hint}` };
  const toRecipient = transfers.filter((t) => t.to === to);
  if (toRecipient.length === 0) return { matched: null, reason: `no Transfer to ${to}${hint}` };
  const fromSender = criteria.from ? toRecipient.filter((t) => t.from === getAddress(criteria.from!)) : toRecipient;
  if (fromSender.length === 0)
    return { matched: null, reason: `Transfer to ${to} came from ${toRecipient.map((t) => t.from).join(", ")}, expected ${getAddress(criteria.from!)}` };
  const min = criteria.minAmountRaw ?? 0n;
  const enough = fromSender.filter((t) => t.amountRaw >= min).sort((a, b) => a.logIndex - b.logIndex);
  if (enough.length === 0) {
    const largest = fromSender.reduce((m, t) => (t.amountRaw > m ? t.amountRaw : m), 0n);
    return { matched: null, reason: `largest Transfer to ${to} was ${largest}, below the minimum ${min}` };
  }
  return { matched: enough[0]!, reason: "matching Transfer found" };
}

export type PaymentStatus = "verified" | "not_found" | "pending" | "mismatch" | "reverted";

export interface VerifyErc20TransferInput extends TransferCriteria {
  chainId: number;
  txHash: Hex;
}

export interface VerifyErc20TransferResult {
  status: PaymentStatus;
  blockNumber: bigint | null;
  /** Blocks including the one the tx was mined in; 0 when not mined. */
  confirmations: number;
  requiredConfirmations: number;
  matched?: MatchedTransfer;
  reason: string;
}

/**
 * Verify that `txHash` transferred `token` to `to` (optionally from `from`, at
 * least `minAmountRaw`) by decoding the receipt's Transfer logs.
 *  - `not_found`: unknown to the node (neither mined nor in its mempool);
 *  - `pending`: in the mempool, or mined and matching but with fewer than
 *    `chain.confirmations` confirmations;
 *  - `reverted`: mined with status 0;
 *  - `mismatch`: mined but no Transfer satisfies the criteria;
 *  - `verified`: matching Transfer with enough confirmations.
 * RPC failures throw (they say nothing about the payment).
 */
export async function verifyErc20Transfer(client: PublicClient, input: VerifyErc20TransferInput): Promise<VerifyErc20TransferResult> {
  const chainId = await clientChainId(client);
  if (chainId !== input.chainId) throw new Error(`client is on chain ${chainId}, expected ${input.chainId}`);
  const requiredConfirmations = requireChain(chainId).confirmations;
  const base = { requiredConfirmations };
  let receipt;
  try {
    receipt = await client.getTransactionReceipt({ hash: input.txHash });
  } catch (err) {
    if (!(err instanceof TransactionReceiptNotFoundError)) throw err;
    try {
      await client.getTransaction({ hash: input.txHash });
      return { ...base, status: "pending", blockNumber: null, confirmations: 0, reason: "transaction is pending (not mined yet)" };
    } catch (err2) {
      if (err2 instanceof TransactionNotFoundError)
        return { ...base, status: "not_found", blockNumber: null, confirmations: 0, reason: "transaction not found on this chain" };
      throw err2;
    }
  }
  const latest = await client.getBlockNumber({ cacheTime: 0 });
  const confirmations = latest >= receipt.blockNumber ? Number(latest - receipt.blockNumber + 1n) : 0;
  const mined = { ...base, blockNumber: receipt.blockNumber, confirmations };
  if (receipt.status === "reverted") return { ...mined, status: "reverted", reason: "transaction reverted" };
  const { matched, reason } = matchTransfer(receipt.logs, input);
  if (!matched) return { ...mined, status: "mismatch", reason };
  if (confirmations < requiredConfirmations) {
    return { ...mined, status: "pending", matched, reason: `matching Transfer has ${confirmations} of ${requiredConfirmations} required confirmations` };
  }
  return { ...mined, status: "verified", matched, reason };
}

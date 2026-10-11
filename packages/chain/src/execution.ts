import {
  getAddress,
  isAddressEqual,
  sliceHex,
  size,
  TransactionNotFoundError,
  TransactionReceiptNotFoundError,
  type Address,
  type Hex,
  type PublicClient,
} from "viem";
import { SAFE_EXECUTION_FAILURE_TOPIC, SAFE_EXECUTION_SUCCESS_TOPIC, type LogLike } from "./payments.js";

export interface SafeExecutionEvent {
  success: boolean;
  safeTxHash: Hex;
  logIndex: number;
}

/**
 * Find the Safe's `ExecutionSuccess` / `ExecutionFailure` event. The txHash is
 * indexed (topics[1]) from Safe v1.4.0 and part of `data` in v1.3.0; both are
 * handled. With `safeTxHash`, only that execution matches; otherwise the last one wins.
 */
export function findSafeExecutionEvent(logs: readonly LogLike[], safe: string, safeTxHash?: Hex): SafeExecutionEvent | null {
  const safeAddress: Address = getAddress(safe);
  let found: SafeExecutionEvent | null = null;
  for (const log of logs) {
    if (!isAddressEqual(log.address, safeAddress)) continue;
    const topic = log.topics[0];
    if (topic !== SAFE_EXECUTION_SUCCESS_TOPIC && topic !== SAFE_EXECUTION_FAILURE_TOPIC) continue;
    let hash: Hex | undefined;
    if (log.topics.length >= 2) hash = log.topics[1];
    else if (size(log.data) >= 32) hash = sliceHex(log.data, 0, 32);
    if (!hash) continue;
    if (safeTxHash && hash.toLowerCase() !== safeTxHash.toLowerCase()) continue;
    found = { success: topic === SAFE_EXECUTION_SUCCESS_TOPIC, safeTxHash: hash, logIndex: log.logIndex ?? -1 };
  }
  return found;
}

export interface SafeExecutionResult {
  /** `not_found`: the node knows neither a receipt nor a pending tx for this hash. */
  status: "pending" | "mined" | "not_found";
  /** Receipt status (the outer transaction did not revert); null until mined. */
  success: boolean | null;
  /**
   * Whether the Safe's inner call succeeded: true for ExecutionSuccess, false for
   * ExecutionFailure, null when mined without either event from this Safe
   * (e.g. the outer tx reverted or did not call this Safe's execTransaction).
   */
  safeSuccess: boolean | null;
  safeTxHash: Hex | null;
  blockNumber: bigint | null;
  gasUsed: bigint | null;
  effectiveGasPrice: bigint | null;
  confirmations: number;
}

/** Track an `execTransaction` submitted for `safe`. RPC failures throw. */
export async function readSafeExecution(client: PublicClient, params: { txHash: Hex; safe: string; safeTxHash?: Hex }): Promise<SafeExecutionResult> {
  const empty = { success: null, safeSuccess: null, safeTxHash: null, blockNumber: null, gasUsed: null, effectiveGasPrice: null, confirmations: 0 };
  let receipt;
  try {
    receipt = await client.getTransactionReceipt({ hash: params.txHash });
  } catch (err) {
    if (!(err instanceof TransactionReceiptNotFoundError)) throw err;
    try {
      await client.getTransaction({ hash: params.txHash });
      return { status: "pending", ...empty };
    } catch (err2) {
      if (err2 instanceof TransactionNotFoundError) return { status: "not_found", ...empty };
      throw err2;
    }
  }
  const latest = await client.getBlockNumber({ cacheTime: 0 });
  const event = findSafeExecutionEvent(receipt.logs, params.safe, params.safeTxHash);
  return {
    status: "mined",
    success: receipt.status === "success",
    safeSuccess: event ? event.success : null,
    safeTxHash: event ? event.safeTxHash : null,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed,
    effectiveGasPrice: receipt.effectiveGasPrice,
    confirmations: latest >= receipt.blockNumber ? Number(latest - receipt.blockNumber + 1n) : 0,
  };
}

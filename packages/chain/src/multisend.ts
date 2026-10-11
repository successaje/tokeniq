import { concatHex, encodeFunctionData, encodePacked, getAddress, size, type Hex } from "viem";
import { MULTISEND_ABI } from "./abis.js";
import { getMultiSendCallOnlyAddress } from "./safe-deployments.js";
import { OPERATION, type MetaTx } from "./types.js";

/**
 * Packed MultiSend payload, as decoded by `MultiSend*.sol`:
 * for each tx, `operation (uint8, 1 byte) ‖ to (20 bytes) ‖ value (uint256) ‖ data length (uint256) ‖ data`.
 * Only CALLs are accepted because TokenIQ always batches through MultiSendCallOnly,
 * which reverts on nested DELEGATECALLs.
 */
export function encodeMultiSend(txs: readonly MetaTx[]): Hex {
  if (txs.length === 0) throw new Error("encodeMultiSend: no transactions");
  return concatHex(
    txs.map((tx, i) => {
      if (tx.operation !== OPERATION.CALL) throw new Error(`encodeMultiSend: transaction ${i} is a DELEGATECALL; MultiSendCallOnly only allows CALL`);
      if (tx.value < 0n) throw new Error(`encodeMultiSend: transaction ${i} has a negative value`);
      return encodePacked(["uint8", "address", "uint256", "uint256", "bytes"], [tx.operation, getAddress(tx.to), tx.value, BigInt(size(tx.data)), tx.data]);
    }),
  );
}

/** Calldata for `multiSend(bytes)` wrapping {@link encodeMultiSend}. */
export function encodeMultiSendCall(txs: readonly MetaTx[]): Hex {
  return encodeFunctionData({ abi: MULTISEND_ABI, functionName: "multiSend", args: [encodeMultiSend(txs)] });
}

/**
 * The single Safe transaction that executes `txs` in order: the tx itself when
 * there is one, otherwise a DELEGATECALL (operation 1) from the Safe to the
 * canonical MultiSendCallOnly for the Safe's version.
 */
export function batchForSafe(chainId: number, safeVersion: string, txs: readonly MetaTx[]): MetaTx {
  if (txs.length === 0) throw new Error("batchForSafe: no transactions");
  if (txs.length === 1) {
    const only = txs[0]!;
    if (only.operation !== OPERATION.CALL) throw new Error("batchForSafe: builders only produce CALLs");
    return { ...only, to: getAddress(only.to) };
  }
  return { to: getMultiSendCallOnlyAddress(chainId, safeVersion), value: 0n, data: encodeMultiSendCall(txs), operation: OPERATION.DELEGATECALL };
}

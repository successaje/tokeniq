import type { Address, Hex } from "viem";

/** Safe `Enum.Operation`: 0 = CALL, 1 = DELEGATECALL. */
export type Operation = 0 | 1;

export const OPERATION = { CALL: 0, DELEGATECALL: 1 } as const satisfies Record<string, Operation>;

/**
 * One call a Safe should make. Builders return arrays of these; a Safe executes
 * them one by one through MultiSendCallOnly (see `multisend.ts`).
 */
export interface MetaTx {
  to: Address;
  value: bigint;
  data: Hex;
  operation: Operation;
}

/** The block every value in a read was taken at. */
export interface PinnedBlock {
  chainId: number;
  number: bigint;
  hash: Hex;
  /** Unix seconds. */
  timestamp: bigint;
}

/** Human-readable message from an unknown thrown value, without stack noise. */
export function errorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as { shortMessage?: unknown; message?: unknown };
    if (typeof e.shortMessage === "string" && e.shortMessage) return e.shortMessage;
    if (typeof e.message === "string" && e.message) return e.message.split("\n")[0]!;
  }
  return String(err);
}

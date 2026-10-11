import {
  concatHex,
  decodeAbiParameters,
  decodeErrorResult,
  encodeFunctionData,
  getAddress,
  hashMessage,
  hashTypedData,
  hexToBigInt,
  isHex,
  numberToHex,
  recoverAddress,
  size,
  sliceHex,
  zeroAddress,
  type Address,
  type Hex,
  type PublicClient,
  type TypedDataDomain,
} from "viem";
import { SAFE_ABI, SIMULATE_TX_ACCESSOR_ABI } from "./abis.js";
import { pinBlock } from "./blocks.js";
import {
  getSimulateTxAccessorAddress,
  hasModuleGuard,
  isSupportedSafeVersion,
  SAFE_STORAGE_SLOTS,
  SENTINEL_ADDRESS,
  UnsupportedSafeVersionError,
} from "./safe-deployments.js";
import { errorMessage, OPERATION, type MetaTx, type Operation } from "./types.js";

// ---------------------------------------------------------------------------
// Reading a Safe
// ---------------------------------------------------------------------------

export interface SafeInfo {
  address: Address;
  chainId: number;
  /** Block the state was read at. */
  blockNumber: bigint;
  /** On-chain `VERSION()`, e.g. "1.4.1". */
  version: string;
  /** Version is >= 1.3.0, so TokenIQ can hash, sign, simulate and execute transactions for it. */
  supported: boolean;
  /** Checksummed owner addresses, in the Safe's own order. */
  owners: Address[];
  threshold: number;
  nonce: bigint;
  /** Enabled modules (first 100). Modules can move funds without owner signatures. */
  modules: Address[];
  /** True when the Safe has more than 100 modules and the list was cut. */
  modulesTruncated: boolean;
  /** Transaction guard, or null when none is set. */
  guard: Address | null;
  /** Module guard (Safe v1.5.0+), or null when none is set or the version has no module guards. */
  moduleGuard: Address | null;
  /** Fallback handler, or null when none is set. */
  fallbackHandler: Address | null;
  /** Singleton (mastercopy) the proxy delegates to, from storage slot 0. */
  singleton: Address | null;
}

export type ReadSafeInfoResult = { isSafe: true; safe: SafeInfo } | { isSafe: false; reason: "no_code" | "not_a_safe"; detail: string };

const MODULE_PAGE_SIZE = 100n;

function wordToAddress(word: Hex | undefined): Address | null {
  if (!word || size(word) < 32) return null;
  const addr = getAddress(sliceHex(word, 12, 32));
  return addr === zeroAddress ? null : addr;
}

/**
 * Detect and describe a Safe at a pinned block. An address is a Safe when it has
 * code and both `VERSION()` and `getOwners()` succeed. Guards are read from their
 * storage slots through `StorageAccessible.getStorageAt` (the getters are internal).
 * Modules are read with a single page of 100 to sidestep the v1.3.0 pagination bug.
 */
export async function readSafeInfo(client: PublicClient, address: string, opts: { blockNumber?: bigint } = {}): Promise<ReadSafeInfoResult> {
  const safe = getAddress(address);
  const block = await pinBlock(client, opts.blockNumber);
  const code = await client.getCode({ address: safe, blockNumber: block.number });
  if (!code || code === "0x") return { isSafe: false, reason: "no_code", detail: `${safe} has no code at block ${block.number}` };

  const slot = (s: Hex) => ({ address: safe, abi: SAFE_ABI, functionName: "getStorageAt" as const, args: [hexToBigInt(s), 1n] as const });
  const [version, owners, threshold, nonce, modules, guard, moduleGuard, fallbackHandler, singleton] = await client.multicall({
    contracts: [
      { address: safe, abi: SAFE_ABI, functionName: "VERSION" },
      { address: safe, abi: SAFE_ABI, functionName: "getOwners" },
      { address: safe, abi: SAFE_ABI, functionName: "getThreshold" },
      { address: safe, abi: SAFE_ABI, functionName: "nonce" },
      { address: safe, abi: SAFE_ABI, functionName: "getModulesPaginated", args: [SENTINEL_ADDRESS, MODULE_PAGE_SIZE] },
      slot(SAFE_STORAGE_SLOTS.guard),
      slot(SAFE_STORAGE_SLOTS.moduleGuard),
      slot(SAFE_STORAGE_SLOTS.fallbackHandler),
      slot("0x0000000000000000000000000000000000000000000000000000000000000000"),
    ],
    allowFailure: true,
    blockNumber: block.number,
  });
  if (version.status !== "success" || owners.status !== "success" || threshold.status !== "success" || nonce.status !== "success") {
    const failed = [version, owners, threshold, nonce].find((r) => r.status !== "success");
    return {
      isSafe: false,
      reason: "not_a_safe",
      detail: `Safe getters failed: ${failed && failed.status === "failure" ? errorMessage(failed.error) : "unknown"}`,
    };
  }
  const v = version.result;
  const supported = isSupportedSafeVersion(v);
  const moduleList = modules.status === "success" ? modules.result[0].map((m) => getAddress(m)) : [];
  const next = modules.status === "success" ? modules.result[1] : SENTINEL_ADDRESS;
  return {
    isSafe: true,
    safe: {
      address: safe,
      chainId: block.chainId,
      blockNumber: block.number,
      version: v,
      supported,
      owners: owners.result.map((o) => getAddress(o)),
      threshold: Number(threshold.result),
      nonce: nonce.result,
      modules: moduleList,
      modulesTruncated: next !== SENTINEL_ADDRESS && next !== zeroAddress,
      guard: supported && guard.status === "success" ? wordToAddress(guard.result) : null,
      moduleGuard: hasModuleGuard(v) && moduleGuard.status === "success" ? wordToAddress(moduleGuard.result) : null,
      fallbackHandler: fallbackHandler.status === "success" ? wordToAddress(fallbackHandler.result) : null,
      singleton: singleton.status === "success" ? wordToAddress(singleton.result) : null,
    },
  };
}

// ---------------------------------------------------------------------------
// Safe transactions and EIP-712 hashing
// ---------------------------------------------------------------------------

/** The full `SafeTx` struct signed by owners and passed to `execTransaction`. */
export interface SafeTransaction {
  to: Address;
  value: bigint;
  data: Hex;
  operation: Operation;
  safeTxGas: bigint;
  baseGas: bigint;
  gasPrice: bigint;
  gasToken: Address;
  refundReceiver: Address;
  nonce: bigint;
}

/**
 * A Safe transaction with no gas refund (safeTxGas = baseGas = gasPrice = 0,
 * gasToken = refundReceiver = 0x0): the executor pays gas and nothing is refunded
 * from the Safe. With safeTxGas = 0 a failing inner call reverts the whole tx.
 */
export function buildSafeTransaction(tx: MetaTx, nonce: bigint): SafeTransaction {
  return {
    to: getAddress(tx.to),
    value: tx.value,
    data: tx.data,
    operation: tx.operation,
    safeTxGas: 0n,
    baseGas: 0n,
    gasPrice: 0n,
    gasToken: zeroAddress,
    refundReceiver: zeroAddress,
    nonce,
  };
}

/** `SafeTx` EIP-712 type (typehash 0xbb8310d4…86d8 in Safe.sol v1.3.0–v1.5.0). */
export const SAFE_TX_EIP712_TYPES = {
  SafeTx: [
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "data", type: "bytes" },
    { name: "operation", type: "uint8" },
    { name: "safeTxGas", type: "uint256" },
    { name: "baseGas", type: "uint256" },
    { name: "gasPrice", type: "uint256" },
    { name: "gasToken", type: "address" },
    { name: "refundReceiver", type: "address" },
    { name: "nonce", type: "uint256" },
  ],
} as const;

/**
 * EIP-712 typed data for a Safe transaction, ready for `eth_signTypedData_v4`.
 * The domain is `{chainId, verifyingContract}` (DOMAIN_SEPARATOR_TYPEHASH
 * 0x47e79534…9218) from Safe v1.3.0 on; older Safes used `{verifyingContract}`
 * only and are rejected with {@link UnsupportedSafeVersionError}.
 */
export function getSafeTxTypedData(chainId: number, safe: string, tx: SafeTransaction, version: string) {
  if (!isSupportedSafeVersion(version)) throw new UnsupportedSafeVersionError(version);
  if (!Number.isSafeInteger(chainId) || chainId <= 0) throw new Error(`invalid chainId ${chainId}`);
  const domain = { chainId, verifyingContract: getAddress(safe) } as const satisfies TypedDataDomain;
  return {
    domain,
    types: SAFE_TX_EIP712_TYPES,
    primaryType: "SafeTx" as const,
    message: {
      to: getAddress(tx.to),
      value: tx.value,
      data: tx.data,
      operation: tx.operation,
      safeTxGas: tx.safeTxGas,
      baseGas: tx.baseGas,
      gasPrice: tx.gasPrice,
      gasToken: getAddress(tx.gasToken),
      refundReceiver: getAddress(tx.refundReceiver),
      nonce: tx.nonce,
    },
  };
}

/** The safeTxHash owners sign; equals the Safe's on-chain `getTransactionHash(...)`. */
export function computeSafeTxHash(chainId: number, safe: string, tx: SafeTransaction, version: string): Hex {
  return hashTypedData(getSafeTxTypedData(chainId, safe, tx, version));
}

// ---------------------------------------------------------------------------
// Signatures
// ---------------------------------------------------------------------------

export type RecoveredSafeSignature =
  { ok: true; signer: Address; kind: "eip712" | "eth_sign"; signature: Hex } | { ok: false; kind: "contract" | "approved_hash" | "invalid"; reason: string };

/**
 * Recover the owner behind a 65-byte Safe signature over `safeTxHash`, following
 * `Safe.checkNSignatures`:
 *  - v = 27/28: EIP-712 signature of the safeTxHash itself;
 *  - v = 31/32: eth_sign (personal_sign) of the hash; the Safe recovers with v − 4
 *    over keccak256("\x19Ethereum Signed Message:\n32" ‖ safeTxHash);
 *  - v = 0 (EIP-1271 contract signature) and v = 1 (pre-approved hash) are not supported yet.
 */
export async function recoverSafeSigner(safeTxHash: Hex, signature: Hex): Promise<RecoveredSafeSignature> {
  if (!isHex(safeTxHash) || size(safeTxHash) !== 32) return { ok: false, kind: "invalid", reason: "safeTxHash must be 32 bytes" };
  if (!isHex(signature) || size(signature) !== 65) return { ok: false, kind: "invalid", reason: "signature must be 65 bytes (r ‖ s ‖ v)" };
  const v = Number(hexToBigInt(sliceHex(signature, 64, 65)));
  const rs = sliceHex(signature, 0, 64);
  try {
    if (v === 27 || v === 28) {
      return { ok: true, signer: await recoverAddress({ hash: safeTxHash, signature }), kind: "eip712", signature };
    }
    if (v === 31 || v === 32) {
      const signer = await recoverAddress({ hash: hashMessage({ raw: safeTxHash }), signature: concatHex([rs, numberToHex(v - 4, { size: 1 })]) });
      return { ok: true, signer, kind: "eth_sign", signature };
    }
  } catch (err) {
    return { ok: false, kind: "invalid", reason: `signature does not recover: ${errorMessage(err)}` };
  }
  if (v === 0) return { ok: false, kind: "contract", reason: "contract (EIP-1271) signatures are not supported yet" };
  if (v === 1) return { ok: false, kind: "approved_hash", reason: "pre-approved hashes are not supported yet" };
  return { ok: false, kind: "invalid", reason: `unsupported v value ${v}` };
}

/**
 * Convert an eth_sign / personal_sign signature (v = 27/28, or 0/1 from some
 * hardware wallets) over the safeTxHash into the Safe's eth_sign form (v + 4 = 31/32).
 */
export function toSafeEthSignSignature(signature: Hex): Hex {
  if (!isHex(signature) || size(signature) !== 65) throw new Error("signature must be 65 bytes");
  let v = Number(hexToBigInt(sliceHex(signature, 64, 65)));
  if (v === 0 || v === 1) v += 27;
  if (v !== 27 && v !== 28) throw new Error(`expected v = 27/28 for an eth_sign signature, got ${v}`);
  return concatHex([sliceHex(signature, 0, 64), numberToHex(v + 4, { size: 1 })]);
}

/**
 * Concatenate owner signatures for `execTransaction`. The Safe requires signers
 * in strictly ascending address order and rejects duplicates. Each signature is
 * kept byte-for-byte (eth_sign signatures stay in their v + 4 form).
 */
export function encodeSafeSignatures(signatures: ReadonlyArray<{ signer: string; signature: Hex }>): Hex {
  if (signatures.length === 0) throw new Error("encodeSafeSignatures: no signatures");
  const items = signatures.map((s) => {
    if (!isHex(s.signature) || size(s.signature) !== 65) throw new Error(`signature for ${s.signer} must be 65 bytes`);
    const v = Number(hexToBigInt(sliceHex(s.signature, 64, 65)));
    if (v === 0) throw new Error("contract signatures (v = 0) need a dynamic part and are not supported");
    return { signer: getAddress(s.signer), key: hexToBigInt(getAddress(s.signer)), signature: s.signature };
  });
  items.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  for (let i = 1; i < items.length; i++) {
    if (items[i]!.key === items[i - 1]!.key) throw new Error(`duplicate signature from ${items[i]!.signer}`);
  }
  return concatHex(items.map((i) => i.signature));
}

/** Calldata for `Safe.execTransaction(...)` with already-sorted, concatenated signatures. */
export function buildExecTransactionData(tx: SafeTransaction, signatures: Hex): Hex {
  return encodeFunctionData({
    abi: SAFE_ABI,
    functionName: "execTransaction",
    args: [
      getAddress(tx.to),
      tx.value,
      tx.data,
      tx.operation,
      tx.safeTxGas,
      tx.baseGas,
      tx.gasPrice,
      getAddress(tx.gasToken),
      getAddress(tx.refundReceiver),
      signatures,
    ],
  });
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------

export interface SafeSimulationResult {
  /** The simulated inner call (or MultiSend batch) succeeded. */
  success: boolean;
  /** Gas used by the inner execution only (excludes execTransaction overhead and signature checks). */
  gasUsed: bigint;
  returnData: Hex;
  /** Why the simulation or the simulated call failed, or null on success. */
  error: string | null;
  /** SimulateTxAccessor used, or null when the simulation could not start (unknown or unsupported Safe). */
  accessor: Address | null;
}

/**
 * Decode the revert payload of `StorageAccessible.simulateAndRevert`:
 * `success (32 bytes) ‖ returndatasize (32 bytes) ‖ returndata`, where returndata is
 * `abi.encode(uint256 estimate, bool success, bytes returnData)` from SimulateTxAccessor.
 */
export function decodeSimulateAndRevert(data: Hex): { delegateCallSuccess: boolean; estimate: bigint; success: boolean; returnData: Hex } {
  if (size(data) < 64) throw new Error(`simulateAndRevert payload too short (${size(data)} bytes)`);
  const delegateCallSuccess = hexToBigInt(sliceHex(data, 0, 32)) === 1n;
  const length = Number(hexToBigInt(sliceHex(data, 32, 64)));
  if (size(data) < 64 + length) throw new Error("simulateAndRevert payload shorter than its declared length");
  const payload: Hex = length === 0 ? "0x" : sliceHex(data, 64, 64 + length);
  if (!delegateCallSuccess) return { delegateCallSuccess, estimate: 0n, success: false, returnData: payload };
  const [estimate, success, returnData] = decodeAbiParameters([{ type: "uint256" }, { type: "bool" }, { type: "bytes" }], payload);
  return { delegateCallSuccess, estimate, success, returnData };
}

/** Best-effort decoding of revert data (Error(string), Panic(uint256), or the raw selector). */
export function describeRevert(returnData: Hex): string {
  if (returnData === "0x") return "reverted without data";
  try {
    const decoded = decodeErrorResult({ abi: [], data: returnData });
    return `${decoded.errorName}(${decoded.args?.map(String).join(", ") ?? ""})`;
  } catch {
    return `reverted with data ${returnData.length > 74 ? `${returnData.slice(0, 74)}…` : returnData}`;
  }
}

function revertDataFrom(err: unknown): Hex | undefined {
  let cur: unknown = err;
  for (let depth = 0; cur && typeof cur === "object" && depth < 12; depth++) {
    const d = (cur as { data?: unknown }).data;
    if (typeof d === "string" && isHex(d) && d.length > 2) return d;
    if (d && typeof d === "object") {
      const inner = (d as { data?: unknown }).data;
      if (typeof inner === "string" && isHex(inner) && inner.length > 2) return inner;
    }
    cur = (cur as { cause?: unknown }).cause;
  }
  return undefined;
}

/**
 * Simulate `tx` as if executed by the Safe, without signatures, via `eth_call`:
 * `Safe.simulateAndRevert(SimulateTxAccessor, simulate(to, value, data, operation))`.
 * The Safe DELEGATECALLs the accessor, which runs the call in the Safe's context
 * and the Safe reverts with the result. A MultiSend batch must be passed as the
 * DELEGATECALL to MultiSendCallOnly produced by `batchForSafe`.
 * Guards are not invoked and signatures are not checked.
 */
export async function simulateSafeTransaction(
  client: PublicClient,
  safe: string,
  tx: MetaTx,
  opts: { version?: string; blockNumber?: bigint } = {},
): Promise<SafeSimulationResult> {
  const safeAddress = getAddress(safe);
  if (tx.operation !== OPERATION.CALL && tx.operation !== OPERATION.DELEGATECALL) throw new Error(`invalid operation ${String(tx.operation)}`);
  const chainId = client.chain?.id ?? (await client.getChainId());
  let version = opts.version;
  if (version === undefined) {
    try {
      version = await client.readContract({
        address: safeAddress,
        abi: SAFE_ABI,
        functionName: "VERSION",
        ...(opts.blockNumber !== undefined ? { blockNumber: opts.blockNumber } : {}),
      });
    } catch (err) {
      return {
        success: false,
        gasUsed: 0n,
        returnData: "0x",
        error: `could not read the Safe version (is ${safeAddress} a Safe?): ${errorMessage(err)}`,
        accessor: null,
      };
    }
  }
  let accessor: Address;
  try {
    accessor = getSimulateTxAccessorAddress(chainId, version);
  } catch (err) {
    return { success: false, gasUsed: 0n, returnData: "0x", error: errorMessage(err), accessor: null };
  }
  const payload = encodeFunctionData({ abi: SIMULATE_TX_ACCESSOR_ABI, functionName: "simulate", args: [getAddress(tx.to), tx.value, tx.data, tx.operation] });
  const data = encodeFunctionData({ abi: SAFE_ABI, functionName: "simulateAndRevert", args: [accessor, payload] });
  const fail = (error: string): SafeSimulationResult => ({ success: false, gasUsed: 0n, returnData: "0x", error, accessor });
  try {
    await client.call({ to: safeAddress, data, ...(opts.blockNumber !== undefined ? { blockNumber: opts.blockNumber } : {}) });
    return fail("simulateAndRevert did not revert: the target is not a Safe >= 1.3.0");
  } catch (err) {
    const revert = revertDataFrom(err);
    if (!revert) return fail(`simulation failed without revert data: ${errorMessage(err)}`);
    let decoded;
    try {
      decoded = decodeSimulateAndRevert(revert);
    } catch (decodeErr) {
      return fail(`could not decode simulation result: ${errorMessage(decodeErr)}`);
    }
    if (!decoded.delegateCallSuccess)
      return { ...fail(`SimulateTxAccessor call failed: ${describeRevert(decoded.returnData)}`), returnData: decoded.returnData };
    return {
      success: decoded.success,
      gasUsed: decoded.estimate,
      returnData: decoded.returnData,
      error: decoded.success ? null : describeRevert(decoded.returnData),
      accessor,
    };
  }
}

import {
  decodeFunctionData,
  domainSeparator,
  getAddress,
  hashStruct,
  hashTypedData,
  hexToBigInt,
  isAddress,
  isAddressEqual,
  isHex,
  maxUint256,
  parseAbi,
  size,
  sliceHex,
  zeroAddress,
  type Address,
  type Hex,
} from "viem";
import type { ProposalDetail } from "@/lib/types";

/**
 * Independent client-side check of a prepared Safe transaction before an owner is
 * asked to sign it, and of the execTransaction calldata before it is submitted.
 *
 * The API builds the transaction from code-defined addresses and recovers every
 * signature against live owners, so this is defence in depth: if stored data were
 * altered, an API bug produced inconsistent fields, or a response were tampered
 * with, the owner must not be shown one transaction and asked to sign another.
 * Nothing here recomputes what is signed; it verifies that the typed data the API
 * prepared hashes to the displayed safeTxHash and encodes exactly the displayed calls.
 * Any problem blocks signing and submission; it never "fixes" data.
 */

/** Safe.sol v1.3.0–v1.5.0 `SafeTx` EIP-712 type, field for field. */
export const SAFE_TX_TYPES = {
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
 * Canonical MultiSendCallOnly deployments, the only DELEGATECALL target TokenIQ uses.
 * Mirrors packages/chain/src/safe-deployments.ts (safe-global/safe-deployments v1.3.0
 * canonical and eip155, v1.4.1, v1.5.0). If this list drifts, signing is refused, never allowed.
 */
const MULTI_SEND_CALL_ONLY: readonly Address[] = [
  "0x40A2aCCbd92BCA938b02010E17A5b8929b49130D",
  "0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B",
  "0x9641d764fc13c8B624c04430C7356C1C7C8102e2",
  "0xA83c336B20401Af773B6219BA5027174338D1836",
];

const MULTISEND_ABI = parseAbi(["function multiSend(bytes transactions)"]);
const EXEC_ABI = parseAbi([
  "function execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures)",
]);
/** Every function TokenIQ's builders produce (ERC-20, ERC-4626, Aave v3 Pool). */
const CALL_ABI = parseAbi([
  "function approve(address spender, uint256 amount)",
  "function transfer(address to, uint256 amount)",
  "function deposit(uint256 assets, address receiver)",
  "function withdraw(uint256 assets, address receiver, address owner)",
  "function redeem(uint256 shares, address receiver, address owner)",
  "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)",
  "function withdraw(address asset, uint256 amount, address to)",
]);

export interface DecodedArg {
  name: string;
  /** Address args are checksummed; amounts are raw integers as decimal strings. */
  value: string;
  kind: "address" | "amount" | "uint";
}

export interface DecodedCall {
  index: number;
  to: Address;
  value: bigint;
  data: Hex;
  /** e.g. "approve(address spender, uint256 amount)"; null when unknown. */
  signature: string | null;
  fn: "approve" | "transfer" | "deposit" | "withdraw" | "redeem" | "supply" | "aaveWithdraw" | null;
  args: DecodedArg[];
  /** The API's description, shown for comparison only. */
  description: string;
}

export interface SafeTxMessage {
  to: Address;
  value: bigint;
  data: Hex;
  operation: 0 | 1;
  safeTxGas: bigint;
  baseGas: bigint;
  gasPrice: bigint;
  gasToken: Address;
  refundReceiver: Address;
  nonce: bigint;
}

export interface SafeTxReview {
  chainId: number;
  safe: Address;
  safeVersion: string;
  message: SafeTxMessage;
  calls: DecodedCall[];
  /** Computed here from the typed data that will be sent to the wallet. */
  safeTxHash: Hex;
  domainHash: Hex;
  messageHash: Hex;
  /** Exactly what the wallet is asked to sign (eth_signTypedData_v4). */
  request: { domain: { chainId: number; verifyingContract: Address }; types: typeof SAFE_TX_TYPES; primaryType: "SafeTx"; message: SafeTxMessage };
}

export interface SafeTxCheck {
  review: SafeTxReview | null;
  /** Human-readable reasons to refuse. Empty means every check passed. */
  problems: string[];
}

const uint = (v: unknown): bigint | null => {
  if (typeof v === "bigint") return v >= 0n ? v : null;
  if (typeof v === "number") return Number.isSafeInteger(v) && v >= 0 ? BigInt(v) : null;
  if (typeof v === "string" && /^\d{1,78}$/.test(v)) return BigInt(v);
  return null;
};
const addr = (v: unknown): Address | null => (typeof v === "string" && isAddress(v, { strict: false }) ? getAddress(v) : null);
const hex = (v: unknown): Hex | null => (typeof v === "string" && isHex(v, { strict: true }) && v.length % 2 === 0 ? (v.toLowerCase() as Hex) : null);
const same = (a: string | null | undefined, b: string | null | undefined) => !!a && !!b && a.toLowerCase() === b.toLowerCase();

/** Decode the packed MultiSend payload: operation (1) ‖ to (20) ‖ value (32) ‖ length (32) ‖ data. */
function decodeMultiSendPayload(payload: Hex): Array<{ operation: number; to: Address; value: bigint; data: Hex }> | string {
  const out: Array<{ operation: number; to: Address; value: bigint; data: Hex }> = [];
  const total = size(payload);
  let i = 0;
  while (i < total) {
    if (i + 85 > total) return "The batch payload is truncated.";
    const operation = Number(hexToBigInt(sliceHex(payload, i, i + 1)));
    const to = getAddress(sliceHex(payload, i + 1, i + 21));
    const value = hexToBigInt(sliceHex(payload, i + 21, i + 53));
    const len = hexToBigInt(sliceHex(payload, i + 53, i + 85));
    if (BigInt(i + 85) + len > BigInt(total)) return "A call in the batch claims more data than the batch contains.";
    const n = Number(len);
    const data = n === 0 ? "0x" : (sliceHex(payload, i + 85, i + 85 + n).toLowerCase() as Hex);
    out.push({ operation, to, value, data });
    i += 85 + n;
  }
  return out.length ? out : "The batch is empty.";
}

function decodeCall(index: number, to: Address, value: bigint, data: Hex, description: string): DecodedCall {
  const base: DecodedCall = { index, to, value, data, signature: null, fn: null, args: [], description };
  try {
    const d = decodeFunctionData({ abi: CALL_ABI, data });
    const a = d.args as readonly unknown[];
    const A = (name: string, v: unknown): DecodedArg => ({ name, value: getAddress(v as string), kind: "address" });
    const N = (name: string, v: unknown, kind: "amount" | "uint" = "amount"): DecodedArg => ({ name, value: (v as bigint | number).toString(), kind });
    switch (d.functionName) {
      case "approve":
        return { ...base, fn: "approve", signature: "approve(address spender, uint256 amount)", args: [A("spender", a[0]), N("amount", a[1])] };
      case "transfer":
        return { ...base, fn: "transfer", signature: "transfer(address to, uint256 amount)", args: [A("to", a[0]), N("amount", a[1])] };
      case "deposit":
        return { ...base, fn: "deposit", signature: "deposit(uint256 assets, address receiver)", args: [N("assets", a[0]), A("receiver", a[1])] };
      case "redeem":
        return { ...base, fn: "redeem", signature: "redeem(uint256 shares, address receiver, address owner)", args: [N("shares", a[0], "uint"), A("receiver", a[1]), A("owner", a[2])] };
      case "supply":
        return { ...base, fn: "supply", signature: "supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)", args: [A("asset", a[0]), N("amount", a[1]), A("onBehalfOf", a[2]), N("referralCode", a[3], "uint")] };
      case "withdraw":
        return typeof a[0] === "bigint"
          ? { ...base, fn: "withdraw", signature: "withdraw(uint256 assets, address receiver, address owner)", args: [N("assets", a[0]), A("receiver", a[1]), A("owner", a[2])] }
          : { ...base, fn: "aaveWithdraw", signature: "withdraw(address asset, uint256 amount, address to)", args: [A("asset", a[0]), N("amount", a[1]), A("to", a[2])] };
    }
  } catch {
    /* unknown selector or malformed calldata */
  }
  return base;
}

const ALLOWED_FNS: Record<ProposalDetail["kind"], ReadonlyArray<DecodedCall["fn"]>> = {
  payment: ["transfer"],
  allocate: ["approve", "deposit", "supply"],
  withdraw: ["withdraw", "redeem", "aaveWithdraw"],
};

/** Token metadata keyed `${chainId}:${lowercase address}` (from /api/v1/meta). */
export type TokenLookup = ReadonlyMap<string, { symbol: string; decimals: number }>;

/**
 * Verify the prepared Safe transaction of a proposal. Pure; safe to call on every render.
 * `tokens` must be the loaded token list: token contracts touched by the calls must be on it.
 */
export function verifySafeTx(p: ProposalDetail, tokens: TokenLookup): SafeTxCheck {
  const problems: string[] = [];
  const tx = p.safeTx;
  if (!tx || !p.safeTxHash) return { review: null, problems: ["The Safe transaction has not been prepared."] };
  const td = tx.typedData;

  // 1. Typed data shape: exactly the Safe's SafeTx type and a {chainId, verifyingContract} domain.
  if (td.primaryType !== "SafeTx") problems.push(`The typed data's primary type is "${td.primaryType}", not "SafeTx".`);
  const typeNames = Object.keys(td.types ?? {});
  if (typeNames.some((t) => t !== "SafeTx" && t !== "EIP712Domain")) problems.push(`The typed data declares unexpected types: ${typeNames.join(", ")}.`);
  if (JSON.stringify(td.types?.SafeTx) !== JSON.stringify(SAFE_TX_TYPES.SafeTx)) problems.push("The SafeTx type in the typed data differs from the Safe contract's definition.");
  if (td.types?.EIP712Domain && JSON.stringify(td.types.EIP712Domain) !== JSON.stringify([{ name: "chainId", type: "uint256" }, { name: "verifyingContract", type: "address" }]))
    problems.push("The EIP-712 domain type differs from the Safe contract's definition.");
  const domainKeys = Object.keys(td.domain ?? {}).sort();
  if (domainKeys.join(",") !== "chainId,verifyingContract") problems.push(`The EIP-712 domain has unexpected fields: ${domainKeys.join(", ")}.`);

  // 2. Domain: the proposal's network and the Safe shown on the page.
  const chainId = uint(td.domain?.chainId);
  const safe = addr(td.domain?.verifyingContract);
  if (chainId === null || chainId === 0n || chainId > BigInt(Number.MAX_SAFE_INTEGER)) problems.push("The typed data has no valid chain id.");
  else if (Number(chainId) !== p.chainId) problems.push(`The typed data is for chain ${chainId}, but the proposal is on chain ${p.chainId}.`);
  if (p.account && p.account.chainId !== p.chainId) problems.push(`The source account is on chain ${p.account.chainId}, but the proposal is on chain ${p.chainId}.`);
  if (!safe) problems.push("The typed data has no valid Safe address.");
  else {
    if (!same(safe, tx.safeAddress)) problems.push(`The typed data is for Safe ${safe}, but the page shows Safe ${tx.safeAddress}.`);
    if (p.account && !same(safe, p.account.address)) problems.push(`The typed data is for Safe ${safe}, but the proposal spends from ${p.account.address}.`);
  }

  // 3. Message fields parse strictly.
  const m = td.message ?? {};
  const message = {
    to: addr(m.to),
    value: uint(m.value),
    data: hex(m.data),
    operation: m.operation === 0 || m.operation === "0" ? 0 : m.operation === 1 || m.operation === "1" ? 1 : null,
    safeTxGas: uint(m.safeTxGas),
    baseGas: uint(m.baseGas),
    gasPrice: uint(m.gasPrice),
    gasToken: addr(m.gasToken),
    refundReceiver: addr(m.refundReceiver),
    nonce: uint(m.nonce),
  };
  const missing = Object.entries(message).filter(([, v]) => v === null).map(([k]) => k);
  if (missing.length) problems.push(`The typed data has missing or malformed fields: ${missing.join(", ")}.`);
  if (missing.length || chainId === null || !safe) return { review: null, problems };
  const msg = message as SafeTxMessage;

  // 4. The message is the stored transaction shown on the page.
  if (!same(msg.to, tx.to)) problems.push(`The signed "to" (${msg.to}) differs from the prepared transaction (${tx.to}).`);
  if (msg.value.toString() !== String(tx.value)) problems.push("The signed ETH value differs from the prepared transaction.");
  if (!same(msg.data, tx.data)) problems.push("The signed calldata differs from the prepared transaction.");
  if (msg.operation !== Number(tx.operation)) problems.push("The signed operation differs from the prepared transaction.");
  if (msg.nonce.toString() !== String(tx.nonce)) problems.push(`The signed nonce (${msg.nonce}) differs from the nonce shown (${tx.nonce}).`);

  // 5. No Safe gas refunds: non-zero values would let whoever submits take a refund from the Safe.
  if (msg.safeTxGas !== 0n || msg.baseGas !== 0n || msg.gasPrice !== 0n || !isAddressEqual(msg.gasToken, zeroAddress) || !isAddressEqual(msg.refundReceiver, zeroAddress))
    problems.push("The transaction sets Safe gas-refund fields (safeTxGas, baseGas, gasPrice, gasToken or refundReceiver). TokenIQ never uses refunds.");

  // 6. Unpack the calls: a direct CALL, or a DELEGATECALL to canonical MultiSendCallOnly only.
  let inner: Array<{ operation: number; to: Address; value: bigint; data: Hex }> = [];
  if (msg.operation === 1) {
    if (!MULTI_SEND_CALL_ONLY.some((a) => isAddressEqual(a, msg.to))) problems.push(`The transaction DELEGATECALLs ${msg.to}, which is not Safe's canonical MultiSendCallOnly. A delegate call can take full control of the Safe.`);
    if (msg.value !== 0n) problems.push("A batched transaction must not send ETH.");
    try {
      const d = decodeFunctionData({ abi: MULTISEND_ABI, data: msg.data });
      const decoded = decodeMultiSendPayload(d.args[0]);
      if (typeof decoded === "string") problems.push(decoded);
      else inner = decoded;
    } catch {
      problems.push("The batch calldata is not a multiSend(bytes) call.");
    }
  } else {
    inner = [{ operation: 0, to: msg.to, value: msg.value, data: msg.data }];
  }
  if (inner.some((c) => c.operation !== 0)) problems.push("A call inside the batch is a DELEGATECALL.");

  // 7. The calls shown on the page are exactly the calls encoded in what is signed.
  if (inner.length !== tx.calls.length) problems.push(`The signed transaction contains ${inner.length} call(s), but ${tx.calls.length} are shown.`);
  inner.forEach((c, i) => {
    const shown = tx.calls[i];
    if (shown && (!same(c.to, shown.to) || c.value.toString() !== String(shown.value) || !same(c.data, shown.data))) problems.push(`Call ${i + 1} in the signed transaction differs from call ${i + 1} shown.`);
  });

  // 8. Decode every call and check it does what the proposal says.
  const calls = inner.map((c, i) => decodeCall(i, c.to, c.value, c.data, tx.calls[i]?.description ?? ""));
  const amount = uint(p.action.assetAmountRaw);
  const targets = calls.map((c) => c.to);
  for (const c of calls) {
    const n = c.index + 1;
    if (c.value !== 0n) problems.push(`Call ${n} sends ETH; TokenIQ only moves ERC-20 tokens.`);
    if (!c.fn) {
      problems.push(`Call ${n} to ${c.to} uses a function this screen cannot decode (selector ${c.data.slice(0, 10)}).`);
      continue;
    }
    if (!ALLOWED_FNS[p.kind].includes(c.fn)) problems.push(`Call ${n} (${c.signature}) is not part of a ${p.kind} action.`);
    const arg = (name: string) => c.args.find((x) => x.name === name)?.value ?? "";
    const isSafe = (v: string) => same(v, safe);
    const amountIs = (v: string, ...ok: bigint[]) => amount !== null && [amount, ...ok].some((x) => x.toString() === v);
    // The token contract this call moves: the call target for ERC-20 calls, the `asset` argument for Aave.
    const token = c.fn === "approve" || c.fn === "transfer" ? c.to : c.fn === "supply" || c.fn === "aaveWithdraw" ? arg("asset") : null;
    if (token) {
      const t = tokens.get(`${p.chainId}:${token.toLowerCase()}`);
      if (!t) problems.push(`Call ${n} moves ${token}, which is not a token TokenIQ supports on this network.`);
      else if (p.action.assetSymbol && t.symbol !== p.action.assetSymbol) problems.push(`Call ${n} moves ${t.symbol}; the proposal is for ${p.action.assetSymbol}.`);
    }
    switch (c.fn) {
      case "approve":
        if (!targets.some((t, j) => j !== c.index && same(t, arg("spender")))) problems.push(`Call ${n} approves ${arg("spender")}, which is not called in this transaction.`);
        if (!amountIs(arg("amount"), 0n)) problems.push(`Call ${n} approves ${arg("amount")} base units; the proposal is for ${p.action.assetAmountRaw}.`);
        break;
      case "transfer":
        if (!amountIs(arg("amount"))) problems.push(`Call ${n} transfers ${arg("amount")} base units; the proposal is for ${p.action.assetAmountRaw}.`);
        if (p.action.recipient && !same(arg("to"), p.action.recipient)) problems.push(`Call ${n} pays ${arg("to")}; the proposal's recipient is ${p.action.recipient}.`);
        if (isSafe(arg("to"))) problems.push(`Call ${n} pays the Safe itself.`);
        break;
      case "deposit":
        if (!amountIs(arg("assets"))) problems.push(`Call ${n} deposits ${arg("assets")} base units; the proposal is for ${p.action.assetAmountRaw}.`);
        if (!isSafe(arg("receiver"))) problems.push(`Call ${n} sends the vault shares to ${arg("receiver")}, not the Safe.`);
        break;
      case "supply":
        if (!amountIs(arg("amount"))) problems.push(`Call ${n} supplies ${arg("amount")} base units; the proposal is for ${p.action.assetAmountRaw}.`);
        if (!isSafe(arg("onBehalfOf"))) problems.push(`Call ${n} supplies on behalf of ${arg("onBehalfOf")}, not the Safe.`);
        break;
      case "withdraw":
        if (!amountIs(arg("assets"))) problems.push(`Call ${n} withdraws ${arg("assets")} base units; the proposal is for ${p.action.assetAmountRaw}.`);
        if (!isSafe(arg("receiver")) || !isSafe(arg("owner"))) problems.push(`Call ${n} withdraws to ${arg("receiver")} (owner ${arg("owner")}); both must be the Safe.`);
        break;
      case "redeem":
        if (!isSafe(arg("receiver")) || !isSafe(arg("owner"))) problems.push(`Call ${n} redeems to ${arg("receiver")} (owner ${arg("owner")}); both must be the Safe.`);
        break;
      case "aaveWithdraw":
        if (!amountIs(arg("amount"), maxUint256)) problems.push(`Call ${n} withdraws ${arg("amount")} base units; the proposal is for ${p.action.assetAmountRaw}.`);
        if (!isSafe(arg("to"))) problems.push(`Call ${n} withdraws to ${arg("to")}, not the Safe.`);
        break;
    }
  }

  // 9. The hash the wallet will compute equals the safeTxHash shown and stored.
  const request = { domain: { chainId: Number(chainId), verifyingContract: safe }, types: SAFE_TX_TYPES, primaryType: "SafeTx" as const, message: msg };
  const safeTxHash = hashTypedData(request);
  if (!same(safeTxHash, p.safeTxHash)) problems.push(`The typed data hashes to ${safeTxHash}, not the safeTxHash shown (${p.safeTxHash}).`);

  return {
    review: {
      chainId: Number(chainId),
      safe,
      safeVersion: tx.safeVersion,
      message: msg,
      calls,
      safeTxHash,
      domainHash: domainSeparator({ domain: request.domain }),
      messageHash: hashStruct({ data: msg, primaryType: "SafeTx", types: SAFE_TX_TYPES }),
      request,
    },
    problems,
  };
}

/**
 * Check the execTransaction calldata returned by the API before it goes to a
 * wallet: right chain, the reviewed Safe, no ETH, and the reviewed SafeTx fields.
 */
export function verifyExecutionData(review: SafeTxReview, threshold: number, data: { chainId: number; to: string; data: string; value: string }): string[] {
  const problems: string[] = [];
  if (data.chainId !== review.chainId) problems.push(`The transaction is for chain ${data.chainId}, but the reviewed Safe transaction is on chain ${review.chainId}.`);
  if (!same(addr(data.to), review.safe)) problems.push(`The transaction is addressed to ${data.to}, not the Safe ${review.safe}.`);
  if (data.value !== "0") problems.push("The transaction would send ETH to the Safe.");
  const calldata = hex(data.data);
  if (!calldata) return [...problems, "The transaction calldata is malformed."];
  try {
    const d = decodeFunctionData({ abi: EXEC_ABI, data: calldata });
    const [to, value, inner, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, signatures] = d.args;
    const m = review.message;
    if (!isAddressEqual(to, m.to) || value !== m.value || !same(inner, m.data) || operation !== m.operation || safeTxGas !== m.safeTxGas || baseGas !== m.baseGas || gasPrice !== m.gasPrice || !isAddressEqual(gasToken, m.gasToken) || !isAddressEqual(refundReceiver, m.refundReceiver))
      problems.push("The transaction to submit differs from the Safe transaction the owners signed.");
    const sigBytes = size(signatures);
    if (sigBytes < 65 * Math.max(1, threshold)) problems.push(`The transaction carries ${Math.floor(sigBytes / 65)} signature(s); the Safe needs ${threshold}.`);
  } catch {
    problems.push("The transaction is not a Safe execTransaction call.");
  }
  return problems;
}

/**
 * Some wallets and hardware-wallet bridges return v = 0/1 instead of 27/28. The Safe (and TokenIQ's
 * API) read v = 0/1 as contract and pre-approved-hash signatures, so normalise an EOA EIP-712 signature
 * before it is checked and stored. Anything that isn't 65 bytes is passed through for the API to reject.
 */
export function normalizeEip712Signature(sig: Hex): Hex {
  if (!/^0x[0-9a-fA-F]{130}$/.test(sig)) return sig;
  const v = Number.parseInt(sig.slice(130), 16);
  return v === 0 || v === 1 ? (`${sig.slice(0, 130)}${(v + 27).toString(16)}` as Hex) : sig;
}

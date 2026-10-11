import { concatHex, encodeFunctionData, encodePacked, getAddress, hashTypedData, parseAbi, size, zeroAddress, type Address, type Hex } from "viem";
import { describe, expect, it } from "vitest";
import type { ProposalDetail } from "@/lib/types";
import { normalizeEip712Signature, SAFE_TX_TYPES, verifyExecutionData, verifySafeTx, type TokenLookup } from "./safe-tx";

const SAFE = getAddress("0x1111111111111111111111111111111111111111");
const VAULT = getAddress("0x2222222222222222222222222222222222222222");
const RECIPIENT = getAddress("0x3333333333333333333333333333333333333333");
const USDC = getAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
const MULTISEND_141 = getAddress("0x9641d764fc13c8B624c04430C7356C1C7C8102e2");
const CHAIN = 8453;
const AMOUNT = 349_000_000_000n;
const tokens: TokenLookup = new Map([[`${CHAIN}:${USDC.toLowerCase()}`, { symbol: "USDC", decimals: 6 }]]);

const abi = parseAbi([
  "function approve(address spender, uint256 amount)",
  "function transfer(address to, uint256 amount)",
  "function deposit(uint256 assets, address receiver)",
  "function multiSend(bytes transactions)",
  "function execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures)",
]);

type Call = { to: Address; data: Hex; description: string };
type Overrides = { message?: Record<string, string | number>; domain?: { chainId: number | string; verifyingContract: string }; safeTxHash?: string; shownCalls?: Call[]; kind?: ProposalDetail["kind"]; action?: Partial<ProposalDetail["action"]> };

function proposal(calls: Call[], o: Overrides = {}): ProposalDetail {
  const batched = calls.length > 1;
  const top = batched
    ? { to: MULTISEND_141, value: "0", operation: 1, data: encodeFunctionData({ abi, functionName: "multiSend", args: [concatHex(calls.map((c) => encodePacked(["uint8", "address", "uint256", "uint256", "bytes"], [0, c.to, 0n, BigInt(size(c.data)), c.data])))] }) }
    : { to: calls[0]!.to, value: "0", operation: 0, data: calls[0]!.data };
  const message: Record<string, string | number> = { ...top, safeTxGas: "0", baseGas: "0", gasPrice: "0", gasToken: zeroAddress, refundReceiver: zeroAddress, nonce: "7", ...o.message };
  const domain = o.domain ?? { chainId: CHAIN, verifyingContract: SAFE };
  const hash = hashTypedData({
    domain: { chainId: Number(domain.chainId), verifyingContract: domain.verifyingContract as Address },
    types: SAFE_TX_TYPES,
    primaryType: "SafeTx",
    message: {
      to: message.to as Address,
      value: BigInt(message.value!),
      data: message.data as Hex,
      operation: Number(message.operation),
      safeTxGas: BigInt(message.safeTxGas!),
      baseGas: BigInt(message.baseGas!),
      gasPrice: BigInt(message.gasPrice!),
      gasToken: message.gasToken as Address,
      refundReceiver: message.refundReceiver as Address,
      nonce: BigInt(message.nonce!),
    },
  });
  return {
    id: "p1",
    kind: o.kind ?? "allocate",
    chainId: CHAIN,
    action: { type: o.kind ?? "allocate", accountId: "a1", amountUsd: "349000", assetAmountRaw: AMOUNT.toString(), ...o.action },
    account: { id: "a1", label: "Ops", address: SAFE, chainId: CHAIN, safeThreshold: 2, safeOwners: [], safeVersion: "1.4.1", verified: true },
    safeTx: {
      to: top.to,
      value: top.value,
      data: top.data,
      operation: top.operation,
      nonce: "7",
      calls: (o.shownCalls ?? calls).map((c) => ({ to: c.to, value: "0", data: c.data, description: c.description })),
      typedData: { domain, types: SAFE_TX_TYPES as never, primaryType: "SafeTx", message },
      safeVersion: "1.4.1",
      safeAddress: SAFE,
      threshold: 2,
      owners: [],
    },
    safeTxHash: o.safeTxHash ?? hash,
  } as unknown as ProposalDetail;
}

const approve = (spender: Address, amount = AMOUNT): Call => ({ to: USDC, data: encodeFunctionData({ abi, functionName: "approve", args: [spender, amount] }), description: "Approve" });
const deposit = (receiver: Address = SAFE, amount = AMOUNT): Call => ({ to: VAULT, data: encodeFunctionData({ abi, functionName: "deposit", args: [amount, receiver] }), description: "Deposit" });
const transfer = (to: Address = RECIPIENT, amount = AMOUNT): Call => ({ to: USDC, data: encodeFunctionData({ abi, functionName: "transfer", args: [to, amount] }), description: "Transfer" });

describe("verifySafeTx", () => {
  it("accepts a correctly prepared batched allocation and reproduces the safeTxHash", () => {
    const p = proposal([approve(VAULT), deposit()]);
    const r = verifySafeTx(p, tokens);
    expect(r.problems).toEqual([]);
    expect(r.review?.safeTxHash).toBe(p.safeTxHash);
    expect(r.review?.calls.map((c) => c.fn)).toEqual(["approve", "deposit"]);
    expect(r.review?.message.operation).toBe(1);
  });

  it("accepts a direct payment to the proposal's recipient", () => {
    const p = proposal([transfer()], { kind: "payment", action: { recipient: RECIPIENT, assetSymbol: "USDC" } });
    expect(verifySafeTx(p, tokens).problems).toEqual([]);
  });

  it("refuses when the displayed safeTxHash is not what the typed data hashes to", () => {
    const p = proposal([approve(VAULT), deposit()], { safeTxHash: `0x${"ab".repeat(32)}` });
    expect(verifySafeTx(p, tokens).problems.join(" ")).toMatch(/hashes to/);
  });

  it("refuses when the signed nonce differs from the nonce shown", () => {
    const p = proposal([approve(VAULT), deposit()], { message: { nonce: "8" } });
    expect(verifySafeTx(p, tokens).problems.join(" ")).toMatch(/nonce/);
  });

  it("refuses a DELEGATECALL to anything other than canonical MultiSendCallOnly", () => {
    const p = proposal([approve(VAULT), deposit()], { message: { to: VAULT } });
    expect(verifySafeTx(p, tokens).problems.join(" ")).toMatch(/not Safe's canonical MultiSendCallOnly/);
  });

  it("refuses gas-refund fields", () => {
    const p = proposal([approve(VAULT), deposit()], { message: { refundReceiver: RECIPIENT, gasPrice: "1" } });
    expect(verifySafeTx(p, tokens).problems.join(" ")).toMatch(/gas-refund/);
  });

  it("refuses when the calls shown differ from the calls signed", () => {
    const p = proposal([approve(VAULT), deposit()], { shownCalls: [approve(VAULT), deposit(SAFE, AMOUNT - 1n)] });
    expect(verifySafeTx(p, tokens).problems.join(" ")).toMatch(/Call 2 in the signed transaction differs/);
  });

  it("refuses a deposit whose shares go somewhere other than the Safe", () => {
    const p = proposal([approve(VAULT), deposit(RECIPIENT)]);
    expect(verifySafeTx(p, tokens).problems.join(" ")).toMatch(/not the Safe/);
  });

  it("refuses an approval for a spender not called in the transaction, or for a different amount", () => {
    const p = proposal([approve(RECIPIENT, AMOUNT * 2n), deposit()]);
    const msg = verifySafeTx(p, tokens).problems.join(" ");
    expect(msg).toMatch(/not called in this transaction/);
    expect(msg).toMatch(/approves .* base units/);
  });

  it("refuses a payment to a different recipient or of a different amount", () => {
    const p = proposal([transfer(VAULT, AMOUNT + 1n)], { kind: "payment", action: { recipient: RECIPIENT } });
    const msg = verifySafeTx(p, tokens).problems.join(" ");
    expect(msg).toMatch(/proposal's recipient/);
    expect(msg).toMatch(/transfers .* base units/);
  });

  it("refuses typed data for another chain or another Safe", () => {
    expect(verifySafeTx(proposal([transfer()], { kind: "payment", domain: { chainId: 1, verifyingContract: SAFE } }), tokens).problems.join(" ")).toMatch(/chain 1/);
    expect(verifySafeTx(proposal([transfer()], { kind: "payment", domain: { chainId: CHAIN, verifyingContract: VAULT } }), tokens).problems.join(" ")).toMatch(/Safe/);
  });

  it("refuses tokens that are not on the supported token list", () => {
    expect(verifySafeTx(proposal([transfer()], { kind: "payment" }), new Map()).problems.join(" ")).toMatch(/not a token TokenIQ supports/);
  });

  it("refuses functions it cannot decode", () => {
    const odd: Call = { to: USDC, data: "0xdeadbeef", description: "Something" };
    expect(verifySafeTx(proposal([odd], { kind: "payment" }), tokens).problems.join(" ")).toMatch(/cannot decode/);
  });
});

describe("verifyExecutionData", () => {
  const p = proposal([approve(VAULT), deposit()]);
  const review = verifySafeTx(p, tokens).review!;
  const m = review.message;
  const exec = (over: Partial<{ to: Address; data: Hex; sigs: number }> = {}) =>
    encodeFunctionData({ abi, functionName: "execTransaction", args: [over.to ?? m.to, m.value, over.data ?? m.data, m.operation, m.safeTxGas, m.baseGas, m.gasPrice, m.gasToken, m.refundReceiver, `0x${"11".repeat(65 * (over.sigs ?? 2))}`] });

  it("accepts calldata that executes the reviewed transaction on the reviewed Safe", () => {
    expect(verifyExecutionData(review, 2, { chainId: CHAIN, to: SAFE, value: "0", data: exec() })).toEqual([]);
  });

  it("refuses a different chain, Safe, value, inner transaction or too few signatures", () => {
    expect(verifyExecutionData(review, 2, { chainId: 1, to: SAFE, value: "0", data: exec() }).join(" ")).toMatch(/chain 1/);
    expect(verifyExecutionData(review, 2, { chainId: CHAIN, to: VAULT, value: "0", data: exec() }).join(" ")).toMatch(/not the Safe/);
    expect(verifyExecutionData(review, 2, { chainId: CHAIN, to: SAFE, value: "1", data: exec() }).join(" ")).toMatch(/ETH/);
    expect(verifyExecutionData(review, 2, { chainId: CHAIN, to: SAFE, value: "0", data: exec({ to: VAULT }) }).join(" ")).toMatch(/differs/);
    expect(verifyExecutionData(review, 2, { chainId: CHAIN, to: SAFE, value: "0", data: exec({ sigs: 1 }) }).join(" ")).toMatch(/needs 2/);
  });
});

describe("normalizeEip712Signature", () => {
  const rs = `0x${"ab".repeat(64)}`;
  it("maps v = 0/1 to 27/28 and leaves 27/28 and malformed input alone", () => {
    expect(normalizeEip712Signature(`${rs}00` as Hex)).toBe(`${rs}1b`);
    expect(normalizeEip712Signature(`${rs}01` as Hex)).toBe(`${rs}1c`);
    expect(normalizeEip712Signature(`${rs}1b` as Hex)).toBe(`${rs}1b`);
    expect(normalizeEip712Signature("0x1234")).toBe("0x1234");
  });
});

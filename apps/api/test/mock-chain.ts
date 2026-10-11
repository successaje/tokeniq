/**
 * A scripted EVM node for security tests: a viem PublicClient whose JSON-RPC calls are answered from a
 * mutable in-memory Safe (owners, threshold, nonce, version), so the prepare → sign → execute flow and
 * execution tracking can be exercised adversarially without a network. Only the calls TokenIQ makes are
 * implemented; anything else fails loudly.
 */
import { ERC20_ABI, SAFE_ABI, SAFE_EXECUTION_FAILURE_TOPIC, SAFE_EXECUTION_SUCCESS_TOPIC, TRANSFER_TOPIC } from "@tokeniq/chain";
import {
  concatHex,
  createPublicClient,
  custom,
  decodeFunctionData,
  encodeAbiParameters,
  encodeFunctionResult,
  getAddress,
  multicall3Abi,
  numberToHex,
  padHex,
  toHex,
  type Hex,
  type PublicClient,
} from "viem";
import { base } from "viem/chains";

const MULTICALL3 = "0xca11bde05977b3631167028862be2a173976ca11";

export interface MockReceipt {
  status: "success" | "reverted";
  blockNumber: bigint;
  /** Safe execution events emitted in the transaction. */
  events: Array<{ safe: string; safeTxHash: Hex; success: boolean }>;
  /** ERC-20 Transfer events emitted in the transaction. */
  transfers?: Array<{ token: string; from: string; to: string; amount: bigint }>;
}

export class MockChain {
  safe: { address: string; owners: string[]; threshold: number; nonce: bigint; version: string };
  /** Above Base's multicall3 deployment block, so viem accepts multicall reads. */
  blockNumber = 30_000_000n;
  simulationSucceeds = true;
  /** ERC-20 balanceOf answers by token address (lowercase); other tokens report 0. Default: 1,000,000 USDC on Base. */
  tokenBalances = new Map<string, bigint>([["0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", 1_000_000_000_000n]]);
  /** When set, every Safe read fails with this error (provider outage or a hostile RPC). */
  failWith: Error | null = null;
  receipts = new Map<string, MockReceipt>();
  readonly client: PublicClient;

  constructor(safe: { address: string; owners: string[]; threshold: number; nonce?: bigint; version?: string }) {
    this.safe = { nonce: 0n, version: "1.4.1", ...safe };
    this.client = createPublicClient({
      chain: base,
      transport: custom({ request: ({ method, params }) => this.request(method, params as unknown[]) }),
    }) as PublicClient;
  }

  private isSafe(to: string) {
    return to.toLowerCase() === this.safe.address.toLowerCase();
  }

  /** Answer one call; returns ABI-encoded return data or throws { revert } for a revert. */
  private call(to: string, data: Hex): Hex {
    if (this.failWith) throw this.failWith;
    if (this.isSafe(to)) {
      const { functionName, args } = decodeFunctionData({ abi: SAFE_ABI, data });
      switch (functionName) {
        case "VERSION":
          return encodeFunctionResult({ abi: SAFE_ABI, functionName, result: this.safe.version });
        case "getOwners":
          return encodeFunctionResult({ abi: SAFE_ABI, functionName, result: this.safe.owners.map((o) => getAddress(o)) });
        case "getThreshold":
          return encodeFunctionResult({ abi: SAFE_ABI, functionName, result: BigInt(this.safe.threshold) });
        case "nonce":
          return encodeFunctionResult({ abi: SAFE_ABI, functionName, result: this.safe.nonce });
        case "getModulesPaginated":
          return encodeFunctionResult({ abi: SAFE_ABI, functionName, result: [[], "0x0000000000000000000000000000000000000001"] });
        case "getStorageAt":
          return encodeFunctionResult({ abi: SAFE_ABI, functionName, result: padHex("0x00", { size: 32 }) });
        case "simulateAndRevert": {
          void args;
          const inner = encodeAbiParameters([{ type: "uint256" }, { type: "bool" }, { type: "bytes" }], [50_000n, this.simulationSucceeds, "0x"]);
          const payload = concatHex([padHex("0x01", { size: 32 }), numberToHex(BigInt((inner.length - 2) / 2), { size: 32 }), inner]);
          throw Object.assign(new Error("execution reverted"), { revert: payload });
        }
        default:
          throw new Error(`MockChain: unexpected Safe call ${functionName}`);
      }
    }
    // Any other contract is treated as an ERC-20 with zero allowance and a fixed balance.
    const { functionName } = decodeFunctionData({ abi: ERC20_ABI, data });
    if (functionName === "allowance") return encodeFunctionResult({ abi: ERC20_ABI, functionName, result: 0n });
    if (functionName === "balanceOf") return encodeFunctionResult({ abi: ERC20_ABI, functionName, result: this.tokenBalances.get(to.toLowerCase()) ?? 0n });
    throw new Error(`MockChain: unexpected call ${functionName} on ${to}`);
  }

  private block(n: bigint) {
    return {
      number: toHex(n),
      hash: padHex(toHex(n), { size: 32 }),
      parentHash: padHex("0x00", { size: 32 }),
      timestamp: toHex(1_731_806_400n + n * 2n) /* block 30,000,000 ≈ 2026-10-11T12:00Z, the test clock */,
      transactions: [],
      uncles: [],
      gasLimit: "0x1c9c380",
      gasUsed: "0x0",
      baseFeePerGas: "0x1",
      miner: "0x0000000000000000000000000000000000000000",
      extraData: "0x",
      logsBloom: `0x${"0".repeat(512)}`,
      nonce: "0x0000000000000000",
      difficulty: "0x0",
      sha3Uncles: padHex("0x00", { size: 32 }),
      stateRoot: padHex("0x00", { size: 32 }),
      receiptsRoot: padHex("0x00", { size: 32 }),
      transactionsRoot: padHex("0x00", { size: 32 }),
      size: "0x1",
    };
  }

  async request(method: string, params: unknown[]): Promise<unknown> {
    switch (method) {
      case "eth_chainId":
        return toHex(base.id);
      case "eth_blockNumber":
        return toHex(this.blockNumber);
      case "eth_getBlockByNumber": {
        const tag = params[0] as string;
        return this.block(tag === "latest" ? this.blockNumber : BigInt(tag));
      }
      case "eth_getCode": {
        if (this.failWith) throw this.failWith;
        const addr = (params[0] as string).toLowerCase();
        return this.isSafe(addr) ? "0x6080604052" : "0x";
      }
      case "eth_call": {
        const { to, data } = params[0] as { to?: string; data: Hex };
        if (!to) throw new Error("MockChain: deployless calls are not supported");
        if (to.toLowerCase() === MULTICALL3) {
          const { args } = decodeFunctionData({ abi: multicall3Abi, data });
          const calls = args[0] as ReadonlyArray<{ target: string; allowFailure: boolean; callData: Hex }>;
          const results = calls.map((c) => {
            try {
              return { success: true, returnData: this.call(c.target, c.callData) };
            } catch {
              return { success: false, returnData: "0x" as Hex };
            }
          });
          return encodeFunctionResult({ abi: multicall3Abi, functionName: "aggregate3", result: results });
        }
        try {
          return this.call(to, data);
        } catch (err) {
          const revert = (err as { revert?: Hex }).revert;
          if (revert) throw Object.assign(new Error("execution reverted"), { code: 3, data: revert });
          throw err;
        }
      }
      case "eth_getTransactionReceipt": {
        const r = this.receipts.get((params[0] as string).toLowerCase());
        if (!r) return null;
        const txHash = params[0] as Hex;
        return {
          transactionHash: txHash,
          transactionIndex: "0x0",
          blockHash: padHex(toHex(r.blockNumber), { size: 32 }),
          blockNumber: toHex(r.blockNumber),
          from: "0x0000000000000000000000000000000000000abc",
          to: this.safe.address,
          cumulativeGasUsed: "0x5208",
          gasUsed: "0x5208",
          effectiveGasPrice: "0x1",
          contractAddress: null,
          logsBloom: `0x${"0".repeat(512)}`,
          type: "0x2",
          status: r.status === "success" ? "0x1" : "0x0",
          logs: [
            ...r.events.map((e) => ({
              address: getAddress(e.safe),
              // Safe >= 1.4 indexes the safeTxHash; data carries the payment (0).
              topics: [e.success ? SAFE_EXECUTION_SUCCESS_TOPIC : SAFE_EXECUTION_FAILURE_TOPIC, e.safeTxHash],
              data: padHex("0x00", { size: 32 }),
              blockNumber: toHex(r.blockNumber),
              blockHash: padHex(toHex(r.blockNumber), { size: 32 }),
              transactionHash: txHash,
              transactionIndex: "0x0",
              removed: false,
            })),
            ...(r.transfers ?? []).map((t) => ({
              address: getAddress(t.token),
              topics: [TRANSFER_TOPIC, padHex(t.from as Hex, { size: 32 }), padHex(t.to as Hex, { size: 32 })],
              data: padHex(toHex(t.amount), { size: 32 }),
              blockNumber: toHex(r.blockNumber),
              blockHash: padHex(toHex(r.blockNumber), { size: 32 }),
              transactionHash: txHash,
              transactionIndex: "0x0",
              removed: false,
            })),
          ].map((l, i) => ({ ...l, logIndex: toHex(i) })),
        };
      }
      case "eth_getTransactionByHash":
        return null;
      default:
        throw new Error(`MockChain: unsupported RPC method ${method}`);
    }
  }
}

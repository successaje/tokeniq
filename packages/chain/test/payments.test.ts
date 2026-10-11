import { encodeAbiParameters, encodeEventTopics, getAddress, pad, type Hex } from "viem";
import { describe, expect, it } from "vitest";
import { ERC20_ABI, SAFE_130_EVENTS_ABI, SAFE_ABI } from "../src/abis.js";
import { findSafeExecutionEvent } from "../src/execution.js";
import { matchTransfer, SAFE_EXECUTION_FAILURE_TOPIC, SAFE_EXECUTION_SUCCESS_TOPIC, TRANSFER_TOPIC, type LogLike } from "../src/payments.js";

const USDC = getAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
const SAFE = getAddress("0x22740deBa78d5a0c24C58C740e3715ec29de1bFa");
const VENDOR = getAddress("0x1111111111111111111111111111111111111111");
const OTHER = getAddress("0x2222222222222222222222222222222222222222");
const SAFE_TX_HASH: Hex = "0xfeaa29562a9bf08b6e34b45c260f6f29e4f8942d0fb0a66981f9397a39ee87b8";

function transferLog(token: Hex, from: Hex, to: Hex, value: bigint, logIndex: number): LogLike {
  return {
    address: token,
    topics: encodeEventTopics({ abi: ERC20_ABI, eventName: "Transfer", args: { from, to } }) as Hex[],
    data: encodeAbiParameters([{ type: "uint256" }], [value]),
    logIndex,
  };
}

describe("matchTransfer", () => {
  it("uses the Safe-standard topic hashes", () => {
    expect(TRANSFER_TOPIC).toBe("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef");
    expect(SAFE_EXECUTION_SUCCESS_TOPIC).toBe(encodeEventTopics({ abi: SAFE_ABI, eventName: "ExecutionSuccess" })[0]);
    expect(SAFE_EXECUTION_FAILURE_TOPIC).toBe(encodeEventTopics({ abi: SAFE_ABI, eventName: "ExecutionFailure" })[0]);
  });

  it("matches a Safe-executed transfer (from = Safe)", () => {
    const logs = [transferLog(USDC, SAFE, OTHER, 5n, 0), transferLog(USDC, SAFE, VENDOR, 1_000_000n, 1)];
    expect(matchTransfer(logs, { token: USDC, to: VENDOR, from: SAFE, minAmountRaw: 1_000_000n })).toEqual({
      matched: { from: SAFE, to: VENDOR, amountRaw: 1_000_000n, logIndex: 1 },
      reason: "matching Transfer found",
    });
  });

  it("explains mismatches", () => {
    const logs = [transferLog(USDC, SAFE, VENDOR, 999_999n, 3)];
    expect(matchTransfer(logs, { token: USDC, to: VENDOR, minAmountRaw: 1_000_000n }).reason).toBe(
      `largest Transfer to ${VENDOR} was 999999, below the minimum 1000000`,
    );
    expect(matchTransfer(logs, { token: USDC, to: OTHER }).reason).toBe(`no Transfer to ${OTHER}`);
    expect(matchTransfer(logs, { token: USDC, to: VENDOR, from: OTHER }).reason).toMatch(/expected/);
    expect(matchTransfer(logs, { token: OTHER, to: VENDOR }).matched).toBeNull();
  });

  it("ignores ERC-721 style Transfers (4 topics) and hints at Safe inner failures", () => {
    const nft: LogLike = { ...transferLog(USDC, SAFE, VENDOR, 1n, 0), topics: [...transferLog(USDC, SAFE, VENDOR, 1n, 0).topics, pad("0x01")] };
    const failure: LogLike = {
      address: SAFE,
      topics: [SAFE_EXECUTION_FAILURE_TOPIC, SAFE_TX_HASH],
      data: encodeAbiParameters([{ type: "uint256" }], [0n]),
      logIndex: 1,
    };
    const r = matchTransfer([nft, failure], { token: USDC, to: VENDOR });
    expect(r.matched).toBeNull();
    expect(r.reason).toMatch(/ExecutionFailure/);
  });
});

describe("findSafeExecutionEvent", () => {
  it("reads indexed (v1.4.1+) events", () => {
    const logs: LogLike[] = [
      {
        address: SAFE,
        topics: encodeEventTopics({ abi: SAFE_ABI, eventName: "ExecutionSuccess", args: { txHash: SAFE_TX_HASH } }) as Hex[],
        data: encodeAbiParameters([{ type: "uint256" }], [0n]),
        logIndex: 4,
      },
    ];
    expect(findSafeExecutionEvent(logs, SAFE)).toEqual({ success: true, safeTxHash: SAFE_TX_HASH, logIndex: 4 });
    expect(findSafeExecutionEvent(logs, OTHER)).toBeNull();
    expect(findSafeExecutionEvent(logs, SAFE, `0x${"00".repeat(32)}`)).toBeNull();
  });

  it("reads non-indexed (v1.3.0) events", () => {
    const logs: LogLike[] = [
      {
        address: SAFE,
        topics: encodeEventTopics({ abi: SAFE_130_EVENTS_ABI, eventName: "ExecutionFailure" }) as Hex[],
        data: encodeAbiParameters([{ type: "bytes32" }, { type: "uint256" }], [SAFE_TX_HASH, 0n]),
        logIndex: 2,
      },
    ];
    expect(findSafeExecutionEvent(logs, SAFE)).toEqual({ success: false, safeTxHash: SAFE_TX_HASH, logIndex: 2 });
    expect(findSafeExecutionEvent(logs, SAFE, SAFE_TX_HASH)?.success).toBe(false);
  });
});

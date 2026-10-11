import { decodeFunctionData, encodeFunctionData, type Hex } from "viem";
import { describe, expect, it } from "vitest";
import { ERC20_ABI, MULTISEND_ABI } from "../src/abis.js";
import { batchForSafe, encodeMultiSend, encodeMultiSendCall } from "../src/multisend.js";
import { getMultiSendCallOnlyAddress, MULTI_SEND_CALL_ONLY } from "../src/safe-deployments.js";
import type { MetaTx } from "../src/types.js";

const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const VAULT = "0xeE8F4eC5672F09119b96Ab6fB59C27E1b7e44b61";

/** Independent packed encoding built from strings, mirroring MultiSend.sol's decoder layout. */
function handPacked(txs: Array<{ op: number; to: string; value: bigint; data: Hex }>): Hex {
  const word = (n: bigint) => n.toString(16).padStart(64, "0");
  return `0x${txs
    .map((t) => {
      const body = t.data.slice(2);
      return `${t.op.toString(16).padStart(2, "0")}${t.to.slice(2).toLowerCase()}${word(t.value)}${word(BigInt(body.length / 2))}${body}`;
    })
    .join("")}` as Hex;
}

describe("encodeMultiSend", () => {
  const approve = encodeFunctionData({ abi: ERC20_ABI, functionName: "approve", args: [VAULT, 1_000_000n] });
  const txs: MetaTx[] = [
    { to: USDC_BASE, value: 0n, data: approve, operation: 0 },
    { to: "0x1111111111111111111111111111111111111111", value: 1n, data: "0x", operation: 0 },
  ];

  it("matches the golden packed layout (op ‖ to ‖ value ‖ len ‖ data)", () => {
    const expected = handPacked([
      { op: 0, to: USDC_BASE, value: 0n, data: approve },
      { op: 0, to: "0x1111111111111111111111111111111111111111", value: 1n, data: "0x" },
    ]);
    expect(encodeMultiSend(txs)).toBe(expected);
    // 2 × (1 + 20 + 32 + 32) header bytes + 68 bytes of approve calldata.
    expect((encodeMultiSend(txs).length - 2) / 2).toBe(2 * 85 + 68);
  });

  it("fixed golden vector for a single empty call", () => {
    expect(encodeMultiSend([{ to: "0x000000000000000000000000000000000000dEaD", value: 0n, data: "0x", operation: 0 }])).toBe(
      "0x00000000000000000000000000000000000000dead00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    );
  });

  it("wraps the payload in multiSend(bytes) (selector 0x8d80ff0a)", () => {
    const data = encodeMultiSendCall(txs);
    expect(data.slice(0, 10)).toBe("0x8d80ff0a");
    const decoded = decodeFunctionData({ abi: MULTISEND_ABI, data });
    expect(decoded.args[0]).toBe(encodeMultiSend(txs));
  });

  it("rejects DELEGATECALLs and empty batches", () => {
    expect(() => encodeMultiSend([{ ...txs[0]!, operation: 1 }])).toThrow(/DELEGATECALL/);
    expect(() => encodeMultiSend([])).toThrow();
  });
});

describe("batchForSafe", () => {
  it("returns a single CALL unchanged", () => {
    const tx: MetaTx = { to: USDC_BASE, value: 0n, data: "0x1234", operation: 0 };
    expect(batchForSafe(8453, "1.4.1", [tx])).toEqual(tx);
  });

  it("delegatecalls the version-matched MultiSendCallOnly for several txs", () => {
    const txs: MetaTx[] = [
      { to: USDC_BASE, value: 0n, data: "0x01", operation: 0 },
      { to: VAULT, value: 0n, data: "0x02", operation: 0 },
    ];
    const v141 = batchForSafe(8453, "1.4.1", txs);
    expect(v141.operation).toBe(1);
    expect(v141.to).toBe("0x9641d764fc13c8B624c04430C7356C1C7C8102e2");
    expect(v141.value).toBe(0n);
    expect(v141.data).toBe(encodeMultiSendCall(txs));
    expect(batchForSafe(1, "1.5.0", txs).to).toBe("0xA83c336B20401Af773B6219BA5027174338D1836");
    expect(batchForSafe(10, "1.3.0", txs).to).toBe("0x40A2aCCbd92BCA938b02010E17A5b8929b49130D");
  });

  it("refuses unsupported Safe versions and unverified chains", () => {
    expect(() => getMultiSendCallOnlyAddress(8453, "1.2.0")).toThrow(/not supported/);
    expect(() => getMultiSendCallOnlyAddress(137, "1.4.1")).toThrow(/not verified/);
    expect(getMultiSendCallOnlyAddress(84532, "1.4.1")).toBe(MULTI_SEND_CALL_ONLY["1.4.1"].address);
  });
});

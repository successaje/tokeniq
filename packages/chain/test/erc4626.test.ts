import { decodeFunctionData, maxUint256 } from "viem";
import { describe, expect, it } from "vitest";
import { ERC20_ABI, ERC4626_ABI } from "../src/abis.js";
import { buildErc4626Deposit, buildErc4626Redeem, buildErc4626Withdraw, buildExactApproval } from "../src/erc4626.js";

const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const VAULT = "0xeE8F4eC5672F09119b96Ab6fB59C27E1b7e44b61";
const SAFE = "0x22740deBa78d5a0c24C58C740e3715ec29de1bFa";
const decode = (data: `0x${string}`) => decodeFunctionData({ abi: [...ERC20_ABI, ...ERC4626_ABI], data });

describe("ERC-4626 builders", () => {
  it("deposit = exact approve + deposit to the receiver", () => {
    const txs = buildErc4626Deposit({ asset: USDC, vault: VAULT, amount: 250_000_000n, receiver: SAFE, currentAllowance: 0n });
    expect(txs.map((t) => [t.to, t.value, t.operation])).toEqual([
      [USDC, 0n, 0],
      [VAULT, 0n, 0],
    ]);
    expect(decode(txs[0]!.data)).toMatchObject({ functionName: "approve", args: [VAULT, 250_000_000n] });
    expect(decode(txs[1]!.data)).toMatchObject({ functionName: "deposit", args: [250_000_000n, SAFE] });
  });

  it("never approves an infinite amount", () => {
    for (const t of buildErc4626Deposit({ asset: USDC, vault: VAULT, amount: 1n, receiver: SAFE, currentAllowance: 5n })) {
      const d = decode(t.data);
      if (d.functionName === "approve") expect(d.args[1]).not.toBe(maxUint256);
    }
  });

  it("resets a non-zero allowance to 0 first (USDT quirk)", () => {
    const txs = buildExactApproval({ token: USDT, spender: VAULT, amount: 10n, currentAllowance: 7n });
    expect(txs.map((t) => decode(t.data).args)).toEqual([
      [VAULT, 0n],
      [VAULT, 10n],
    ]);
    expect(buildExactApproval({ token: USDT, spender: VAULT, amount: 10n, currentAllowance: 0n })).toHaveLength(1);
  });

  it("withdraw and redeem pass receiver and owner", () => {
    expect(decode(buildErc4626Withdraw({ vault: VAULT, assets: 5n, receiver: SAFE, owner: SAFE })[0]!.data)).toMatchObject({
      functionName: "withdraw",
      args: [5n, SAFE, SAFE],
    });
    expect(decode(buildErc4626Redeem({ vault: VAULT, shares: 7n, receiver: SAFE, owner: SAFE })[0]!.data)).toMatchObject({
      functionName: "redeem",
      args: [7n, SAFE, SAFE],
    });
  });

  it("rejects zero amounts and zero addresses", () => {
    const zero = "0x0000000000000000000000000000000000000000";
    expect(() => buildErc4626Deposit({ asset: USDC, vault: VAULT, amount: 0n, receiver: SAFE, currentAllowance: 0n })).toThrow();
    expect(() => buildErc4626Deposit({ asset: USDC, vault: VAULT, amount: 1n, receiver: zero, currentAllowance: 0n })).toThrow();
    expect(() => buildErc4626Withdraw({ vault: VAULT, assets: 1n, receiver: SAFE, owner: zero })).toThrow();
    expect(() => buildErc4626Redeem({ vault: zero, shares: 1n, receiver: SAFE, owner: SAFE })).toThrow();
  });
});

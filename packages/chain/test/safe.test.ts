import {
  concatHex,
  decodeFunctionData,
  encodeAbiParameters,
  encodeErrorResult,
  encodeFunctionData,
  getAddress,
  hashDomain,
  keccak256,
  numberToHex,
  sliceHex,
  zeroAddress,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { describe, expect, it } from "vitest";
import { ERC20_ABI, SAFE_ABI } from "../src/abis.js";
import {
  buildExecTransactionData,
  buildSafeTransaction,
  computeSafeTxHash,
  decodeSimulateAndRevert,
  describeRevert,
  encodeSafeSignatures,
  getSafeTxTypedData,
  recoverSafeSigner,
  toSafeEthSignSignature,
  type SafeTransaction,
} from "../src/safe.js";
import { compareSafeVersions, deploymentVersionFor, hasModuleGuard, isSupportedSafeVersion, UnsupportedSafeVersionError } from "../src/safe-deployments.js";

// Public, well-known development keys (Hardhat/Anvil accounts 0–2). Never used for real funds.
const KEYS = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
] as const;
const accounts = KEYS.map((k) => privateKeyToAccount(k));

const USDC_BASE = getAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
const DEAD = getAddress("0x000000000000000000000000000000000000dEaD");
/** Aave Finance Committee Safe on Base (aave-dao/aave-address-book MiscBase.AFC_SAFE), Safe v1.4.1. */
const AFC_SAFE_BASE = "0x22740deBa78d5a0c24C58C740e3715ec29de1bFa";
/** Aave Protocol Guardian on Base (MiscBase.PROTOCOL_GUARDIAN), Safe v1.3.0. */
const GUARDIAN_SAFE_BASE = "0x56C1a4b54921DEA9A344967a8693C7E661D72968";

const transferData = encodeFunctionData({ abi: ERC20_ABI, functionName: "transfer", args: [DEAD, 1_000_000n] });

/**
 * Independent implementation of Safe's `getTransactionHash`, following
 * Safe.sol `encodeTransactionData` with the typehashes copied from the source
 * (not derived through viem's EIP-712 code).
 */
function referenceSafeTxHash(chainId: number, safe: string, tx: SafeTransaction): Hex {
  const DOMAIN_SEPARATOR_TYPEHASH = "0x47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218";
  const SAFE_TX_TYPEHASH = "0xbb8310d486368db6bd6f849402fdd73ad53d316b5a4b2644ad6efe0f941286d8";
  const domainSeparator = keccak256(
    encodeAbiParameters([{ type: "bytes32" }, { type: "uint256" }, { type: "address" }], [DOMAIN_SEPARATOR_TYPEHASH, BigInt(chainId), getAddress(safe)]),
  );
  const structHash = keccak256(
    encodeAbiParameters(
      [
        { type: "bytes32" },
        { type: "address" },
        { type: "uint256" },
        { type: "bytes32" },
        { type: "uint8" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "address" },
        { type: "address" },
        { type: "uint256" },
      ],
      [SAFE_TX_TYPEHASH, tx.to, tx.value, keccak256(tx.data), tx.operation, tx.safeTxGas, tx.baseGas, tx.gasPrice, tx.gasToken, tx.refundReceiver, tx.nonce],
    ),
  );
  return keccak256(concatHex(["0x1901", domainSeparator, structHash]));
}

describe("Safe transaction hashing", () => {
  const simple = buildSafeTransaction({ to: USDC_BASE, value: 0n, data: transferData, operation: 0 }, 30n);
  const complex: SafeTransaction = {
    to: getAddress("0xA83c336B20401Af773B6219BA5027174338D1836"),
    value: 12345n,
    data: "0xabcdef",
    operation: 1,
    safeTxGas: 100_000n,
    baseGas: 21_000n,
    gasPrice: 1_000_000_000n,
    gasToken: USDC_BASE,
    refundReceiver: DEAD,
    nonce: 42n,
  };

  it("matches on-chain getTransactionHash golden vectors (Base, read 2026-10-11)", () => {
    // Obtained with `cast call <safe> getTransactionHash(...)` against https://mainnet.base.org.
    expect(computeSafeTxHash(8453, AFC_SAFE_BASE, simple, "1.4.1")).toBe("0xfeaa29562a9bf08b6e34b45c260f6f29e4f8942d0fb0a66981f9397a39ee87b8");
    expect(computeSafeTxHash(8453, AFC_SAFE_BASE, complex, "1.4.1")).toBe("0x37209641f570c3af7f49a0208d40a0c3e2d1256546b84db9c6197dca72bc4fe7");
    expect(computeSafeTxHash(8453, GUARDIAN_SAFE_BASE, { ...simple, nonce: 15n }, "1.3.0")).toBe(
      "0x5869023711aab81c7281706717aae223dce0a97c907559b9be0e1cc54cee839e",
    );
  });

  it("uses the {chainId, verifyingContract} domain (matches the Safe's domainSeparator())", () => {
    const { domain } = getSafeTxTypedData(8453, AFC_SAFE_BASE, simple, "1.4.1");
    expect(
      hashDomain({
        domain: { chainId: BigInt(domain.chainId), verifyingContract: domain.verifyingContract },
        types: {
          EIP712Domain: [
            { name: "chainId", type: "uint256" },
            { name: "verifyingContract", type: "address" },
          ],
        },
      }),
    ).toBe("0xcac5aa95b9878082945c186b5f45f543f55a4c39ff36df967afd0609b7d0fff6");
  });

  it("agrees with an independent implementation of encodeTransactionData", () => {
    for (const [chainId, tx] of [
      [1, simple],
      [8453, complex],
      [42161, { ...complex, data: "0x" as Hex, operation: 0 as const }],
    ] as const) {
      expect(computeSafeTxHash(chainId, AFC_SAFE_BASE, tx, "1.5.0")).toBe(referenceSafeTxHash(chainId, AFC_SAFE_BASE, tx));
    }
  });

  it("rejects Safes older than 1.3.0 explicitly", () => {
    expect(() => getSafeTxTypedData(1, AFC_SAFE_BASE, simple, "1.2.0")).toThrow(UnsupportedSafeVersionError);
    expect(() => computeSafeTxHash(1, AFC_SAFE_BASE, simple, "1.1.1")).toThrow(/>= 1.3.0/);
    expect(() => computeSafeTxHash(1, AFC_SAFE_BASE, simple, "garbage")).toThrow(UnsupportedSafeVersionError);
  });
});

describe("Safe versions", () => {
  it("parses and compares versions, including +L2 suffixes", () => {
    expect(isSupportedSafeVersion("1.3.0")).toBe(true);
    expect(isSupportedSafeVersion("1.3.0+L2")).toBe(true);
    expect(isSupportedSafeVersion("1.2.0")).toBe(false);
    expect(hasModuleGuard("1.4.1")).toBe(false);
    expect(hasModuleGuard("1.5.0")).toBe(true);
    expect(compareSafeVersions("1.10.0", "1.5.0")).toBeGreaterThan(0);
    expect(deploymentVersionFor("1.4.0")).toBe("1.4.1");
    expect(deploymentVersionFor("1.5.0")).toBe("1.5.0");
    expect(deploymentVersionFor("1.3.0")).toBe("1.3.0");
  });
});

describe("Safe signatures", () => {
  const tx = buildSafeTransaction({ to: USDC_BASE, value: 0n, data: transferData, operation: 0 }, 7n);
  const typedData = getSafeTxTypedData(8453, AFC_SAFE_BASE, tx, "1.4.1");
  const safeTxHash = computeSafeTxHash(8453, AFC_SAFE_BASE, tx, "1.4.1");

  it("recovers EIP-712 signers (v = 27/28)", async () => {
    for (const account of accounts) {
      const sig = await account.signTypedData(typedData);
      const v = Number(BigInt(sliceHex(sig, 64, 65)));
      expect([27, 28]).toContain(v);
      expect(await recoverSafeSigner(safeTxHash, sig)).toEqual({ ok: true, signer: account.address, kind: "eip712", signature: sig });
    }
  });

  it("recovers eth_sign signers (v = 31/32 over the prefixed hash)", async () => {
    for (const account of accounts) {
      const personal = await account.signMessage({ message: { raw: safeTxHash } });
      const safeSig = toSafeEthSignSignature(personal);
      expect([31, 32]).toContain(Number(BigInt(sliceHex(safeSig, 64, 65))));
      expect(await recoverSafeSigner(safeTxHash, safeSig)).toEqual({ ok: true, signer: account.address, kind: "eth_sign", signature: safeSig });
      // Without the v + 4 marker the same bytes are read as EIP-712 and recover someone else.
      const wrong = await recoverSafeSigner(safeTxHash, personal);
      expect(wrong.ok && wrong.signer).not.toBe(account.address);
    }
  });

  it("returns typed unsupported results for contract signatures and approved hashes", async () => {
    const owner = accounts[0]!.address;
    const contractSig = concatHex([encodeAbiParameters([{ type: "address" }], [owner]), numberToHex(65, { size: 32 }), "0x00"]);
    expect(await recoverSafeSigner(safeTxHash, contractSig)).toMatchObject({ ok: false, kind: "contract" });
    const approved = concatHex([encodeAbiParameters([{ type: "address" }], [owner]), numberToHex(0, { size: 32 }), "0x01"]);
    expect(await recoverSafeSigner(safeTxHash, approved)).toMatchObject({ ok: false, kind: "approved_hash" });
    expect(await recoverSafeSigner(safeTxHash, "0x1234")).toMatchObject({ ok: false, kind: "invalid" });
    expect(await recoverSafeSigner(safeTxHash, concatHex([sliceHex(contractSig, 0, 64), "0x05"]))).toMatchObject({ ok: false, kind: "invalid" });
  });

  it("toSafeEthSignSignature accepts v = 0/1/27/28 only", () => {
    const rs = `0x${"11".repeat(64)}` as Hex;
    expect(sliceHex(toSafeEthSignSignature(concatHex([rs, "0x1b"])), 64, 65)).toBe("0x1f");
    expect(sliceHex(toSafeEthSignSignature(concatHex([rs, "0x01"])), 64, 65)).toBe("0x20");
    expect(() => toSafeEthSignSignature(concatHex([rs, "0x1f"]))).toThrow();
  });

  it("encodes signatures sorted by signer address, keeping eth_sign v + 4", async () => {
    const sigs = await Promise.all(
      accounts.map(async (a, i) =>
        i === 1
          ? { signer: a.address, signature: toSafeEthSignSignature(await a.signMessage({ message: { raw: safeTxHash } })) }
          : { signer: a.address, signature: await a.signTypedData(typedData) },
      ),
    );
    const sorted = [...sigs].sort((x, y) => (BigInt(x.signer) < BigInt(y.signer) ? -1 : 1));
    const encoded = encodeSafeSignatures([sigs[2]!, sigs[0]!, sigs[1]!]);
    expect(encoded).toBe(concatHex(sorted.map((s) => s.signature)));
    // Every 65-byte chunk recovers to ascending owners, as Safe.checkNSignatures requires.
    const recovered = [];
    for (let i = 0; i < 3; i++) {
      const r = await recoverSafeSigner(safeTxHash, sliceHex(encoded, i * 65, (i + 1) * 65));
      if (!r.ok) throw new Error("did not recover");
      recovered.push(BigInt(r.signer));
    }
    expect(recovered[0]! < recovered[1]! && recovered[1]! < recovered[2]!).toBe(true);
    expect(() => encodeSafeSignatures([sigs[0]!, sigs[0]!])).toThrow(/duplicate/);
  });

  it("builds execTransaction calldata", async () => {
    const signatures = encodeSafeSignatures([{ signer: accounts[0]!.address, signature: await accounts[0]!.signTypedData(typedData) }]);
    const data = buildExecTransactionData(tx, signatures);
    const decoded = decodeFunctionData({ abi: SAFE_ABI, data });
    expect(decoded.functionName).toBe("execTransaction");
    expect(decoded.args).toEqual([tx.to, 0n, transferData, 0, 0n, 0n, 0n, zeroAddress, zeroAddress, signatures]);
  });
});

describe("simulateAndRevert decoding", () => {
  it("decodes the revert payload captured from Base (USDC.balanceOf via SimulateTxAccessor 1.4.1)", () => {
    // Raw eth_call error data from https://mainnet.base.org on 2026-10-11 for
    // Safe 0x22740deB…1bFa simulateAndRevert(0x3d4BA2E0…6199, simulate(USDC, 0, balanceOf(safe), 0)).
    const data: Hex =
      "0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000031b70000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000bce051";
    expect(decodeSimulateAndRevert(data)).toEqual({
      delegateCallSuccess: true,
      estimate: 0x31b7n,
      success: true,
      returnData: "0x0000000000000000000000000000000000000000000000000000000000bce051",
    });
  });

  it("reports a failed accessor delegatecall and decodes revert reasons", () => {
    const errorData = encodeErrorResult({
      abi: [{ type: "error", name: "Error", inputs: [{ name: "message", type: "string" }] }],
      errorName: "Error",
      args: ["not a safe"],
    });
    const payload = concatHex([numberToHex(0, { size: 32 }), numberToHex((errorData.length - 2) / 2, { size: 32 }), errorData]);
    const decoded = decodeSimulateAndRevert(payload);
    expect(decoded.delegateCallSuccess).toBe(false);
    expect(describeRevert(decoded.returnData)).toBe("Error(not a safe)");
    expect(describeRevert("0x")).toBe("reverted without data");
    expect(() => decodeSimulateAndRevert("0x01")).toThrow();
  });
});

import { decodeAbiParameters, encodeFunctionData, keccak256, parseAbiItem, type Address, type Hex } from "viem";
import { describe, expect, it } from "vitest";
import {
  batchForSafe,
  buildSafeTransaction,
  computeSafeTxHash,
  createClients,
  ERC20_ABI,
  fetchAaveOpportunities,
  fetchMorphoVaults,
  findTokenBySymbol,
  isPriceStale,
  MULTI_SEND_CALL_ONLY,
  readAavePosition,
  readBalances,
  readErc4626Position,
  readFeeds,
  readSafeExecution,
  readSafeInfo,
  readSequencerStatus,
  requireChain,
  SAFE_ABI,
  SAFE_DEPLOYMENT_CHAINS,
  SIMULATE_TX_ACCESSOR,
  simulateSafeTransaction,
  verifyErc20Transfer,
  type SafeTransaction,
} from "../src/index.js";
import { LIVE } from "./env.js";

// Real state on public RPCs and the Morpho API. Run with LIVE_CHAIN_TESTS=1.
// Public endpoints rate-limit, so each test is retried once.

/** Aave v3 aUSDC on Base / Ethereum hold large USDC balances (aave-dao/aave-address-book). */
const AUSDC_BASE: Address = "0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB";
const AUSDC_ETH: Address = "0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c";
/** Aave Finance Committee Safe on Base (MiscBase.AFC_SAFE), Safe v1.4.1 (SafeL2). */
const AFC_SAFE_BASE: Address = "0x22740deBa78d5a0c24C58C740e3715ec29de1bFa";
/** Aave Protocol Guardian on Base (MiscBase.PROTOCOL_GUARDIAN), Safe v1.3.0. */
const GUARDIAN_SAFE_BASE: Address = "0x56C1a4b54921DEA9A344967a8693C7E661D72968";
/** Listed Morpho V1 vault on Base (Gauntlet USDC Prime). */
const GAUNTLET_USDC_BASE: Address = "0xeE8F4eC5672F09119b96Ab6fB59C27E1b7e44b61";

describe.skipIf(!LIVE)("live chain reads", { retry: 1, timeout: 120_000 }, () => {
  const clients = createClients();
  const base = clients.get(8453)!;
  const eth = clients.get(1)!;
  const usdcBase = findTokenBySymbol(8453, "USDC")!;
  const usdcEth = findTokenBySymbol(1, "USDC")!;

  it("reads USDC balances of large holders at one pinned block", async () => {
    for (const [client, holder, token, chainId] of [
      [base, AUSDC_BASE, usdcBase, 8453],
      [eth, AUSDC_ETH, usdcEth, 1],
    ] as const) {
      const latest = await client.getBlockNumber();
      const r = await readBalances(client, { accounts: [holder], tokens: [token, { address: "native" }] });
      expect(r.failures).toEqual([]);
      expect(r.block.chainId).toBe(chainId);
      expect(r.block.number).toBeLessThanOrEqual(latest - BigInt(requireChain(chainId).confirmations) + 1n);
      const usdc = r.balances.find((b) => b.token === token.address)!;
      expect(usdc.raw).toBeGreaterThan(1_000_000n * 10n ** 6n);
      expect(r.balances.some((b) => b.token === "native")).toBe(true);
    }
  });

  it("reads Chainlink USDC/USD on Base", async () => {
    const [read] = await readFeeds(base, [usdcBase.feed!]);
    if (!read?.ok) throw new Error(read ? read.error : "no result");
    expect(read.decimals).toBe(8);
    expect(read.answer).toBeGreaterThan(95_000_000n);
    expect(read.answer).toBeLessThan(105_000_000n);
    const block = await base.getBlock();
    expect(isPriceStale(usdcBase.feed!, read.updatedAt, Number(block.timestamp))).toBe(false);
  });

  it("reads the Base sequencer uptime feed", async () => {
    const s = await readSequencerStatus(base, 8453);
    expect(s.applicable).toBe(true);
    expect(s.up).toBe(true);
    expect(s.startedAt).toBeGreaterThan(0);
    expect((await readSequencerStatus(eth, 1)).applicable).toBe(false);
  });

  it("reads a real Safe and tells non-Safes apart", async () => {
    const r = await readSafeInfo(base, AFC_SAFE_BASE);
    if (!r.isSafe) throw new Error(r.detail);
    expect(r.safe.version).toBe("1.4.1");
    expect(r.safe.supported).toBe(true);
    expect(r.safe.threshold).toBeGreaterThanOrEqual(1);
    expect(r.safe.owners.length).toBeGreaterThanOrEqual(r.safe.threshold);
    expect(r.safe.singleton).toBe("0x29fcB43b46531BcA003ddC8FCB67FFE91900C762"); // SafeL2 v1.4.1 (safe-deployments)
    expect(r.safe.moduleGuard).toBeNull();
    const v130 = await readSafeInfo(base, GUARDIAN_SAFE_BASE);
    expect(v130.isSafe && v130.safe.version).toBe("1.3.0");
    expect(await readSafeInfo(base, usdcBase.address)).toMatchObject({ isSafe: false, reason: "not_a_safe" });
    expect(await readSafeInfo(base, "0x000000000000000000000000000000000000dEaD")).toMatchObject({ isSafe: false, reason: "no_code" });
  });

  it("computeSafeTxHash equals the Safe's on-chain getTransactionHash (v1.4.1 and v1.3.0)", async () => {
    for (const safe of [AFC_SAFE_BASE, GUARDIAN_SAFE_BASE]) {
      const info = await readSafeInfo(base, safe);
      if (!info.isSafe) throw new Error("not a Safe");
      const tx: SafeTransaction = buildSafeTransaction(
        batchForSafe(8453, info.safe.version, [
          {
            to: usdcBase.address as Address,
            value: 0n,
            data: encodeFunctionData({ abi: ERC20_ABI, functionName: "approve", args: [GAUNTLET_USDC_BASE, 1n] }),
            operation: 0,
          },
          { to: GAUNTLET_USDC_BASE, value: 0n, data: "0x", operation: 0 },
        ]),
        info.safe.nonce,
      );
      const onChain = await base.readContract({
        address: safe,
        abi: SAFE_ABI,
        functionName: "getTransactionHash",
        args: [tx.to, tx.value, tx.data, tx.operation, tx.safeTxGas, tx.baseGas, tx.gasPrice, tx.gasToken, tx.refundReceiver, tx.nonce],
      });
      expect(computeSafeTxHash(8453, safe, tx, info.safe.version)).toBe(onChain);
    }
  });

  it("simulates harmless calls and batches from the Safe", async () => {
    const balanceOf = encodeFunctionData({ abi: ERC20_ABI, functionName: "balanceOf", args: [AFC_SAFE_BASE] });
    const single = await simulateSafeTransaction(base, AFC_SAFE_BASE, { to: usdcBase.address as Address, value: 0n, data: balanceOf, operation: 0 });
    expect(single.error).toBeNull();
    expect(single.success).toBe(true);
    expect(single.gasUsed).toBeGreaterThan(0n);
    const [balance] = decodeAbiParameters([{ type: "uint256" }], single.returnData);
    expect(balance).toBeGreaterThanOrEqual(0n);

    const batch = batchForSafe(8453, "1.4.1", [
      { to: usdcBase.address as Address, value: 0n, data: balanceOf, operation: 0 },
      {
        to: usdcBase.address as Address,
        value: 0n,
        data: encodeFunctionData({ abi: ERC20_ABI, functionName: "approve", args: [GAUNTLET_USDC_BASE, 0n] }),
        operation: 0,
      },
    ]);
    expect(batch.operation).toBe(1);
    const batched = await simulateSafeTransaction(base, AFC_SAFE_BASE, batch, { version: "1.4.1" });
    expect(batched).toMatchObject({ success: true, error: null });

    const tooMuch = await simulateSafeTransaction(base, AFC_SAFE_BASE, {
      to: usdcBase.address as Address,
      value: 0n,
      data: encodeFunctionData({ abi: ERC20_ABI, functionName: "transfer", args: ["0x000000000000000000000000000000000000dEaD", 10n ** 18n] }),
      operation: 0,
    });
    expect(tooMuch.success).toBe(false);
    expect(tooMuch.error).toMatch(/exceeds balance|revert/i);

    const v130 = await simulateSafeTransaction(base, GUARDIAN_SAFE_BASE, { to: usdcBase.address as Address, value: 0n, data: balanceOf, operation: 0 });
    expect(v130).toMatchObject({ success: true, error: null });

    const notASafe = await simulateSafeTransaction(base, usdcBase.address, { to: usdcBase.address as Address, value: 0n, data: balanceOf, operation: 0 });
    expect(notASafe).toMatchObject({ success: false, accessor: null });
  });

  it("MultiSendCallOnly and SimulateTxAccessor code matches safe-deployments on every supported chain", async () => {
    for (const chainId of SAFE_DEPLOYMENT_CHAINS) {
      const client = clients.get(chainId)!;
      for (const d of [...Object.values(MULTI_SEND_CALL_ONLY), ...Object.values(SIMULATE_TX_ACCESSOR)]) {
        const code = await client.getCode({ address: d.address });
        expect(code, `${d.address} on ${chainId}`).toBeDefined();
        expect(keccak256(code!), `${d.address} on ${chainId}`).toBe(d.codeHash);
      }
    }
  });

  it("fetchMorphoVaults returns at least one listed vault", async () => {
    const r = await fetchMorphoVaults({ chainIds: [8453, 1], assetSymbols: ["USDC"], minTvlUsd: 50_000_000 });
    if (!r.ok) throw new Error(JSON.stringify(r.error));
    const listed = r.opportunities.filter((o) => o.listed);
    expect(listed.length).toBeGreaterThanOrEqual(1);
    for (const o of listed) {
      expect(o.asset.symbol).toBe("USDC");
      expect(o.tvlUsd).toBeGreaterThan(10n ** 18n * 50_000_000n);
      expect(o.warnings.filter((w) => w.level === "critical")).toEqual([]);
    }
  });

  it("fetchAaveOpportunities returns the listed USDC reserve on Base", async () => {
    const r = await fetchAaveOpportunities(clients, { assets: ["USDC"], chainIds: [8453] });
    expect(r.errors).toEqual([]);
    const opp = r.opportunities.find((o) => o.chainId === 8453)!;
    expect(opp).toMatchObject({
      protocol: "aave-v3",
      kind: "lending_market",
      address: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
      listed: true,
      feeBps: 1000,
    });
    expect(opp.apy.nativeBps).toBeGreaterThan(0);
    expect(opp.apy.nativeBps).toBeLessThan(5_000);
    expect(opp.tvlUsd).toBeGreaterThan(10n ** 18n * 10_000_000n);
    expect(opp.availableLiquidityUsd).toBeLessThanOrEqual(opp.tvlUsd);
  });

  it("reads ERC-4626 and Aave positions at a pinned block", async () => {
    const vaultPos = await readErc4626Position(base, { vault: GAUNTLET_USDC_BASE, owner: AFC_SAFE_BASE });
    expect(vaultPos.asset).toBe(usdcBase.address);
    expect(vaultPos.assets).toBeGreaterThanOrEqual(0n);
    const aavePos = await readAavePosition(base, { chainId: 8453, asset: usdcBase.address, owner: AFC_SAFE_BASE });
    expect(aavePos.withdrawable).toBeLessThanOrEqual(aavePos.balance);
    expect(aavePos.availableLiquidity).toBeGreaterThan(0n);
  });

  it("verifies a recent real USDC transfer and tracks unknown hashes", async () => {
    const latest = await base.getBlockNumber();
    const logs = await base.getLogs({
      address: usdcBase.address as Address,
      event: parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)"),
      fromBlock: latest - 30n,
      toBlock: latest - 20n,
    });
    const log = logs.find((l) => l.args.value !== undefined && l.args.value > 0n)!;
    expect(log).toBeDefined();
    const r = await verifyErc20Transfer(base, {
      chainId: 8453,
      txHash: log.transactionHash!,
      token: usdcBase.address,
      to: log.args.to!,
      from: log.args.from!,
      minAmountRaw: log.args.value!,
    });
    expect(r.status).toBe("verified");
    expect(r.matched).toMatchObject({ to: log.args.to, amountRaw: log.args.value });
    expect(r.confirmations).toBeGreaterThanOrEqual(20);
    const wrong = await verifyErc20Transfer(base, {
      chainId: 8453,
      txHash: log.transactionHash!,
      token: usdcBase.address,
      to: log.args.to!,
      minAmountRaw: log.args.value! + 10n ** 30n,
    });
    expect(wrong.status).toBe("mismatch");
    const unknown: Hex = `0x${"ab".repeat(32)}`;
    expect((await verifyErc20Transfer(base, { chainId: 8453, txHash: unknown, token: usdcBase.address, to: AFC_SAFE_BASE })).status).toBe("not_found");
    const exec = await readSafeExecution(base, { txHash: log.transactionHash!, safe: AFC_SAFE_BASE });
    expect(exec.status).toBe("mined");
    expect(exec.success).toBe(true);
    expect(exec.gasUsed).toBeGreaterThan(0n);
    expect((await readSafeExecution(base, { txHash: unknown, safe: AFC_SAFE_BASE })).status).toBe("not_found");
  });
});

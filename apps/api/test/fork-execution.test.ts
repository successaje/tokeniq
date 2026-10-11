/**
 * End-to-end controlled execution against a local fork of Base mainnet.
 *
 * Real contracts throughout: a Safe v1.4.1 created through the canonical factory,
 * native USDC, Chainlink USDC/USD, MultiSendCallOnly, SimulateTxAccessor and the
 * listed Morpho vault Gauntlet USDC Prime. The TokenIQ API runs in-process against
 * the fork and is driven exactly as the web app drives it.
 *
 * Opt-in (needs anvil and network access to fork Base):
 *   FORK_E2E=1 TEST_DATABASE_URL=… pnpm --filter @tokeniq/api vitest run test/fork-execution.test.ts
 */
import { spawn, type ChildProcess } from "node:child_process";
import { getListedVenue } from "@tokeniq/chain";
import { eq, schema } from "@tokeniq/db";
import { createPublicClient, createWalletClient, encodeFunctionData, encodeAbiParameters, getAddress, http, keccak256, parseAbi, toHex, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { refreshOpportunities, refreshPrices, trackExecution } from "../src/jobs/data.js";
import { syncAccount } from "../src/services/sync.js";
import { Client, setup, type TestContext } from "./helpers.js";

const RUN = process.env.FORK_E2E === "1";
const FORK_URL = process.env.BASE_RPC_URL ?? "https://mainnet.base.org";
const PORT = 8549;
const ANVIL = `http://127.0.0.1:${PORT}`;

// Anvil's well-known development keys (public; never hold real funds).
const KEYS: Hex[] = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
];
const owners = KEYS.map((k) => privateKeyToAccount(k));
const SAFE_L2_141 = "0x29fcB43b46531BcA003ddC8FCB67FFE91900C762";
const PROXY_FACTORY_141 = "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67";
const FALLBACK_HANDLER_141 = "0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99";
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const VENUE_ID = "morpho:8453:0xee8f4ec5672f09119b96ab6fb59c27e1b7e44b61";

const safeAbi = parseAbi([
  "function setup(address[] _owners,uint256 _threshold,address to,bytes data,address fallbackHandler,address paymentToken,uint256 payment,address paymentReceiver)",
]);
const factoryAbi = parseAbi(["function createProxyWithNonce(address _singleton, bytes initializer, uint256 saltNonce) returns (address proxy)", "event ProxyCreation(address indexed proxy, address singleton)"]);
const erc20 = parseAbi(["function balanceOf(address) view returns (uint256)"]);

let anvil: ChildProcess | null = null;
let ctx: TestContext;
let owner: Client;
let approver: Client;
let safe: `0x${string}`;
let orgId: string;
const publicClient = createPublicClient({ chain: base, transport: http(ANVIL) });
const walletClient = createWalletClient({ chain: base, transport: http(ANVIL), account: owners[0]! });

async function rpc(method: string, params: unknown[]) {
  const res = await fetch(ANVIL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  return (await res.json()).result;
}

vi.setConfig({ testTimeout: 300_000, hookTimeout: 300_000 });

describe.skipIf(!RUN)("controlled execution on a Base fork", () => {
  beforeAll(async () => {
    anvil = spawn("anvil", ["--fork-url", FORK_URL, "--port", String(PORT), "--chain-id", "8453", "--silent"], { stdio: "ignore" });
    for (let i = 0; i < 120; i++) {
      try {
        if (await publicClient.getBlockNumber()) break;
      } catch {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    // 1. A real 2-of-3 Safe v1.4.1 through the canonical factory.
    const initializer = encodeFunctionData({ abi: safeAbi, functionName: "setup", args: [owners.map((o) => o.address), 2n, "0x0000000000000000000000000000000000000000", "0x", FALLBACK_HANDLER_141, "0x0000000000000000000000000000000000000000", 0n, "0x0000000000000000000000000000000000000000"] });
    const hash = await walletClient.writeContract({ address: PROXY_FACTORY_141, abi: factoryAbi, functionName: "createProxyWithNonce", args: [SAFE_L2_141, initializer, BigInt(Date.now())] });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const created = receipt.logs.find((l) => l.address.toLowerCase() === PROXY_FACTORY_141.toLowerCase());
    safe = getAddress(`0x${created!.topics[1]!.slice(26)}`);

    // 2. Give it 250,000 USDC by writing FiatToken's balance slot (mapping at slot 9), like Foundry's deal().
    const slot = keccak256(encodeAbiParameters([{ type: "address" }, { type: "uint256" }], [safe, 9n]));
    await rpc("anvil_setStorageAt", [USDC, slot, toHex(250_000n * 10n ** 6n, { size: 32 })]);
    // Balances are read a few blocks behind the head (finality depth), so advance the chain.
    await rpc("anvil_mine", ["0x10"]);

    ctx = await setup({ RPC_URL_8453: ANVIL });
    owner = new Client(ctx);
    approver = new Client(ctx);
    await owner.signIn("fork-owner@example.com", "Fork Owner");
    await approver.signIn("fork-approver@example.com", "Fork Approver");
    orgId = (await owner.post("/api/v1/orgs", { name: "Fork DAO", preset: "balanced" })).json.id;
    const inv = await owner.post(`/api/v1/orgs/${orgId}/invitations`, { email: "fork-approver@example.com", role: "approver" });
    await approver.post(`/api/v1/invitations/${inv.json.id}/accept`);

    // 3. Real data jobs, limited to Base: Chainlink read from the fork, venues from the Morpho API and Aave on the fork.
    const baseOnly = { ...ctx.deps, clientFor: (id: number) => (id === 8453 ? ctx.deps.clientFor(8453) : undefined), clients: new Map([[8453, ctx.deps.clientFor(8453)!]]) } as typeof ctx.deps;
    ctx.clock.now = new Date();
    await refreshPrices(baseOnly);
    const refreshed = await refreshOpportunities(baseOnly);
    if (!refreshed.morphoOk) throw new Error("Morpho API unavailable; the listed venue could not be loaded");
    const [venueRow] = await ctx.deps.db.select().from(schema.opportunities).where(eq(schema.opportunities.id, VENUE_ID));
    if (!venueRow?.listed) throw new Error("Gauntlet USDC Prime was not returned as a listed venue");
  });

  afterAll(async () => {
    await ctx?.close();
    anvil?.kill("SIGTERM");
  });

  let accountId: string;
  let proposalId: string;

  it("detects the Safe and reads its balance through the API", async () => {
    const res = await owner.post(`/api/v1/orgs/${orgId}/accounts`, { chainId: 8453, address: safe, label: "Fork Safe", purpose: "operating" });
    expect(res.status).toBe(201);
    expect(res.json.account.kind).toBe("safe");
    expect(res.json.account.safe.threshold).toBe(2);
    expect(res.json.account.safe.version).toBe("1.4.1");
    expect(res.json.sync.ok).toBe(true);
    accountId = res.json.account.id;
  });

  it("verifies control with an owner's signed challenge (and rejects a non-owner)", async () => {
    const outsider = privateKeyToAccount("0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6");
    const bad = await owner.post(`/api/v1/orgs/${orgId}/accounts/${accountId}/verify/challenge`, { signer: outsider.address });
    expect(bad.status).toBe(422);
    const ch = await owner.post(`/api/v1/orgs/${orgId}/accounts/${accountId}/verify/challenge`, { signer: owners[0]!.address });
    expect(ch.status).toBe(200);
    const signature = await owners[0]!.signMessage({ message: ch.json.message });
    const ok = await owner.post(`/api/v1/orgs/${orgId}/accounts/${accountId}/verify`, { challengeId: ch.json.challengeId, signature });
    expect(ok.status).toBe(200);
    expect(ok.json.account.verified).toBe(true);
    // The same challenge cannot be replayed.
    expect((await owner.post(`/api/v1/orgs/${orgId}/accounts/${accountId}/verify`, { challengeId: ch.json.challengeId, signature })).status).toBe(409);
  });

  it("creates and internally approves a policy-checked allocation", async () => {
    const t = await owner.get(`/api/v1/orgs/${orgId}/treasury`);
    expect(t.json.treasury.complete).toBe(true);
    const created = await owner.post(`/api/v1/orgs/${orgId}/proposals`, {
      idempotencyKey: `fork-${Date.now()}`,
      action: { type: "allocate", accountId, opportunityId: VENUE_ID, amountUsd: "10000", assetAmountRaw: "10000000000" },
    });
    expect(created.status).toBe(201);
    proposalId = created.json.id;
    const decision = await approver.post(`/api/v1/orgs/${orgId}/proposals/${proposalId}/decision`, { decision: "approve", comment: "Fork test" });
    expect(decision.json.state).toBe("approved");
  });

  it("prepares the exact Safe transaction and simulates it on the fork", async () => {
    const prep = await owner.post(`/api/v1/orgs/${orgId}/proposals/${proposalId}/prepare`);
    expect(prep.status).toBe(200);
    expect(prep.json.simulation.success).toBe(true);
    expect(prep.json.calls.length).toBe(2); // approve(vault, exact) + deposit(amount, safe)
    expect(prep.json.calls.every((c: { to: string }) => [USDC.toLowerCase(), getListedVenue(VENUE_ID)!.address.toLowerCase()].includes(c.to.toLowerCase()))).toBe(true);
  });

  it("collects two owner signatures, rejecting a non-owner", async () => {
    const detail = await owner.get(`/api/v1/orgs/${orgId}/proposals/${proposalId}`);
    const td = detail.json.safeTx.typedData;
    const message = { ...td.message, value: BigInt(td.message.value), safeTxGas: BigInt(td.message.safeTxGas), baseGas: BigInt(td.message.baseGas), gasPrice: BigInt(td.message.gasPrice), nonce: BigInt(td.message.nonce), operation: Number(td.message.operation) };
    const sign = (acct: (typeof owners)[number]) => acct.signTypedData({ domain: { chainId: Number(td.domain.chainId), verifyingContract: td.domain.verifyingContract }, types: td.types, primaryType: td.primaryType, message } as never);
    const outsider = privateKeyToAccount("0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6");
    expect((await owner.post(`/api/v1/orgs/${orgId}/proposals/${proposalId}/signatures`, { signature: await sign(outsider) })).status).toBe(422);
    const s1 = await owner.post(`/api/v1/orgs/${orgId}/proposals/${proposalId}/signatures`, { signature: await sign(owners[0]!) });
    expect(s1.json.ready).toBe(false);
    const s2 = await approver.post(`/api/v1/orgs/${orgId}/proposals/${proposalId}/signatures`, { signature: await sign(owners[1]!) });
    expect(s2.json.ready).toBe(true);
  });

  it("executes on the fork, tracks the Safe event, and reconciles the position", async () => {
    const vault = getListedVenue(VENUE_ID)!.address as `0x${string}`;
    const sharesBefore = await publicClient.readContract({ address: vault, abi: erc20, functionName: "balanceOf", args: [safe] });
    const exec = await owner.post(`/api/v1/orgs/${orgId}/proposals/${proposalId}/execution-data`);
    expect(exec.status).toBe(200);
    const hash = await walletClient.sendTransaction({ to: exec.json.to, data: exec.json.data, value: 0n });
    await publicClient.waitForTransactionReceipt({ hash });
    expect((await owner.post(`/api/v1/orgs/${orgId}/proposals/${proposalId}/executions`, { txHash: hash })).json.status).toBe("submitted");

    // Not executed until enough confirmations.
    await trackExecution(ctx.deps, proposalId);
    expect((await owner.get(`/api/v1/orgs/${orgId}/proposals/${proposalId}`)).json.status).toBe("submitted");
    await rpc("anvil_mine", ["0x10"]);
    await trackExecution(ctx.deps, proposalId);
    const after = await owner.get(`/api/v1/orgs/${orgId}/proposals/${proposalId}`);
    expect(after.json.status).toBe("executed");
    expect(after.json.executions[0].safeSuccess).toBe(true);

    const sharesAfter = await publicClient.readContract({ address: vault, abi: erc20, functionName: "balanceOf", args: [safe] });
    expect(sharesAfter > sharesBefore).toBe(true);
    const usdcLeft = await publicClient.readContract({ address: USDC, abi: erc20, functionName: "balanceOf", args: [safe] });
    expect(usdcLeft).toBe(240_000n * 10n ** 6n);

    // Reconciliation: the position appears in the treasury after sync.
    const [acct] = await ctx.deps.db.select().from(schema.treasuryAccounts).where(eq(schema.treasuryAccounts.id, accountId));
    await syncAccount(ctx.deps, acct!);
    const t = await owner.get(`/api/v1/orgs/${orgId}/treasury`);
    const position = t.json.positions.find((p: { venueId: string }) => p.venueId === VENUE_ID);
    expect(position).toBeTruthy();
    expect(Number(position.valueUsd)).toBeGreaterThan(9_990);
    const events = await owner.get(`/api/v1/orgs/${orgId}/activity?action=proposal.&limit=200`);
    expect(events.json.events.map((e: { action: string }) => e.action)).toEqual(expect.arrayContaining(["proposal.created", "proposal.approved", "proposal.prepared", "proposal.signed", "proposal.submitted", "proposal.executed"]));
  });
});

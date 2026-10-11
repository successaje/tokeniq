import {
  chainName,
  getChain,
  LISTED_VENUES,
  readAavePosition,
  readBalances,
  readErc4626Position,
  readSafeInfo,
  tokensOn,
  findTokenBySymbol,
} from "@tokeniq/chain";
import { and, desc, eq, schema } from "@tokeniq/db";
import { getAddress, isAddressEqual } from "viem";
import type { Deps } from "../context.js";
import { audit } from "../lib/audit.js";
import { recordProviderResult } from "./providers.js";

type AccountRow = typeof schema.treasuryAccounts.$inferSelect;

export interface SyncResult {
  ok: boolean;
  blockNumber: string | null;
  balances: number;
  positions: number;
  failures: string[];
  verificationRevoked: boolean;
}

/**
 * Read one account's balances and listed-venue positions at a single pinned
 * block and store them idempotently (unique per account/asset/block). Safe
 * metadata is refreshed; if the signer who verified the account is no longer an
 * owner, verification is revoked so the account stops counting toward the reserve.
 */
export async function syncAccount(deps: Deps, account: AccountRow): Promise<SyncResult> {
  const chain = getChain(account.chainId);
  const client = deps.clientFor(account.chainId);
  const provider = `rpc:${account.chainId}`;
  if (!chain || !client) return { ok: false, blockNumber: null, balances: 0, positions: 0, failures: ["Unsupported network"], verificationRevoked: false };
  const failures: string[] = [];
  let verificationRevoked = false;
  const started = Date.now();
  try {
    const owner = getAddress(account.address);
    const tokens = tokensOn(account.chainId);
    const read = await readBalances(client, { accounts: [owner], tokens });
    const observedAt = new Date(Number(read.block.timestamp) * 1000);
    for (const f of read.failures) failures.push(`${f.token}: ${f.error}`);
    let stored = 0;
    for (const b of read.balances) {
      const token = tokens.find((t) => (t.address === "native" ? b.token === "native" : b.token !== "native" && isAddressEqual(t.address as `0x${string}`, b.token)));
      if (!token) continue;
      await deps.db
        .insert(schema.balanceSnapshots)
        .values({
          organizationId: account.organizationId,
          accountId: account.id,
          chainId: account.chainId,
          assetAddress: token.address,
          assetSymbol: token.symbol,
          rawBalance: b.raw.toString(),
          blockNumber: read.block.number,
          blockHash: read.block.hash,
          observedAt,
        })
        .onConflictDoNothing();
      stored++;
    }

    // Positions in listed venues on this chain (zero positions are stored only to close a previously open one).
    let positions = 0;
    for (const venue of LISTED_VENUES.filter((v) => v.chainId === account.chainId)) {
      try {
        const usdc = findTokenBySymbol(account.chainId, venue.asset);
        if (!usdc) continue;
        let sharesRaw = 0n;
        let assetsRaw = 0n;
        let withdrawable: bigint | null = null;
        if (venue.protocol === "morpho") {
          const p = await readErc4626Position(client, { vault: venue.address, owner, blockNumber: read.block.number });
          sharesRaw = p.shares;
          assetsRaw = p.assets;
          withdrawable = p.withdrawable;
        } else {
          const p = await readAavePosition(client, { chainId: account.chainId, asset: usdc.address, owner, blockNumber: read.block.number });
          sharesRaw = p.balance;
          assetsRaw = p.balance;
          withdrawable = p.withdrawable;
        }
        const [prev] = await deps.db
          .select({ assetsRaw: schema.positionSnapshots.assetsRaw })
          .from(schema.positionSnapshots)
          .where(and(eq(schema.positionSnapshots.accountId, account.id), eq(schema.positionSnapshots.venueId, venue.id)))
          .orderBy(desc(schema.positionSnapshots.blockNumber))
          .limit(1);
        if (assetsRaw === 0n && (!prev || prev.assetsRaw === "0")) continue;
        await deps.db
          .insert(schema.positionSnapshots)
          .values({
            organizationId: account.organizationId,
            accountId: account.id,
            chainId: account.chainId,
            protocol: venue.protocol,
            venueId: venue.id,
            venueAddress: venue.address,
            venueName: venue.name,
            assetAddress: usdc.address,
            assetSymbol: usdc.symbol,
            sharesRaw: sharesRaw.toString(),
            assetsRaw: assetsRaw.toString(),
            withdrawableRaw: withdrawable === null ? null : withdrawable.toString(),
            blockNumber: read.block.number,
            observedAt,
          })
          .onConflictDoNothing();
        positions++;
      } catch (err) {
        failures.push(`${venue.name}: ${(err as Error).message.split("\n")[0]}`);
      }
    }

    // Safe metadata and verification integrity.
    const updates: Partial<AccountRow> = { lastSyncedAt: observedAt, lastSyncError: failures.length ? failures.slice(0, 3).join("; ").slice(0, 500) : null };
    if (account.kind === "safe") {
      const info = await readSafeInfo(client, owner, { blockNumber: read.block.number });
      if (info.isSafe) {
        Object.assign(updates, {
          safeOwners: info.safe.owners,
          safeThreshold: info.safe.threshold,
          safeVersion: info.safe.version,
          safeNonce: info.safe.nonce,
          safeGuard: info.safe.guard,
          safeModules: info.safe.modules,
        });
        if (account.verifiedAt && account.verificationMethod === "siwe_owner" && account.verificationSigner && !info.safe.owners.some((o) => isAddressEqual(o, account.verificationSigner as `0x${string}`))) {
          Object.assign(updates, { verifiedAt: null, verifiedBy: null, verificationMethod: null, verificationSigner: null });
          verificationRevoked = true;
        }
      } else {
        failures.push(`Safe metadata: ${info.detail}`);
      }
    }
    await deps.db.update(schema.treasuryAccounts).set(updates).where(eq(schema.treasuryAccounts.id, account.id));
    if (verificationRevoked) {
      await audit(deps.db, {
        organizationId: account.organizationId,
        actorUserId: null,
        actorType: "system",
        action: "account.verification_revoked",
        targetType: "account",
        targetId: account.id,
        data: { reason: `${account.verificationSigner} is no longer an owner of the Safe`, chain: chainName(account.chainId) },
      });
    }
    await recordProviderResult(deps, provider, true, Date.now() - started);
    return { ok: true, blockNumber: read.block.number.toString(), balances: stored, positions, failures, verificationRevoked };
  } catch (err) {
    const message = (err as Error).message.split("\n")[0]!.slice(0, 300);
    await deps.db.update(schema.treasuryAccounts).set({ lastSyncError: message }).where(eq(schema.treasuryAccounts.id, account.id));
    await recordProviderResult(deps, provider, false, Date.now() - started, message);
    return { ok: false, blockNumber: null, balances: 0, positions: 0, failures: [message], verificationRevoked };
  }
}

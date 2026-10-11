import type { PublicClient } from "viem";
import { requireChain } from "./chains.js";
import type { PinnedBlock } from "./types.js";

/** Chain id of a client, from its chain config or (if absent) from the RPC. */
export async function clientChainId(client: PublicClient): Promise<number> {
  return client.chain?.id ?? (await client.getChainId());
}

/**
 * Fetch the block every read should be taken at, so that balances, prices and
 * positions are mutually consistent. Without an explicit `blockNumber` it uses
 * `latest − chain.confirmations`, which keeps reads off blocks that may reorg.
 */
export async function pinBlock(client: PublicClient, blockNumber?: bigint): Promise<PinnedBlock> {
  const chainId = await clientChainId(client);
  let target = blockNumber;
  if (target === undefined) {
    const latest = await client.getBlockNumber({ cacheTime: 0 });
    const confirmations = BigInt(requireChain(chainId).confirmations);
    target = latest > confirmations ? latest - confirmations : 0n;
  }
  const block = await client.getBlock({ blockNumber: target });
  if (block.number === null || block.hash === null) throw new Error(`Block ${target} is pending`);
  return { chainId, number: block.number, hash: block.hash, timestamp: block.timestamp };
}

import type { Address } from "viem";
import { SUPPORTED_CHAINS } from "./chains.js";

/**
 * Canonical Safe contract deployments used by TokenIQ.
 *
 * Source: safe-global/safe-deployments `main`, `src/assets/v{1.3.0,1.4.1,1.5.0}/
 * {multi_send_call_only,simulate_tx_accessor}.json` (fetched 2026-10-11). For every
 * supported chain (1, 8453, 42161, 10, 84532, 11155111) `networkAddresses` lists the
 * address below. Verified 2026-10-11: `keccak256(eth_getCode)` equals the
 * deployment file's `codeHash` on all six chains (see the live test).
 */
export type SafeDeploymentVersion = "1.3.0" | "1.4.1" | "1.5.0";

export interface SafeDeployment {
  address: Address;
  /** keccak256 of the runtime bytecode, from safe-deployments. */
  codeHash: `0x${string}`;
}

export const MULTI_SEND_CALL_ONLY: Record<SafeDeploymentVersion, SafeDeployment> = {
  // v1.3.0 "canonical" deployment (the "eip155" one, 0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B, has the same code).
  "1.3.0": { address: "0x40A2aCCbd92BCA938b02010E17A5b8929b49130D", codeHash: "0xa9865ac2d9c7a1591619b188c4d88167b50df6cc0c5327fcbd1c8c75f7c066ad" },
  "1.4.1": { address: "0x9641d764fc13c8B624c04430C7356C1C7C8102e2", codeHash: "0xecd5bd14a08c5d2122379900b2f272bdf107a7e92423c10dd5fe3254386c9939" },
  "1.5.0": { address: "0xA83c336B20401Af773B6219BA5027174338D1836", codeHash: "0xcdbdcec38d2f1c7d961b0029ff8416b7e86e9974d6f0e9c9580c7d17fcfb6663" },
};

export const SIMULATE_TX_ACCESSOR: Record<SafeDeploymentVersion, SafeDeployment> = {
  // v1.3.0 "canonical" deployment.
  "1.3.0": { address: "0x59AD6735bCd8152B84860Cb256dD9e96b85F69Da", codeHash: "0xb3fb9763869f2c09a2ac5a425d2dd6060bf7ef46b3899049d71a711e71e00f04" },
  "1.4.1": { address: "0x3d4BA2E0884aa488718476ca2FB8Efc291A46199", codeHash: "0x91f82615581fc73b190b83d72e883608b25e392f72322035df1b13d51766cf8d" },
  "1.5.0": { address: "0x07EfA797c55B5DdE3698d876b277aBb6B893654C", codeHash: "0x706db4bb6151f75a5b3845724174e201c59046dfbe65b4e5909ad4b88f8f752d" },
};

/** Chains on which the deployments above were verified. */
export const SAFE_DEPLOYMENT_CHAINS: readonly number[] = SUPPORTED_CHAINS.map((c) => c.id);

/** Storage slots (keccak256 of the label), verified against the Safe sources at the version tags. */
export const SAFE_STORAGE_SLOTS = {
  /** `keccak256("guard_manager.guard.address")`, GuardManager since v1.3.0. */
  guard: "0x4a204f620c8c5ccdca3fd54d003badd85ba500436a431f0cbda4f558c93c34c8",
  /** `keccak256("module_manager.module_guard.address")`, ModuleManager v1.5.0 only. */
  moduleGuard: "0xb104e0b93118902c651344349b610029d694cfdec91c589c91ebafbcd0289947",
  /** `keccak256("fallback_manager.handler.address")`, FallbackManager. */
  fallbackHandler: "0x6c9a6c4a39284e37ed1cf53d337577d14212a4870fb976a4366c693b939918d5",
} as const;

/** Linked-list sentinel used by Safe's OwnerManager/ModuleManager. */
export const SENTINEL_ADDRESS: Address = "0x0000000000000000000000000000000000000001";

// ---------------------------------------------------------------------------
// Versions
// ---------------------------------------------------------------------------

export class UnsupportedSafeVersionError extends Error {
  constructor(readonly version: string) {
    super(`Safe version ${version} is not supported (TokenIQ requires Safe >= 1.3.0)`);
    this.name = "UnsupportedSafeVersionError";
  }
}

/** Parse "1.4.1" (also tolerates a "+L2" suffix as reported by the Safe Transaction Service). */
export function parseSafeVersion(version: string): [number, number, number] | null {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:[+-].*)?$/.exec(version.trim());
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

export function compareSafeVersions(a: string, b: string): number {
  const pa = parseSafeVersion(a);
  const pb = parseSafeVersion(b);
  if (!pa || !pb) throw new Error(`Cannot compare Safe versions "${a}" and "${b}"`);
  for (let i = 0; i < 3; i++) if (pa[i]! !== pb[i]!) return pa[i]! - pb[i]!;
  return 0;
}

/**
 * True for Safe versions whose EIP-712 domain is `{chainId, verifyingContract}`
 * and that have StorageAccessible.simulateAndRevert and GuardManager: >= 1.3.0.
 */
export function isSupportedSafeVersion(version: string): boolean {
  const p = parseSafeVersion(version);
  return p !== null && compareSafeVersions(version, "1.3.0") >= 0;
}

/** True when the Safe has module guards (v1.5.0+). */
export function hasModuleGuard(version: string): boolean {
  return isSupportedSafeVersion(version) && compareSafeVersions(version, "1.5.0") >= 0;
}

/** The deployment set matching a Safe version: 1.3.x → 1.3.0, 1.4.x → 1.4.1, 1.5.0 and later → 1.5.0. */
export function deploymentVersionFor(safeVersion: string): SafeDeploymentVersion {
  if (!isSupportedSafeVersion(safeVersion)) throw new UnsupportedSafeVersionError(safeVersion);
  if (compareSafeVersions(safeVersion, "1.4.0") < 0) return "1.3.0";
  if (compareSafeVersions(safeVersion, "1.5.0") < 0) return "1.4.1";
  return "1.5.0";
}

function requireDeploymentChain(chainId: number): void {
  if (!SAFE_DEPLOYMENT_CHAINS.includes(chainId)) throw new Error(`Safe deployments are not verified for chain ${chainId}`);
}

/** Canonical MultiSendCallOnly for a chain and Safe version. */
export function getMultiSendCallOnlyAddress(chainId: number, safeVersion: string): Address {
  requireDeploymentChain(chainId);
  return MULTI_SEND_CALL_ONLY[deploymentVersionFor(safeVersion)].address;
}

/** Canonical SimulateTxAccessor for a chain and Safe version. */
export function getSimulateTxAccessorAddress(chainId: number, safeVersion: string): Address {
  requireDeploymentChain(chainId);
  return SIMULATE_TX_ACCESSOR[deploymentVersionFor(safeVersion)].address;
}

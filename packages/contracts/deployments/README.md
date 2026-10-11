# Deployments

**There are no deployments yet.** No TreasuryReserveGuard has been deployed to any public network. No address in
this repository should be treated as a TokenIQ guard until a manifest exists in this folder.

## Rules

1. A deployment happens only after the treasury's owners authorize it. The deployer key never lives in this
   repository. Use `--account` (an encrypted Foundry keystore) or `--ledger`.
2. Deploying the guard does **not** install it. Installation and configuration are separate **owner-signed
   Safe transactions**. `script/DeployTreasuryReserveGuard.s.sol` prints them, and owners review them in Safe{Wallet}.
3. The target Safe must report `VERSION() == "1.5.0"`. The script refuses anything else. Older Safes (for example
   1.4.1) have no module guard and would silently enforce nothing.
4. After the owners execute the transactions, check on-chain that `guard.isActiveOnSafe() == true`, that
   `guard.safe()` is the intended Safe, and that `guard.trackedTokens()` and `guard.policyOf(token)` match the
   approved policy.

## Procedure

```bash
# 1. Simulate (no transaction is sent):
SAFE=0x... MODULES=0x<roles-modifier-proxy> GUARDIANS=0x... \
FLOOR_TOKENS=0x... FLOOR_AMOUNTS=... OUTFLOW_TOKENS=0x... OUTFLOW_AMOUNTS=... OUTFLOW_WINDOWS=86400 \
forge script script/DeployTreasuryReserveGuard.s.sol --rpc-url $RPC_URL

# 2. Owner-authorized deployment of the guard contract only:
forge script script/DeployTreasuryReserveGuard.s.sol --rpc-url $RPC_URL --broadcast --account <keystore> --verify

# 3. Owners sign and execute the printed Safe transactions (one by one, or the single MultiSendCallOnly batch).
```

## Manifest: `deployments/<chainId>.json`

Record one manifest per chain right after an owner-authorized deployment, in the same pull request as the
deployment evidence:

```json
{
  "chainId": 8453,
  "contract": "TreasuryReserveGuard",
  "address": "0x…",
  "deploymentTxHash": "0x…",
  "blockNumber": 0,
  "deployer": "0x…",
  "commitSha": "<git commit the bytecode was built from>",
  "compiler": { "solc": "0.8.28", "evmVersion": "cancun", "optimizer": true, "runs": 200 },
  "constructorArgs": { "safe": "0x…" },
  "safe": { "address": "0x…", "version": "1.5.0" },
  "verified": "https://basescan.org/address/0x…#code",
  "installation": {
    "safeTxHashes": ["0x…"],
    "isActiveOnSafe": true,
    "checkedAt": "YYYY-MM-DDTHH:MM:SSZ"
  },
  "policy": {
    "modules": ["0x…"],
    "guardians": ["0x…"],
    "floors": [{ "token": "0x…", "amount": "…" }],
    "outflowLimits": [{ "token": "0x…", "amountPerWindow": "…", "windowSeconds": 86400 }],
    "spenders": [{ "token": "0x…", "spender": "0x…" }],
    "delegateCallTargets": ["0x…"]
  }
}
```

A manifest without a verified-source link and a confirmed `isActiveOnSafe: true` is incomplete. The app must not
present such a guard as protecting the treasury.

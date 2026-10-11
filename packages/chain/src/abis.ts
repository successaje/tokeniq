import { parseAbi } from "viem";

/**
 * Minimal contract ABIs used by TokenIQ. Each fragment was checked against the
 * contract source named in its comment; only the functions we call are listed.
 */

/** ERC-20 (EIP-20). USDT on Ethereum omits the bool return of approve/transfer; calldata is identical. */
export const ERC20_ABI = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

/** ERC-4626 tokenized vault (EIP-4626, status Final). */
export const ERC4626_ABI = parseAbi([
  "function asset() view returns (address)",
  "function decimals() view returns (uint8)",
  "function totalAssets() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function convertToAssets(uint256 shares) view returns (uint256)",
  "function convertToShares(uint256 assets) view returns (uint256)",
  "function maxDeposit(address receiver) view returns (uint256)",
  "function maxWithdraw(address owner) view returns (uint256)",
  "function previewDeposit(uint256 assets) view returns (uint256)",
  "function previewRedeem(uint256 shares) view returns (uint256)",
  "function deposit(uint256 assets, address receiver) returns (uint256 shares)",
  "function withdraw(uint256 assets, address receiver, address owner) returns (uint256 shares)",
  "function redeem(uint256 shares, address receiver, address owner) returns (uint256 assets)",
]);

/** Chainlink AggregatorV3Interface (also used by the L2 sequencer uptime feeds). */
export const AGGREGATOR_V3_ABI = parseAbi([
  "function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
  "function decimals() view returns (uint8)",
  "function description() view returns (string)",
]);

/**
 * Safe Smart Account functions shared by v1.3.0, v1.4.1 and v1.5.0
 * (safe-global/safe-smart-account `contracts/Safe.sol` and `GnosisSafe.sol` at the version tags,
 * plus `base/ModuleManager.sol` and `common/StorageAccessible.sol`).
 * `ExecutionSuccess`/`ExecutionFailure` index `txHash` from v1.4.0; see {@link SAFE_130_EVENTS_ABI}.
 */
export const SAFE_ABI = parseAbi([
  "function VERSION() view returns (string)",
  "function getOwners() view returns (address[])",
  "function getThreshold() view returns (uint256)",
  "function nonce() view returns (uint256)",
  "function domainSeparator() view returns (bytes32)",
  "function getModulesPaginated(address start, uint256 pageSize) view returns (address[] array, address next)",
  "function getStorageAt(uint256 offset, uint256 length) view returns (bytes)",
  "function getTransactionHash(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, uint256 _nonce) view returns (bytes32)",
  "function checkSignatures(bytes32 dataHash, bytes data, bytes signatures) view",
  "function execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures) payable returns (bool success)",
  "function simulateAndRevert(address targetContract, bytes calldataPayload)",
  "event ExecutionSuccess(bytes32 indexed txHash, uint256 payment)",
  "event ExecutionFailure(bytes32 indexed txHash, uint256 payment)",
]);

/** Safe v1.5.0 adds an executor-aware `checkSignatures` overload (`contracts/Safe.sol@v1.5.0`). */
export const SAFE_150_ABI = parseAbi(["function checkSignatures(address executor, bytes32 dataHash, bytes signatures) view"]);

/** Safe v1.3.0 events: `txHash` is NOT indexed (`contracts/GnosisSafe.sol@v1.3.0`). Same topic0 as the indexed form. */
export const SAFE_130_EVENTS_ABI = parseAbi([
  "event ExecutionSuccess(bytes32 txHash, uint256 payment)",
  "event ExecutionFailure(bytes32 txHash, uint256 payment)",
]);

/** SimulateTxAccessor (`contracts/accessors/SimulateTxAccessor.sol`); only callable via DELEGATECALL. */
export const SIMULATE_TX_ACCESSOR_ABI = parseAbi([
  "function simulate(address to, uint256 value, bytes data, uint8 operation) returns (uint256 estimate, bool success, bytes returnData)",
]);

/** MultiSend and MultiSendCallOnly (`contracts/libraries/MultiSend*.sol`); selector 0x8d80ff0a. */
export const MULTISEND_ABI = parseAbi(["function multiSend(bytes transactions) payable"]);

/**
 * Aave v3 Pool (aave-dao/aave-v3-origin `src/contracts/interfaces/IPool.sol`, struct
 * `DataTypes.ReserveDataLegacy`). Deprecated struct fields still occupy their slots.
 */
export const AAVE_V3_POOL_ABI = parseAbi([
  "struct ReserveConfigurationMap { uint256 data; }",
  "struct ReserveDataLegacy { ReserveConfigurationMap configuration; uint128 liquidityIndex; uint128 currentLiquidityRate; uint128 variableBorrowIndex; uint128 currentVariableBorrowRate; uint128 currentStableBorrowRate; uint40 lastUpdateTimestamp; uint16 id; address aTokenAddress; address stableDebtTokenAddress; address variableDebtTokenAddress; address interestRateStrategyAddress; uint128 accruedToTreasury; uint128 unbacked; uint128 isolationModeTotalDebt; }",
  "function getReserveData(address asset) view returns (ReserveDataLegacy)",
  "function getVirtualUnderlyingBalance(address asset) view returns (uint128)",
  "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)",
  "function withdraw(address asset, uint256 amount, address to) returns (uint256)",
]);

/** Aave v3 aToken: balances include accrued interest. */
export const ATOKEN_ABI = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function UNDERLYING_ASSET_ADDRESS() view returns (address)",
]);

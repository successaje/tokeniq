# TokenIQ Smart Contracts Documentation

## 📚 Overview

This document provides comprehensive technical documentation for the TokenIQ smart contracts ecosystem. It's designed to help frontend developers understand the architecture, functionality, and integration points of the TokenIQ protocol.

## 📋 Table of Contents
1. [System Architecture](#-system-architecture)
2. [Smart Contract Details](#-smart-contract-details)
   - [AaveVault](#aavevault)
   - [CrossChainRouter](#crosschainrouter)
   - [TreasuryAIManager](#treasuryaimanager)
   - [VaultFactory](#vaultfactory)
   - [VaultManager](#vaultmanager)
3. [Integration Patterns](#-integration-patterns)
4. [Security Considerations](#-security-considerations)
5. [Testing & Deployment](#-testing--deployment)
6. [Troubleshooting](#-troubleshooting)

## 🏗 System Architecture

TokenIQ is a sophisticated DeFi protocol that combines automated yield strategies with cross-chain functionality. The system is built on a modular architecture with clear separation of concerns:

### Core Components

1. **VaultManager**
   - Central hub for user interactions
   - Manages user deposits, withdrawals, and share calculations
   - Tracks vault balances and performance metrics

2. **VaultFactory**
   - Deploys new vault instances using the minimal proxy pattern
   - Maintains a registry of all deployed vaults
   - Enables vault type-specific configurations

3. **TreasuryAIManager**
   - Implements AI-driven investment strategies
   - Processes off-chain AI decisions on-chain
   - Manages risk parameters and allocations

4. **AaveVault**
   - Implements Aave V3 integration
   - Handles lending and borrowing operations
   - Manages interest accrual and aToken conversions

5. **CrossChainRouter**
   - Enables cross-chain asset transfers via Chainlink CCIP
   - Manages chain-specific configurations and fees
   - Handles message passing between chains

### Data Flow

1. Users interact with VaultManager to deposit/withdraw funds
2. VaultManager routes funds to appropriate vaults
3. TreasuryAIManager makes strategy decisions
4. Vaults execute strategies on supported protocols (Aave, etc.)
5. CrossChainRouter facilitates cross-chain operations

## 📝 Smart Contract Details

### AaveVault

**Network**: Ethereum Sepolia  
**Address**: [0xB791B...1Ca1](https://sepolia.etherscan.io/address/0xB791Be1D932397e3eFa757C8d4B9F6BAC86F1Ca1)  
**ABI**: [View ABI](https://sepolia.etherscan.io/address/0xB791Be1D932397e3eFa757C8d4B9F6BAC86F1Ca1#code)

#### State Variables

```solidity
// Aave V3 Pool contract
IPool public immutable aavePool;

// Supported tokens and their aToken addresses
mapping(address => address) public tokenToAToken;

// Total assets managed by the vault
uint256 public totalAssets;
```

#### Key Functions

1. **deposit(uint256 amount)**
   ```solidity
   function deposit(uint256 amount) external onlyVaultManager
   ```
   - Deposits assets into Aave protocol
   - Mints aTokens in return
   - Updates totalAssets tracking
   
   **Parameters**:
   - `amount`: Amount of underlying tokens to deposit (in wei)
   
   **Events**:
   ```solidity
   event Deposited(address indexed token, uint256 amount, uint256 aTokenAmount);
   ```

2. **withdraw(uint256 amount)**
   ```solidity
   function withdraw(uint256 amount) external onlyVaultManager
   ```
   - Withdraws assets from Aave
   - Burns aTokens
   - Updates totalAssets
   
   **Parameters**:
   - `amount`: Amount of underlying tokens to withdraw
   
   **Events**:
   ```solidity
   event Withdrawn(address indexed token, uint256 amount, uint256 aTokenAmount);
   ```

3. **rebalance()**
   ```solidity
   function rebalance() external onlyVaultManager
   ```
   - Rebalances the vault's position in Aave
   - Optimizes for capital efficiency
   - May adjust leverage or asset allocation

4. **getTotalValue()**
   ```solidity
   function getTotalValue() external view returns (uint256)
   ```
   - Returns total value of assets in the vault
   - Includes both principal and accrued interest
   - Returns value in underlying token decimals

#### Integration Notes
- Always check token allowances before depositing
- Monitor gas costs for rebalancing operations
- Handle potential Aave-specific errors (e.g., insufficient liquidity)

### CrossChainRouter

**Networks**:
- Ethereum Sepolia: [0xD1d6...eb71](https://sepolia.etherscan.io/address/0xD1d6EE0c5309A09Df9ca4c2936956A49cca9eb71)
- Avalanche Fuji: [0x6444...1b9c](https://testnet.snowtrace.io/address/0x6444f16e29Bf33a8C9da2B89E472b58Bafe41b9c)
- Base Sepolia: [0x7CC3...68f6](https://sepolia.basescan.org/address/0x7CC324d15E5fF17c43188fB63b462B9a79dA68f6)

#### State Variables

```solidity
// Chainlink Router contract
IRouterClient public immutable router;

// Supported tokens and their fee token status
mapping(address => bool) public supportedTokens;

// Chain ID to router address mapping
mapping(uint64 => address) public chainToRouter;
```

#### Key Functions

1. **sendTokens**
   ```solidity
   function sendTokens(
       uint64 destinationChainSelector,
       address token,
       uint256 amount
   ) external payable
   ```
   - Sends tokens to another chain
   - Handles fee payments in native token
   - Emits cross-chain transfer events
   
   **Parameters**:
   - `destinationChainSelector`: Chain ID of destination
   - `token`: ERC20 token address
   - `amount`: Amount to transfer
   
   **Events**:
   ```solidity
   event TokensSent(
       bytes32 indexed messageId,
       uint64 destinationChainSelector,
       address token,
       uint256 amount
   );
   ```

2. **setSupportedChain**
   ```solidity
   function setSupportedChain(
       uint64 chainId,
       address routerAddress,
       bool supported
   ) external onlyOwner
   ```
   - Adds/removes supported chains
   - Updates router addresses
   - Access restricted to owner

#### Integration Notes
- Always check if chain is supported before sending
- Include sufficient native token for fees
- Handle CCIP-specific error codes

### TreasuryAIManager

**Network**: Avalanche Fuji  
**Address**: [0x86C4...0dBc](https://testnet.snowtrace.io/address/0x86C41594e9aDeCcf8c85ba9EEe0138C7c9E70dBc)

#### State Variables

```solidity
// Chainlink Keeper Registry
KeeperRegistrarInterface public immutable keeperRegistrar;

// Strategy decision tracking
mapping(address => StrategyDecision) public latestDecisions;

// Supported strategies
mapping(address => bool) public supportedStrategies;
```

#### Key Functions

1. **processDecision**
   ```solidity
   function processDecision(
       bytes32 decisionId,
       address strategy,
       uint256 allocation,
       string calldata reason
   ) external onlyServiceLayer
   ```
   - Processes AI-generated strategy decisions
   - Validates inputs and strategy support
   - Emits decision events
   
   **Events**:
   ```solidity
   event DecisionProcessed(
       bytes32 indexed decisionId,
       address indexed strategy,
       uint256 allocation,
       string reason
   );
   ```

2. **performUpkeep**
   ```solidity
   function performUpkeep(bytes calldata performData) external
   ```
   - Called by Chainlink Keepers
   - Executes pending strategy updates
   - Handles rebalancing logic

#### Integration Notes
- Monitor Keeper balance for automation
- Handle off-chain decision processing delays
- Implement proper event indexing

### VaultFactory

**Network**: Avalanche Fuji  
**Address**: [0xC310...FE54](https://testnet.snowtrace.io/address/0xC310b43748E5303F1372Ab2C9075629E0Bb4FE54)

#### State Variables

```solidity
// Vault implementation contracts
mapping(string => address) public vaultImplementations;

// All deployed vaults
address[] public allVaults;

// Vault type to instances mapping
mapping(string => address[]) public vaultsByType;
```

#### Key Functions

1. **createVault**
   ```solidity
   function createVault(string calldata _vaultType) external returns (address)
   ```
   - Deploys a new vault clone
   - Initializes vault parameters
   - Updates registry
   
   **Events**:
   ```solidity
   event VaultCreated(
       address indexed vault,
       string vaultType,
       address creator
   );
   ```

#### Integration Notes
- Check vault type support before creation
- Handle clone initialization properly
- Monitor gas costs for factory operations

### VaultManager

**Network**: Avalanche Fuji  
**Address**: [0xF673...9b40](https://testnet.snowtrace.io/address/0xF673F508104876c72C8724728f81d50E01649b40)

#### State Variables

```solidity
// User vault balances
mapping(address => mapping(address => UserInfo)) public userInfo;

// Vault configurations
mapping(address => VaultConfig) public vaultConfigs;

// Total shares per vault
mapping(address => uint256) public totalShares;
```

#### Key Functions

1. **deposit**
   ```solidity
   function deposit(address vaultId, uint256 amount) external nonReentrant
   ```
   - Handles user deposits
   - Mints shares
   - Updates accounting

2. **withdraw**
   ```solidity
   function withdraw(address vaultId, uint256 shares) external nonReentrant
   ```
   - Processes withdrawals
   - Burns shares
   - Transfers assets

#### Integration Notes
- Implement proper share calculation
- Handle deposit/withdrawal limits
- Consider reentrancy protection

## 🔄 Integration Patterns

### Frontend Implementation

1. **Wallet Connection**
   ```javascript
   // Example using ethers.js
   const provider = new ethers.providers.Web3Provider(window.ethereum);
   await provider.send("eth_requestAccounts", []);
   const signer = provider.getSigner();
   ```

2. **Contract Instantiation**
   ```javascript
   const vaultManager = new ethers.Contract(
       VAULT_MANAGER_ADDRESS,
       vaultManagerABI,
       signer
   );
   ```

3. **Event Listening**
   ```javascript
   vaultManager.on('Deposited', (user, vault, amount, shares, event) => {
       // Handle deposit event
   });
   ```

## 🔒 Security Considerations

1. **Access Control**
   - Verify all function modifiers
   - Implement proper admin controls
   - Use OpenZeppelin's AccessControl

2. **Reentrancy**
   - Use nonReentrant modifier
   - Follow checks-effects-interactions
   - Consider using OpenZeppelin's ReentrancyGuard

3. **Input Validation**
   - Validate all user inputs
   - Use require() with descriptive messages
   - Implement proper error handling

## 🧪 Testing & Deployment

### Testing

1. **Unit Tests**
   - Test individual functions
   - Mock dependencies
   - Cover edge cases

2. **Integration Tests**
   - Test contract interactions
   - Verify state changes
   - Test with forked mainnet

### Deployment

1. **Deployment Scripts**
   - Use Hardhat/Truffle scripts
   - Verify contracts on block explorers
   - Initialize with proper parameters

2. **Verification**
   ```bash
   npx hardhat verify --network <network> <contract_address> <constructor_args>
   ```

## 🛠 Troubleshooting

### Common Issues

1. **Transaction Reverts**
   - Check error messages
   - Verify gas limits
   - Confirm approvals

2. **Event Not Firing**
   - Confirm transaction success
   - Check event filters
   - Verify correct contract instance

3. **Cross-Chain Failures**
   - Verify chain support
   - Check fee payments
   - Monitor message status

### Support

For additional support, contact the development team or refer to the contract source code on block explorers.

1. **deposit(uint256 amount)**
   - **Description**: Deposits assets into Aave protocol
   - **Access**: Only VaultManager
   - **Parameters**:
     - `amount`: Amount of tokens to deposit

2. **withdraw(uint256 amount)**
   - **Description**: Withdraws assets from Aave protocol
   - **Access**: Only VaultManager
   - **Parameters**:
     - `amount`: Amount of tokens to withdraw

3. **rebalance()**
   - **Description**: Rebalances the vault's position in Aave
   - **Access**: Only VaultManager

4. **getTotalValue()**
   - **Returns**: Total value of assets in the vault
   - **View Function**: Yes

### CrossChainRouter

**Networks**:
- Ethereum Sepolia: [0xD1d6...eb71](https://sepolia.etherscan.io/address/0xD1d6EE0c5309A09Df9ca4c2936956A49cca9eb71)
- Avalanche Fuji: [0x6444...1b9c](https://testnet.snowtrace.io/address/0x6444f16e29Bf33a8C9da2B89E472b58Bafe41b9c)
- Base Sepolia: [0x7CC3...68f6](https://sepolia.basescan.org/address/0x7CC324d15E5fF17c43188fB63b462B9a79dA68f6)

#### Key Functions

1. **sendTokens(uint64 destinationChainSelector, address token, uint256 amount)**
   - **Description**: Sends tokens to another chain
   - **Parameters**:
     - `destinationChainSelector`: Chain ID of the destination
     - `token`: Token contract address
     - `amount`: Amount to send

2. **setSupportedChain(uint64 chainId, bool supported)**
   - **Description**: Enables/disables chain support
   - **Access**: Only owner

### TreasuryAIManager

**Network**: Avalanche Fuji  
**Address**: [0x86C4...0dBc](https://testnet.snowtrace.io/address/0x86C41594e9aDeCcf8c85ba9EEe0138C7c9E70dBc)

#### Key Functions

1. **processDecision(bytes32 decisionId, address strategy, uint256 allocation, string reason)**
   - **Description**: Processes an AI decision for a strategy
   - **Access**: Only service layer

2. **getLatestDecision(address strategy)**
   - **Description**: Gets the latest decision for a strategy
   - **Returns**: Decision details including allocation and timestamp

3. **setSupportedStrategy(address strategy, bool supported)**
   - **Description**: Adds/removes a strategy from the supported list
   - **Access**: Only owner

### VaultFactory

**Network**: Avalanche Fuji  
**Address**: [0xC310...FE54](https://testnet.snowtrace.io/address/0xC310b43748E5303F1372Ab2C9075629E0Bb4FE54)

#### Key Functions

1. **createVault(string memory _vaultType)**
   - **Description**: Creates a new vault of specified type
   - **Returns**: Address of the new vault
   - **Emitted Events**: `VaultCreated`

2. **getVaultsByType(string memory _vaultType)**
   - **Description**: Gets all vaults of a specific type
   - **Returns**: Array of vault addresses

### VaultManager

**Network**: Avalanche Fuji  
**Address**: [0xF673...9b40](https://testnet.snowtrace.io/address/0xF673F508104876c72C8724728f81d50E01649b40)

#### Key Functions

1. **deposit(address vaultId, uint256 amount)**
   - **Description**: Deposits tokens into a vault
   - **Parameters**:
     - `vaultId`: Address of the vault
     - `amount`: Amount of tokens to deposit

2. **withdraw(address vaultId, uint256 shares)**
   - **Description**: Withdraws shares from a vault
   - **Parameters**:
     - `vaultId`: Address of the vault
     - `shares`: Number of shares to withdraw

3. **userInfo(address vaultId, address user)**
   - **Description**: Gets user's info for a vault
   - **Returns**: User's shares and last deposit timestamp

## Integration Flow

1. **Vault Creation**
   - Use `VaultFactory.createVault()` to create new vaults
   - Listen for `VaultCreated` event

2. **User Deposits**
   - User approves VaultManager to spend their tokens
   - Call `VaultManager.deposit()`
   - Update UI with new share balance

3. **AI Strategy Updates**
   - Monitor `TreasuryAIManager` for new decisions
   - Update UI to reflect strategy changes

4. **Cross-Chain Transfers**
   - Use `CrossChainRouter.sendTokens()` for cross-chain operations
   - Show transaction status and confirmations

## Important Notes

1. **Chain-Specific Addresses**: Always use the correct contract address for the current network
2. **Gas Considerations**: Some operations (especially cross-chain) may require higher gas limits
3. **Error Handling**: Always implement proper error handling for transactions
4. **Event Listening**: Important to listen for events to track state changes
5. **Testing**: Test all integrations on testnets before deploying to mainnet

## Frontend Implementation Tips

1. **Wallet Connection**
   - Use Web3Modal or similar for wallet connection
   - Support multiple wallet providers (MetaMask, WalletConnect, etc.)

2. **State Management**
   - Use a state management solution (Redux, Context API)
   - Cache contract data where appropriate

3. **Error Handling**
   - Provide clear error messages for failed transactions
   - Handle network changes and disconnections gracefully

4. **Performance**
   - Batch RPC calls where possible
   - Implement loading states for better UX

## Support

For any questions or issues, please contact the development team or refer to the contract source code on Etherscan/Snowtrace.

# Tokenization Contract Tasks

This document outlines the tasks and interactions with the TokenIQ smart contracts for tokenization.

## Contract Addresses (Core Testnet)

- **AssetFactory**: [0x02406b6d17E743deA7fBbfAE8A15c82e4481E168](https://scan.test2.btcs.network/address/0x02406b6d17E743deA7fBbfAE8A15c82e4481E168)
- **ERC20VaultToken**: [0xC310b43748E5303F1372Ab2C9075629E0Bb4FE54](https://scan.test2.btcs.network/address/0xC310b43748E5303F1372Ab2C9075629E0Bb4FE54)
- **ERC721CollateralNFT**: [0xc4d732199B7d21207a74CFE6CEd4d17dD330C7Ea](https://scan.test2.btcs.network/address/0xc4d732199B7d21207a74CFE6CEd4d17dD330C7Ea)
- **ERC1155HybridAsset**: [0xc9C0Fb76a50eAb570665977703cC8f7185c082b5](https://scan.test2.btcs.network/address/0xc9C0Fb76a50eAb570665977703cC8f7185c082b5)

## Frontend Integration Tasks

### 1. Setup and Configuration

#### Initialize Web3 Provider
```typescript
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
});
```

#### Connect Wallet
```typescript
import { useAccount, useConnect, useDisconnect } from 'wagmi';

function ConnectButton() {
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { isConnected, address } = useAccount();

  if (isConnected) {
    return (
      <div>
        Connected to {address?.substring(0, 6)}...{address?.substring(38)}
        <button onClick={() => disconnect()}>
          Disconnect
        </button>
      </div>
    );
  }

  return connectors.map((connector) => (
    <button key={connector.uid} onClick={() => connect({ connector })}>
      Connect with {connector.name}
    </button>
  ));
}
```

### 2. Token Operations

#### Load Token Balance
```typescript
import { erc20Abi } from 'viem';

async function getTokenBalance(tokenAddress: `0x${string}`, userAddress: `0x${string}`) {
  const balance = await publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [userAddress]
  });
  return balance;
}
```

#### Approve Token Spending
```typescript
import { useWriteContract } from 'wagmi';

function ApproveButton({ tokenAddress, spender, amount }: {
  tokenAddress: `0x${string}`;
  spender: `0x${string}`;
  amount: bigint;
}) {
  const { writeContract } = useWriteContract();

  return (
    <button 
      onClick={() => writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, amount]
      })}
    >
      Approve Tokens
    </button>
  );
}
```

### 3. Asset Creation

#### Create ERC20 Token
```typescript
function CreateERC20Button() {
  const { writeContract } = useWriteContract();
  const { address } = useAccount();

  const createToken = () => {
    writeContract({
      address: '0x02406b6d17E743deA7fBbfAE8A15c82e4481E168', // AssetFactory
      abi: AssetFactoryABI,
      functionName: 'createERC20VaultToken',
      args: [
        'MyToken',      // name
        'MTK',          // symbol
        18,             // decimals
        1000000,        // initialSupply
        address         // owner
      ]
    });
  };

  return <button onClick={createToken}>Create ERC20 Token</button>;
}
```

### 4. Transaction Handling

#### Handle Transaction States
```typescript
function MintButton() {
  const { data: hash, isPending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  return (
    <div>
      <button
        disabled={isPending}
        onClick={() => writeContract({
          address: '0x...',
          abi: erc20Abi,
          functionName: 'mint',
          args: [/* ... */]
        })}
      >
        {isPending ? 'Confirming...' : 'Mint Tokens'}
      </button>
      {hash && <div>Transaction Hash: {hash}</div>}
      {isConfirming && <div>Waiting for confirmation...</div>}
      {isConfirmed && <div>Transaction confirmed!</div>}
    </div>
  );
}
```

### 5. Event Listening

#### Listen for Transfer Events
```typescript
useEffect(() => {
  const unwatch = publicClient.watchContractEvent({
    address: tokenAddress,
    abi: erc20Abi,
    eventName: 'Transfer',
    onLogs: (logs) => {
      logs.forEach((log) => {
        console.log('Transfer:', {
          from: log.args.from,
          to: log.args.to,
          value: log.args.value
        });
      });
    },
  });

  return () => unwatch();
}, [tokenAddress]);
```

## Common Tasks

### 1. Deploying New Assets

#### Deploy ERC20 Vault Token
```typescript
// Using AssetFactory
const tx = await assetFactory.createERC20VaultToken(
  name,          // string
  symbol,        // string
  decimals,      // uint8
  initialSupply, // uint256
  owner          // address
);
```

#### Deploy ERC721 Collateral NFT
```typescript
const tx = await assetFactory.createERC721CollateralNFT(
  name,          // string
  symbol,        // string
  baseURI,       // string
  owner          // address
);
```

#### Deploy ERC1155 Hybrid Asset
```typescript
const tx = await assetFactory.createERC1155HybridAsset(
  uri,           // string
  owner          // address
);
```

### 2. Token Management

#### Minting Tokens
```typescript
// ERC20
await erc20VaultToken.mint(to, amount);

// ERC721
await erc721CollateralNFT.mint(to, tokenId, tokenURI);

// ERC1155
await erc1155HybridAsset.mint(account, id, amount, data);
```

#### Transferring Tokens
```typescript
// ERC20
erc20VaultToken.transfer(to, amount);

// ERC721
erc721CollateralNFT.transferFrom(from, to, tokenId);

// ERC1155
erc1155HybridAsset.safeTransferFrom(from, to, id, amount, data);
```

### 3. Asset Management

#### Setting Up Vaults
```typescript
// Create a new vault
const tx = await vaultFactory.createVault(
  assetAddress,  // address
  name,          // string
  symbol,        // string
  owner          // address
);
```

#### Managing Collateral
```typescript
// Add collateral to a vault
await vaultManager.addCollateral(vaultId, tokenAddress, tokenId, amount);

// Withdraw collateral
await vaultManager.withdrawCollateral(vaultId, tokenAddress, tokenId, amount);
```

### 4. Cross-Chain Operations

#### Bridge Assets
```typescript
await crossChainRouter.bridgeAsset(
  sourceChainId,  // uint256
  targetChainId,  // uint256
  tokenAddress,   // address
  amount,         // uint256
  recipient,      // address
  data            // bytes
);
```

## Common Patterns

### Listening to Events
```typescript
// Example: Listen for token mints
erc20VaultToken.on('Transfer', (from, to, amount, event) => {
  console.log(`Transfer: ${amount} tokens from ${from} to ${to}`);
});
```

### Error Handling
```typescript
try {
  const tx = await contract.someFunction();
  const receipt = await tx.wait();
  // Handle success
} catch (error) {
  console.error('Transaction failed:', error);
  // Handle error
}
```

## Security Considerations

1. Always verify contract addresses on-chain before interacting with them
2. Use the `require` statement to validate inputs and conditions
3. Implement access control using OpenZeppelin's `AccessControl`
4. Use reentrancy guards for functions that make external calls
5. Keep private keys and mnemonic phrases secure

## Testing

1. Use Hardhat or Truffle for local testing
2. Write comprehensive test cases for all contract functions
3. Test edge cases and failure modes
4. Use forked mainnet for realistic testing

## Deployment

1. Deploy contracts in this order:
   - Implementation contracts
   - Proxies (if using upgradeable contracts)
   - Factories
   - Managers and routers

2. Verify all contracts on block explorer
3. Initialize contracts with proper parameters
4. Transfer ownership to a multisig or governance contract

## Troubleshooting

- **Transaction Reverted**: Check the error message in the transaction receipt
- **Out of Gas**: Increase gas limit for complex transactions
- **Nonce Too Low**: Wait for pending transactions or reset your wallet
- **Insufficient Funds**: Ensure the wallet has enough native token for gas

## Resources

- [Ethereum Documentation](https://ethereum.org/en/developers/docs/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/4.x/)
- [Hardhat Documentation](https://hardhat.org/docs/)
- [Core Testnet Explorer](https://scan.test2.btcs.network/)

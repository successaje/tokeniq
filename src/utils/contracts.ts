import { createPublicClient, http, createWalletClient, custom } from 'viem';
import { sepolia, coreTestnet2 } from 'viem/chains';
import { getContract } from 'viem/contract';

// Import ABIs
import AssetFactoryABI from '@/ABI/AssetFactory.json';
import ERC20VaultTokenABI from '@/ABI/ERC20VaultToken.json';
import ERC721CollateralNFTABI from '@/ABI/ERC721CollateralNFT.json';
import ERC1155HybridAssetABI from '@/ABI/ERC1155HybridAsset.json';

// Contract addresses
export const CONTRACT_ADDRESSES = {
  ASSET_FACTORY_PROXY: '0x02406b6d17E743deA7fBbfAE8A15c82e4481E168',
  ASSET_FACTORY_IMPL: '0x89C3FBe736EDa478967Ac19Ca8634D3562881f6F',
  ERC20_VAULT_TOKEN: '0xC310b43748E5303F1372Ab2C9075629E0Bb4FE54',
  ERC721_COLLATERAL_NFT: '0xc4d732199B7d21207a74CFE6CEd4d17dD330C7Ea',
  ERC1155_HYBRID_ASSET: '0xc9C0Fb76a50eAb570665977703cC8f7185c082b5',
} as const;

// Initialize public client for read operations
export const publicClient = createPublicClient({
  chain: coreTestnet2, 
  transport: http(),
});

// Initialize wallet client for write operations
export const walletClient = createWalletClient({
  chain: coreTestnet2, 
  transport: custom(window.ethereum!),
});

// Contract factories
export function getAssetFactoryContract(publicClientOnly = true) {
  return getContract({
    address: CONTRACT_ADDRESSES.ASSET_FACTORY_PROXY,
    abi: AssetFactoryABI,
    client: publicClientOnly ? publicClient : walletClient,
  });
}

export function getERC20VaultTokenContract(address: string, publicClientOnly = true) {
  return getContract({
    address: address as `0x${string}`,
    abi: ERC20VaultTokenABI,
    client: publicClientOnly ? publicClient : walletClient,
  });
}

export function getERC721CollateralNFTContract(address: string, publicClientOnly = true) {
  return getContract({
    address: address as `0x${string}`,
    abi: ERC721CollateralNFTABI,
    client: publicClientOnly ? publicClient : walletClient,
  });
}

export function getERC1155HybridAssetContract(address: string, publicClientOnly = true) {
  return getContract({
    address: address as `0x${string}`,
    abi: ERC1155HybridAssetABI,
    client: publicClientOnly ? publicClient : walletClient,
  });
}

// Common contract interactions
export async function createERC20VaultToken(
  name: string,
  symbol: string,
  asset: string,
  feeConfig: {
    depositFeeBasisPoints: number;
    withdrawalFeeBasisPoints: number;
    performanceFeeBasisPoints: number;
  },
  owner: string
) {
  const contract = getAssetFactoryContract(false);
  
  return contract.write.createERC20VaultToken([
    name,
    symbol,
    asset as `0x${string}`,
    feeConfig,
    owner as `0x${string}`,
  ]);
}



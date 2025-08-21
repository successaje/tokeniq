import { Address } from 'viem';
import { sepolia, avalancheFuji, baseSepolia } from 'wagmi/chains';
import { SEI_TESTNET_ID } from './chains';

export const CONTRACT_ADDRESSES = {
  // Main Contracts
  vaultManager: '0xF673F508104876c72C8724728f81d50E01649b40' as Address, // Fuji
  vaultFactory: '0xC310b43748E5303F1372Ab2C9075629E0Bb4FE54' as Address, // Fuji
  treasuryAIManager: '0x86C41594e9aDeCcf8c85ba9EEe0138C7c9E70dBc' as Address, // Fuji
  
  // Vaults
  aaveVault: '0xd7b55471Ff384d8a229E948e711CB4C4F952f277' as Address, // New AaveVault deployment on Sepolia
  
  // Token Templates (Sei Testnet)
  tokenTemplates: {
    erc20VaultToken: '0xCaFF129Ec344A98Da8C9a4091a239DF158Cf31A5' as Address,
    wbtc: '0xc9C0Fb76a50eAb570665977703cC8f7185c082b5' as Address,
    erc721CollateralNFT: '0x8e827a12C78dED9459268eb05cce2C5d709FE6AF' as Address,
    erc1155HybridAsset: '0xd6D6fBc6c0ebbB07411acB0EDad6373db389aC13' as Address,
    assetFactory: '0x7b65E735F1b43102f672Dc04B6E33a424a955c13' as Address,
  },
  
  // Cross Chain via chainlink
  crossChainRouter: {
    [sepolia.id]: '0xD1d6EE0c5309A09Df9ca4c2936956A49cca9eb71' as Address,
    [avalancheFuji.id]: '0x6444f16e29Bf33a8C9da2B89E472b58Bafe41b9c' as Address,
    [baseSepolia.id]: '0x7CC324d15E5fF17c43188fB63b462B9a79dA68f6' as Address,
    [SEI_TESTNET_ID]: '0x59F5222c5d77f8D3F56e34Ff7E75A05d2cF3a98A' as Address, 
  },
} as const;

export const SUPPORTED_VAULT_TYPES = ['aave', 'curve', 'yearn', 'generic'] as const;

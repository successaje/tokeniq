import { useContext, useMemo } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { getContract } from 'viem';
import ContractContext from '@/contexts/ContractContext';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import VaultFactoryABI from '@/abis/VaultFactory.json';
import VaultManagerABI from '@/abis/VaultManager.json';
import AaveVaultABI from '@/abis/AaveVault.json';
import CrossChainRouterABI from '@/abis/CrossChainRouter.json';
import TreasuryAIManagerABI from '@/abis/TreasuryAIManager.json';
import { sepolia, avalancheFuji, baseSepolia } from 'wagmi/chains';

// Define supported chain IDs as a type
type SupportedChainId = typeof sepolia.id | typeof avalancheFuji.id | typeof baseSepolia.id;

// Helper to get chain ID safely
const getChainId = (chainId?: number): SupportedChainId => {
  const supportedChainIds = [sepolia.id, avalancheFuji.id, baseSepolia.id] as const;
  return (chainId && supportedChainIds.includes(chainId as any)) 
    ? chainId as SupportedChainId 
    : avalancheFuji.id; // Default to Fuji
};

/**
 * Custom hook to access the contract context
 * @returns The contract context with all available contract methods and state
 */
export const useContracts = () => {
  const context = useContext(ContractContext);
  
  if (context === undefined) {
    throw new Error('useContracts must be used within a ContractProvider');
  }
  
  return context;
};

/**
 * Hook to get contract instances
 * @returns Object containing contract instances for the current chain
 */
export const useContractInstances = () => {
  const { chain } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const chainId = getChainId(chain?.id);

  return useMemo(() => {
    if (!publicClient) {
      return {
        vaultFactory: null,
        vaultManager: null,
        aaveVault: null,
        crossChainRouter: null,
        treasuryAIManager: null,
      };
    }

    // Helper to check if a function exists in the ABI
    const hasFunction = (abi: any[], name: string) => {
      return abi.some(
        (item) => 
          item.type === 'function' && 
          item.name === name &&
          item.stateMutability === 'view'
      );
    };

    const getContractInstance = (address: `0x${string}`, abi: any) => {
      return {
        address,
        abi,
        // @ts-ignore - viem types are not perfectly aligned
        read: new Proxy({}, {
          get: (_, functionName: string) => {
            const functionExists = hasFunction(abi, functionName);
            return async (args: any[] = []) => {
              if (!functionExists) {
                console.warn(`Function "${functionName}" not found in contract ABI at ${address}`);
                return null; // Return null for missing functions
              }
              
              try {
                return await publicClient.readContract({
                  address,
                  abi,
                  functionName,
                  args,
                });
              } catch (error) {
                console.error(`Error calling ${functionName}:`, error);
                return null; // Return null on error to prevent UI crashes
              }
            };
          }
        }),
        // @ts-ignore - viem types are not perfectly aligned
        write: walletClient ? new Proxy({}, {
          get: (_, functionName: string) => {
            const functionExists = abi.some(
              (item) => 
                item.type === 'function' && 
                item.name === functionName &&
                item.stateMutability !== 'view'
            );
            
            return async (args: any[] = []) => {
              if (!functionExists) {
                const error = new Error(`Function "${functionName}" not found in contract ABI at ${address}`);
                console.error(error.message);
                throw error;
              }
              
              try {
                const txHash = await walletClient.writeContract({
                  address,
                  abi,
                  functionName,
                  args,
                });
                return txHash;
              } catch (error) {
                console.error(`Error executing ${functionName}:`, error);
                throw error; // Re-throw for write operations to handle in the UI
              }
            };
          }
        }) : null,
      };
    };

    // Get router address for the current chain
    const routerAddress = 
      chainId in CONTRACT_ADDRESSES.crossChainRouter 
        ? CONTRACT_ADDRESSES.crossChainRouter[chainId as keyof typeof CONTRACT_ADDRESSES.crossChainRouter]
        : null;

    return {
      vaultFactory: getContractInstance(CONTRACT_ADDRESSES.vaultFactory, VaultFactoryABI),
      vaultManager: getContractInstance(CONTRACT_ADDRESSES.vaultManager, VaultManagerABI),
      aaveVault: getContractInstance(CONTRACT_ADDRESSES.aaveVault, AaveVaultABI),
      crossChainRouter: routerAddress 
        ? getContractInstance(routerAddress, CrossChainRouterABI)
        : null,
      treasuryAIManager: getContractInstance(CONTRACT_ADDRESSES.treasuryAIManager, TreasuryAIManagerABI),
    };
  }, [chainId, publicClient, walletClient]);
};

export default useContracts;

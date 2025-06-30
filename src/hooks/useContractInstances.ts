import { useMemo } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { getContract, type Address } from 'viem';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import VaultManagerABI from '@/abis/VaultManager.json';
import VaultFactoryABI from '@/abis/VaultFactory.json';
import TreasuryAIManagerABI from '@/abis/TreasuryAIManager.json';
import AaveVaultABI from '@/abis/AaveVault.json';
import CrossChainRouterABI from '@/abis/CrossChainRouter.json';

type ContractInstance = {
  address: Address;
  abi: any;
  read: Record<string, (...args: any[]) => Promise<any>>;
  write: Record<string, (...args: any[]) => Promise<`0x${string}`>>;
  estimateGas: Record<string, (...args: any[]) => Promise<bigint>>;
  events: Record<string, (...args: any[]) => any>;
};

export function useContractInstances() {
  const { chain } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  return useMemo(() => {
    if (!chain || !publicClient) return null;

    const getContractInstance = (address: Address, abiInput: any): ContractInstance => {
      // Handle case where ABI might be nested in an 'abi' property (common in Hardhat/Foundry artifacts)
      const abi = Array.isArray(abiInput) ? abiInput : (abiInput.abi || []);
      
      const contract = {
        address,
        abi,
        read: {},
        write: {},
        estimateGas: {},
        events: {},
      } as ContractInstance;

      // Add read/write methods based on ABI
      if (Array.isArray(abi)) {
        abi.forEach((item) => {
          if (item.type === 'function') {
            const functionName = item.name;
            if (!functionName) return;

            if (item.stateMutability === 'view' || item.stateMutability === 'pure') {
              contract.read[functionName] = async (...args: any[]) => {
                try {
                  return await publicClient.readContract({
                    address,
                    abi: [item],
                    functionName,
                    args: args.slice(0, item.inputs?.length || 0),
                  });
                } catch (error) {
                  console.error(`Error in ${functionName} read call:`, error);
                  throw error;
                }
              };
            } else {
              contract.write[functionName] = async (...args: any[]) => {
                if (!walletClient) throw new Error('Wallet client not available');
                try {
                  const { request } = await publicClient.simulateContract({
                    address,
                    abi: [item],
                    functionName,
                    args: args.slice(0, item.inputs?.length || 0),
                    account: walletClient.account,
                  });
                  return walletClient.writeContract(request);
                } catch (error) {
                  console.error(`Error in ${functionName} write call:`, error);
                  throw error;
                }
              };
              
              contract.estimateGas[functionName] = async (...args: any[]) => {
                try {
                  const { request } = await publicClient.simulateContract({
                    address,
                    abi: [item],
                    functionName,
                    args: args.slice(0, item.inputs?.length || 0),
                    account: walletClient?.account,
                  });
                  return publicClient.estimateContractGas(request);
                } catch (error) {
                  console.error(`Error estimating gas for ${functionName}:`, error);
                  throw error;
                }
              };
            }
          } else if (item.type === 'event') {
            if (item.name) {
              contract.events[item.name] = (options: any = {}) => {
                return publicClient.watchContractEvent({
                  address,
                  abi: [item],
                  eventName: item.name,
                  ...options,
                });
              };
            }
          }
        });
      }

      return contract;
    };

    try {
      return {
        vaultManager: getContractInstance(CONTRACT_ADDRESSES.vaultManager, VaultManagerABI),
        vaultFactory: getContractInstance(CONTRACT_ADDRESSES.vaultFactory, VaultFactoryABI),
        treasuryAIManager: getContractInstance(CONTRACT_ADDRESSES.treasuryAIManager, TreasuryAIManagerABI),
        aaveVault: getContractInstance(CONTRACT_ADDRESSES.aaveVault, AaveVaultABI),
        crossChainRouter: chain.id in CONTRACT_ADDRESSES.crossChainRouter 
          ? getContractInstance(
              CONTRACT_ADDRESSES.crossChainRouter[chain.id as keyof typeof CONTRACT_ADDRESSES.crossChainRouter] as Address, 
              CrossChainRouterABI
            )
          : null,
      };
    } catch (error) {
      console.error('Failed to initialize contract instances:', error);
      return null;
    }
  }, [chain, publicClient, walletClient]);
}

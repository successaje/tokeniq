import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address, getAddress } from 'viem';
// Import ABIs from JSON files
import AssetFactoryABI from '../../ABI/AssetFactory.json';
import ERC20VaultTokenABI from '../../ABI/ERC20VaultToken.json';
import ERC721CollateralNFTABI from '../../ABI/ERC721CollateralNFT.json';
import ERC1155HybridAssetABI from '../../ABI/ERC1155HybridAsset.json';

// Extract ABI arrays from the imported JSON files
const assetFactoryABI = AssetFactoryABI.abi || AssetFactoryABI;
const erc20VaultTokenABI = ERC20VaultTokenABI.abi || ERC20VaultTokenABI;
const erc721CollateralNFTABI = ERC721CollateralNFTABI.abi || ERC721CollateralNFTABI;
const erc1155HybridAssetABI = ERC1155HybridAssetABI.abi || ERC1155HybridAssetABI;

import { keccak256, encodeAbiParameters } from 'viem';
import { publicClient } from '@/lib/viem';

// Contract addresses
const ASSET_FACTORY_ADDRESS = '0x02406b6d17E743deA7fBbfAE8A15c82e4481E168' as const;

type TokenizationParams = {
  // Common fields
  name: string;
  symbol: string;
  tokenStandard: 'ERC-20' | 'ERC-721' | 'ERC-1155';
  
  // ERC20 specific
  underlyingToken?: string;
  depositFeeBasisPoints?: number;
  withdrawalFeeBasisPoints?: number;
  performanceFeeBasisPoints?: number;
  
  // ERC721 specific
  baseURI?: string;
  
  // ERC1155 specific
  tokenURI?: string;
  initialSupply?: bigint;
};

export const useTokenization = () => {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [tokenAddress, setTokenAddress] = useState<`0x${string}` | null>(null);
  
  // Wait for transaction receipt
  const { data: receipt, isLoading: isConfirming, isError: isErrorConfirming } = useWaitForTransactionReceipt({
    hash: txHash || undefined,
    confirmations: 1,
  });

  // Common function to handle transaction execution and event parsing
  const executeContractWrite = useCallback(async (
    functionName: string, 
    args: any[],
    eventSignature: string
  ) => {
    if (!address) {
      throw new Error('No connected wallet');
    }

    setIsLoading(true);
    setError(null);
    setTxHash(null);
    setTokenAddress(null);

    try {
      // Execute the contract write
      const hash = await writeContractAsync({
        address: ASSET_FACTORY_ADDRESS,
        abi: assetFactoryABI,
        functionName,
        args,
      });

      setTxHash(hash);
      return hash;
    } catch (err) {
      console.error(`Error in ${functionName}:`, err);
      const error = err instanceof Error ? err : new Error('Transaction failed');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [address, writeContractAsync]);

  // Create ERC20 Vault Token
  const createERC20Vault = useCallback(async (params: TokenizationParams) => {
    try {
      const args = [
        params.name,
        params.symbol,
        params.underlyingToken || address,
        params.depositFeeBasisPoints || 0,
        params.withdrawalFeeBasisPoints || 0,
        params.performanceFeeBasisPoints || 0,
        address // owner
      ] as const;

      const hash = await executeContractWrite(
        'createERC20VaultToken',
        args,
        'TokenCreated(address,address,string,string)'
      );

      // Wait for the transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      // Generate the event signature hash
      const eventSignature = 'TokenCreated(address,address,string,string)';
      const eventTopic = keccak256(new TextEncoder().encode(eventSignature));
      
      // Parse logs to find the token address
      const log = receipt.logs.find((log: any) => 
        log.topics[0] === eventTopic
      );
      
      if (!log) {
        throw new Error('TokenCreated event not found in transaction logs');
      }

      // The token address is the second topic (index 1) in the event
      const tokenAddress = '0x' + log.topics[1].slice(-40);
      
      if (!tokenAddress) {
        throw new Error('Could not extract token address from event');
      }

      setTokenAddress(tokenAddress as `0x${string}`);
      
      return {
        tokenAddress: tokenAddress as `0x${string}`,
        transactionHash: hash,
      };
    } catch (error) {
      console.error('Error creating ERC20 vault:', error);
      throw error;
    }
  }, [address, executeContractWrite]);

  // Create ERC721 Collateral NFT
  const createERC721NFT = useCallback(async (params: TokenizationParams) => {
    try {
      const args = [
        params.name,
        params.symbol,
        params.baseURI || '',
        address // owner
      ] as const;

      const hash = await executeContractWrite(
        'createERC721CollateralNFT',
        args,
        'TokenCreated(address,address,string,string)'
      );

      // Wait for the transaction receipt using publicClient
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Generate the event signature hash
      const eventSignature = 'TokenCreated(address,address,string,string)';
      const eventTopic = keccak256(new TextEncoder().encode(eventSignature));
      
      // Parse logs to find the token address
      const log = receipt.logs.find((log: any) => 
        log.topics[0] === eventTopic
      );
      
      if (!log) {
        throw new Error('TokenCreated event not found in transaction logs');
      }

      // The token address is the second topic (index 1) in the event
      const tokenAddress = '0x' + log.topics[1].slice(-40);
      
      if (!tokenAddress) {
        throw new Error('Could not extract token address from event');
      }

      setTokenAddress(tokenAddress as `0x${string}`);
      
      return {
        tokenAddress: tokenAddress as `0x${string}`,
        transactionHash: hash,
      };
    } catch (error) {
      console.error('Error creating ERC721 NFT:', error);
      throw error;
    }
  }, [address, executeContractWrite]);

  // Create ERC1155 Hybrid Asset
  const createERC1155Hybrid = useCallback(async (params: TokenizationParams) => {
    try {
      // The contract only needs the baseURI parameter as a string
      const baseURI = params.tokenURI || '';
      
      // Log the arguments being passed for debugging
      console.log('createERC1155Hybrid - baseURI:', baseURI);
      
      // Directly use writeContractAsync with the correct ABI and parameters
      const hash = await writeContractAsync({
        address: ASSET_FACTORY_ADDRESS,
        abi: assetFactoryABI,
        functionName: 'createERC1155HybridAsset',
        args: [baseURI],
      });
      
      setTxHash(hash);
      
      // Wait for the transaction receipt using publicClient
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      // Generate the event signature hash
      const eventSignature = 'TokenCreated(address,address,string,string)';
      const eventTopic = keccak256(new TextEncoder().encode(eventSignature));
      
      // Parse logs to find the token address
      const log = receipt.logs.find((log: any) => 
        log.topics[0] === eventTopic
      );
      
      if (!log) {
        throw new Error('Token creation event not found in transaction logs');
      }
      
      // The token address is the first indexed parameter in the event
      const tokenAddress = getAddress(`0x${log.topics[1].slice(-40)}`);
      setTokenAddress(tokenAddress);
      
      return {
        tokenAddress,
        transactionHash: hash,
      };
    } catch (error) {
      console.error('Error creating ERC1155 Hybrid Asset:', error);
      throw error;
    }
  }, [address, executeContractWrite]);

  // Main tokenize function that routes to the appropriate creation function
  const tokenizeAsset = useCallback(async (params: TokenizationParams & { assetType?: string }) => {
    if (!address) throw new Error('No connected wallet');
    setIsLoading(true);
    setError(null);
    setTxHash(null);
    setTokenAddress(null);

    try {
      // Handle both tokenStandard and assetType for backward compatibility
      let tokenStandard = params.tokenStandard || params.assetType;
      
      if (!tokenStandard) {
        throw new Error('No token standard specified');
      }
      
      // Normalize the token standard format
      tokenStandard = tokenStandard.toUpperCase();
      if (tokenStandard.startsWith('ERC')) {
        // Remove any existing hyphens and add them back consistently
        tokenStandard = tokenStandard.replace(/-/g, '');
        if (tokenStandard === 'ERC20') tokenStandard = 'ERC-20';
        else if (tokenStandard === 'ERC721') tokenStandard = 'ERC-721';
        else if (tokenStandard === 'ERC1155') tokenStandard = 'ERC-1155';
      } else {
        // Handle case where just the number was provided (e.g., '20', '721', '1155')
        tokenStandard = `ERC-${tokenStandard}`;
      }
      
      // Type assertion after normalization
      const normalizedTokenStandard = tokenStandard as 'ERC-20' | 'ERC-721' | 'ERC-1155';
      
      let result;
      
      switch (normalizedTokenStandard) {
        case 'ERC-20':
          result = await createERC20Vault(params);
          break;
        case 'ERC-721':
          result = await createERC721NFT(params);
          break;
        case 'ERC-1155':
          result = await createERC1155Hybrid(params);
          break;
        default:
          throw new Error(`Unsupported token standard: ${tokenStandard}`);
      }

      return result;
    } catch (error) {
      console.error('Tokenization error:', error);
      const err = error instanceof Error ? error : new Error('Tokenization failed');
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address, createERC20Vault, createERC721NFT, createERC1155Hybrid]);

  return useMemo(() => ({
    tokenizeAsset,
    isLoading: isLoading || isConfirming,
    isError: isErrorConfirming,
    error,
    txHash,
    receipt,
    tokenAddress,
  }), [
    tokenizeAsset,
    isLoading,
    isConfirming,
    isErrorConfirming,
    error,
    txHash,
    receipt,
    tokenAddress,
  ]);
}

import { useState, useCallback, useEffect, useMemo } from 'react';
import { parseEther, formatEther, Address, formatUnits } from 'viem';
import { useAccount } from 'wagmi';
import { useContracts } from '@/contexts/ContractContext';

interface TokenInfo {
  underlyingToken: Address;
  aToken: Address;
  aavePool: Address;
  isPaused: boolean;
  owner: Address;
  requiresOwner: boolean;
}

interface VaultStats {
  totalDeposits: bigint;
  totalWithdrawals: bigint;
  currentAllocation: bigint;
  isPaused: boolean;
}

interface UserPosition {
  aTokenBalance: bigint;
  underlyingBalance: bigint;
  currentAllocation: bigint;
  healthFactor: number;
}

interface UseAaveVaultProps {
  onSuccess?: (result?: { newTotalValue?: bigint; [key: string]: any }) => void;
  onError?: (error: Error) => void;
}

interface AaveVaultOperationResult<T = any> {
  success: boolean;
  data?: T;
  newTotalValue?: bigint;
  error?: Error;
}

export function useAaveVault({ onSuccess, onError }: UseAaveVaultProps = {}) {
  const { 
    aaveDeposit, 
    aaveWithdraw, 
    aaveRebalance, 
    getAaveTotalValue,
    contracts,
    isLoading: isContractsLoading
  } = useContracts();
  const { address: userAddress } = useAccount();

  const [amount, setAmount] = useState<string>('');
  const [totalValue, setTotalValue] = useState<bigint>(0n);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Validate token address format
  const isValidAddress = useCallback((address: string): address is Address => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }, []);

  // Fetch total value locked in the Aave vault
  const fetchTotalValue = useCallback(async (): Promise<bigint | undefined> => {
    if (!contracts?.aaveVault?.read) return undefined;
    try {
      const value = await getAaveTotalValue();
      if (value !== null) {
        setTotalValue(value);
      }
      return value || 0n;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch Aave vault TVL');
      setError(error);
      onError?.(error);
      return undefined;
    }
  }, [getAaveTotalValue, onError]);

  // Handle deposit to Aave vault
  const deposit = useCallback(async (amount: string, tokenAddress: string, decimals: number = 18): Promise<AaveVaultOperationResult> => {
    try {
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        throw new Error('Please enter a valid amount to deposit');
      }

      if (!tokenAddress) {
        throw new Error('Token address is required for deposit');
      }

      if (!isValidAddress(tokenAddress)) {
        throw new Error('Invalid token address format');
      }

      setIsProcessing(true);
      setError(null);
      
      const amountWei = BigInt(Math.floor(Number(amount) * (10 ** decimals)));
      
      // Check minimum deposit (1 USDC for 6 decimal tokens)
      if (decimals === 6 && amountWei < BigInt(1e6)) {
        throw new Error('Minimum deposit is 1 USDC');
      }

      const success = await aaveDeposit(amountWei, tokenAddress);
      
      if (!success) {
        throw new Error('Deposit transaction failed');
      }
      
      const newTotalValue = await fetchTotalValue();
      const result = { success: true, newTotalValue };
      onSuccess?.(result);
      return result;
    } catch (err) {
      console.error('Error in deposit function:', {
        error: err,
        amount,
        tokenAddress,
        errorMessage: err instanceof Error ? err.message : 'Unknown error'
      });
      const error = err instanceof Error ? err : new Error('Failed to deposit to Aave vault');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [aaveDeposit, fetchTotalValue, onSuccess, onError]);

  // Handle withdrawal from Aave vault
  const withdraw = useCallback(async (amount: string): Promise<AaveVaultOperationResult> => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      throw new Error('Please enter a valid amount to withdraw');
    }

    try {
      setIsProcessing(true);
      setError(null);
      const amountWei = parseEther(amount);
      const success = await aaveWithdraw(amountWei);
      
      if (!success) {
        throw new Error('Withdrawal transaction failed');
      }
      
      const newTotalValue = await fetchTotalValue();
      const result = { success: true, newTotalValue };
      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to withdraw from Aave vault');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [aaveWithdraw, fetchTotalValue, onSuccess, onError]);

  // Handle rebalancing the Aave vault
  const rebalance = useCallback(async (): Promise<AaveVaultOperationResult> => {
    try {
      setIsProcessing(true);
      setError(null);
      const success = await aaveRebalance();
      
      if (!success) {
        throw new Error('Rebalance operation failed');
      }
      
      const newTotalValue = await fetchTotalValue();
      const result = { success: true, newTotalValue };
      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to rebalance Aave vault');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [aaveRebalance, fetchTotalValue, onSuccess, onError]);

  // Format total value for display
  const formattedTotalValue = useMemo(() => {
    if (!totalValue) return '0.00';
    try {
      return formatEther(totalValue);
    } catch (e) {
      console.error('Error formatting total value:', e);
      return '0.00';
    }
  }, [totalValue]);

  // Initial data fetch
  useEffect(() => {
    fetchTotalValue().catch((error) => {
      console.error('Failed to fetch initial total value:', error);
      setError(error instanceof Error ? error : new Error('Failed to fetch initial data'));
    });
  }, [fetchTotalValue]);

  // Get vault token information
  const getTokenInfo = useCallback(async (): Promise<AaveVaultOperationResult<TokenInfo>> => {
    try {
      if (!contracts?.aaveVault?.read) {
        throw new Error('AaveVault contract not initialized');
      }

      // Check which functions are available
      const hasPausedFn = 'paused' in contracts.aaveVault.read;
      const hasRequiresOwnerFn = 'requiresOwner' in contracts.aaveVault.read;

      // Only request functions that exist
      const [
        underlyingToken,
        aToken,
        aavePool,
        owner,
        pausedResult,
        requiresOwnerResult
      ] = await Promise.all([
        contracts.aaveVault.read.UNDERLYING_TOKEN(),
        contracts.aaveVault.read.ATOKEN(),
        contracts.aaveVault.read.POOL(),
        contracts.aaveVault.read.owner(),
        hasPausedFn ? contracts.aaveVault.read.paused() : Promise.resolve(false),
        hasRequiresOwnerFn ? contracts.aaveVault.read.requiresOwner() : Promise.resolve(false)
      ]);

      const result: TokenInfo = {
        underlyingToken,
        aToken,
        aavePool,
        isPaused: Boolean(pausedResult),
        owner,
        requiresOwner: Boolean(requiresOwnerResult)
      };

      onSuccess?.({ data: result });
      return { success: true, data: result };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch token info');
      setError(error);
      onError?.(error);
      return { success: false, error };
    }
  }, [contracts?.aaveVault, onSuccess, onError]);

  // Get vault statistics
  const getVaultStats = useCallback(async (): Promise<AaveVaultOperationResult<VaultStats>> => {
    try {
      if (!contracts?.aaveVault?.read) {
        throw new Error('AaveVault contract not initialized');
      }

      const [
        totalDeposits,
        totalWithdrawals,
        currentAllocation,
        isPaused
      ] = await Promise.all([
        contracts.aaveVault.read.getTotalDeposits(),
        contracts.aaveVault.read.getTotalWithdrawals(),
        contracts.aaveVault.read.getCurrentAllocation(),
        contracts.aaveVault.read.paused()
      ]);

      const result = {
        totalDeposits,
        totalWithdrawals,
        currentAllocation,
        isPaused
      };

      onSuccess?.({ data: result });
      return { success: true, data: result };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch vault stats');
      setError(error);
      onError?.(error);
      return { success: false, error };
    }
  }, [contracts?.aaveVault, onSuccess, onError]);

  // Get user position
  const getUserPosition = useCallback(async (): Promise<AaveVaultOperationResult<UserPosition>> => {
    try {
      if (!contracts?.aaveVault?.read || !userAddress) {
        throw new Error('AaveVault contract or user address not available');
      }

      // Get the aToken address first
      const aToken = await contracts.aaveVault.read.ATOKEN();
      
      // Create ERC20 contract instance for the aToken
      const publicClient = contracts.aaveVault.client as any;
      const aTokenContract = {
        address: aToken,
        abi: [
          {
            inputs: [{ name: 'account', type: 'address' }],
            name: 'balanceOf',
            outputs: [{ name: '', type: 'uint256' }],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'decimals',
            outputs: [{ name: '', type: 'uint8' }],
            stateMutability: 'view',
            type: 'function',
          },
        ],
      };

      // Get aToken balance
      const [aTokenBalance, decimals] = await Promise.all([
        publicClient.readContract({
          ...aTokenContract,
          functionName: 'balanceOf',
          args: [userAddress],
        }),
        publicClient.readContract({
          ...aTokenContract,
          functionName: 'decimals',
        }),
      ]);

      // Get underlying token balance (1:1 with aToken)
      const underlyingBalance = aTokenBalance;

      // Get current allocation (simplified - in a real app, this would come from the Aave protocol)
      const currentAllocation = await contracts.aaveVault.read.getCurrentAllocation();

      // Calculate health factor (simplified)
      const healthFactor = 1.5; // This would come from Aave protocol in a real app

      const result = {
        aTokenBalance,
        underlyingBalance,
        currentAllocation,
        healthFactor,
        formatted: {
          aTokenBalance: formatUnits(aTokenBalance, decimals || 18),
          underlyingBalance: formatUnits(underlyingBalance, decimals || 18),
          currentAllocation: formatEther(currentAllocation),
        }
      };

      onSuccess?.({ data: result });
      return { success: true, data: result };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch user position');
      setError(error);
      onError?.(error);
      return { success: false, error };
    }
  }, [contracts?.aaveVault, userAddress, onSuccess, onError]);

  // Check if contract is paused
  const checkIfPaused = useCallback(async (): Promise<AaveVaultOperationResult<boolean>> => {
    try {
      if (!contracts?.aaveVault?.read) {
        throw new Error('AaveVault contract not initialized');
      }
      const isPaused = await contracts.aaveVault.read.paused();
      return { success: true, data: isPaused };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to check if contract is paused');
      setError(error);
      onError?.(error);
      return { success: false, error };
    }
  }, [contracts?.aaveVault, onError]);

  // Get contract owner
  const getContractOwner = useCallback(async (): Promise<AaveVaultOperationResult<string>> => {
    try {
      if (!contracts?.aaveVault?.read) {
        throw new Error('AaveVault contract not initialized');
      }
      const owner = await contracts.aaveVault.read.owner();
      return { success: true, data: owner };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get contract owner');
      setError(error);
      onError?.(error);
      return { success: false, error };
    }
  }, [contracts?.aaveVault, onError]);

  return {
    // State
    amount,
    totalValue,
    formattedTotalValue,
    isProcessing,
    isLoading: isContractsLoading,
    error,
    
    // Actions
    setAmount,
    deposit,
    withdraw,
    rebalance,
    fetchTotalValue,
    
    // New functions
    getTokenInfo,
    getVaultStats,
    getUserPosition,
    checkIfPaused,
    getContractOwner,
  };
}

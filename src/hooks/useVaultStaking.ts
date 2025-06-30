import { useState, useEffect, useCallback } from 'react';
import { Address, parseEther, formatEther } from 'viem';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { getContract } from 'viem';
import VaultStakingABI from '@/abis/VaultStaking.json';

// Types for staking data
export interface StakingPosition {
  stakedAmount: bigint;
  rewardDebt: bigint;
  pendingRewards: bigint;
  lastUpdate: number;
  unlockTime: number;
}

type UseVaultStakingProps = {
  vaultAddress: Address;
  refreshInterval?: number;
};

export function useVaultStaking({
  vaultAddress,
  refreshInterval = 30000, // 30 seconds
}: UseVaultStakingProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [stakingInfo, setStakingInfo] = useState<{
    totalStaked: bigint;
    rewardRate: bigint;
    periodFinish: number;
    rewardsDuration: number;
    rewardPerTokenStored: bigint;
    lastUpdateTime: number;
  }>({
    totalStaked: BigInt(0),
    rewardRate: BigInt(0),
    periodFinish: 0,
    rewardsDuration: 604800, // 1 week in seconds
    rewardPerTokenStored: BigInt(0),
    lastUpdateTime: 0,
  });
  
  const [userPosition, setUserPosition] = useState<StakingPosition>({
    stakedAmount: BigInt(0),
    rewardDebt: BigInt(0),
    pendingRewards: BigInt(0),
    lastUpdate: 0,
    unlockTime: 0,
  });
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Get staking contract instance
  const getStakingContract = useCallback(() => {
    if (!publicClient || !walletClient) return null;
    
    const stakingAddress = CONTRACT_ADDRESSES.vaultStaking?.[vaultAddress.toLowerCase() as Address];
    if (!stakingAddress) return null;
    
    return getContract({
      address: stakingAddress,
      abi: VaultStakingABI,
      publicClient,
      walletClient,
    });
  }, [vaultAddress, publicClient, walletClient]);
  
  // Fetch staking info
  const fetchStakingInfo = useCallback(async () => {
    const stakingContract = getStakingContract();
    if (!stakingContract) return;
    
    try {
      setLoading(true);
      
      const [
        totalStaked,
        rewardRate,
        periodFinish,
        rewardsDuration,
        rewardPerTokenStored,
        lastUpdateTime,
      ] = await Promise.all([
        stakingContract.read.totalSupply().catch(() => BigInt(0)),
        stakingContract.read.rewardRate().catch(() => BigInt(0)),
        stakingContract.read.periodFinish().catch(() => 0),
        stakingContract.read.rewardsDuration().catch(() => 604800), // 1 week
        stakingContract.read.rewardPerTokenStored().catch(() => BigInt(0)),
        stakingContract.read.lastUpdateTime().catch(() => 0),
      ]);
      
      setStakingInfo({
        totalStaked: totalStaked as bigint,
        rewardRate: rewardRate as bigint,
        periodFinish: Number(periodFinish) * 1000, // Convert to milliseconds
        rewardsDuration: Number(rewardsDuration),
        rewardPerTokenStored: rewardPerTokenStored as bigint,
        lastUpdateTime: Number(lastUpdateTime) * 1000, // Convert to milliseconds
      });
      
    } catch (err) {
      console.error('Failed to fetch staking info:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch staking info'));
    } finally {
      setLoading(false);
    }
  }, [getStakingContract]);
  
  // Fetch user position
  const fetchUserPosition = useCallback(async () => {
    const stakingContract = getStakingContract();
    if (!stakingContract || !address) return;
    
    try {
      setLoading(true);
      
      const [
        stakedAmount,
        rewardDebt,
        pendingRewards,
        lastUpdate,
        unlockTime,
      ] = await Promise.all([
        stakingContract.read.balanceOf([address]).catch(() => BigInt(0)),
        stakingContract.read.rewardDebt([address]).catch(() => BigInt(0)),
        stakingContract.read.earned([address]).catch(() => BigInt(0)),
        stakingContract.read.userLastUpdate([address]).catch(() => 0),
        stakingContract.read.lockEnd([address]).catch(() => 0),
      ]);
      
      setUserPosition({
        stakedAmount: stakedAmount as bigint,
        rewardDebt: rewardDebt as bigint,
        pendingRewards: pendingRewards as bigint,
        lastUpdate: Number(lastUpdate) * 1000, // Convert to milliseconds
        unlockTime: Number(unlockTime) * 1000, // Convert to milliseconds
      });
      
    } catch (err) {
      console.error('Failed to fetch user position:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch user position'));
    } finally {
      setLoading(false);
    }
  }, [getStakingContract, address]);
  
  // Stake tokens
  const stake = useCallback(async (amount: bigint, lockDuration: number = 0) => {
    const stakingContract = getStakingContract();
    if (!stakingContract || !walletClient) {
      throw new Error('Wallet not connected');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // If lockDuration is 0, use the regular stake function
      // Otherwise, use the stakeWithLock function
      let txHash;
      if (lockDuration > 0) {
        txHash = await stakingContract.write.stakeWithLock([amount, lockDuration]);
      } else {
        txHash = await stakingContract.write.stake([amount]);
      }
      
      // Wait for transaction to be mined
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      // Refresh data
      await Promise.all([fetchStakingInfo(), fetchUserPosition()]);
      
      return txHash;
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Staking failed');
      console.error('Staking error:', error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getStakingContract, walletClient, publicClient, fetchStakingInfo, fetchUserPosition]);
  
  // Withdraw staked tokens
  const withdraw = useCallback(async (amount: bigint) => {
    const stakingContract = getStakingContract();
    if (!stakingContract || !walletClient) {
      throw new Error('Wallet not connected');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const txHash = await stakingContract.write.withdraw([amount]);
      
      // Wait for transaction to be mined
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      // Refresh data
      await Promise.all([fetchStakingInfo(), fetchUserPosition()]);
      
      return txHash;
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Withdrawal failed');
      console.error('Withdrawal error:', error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getStakingContract, walletClient, publicClient, fetchStakingInfo, fetchUserPosition]);
  
  // Claim rewards
  const claimRewards = useCallback(async () => {
    const stakingContract = getStakingContract();
    if (!stakingContract || !walletClient) {
      throw new Error('Wallet not connected');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const txHash = await stakingContract.write.getReward();
      
      // Wait for transaction to be mined
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      // Refresh data
      await Promise.all([fetchStakingInfo(), fetchUserPosition()]);
      
      return txHash;
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Claim failed');
      console.error('Claim error:', error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getStakingContract, walletClient, publicClient, fetchStakingInfo, fetchUserPosition]);
  
  // Exit (withdraw all and claim rewards)
  const exit = useCallback(async () => {
    const stakingContract = getStakingContract();
    if (!stakingContract || !walletClient) {
      throw new Error('Wallet not connected');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const txHash = await stakingContract.write.exit();
      
      // Wait for transaction to be mined
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      // Refresh data
      await Promise.all([fetchStakingInfo(), fetchUserPosition()]);
      
      return txHash;
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Exit failed');
      console.error('Exit error:', error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getStakingContract, walletClient, publicClient, fetchStakingInfo, fetchUserPosition]);
  
  // Set up polling for data refresh
  useEffect(() => {
    // Initial fetch
    fetchStakingInfo();
    fetchUserPosition();
    
    // Set up interval for polling
    const intervalId = setInterval(() => {
      fetchStakingInfo();
      fetchUserPosition();
    }, refreshInterval);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchStakingInfo, fetchUserPosition, refreshInterval]);
  
  // Calculate APY
  const calculateApy = useCallback(() => {
    if (stakingInfo.totalStaked <= 0n || stakingInfo.rewardRate <= 0n) {
      return 0;
    }
    
    // APY = (rewardRate * secondsPerYear * rewardPrice) / (totalStaked * stakedTokenPrice)
    // For simplicity, we'll assume rewardPrice = stakedTokenPrice = 1
    const secondsPerYear = 365 * 24 * 60 * 60;
    const apy = (Number(stakingInfo.rewardRate) * secondsPerYear * 100) / Number(stakingInfo.totalStaked);
    
    return isFinite(apy) ? apy : 0;
  }, [stakingInfo]);
  
  // Check if staking is active
  const isStakingActive = useCallback(() => {
    return stakingInfo.periodFinish > Date.now();
  }, [stakingInfo.periodFinish]);
  
  // Check if user has a position
  const hasPosition = useCallback(() => {
    return userPosition.stakedAmount > 0n;
  }, [userPosition.stakedAmount]);
  
  // Check if user has pending rewards
  const hasPendingRewards = useCallback(() => {
    return userPosition.pendingRewards > 0n;
  }, [userPosition.pendingRewards]);
  
  // Check if user's position is locked
  const isLocked = useCallback(() => {
    return userPosition.unlockTime > Date.now();
  }, [userPosition.unlockTime]);
  
  // Get time until unlock
  const timeUntilUnlock = useCallback(() => {
    if (!isLocked()) return 0;
    return Math.max(0, userPosition.unlockTime - Date.now());
  }, [isLocked, userPosition.unlockTime]);
  
  return {
    // State
    stakingInfo,
    userPosition,
    loading,
    error,
    
    // Derived values
    apy: calculateApy(),
    isStakingActive: isStakingActive(),
    hasPosition: hasPosition(),
    hasPendingRewards: hasPendingRewards(),
    isLocked: isLocked(),
    timeUntilUnlock: timeUntilUnlock(),
    
    // Actions
    stake,
    withdraw,
    claimRewards,
    exit,
    refresh: () => {
      fetchStakingInfo();
      fetchUserPosition();
    },
  };
}

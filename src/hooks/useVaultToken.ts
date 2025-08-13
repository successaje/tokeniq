import { useState, useCallback, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { ERC20VaultTokenABI } from '../ABI/ERC20VaultToken';
import { parseUnits, formatUnits } from 'viem';

export function useVaultToken(vaultAddress: `0x${string}`) {
  const { address } = useAccount();
  const [userBalance, setUserBalance] = useState('0');
  const [totalAssets, setTotalAssets] = useState('0');
  const [isApproving, setIsApproving] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Get user's token balance
  const { refetch: refetchBalance } = useContractRead({
    address: vaultAddress,
    abi: ERC20VaultTokenABI,
    functionName: 'balanceOf',
    args: [address],
    watch: true,
    onSuccess: (data) => {
      setUserBalance(formatUnits(data, 8));
    },
  });

  // Get total assets in vault
  const { refetch: refetchTotalAssets } = useContractRead({
    address: vaultAddress,
    abi: ERC20VaultTokenABI,
    functionName: 'totalAssets',
    watch: true,
    onSuccess: (data) => {
      setTotalAssets(formatUnits(data, 8));
    },
  });

  // Prepare deposit transaction
  const { config: depositConfig } = usePrepareContractWrite({
    address: vaultAddress,
    abi: ERC20VaultTokenABI,
    functionName: 'deposit',
    args: [parseUnits('1', 8), address],
    enabled: false, // We'll enable it when needed
  });

  const { writeAsync: deposit } = useContractWrite(depositConfig);

  // Prepare withdraw transaction
  const { config: withdrawConfig } = usePrepareContractWrite({
    address: vaultAddress,
    abi: ERC20VaultTokenABI,
    functionName: 'withdraw',
    args: [parseUnits('1', 8), address, address],
    enabled: false,
  });

  const { writeAsync: withdraw } = useContractWrite(withdrawConfig);

  // Deposit function
  const handleDeposit = useCallback(async (amount: string) => {
    if (!deposit) return;
    
    try {
      setIsDepositing(true);
      const tx = await deposit({
        args: [parseUnits(amount, 8), address],
      });
      await tx.wait();
      await Promise.all([refetchBalance(), refetchTotalAssets()]);
    } catch (error) {
      console.error('Deposit failed:', error);
      throw error;
    } finally {
      setIsDepositing(false);
    }
  }, [deposit, address, refetchBalance, refetchTotalAssets]);

  // Withdraw function
  const handleWithdraw = useCallback(async (amount: string) => {
    if (!withdraw) return;
    
    try {
      setIsWithdrawing(true);
      const tx = await withdraw({
        args: [parseUnits(amount, 8), address, address],
      });
      await tx.wait();
      await Promise.all([refetchBalance(), refetchTotalAssets()]);
    } catch (error) {
      console.error('Withdrawal failed:', error);
      throw error;
    } finally {
      setIsWithdrawing(false);
    }
  }, [withdraw, address, refetchBalance, refetchTotalAssets]);

  return {
    userBalance,
    totalAssets,
    isApproving,
    isDepositing,
    isWithdrawing,
    deposit: handleDeposit,
    withdraw: handleWithdraw,
    refetch: () => {
      refetchBalance();
      refetchTotalAssets();
    },
  };
}

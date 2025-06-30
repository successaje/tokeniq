import { useState, useCallback } from 'react';
import { Address } from 'viem';
import { useAccount, useWalletClient } from 'wagmi';
import { checkAllowance, approveToken, getTokenBalance, getTokenDecimals } from '@/utils/tokens';
import { CONTRACT_ADDRESSES } from '@/config/contracts';

type TokenApprovalState = {
  isApproving: boolean;
  isApproved: boolean;
  allowance: bigint;
  balance: bigint;
  decimals: number;
  error: Error | null;
};

type UseTokenApprovalProps = {
  tokenAddress: Address | undefined;
  spender?: Address; // Defaults to vault manager
  requiredAmount?: bigint; // Amount needed to be approved
};

export function useTokenApproval({
  tokenAddress,
  spender = CONTRACT_ADDRESSES.vaultManager,
  requiredAmount = BigInt(0),
}: UseTokenApprovalProps) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [state, setState] = useState<TokenApprovalState>({
    isApproving: false,
    isApproved: false,
    allowance: BigInt(0),
    balance: BigInt(0),
    decimals: 18,
    error: null,
  });

  // Check if the token is approved for the required amount
  const checkApproval = useCallback(async () => {
    if (!tokenAddress || !address || !spender) return;
    
    try {
      const [allowance, balance, decimals] = await Promise.all([
        checkAllowance(tokenAddress, address, spender),
        getTokenBalance(tokenAddress, address),
        getTokenDecimals(tokenAddress),
      ]);
      
      setState(prev => ({
        ...prev,
        allowance,
        balance,
        decimals,
        isApproved: allowance >= requiredAmount,
        error: null,
      }));
      
      return {
        allowance,
        balance,
        decimals,
        isApproved: allowance >= requiredAmount,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to check token approval');
      setState(prev => ({
        ...prev,
        error: err,
      }));
      throw err;
    }
  }, [tokenAddress, address, spender, requiredAmount]);

  // Approve the token for spending
  const approve = useCallback(async () => {
    if (!tokenAddress || !address || !spender || !walletClient) {
      throw new Error('Missing required parameters for token approval');
    }
    
    try {
      setState(prev => ({ ...prev, isApproving: true, error: null }));
      
      // For ERC20 tokens, we approve the maximum uint256 value
      const maxUint256 = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935');
      
      const txHash = await approveToken(
        tokenAddress,
        spender,
        maxUint256,
        walletClient
      );
      
      if (!txHash) {
        throw new Error('Transaction failed: No transaction hash returned');
      }
      
      // Wait for the transaction to be mined
      const receipt = await walletClient.waitForTransactionReceipt({ hash: txHash });
      
      if (receipt.status !== 'success') {
        throw new Error('Transaction reverted');
      }
      
      // Refresh the approval state
      await checkApproval();
      
      return txHash;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to approve token');
      setState(prev => ({
        ...prev,
        error: err,
        isApproving: false,
      }));
      throw err;
    } finally {
      setState(prev => ({
        ...prev,
        isApproving: false,
      }));
    }
  }, [tokenAddress, address, spender, walletClient, checkApproval]);

  return {
    ...state,
    checkApproval,
    approve,
    needsApproval: !state.isApproved && requiredAmount > 0,
  };
}

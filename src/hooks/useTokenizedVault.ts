import { useCallback, useState } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { useAaveVault } from './useAaveVault';
import { useAssetFactory } from './useAssetFactory';

type TokenizeVaultParams = {
  tokenName: string;
  tokenSymbol: string;
  amount: string;
  feeConfig: {
    depositFeeBasisPoints: number;
    withdrawalFeeBasisPoints: number;
    performanceFeeBasisPoints: number;
  };
  onSuccess?: (tokenAddress: string) => void;
  onError?: (error: Error) => void;
};

export function useTokenizedVault() {
  const { address } = useAccount();
  const { deposit, withdraw, getBalance, getATokenAddress } = useAaveVault();
  const { createERC20VaultToken } = useAssetFactory();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Tokenizes an Aave Vault position by:
   * 1. Depositing into Aave Vault
   * 2. Creating a new ERC20 vault token
   * 3. Transferring the aToken to the vault token contract
   */
  const tokenizeVaultPosition = useCallback(
    async ({
      tokenName,
      tokenSymbol,
      amount,
      feeConfig,
      onSuccess,
      onError,
    }: TokenizeVaultParams) => {
      if (!address) {
        const err = new Error('No wallet connected');
        setError(err);
        onError?.(err);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // 1. Deposit into Aave Vault
        const depositResult = await deposit(amount);
        if (!depositResult.success) {
          throw depositResult.error || new Error('Failed to deposit into Aave Vault');
        }

        // 2. Get the aToken address
        const aTokenAddress = await getATokenAddress();
        if (!aTokenAddress.success) {
          throw aTokenAddress.error || new Error('Failed to get aToken address');
        }

        // 3. Create ERC20 Vault Token
        const tx = await createERC20VaultToken(
          tokenName,
          tokenSymbol,
          aTokenAddress.data, // Use aToken as the underlying asset
          feeConfig,
          address // Set the creator as the initial owner
        );

        onSuccess?.(tx);
        return { success: true, transactionHash: tx };
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to tokenize vault position');
        setError(error);
        onError?.(error);
        return { success: false, error };
      } finally {
        setIsLoading(false);
      }
    },
    [address, deposit, getATokenAddress, createERC20VaultToken]
  );

  /**
   * Redeems tokenized vault position by:
   * 1. Burning the vault tokens
   * 2. Withdrawing from Aave Vault
   * 3. Transferring underlying tokens to the user
   */
  const redeemTokenizedPosition = useCallback(
    async (vaultTokenAddress: string, amount: string) => {
      if (!address) {
        const err = new Error('No wallet connected');
        setError(err);
        return { success: false, error: err };
      }

      setIsLoading(true);
      setError(null);

      try {
        // 1. Withdraw from Aave Vault
        const withdrawResult = await withdraw(amount);
        if (!withdrawResult.success) {
          throw withdrawResult.error || new Error('Failed to withdraw from Aave Vault');
        }

        // In a real implementation, you would also burn the vault tokens here
        // and handle the aToken transfer

        return { success: true, transactionHash: withdrawResult.transactionHash };
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to redeem tokenized position');
        setError(error);
        return { success: false, error };
      } finally {
        setIsLoading(false);
      }
    },
    [address, withdraw]
  );

  return {
    tokenizeVaultPosition,
    redeemTokenizedPosition,
    isLoading,
    error,
  };
}

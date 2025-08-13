import { useState, useCallback } from 'react';
import { useAccount, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { AssetFactoryABI } from '../ABI/AssetFactory';

const ASSET_FACTORY_ADDRESS = '0x02406b6d17E743deA7fBbfAE8A15c82e4481E168';

export function useAssetCreation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Create ERC20 Vault
  const createERC20Vault = useCallback(async (
    name: string,
    symbol: string,
    underlyingToken: string,
    depositFee: number,
    withdrawalFee: number,
    performanceFee: number
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { config } = usePrepareContractWrite({
        address: ASSET_FACTORY_ADDRESS,
        abi: AssetFactoryABI,
        functionName: 'createERC20VaultToken',
        args: [name, symbol, underlyingToken, depositFee, withdrawalFee, performanceFee],
      });

      const { writeAsync } = useContractWrite(config);
      
      if (writeAsync) {
        const tx = await writeAsync();
        setTxHash(tx.hash);
        return tx;
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createERC20Vault,
    isLoading,
    error,
    txHash,
  };
}

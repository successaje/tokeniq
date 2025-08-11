import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESSES, getAssetFactoryContract } from '@/utils/contracts';
import { Address } from 'viem';

export function useAssetFactory() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // Read functions
  const { data: owner } = useReadContract({
    ...getAssetFactoryContract(),
    functionName: 'owner',
  });

  const { data: erc20VaultTokenImpl } = useReadContract({
    ...getAssetFactoryContract(),
    functionName: 'erc20VaultTokenImpl',
  });

  const { data: erc721CollateralNFTImpl } = useReadContract({
    ...getAssetFactoryContract(),
    functionName: 'erc721CollateralNFTImpl',
  });

  const { data: erc1155HybridAssetImpl } = useReadContract({
    ...getAssetFactoryContract(),
    functionName: 'erc1155HybridAssetImpl',
  });

  // Write functions
  const createERC20VaultToken = async (
    name: string,
    symbol: string,
    asset: string,
    feeConfig: {
      depositFeeBasisPoints: number;
      withdrawalFeeBasisPoints: number;
      performanceFeeBasisPoints: number;
    },
    ownerAddress: string = address!
  ) => {
    if (!ownerAddress) throw new Error('No owner address provided');
    
    return writeContractAsync({
      ...getAssetFactoryContract(false),
      functionName: 'createERC20VaultToken',
      args: [
        name,
        symbol,
        asset as Address,
        {
          depositFeeBasisPoints: BigInt(feeConfig.depositFeeBasisPoints),
          withdrawalFeeBasisPoints: BigInt(feeConfig.withdrawalFeeBasisPoints),
          performanceFeeBasisPoints: BigInt(feeConfig.performanceFeeBasisPoints),
        },
        ownerAddress as Address,
      ],
    });
  };

  

  return {
    // Constants
    address: CONTRACT_ADDRESSES.ASSET_FACTORY_PROXY,
    
    // Read state
    owner,
    erc20VaultTokenImpl,
    erc721CollateralNFTImpl,
    erc1155HybridAssetImpl,
    
    // Write functions
    createERC20VaultToken,
  };
}

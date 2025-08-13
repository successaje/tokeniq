import { useState, useCallback } from 'react';
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { ERC721CollateralNFTABI } from '../ABI/ERC721CollateralNFT';

export function useERC721NFT(contractAddress: `0x${string}`) {
  const { address } = useAccount();
  const [isMinting, setIsMinting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [userNFTs, setUserNFTs] = useState<any[]>([]);

  // Get user's NFTs
  const { refetch: refetchNFTs } = useContractRead({
    address: contractAddress,
    abi: ERC721CollateralNFTABI,
    functionName: 'balanceOf',
    args: [address],
    watch: true,
    onSuccess: async (balance) => {
      const nfts = [];
      for (let i = 0; i < Number(balance); i++) {
        const tokenId = await readContract({
          address: contractAddress,
          abi: ERC721CollateralNFTABI,
          functionName: 'tokenOfOwnerByIndex',
          args: [address, i],
        });
        
        const tokenURI = await readContract({
          address: contractAddress,
          abi: ERC721CollateralNFTABI,
          functionName: 'tokenURI',
          args: [tokenId],
        });
        
        nfts.push({ tokenId, tokenURI });
      }
      setUserNFTs(nfts);
    },
  });

  // Prepare mint transaction
  const { config: mintConfig } = usePrepareContractWrite({
    address: contractAddress,
    abi: ERC721CollateralNFTABI,
    functionName: 'mint',
    args: [address, ''], // tokenURI will be set when minting
    enabled: false,
  });

  const { writeAsync: mint } = useContractWrite(mintConfig);

  // Mint new NFT
  const mintNFT = useCallback(async (tokenURI: string) => {
    if (!mint) return;
    
    try {
      setIsMinting(true);
      const tx = await mint({
        args: [address, tokenURI],
      });
      await tx.wait();
      await refetchNFTs();
    } catch (error) {
      console.error('Minting failed:', error);
      throw error;
    } finally {
      setIsMinting(false);
    }
  }, [mint, address, refetchNFTs]);

  return {
    userNFTs,
    isMinting,
    isApproving,
    mintNFT,
    refetch: refetchNFTs,
  };
}

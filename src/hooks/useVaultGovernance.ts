import { useState, useEffect, useCallback, useMemo } from 'react';
import { Address, parseEther, formatEther } from 'viem';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { getContract } from 'viem';
import VaultGovernorABI from '@/abis/VaultGovernor.json';
import VaultTokenABI from '@/abis/VaultToken.json';

// Types for governance data
export interface Proposal {
  id: string;
  proposer: Address;
  targets: Address[];
  values: bigint[];
  signatures: string[];
  calldatas: `0x${string}`[];
  startBlock: number;
  endBlock: number;
  description: string;
  state: 'pending' | 'active' | 'canceled' | 'defeated' | 'succeeded' | 'queued' | 'expired' | 'executed';
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  eta: number;
  executed: boolean;
  canceled: boolean;
}

export interface Vote {
  support: 0 | 1 | 2; // 0=against, 1=for, 2=abstain
  weight: bigint;
  reason: string;
  voter: Address;
  blockNumber: number;
  transactionHash: `0x${string}`;
}

type UseVaultGovernanceProps = {
  vaultAddress: Address;
  refreshInterval?: number;
};

export function useVaultGovernance({
  vaultAddress,
  refreshInterval = 30000, // 30 seconds
}: UseVaultGovernanceProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [votingPower, setVotingPower] = useState<bigint>(BigInt(0));
  const [delegatedVotes, setDelegatedVotes] = useState<bigint>(BigInt(0));
  
  // Get governance contract instance
  const getGovernorContract = useCallback(() => {
    if (!publicClient || !walletClient) return null;
    
    const governorAddress = CONTRACT_ADDRESSES.vaultGovernor?.[vaultAddress.toLowerCase() as Address];
    if (!governorAddress) return null;
    
    return getContract({
      address: governorAddress,
      abi: VaultGovernorABI,
      publicClient,
      walletClient,
    });
  }, [vaultAddress, publicClient, walletClient]);
  
  // Get token contract instance
  const getTokenContract = useCallback(() => {
    if (!publicClient || !walletClient) return null;
    
    // In this implementation, we assume the vault token itself is the governance token
    // Adjust if your implementation uses a separate token for governance
    return getContract({
      address: vaultAddress,
      abi: VaultTokenABI,
      publicClient,
      walletClient,
    });
  }, [vaultAddress, publicClient, walletClient]);
  
  // Fetch proposals
  const fetchProposals = useCallback(async () => {
    const governorContract = getGovernorContract();
    if (!governorContract) return;
    
    try {
      setLoading(true);
      
      // Get proposal count
      const proposalCount = await governorContract.read.proposalCount();
      
      // Fetch all proposals
      const proposalPromises = [];
      for (let i = 1; i <= Number(proposalCount); i++) {
        proposalPromises.push(governorContract.read.proposals([i]));
      }
      
      const proposalResults = await Promise.all(proposalPromises);
      
      // Map to Proposal objects
      const formattedProposals = proposalResults.map((proposal: any, index) => ({
        id: (index + 1).toString(),
        proposer: proposal.proposer,
        targets: proposal.targets,
        values: proposal.values,
        signatures: proposal.signatures,
        calldatas: proposal.calldatas,
        startBlock: Number(proposal.startBlock),
        endBlock: Number(proposal.endBlock),
        description: proposal.description || `Proposal ${index + 1}`,
        state: await governorContract.read.state([index + 1]),
        forVotes: proposal.forVotes,
        againstVotes: proposal.againstVotes,
        abstainVotes: proposal.abstainVotes,
        eta: Number(proposal.eta) * 1000, // Convert to milliseconds
        executed: proposal.executed,
        canceled: proposal.canceled,
      }));
      
      setProposals(formattedProposals);
      
    } catch (err) {
      console.error('Failed to fetch proposals:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch proposals'));
    } finally {
      setLoading(false);
    }
  }, [getGovernorContract]);
  
  // Fetch user's voting power
  const fetchVotingPower = useCallback(async () => {
    const tokenContract = getTokenContract();
    const governorContract = getGovernorContract();
    if (!tokenContract || !governorContract || !address) return;
    
    try {
      setLoading(true);
      
      // Get current block number
      const blockNumber = await publicClient.getBlockNumber();
      
      // Get voting power at the current block
      const [votes, delegated] = await Promise.all([
        tokenContract.read.getVotes([address, blockNumber]).catch(() => BigInt(0)),
        tokenContract.read.delegates([address]).then(async (delegate: Address) => {
          if (delegate === zeroAddress) return BigInt(0);
          return tokenContract.read.getVotes([delegate, blockNumber]).catch(() => BigInt(0));
        }).catch(() => BigInt(0)),
      ]);
      
      setVotingPower(votes as bigint);
      setDelegatedVotes(delegated as bigint);
      
    } catch (err) {
      console.error('Failed to fetch voting power:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch voting power'));
    } finally {
      setLoading(false);
    }
  }, [getTokenContract, getGovernorContract, address, publicClient]);
  
  // Create a new proposal
  const createProposal = useCallback(async (
    targets: Address[],
    values: bigint[],
    signatures: string[],
    calldatas: `0x${string}`[],
    description: string
  ): Promise<`0x${string}`> => {
    const governorContract = getGovernorContract();
    if (!governorContract || !walletClient) {
      throw new Error('Wallet not connected');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Propose the transaction
      const txHash = await governorContract.write.propose(
        [targets, values, signatures, calldatas, description]
      );
      
      // Wait for the transaction to be mined
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      // Refresh proposals
      await fetchProposals();
      
      return txHash;
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create proposal');
      console.error('Proposal creation error:', error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getGovernorContract, walletClient, publicClient, fetchProposals]);
  
  // Vote on a proposal
  const castVote = useCallback(async (
    proposalId: string,
    support: 0 | 1 | 2, // 0=against, 1=for, 2=abstain
    reason: string = ''
  ): Promise<`0x${string}`> => {
    const governorContract = getGovernorContract();
    if (!governorContract || !walletClient) {
      throw new Error('Wallet not connected');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Cast the vote
      const txHash = await governorContract.write.castVoteWithReason(
        [BigInt(proposalId), support, reason]
      );
      
      // Wait for the transaction to be mined
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      // Refresh proposals to update vote counts
      await fetchProposals();
      
      return txHash;
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to cast vote');
      console.error('Vote casting error:', error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getGovernorContract, walletClient, publicClient, fetchProposals]);
  
  // Queue a successful proposal
  const queueProposal = useCallback(async (proposalId: string): Promise<`0x${string}`> => {
    const governorContract = getGovernorContract();
    if (!governorContract || !walletClient) {
      throw new Error('Wallet not connected');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Queue the proposal
      const txHash = await governorContract.write.queue([BigInt(proposalId)]);
      
      // Wait for the transaction to be mined
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      // Refresh proposals
      await fetchProposals();
      
      return txHash;
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to queue proposal');
      console.error('Queue proposal error:', error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getGovernorContract, walletClient, publicClient, fetchProposals]);
  
  // Execute a queued proposal
  const executeProposal = useCallback(async (proposalId: string): Promise<`0x${string}`> => {
    const governorContract = getGovernorContract();
    if (!governorContract || !walletClient) {
      throw new Error('Wallet not connected');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Execute the proposal
      const txHash = await governorContract.write.execute([BigInt(proposalId)]);
      
      // Wait for the transaction to be mined
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      // Refresh proposals
      await fetchProposals();
      
      return txHash;
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to execute proposal');
      console.error('Proposal execution error:', error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getGovernorContract, walletClient, publicClient, fetchProposals]);
  
  // Cancel a proposal
  const cancelProposal = useCallback(async (proposalId: string): Promise<`0x${string}`> => {
    const governorContract = getGovernorContract();
    if (!governorContract || !walletClient) {
      throw new Error('Wallet not connected');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Cancel the proposal
      const txHash = await governorContract.write.cancel([BigInt(proposalId)]);
      
      // Wait for the transaction to be mined
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      // Refresh proposals
      await fetchProposals();
      
      return txHash;
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to cancel proposal');
      console.error('Proposal cancellation error:', error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getGovernorContract, walletClient, publicClient, fetchProposals]);
  
  // Delegate voting power
  const delegateVotes = useCallback(async (delegatee: Address): Promise<`0x${string}`> => {
    const tokenContract = getTokenContract();
    if (!tokenContract || !walletClient) {
      throw new Error('Wallet not connected');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Delegate votes
      const txHash = await tokenContract.write.delegate([delegatee]);
      
      // Wait for the transaction to be mined
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      // Refresh voting power
      await fetchVotingPower();
      
      return txHash;
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delegate votes');
      console.error('Vote delegation error:', error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getTokenContract, walletClient, publicClient, fetchVotingPower]);
  
  // Set up polling for data refresh
  useEffect(() => {
    // Initial fetch
    fetchProposals();
    fetchVotingPower();
    
    // Set up interval for polling
    const intervalId = setInterval(() => {
      fetchProposals();
      fetchVotingPower();
    }, refreshInterval);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchProposals, fetchVotingPower, refreshInterval]);
  
  // Get proposal by ID
  const getProposal = useCallback((proposalId: string) => {
    return proposals.find(p => p.id === proposalId);
  }, [proposals]);
  
  // Get user's vote for a proposal
  const getUserVote = useCallback(async (proposalId: string) => {
    const governorContract = getGovernorContract();
    if (!governorContract || !address) return null;
    
    try {
      const vote = await governorContract.read.getReceipt([BigInt(proposalId), address]);
      return {
        hasVoted: vote.hasVoted,
        support: vote.support,
        votes: vote.votes,
      };
    } catch (err) {
      console.error('Failed to fetch user vote:', err);
      return null;
    }
  }, [getGovernorContract, address]);
  
  // Get proposal state
  const getProposalState = useCallback(async (proposalId: string) => {
    const governorContract = getGovernorContract();
    if (!governorContract) return null;
    
    try {
      return await governorContract.read.state([BigInt(proposalId)]);
    } catch (err) {
      console.error('Failed to fetch proposal state:', err);
      return null;
    }
  }, [getGovernorContract]);
  
  // Get proposal votes
  const getProposalVotes = useCallback(async (proposalId: string) => {
    const governorContract = getGovernorContract();
    if (!governorContract) return [];
    
    try {
      // In a real implementation, you would fetch vote events for the proposal
      // This is a simplified version
      const proposal = getProposal(proposalId);
      if (!proposal) return [];
      
      return [{
        support: 1, // For
        weight: proposal.forVotes,
        reason: '',
        voter: proposal.proposer,
        blockNumber: proposal.startBlock,
        transactionHash: '0x', // Not available in this simplified version
      }, {
        support: 0, // Against
        weight: proposal.againstVotes,
        reason: '',
        voter: proposal.proposer,
        blockNumber: proposal.startBlock,
        transactionHash: '0x', // Not available in this simplified version
      }];
    } catch (err) {
      console.error('Failed to fetch proposal votes:', err);
      return [];
    }
  }, [getGovernorContract, getProposal]);
  
  return {
    // State
    proposals,
    votingPower,
    delegatedVotes,
    loading,
    error,
    
    // Getters
    getProposal,
    getUserVote,
    getProposalState,
    getProposalVotes,
    
    // Actions
    createProposal,
    castVote,
    queueProposal,
    executeProposal,
    cancelProposal,
    delegateVotes,
    
    // Refresh
    refresh: () => {
      fetchProposals();
      fetchVotingPower();
    },
  };
}

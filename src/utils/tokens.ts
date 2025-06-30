import { Address, getContract } from 'viem';
import { publicClient } from '@/config/wagmi';
import ERC20_ABI from '@/abis/ERC20.json';

// Standard ERC20 ABI for basic token operations
const ERC20 = (address: Address) => ({
  address,
  abi: ERC20_ABI,
});

/**
 * Checks if a spender is approved to spend tokens on behalf of the owner
 * @param tokenAddress The ERC20 token address
 * @param owner The owner's address
 * @param spender The spender's address (usually the vault manager)
 * @returns The current allowance amount as a bigint
 */
export const checkAllowance = async (
  tokenAddress: Address,
  owner: Address,
  spender: Address
): Promise<bigint> => {
  try {
    const data = await publicClient.readContract({
      ...ERC20(tokenAddress),
      functionName: 'allowance',
      args: [owner, spender],
    });
    return typeof data === 'bigint' ? data : BigInt(data.toString());
  } catch (error) {
    console.error('Error checking allowance:', error);
    return BigInt(0);
  }
};

/**
 * Approves a spender to spend tokens on behalf of the owner
 * @param tokenAddress The ERC20 token address
 * @param spender The spender's address (usually the vault manager)
 * @param amount The amount to approve (in token decimals)
 * @param signer The signer (wallet client) to send the transaction
 * @returns The transaction hash if successful, null otherwise
 */
export const approveToken = async (
  tokenAddress: Address,
  spender: Address,
  amount: bigint,
  signer: any // TODO: Replace with proper type from viem
): Promise<`0x${string}` | null> => {
  try {
    const { request } = await publicClient.simulateContract({
      ...ERC20(tokenAddress),
      functionName: 'approve',
      args: [spender, amount],
      account: signer.account,
    });
    
    const txHash = await signer.writeContract(request);
    return txHash || null;
  } catch (error) {
    console.error('Error approving token:', error);
    return null;
  }
};

/**
 * Gets the token balance of an address
 * @param tokenAddress The ERC20 token address
 * @param address The address to check balance for
 * @returns The token balance as a bigint
 */
export const getTokenBalance = async (
  tokenAddress: Address,
  address: Address
): Promise<bigint> => {
  try {
    const data = await publicClient.readContract({
      ...ERC20(tokenAddress),
      functionName: 'balanceOf',
      args: [address],
    });
    return typeof data === 'bigint' ? data : BigInt(data.toString());
  } catch (error) {
    console.error('Error getting token balance:', error);
    return BigInt(0);
  }
};

/**
 * Gets token decimals
 * @param tokenAddress The ERC20 token address
 * @returns The number of decimals for the token (default: 18)
 */
export const getTokenDecimals = async (tokenAddress: Address): Promise<number> => {
  try {
    const data = await publicClient.readContract({
      ...ERC20(tokenAddress),
      functionName: 'decimals',
    });
    return typeof data === 'number' ? data : 18; // Default to 18 decimals if not available
  } catch (error) {
    console.error('Error getting token decimals:', error);
    return 18; // Default to 18 decimals on error
  }
};

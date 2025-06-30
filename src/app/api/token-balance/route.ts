import { NextResponse } from 'next/server';
import { createPublicClient, http, formatEther } from 'viem';
import { mainnet, avalanche } from 'viem/chains';
import { erc20ABI } from 'viem/contracts/abis';

const chains = {
  1: mainnet,
  43114: avalanche
} as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('wallet');
  const tokenAddress = searchParams.get('token');

  if (!walletAddress || !tokenAddress) {
    return NextResponse.json(
      { error: 'Missing wallet or token address' },
      { status: 400 }
    );
  }

  try {
    // For native token
    if (tokenAddress === '0x0000000000000000000000000000000000000000') {
      const client = createPublicClient({
        chain: mainnet,
        transport: http()
      });
      
      const balance = await client.getBalance({
        address: walletAddress as `0x${string}`
      });
      
      return NextResponse.json({
        symbol: 'ETH',
        balance: parseFloat(formatEther(balance)).toFixed(4)
      });
    }

    // For ERC20 tokens
    const client = createPublicClient({
      chain: mainnet, // Default to mainnet, you might want to make this dynamic
      transport: http()
    });

    // Get token symbol and decimals
    const [symbol, decimals, balance] = await Promise.all([
      client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20ABI,
        functionName: 'symbol'
      }),
      client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20ABI,
        functionName: 'decimals'
      }),
      client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20ABI,
        functionName: 'balanceOf',
        args: [walletAddress as `0x${string}`]
      })
    ]);

    const formattedBalance = (Number(balance) / (10 ** Number(decimals))).toFixed(4);

    return NextResponse.json({
      symbol,
      balance: formattedBalance
    });

  } catch (error) {
    console.error('Error fetching token balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token balance' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { mainnet, sepolia, avalancheFuji } from 'viem/chains';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const chainId = searchParams.get('chainId');
  const token = searchParams.get('token');

  if (!address || !chainId) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  try {
    const chain = [mainnet, sepolia, avalancheFuji].find(c => c.id === Number(chainId));
    if (!chain) {
      throw new Error('Unsupported chain');
    }

    const client = createPublicClient({
      chain,
      transport: http()
    });

    let balance;
    
    if (token === '0x0000000000000000000000000000000000000000') {
      // Native token balance
      balance = await client.getBalance({
        address: address as `0x${string}`
      });
    } else if (token) {
      // ERC20 token balance
      balance = await client.readContract({
        address: token as `0x${string}`,
        abi: [
          {
            constant: true,
            inputs: [{ name: '_owner', type: 'address' }],
            name: 'balanceOf',
            outputs: [{ name: 'balance', type: 'uint256' }],
            type: 'function',
          },
        ],
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      });
    } else {
      throw new Error('Invalid token address');
    }

    return NextResponse.json({ 
      success: true, 
      balance: balance.toString() 
    });

  } catch (error) {
    console.error('Error fetching balance:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch balance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

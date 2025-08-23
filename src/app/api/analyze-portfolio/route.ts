import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { address, balances } = await request.json();
    
    // Get DeepSeek API key from environment variables
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!deepseekApiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    // Prepare the prompt for DeepSeek
    const prompt = `Analyze this crypto portfolio and provide investment insights:
    
Wallet: ${address}

Portfolio:
- ${balances.eth.toFixed(4)} ETH (${(balances.eth * 3000).toFixed(2)} USD)
- ${balances.wbtc.toFixed(4)} WBTC (${(balances.wbtc * 50000).toFixed(2)} USD)
- ${balances.usdc.toFixed(2)} USDC

Please provide:
1. Current allocation analysis
2. Risk assessment
3. Suggested allocation strategy
4. Potential yield opportunities
5. Risk management recommendations

Format the response in clear, concise markdown.`;

    // Call DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a professional crypto portfolio analyst. Provide clear, actionable insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('DeepSeek API error:', error);
      throw new Error('Failed to analyze portfolio with DeepSeek');
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || 'No analysis available';

    return NextResponse.json({ 
      success: true, 
      analysis 
    });

  } catch (error) {
    console.error('Portfolio analysis error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to analyze portfolio' 
      },
      { status: 500 }
    );
  }
}

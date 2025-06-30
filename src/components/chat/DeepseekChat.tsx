'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { formatUnits } from 'viem';
import { ELIZA_SYSTEM_PROMPT } from '@/lib/prompts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Common tokens to check
const COMMON_TOKENS = {
  1: [ // Ethereum Mainnet
    '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
  ],
  43114: [ // Avalanche
    '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // USDC
    '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', // USDT
    '0x63a72806098Bd3D9520cC43356dD78afE5d386d9', // AAVE
  ]
};

export function DeepseekChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: nativeBalance } = useBalance({
    address,
    chainId,
  });
  
  // Function to fetch token balances
  const fetchTokenBalances = useCallback(async () => {
    if (!address || !chainId) return [];
    
    setIsCheckingBalance(true);
    const tokens = COMMON_TOKENS[chainId as keyof typeof COMMON_TOKENS] || [];
    const balances = [];
    
    try {
      // Add native token balance
      if (nativeBalance) {
        const chainInfo = chainId === 1 ? { nativeCurrency: { symbol: 'ETH' } } : 
                         chainId === 43114 ? { nativeCurrency: { symbol: 'AVAX' } } : 
                         { nativeCurrency: { symbol: 'ETH' } };
                          
        balances.push({
          symbol: chainInfo.nativeCurrency.symbol,
          balance: parseFloat(formatUnits(nativeBalance.value, nativeBalance.decimals)).toFixed(4)
        });
      }
      
      // Add ERC20 token balances
      for (const token of tokens) {
        const balance = await fetchTokenBalance(address, token);
        if (balance) {
          balances.push(balance);
        }
      }
      
      return balances;
    } catch (error) {
      console.error('Error fetching balances:', error);
      return [];
    } finally {
      setIsCheckingBalance(false);
    }
  }, [address, chainId, nativeBalance]);
  
  // Helper function to fetch token balance
  const fetchTokenBalance = async (walletAddress: string, tokenAddress: string) => {
    try {
      const response = await fetch(`/api/token-balance?wallet=${walletAddress}&token=${tokenAddress}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching token ${tokenAddress}:`, error);
      return null;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle balance check command
  const handleBalanceCheck = async () => {
    if (!isConnected) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Please connect your wallet to check balances.' 
      }]);
      return;
    }
    
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: 'Checking your wallet balances...' 
    }]);
    
    const balances = await fetchTokenBalances();
    
    if (balances && balances.length > 0) {
      const balanceText = balances.map(b => 
        `${b.symbol}: ${b.balance}`
      ).join('\n');
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Here are your current balances:\n${balanceText}`
      }]);
    } else {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Could not fetch balances. Please try again.' 
      }]);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = input.trim();
    if (!message || isLoading) return;
    
    // Check for balance command
    if (message.toLowerCase().includes('balance') || message.toLowerCase().includes('my balance')) {
      await handleBalanceCheck();
      return;
    }

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Format messages for the API
      const chatMessages = [
        // System prompt as the first message
        { role: 'system', content: ELIZA_SYSTEM_PROMPT },
        // Only include the last 5 messages to keep context manageable
        ...messages.slice(-5).map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        })),
        // Current user input
        { role: 'user', content: input }
      ].filter(Boolean);

      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-r1:1.5b',
          messages: chatMessages,
          stream: false,
          options: {
            temperature: 0.9,  // Increased for more varied responses
            top_p: 0.95,      // Increased for more diverse responses
            repeat_penalty: 1.1,  // Penalize repetition
            num_ctx: 4096,    // Larger context window
            stop: ['<|im_end|>', '<|im_start|>', '<|endoftext|']
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Ollama');
      }

      const data = await response.json();
      // Clean up the response by removing thinking patterns
      let cleanContent = data.message.content;
      // Remove content between <think> tags and the tags themselves
      cleanContent = cleanContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      // Remove any remaining HTML tags
      cleanContent = cleanContent.replace(/<[^>]*>?/gm, '');
      
      setMessages(prev => [...prev, { role: 'assistant', content: cleanContent }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error. Please try again.' 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] max-w-2xl mx-auto border rounded-lg overflow-hidden bg-background">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Deepseek Chat</h2>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Send a message to start chatting with Deepseek
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}

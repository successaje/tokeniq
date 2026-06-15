'use client';

import { createContext, useContext, ReactNode, useState } from 'react';
import { ElizaOS } from '@/components/eliza/ElizaOS';

interface Message {
  type: 'user' | 'agent';
  content: string;
  metadata?: {
    insight?: {
      Decision: string;
      Reasoning: string;
      Risk: string;
      Yield: string;
    };
  };
}

interface ElizaContextType {
  showInsight: (message: string, type?: 'info' | 'warning' | 'opportunity') => void;
  messages: Message[];
  isLoading: boolean;
  sendMessage: (text: string) => Promise<void>;
}

const ElizaContext = createContext<ElizaContextType | undefined>(undefined);

export function ElizaProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'agent',
      content: "Hello! I am ElizaOS, your autonomous Web3 CFO. I am monitoring stablecoin yields on Arbitrum and transaction pools for gas optimization. Ask me to run an analysis or reallocate treasury capital.",
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const showInsight = (message: string, type: 'info' | 'warning' | 'opportunity' = 'info') => {
    console.log(`[ElizaOS] ${type}: ${message}`);
  };

  const sendMessage = async (text: string) => {
    // Add user message
    const userMsg: Message = { type: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Simulate AI thinking and responding
    setTimeout(() => {
      let responseContent = "I have analyzed your request. Based on current pool parameters and gas rates on Arbitrum, I recommend maintaining the current allocation.";
      let insight: any = null;

      const lowerText = text.toLowerCase();
      if (lowerText.includes('yield') || lowerText.includes('arbitrum') || lowerText.includes('analyze')) {
        responseContent = "I detected an active yield opportunity. Reallocating $500,000 idle USDC to the Aave V3 lending pool on Arbitrum yields an additional 2.1% APY over the baseline. Shall we proceed?";
        insight = {
          Decision: "Allocate $500k USDC to Aave V3 (Arbitrum)",
          Reasoning: "Aave V3 deposit rate on Arbitrum has surged to 8.45% due to high borrow demand, outperforming Base and Ethereum mainnet stablecoin pools by over 2.1%. Gas costs are negligible (<$0.50).",
          Risk: "Low (Aave V3)",
          Yield: "8.45% APY"
        };
      } else if (lowerText.includes('risk')) {
        responseContent = "Your global portfolio risk score is currently Low (0.12). Our Delta-neutral strategies are performing stably, and there are no critical smart contract alerts active.";
        insight = {
          Decision: "Maintain Delta-Neutral Allocations",
          Reasoning: "Volatility metrics indicate stable trading ranges. No immediate de-risking actions required. Current exposure is diversified across Arbitrum and Base vaults.",
          Risk: "Low",
          Yield: "N/A"
        };
      } else if (lowerText.includes('rebalance') || lowerText.includes('eth')) {
        responseContent = "I suggest rebalancing 50 ETH from Lido to the Arbitrum liquidity pools to capture the elevated swap fees and LP rewards. This increases yield by 4.2% with minimal impermanent loss risk.";
        insight = {
          Decision: "Rebalance 50 ETH to Arbitrum LP",
          Reasoning: "Lido APY is holding at 3.1%, while Arbitrum Uniswap v3 ETH-USDC pools are generating 7.3% fee APY due to high trading volume. Moving capital captures this delta.",
          Risk: "Medium",
          Yield: "7.3% APY"
        };
      }

      const agentMsg: Message = {
        type: 'agent',
        content: responseContent,
        metadata: insight ? { insight } : undefined
      };

      setMessages(prev => [...prev, agentMsg]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <ElizaContext.Provider value={{ showInsight, messages, isLoading, sendMessage }}>
      {children}
      <ElizaOS />
    </ElizaContext.Provider>
  );
}

export function useEliza() {
  const context = useContext(ElizaContext);
  if (context === undefined) {
    throw new Error('useEliza must be used within an ElizaProvider');
  }
  return context;
}

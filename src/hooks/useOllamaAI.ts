/**
 * Hook for integrating Ollama AI into TokenIQ
 * Provides AI-powered insights, recommendations, and analysis
 */

import { useState, useCallback } from 'react';

interface OllamaConfig {
  apiUrl?: string;
  model?: string;
  timeout?: number;
}

const DEFAULT_CONFIG: Required<OllamaConfig> = {
  apiUrl: 'http://localhost:11434/api/chat',
  model: 'deepseek-r1:1.5b',
  timeout: 30000,
};

export function useOllamaAI(config: OllamaConfig = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const generateInsight = useCallback(async (
    context: string,
    prompt: string
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(finalConfig.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: finalConfig.model,
          messages: [
            {
              role: 'system',
              content: `You are an AI assistant for TokenIQ, a DeFi platform on Sei Network.
              Provide concise, actionable insights about DeFi strategies, portfolio management, and market analysis.
              Focus on Sei Network advantages: low fees, high throughput, parallel execution.
              Be specific with numbers and recommendations.`,
            },
            {
              role: 'user',
              content: `Context: ${context}\n\nQuestion: ${prompt}`,
            },
          ],
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            num_ctx: 4096,
          },
        }),
        signal: AbortSignal.timeout(finalConfig.timeout),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      return data.message?.content || 'No response generated';
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate insight';
      setError(errorMessage);
      
      // Return fallback for demo purposes
      return `AI analysis temporarily unavailable. Based on the data: ${prompt}`;
    } finally {
      setIsLoading(false);
    }
  }, [finalConfig]);

  const analyzeSpending = useCallback(async (spendingData: {
    monthlyIncome: number;
    monthlySpending: number;
    savings: number;
  }): Promise<string> => {
    const context = `User spending analysis:
    - Monthly Income: $${spendingData.monthlyIncome.toLocaleString()}
    - Monthly Spending: $${spendingData.monthlySpending.toLocaleString()} (${((spendingData.monthlySpending / spendingData.monthlyIncome) * 100).toFixed(1)}%)
    - Savings: $${spendingData.savings.toLocaleString()} (${((spendingData.savings / spendingData.monthlyIncome) * 100).toFixed(1)}%)
    `;

    return generateInsight(
      context,
      'Analyze this spending pattern and provide specific recommendations for optimizing capital allocation on Sei Network. Include percentage targets and specific actions.'
    );
  }, [generateInsight]);

  const generateRecommendation = useCallback(async (
    portfolioData: {
      idleCapital: number;
      currentAPY: number;
      riskTolerance: 'low' | 'medium' | 'high';
    }
  ): Promise<string> => {
    const context = `Portfolio analysis:
    - Idle Capital: $${portfolioData.idleCapital.toLocaleString()}
    - Current APY: ${portfolioData.currentAPY}%
    - Risk Tolerance: ${portfolioData.riskTolerance}
    `;

    return generateInsight(
      context,
      'Generate a specific, actionable recommendation for optimizing this portfolio on Sei Network. Include exact percentages, specific strategies, and expected outcomes.'
    );
  }, [generateInsight]);

  const explainStrategy = useCallback(async (
    strategyName: string,
    strategyDetails: {
      allocation: number;
      apy: number;
      risk: string;
    }
  ): Promise<string> => {
    const context = `Strategy: ${strategyName}
    - Allocation: ${strategyDetails.allocation}%
    - APY: ${strategyDetails.apy}%
    - Risk Level: ${strategyDetails.risk}
    `;

    return generateInsight(
      context,
      `Explain why this ${strategyName} strategy is recommended. Include specific benefits, how Sei Network enables this strategy, and what to expect.`
    );
  }, [generateInsight]);

  return {
    generateInsight,
    analyzeSpending,
    generateRecommendation,
    explainStrategy,
    isLoading,
    error,
  };
}


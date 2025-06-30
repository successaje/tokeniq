import { ChatMessage } from '@/types/chat';

// Helper function to remove content between <think> tags
const cleanResponse = (text: string): string => {
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
};

interface DeepseekMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatResponse {
  message: {
    role: string;
    content: string;
  };
  // Add other fields from the API response as needed
}

// Configuration
const CHAT_CONFIG = {
  apiUrl: 'http://localhost:11434/api/chat',
  model: 'deepseek-r1:1.5b',
  maxRetries: 2,
  timeout: 30000, // 30 seconds
} as const;

export const chatService = {
  async sendMessage(messages: ChatMessage[]): Promise<string> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= CHAT_CONFIG.maxRetries; attempt++) {
      try {
        // Format messages for Deepseek API
        const formattedMessages: DeepseekMessage[] = [
          // System prompt as the first message
          { 
            role: 'system', 
            content: `You are ElizaOS, an AI assistant for TokenIQ, a blockchain treasury management platform. 
            Your role is to help users with DeFi strategies, cross-chain operations, and portfolio management.
            Be concise, technical, and accurate.` 
          },
          // Only include the last 5 messages to keep context manageable
          ...messages.slice(-5).map(m => ({
            role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
            content: m.content
          }))
        ];
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CHAT_CONFIG.timeout);
        
        const response = await fetch(CHAT_CONFIG.apiUrl, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: CHAT_CONFIG.model,
            messages: formattedMessages,
            stream: false,
            options: {
              temperature: 0.7,
              top_p: 0.9,
              repeat_penalty: 1.1,
              num_ctx: 4096,
              stop: ['</s>'],
            },
          }),
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `API request failed with status ${response.status}: ${errorData.message || response.statusText}`
          );
        }

        const data: ChatResponse = await response.json();
        const rawContent = data.message?.content || 'No response content';
        return cleanResponse(rawContent);
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Attempt ${attempt + 1} failed:`, error);
        
        // Don't retry on user aborts or validation errors
        if (lastError.name === 'AbortError' || lastError.message.includes('status 4')) {
          break;
        }
        
        // Add delay between retries
        if (attempt < CHAT_CONFIG.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
    
    // If we get here, all retries failed
    if (lastError?.message.includes('Failed to fetch') || lastError?.message.includes('ECONNREFUSED')) {
      throw new Error('Could not connect to the chat service. Please make sure the Deepseek server is running.');
    }
    
    throw lastError || new Error('Failed to send message. Please try again later.');
  }
};

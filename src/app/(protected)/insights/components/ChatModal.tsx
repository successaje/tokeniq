'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

import { Brain, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { chatService } from '@/services/chat';
import { ChatMessage } from '@/types/chat';



export function ChatModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi there! I'm ElizaOS, your AI treasury management assistant. How can I help you today?",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Only send the new user message to the chat service
      const response = await chatService.sendMessage([userMessage]);
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again later.',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }

    // Auto-scroll is now handled by the useEffect
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl mx-auto bg-background rounded-xl shadow-2xl border border-border">
            <div className="flex items-center gap-2 mb-4 p-4 border-b border-border">
              <Brain className="h-5 w-5 text-emerald-500" />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-foreground">ElizaOS</span>
                <span className="text-sm text-muted-foreground">Your AI Treasury Assistant</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col h-[70vh] min-w-0 max-h-[80vh]">
              <div 
                className="flex-1 min-w-0 overflow-y-auto"
                style={{ scrollBehavior: 'smooth' }}
              >
                <div className="space-y-4 p-4 w-full min-w-0">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex gap-3 p-3 rounded-lg w-full min-w-0",
                        message.role === 'user' ? "bg-muted" : "bg-emerald-50/20"
                      )}
                    >
                      <div className="flex-shrink-0 flex items-start">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                          message.role === 'user' ? "bg-primary" : "bg-emerald-500"
                        )}>
                          <span className="text-sm font-medium text-white">
                            {message.role === 'user' ? 'U' : 'A'}
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground break-words whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                  {isLoading && (
                    <div className="flex gap-2 p-3 rounded-lg bg-emerald-50/20">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center bg-emerald-500">
                          <span className="text-sm font-medium text-white">A</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">
                          <span className="animate-pulse">...</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="border-t border-border p-4 flex-shrink-0 bg-background relative z-10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-input rounded-md p-2 border border-border focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !input.trim()}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Bot, Info, AlertTriangle, ArrowRight, MessageSquare, Send, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';

type InsightType = 'info' | 'warning' | 'opportunity' | 'alert';
type ViewMode = 'insights' | 'chat';

interface Insight {
  id: string;
  type: InsightType;
  message: string;
  timestamp: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: number;
  senderId?: string;
}

interface ElizaConfig {
  agentId: string;
  worldId: string;
  serverUrl: string;
  appUrl: string;
}

// Enhanced ElizaOS API integration following the working starter pattern
class ElizaAPI {
  private config: ElizaConfig;
  private socket: Socket | null = null;
  private userEntity: string;
  private isInitialized: boolean = false;

  constructor(config: ElizaConfig) {
    this.config = config;
    this.userEntity = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async initializeConnection(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing ElizaOS connection...');
      
      // 1. Check server health
      const isHealthy = await this.checkServerHealth();
      if (!isHealthy) {
        throw new Error('ElizaOS server is not responding',);
      }

      // 2. Add agent to central channel
      await this.addAgentToChannel();
      
      // 3. Initialize Socket.IO connection
      await this.initializeSocket();
      
      this.isInitialized = true;
      console.log('ElizaOS connection initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ElizaOS connection:', error);
      throw error;
    }
  }

  private async addAgentToChannel(): Promise<void> {
    try {
      console.log('Adding agent to central channel...');
      const response = await fetch(`/api/eliza/messaging/central-channels/${this.config.worldId}/agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          agentId: this.config.agentId 
        }),
      });

      const responseData = await response.text();
      console.log('Agent registration response:', response.status, responseData);

      if (!response.ok && response.status !== 409) { // 409 = already exists, which is OK
        throw new Error(`Failed to add agent to channel: ${response.status} - ${responseData}`);
      }

      console.log('Agent successfully added to central channel');
    } catch (error) {
      console.error('Error adding agent to channel:', error);
      // Don't throw here as the agent might already be registered
    }
  }

  private async initializeSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Initializing Socket.IO connection...');
      
      this.socket = io(this.config.serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
      });

      const timeout = setTimeout(() => {
        reject(new Error('Socket connection timeout'));
      }, 10000);

      this.socket.on('connect', () => {
        console.log('Socket.IO connected to ElizaOS');
        clearTimeout(timeout);
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        clearTimeout(timeout);
        reject(error);
      });

      this.socket.on('error', (error) => {
        console.error('Socket.IO error:', error);
      });
    });
  }

  onMessage(callback: (message: ChatMessage) => void): void {
    if (!this.socket) return;

    this.socket.on('messageBroadcast', (data: any) => {
      console.log('Received messageBroadcast:', data);
      
      const isCentralChannel = data.channelId === this.config.worldId;
      const isNotFromUser = data.senderId !== this.userEntity;
      
      if (isCentralChannel && isNotFromUser && data.text) {
        const message: ChatMessage = {
          id: data.id || Date.now().toString(),
          content: data.text || data.content || 'Message received',
          sender: 'agent',
          timestamp: data.timestamp || Date.now(),
          senderId: data.senderId,
        };
        callback(message);
      }
    });

    // Also listen for other message events
    this.socket.on('message', (data: any) => {
      console.log('Received message event:', data);
    });
  }

  async sendMessage(message: string): Promise<void> {
    try {
      console.log('Sending message:', message);
      
      const messageData = {
        text: message,
        senderId: this.userEntity,
        agentId: this.config.agentId,
        timestamp: Date.now(),
        channelId: this.config.worldId,
        userName: 'Web User',
      };

      console.log('Message payload:', messageData);

      const response = await fetch(`/api/eliza/messaging/central-channels/${this.config.worldId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      const responseText = await response.text();
      console.log('Send message response:', response.status, responseText);

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status} - ${responseText}`);
      }

      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message to ElizaOS:', error);
      throw error;
    }
  }

  async checkServerHealth(): Promise<boolean> {
    try {
      console.log('Checking server health...');
      const response = await fetch('/api/eliza/server/ping');
      const isHealthy = response.ok;
      console.log('Server health check:', isHealthy);
      return isHealthy;
    } catch (error) {
      console.log('Server health check failed:', error);
      return false;
    }
  }

  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting Socket.IO...');
      this.socket.disconnect();
      this.socket = null;
    }
    this.isInitialized = false;
  }

  // Mock insights for now
  async getInsights(): Promise<Insight[]> {
    if (Math.random() > 0.9) {
      const insights: Insight[] = [
        {
          id: Date.now().toString(),
          type: 'opportunity',
          message: 'New DeFi yield farming opportunity detected with 12% APY on Base network.',
          timestamp: Date.now(),
          action: {
            label: 'View Details',
            onClick: () => console.log('Opening opportunity details')
          }
        }
      ];
      return insights;
    }
    return [];
  }
}

const character = {
  name: 'TokenIQ Agent',
  bio: 'AI agent specialized in managing and optimizing tokenized real-world assets'
};

const queryClient = new QueryClient();

const getInsightIcon = (type: InsightType) => {
  switch (type) {
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    case 'opportunity':
      return <Sparkles className="w-4 h-4 text-blue-500" />;
    case 'alert':
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    default:
      return <Info className="w-4 h-4 text-gray-500" />;
  }
};

function ElizaOSCore() {
  const [isMinimized, setIsMinimized] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentInsight, setCurrentInsight] = useState<Insight | null>(null);
  const [insightQueue, setInsightQueue] = useState<Insight[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [elizaAPI, setElizaAPI] = useState<ElizaAPI | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize ElizaOS API
  useEffect(() => {
    const config: ElizaConfig = {
      agentId: process.env.NEXT_PUBLIC_AGENT_ID || 'your-agent-id',
      worldId: process.env.NEXT_PUBLIC_WORLD_ID || '00000000-0000-0000-0000-000000000000',
      serverUrl: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000',
    };
    
    console.log('ElizaOS Config:', config);
    
    const api = new ElizaAPI(config);
    setElizaAPI(api);

    const initializeConnection = async () => {
      setConnectionStatus('connecting');
      try {
        await api.initializeConnection();
        
        // Set up message listener
        api.onMessage((message) => {
          console.log('Received message in UI:', message);
          setChatMessages(prev => [...prev, message]);
        });

        setConnectionStatus('connected');
        
        // Add welcome message
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          content: `Hello! I'm ${character.name}. How can I help you with your tokenized assets today?`,
          sender: 'agent',
          timestamp: Date.now()
        };
        setChatMessages([welcomeMessage]);
      } catch (error) {
        console.error('Failed to initialize connection:', error);
        setConnectionStatus('disconnected');
        
        // Add error message
        const errorMessage: ChatMessage = {
          id: 'error',
          content: 'I\'m having trouble connecting to the server.',
          sender: 'agent',
          timestamp: Date.now()
        };
        setChatMessages([errorMessage]);
      }
    };

    initializeConnection();

    // Cleanup on unmount
    return () => {
      if (api) {
        api.disconnect();
      }
    };
  }, []);

  // Generate insights periodically
  useEffect(() => {
    if (!elizaAPI || connectionStatus !== 'connected') return;

    const fetchInsights = async () => {
      const insights = await elizaAPI.getInsights();
      if (insights.length > 0) {
        setInsightQueue(prev => [...prev, ...insights]);
      }
    };

    // Initial fetch
    fetchInsights();

    // Periodic fetch every 2 minutes
    const interval = setInterval(fetchInsights, 120000);
    return () => clearInterval(interval);
  }, [elizaAPI, connectionStatus]);

  // Process insight queue
  useEffect(() => {
    if (insightQueue.length > 0 && !currentInsight && viewMode === 'insights') {
      const [nextInsight, ...remainingInsights] = insightQueue;
      setCurrentInsight(nextInsight);
      setInsightQueue(remainingInsights);
      
      // Auto-dismiss after 10 seconds
      const timer = setTimeout(() => {
        setCurrentInsight(null);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [insightQueue, currentInsight, viewMode]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !elizaAPI || isLoading || connectionStatus !== 'connected') return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, userMessage]);
    const messageToSend = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      await elizaAPI.sendMessage(messageToSend);
      // Response will come through the socket listener
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error processing your message. Please try again.",
        sender: 'agent',
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDismiss = useCallback(() => {
    setCurrentInsight(null);
  }, []);

  const handleAction = useCallback((action: () => void) => {
    action();
    handleDismiss();
  }, [handleDismiss]);

  const handleToggle = useCallback(() => {
    if (isFullscreen) {
      setIsFullscreen(false);
      setIsMinimized(true);
    } else {
      setIsMinimized(!isMinimized);
    }
  }, [isMinimized, isFullscreen]);

  const handleFullscreen = useCallback(() => {
    setIsFullscreen(true);
    setIsMinimized(false);
    setViewMode('chat'); // Switch to chat when going fullscreen
  }, []);

  const handleExitFullscreen = useCallback(() => {
    setIsFullscreen(false);
    setIsMinimized(false);
  }, []);

  // Floating Action Button (Minimized State)
  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "rounded-full w-12 h-12 shadow-lg bg-background/80 backdrop-blur-sm transition-all duration-200",
            isHovered && "scale-110",
            connectionStatus === 'connected' && "border-green-500",
            connectionStatus === 'connecting' && "border-yellow-500",
            connectionStatus === 'disconnected' && "border-red-500"
          )}
          onClick={handleToggle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Bot className="w-5 h-5 text-blue-500" />
          
          {/* Connection status indicator */}
          <div className={cn(
            "absolute -top-1 -left-1 w-3 h-3 rounded-full",
            connectionStatus === 'connected' && "bg-green-500",
            connectionStatus === 'connecting' && "bg-yellow-500 animate-pulse",
            connectionStatus === 'disconnected' && "bg-red-500"
          )} />
          
          {insightQueue.length > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white font-medium"
            >
              {insightQueue.length}
            </motion.span>
          )}
        </Button>
      </motion.div>
    );
  }

  // Fullscreen Overlay
  if (isFullscreen) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col"
        >
          {/* Blurred Background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-md"
            onClick={handleExitFullscreen}
          />
          
          {/* Chat Interface */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 mx-4 my-8 flex-1 max-w-4xl mx-auto bg-card/95 backdrop-blur-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b bg-card/50 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <Bot className="w-6 h-6 text-blue-500" />
                <div className="flex flex-col">
                  <span className="text-lg font-semibold">{character.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {character.bio}
                    </span>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      connectionStatus === 'connected' && "bg-green-500",
                      connectionStatus === 'connecting' && "bg-yellow-500 animate-pulse",
                      connectionStatus === 'disconnected' && "bg-red-500"
                    )} />
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleExitFullscreen}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleToggle}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex",
                    message.sender === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed",
                      message.sender === 'user'
                        ? "bg-blue-500 text-white rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    )}
                  >
                    {message.content}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted p-4 rounded-2xl rounded-bl-md">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Chat Input */}
            <div className="p-6 border-t bg-card/50 flex-shrink-0">
              <div className="flex space-x-3">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={connectionStatus === 'connected' 
                    ? `Message ${character.name}...` 
                    : 'Connecting...'}
                  className="flex-1 h-12 text-base"
                  disabled={isLoading || connectionStatus !== 'connected'}
                />
                <Button
                  size="lg"
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading || connectionStatus !== 'connected'}
                  className="h-12 px-6"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {connectionStatus !== 'connected' && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  {connectionStatus === 'connecting' ? 'Connecting to ElizaOS...' : 'Disconnected from ElizaOS'}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Regular Chat Widget
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-50 w-80 h-96"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-card/90 backdrop-blur-lg rounded-xl border shadow-xl overflow-hidden h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-card/50 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Bot className="w-4 h-4 text-blue-500" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{character.name}</span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground truncate max-w-24">
                  {character.bio}
                </span>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  connectionStatus === 'connected' && "bg-green-500",
                  connectionStatus === 'connecting' && "bg-yellow-500 animate-pulse",
                  connectionStatus === 'disconnected' && "bg-red-500"
                )} />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-6 px-2 text-xs",
                viewMode === 'insights' && "bg-muted"
              )}
              onClick={() => setViewMode('insights')}
            >
              Insights
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-6 px-2 text-xs",
                viewMode === 'chat' && "bg-muted"
              )}
              onClick={() => setViewMode('chat')}
            >
              Chat
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleFullscreen}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleToggle}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {viewMode === 'insights' ? (
              <motion.div
                key="insights"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full flex flex-col"
              >
                {currentInsight ? (
                  <div className="p-4 flex-1">
                    <div className="flex items-start space-x-3">
                      <div className={cn(
                        'flex-shrink-0 flex items-center justify-center mt-0.5',
                        {
                          'text-amber-500': currentInsight.type === 'warning',
                          'text-blue-500': currentInsight.type === 'opportunity',
                          'text-red-500': currentInsight.type === 'alert',
                          'text-gray-500': currentInsight.type === 'info'
                        }
                      )}>
                        {getInsightIcon(currentInsight.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed">{currentInsight.message}</p>
                        {currentInsight.action && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 mt-2 text-blue-500 hover:no-underline"
                            onClick={() => currentInsight.action && handleAction(currentInsight.action.onClick)}
                          >
                            {currentInsight.action.label} <ArrowRight className="ml-1 w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground flex-1 flex flex-col justify-center">
                    <Bot className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                    <p>{character.name} is monitoring the markets.</p>
                    <p className="text-xs mt-1">I'll notify you when there's something important.</p>
                  </div>
                )}
                
                {/* Insights Footer */}
                <div className="px-3 py-2 bg-muted/30 text-xs text-muted-foreground flex justify-between items-center">
                  <button 
                    className="hover:text-foreground transition-colors"
                    onClick={handleDismiss}
                  >
                    Dismiss
                  </button>
                  <div className="flex items-center space-x-2">
                    {insightQueue.length > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                        {insightQueue.length}
                      </span>
                    )}
                    <button 
                      className="hover:text-foreground transition-colors"
                      onClick={() => setCurrentInsight(insightQueue[0] || null)}
                      disabled={insightQueue.length === 0}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.sender === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] p-2 rounded-lg text-sm",
                          message.sender === 'user'
                            ? "bg-blue-500 text-white"
                            : "bg-muted text-foreground"
                        )}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted p-2 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Chat Input */}
                <div className="p-3 border-t bg-card/50">
                  <div className="flex space-x-2">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={connectionStatus === 'connected' 
                        ? `Message ${character.name}...` 
                        : 'Connecting...'}
                      className="flex-1 h-8"
                      disabled={isLoading || connectionStatus !== 'connected'}
                    />
                    <Button
                      size="sm"
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isLoading || connectionStatus !== 'connected'}
                      className="h-8 w-8 p-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {connectionStatus !== 'connected' && (
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      {connectionStatus === 'connecting' ? 'Connecting to ElizaOS...' : 'Disconnected from ElizaOS'}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export function ElizaOS() {
  return (
    <QueryClientProvider client={queryClient}>
      <ElizaOSCore />
    </QueryClientProvider>
  );
}
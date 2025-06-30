'use client';

import { DeepseekChat } from '@/components/chat/DeepseekChat';

export default function ChatPage() {
  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Deepseek Chat</h1>
        <DeepseekChat />
      </div>
    </div>
  );
}

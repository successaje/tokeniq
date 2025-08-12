// app/api/eliza/messaging/central-channels/[channelId]/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const body = await request.json();
    const { channelId } = params;
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
    
    const response = await fetch(`${serverUrl}/api/messaging/central-channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      const errorText = await response.text();
      console.error('ElizaOS message error:', errorText);
      return NextResponse.json({ error: 'Failed to send message' }, { status: response.status });
    }
  } catch (error) {
    console.error('Error proxying message to ElizaOS:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
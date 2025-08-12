// app/api/eliza/messaging/central-channels/[channelId]/agents/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const body = await request.json();
    const { channelId } = params;
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
    
    const response = await fetch(`${serverUrl}/api/messaging/central-channels/${channelId}/agents`, {
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
      console.error('ElizaOS agent registration error:', errorText);
      return NextResponse.json({ error: 'Failed to add agent' }, { status: response.status });
    }
  } catch (error) {
    console.error('Error adding agent to ElizaOS channel:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const { channelId } = params;
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
    
    const response = await fetch(`${serverUrl}/api/messaging/central-channels/${channelId}/participants`);

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      const errorText = await response.text();
      console.error('ElizaOS participants error:', errorText);
      return NextResponse.json({ error: 'Failed to get participants' }, { status: response.status });
    }
  } catch (error) {
    console.error('Error getting participants from ElizaOS:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
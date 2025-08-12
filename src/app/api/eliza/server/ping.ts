// app/api/eliza/server/ping/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
    const response = await fetch(`${serverUrl}/ping`);
    
    if (response.ok) {
      return NextResponse.json({ status: 'ok', timestamp: Date.now() });
    } else {
      return NextResponse.json({ status: 'error' }, { status: 500 });
    }
  } catch (error) {
    console.error('Server ping failed:', error);
    return NextResponse.json({ status: 'error', error: 'Server unavailable' }, { status: 500 });
  }
}
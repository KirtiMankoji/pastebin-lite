import { NextResponse } from 'next/server';
import { kvClient } from '@/lib/kv';

export async function GET() {
  try {
    // Test KV connection with a simple ping
    await kvClient.ping();
    
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

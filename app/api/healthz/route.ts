import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { kvClient } = await import('@/lib/kv');
    await kvClient.ping();
    
    return NextResponse.json(
      { ok: true },
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

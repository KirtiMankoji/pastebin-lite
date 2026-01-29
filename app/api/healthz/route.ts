import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if Redis environment variables exist
    const hasRedisConfig = !!(
      process.env.KV_REST_API_URL && 
      process.env.KV_REST_API_TOKEN
    );
    
    if (!hasRedisConfig) {
      console.error('Redis environment variables not found');
      return NextResponse.json(
        { 
          ok: false,
          error: 'Redis environment variables not configured'
        },
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }
    
    // Dynamically import to avoid initialization errors
    const { kvClient } = await import('@/lib/kv');
    
    // Try to ping Redis
    await kvClient.ping();
    
    return NextResponse.json(
      { ok: true },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
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
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}
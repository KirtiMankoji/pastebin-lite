import { NextRequest, NextResponse } from 'next/server';
import { getPaste, kvClient } from '@/lib/kv';
import { getCurrentTime, isPasteExpired, isViewLimitExceeded } from '@/lib/time';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const paste = await getPaste(id);

    if (!paste) {
      return NextResponse.json(
        { error: 'Paste not found' },
        { status: 404 }
      );
    }

    // Get current time (considering test mode)
    const testNowMs = request.headers.get('x-test-now-ms') || undefined;
    const currentTime = getCurrentTime(testNowMs);

    // Check if expired
    if (isPasteExpired(paste.expiresAt, currentTime)) {
      return NextResponse.json(
        { error: 'Paste has expired' },
        { status: 404 }
      );
    }

    // Check if view limit exceeded BEFORE incrementing
    if (isViewLimitExceeded(paste.maxViews, paste.viewCount)) {
      return NextResponse.json(
        { error: 'Paste view limit exceeded' },
        { status: 404 }
      );
    }

    // Increment view count atomically
    await kvClient.hincrby(`paste:${id}`, 'viewCount', 1);
    
    // Get updated paste to return correct remaining views
    const updatedPaste = await getPaste(id);
    if (!updatedPaste) {
      return NextResponse.json(
        { error: 'Paste not found' },
        { status: 404 }
      );
    }

    const remainingViews = paste.maxViews !== null 
      ? Math.max(0, paste.maxViews - updatedPaste.viewCount)
      : null;

    const expiresAt = paste.expiresAt 
      ? new Date(paste.expiresAt).toISOString() 
      : null;

    return NextResponse.json({
      content: paste.content,
      remaining_views: remainingViews,
      expires_at: expiresAt,
    });
  } catch (error) {
    console.error('Error fetching paste:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

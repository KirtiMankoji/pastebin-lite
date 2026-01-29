import { NextRequest, NextResponse } from 'next/server';
import { getPaste, incrementViewCount, deletePaste } from '@/lib/kv';
import { getCurrentTime } from '@/lib/time';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paste = await getPaste(params.id);

    if (!paste) {
      return NextResponse.json(
        { error: 'Paste not found' },
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Get current time (supports TEST_MODE with x-test-now-ms header)
    const testNowHeader = request.headers.get('x-test-now-ms');
    const now = getCurrentTime(testNowHeader || undefined);

    // Check if expired
    if (paste.expiresAt && now >= paste.expiresAt) {
      await deletePaste(params.id);
      return NextResponse.json(
        { error: 'Paste has expired' },
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Check view limit BEFORE incrementing
    if (paste.maxViews !== null && paste.viewCount >= paste.maxViews) {
      await deletePaste(params.id);
      return NextResponse.json(
        { error: 'Paste view limit exceeded' },
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Increment view count
    const updatedPaste = await incrementViewCount(paste);

    // Check if THIS view reached the limit
    if (updatedPaste.maxViews !== null && updatedPaste.viewCount >= updatedPaste.maxViews) {
      // Delete in background
      deletePaste(params.id).catch(err => 
        console.error('Error deleting paste after final view:', err)
      );
    }

    // Calculate remaining views
    const remaining_views = updatedPaste.maxViews !== null
      ? Math.max(0, updatedPaste.maxViews - updatedPaste.viewCount)
      : null;

    return NextResponse.json(
      {
        content: updatedPaste.content,
        remaining_views,
        expires_at: updatedPaste.expiresAt 
          ? new Date(updatedPaste.expiresAt).toISOString() 
          : null,
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error) {
    console.error('Error fetching paste:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

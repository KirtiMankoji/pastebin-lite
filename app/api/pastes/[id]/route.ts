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
        { status: 404 }
      );
    }

    const testNowHeader = request.headers.get('x-test-now-ms');
    const now = getCurrentTime(testNowHeader || undefined);

    if (paste.expiresAt && now >= paste.expiresAt) {
      await deletePaste(params.id);
      return NextResponse.json(
        { error: 'Paste has expired' },
        { status: 404 }
      );
    }

    if (paste.maxViews !== null && paste.viewCount >= paste.maxViews) {
      await deletePaste(params.id);
      return NextResponse.json(
        { error: 'Paste view limit exceeded' },
        { status: 404 }
      );
    }

    const updatedPaste = await incrementViewCount(paste);

    if (updatedPaste.maxViews !== null && updatedPaste.viewCount >= updatedPaste.maxViews) {
      deletePaste(params.id).catch(err => 
        console.error('Error deleting paste after final view:', err)
      );
    }

    const remaining_views = updatedPaste.maxViews !== null
      ? Math.max(0, updatedPaste.maxViews - updatedPaste.viewCount)
      : null;

    return NextResponse.json({
      content: updatedPaste.content,
      remaining_views,
      expires_at: updatedPaste.expiresAt 
        ? new Date(updatedPaste.expiresAt).toISOString() 
        : null,
    });
  } catch (error) {
    console.error('Error fetching paste:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

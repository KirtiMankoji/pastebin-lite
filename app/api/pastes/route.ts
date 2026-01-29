import { NextRequest, NextResponse } from 'next/server';
import { createPaste, type Paste } from '@/lib/kv';
import { generatePasteId } from '@/lib/id';

interface CreatePasteRequest {
  content: string;
  ttl_seconds?: number;
  max_views?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePasteRequest = await request.json();

    // Validate content
    if (!body.content || typeof body.content !== 'string' || body.content.trim() === '') {
      return NextResponse.json(
        { error: 'content is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate ttl_seconds
    if (body.ttl_seconds !== undefined) {
      if (!Number.isInteger(body.ttl_seconds) || body.ttl_seconds < 1) {
        return NextResponse.json(
          { error: 'ttl_seconds must be an integer >= 1' },
          { status: 400 }
        );
      }
    }

    // Validate max_views
    if (body.max_views !== undefined) {
      if (!Number.isInteger(body.max_views) || body.max_views < 1) {
        return NextResponse.json(
          { error: 'max_views must be an integer >= 1' },
          { status: 400 }
        );
      }
    }

    const id = generatePasteId();
    const now = Date.now();
    const expiresAt = body.ttl_seconds ? now + (body.ttl_seconds * 1000) : null;

    const paste: Paste = {
      id,
      content: body.content,
      createdAt: now,
      expiresAt,
      maxViews: body.max_views ?? null,
      viewCount: 0,
    };

    await createPaste(paste);

    // Construct the URL
    const host = request.headers.get('host') || '';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const url = `${protocol}://${host}/p/${id}`;

    return NextResponse.json(
      { id, url },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating paste:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

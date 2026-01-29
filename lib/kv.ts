import { kv } from '@vercel/kv';

export interface Paste {
  id: string;
  content: string;
  createdAt: number;
  expiresAt: number | null;
  maxViews: number | null;
  viewCount: number;
}

export const kvClient = kv;

export async function getPaste(id: string): Promise<Paste | null> {
  const paste = await kvClient.get<Paste>(`paste:${id}`);
  return paste;
}

export async function createPaste(paste: Paste): Promise<void> {
  const key = `paste:${paste.id}`;
  
  // Store the paste
  await kvClient.set(key, paste);
  
  // Set TTL if expiry is defined
  if (paste.expiresAt) {
    const ttlSeconds = Math.ceil((paste.expiresAt - Date.now()) / 1000);
    if (ttlSeconds > 0) {
      await kvClient.expire(key, ttlSeconds);
    }
  }
}

export async function incrementViewCount(id: string): Promise<void> {
  const key = `paste:${id}`;
  await kvClient.hincrby(key, 'viewCount', 1);
}

export async function deletePaste(id: string): Promise<void> {
  await kvClient.del(`paste:${id}`);
}

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
  try {
    const pasteData = await kvClient.get(`paste:${id}`);
    
    if (!pasteData) {
      return null;
    }
    
    const paste = typeof pasteData === 'string' 
      ? JSON.parse(pasteData) 
      : pasteData;
    
    return paste as Paste;
  } catch (error) {
    console.error('Error fetching paste:', error);
    throw error;
  }
}

export async function createPaste(paste: Paste): Promise<void> {
  const key = `paste:${paste.id}`;
  
  try {
    await kvClient.set(key, JSON.stringify(paste));
    
    if (paste.expiresAt) {
      const ttlSeconds = Math.ceil((paste.expiresAt - Date.now()) / 1000);
      if (ttlSeconds > 0) {
        await kvClient.expire(key, ttlSeconds);
      }
    }
  } catch (error) {
    console.error('Error creating paste:', error);
    throw error;
  }
}

export async function incrementViewCount(paste: Paste): Promise<Paste> {
  const key = `paste:${paste.id}`;
  
  try {
    const updatedPaste: Paste = {
      ...paste,
      viewCount: paste.viewCount + 1
    };
    
    await kvClient.set(key, JSON.stringify(updatedPaste));
    
    if (updatedPaste.expiresAt) {
      const ttlSeconds = Math.ceil((updatedPaste.expiresAt - Date.now()) / 1000);
      if (ttlSeconds > 0) {
        await kvClient.expire(key, ttlSeconds);
      }
    }
    
    return updatedPaste;
  } catch (error) {
    console.error('Error incrementing view count:', error);
    throw error;
  }
}

export async function deletePaste(id: string): Promise<void> {
  try {
    await kvClient.del(`paste:${id}`);
  } catch (error) {
    console.error('Error deleting paste:', error);
    throw error;
  }
}

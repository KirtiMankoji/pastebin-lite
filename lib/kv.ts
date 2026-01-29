import { kv } from '@vercel/kv';

export interface Paste {
  id: string;
  content: string;
  createdAt: number;
  expiresAt: number | null;
  maxViews: number | null;
  viewCount: number;
}

// Create a safe wrapper that checks for environment variables
function getKVClient() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  
  if (!url || !token) {
    throw new Error(
      'Redis environment variables not configured. ' +
      'Please connect the Redis database in Vercel Dashboard > Storage.'
    );
  }
  
  return kv;
}

export const kvClient = getKVClient();

export async function getPaste(id: string): Promise<Paste | null> {
  try {
    const pasteData = await kvClient.get(`paste:${id}`);
    
    if (!pasteData) {
      return null;
    }
    
    // If data is a string, parse it; otherwise use as-is
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
    // Store the paste as JSON string
    await kvClient.set(key, JSON.stringify(paste));
    
    // Set TTL if expiry is defined
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
    // Create updated paste with incremented view count
    const updatedPaste: Paste = {
      ...paste,
      viewCount: paste.viewCount + 1
    };
    
    // Store the updated paste
    await kvClient.set(key, JSON.stringify(updatedPaste));
    
    // Re-apply TTL if it exists
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

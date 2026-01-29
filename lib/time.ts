/**
 * Gets the current time, considering TEST_MODE for deterministic testing
 */
export function getCurrentTime(testNowMs?: string): number {
  const isTestMode = process.env.TEST_MODE === '1';
  
  if (isTestMode && testNowMs) {
    const parsed = parseInt(testNowMs, 10);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  
  return Date.now();
}

/**
 * Checks if a paste has expired based on current time
 */
export function isPasteExpired(expiresAt: number | null, currentTime: number): boolean {
  if (expiresAt === null) {
    return false;
  }
  return currentTime >= expiresAt;
}

/**
 * Checks if a paste has exceeded its view limit
 */
export function isViewLimitExceeded(maxViews: number | null, viewCount: number): boolean {
  if (maxViews === null) {
    return false;
  }
  return viewCount >= maxViews;
}

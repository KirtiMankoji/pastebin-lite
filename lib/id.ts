/**
 * Generates a random unique ID for pastes
 * Using a combination of timestamp and random string for uniqueness
 */
export function generatePasteId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `${timestamp}${randomStr}`;
}

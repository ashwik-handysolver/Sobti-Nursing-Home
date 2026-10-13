// The user's own Gemini API key, kept in this browser only and sent with analysis requests.
// When none is set, the server falls back to the key in its own environment.
const STORAGE_KEY = 'meetmind_gemini_key_v1';

export function getUserApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setUserApiKey(key: string): void {
  try {
    if (key.trim()) localStorage.setItem(STORAGE_KEY, key.trim());
    else localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function apiKeyHeaders(): Record<string, string> {
  const key = getUserApiKey();
  return key ? { 'X-Gemini-Api-Key': key } : {};
}

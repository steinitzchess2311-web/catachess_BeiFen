/**
 * Resolve the tagger service base URL from environment
 */
export function resolveTaggerBase(): string {
  try {
    const env = (import.meta as any)?.env;
    const base = env?.VITE_TAGGER_BLACKBOX_URL || env?.VITE_TAGGER_BASE;
    if (base) return base as string;
  } catch {
    // ignore
  }
  return 'https://tagger.catachess.com';
}

export const FALLBACK_BACKOFF_MS = 10000;

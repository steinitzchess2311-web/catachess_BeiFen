import type { EngineAnalysis } from './types';

function resolveEnv(name: string): string | undefined {
  try {
    const env = (import.meta as any)?.env;
    return env ? env[name] : undefined;
  } catch {
    return undefined;
  }
}

const API_BASE = resolveEnv('VITE_API_BASE') || '';

export async function analyzeWithFallback(
  fen: string,
  depth: number,
  multipv: number
): Promise<EngineAnalysis> {
  const resp = await fetch(`${API_BASE}/api/engine/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fen, depth, multipv }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || `Engine error (${resp.status})`);
  }

  const data = await resp.json();
  return { source: 'backend', lines: Array.isArray(data.lines) ? data.lines : [] };
}

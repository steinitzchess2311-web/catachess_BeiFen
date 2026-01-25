import type { EngineAnalysis } from './types';
import { parseLichessCloudEval } from './parsers';

const LICHESS_URL = 'https://lichess.org/api/cloud-eval';

function resolveEnv(name: string): string | undefined {
  try {
    const env = (import.meta as any)?.env;
    return env ? env[name] : undefined;
  } catch {
    return undefined;
  }
}

function resolveApiBase(): string {
  const envBase = resolveEnv('VITE_API_BASE');
  if (envBase) return envBase;
  try {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:7878';
    }
  } catch {
    // ignore
  }
  return 'https://api.catachess.com';
}

const API_BASE = resolveApiBase();

function mapBackendSource(source: string | undefined): EngineAnalysis['source'] {
  if (!source) return 'backend';
  if (source === 'SFCata') return 'sf-catachess';
  if (source === 'CloudEval') return 'lichess-cloud';
  if (source === 'Fallback') return 'backend';
  return 'backend';
}

export async function analyzeWithFallback(
  fen: string,
  depth: number,
  multipv: number,
  engine: 'cloud' | 'sf'
): Promise<EngineAnalysis> {
  if (engine === 'sf') {
    const resp = await fetch(`${API_BASE}/api/engine/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fen, depth, multipv, engine: 'sf' }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(text || `Engine error (${resp.status})`);
    }
    const data = await resp.json();
    return {
      source: mapBackendSource(data.source),
      lines: Array.isArray(data.lines) ? data.lines : [],
    };
  }

  const params = new URLSearchParams({
    fen,
    multiPv: String(multipv),
  });
  const lichessResp = await fetch(`${LICHESS_URL}?${params.toString()}`);
  if (!lichessResp.ok) {
    const text = await lichessResp.text();
    throw new Error(text || `Engine error (${lichessResp.status})`);
  }

  const data = await lichessResp.json();
  const lines = parseLichessCloudEval(data);
  return { source: 'lichess-cloud', lines };
}

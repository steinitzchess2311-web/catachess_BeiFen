import type { EngineAnalysis } from './types';
import { parseLichessCloudEval, parseSfCatachess } from './parsers';

const DEFAULT_LICHESS_URL = 'https://lichess.org/api/cloud-eval';
const DEFAULT_SF_URL = 'https://sf.catachess.com/engine/analyze';

function resolveEnv(name: string): string | undefined {
  try {
    const env = (import.meta as any)?.env;
    return env ? env[name] : undefined;
  } catch {
    return undefined;
  }
}

const LICHESS_URL = resolveEnv('VITE_ENGINE_LICHESS_URL') || DEFAULT_LICHESS_URL;
const SF_URL = resolveEnv('VITE_ENGINE_SF_URL') || DEFAULT_SF_URL;

export async function analyzeWithFallback(
  fen: string,
  depth: number,
  multipv: number
): Promise<EngineAnalysis> {
  const params = new URLSearchParams({
    fen,
    multiPv: String(multipv),
  });
  const lichessResp = await fetch(`${LICHESS_URL}?${params.toString()}`);
  if (lichessResp.status === 404) {
    const sfResp = await fetch(SF_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fen, depth, multipv }),
    });
    if (!sfResp.ok) {
      const text = await sfResp.text();
      throw new Error(text || `Engine error (${sfResp.status})`);
    }
    const data = await sfResp.json();
    const lines = parseSfCatachess(data);
    return { source: 'sf-catachess', lines };
  }

  if (lichessResp.status === 429) {
    throw new Error('Rate limited (429).');
  }

  if (!lichessResp.ok) {
    const text = await lichessResp.text();
    throw new Error(text || `Engine error (${lichessResp.status})`);
  }

  const data = await lichessResp.json();
  const lines = parseLichessCloudEval(data);
  return { source: 'lichess-cloud', lines };
}

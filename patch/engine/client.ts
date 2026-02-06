import type { EngineAnalysis } from './types';
import { parseLichessCloudEval } from './parsers';
import { getCacheManager } from './cache';
import { generateCacheKey } from './cache/utils';
import { analyzeWithWasm } from './wasm/stockfish';

const LICHESS_URL = 'https://lichess.org/api/cloud-eval';
const CLOUD_ATTEMPTED_KEYS = new Set<string>();
const IN_FLIGHT = new Map<string, Promise<EngineAnalysis>>();

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

export const API_BASE = resolveApiBase();

function mapBackendSource(source: string | undefined): EngineAnalysis['source'] {
  if (!source) return 'backend';
  if (source === 'stockfish-wasm') return 'stockfish-wasm';
  if (source === 'lichess-cloud') return 'lichess-cloud';
  if (source === 'sf-catachess') return 'sf-catachess';
  if (source === 'SFCata') return 'sf-catachess';
  if (source === 'CloudEval') return 'lichess-cloud';
  if (source === 'Fallback') return 'backend';
  return 'backend';
}

async function lookupMongoCache(
  fen: string,
  depth: number,
  multipv: number
): Promise<{ lines: any[]; source?: string; timestamp?: number } | null> {
  const params = new URLSearchParams({
    fen,
    depth: String(depth),
    multipv: String(multipv),
  });
  const resp = await fetch(`${API_BASE}/api/engine/cache/lookup?${params.toString()}`);
  if (resp.status === 404) return null;
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || `Cache lookup failed (${resp.status})`);
  }
  const data = await resp.json();
  if (!data || !Array.isArray(data.lines)) return null;
  return {
    lines: data.lines,
    source: data.source,
    timestamp: typeof data.timestamp_ms === 'number'
      ? data.timestamp_ms
      : data.timestamp
        ? Date.parse(String(data.timestamp))
        : undefined,
  };
}

async function storeMongoCache(
  fen: string,
  depth: number,
  multipv: number,
  lines: any[],
  source: EngineAnalysis['source']
): Promise<void> {
  await fetch(`${API_BASE}/api/engine/cache/store`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fen,
      depth,
      multipv,
      lines,
      source,
    }),
  });
}

async function callSfcata(
  fen: string,
  depth: number,
  multipv: number
): Promise<EngineAnalysis> {
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

  // Log MongoDB cache metadata to console
  if (data.cache_metadata) {
    const meta = data.cache_metadata;
    if (meta.mongodb_hit) {
      console.log(
        `[MONGODB CACHE] ✓ HIT in ${meta.mongodb_query_ms}ms | ` +
        `hit_count=${meta.hit_count} | cached_at=${meta.cached_at} | ` +
        `total=${meta.total_ms}ms`
      );
    } else {
      console.log(
        `[MONGODB CACHE] ✗ MISS in ${meta.mongodb_query_ms}ms | ` +
        `engine=${meta.engine_ms}ms | store=${meta.mongodb_store_ms}ms | ` +
        `total=${meta.total_ms}ms`
      );
    }
  }

  return {
    source: mapBackendSource(data.source),
    lines: Array.isArray(data.lines) ? data.lines : [],
  };
}

async function callLichessCloud(
  fen: string,
  multipv: number
): Promise<EngineAnalysis> {
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

export async function analyzeAuto(
  fen: string,
  depth: number,
  multipv: number
): Promise<EngineAnalysis> {
  const cacheManager = getCacheManager();
  const cacheKey = generateCacheKey({ fen, depth, multipv });

  if (IN_FLIGHT.has(cacheKey)) {
    return IN_FLIGHT.get(cacheKey)!;
  }

  const run = (async () => {
    // Step 1: Memory + IndexedDB
    const cacheResult = await cacheManager.get({ fen, depth, multipv });
    if (cacheResult.data) {
      return {
        source: cacheResult.data.source,
        lines: cacheResult.data.lines,
      };
    }

    // Step 2: MongoDB cache lookup
    try {
      cacheManager.recordNetworkCall();
      const mongoCached = await lookupMongoCache(fen, depth, multipv);
      if (mongoCached && Array.isArray(mongoCached.lines) && mongoCached.lines.length > 0) {
        const timestamp = mongoCached.timestamp || Date.now();
        await cacheManager.set(
          { fen, depth, multipv },
          {
            fen,
            depth,
            multipv,
            lines: mongoCached.lines,
            source: mapBackendSource(mongoCached.source),
            timestamp,
          }
        );
        return {
          source: mapBackendSource(mongoCached.source),
          lines: mongoCached.lines,
        };
      }
    } catch (error) {
      console.warn('[ENGINE CLIENT] MongoDB cache lookup failed:', error);
    }

    // Step 3: Lichess Cloud (attempt once per key)
    if (!CLOUD_ATTEMPTED_KEYS.has(cacheKey)) {
      CLOUD_ATTEMPTED_KEYS.add(cacheKey);
      try {
        cacheManager.recordNetworkCall();
        const cloudResult = await callLichessCloud(fen, multipv);
        if (cloudResult.lines.length > 0) {
          const timestamp = Date.now();
          await cacheManager.set(
            { fen, depth, multipv },
            {
              fen,
              depth,
              multipv,
              lines: cloudResult.lines,
              source: cloudResult.source,
              timestamp,
            }
          );
          try {
            await storeMongoCache(fen, depth, multipv, cloudResult.lines, cloudResult.source);
          } catch (error) {
            console.warn('[ENGINE CLIENT] MongoDB store failed (cloud):', error);
          }
          return cloudResult;
        }
      } catch (error) {
        console.warn('[ENGINE CLIENT] Lichess Cloud failed:', error);
      }
    }

    // Step 4: Stockfish WASM (30s timeout)
    try {
      const wasmResult = await analyzeWithWasm(fen, depth, multipv, 30000);
      if (wasmResult.lines.length > 0) {
        const timestamp = Date.now();
        await cacheManager.set(
          { fen, depth, multipv },
          {
            fen,
            depth,
            multipv,
            lines: wasmResult.lines,
            source: wasmResult.source,
            timestamp,
          }
        );
        try {
          await storeMongoCache(fen, depth, multipv, wasmResult.lines, wasmResult.source);
        } catch (error) {
          console.warn('[ENGINE CLIENT] MongoDB store failed (wasm):', error);
        }
        return wasmResult;
      }
    } catch (error) {
      console.warn('[ENGINE CLIENT] Stockfish WASM failed:', error);
    }

    // Step 5: SFCata fallback
    cacheManager.recordNetworkCall();
    const sfResult = await callSfcata(fen, depth, multipv);
    if (sfResult.lines.length > 0) {
      const timestamp = Date.now();
      await cacheManager.set(
        { fen, depth, multipv },
        {
          fen,
          depth,
          multipv,
          lines: sfResult.lines,
          source: sfResult.source,
          timestamp,
        }
      );
    }

    // Trigger precomputation only for SFCata results
    if (sfResult.source === 'sf-catachess') {
      try {
        cacheManager.triggerPrecompute(
          { fen, depth, multipv },
          sfResult
        ).catch(err => {
          console.warn('[ENGINE CLIENT] Precompute trigger failed:', err);
        });
      } catch (error) {
        console.warn('[ENGINE CLIENT] Failed to trigger precompute:', error);
      }
    }

    return sfResult;
  })();

  IN_FLIGHT.set(cacheKey, run);
  try {
    return await run;
  } finally {
    IN_FLIGHT.delete(cacheKey);
  }
}

export async function analyzeWithFallback(
  fen: string,
  depth: number,
  multipv: number
): Promise<EngineAnalysis> {
  return analyzeAuto(fen, depth, multipv);
}

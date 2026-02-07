import { useState, useEffect, useRef } from 'react';
import { analyzeAuto } from '../../engine/client';
import type { EngineLine, EngineSource } from '../../engine/types';
import { cancelPrecompute } from '../../engine/precompute';
import { FALLBACK_BACKOFF_MS } from '../utils/config';

export interface UseEngineAnalysisOptions {
  enabled: boolean;
  fen: string;
  depth: number;
  multipv: number;
}

export interface UseEngineAnalysisResult {
  lines: EngineLine[];
  status: 'idle' | 'running' | 'ready' | 'error';
  error: string | null;
  lastUpdated: number | null;
  health: 'unknown' | 'ok' | 'down';
  source: EngineSource | null;
  engineOrigin: string | null;
}

/**
 * Hook for managing engine analysis state and polling
 */
export function useEngineAnalysis({
  enabled,
  fen,
  depth,
  multipv,
}: UseEngineAnalysisOptions): UseEngineAnalysisResult {
  const [lines, setLines] = useState<EngineLine[]>([]);
  const [status, setStatus] = useState<'idle' | 'running' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [health, setHealth] = useState<'unknown' | 'ok' | 'down'>('unknown');
  const [source, setSource] = useState<EngineSource | null>(null);
  const [engineOrigin, setEngineOrigin] = useState<string | null>(null);

  const inFlightRef = useRef(false);
  const pollRef = useRef<number | null>(null);
  const nextAllowedRef = useRef<number>(0);
  const lastPrecomputeParamsRef = useRef<{
    fen: string;
    depth: number;
    multipv: number;
  } | null>(null);

  const analyzePosition = async (currentFen: string) => {
    if (!currentFen || inFlightRef.current) return;
    const now = Date.now();
    if (now < nextAllowedRef.current) return;

    console.log('[ENGINE] ===== Analysis Request =====');
    console.log('[ENGINE] FEN:', currentFen.slice(0, 50) + '...');
    console.log('[ENGINE] ✗ CACHE MISS - Calling engine');

    inFlightRef.current = true;

    const setStatusStart = performance.now();
    setStatus('running');
    setError(null);
    const setStatusDuration = performance.now() - setStatusStart;
    console.log(`[ENGINE PERF] Set status to 'running': ${setStatusDuration.toFixed(2)}ms`);

    const apiCallStart = performance.now();
    try {
      const fetchStart = performance.now();
      const result = await analyzeAuto(currentFen, depth, multipv);
      const fetchDuration = performance.now() - fetchStart;

      console.log(`[ENGINE PERF] ===== API Call Complete =====`);
      console.log(`[ENGINE PERF] Network + Backend: ${fetchDuration.toFixed(1)}ms`);
      console.log('[ENGINE PERF] Source:', result.source);
      console.log('[ENGINE PERF] Lines received:', result.lines.length);

      const processStart = performance.now();
      setLines(result.lines);
      setSource(result.source);
      setEngineOrigin(result.origin ?? null);
      setStatus('ready');
      const timestamp = Date.now();
      setLastUpdated(timestamp);
      setHealth('ok');

      const processDuration = performance.now() - processStart;
      const totalDuration = performance.now() - apiCallStart;
      console.log(`[ENGINE PERF] Process result + cache: ${processDuration.toFixed(2)}ms`);
      console.log(`[ENGINE PERF] Total API handling: ${totalDuration.toFixed(1)}ms`);
      console.log('[ENGINE PERF] Note: useMemo will run on next render to format lines');
    } catch (e: any) {
      if (e?.message?.includes('429')) {
        nextAllowedRef.current = Date.now() + FALLBACK_BACKOFF_MS;
      }
      setStatus('error');
      setError(e?.message || 'Engine request failed');
      setHealth('down');
    } finally {
      inFlightRef.current = false;
    }
  };

  // Main analysis effect with polling
  useEffect(() => {
    if (!enabled) return;

    // Cancel any ongoing precomputation if position parameters changed
    const lastParams = lastPrecomputeParamsRef.current;
    const paramsChanged =
      lastParams !== null &&
      (lastParams.fen !== fen || lastParams.depth !== depth || lastParams.multipv !== multipv);

    if (paramsChanged) {
      console.log('[PRECOMPUTE] 🔄 Position parameters changed, cancelling previous session');
      if (lastParams.fen !== fen) {
        console.log(
          `[PRECOMPUTE]   FEN changed: ${lastParams.fen.slice(0, 30)}... → ${fen.slice(0, 30)}...`
        );
      }
      if (lastParams.depth !== depth) {
        console.log(`[PRECOMPUTE]   Depth changed: ${lastParams.depth} → ${depth}`);
      }
      if (lastParams.multipv !== multipv) {
        console.log(`[PRECOMPUTE]   MultiPV changed: ${lastParams.multipv} → ${multipv}`);
      }
      cancelPrecompute();
    }

    // Update last params
    lastPrecomputeParamsRef.current = { fen, depth, multipv };

    analyzePosition(fen);
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(() => {
      analyzePosition(fen);
    }, 2000);

    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [enabled, fen, depth, multipv]);

  // Reset state when disabled
  useEffect(() => {
    if (enabled) return;
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setStatus('idle');
    setHealth('down');
    setLines([]);
    setError(null);
    setLastUpdated(null);
    setSource(null);
    setEngineOrigin(null);
  }, [enabled]);

  // Reset lines when parameters change
  useEffect(() => {
    if (!enabled) return;
    setLines([]);
    setStatus('idle');
    setError(null);
    setSource(null);
    setEngineOrigin(null);
  }, [enabled, fen, depth, multipv]);

  return {
    lines,
    status,
    error,
    lastUpdated,
    health,
    source,
    engineOrigin,
  };
}

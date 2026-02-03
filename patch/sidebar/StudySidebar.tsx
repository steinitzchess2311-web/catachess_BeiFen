import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useStudy } from '../studyContext';
import { uciLineToSan } from '../chessJS/uci';
import { getFullmoveNumber, getTurn } from '../chessJS/fen';
import { analyzeWithFallback, API_BASE } from '../engine/client';
import type { EngineLine, EngineSource } from '../engine/types';
import { ChapterList } from './ChapterList';
import { getCacheManager } from '../engine/cache';
import { cancelPrecompute } from '../engine/precompute';

export interface StudySidebarProps {
  chapters: Array<{ id: string; title?: string; order?: number }>;
  currentChapterId: string | null;
  onSelectChapter: (chapterId: string) => void;
  onCreateChapter: () => void;
  onRenameChapter: (chapterId: string, title: string) => Promise<void> | void;
  onDeleteChapter: (chapterId: string) => Promise<void> | void;
  onReorderChapters: (
    order: string[],
    context: { draggedId: string; targetId: string; placement: 'before' | 'after' }
  ) => Promise<void> | void;
}

const FALLBACK_BACKOFF_MS = 10000;

function formatScore(raw: number | string): string {
  if (typeof raw === 'string') {
    if (raw.startsWith('mate')) {
      const mate = raw.slice(4);
      return `M${mate}`;
    }
    return raw;
  }
  const value = raw / 100;
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}

function formatSanWithMoveNumbers(sanMoves: string[], fen: string): string {
  if (sanMoves.length === 0) return '';
  const turn = getTurn(fen) || 'w';
  let moveNumber = getFullmoveNumber(fen) || 1;
  const parts: string[] = [];
  let isWhite = turn === 'w';
  let isFirst = true;
  for (const san of sanMoves) {
    if (isWhite) {
      parts.push(`${moveNumber}.${san}`);
    } else if (isFirst && turn === 'b') {
      parts.push(`${moveNumber}...${san}`);
      moveNumber += 1;
    } else {
      parts.push(`${san}`);
      moveNumber += 1;
    }
    isFirst = false;
    isWhite = !isWhite;
  }
  return parts.join(' ');
}

export function StudySidebar({
  chapters,
  currentChapterId,
  onSelectChapter,
  onCreateChapter,
  onRenameChapter,
  onDeleteChapter,
  onReorderChapters,
}: StudySidebarProps) {
  const componentRenderStart = performance.now();
  const renderCountRef = useRef(0);
  const prevPropsRef = useRef({ chapters, currentChapterId });
  renderCountRef.current++;

  // Detect what changed to trigger this render
  if (renderCountRef.current > 1) {
    console.log(`[COMPONENT PERF] ===== Render #${renderCountRef.current} Triggered =====`);
    if (prevPropsRef.current.chapters !== chapters) {
      console.log('[COMPONENT PERF] ⚠️ Chapters prop changed');
    }
    if (prevPropsRef.current.currentChapterId !== currentChapterId) {
      console.log('[COMPONENT PERF] ⚠️ CurrentChapterId prop changed');
    }
  }
  prevPropsRef.current = { chapters, currentChapterId };

  const { state } = useStudy();
  const prevStateRef = useRef({ currentFen: state.currentFen });

  // Track state changes
  if (renderCountRef.current > 1) {
    if (prevStateRef.current.currentFen !== state.currentFen) {
      console.log('[COMPONENT PERF] ⚠️ CurrentFen changed from study state');
      console.log('[COMPONENT PERF]   Old:', prevStateRef.current.currentFen.slice(0, 30) + '...');
      console.log('[COMPONENT PERF]   New:', state.currentFen.slice(0, 30) + '...');
    }
  }
  prevStateRef.current = { currentFen: state.currentFen };

  const [activeTab, setActiveTab] = useState<'chapters' | 'analysis' | 'imitator'>('chapters');
  const [depth, setDepth] = useState(14);
  const [multipv, setMultipv] = useState(3);
  const [engineEnabled, setEngineEnabled] = useState(false);
  const [engineMode, setEngineMode] = useState<'cloud' | 'sf'>('sf');
  const [cloudBlocked, setCloudBlocked] = useState(false);
  const [engineNotice, setEngineNotice] = useState<string | null>(null);
  const [lines, setLines] = useState<EngineLine[]>([]);
  const [status, setStatus] = useState<'idle' | 'running' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [health, setHealth] = useState<'unknown' | 'ok' | 'down'>('unknown');
  const [source, setSource] = useState<EngineSource | null>(null);
  const [coachOptions, setCoachOptions] = useState<string[]>([]);
  const [playerOptions, setPlayerOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [coachStatus, setCoachStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [playerStatus, setPlayerStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [coachError, setCoachError] = useState<string | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedEngine, setSelectedEngine] = useState<'cloud' | 'sf'>('sf');
  const [imitatorTargets, setImitatorTargets] = useState<
    Array<{
      id: string;
      label: string;
      source?: 'library' | 'user';
      player?: string;
      playerId?: string;
      engine?: 'cloud' | 'sf';
      kind: 'coach' | 'player' | 'engine';
    }>
  >([]);
  const [imitatorResults, setImitatorResults] = useState<
    Record<
      string,
      {
        status: 'idle' | 'running' | 'ready' | 'error';
        moves: Array<{
          move: string;
          uci?: string;
          score_cp?: number | null;
          tags?: string[];
          probability?: number;
        }>;
        updated?: number;
        error?: string | null;
      }
    >
  >({});
  const inFlightRef = useRef(false);
  const pollRef = useRef<number | null>(null);
  const nextAllowedRef = useRef<number>(0);
  const imitatorRequestRef = useRef(0);
  const lastPrecomputeParamsRef = useRef<{
    fen: string;
    depth: number;
    multipv: number;
  } | null>(null);

  // Get the global cache manager instance
  const cacheManager = getCacheManager();

  // Monitor component render performance
  useEffect(() => {
    const renderDuration = performance.now() - componentRenderStart;
    console.log('[COMPONENT PERF] ===== Render Cycle Complete =====');
    console.log(`[COMPONENT PERF] Render #${renderCountRef.current}`);
    console.log(`[COMPONENT PERF] Render duration: ${renderDuration.toFixed(2)}ms`);
    console.log('[COMPONENT PERF] Active tab:', activeTab);
    console.log('[COMPONENT PERF] Engine enabled:', engineEnabled);
    console.log('[COMPONENT PERF] Lines count:', lines.length);
    console.log('[COMPONENT PERF] Formatted lines count:', formattedLines.length);

    // Schedule a post-paint check
    requestAnimationFrame(() => {
      const paintDuration = performance.now() - componentRenderStart;
      console.log(`[COMPONENT PERF] Paint complete: ${paintDuration.toFixed(2)}ms`);
      console.log('[COMPONENT PERF] =====================================');
    });
  });

  // Expose cache stats to window for debugging
  useEffect(() => {
    (window as any).cacheStats = () => cacheManager.printStats();
    (window as any).cacheClear = () => cacheManager.clear();
    return () => {
      delete (window as any).cacheStats;
      delete (window as any).cacheClear;
    };
  }, [cacheManager]);

  const resolveTaggerBase = () => {
    try {
      const env = (import.meta as any)?.env;
      const base = env?.VITE_TAGGER_BLACKBOX_URL || env?.VITE_TAGGER_BASE;
      if (base) return base as string;
    } catch {
      // ignore
    }
    return 'https://tagger.catachess.com';
  };

  const TAGGER_BASE = resolveTaggerBase();

  const formatProbability = (value?: number) => {
    if (value === undefined || value === null || Number.isNaN(value)) return '—';
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatTags = (tags?: string[]) => {
    if (!tags || tags.length === 0) return '—';
    return tags.join(', ');
  };

  const analyzePosition = async (fen: string) => {
    if (!fen || inFlightRef.current) return;
    if (engineMode === 'cloud' && cloudBlocked) return;
    const now = Date.now();
    if (now < nextAllowedRef.current) return;

    console.log('[ENGINE] ===== Analysis Request =====');
    console.log('[ENGINE] FEN:', fen.slice(0, 50) + '...');

    // Query cache (cascades through memory → indexeddb)
    const cacheResult = await cacheManager.get({
      fen,
      depth,
      multipv,
      engineMode,
    });

    if (cacheResult.data) {
      const cacheHitStart = performance.now();
      console.log(`[ENGINE] ✓ CACHE HIT from ${cacheResult.source?.toUpperCase()}!`);
      console.log('[ENGINE] Cached at:', new Date(cacheResult.data.timestamp).toISOString());
      console.log('[ENGINE] Source:', cacheResult.data.source);
      console.log('[ENGINE] Lines:', cacheResult.data.lines.length);

      console.log('[ENGINE PERF] ⏱️ About to trigger setState (will cause re-render)...');
      const setStateStart = performance.now();

      // Batch state updates
      setLines(cacheResult.data.lines);
      setSource(cacheResult.data.source);
      setStatus('ready');
      setLastUpdated(cacheResult.data.timestamp);
      setHealth('ok');

      const setStateDuration = performance.now() - setStateStart;
      const totalCacheHitDuration = performance.now() - cacheHitStart;

      console.log(`[ENGINE PERF] setState calls completed: ${setStateDuration.toFixed(2)}ms`);
      console.log(`[ENGINE PERF] Total cache hit handling: ${totalCacheHitDuration.toFixed(2)}ms`);
      console.log('[ENGINE PERF] ⚠️ React will now re-render component...');
      console.log('[ENGINE PERF] Note: Watch for [COMPONENT PERF] logs to see render time');
      return;
    }

    console.log('[ENGINE] ✗ CACHE MISS - Calling engine');
    cacheManager.recordNetworkCall();
    inFlightRef.current = true;

    const setStatusStart = performance.now();
    setStatus('running');
    setError(null);
    const setStatusDuration = performance.now() - setStatusStart;
    console.log(`[ENGINE PERF] Set status to 'running': ${setStatusDuration.toFixed(2)}ms`);

    const apiCallStart = performance.now();
    try {
      const fetchStart = performance.now();
      const result = await analyzeWithFallback(fen, depth, multipv, engineMode);
      const fetchDuration = performance.now() - fetchStart;

      console.log(`[ENGINE PERF] ===== API Call Complete =====`);
      console.log(`[ENGINE PERF] Network + Backend: ${fetchDuration.toFixed(1)}ms`);
      console.log('[ENGINE PERF] Source:', result.source);
      console.log('[ENGINE PERF] Lines received:', result.lines.length);

      const processStart = performance.now();
      setLines(result.lines);
      setSource(result.source);
      setStatus('ready');
      const timestamp = Date.now();
      setLastUpdated(timestamp);
      setHealth('ok');

      // Store in cache (saves to memory + indexeddb)
      await cacheManager.set(
        { fen, depth, multipv, engineMode },
        {
          fen,
          depth,
          multipv,
          lines: result.lines,
          source: result.source,
          timestamp,
        }
      );
      const processDuration = performance.now() - processStart;

      const totalDuration = performance.now() - apiCallStart;
      console.log(`[ENGINE PERF] Process result + cache: ${processDuration.toFixed(2)}ms`);
      console.log(`[ENGINE PERF] Total API handling: ${totalDuration.toFixed(1)}ms`);
      console.log('[ENGINE PERF] Note: useMemo will run on next render to format lines');
    } catch (e: any) {
      if (e?.message?.includes('429')) {
        nextAllowedRef.current = Date.now() + FALLBACK_BACKOFF_MS;
      }
      if (engineMode === 'cloud') {
        setCloudBlocked(true);
        setEngineNotice('Cloud Eval unavailable. Please select SFCata engine.');
        setStatus('error');
        setError(e?.message || 'Engine request failed');
        setHealth('down');
      } else {
        setStatus('error');
        setError(e?.message || 'Engine request failed');
        setHealth('down');
      }
    } finally {
      inFlightRef.current = false;
    }
  };

  useEffect(() => {
    if (activeTab !== 'analysis' || !engineEnabled) return;

    // Cancel any ongoing precomputation if position parameters changed
    const lastParams = lastPrecomputeParamsRef.current;
    const paramsChanged = lastParams !== null && (
      lastParams.fen !== state.currentFen ||
      lastParams.depth !== depth ||
      lastParams.multipv !== multipv
    );

    if (paramsChanged) {
      console.log('[PRECOMPUTE] 🔄 Position parameters changed, cancelling previous session');
      if (lastParams.fen !== state.currentFen) {
        console.log(`[PRECOMPUTE]   FEN changed: ${lastParams.fen.slice(0, 30)}... → ${state.currentFen.slice(0, 30)}...`);
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
    lastPrecomputeParamsRef.current = {
      fen: state.currentFen,
      depth: depth,
      multipv: multipv,
    };

    analyzePosition(state.currentFen);
    if (pollRef.current) window.clearInterval(pollRef.current);
    if (engineMode === 'sf') {
      pollRef.current = window.setInterval(() => {
        analyzePosition(state.currentFen);
      }, 2000);
    }

    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [activeTab, engineEnabled, state.currentFen, depth, multipv, engineMode, cloudBlocked]);

  useEffect(() => {
    if (activeTab !== 'imitator') return;

    const loadCoaches = async () => {
      setCoachStatus('loading');
      setCoachError(null);
      try {
        const resp = await fetch(`${TAGGER_BASE}/tagger/imitator/players?source=library`);
        if (!resp.ok) throw new Error(`Coach list failed (${resp.status})`);
        const data = await resp.json();
        const players = Array.isArray(data.players) ? data.players : [];
        setCoachOptions(players);
        setCoachStatus('ready');
        if (!selectedCoach && players.length > 0) setSelectedCoach(players[0]);
      } catch (e: any) {
        console.error('[imitator] load coaches failed', e);
        setCoachStatus('error');
        setCoachError(e?.message || 'Failed to load coaches');
      }
    };

    const loadPlayers = async () => {
      setPlayerStatus('loading');
      setPlayerError(null);
      try {
        const resp = await fetch(
          `${TAGGER_BASE}/tagger/imitator/players?source=user&status=success&include_ids=true`
        );
        if (!resp.ok) throw new Error(`Player list failed (${resp.status})`);
        const data = await resp.json();
        const players = Array.isArray(data.players) ? data.players : [];
        setPlayerOptions(players);
        setPlayerStatus('ready');
        if (!selectedPlayer && players.length > 0) setSelectedPlayer(players[0].id);
      } catch (e: any) {
        console.error('[imitator] load players failed', e);
        setPlayerStatus('error');
        setPlayerError(e?.message || 'Failed to load players');
      }
    };

    if (coachStatus === 'idle') void loadCoaches();
    if (playerStatus === 'idle') void loadPlayers();
  }, [activeTab, TAGGER_BASE, coachStatus, playerStatus, selectedCoach, selectedPlayer]);

  useEffect(() => {
    if (activeTab !== 'imitator') return;
    if (!state.currentFen || imitatorTargets.length === 0) return;

    const currentRequest = imitatorRequestRef.current + 1;
    imitatorRequestRef.current = currentRequest;

    setImitatorResults((prev) => {
      const next = { ...prev };
      for (const target of imitatorTargets) {
        next[target.id] = {
          ...next[target.id],
          status: 'running',
          error: null,
        };
      }
      return next;
    });

    const run = async () => {
      const tasks = imitatorTargets.map(async (target) => {
        if (target.kind === 'engine') {
          const payload = {
            fen: state.currentFen,
            depth,
            multipv,
            engine: target.engine ?? 'sf',
          };
          console.log('[imitator] engine request', { target: target.label, payload });
          const resp = await fetch(`${API_BASE}/api/engine/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!resp.ok) {
            const text = await resp.text();
            throw new Error(text || `Engine error (${resp.status})`);
          }
          const data = await resp.json();
          const lines = Array.isArray(data?.lines) ? (data.lines as EngineLine[]) : [];
          const moves = lines.reduce<Array<{
            move: string;
            uci?: string;
            score_cp?: number | null;
            tags?: string[];
          }>>((acc, line) => {
            const pv = Array.isArray(line.pv) ? line.pv : [];
            const first = pv[0];
            if (!first) return acc;
            const evalTag = line.score !== undefined ? `Eval ${formatScore(line.score)}` : null;
            acc.push({
              move: first,
              uci: first,
              score_cp: typeof line.score === 'number' ? line.score : null,
              tags: evalTag ? [evalTag] : undefined,
            });
            return acc;
          }, []);
          return { moves };
        }
        const payload: Record<string, any> = {
          fen: state.currentFen,
          top_n: 5,
          depth: 14,
          source: target.source,
        };
        if (target.playerId) payload.player_id = target.playerId;
        if (target.player) payload.player = target.player;
        console.log('[imitator] request', { target: target.label, payload });
        const resp = await fetch(`${TAGGER_BASE}/tagger/imitator`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(text || `Imitator error (${resp.status})`);
        }
        const text = await resp.text();
        if (!text) {
          throw new Error('Imitator returned empty response');
        }
        try {
          return JSON.parse(text);
        } catch (error) {
          console.error('[imitator] json parse failed', { text });
          throw new Error('Imitator returned invalid JSON');
        }
      });

      const results = await Promise.allSettled(tasks);
      if (imitatorRequestRef.current !== currentRequest) return;

      setImitatorResults((prev) => {
        const next = { ...prev };
        results.forEach((result, index) => {
          const target = imitatorTargets[index];
          if (!target) return;
          if (result.status === 'fulfilled') {
            next[target.id] = {
              status: 'ready',
              moves: Array.isArray(result.value?.moves) ? result.value.moves : [],
              updated: Date.now(),
              error: null,
            };
          } else {
            console.error('[imitator] analyze failed', result.reason);
            next[target.id] = {
              status: 'error',
              moves: [],
              updated: Date.now(),
              error: result.reason?.message || 'Imitator failed',
            };
          }
        });
        return next;
      });
    };

    void run();
  }, [activeTab, state.currentFen, imitatorTargets, depth, multipv, TAGGER_BASE, API_BASE]);

  useEffect(() => {
    if (engineEnabled) return;
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
    setCloudBlocked(false);
    setEngineNotice(null);
  }, [engineEnabled]);

  useEffect(() => {
    if (activeTab !== 'analysis' || !engineEnabled) return;
    setLines([]);
    setStatus('idle');
    setError(null);
    setSource(null);
    setCloudBlocked(false);
    setEngineNotice(null);
  }, [activeTab, engineEnabled, state.currentFen, depth, multipv, engineMode]);

  // Memoize formatted lines to avoid expensive UCI->SAN conversion on every render
  const formattedLines = useMemo(() => {
    const memoStart = performance.now();
    console.log('[ENGINE PERF] ===== Formatting Lines (useMemo triggered) =====');
    console.log('[ENGINE PERF] Lines to format:', lines.length);
    console.log('[ENGINE PERF] Current FEN:', state.currentFen.slice(0, 50) + '...');
    console.log('[ENGINE PERF] ⚠️ useMemo is running - dependencies changed');

    if (lines.length === 0) {
      console.log('[ENGINE PERF] No lines to format');
      return [];
    }

    const result = lines.map((line, index) => {
      const lineStart = performance.now();
      console.log(`[ENGINE PERF] Line ${index + 1}/${lines.length} - Starting conversion`);
      console.log(`[ENGINE PERF]   - UCI PV length: ${line.pv?.length || 0} moves`);

      // Step 1: UCI to SAN conversion
      const uciStart = performance.now();
      const sanLine = uciLineToSan(line.pv || [], state.currentFen);
      const uciDuration = performance.now() - uciStart;
      console.log(`[ENGINE PERF]   - UCI->SAN conversion: ${uciDuration.toFixed(2)}ms`);

      // Step 2: Extract SAN moves
      const extractStart = performance.now();
      const sanMoves = sanLine
        .map((step) => step.san)
        .filter((move): move is string => Boolean(move));
      const extractDuration = performance.now() - extractStart;
      console.log(`[ENGINE PERF]   - Extract SAN moves: ${extractDuration.toFixed(2)}ms`);

      // Step 3: Format with move numbers
      const formatStart = performance.now();
      const sanText = formatSanWithMoveNumbers(sanMoves, state.currentFen);
      const formatDuration = performance.now() - formatStart;
      console.log(`[ENGINE PERF]   - Format move numbers: ${formatDuration.toFixed(2)}ms`);

      const lineDuration = performance.now() - lineStart;
      console.log(`[ENGINE PERF]   - Line ${index + 1} total: ${lineDuration.toFixed(2)}ms`);

      return {
        ...line,
        sanText,
      };
    });

    const memoDuration = performance.now() - memoStart;
    console.log('[ENGINE PERF] ===== Formatting Complete =====');
    console.log(`[ENGINE PERF] Total formatting time: ${memoDuration.toFixed(2)}ms`);
    console.log(`[ENGINE PERF] Average per line: ${(memoDuration / lines.length).toFixed(2)}ms`);

    return result;
  }, [lines, state.currentFen]);

  const renderAnalysis = () => (
    <div className="patch-analysis-panel">
      <div className="patch-analysis-status">
        <span className={`patch-analysis-badge is-${status}`}>{status}</span>
        <span className="patch-analysis-health">
          {!engineEnabled
            ? 'Engine Off'
            : health === 'ok'
              ? 'Engine OK'
              : health === 'down'
                ? 'Engine Down'
                : 'Engine Unknown'}
        </span>
        {source && <span className="patch-analysis-source">{source}</span>}
        {lastUpdated && (
          <span className="patch-analysis-updated">
            {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        )}
      </div>
      {engineNotice && <div className="patch-analysis-error">{engineNotice}</div>}
      {!engineNotice && error && <div className="patch-analysis-error">{error}</div>}
      <div className="patch-analysis-lines">
        {!engineEnabled && (
          <div className="patch-analysis-empty">No analysis yet. Turn on engine to analyze.</div>
        )}
        {engineEnabled && formattedLines.length === 0 && (
          <div className="patch-analysis-empty">No analysis yet.</div>
        )}
        {(() => {
          const linesRenderStart = performance.now();
          console.log(`[RENDER PERF] ===== Rendering ${formattedLines.length} analysis lines =====`);

          const elements = formattedLines.map((line, index) => {
            const lineRenderStart = performance.now();
            const element = (
              <div key={`pv-${line.multipv}`} className="patch-analysis-line">
                <div className="patch-analysis-score">{formatScore(line.score)}</div>
                <div className="patch-analysis-pv">
                  {line.sanText || (line.pv?.join(' ') ?? '')}
                </div>
              </div>
            );
            const lineRenderDuration = performance.now() - lineRenderStart;
            console.log(`[RENDER PERF] Line ${index + 1}/${formattedLines.length}: ${lineRenderDuration.toFixed(3)}ms`);
            return element;
          });

          const linesRenderDuration = performance.now() - linesRenderStart;
          console.log(`[RENDER PERF] All lines JSX created: ${linesRenderDuration.toFixed(2)}ms`);
          console.log('[RENDER PERF] Note: DOM update happens AFTER this');

          return elements;
        })()}
      </div>
    </div>
  );

  const renderImitatorPanel = () => (
    <div className="patch-analysis-panel patch-imitator-panel">
      {imitatorTargets.length === 0 && (
        <div className="patch-analysis-empty">
          Add a coach, player, or engine to generate style-guided moves.
        </div>
      )}
      {imitatorTargets.map((target) => {
        const result = imitatorResults[target.id] || { status: 'idle', moves: [] };
        const moves = Array.isArray(result.moves) ? result.moves : [];
        return (
          <div key={target.id} className="patch-imitator-card">
            <div className="patch-imitator-header">
              <div>
                <div className="patch-imitator-title">{target.label}</div>
                <div className="patch-imitator-meta">
                  {target.kind === 'engine' ? 'Engine' : target.kind === 'coach' ? 'Coach' : 'Player'}
                  {result.updated && (
                    <span className="patch-imitator-updated">
                      {new Date(result.updated).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="patch-imitator-remove"
                onClick={() => {
                  setImitatorTargets((prev) => prev.filter((item) => item.id !== target.id));
                  setImitatorResults((prev) => {
                    const next = { ...prev };
                    delete next[target.id];
                    return next;
                  });
                }}
              >
                Remove
              </button>
            </div>
            <div className="patch-imitator-status">
              <span className={`patch-analysis-badge is-${result.status}`}>{result.status}</span>
              {result.error && <span className="patch-analysis-error">{result.error}</span>}
            </div>
            <div className="patch-imitator-moves">
              {result.status === 'running' && (
                <div className="patch-analysis-empty">Analyzing...</div>
              )}
              {result.status !== 'running' && moves.length === 0 && (
                <div className="patch-analysis-empty">No moves yet.</div>
              )}
              {moves.map((move, idx) => (
                <div key={`${target.id}-${idx}`} className="patch-imitator-row">
                  <div className="patch-imitator-prob">{formatProbability(move.probability)}</div>
                  <div
                    className={`patch-imitator-move${Array.isArray(move.flags) && move.flags.includes('inaccuracy')
                      ? ' is-inaccuracy'
                      : ''}`}
                  >
                    {move.move || move.uci}
                    {move.tags && move.tags.length > 0 && (
                      <span className="patch-imitator-tags">{formatTags(move.tags)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="patch-sidebar-content">
      <div className="patch-sidebar-tabs">
        <button
          type="button"
          className={`patch-sidebar-tab${activeTab === 'chapters' ? ' is-active' : ''}`}
          onClick={() => setActiveTab('chapters')}
        >
          Chapters
        </button>
        <button
          type="button"
          className={`patch-sidebar-tab${activeTab === 'analysis' ? ' is-active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          Analysis
        </button>
        <button
          type="button"
          className={`patch-sidebar-tab${activeTab === 'imitator' ? ' is-active' : ''}`}
          onClick={() => setActiveTab('imitator')}
        >
          Imitator
        </button>
      </div>

      {activeTab === 'chapters' && (
        <ChapterList
          chapters={chapters}
          currentChapterId={currentChapterId}
          onSelectChapter={onSelectChapter}
          onCreateChapter={onCreateChapter}
          onRenameChapter={onRenameChapter}
          onDeleteChapter={onDeleteChapter}
          onReorderChapters={onReorderChapters}
        />
      )}

      {activeTab === 'analysis' && (
        <div className="patch-analysis-scroll">
          <div className="patch-analysis-settings">
            <div className="patch-analysis-field">
              <span className="patch-analysis-label">Depth</span>
              <select value={depth} onChange={(e) => setDepth(Number(e.target.value))}>
                {[8, 10, 12, 14, 16, 18, 20].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="patch-analysis-field">
              <span className="patch-analysis-label">Lines</span>
              <select value={multipv} onChange={(e) => setMultipv(Number(e.target.value))}>
                {[1, 2, 3, 4, 5].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="patch-analysis-toggle">
              <label className="patch-toggle">
                <input
                  type="checkbox"
                  checked={engineEnabled}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setEngineEnabled(enabled);
                    if (enabled) {
                      setEngineMode('sf');
                      setCloudBlocked(false);
                      setEngineNotice(null);
                    }
                  }}
                  aria-label="Engine"
                />
                <span className="patch-toggle-track" />
              </label>
            </div>
            <div className="patch-analysis-field">
              <span className="patch-analysis-label">Engine</span>
              <select
                value={engineMode}
                disabled={!engineEnabled}
                onChange={(e) => {
                  setEngineMode(e.target.value as 'cloud' | 'sf');
                  setCloudBlocked(false);
                  setEngineNotice(null);
                }}
              >
                <option value="cloud">Lichess Cloud</option>
                <option value="sf">SFCata</option>
              </select>
            </div>
          </div>
          {renderAnalysis()}
        </div>
      )}

      {activeTab === 'imitator' && (
        <div className="patch-analysis-scroll">
          <div className="patch-imitator-settings">
            <div className="patch-imitator-field">
              <span className="patch-analysis-label">Add Coach</span>
              <select
                value={selectedCoach}
                onChange={(e) => setSelectedCoach(e.target.value)}
                disabled={coachStatus !== 'ready'}
              >
                {coachStatus === 'loading' && <option>Loading...</option>}
                {coachStatus === 'error' && <option>Unavailable</option>}
                {coachStatus === 'ready' &&
                  coachOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
              </select>
            </div>
            <button
              type="button"
              className="patch-imitator-add"
              disabled={!selectedCoach || coachStatus !== 'ready'}
              onClick={() => {
                const name = selectedCoach;
                if (!name) return;
                const id = `coach:${name}`;
                setImitatorTargets((prev) => {
                  if (prev.some((item) => item.id === id)) return prev;
                  return [
                    ...prev,
                    {
                      id,
                      label: name,
                      source: 'library',
                      player: name,
                      kind: 'coach',
                    },
                  ];
                });
              }}
            >
              Add
            </button>
            <div className="patch-imitator-field">
              <span className="patch-analysis-label">Add Players</span>
              <select
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                disabled={playerStatus !== 'ready'}
              >
                {playerStatus === 'loading' && <option>Loading...</option>}
                {playerStatus === 'error' && <option>Unavailable</option>}
                {playerStatus === 'ready' &&
                  playerOptions.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
              </select>
            </div>
            <button
              type="button"
              className="patch-imitator-add"
              disabled={!selectedPlayer || playerStatus !== 'ready'}
              onClick={() => {
                const player = playerOptions.find((item) => item.id === selectedPlayer);
                if (!player) return;
                const id = `player:${player.id}`;
                setImitatorTargets((prev) => {
                  if (prev.some((item) => item.id === id)) return prev;
                  return [
                    ...prev,
                    {
                      id,
                      label: player.name,
                      source: 'user',
                      playerId: player.id,
                      kind: 'player',
                    },
                  ];
                });
              }}
            >
              Add
            </button>
            <div className="patch-imitator-field">
              <span className="patch-analysis-label">Add Engine</span>
              <select
                value={selectedEngine}
                onChange={(e) => setSelectedEngine(e.target.value as 'cloud' | 'sf')}
              >
                <option value="cloud">Lichess Cloud</option>
                <option value="sf">SFCata</option>
              </select>
            </div>
            <button
              type="button"
              className="patch-imitator-add"
              onClick={() => {
                const engine = selectedEngine;
                const label = engine === 'sf' ? 'SFCata' : 'Lichess Cloud';
                const id = `engine:${engine}`;
                setImitatorTargets((prev) => {
                  if (prev.some((item) => item.id === id)) return prev;
                  return [
                    ...prev,
                    {
                      id,
                      label,
                      engine,
                      kind: 'engine',
                    },
                  ];
                });
              }}
            >
              Add
            </button>
          </div>
          {(coachError || playerError) && (
            <div className="patch-analysis-error">
              {coachError || playerError}
            </div>
          )}
          {renderImitatorPanel()}
        </div>
      )}
    </div>
  );
}

export default StudySidebar;

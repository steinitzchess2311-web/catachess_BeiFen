import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../../engine/client';
import type { EngineLine } from '../../engine/types';
import { formatScore } from '../utils/formatters';
import { resolveTaggerBase } from '../utils/config';

export interface ImitatorTarget {
  id: string;
  label: string;
  source?: 'library' | 'user';
  player?: string;
  playerId?: string;
  engine?: 'auto';
  kind: 'coach' | 'player' | 'engine';
}

export interface ImitatorMove {
  move: string;
  uci?: string;
  score_cp?: number | null;
  tags?: string[];
  probability?: number;
  flags?: string[];
}

export interface ImitatorResult {
  status: 'idle' | 'running' | 'ready' | 'error';
  moves: ImitatorMove[];
  updated?: number;
  error?: string | null;
}

export interface UseImitatorOptions {
  enabled: boolean;
  fen: string;
  depth: number;
  multipv: number;
}

export interface UseImitatorResult {
  // Coach management
  coachOptions: string[];
  selectedCoach: string;
  setSelectedCoach: (coach: string) => void;
  coachStatus: 'idle' | 'loading' | 'ready' | 'error';
  coachError: string | null;

  // Player management
  playerOptions: Array<{ id: string; name: string }>;
  selectedPlayer: string;
  setSelectedPlayer: (playerId: string) => void;
  playerStatus: 'idle' | 'loading' | 'ready' | 'error';
  playerError: string | null;

  // Engine selection
  selectedEngine: 'auto';
  setSelectedEngine: (engine: 'auto') => void;

  // Target management
  targets: ImitatorTarget[];
  addTarget: (target: ImitatorTarget) => void;
  removeTarget: (targetId: string) => void;

  // Results
  results: Record<string, ImitatorResult>;
}

const TAGGER_BASE = resolveTaggerBase();

/**
 * Hook for managing imitator functionality
 */
export function useImitator({
  enabled,
  fen,
  depth,
  multipv,
}: UseImitatorOptions): UseImitatorResult {
  const [coachOptions, setCoachOptions] = useState<string[]>([]);
  const [playerOptions, setPlayerOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [coachStatus, setCoachStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [playerStatus, setPlayerStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [coachError, setCoachError] = useState<string | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedEngine, setSelectedEngine] = useState<'auto'>('auto');
  const [targets, setTargets] = useState<ImitatorTarget[]>([]);
  const [results, setResults] = useState<Record<string, ImitatorResult>>({});
  const requestRef = useRef(0);

  // Load coaches
  useEffect(() => {
    if (!enabled) return;
    if (coachStatus !== 'idle') return;

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

    void loadCoaches();
  }, [enabled, coachStatus, selectedCoach]);

  // Load players
  useEffect(() => {
    if (!enabled) return;
    if (playerStatus !== 'idle') return;

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

    void loadPlayers();
  }, [enabled, playerStatus, selectedPlayer]);

  // Analyze position for all targets
  useEffect(() => {
    if (!enabled || !fen || targets.length === 0) return;

    const currentRequest = requestRef.current + 1;
    requestRef.current = currentRequest;

    setResults((prev) => {
      const next = { ...prev };
      for (const target of targets) {
        next[target.id] = {
          ...next[target.id],
          status: 'running',
          error: null,
        };
      }
      return next;
    });

    const run = async () => {
      const tasks = targets.map(async (target) => {
        if (target.kind === 'engine') {
          const payload = {
            fen,
            depth,
            multipv,
            engine: target.engine ?? 'auto',
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
          const moves = lines.reduce<ImitatorMove[]>((acc, line) => {
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
          fen,
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

      const taskResults = await Promise.allSettled(tasks);
      if (requestRef.current !== currentRequest) return;

      setResults((prev) => {
        const next = { ...prev };
        taskResults.forEach((result, index) => {
          const target = targets[index];
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
  }, [enabled, fen, targets, depth, multipv]);

  const addTarget = (target: ImitatorTarget) => {
    setTargets((prev) => {
      if (prev.some((item) => item.id === target.id)) return prev;
      return [...prev, target];
    });
  };

  const removeTarget = (targetId: string) => {
    setTargets((prev) => prev.filter((item) => item.id !== targetId));
    setResults((prev) => {
      const next = { ...prev };
      delete next[targetId];
      return next;
    });
  };

  return {
    coachOptions,
    selectedCoach,
    setSelectedCoach,
    coachStatus,
    coachError,
    playerOptions,
    selectedPlayer,
    setSelectedPlayer,
    playerStatus,
    playerError,
    selectedEngine,
    setSelectedEngine,
    targets,
    addTarget,
    removeTarget,
    results,
  };
}

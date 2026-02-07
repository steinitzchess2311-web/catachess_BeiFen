import React from 'react';
import type { ImitatorTarget, ImitatorResult } from '../hooks/useImitator';
import { formatProbability, formatTags } from '../utils/formatters';

export interface ImitatorPanelProps {
  targets: ImitatorTarget[];
  results: Record<string, ImitatorResult>;
  onRemoveTarget: (targetId: string) => void;
}

export function ImitatorPanel({ targets, results, onRemoveTarget }: ImitatorPanelProps) {
  if (targets.length === 0) {
    return (
      <div className="patch-analysis-panel patch-imitator-panel">
        <div className="patch-analysis-empty">
          Add a coach, player, or engine to generate style-guided moves.
        </div>
      </div>
    );
  }

  return (
    <div className="patch-analysis-panel patch-imitator-panel">
      {targets.map((target) => {
        const result = results[target.id] || { status: 'idle', moves: [] };
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
                onClick={() => onRemoveTarget(target.id)}
              >
                Remove
              </button>
            </div>
            <div className="patch-imitator-status">
              <span className={`patch-analysis-badge is-${result.status}`}>{result.status}</span>
              {result.error && <span className="patch-analysis-error">{result.error}</span>}
            </div>
            <div className="patch-imitator-moves">
              {result.status === 'running' && <div className="patch-analysis-empty">Analyzing...</div>}
              {result.status !== 'running' && moves.length === 0 && (
                <div className="patch-analysis-empty">No moves yet.</div>
              )}
              {moves.map((move, idx) => (
                <div key={`${target.id}-${idx}`} className="patch-imitator-row">
                  <div className="patch-imitator-prob">{formatProbability(move.probability)}</div>
                  <div
                    className={`patch-imitator-move${
                      Array.isArray(move.flags) && move.flags.includes('inaccuracy')
                        ? ' is-inaccuracy'
                        : ''
                    }`}
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
}

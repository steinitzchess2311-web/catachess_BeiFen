import React from 'react';
import type { EngineLine } from '../../engine/types';
import { formatScore } from '../utils/formatters';

export interface AnalysisPanelProps {
  engineEnabled: boolean;
  lines: Array<EngineLine & { sanText?: string }>;
  status: 'idle' | 'running' | 'ready' | 'error';
  health: 'unknown' | 'ok' | 'down';
  error: string | null;
  lastUpdated: number | null;
  engineOrigin: string | null;
}

export function AnalysisPanel({
  engineEnabled,
  lines,
  status,
  health,
  error,
  lastUpdated,
  engineOrigin,
}: AnalysisPanelProps) {
  return (
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
        {engineOrigin && <span className="patch-analysis-source">{engineOrigin}</span>}
        {lastUpdated && (
          <span className="patch-analysis-updated">
            {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        )}
      </div>
      {error && <div className="patch-analysis-error">{error}</div>}
      <div className="patch-analysis-lines">
        {!engineEnabled && (
          <div className="patch-analysis-empty">No analysis yet. Turn on engine to analyze.</div>
        )}
        {engineEnabled && lines.length === 0 && (
          <div className="patch-analysis-empty">No analysis yet.</div>
        )}
        {(() => {
          const linesRenderStart = performance.now();
          console.log(`[RENDER PERF] ===== Rendering ${lines.length} analysis lines =====`);

          const elements = lines.map((line, index) => {
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
            console.log(
              `[RENDER PERF] Line ${index + 1}/${lines.length}: ${lineRenderDuration.toFixed(3)}ms`
            );
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
}

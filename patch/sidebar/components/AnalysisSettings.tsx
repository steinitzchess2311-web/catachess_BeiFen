import React from 'react';

export interface AnalysisSettingsProps {
  depth: number;
  onDepthChange: (depth: number) => void;
  multipv: number;
  onMultipvChange: (multipv: number) => void;
  engineEnabled: boolean;
  onEngineEnabledChange: (enabled: boolean) => void;
}

export function AnalysisSettings({
  depth,
  onDepthChange,
  multipv,
  onMultipvChange,
  engineEnabled,
  onEngineEnabledChange,
}: AnalysisSettingsProps) {
  return (
    <div className="patch-analysis-settings">
      <div className="patch-analysis-field">
        <span className="patch-analysis-label">Depth</span>
        <select value={depth} onChange={(e) => onDepthChange(Number(e.target.value))}>
          {[8, 10, 12, 14, 16, 18, 20].map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div className="patch-analysis-field">
        <span className="patch-analysis-label">Lines</span>
        <select value={multipv} onChange={(e) => onMultipvChange(Number(e.target.value))}>
          {[1, 2, 3, 4, 5].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div className="patch-analysis-toggle">
        <label className="patch-toggle">
          <input
            type="checkbox"
            checked={engineEnabled}
            onChange={(e) => onEngineEnabledChange(e.target.checked)}
            aria-label="Engine"
          />
          <span className="patch-toggle-track" />
        </label>
      </div>
      <div className="patch-analysis-field">
        <span className="patch-analysis-label">Engine</span>
        <span className="patch-analysis-value">Auto</span>
      </div>
    </div>
  );
}

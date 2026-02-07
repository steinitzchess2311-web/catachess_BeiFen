import React from 'react';
import type { ImitatorTarget } from '../hooks/useImitator';

export interface ImitatorSettingsProps {
  // Coach
  coachOptions: string[];
  selectedCoach: string;
  onCoachChange: (coach: string) => void;
  coachStatus: 'idle' | 'loading' | 'ready' | 'error';
  onAddCoach: () => void;

  // Player
  playerOptions: Array<{ id: string; name: string }>;
  selectedPlayer: string;
  onPlayerChange: (playerId: string) => void;
  playerStatus: 'idle' | 'loading' | 'ready' | 'error';
  onAddPlayer: () => void;

  // Engine
  selectedEngine: 'auto';
  onEngineChange: (engine: 'auto') => void;
  onAddEngine: () => void;

  // Errors
  coachError: string | null;
  playerError: string | null;
}

export function ImitatorSettings({
  coachOptions,
  selectedCoach,
  onCoachChange,
  coachStatus,
  onAddCoach,
  playerOptions,
  selectedPlayer,
  onPlayerChange,
  playerStatus,
  onAddPlayer,
  selectedEngine,
  onEngineChange,
  onAddEngine,
  coachError,
  playerError,
}: ImitatorSettingsProps) {
  return (
    <>
      <div className="patch-imitator-settings">
        <div className="patch-imitator-field">
          <span className="patch-analysis-label">Add Coach</span>
          <select
            value={selectedCoach}
            onChange={(e) => onCoachChange(e.target.value)}
            disabled={coachStatus !== 'ready'}
          >
            {coachStatus === 'loading' && <option>Loading...</option>}
            {coachStatus === 'error' && <option>Unavailable</option>}
            {coachStatus === 'ready' &&
              coachOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
          </select>
        </div>
        <button
          type="button"
          className="patch-imitator-add"
          disabled={!selectedCoach || coachStatus !== 'ready'}
          onClick={onAddCoach}
        >
          Add
        </button>
        <div className="patch-imitator-field">
          <span className="patch-analysis-label">Add Players</span>
          <select
            value={selectedPlayer}
            onChange={(e) => onPlayerChange(e.target.value)}
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
          onClick={onAddPlayer}
        >
          Add
        </button>
        <div className="patch-imitator-field">
          <span className="patch-analysis-label">Add Engine</span>
          <select value={selectedEngine} onChange={(e) => onEngineChange(e.target.value as 'auto')}>
            <option value="auto">Auto</option>
          </select>
        </div>
        <button type="button" className="patch-imitator-add" onClick={onAddEngine}>
          Add
        </button>
      </div>
      {(coachError || playerError) && (
        <div className="patch-analysis-error">{coachError || playerError}</div>
      )}
    </>
  );
}

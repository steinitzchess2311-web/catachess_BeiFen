import React from "react";
import ProgressBar from "./ProgressBar";

type UploadPanelProps = {
  status: string;
  processedPositions: number;
  failedGames: number;
  needsConfirmation: boolean;
  onUpload: (file: File) => void;
  uploading: boolean;
  logs: string[];
};

const UploadPanel: React.FC<UploadPanelProps> = ({
  status,
  processedPositions,
  failedGames,
  needsConfirmation,
  onUpload,
  uploading,
  logs,
}) => {
  const percent = Math.min(100, processedPositions ? 100 : 12);

  return (
    <div className="tagger-panel">
      <h2>Import PGN</h2>
      <label className="tagger-upload">
        <input
          type="file"
          accept=".pgn"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(file);
            event.currentTarget.value = "";
          }}
        />
        <span>{uploading ? "Uploading..." : "Drag or select PGN"}</span>
      </label>
      <ProgressBar value={percent} />
      <div className="tagger-upload-meta">
        <div>
          <span>Status</span>
          <strong>{status || "Idle"}</strong>
        </div>
        <div>
          <span>Processed positions</span>
          <strong>{processedPositions}</strong>
        </div>
        <div>
          <span>Failed games</span>
          <strong>{failedGames}</strong>
        </div>
      </div>
      <div className="tagger-log">
        <span>Parse log</span>
        {logs.length ? (
          logs.map((line, index) => (
            <div key={`${line}-${index}`} className="tagger-log-line">
              {line}
            </div>
          ))
        ) : (
          <div className="tagger-log-line muted">No logs yet.</div>
        )}
      </div>
      {needsConfirmation && (
        <div className="tagger-warning">
          Name match is ambiguous. Confirm the correct player to continue.
        </div>
      )}
    </div>
  );
};

export default UploadPanel;

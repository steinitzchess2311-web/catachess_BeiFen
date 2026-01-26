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
  uploadProgress: number;
  processedGames: number;
  totalGames: number;
  taggerMode: "cut" | "blackbox";
  onTaggerModeChange: (mode: "cut" | "blackbox") => void;
};

const UploadPanel: React.FC<UploadPanelProps> = ({
  status,
  processedPositions,
  failedGames,
  needsConfirmation,
  onUpload,
  uploading,
  logs,
  uploadProgress,
  processedGames,
  totalGames,
  taggerMode,
  onTaggerModeChange,
}) => {
  const processingPercent =
    totalGames > 0 ? Math.round((processedGames / totalGames) * 100) : 0;

  return (
    <div className="tagger-panel">
      <h2>Import PGN</h2>
      <div className="tagger-mode">
        <div className="tagger-mode-header">
          <div>
            <span className="tagger-mode-label">Tagger Mode</span>
            <p className="tagger-mode-copy">
              Choose the engine used to generate tags for this upload.
            </p>
          </div>
          <span className="tagger-mode-pill">
            {taggerMode === "blackbox" ? "Blackbox" : "Cut"}
          </span>
        </div>
        <div className="tagger-mode-options">
          <button
            type="button"
            className={taggerMode === "cut" ? "active" : ""}
            onClick={() => onTaggerModeChange("cut")}
            disabled={uploading}
          >
            Cut (fast)
          </button>
          <button
            type="button"
            className={taggerMode === "blackbox" ? "active" : ""}
            onClick={() => onTaggerModeChange("blackbox")}
            disabled={uploading}
          >
            Blackbox (full)
          </button>
        </div>
        <p className="tagger-mode-help">
          Cut = current production tagger. Blackbox = full rule_tagger_lichessbot
          pipeline. Applies to the next upload.
        </p>
      </div>
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
      <div className="tagger-progress-block">
        <div className="tagger-progress-label">
          <span>PGN Upload</span>
          <span>{uploadProgress}%</span>
        </div>
        <ProgressBar value={uploadProgress} />
      </div>
      <div className="tagger-progress-block">
        <div className="tagger-progress-label">
          <span>Processed Games</span>
          <span>
            {totalGames > 0 ? `${processedGames}/${totalGames}` : "0/0"}
          </span>
        </div>
        <ProgressBar value={processingPercent} />
      </div>
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

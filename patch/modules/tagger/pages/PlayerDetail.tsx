import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import UploadPanel from "../components/UploadPanel";
import StatsTable from "../components/StatsTable";
import ConfirmMatchModal from "../components/ConfirmMatchModal";
import { taggerApi, Player, Upload, StatsList } from "../api/taggerApi";
import "../styles/tagger.css";

const PlayerDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [stats, setStats] = useState<StatsList | null>(null);
  const [activeTab, setActiveTab] = useState<"total" | "white" | "black">("total");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const fetchAll = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const [playerRes, uploadsRes, statsRes] = await Promise.all([
        taggerApi.getPlayer(id),
        taggerApi.listUploads(id),
        taggerApi.getStats(id),
      ]);
      setPlayer(playerRes);
      setUploads(uploadsRes.uploads || []);
      setStats(statsRes);
    } catch (err: any) {
      setError(err?.message || "Failed to load player.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [id]);

  const statusLabel = useMemo(() => uploads[0]?.status || "Idle", [uploads]);
  const activeStats = stats?.[activeTab];
  const totalPositions = stats?.total?.stats?.[0]?.total_positions ?? 0;
  const needsConfirmation = uploads[0]?.needs_confirmation ?? false;
  const candidates = uploads[0]?.match_candidates ?? [];
  const logs = uploads[0]
    ? [
        `Status: ${uploads[0].status}`,
        `Processed positions: ${uploads[0].processed_positions}`,
        `Failed games: ${uploads[0].failed_games_count}`,
        `Last updated: ${new Date(uploads[0].last_updated).toLocaleString()}`,
      ]
    : [];

  const handleUpload = async (file: File) => {
    if (!id) return;
    setUploading(true);
    setError("");
    try {
      await taggerApi.uploadPgn(id, file);
      await fetchAll();
    } catch (err: any) {
      setError(err?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleExport = async (format: "csv" | "json") => {
    if (!id) return;
    try {
      const blob = await taggerApi.exportStats(id, format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${id}_stats.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || "Export failed.");
    }
  };

  if (loading) {
    return <div className="tagger-page tagger-loading">Loading player...</div>;
  }

  if (!player) {
    return (
      <div className="tagger-page tagger-loading">
        <p>Player not found.</p>
        <button className="tagger-back" onClick={() => navigate("/players")}>
          Back to Players
        </button>
      </div>
    );
  }

  return (
    <section className="tagger-page">
      <div className="tagger-detail-hero">
        <div>
          <button className="tagger-back" onClick={() => navigate("/players")}>
            ← Players
          </button>
          <h1>{player.display_name}</h1>
          <p>
            {player.aliases?.length
              ? `Aliases: ${player.aliases.join(", ")}`
              : "No aliases registered yet."}
          </p>
        </div>
        <div className="tagger-status">
          <span>Status</span>
          <strong>{statusLabel}</strong>
          <small>{totalPositions} positions analyzed</small>
        </div>
      </div>

      <div className="tagger-columns">
        <UploadPanel
          status={statusLabel}
          processedPositions={uploads[0]?.processed_positions ?? 0}
          failedGames={uploads[0]?.failed_games_count ?? 0}
          needsConfirmation={needsConfirmation}
          onUpload={handleUpload}
          uploading={uploading}
          logs={logs}
        />
        <div className="tagger-panel tagger-panel-wide">
          <div className="tagger-panel-header">
            <h2>Tag Breakdown</h2>
            <div className="tagger-tabs">
              {(["total", "white", "black"] as const).map((scope) => (
                <button
                  key={scope}
                  className={activeTab === scope ? "active" : ""}
                  onClick={() => setActiveTab(scope)}
                >
                  {scope}
                </button>
              ))}
            </div>
          </div>

          {activeStats ? (
            <>
              <div className="tagger-meta">
                <div>
                  Engine {activeStats.engine_version} · depth {activeStats.depth}
                  · multipv {activeStats.multipv}
                </div>
                <div>Updated {new Date(activeStats.updated_at).toLocaleString()}</div>
              </div>
              <StatsTable stats={activeStats.stats} />
            </>
          ) : (
            <div className="tagger-empty">No stats yet. Upload a PGN to begin.</div>
          )}

          <div className="tagger-actions">
            <button onClick={() => handleExport("csv")}>Export CSV</button>
            <button onClick={() => handleExport("json")}>Export JSON</button>
          </div>
          {error && <div className="tagger-error">{error}</div>}
        </div>
      </div>

      <ConfirmMatchModal
        open={needsConfirmation && showModal}
        candidates={candidates}
        onClose={() => setShowModal(false)}
      />
      {needsConfirmation && (
        <button className="tagger-confirm" onClick={() => setShowModal(true)}>
          Review Match Candidates
        </button>
      )}
    </section>
  );
};

export default PlayerDetail;

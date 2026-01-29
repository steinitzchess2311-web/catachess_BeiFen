import React, { useEffect, useState } from "react";
import PlayerCard from "../components/PlayerCard";
import { taggerApi, Player, StatsList } from "../api/taggerApi";
import "../styles/tagger.css";

const PlayersIndex: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [displayName, setDisplayName] = useState("");

  const fetchPlayers = async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const response = await taggerApi.listPlayers(signal);
      setPlayers(response.players || []);
    } catch (err: any) {
      if (signal?.aborted) return;
      setError(err?.message || "Failed to load players.");
    } finally {
      if (signal?.aborted) return;
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchPlayers(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!players.length) return;
    const controller = new AbortController();

    const fetchStats = async () => {
      const updates: Record<string, number> = {};
      await Promise.all(
        players.map(async (player) => {
          try {
            const stats: StatsList = await taggerApi.getStats(player.id, controller.signal);
            updates[player.id] = stats?.total?.stats?.[0]?.total_positions ?? 0;
          } catch {
            updates[player.id] = 0;
          }
        })
      );
      if (!controller.signal.aborted) {
        setStatsMap((prev) => ({ ...prev, ...updates }));
      }
    };

    fetchStats();
    return () => {
      controller.abort();
    };
  }, [players]);

  const createPlayer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!displayName.trim()) return;
    setCreating(true);
    setError("");
    try {
      await taggerApi.createPlayer(displayName.trim(), []);
      setDisplayName("");
      await fetchPlayers();
    } catch (err: any) {
      setError(err?.message || "Failed to create player.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="tagger-page">
      <div className="tagger-hero">
        <div className="tagger-hero-copy">
          <span className="tagger-kicker">Players</span>
          <h1>Build the style map.</h1>
          <p>
            Create player profiles, ingest PGNs, and watch white/black/total tags
            crystallize into a signature fingerprint.
          </p>
        </div>
        <div className="tagger-panel">
          <form className="tagger-form" onSubmit={createPlayer}>
            <div>
              <label>Player Name</label>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="e.g. Lou Yiping"
              />
            </div>
            <button type="submit" disabled={creating}>
              {creating ? "Creating..." : "New Player"}
            </button>
          </form>
          {error && <div className="tagger-error">{error}</div>}
        </div>
      </div>

      {loading ? (
        <div className="tagger-empty">Loading players...</div>
      ) : !players.length ? (
        <div className="tagger-empty">No players yet. Create one to begin.</div>
      ) : (
        <div className="tagger-grid">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              id={player.id}
              name={player.display_name}
              aliases={player.aliases}
              analyzed={statsMap[player.id] ?? 0}
              updatedAt={player.updated_at}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default PlayersIndex;

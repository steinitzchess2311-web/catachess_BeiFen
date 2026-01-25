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
  const [aliases, setAliases] = useState("");

  const fetchPlayers = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await taggerApi.listPlayers();
      setPlayers(response.players || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load players.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  useEffect(() => {
    if (!players.length) return;
    let cancelled = false;

    const fetchStats = async () => {
      const updates: Record<string, number> = {};
      await Promise.all(
        players.map(async (player) => {
          try {
            const stats: StatsList = await taggerApi.getStats(player.id);
            updates[player.id] = stats?.total?.stats?.[0]?.total_positions ?? 0;
          } catch {
            updates[player.id] = 0;
          }
        })
      );
      if (!cancelled) {
        setStatsMap((prev) => ({ ...prev, ...updates }));
      }
    };

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, [players]);

  const createPlayer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!displayName.trim()) return;
    setCreating(true);
    setError("");
    try {
      const aliasList = aliases
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      await taggerApi.createPlayer(displayName.trim(), aliasList);
      setDisplayName("");
      setAliases("");
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
            <div>
              <label>Aliases (comma separated)</label>
              <input
                value={aliases}
                onChange={(event) => setAliases(event.target.value)}
                placeholder="Optional"
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

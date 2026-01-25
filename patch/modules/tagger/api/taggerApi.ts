import { api } from "@ui/assets/api";

const resolveBaseURL = () =>
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:8000"
    : "https://api.catachess.com";

export type Player = {
  id: string;
  display_name: string;
  aliases: string[];
  created_at: string;
  updated_at: string;
};

export type Upload = {
  id: string;
  status: string;
  processed_positions: number;
  failed_games_count: number;
  last_updated: string;
  needs_confirmation: boolean;
  match_candidates: Array<Record<string, any>>;
};

export type TagStatItem = {
  tag_name: string;
  tag_count: number;
  total_positions: number;
  percentage: number;
};

export type StatsResponse = {
  scope: string;
  stats: TagStatItem[];
  engine_version: string;
  depth: number;
  multipv: number;
  updated_at: string;
};

export type StatsList = {
  white?: StatsResponse;
  black?: StatsResponse;
  total?: StatsResponse;
};

export const taggerApi = {
  async listPlayers() {
    return api.get("/api/tagger/players?offset=0&limit=50");
  },
  async createPlayer(displayName: string, aliases: string[]) {
    return api.post("/api/tagger/players", {
      display_name: displayName,
      aliases,
    });
  },
  async getPlayer(id: string) {
    return api.get(`/api/tagger/players/${id}`);
  },
  async listUploads(playerId: string) {
    return api.get(`/api/tagger/players/${playerId}/uploads`);
  },
  async getStats(playerId: string) {
    return api.get(`/api/tagger/players/${playerId}/stats`);
  },
  async uploadPgn(playerId: string, file: File) {
    const token =
      localStorage.getItem("catachess_token") ||
      sessionStorage.getItem("catachess_token");
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${resolveBaseURL()}/api/tagger/players/${playerId}/uploads`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });
    if (!response.ok) {
      const message = await response.json().catch(() => ({}));
      throw new Error(message?.detail || "Upload failed");
    }
    return response.json();
  },
  async exportStats(playerId: string, format: "csv" | "json") {
    const token =
      localStorage.getItem("catachess_token") ||
      sessionStorage.getItem("catachess_token");
    const response = await fetch(
      `${resolveBaseURL()}/api/tagger/players/${playerId}/exports?format=${format}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
    if (!response.ok) {
      throw new Error("Export failed");
    }
    return response.blob();
  },
};

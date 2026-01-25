import { api } from "@ui/assets/api";

const resolveBaseURL = () => {
  const envBase = import.meta.env.VITE_API_BASE as string | undefined;
  if (envBase) return envBase;
  return window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
    ? "http://localhost:8000"
    : "https://api.catachess.com";
};

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
  total_games?: number;
  processed_games?: number;
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

export type FailedGameItem = {
  game_index: number;
  headers?: Record<string, string>;
  player_color?: string | null;
  move_count: number;
  error_code: string;
  error_message?: string | null;
  retry_count: number;
  last_attempt_at?: string | null;
};

export type FailedGamesResponse = {
  upload_id: string;
  failed_games: FailedGameItem[];
  total: number;
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
  async getFailedGames(playerId: string, uploadId: string) {
    return api.get(`/api/tagger/players/${playerId}/uploads/${uploadId}/failed`);
  },
  async uploadPgn(playerId: string, file: File, onProgress?: (value: number) => void) {
    const token =
      localStorage.getItem("catachess_token") ||
      sessionStorage.getItem("catachess_token");
    const formData = new FormData();
    formData.append("file", file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${resolveBaseURL()}/api/tagger/players/${playerId}/uploads`, true);
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            resolve({});
          }
        } else {
          reject(new Error("Upload failed"));
        }
      };
      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.send(formData);
    });
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

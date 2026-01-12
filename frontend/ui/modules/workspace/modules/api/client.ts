import { createIdempotencyKey } from "./idempotency.js";

export interface ApiConfig {
  baseUrl: string;
  token?: string | null;
}

export class ApiClient {
  private baseUrl: string;
  private token?: string | null;

  constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl;
    this.token = config.token;
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  async request<T>(method: string, path: string, body?: any): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    if (["POST", "PUT", "PATCH"].includes(method)) {
      headers["X-Idempotency-Key"] = createIdempotencyKey();
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API ${method} ${path} failed: ${response.status}`);
    }

    return (await response.json()) as T;
  }
}

let sharedClient: ApiClient | null = null;

export function getApiClient(baseUrl: string, token?: string | null): ApiClient {
  if (!sharedClient) {
    sharedClient = new ApiClient({ baseUrl, token });
  }
  if (token !== undefined) {
    sharedClient.setToken(token);
  }
  return sharedClient;
}

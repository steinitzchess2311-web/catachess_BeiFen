import { routeEvent } from "./eventRouter.js";

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export class WorkspaceSocket {
  private url: string;
  private socket: WebSocket | null = null;
  private status: ConnectionStatus = "disconnected";
  private retries = 0;
  private maxRetries = 5;
  private listeners: Set<(status: ConnectionStatus) => void> = new Set();

  constructor(url: string) {
    this.url = url;
  }

  connect(): void {
    if (this.socket && this.status === "connected") {
      return;
    }

    this.setStatus("connecting");
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      this.retries = 0;
      this.setStatus("connected");
    };

    this.socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        routeEvent(payload);
      } catch (error) {
        console.warn("WS message parse failed", error);
      }
    };

    this.socket.onclose = () => {
      this.setStatus("disconnected");
      this.retry();
    };

    this.socket.onerror = () => {
      this.setStatus("error");
    };
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.setStatus("disconnected");
    }
  }

  subscribe(handler: (status: ConnectionStatus) => void): () => void {
    this.listeners.add(handler);
    handler(this.status);
    return () => this.listeners.delete(handler);
  }

  sendJson(payload: Record<string, any>): void {
    if (this.socket && this.status === "connected") {
      this.socket.send(JSON.stringify(payload));
    }
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.listeners.forEach((handler) => handler(status));
  }

  private retry(): void {
    if (this.retries >= this.maxRetries) {
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.retries), 10000);
    this.retries += 1;
    setTimeout(() => this.connect(), delay);
  }
}

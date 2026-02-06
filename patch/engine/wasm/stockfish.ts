import type { EngineAnalysis, EngineLine } from '../types';
import { parseSfInfoLine, type SfEntry } from '../parsers';

const DEFAULT_WORKER_URL = '/stockfish.js';
const DEFAULT_TIMEOUT_MS = 30000;

function resolveWorkerUrl(): string {
  try {
    const env = (import.meta as any)?.env;
    const url = env?.VITE_STOCKFISH_WORKER_URL || env?.VITE_STOCKFISH_WASM_URL;
    if (url) return url as string;
  } catch {
    // ignore
  }
  return DEFAULT_WORKER_URL;
}

function normalizeWorkerMessage(event: MessageEvent): string {
  const data = (event as MessageEvent).data;
  if (typeof data === 'string') return data;
  if (typeof data?.data === 'string') return data.data;
  return '';
}

function buildLines(entries: SfEntry[]): EngineLine[] {
  if (entries.length === 0) return [];
  const maxDepth = Math.max(...entries.map((e) => e.depth));
  const perMultipv = new Map<number, SfEntry>();

  for (const entry of entries) {
    if (entry.depth !== maxDepth) continue;
    const existing = perMultipv.get(entry.multipv);
    if (!existing || entry.depth >= existing.depth) {
      perMultipv.set(entry.multipv, entry);
    }
  }

  if (perMultipv.size === 0) {
    for (const entry of entries) {
      const existing = perMultipv.get(entry.multipv);
      if (!existing || entry.depth > existing.depth) {
        perMultipv.set(entry.multipv, entry);
      }
    }
  }

  return Array.from(perMultipv.values())
    .sort((a, b) => a.multipv - b.multipv)
    .map((entry) => ({
      multipv: entry.multipv,
      score: entry.score,
      pv: entry.pv,
    }));
}

class StockfishWasmWorker {
  private worker: Worker | null = null;
  private readyPromise: Promise<void> | null = null;
  private queue: Promise<EngineAnalysis> = Promise.resolve({ source: 'stockfish-wasm', lines: [] });

  private ensureWorker(): Worker {
    if (this.worker) return this.worker;
    const url = resolveWorkerUrl();
    this.worker = new Worker(url);
    return this.worker;
  }

  private async ensureReady(): Promise<void> {
    if (this.readyPromise) return this.readyPromise;

    const worker = this.ensureWorker();
    this.readyPromise = new Promise((resolve, reject) => {
      const onMessage = (event: MessageEvent) => {
        const line = normalizeWorkerMessage(event);
        if (line === 'uciok') {
          worker.postMessage('isready');
          return;
        }
        if (line === 'readyok') {
          cleanup();
          resolve();
        }
      };

      const onError = (event: Event) => {
        cleanup();
        reject(new Error(`Stockfish WASM worker error: ${String(event)}`));
      };

      const cleanup = () => {
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
      };

      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onError);
      worker.postMessage('uci');
    });

    return this.readyPromise;
  }

  private async runExclusive(task: () => Promise<EngineAnalysis>): Promise<EngineAnalysis> {
    const run = this.queue.then(task, task);
    this.queue = run.catch(() => ({ source: 'stockfish-wasm', lines: [] }));
    return run;
  }

  async analyze(fen: string, depth: number, multipv: number, timeoutMs: number): Promise<EngineAnalysis> {
    return this.runExclusive(async () => {
      await this.ensureReady();
      const worker = this.ensureWorker();
      const entries: SfEntry[] = [];

      return await new Promise<EngineAnalysis>((resolve, reject) => {
        let finished = false;
        const timeout = setTimeout(() => {
          if (finished) return;
          finished = true;
          cleanup();
          this.terminate();
          reject(new Error('Stockfish WASM timeout'));
        }, timeoutMs || DEFAULT_TIMEOUT_MS);

        const cleanup = () => {
          clearTimeout(timeout);
          worker.removeEventListener('message', onMessage);
          worker.removeEventListener('error', onError);
        };

        const onError = (event: Event) => {
          if (finished) return;
          finished = true;
          cleanup();
          reject(new Error(`Stockfish WASM worker error: ${String(event)}`));
        };

        const onMessage = (event: MessageEvent) => {
          const line = normalizeWorkerMessage(event);
          if (!line) return;

          if (line.startsWith('info ')) {
            const parsed = parseSfInfoLine(line);
            if (parsed) entries.push(parsed);
            return;
          }

          if (line.startsWith('bestmove')) {
            if (finished) return;
            finished = true;
            cleanup();
            const lines = buildLines(entries);
            resolve({ source: 'stockfish-wasm', lines });
          }
        };

        worker.addEventListener('message', onMessage);
        worker.addEventListener('error', onError);

        worker.postMessage(`setoption name MultiPV value ${multipv}`);
        worker.postMessage('ucinewgame');
        worker.postMessage(`position fen ${fen}`);
        worker.postMessage(`go depth ${depth}`);
      });
    });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.readyPromise = null;
    }
  }
}

const wasmWorker = new StockfishWasmWorker();

export async function analyzeWithWasm(
  fen: string,
  depth: number,
  multipv: number,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<EngineAnalysis> {
  return wasmWorker.analyze(fen, depth, multipv, timeoutMs);
}

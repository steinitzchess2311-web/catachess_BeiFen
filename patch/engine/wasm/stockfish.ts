import type { EngineAnalysis, EngineLine } from '../types';
import { parseSfInfoLine, type SfEntry } from '../parsers';

const DEFAULT_SCRIPT_URL = '/assets/stockfish/stockfish-lite-single.js';
const DEFAULT_WASM_URL = '/assets/stockfish/stockfish-lite-single.wasm';
const DEFAULT_TIMEOUT_MS = 30000;

type StockfishModule = {
  listener?: (line: string) => void;
  processCommand?: (cmd: string) => void;
  ccall?: (...args: any[]) => any;
};

type StockfishFactory = (options: Record<string, any>) => Promise<StockfishModule>;

let factoryPromise: Promise<StockfishFactory> | null = null;
let modulePromise: Promise<StockfishModule> | null = null;
let runQueue: Promise<EngineAnalysis> = Promise.resolve({ source: 'stockfish-wasm', lines: [] });

function resolveEnv(name: string): string | undefined {
  try {
    const env = (import.meta as any)?.env;
    return env ? env[name] : undefined;
  } catch {
    return undefined;
  }
}

function resolveScriptUrl(): string {
  return resolveEnv('VITE_STOCKFISH_WASM_SCRIPT_URL') || DEFAULT_SCRIPT_URL;
}

function resolveWasmUrl(): string {
  return resolveEnv('VITE_STOCKFISH_WASM_BIN_URL') || DEFAULT_WASM_URL;
}

function loadScript(url: string): Promise<HTMLScriptElement> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`Failed to load Stockfish script: ${url}`));
    document.head.appendChild(script);
  });
}

async function loadFactory(): Promise<StockfishFactory> {
  if (factoryPromise) return factoryPromise;

  factoryPromise = (async () => {
    const scriptUrl = resolveScriptUrl();
    const script = await loadScript(scriptUrl);
    const exported = (script as any)._exports || (window as any).Stockfish;
    if (!exported) {
      throw new Error('Stockfish factory not found after loading script');
    }
    return exported as StockfishFactory;
  })();

  return factoryPromise;
}

async function loadModule(): Promise<StockfishModule> {
  if (modulePromise) return modulePromise;

  modulePromise = (async () => {
    const factory = await loadFactory();
    const wasmUrl = resolveWasmUrl();
    const module = await factory({
      locateFile: (path: string) => {
        if (path.endsWith('.wasm')) return wasmUrl;
        return path;
      },
    });

    if (!module.processCommand && !module.ccall) {
      throw new Error('Stockfish module missing processCommand/ccall');
    }

    return module;
  })();

  return modulePromise;
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

function sendCommand(module: StockfishModule, cmd: string): void {
  if (module.processCommand) {
    module.processCommand(cmd);
    return;
  }
  if (module.ccall) {
    module.ccall('command', null, ['string'], [cmd]);
  }
}

async function runAnalysis(fen: string, depth: number, multipv: number, timeoutMs: number): Promise<EngineAnalysis> {
  const module = await loadModule();
  const entries: SfEntry[] = [];

  return await new Promise<EngineAnalysis>((resolve, reject) => {
    let finished = false;
    const timeout = setTimeout(() => {
      if (finished) return;
      finished = true;
      reject(new Error('Stockfish WASM timeout'));
    }, timeoutMs || DEFAULT_TIMEOUT_MS);

    const cleanup = () => {
      clearTimeout(timeout);
      module.listener = undefined;
    };

    module.listener = (line: string) => {
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

    try {
      sendCommand(module, `setoption name MultiPV value ${multipv}`);
      sendCommand(module, 'ucinewgame');
      sendCommand(module, `position fen ${fen}`);
      sendCommand(module, `go depth ${depth}`);
    } catch (error) {
      if (finished) return;
      finished = true;
      cleanup();
      reject(error instanceof Error ? error : new Error('Stockfish WASM failed'));
    }
  });
}

export async function analyzeWithWasm(
  fen: string,
  depth: number,
  multipv: number,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<EngineAnalysis> {
  const run = runQueue.then(() => runAnalysis(fen, depth, multipv, timeoutMs));
  runQueue = run.catch(() => ({ source: 'stockfish-wasm', lines: [] }));
  return run;
}

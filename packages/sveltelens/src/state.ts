import type { Recorder } from './recorder.js';
import type { ResolvedConfig } from './config.js';

export interface SveltelensState {
  recorder: Recorder;
  config: ResolvedConfig;
}

// Shared across the plugin (configureServer) and hook.ts entry points — both
// resolve to the same loaded module instance within the Vite dev server process.
const globalKey = '__SVELTELENS_STATE__';
const g = globalThis as typeof globalThis & { [globalKey]?: SveltelensState };

export function setSveltelensState(state: SveltelensState): void {
  g[globalKey] = state;
}

export function getSveltelensState(): SveltelensState | null {
  return g[globalKey] ?? null;
}

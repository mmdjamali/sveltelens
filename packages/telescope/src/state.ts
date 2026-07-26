import type { Recorder } from './recorder.js';
import type { ResolvedConfig } from './config.js';

export interface TelescopeState {
  recorder: Recorder;
  config: ResolvedConfig;
}

// Shared across the plugin (configureServer) and hook.ts entry points — both
// resolve to the same loaded module instance within the Vite dev server process.
const globalKey = '__TELESCOPE_STATE__';
const g = globalThis as typeof globalThis & { [globalKey]?: TelescopeState };

export function setTelescopeState(state: TelescopeState): void {
  g[globalKey] = state;
}

export function getTelescopeState(): TelescopeState | null {
  return g[globalKey] ?? null;
}

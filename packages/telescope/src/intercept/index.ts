import type { Recorder } from '../recorder.js';
import { installHttpClientInterceptor } from './http-client.js';
import { installConsoleInterceptor } from './console.js';
import { installExceptionInterceptor } from './exceptions.js';

const GLOBAL_KEY = '__TELESCOPE_INTERCEPTORS_INSTALLED__';

/** Idempotent: Vite HMR can re-execute plugin setup, but interceptors must patch globals once. */
export function installInterceptors(recorder: Recorder, redactHeaders: string[]): void {
  const g = globalThis as typeof globalThis & { [GLOBAL_KEY]?: () => void };
  if (g[GLOBAL_KEY]) {
    g[GLOBAL_KEY]();
  }

  const uninstallHttp = installHttpClientInterceptor(recorder, redactHeaders);
  const uninstallConsole = installConsoleInterceptor(recorder);
  const uninstallExceptions = installExceptionInterceptor(recorder);

  g[GLOBAL_KEY] = () => {
    uninstallHttp();
    uninstallConsole();
    uninstallExceptions();
    delete g[GLOBAL_KEY];
  };
}

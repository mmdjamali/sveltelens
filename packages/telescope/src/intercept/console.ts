import util from 'node:util';
import type { Recorder } from '../recorder.js';
import type { LogPayload } from '../types.js';

const LEVELS: LogPayload['level'][] = ['log', 'info', 'warn', 'error', 'debug'];

export function installConsoleInterceptor(recorder: Recorder): () => void {
  const originals = LEVELS.map((level) => [level, console[level]] as const);

  for (const level of LEVELS) {
    const original = console[level];
    console[level] = (...args: unknown[]) => {
      recorder.record({
        type: 'log',
        payload: { level, message: util.format(...args) },
      });
      original.apply(console, args);
    };
  }

  return () => {
    for (const [level, original] of originals) {
      console[level] = original;
    }
  };
}

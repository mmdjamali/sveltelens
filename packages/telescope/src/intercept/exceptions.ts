import type { Recorder } from '../recorder.js';

export function installExceptionInterceptor(recorder: Recorder): () => void {
  const onUncaught = (err: Error) => recordException(recorder, err);
  const onUnhandledRejection = (reason: unknown) =>
    recordException(recorder, reason instanceof Error ? reason : new Error(String(reason)));

  process.on('uncaughtException', onUncaught);
  process.on('unhandledRejection', onUnhandledRejection);

  return () => {
    process.off('uncaughtException', onUncaught);
    process.off('unhandledRejection', onUnhandledRejection);
  };
}

export function recordException(recorder: Recorder, err: Error): void {
  recorder.record({
    type: 'exception',
    payload: {
      message: err.message,
      stack: err.stack ?? null,
      name: err.name,
    },
  });
}

import { describe, it, expect } from 'vitest';
import { MemoryStorage } from '../src/storage/memory.js';
import { Recorder } from '../src/recorder.js';
import { installConsoleInterceptor } from '../src/intercept/console.js';
import { installExceptionInterceptor, recordException } from '../src/intercept/exceptions.js';
import type { LogPayload, ExceptionPayload } from '../src/types.js';

describe('console interceptor', () => {
  it('records console.log/warn/error calls and restores originals on uninstall', () => {
    const storage = new MemoryStorage(50);
    const recorder = new Recorder(storage);
    const originalLog = console.log;

    const uninstall = installConsoleInterceptor(recorder);
    console.log('hello', 42);
    console.warn('careful');
    uninstall();

    expect(console.log).toBe(originalLog);

    const entries = storage.list({ type: 'log' }).entries;
    const messages = entries.map((e) => (e.payload as LogPayload).message);
    expect(messages).toContain('hello 42');
    expect(entries.find((e) => (e.payload as LogPayload).level === 'warn')).toBeTruthy();
  });

  it('does not record after uninstall', () => {
    const storage = new MemoryStorage(50);
    const recorder = new Recorder(storage);
    const uninstall = installConsoleInterceptor(recorder);
    uninstall();
    console.log('should not be recorded');
    expect(storage.list({ type: 'log' }).entries).toHaveLength(0);
  });
});

describe('exception interceptor', () => {
  it('records an exception via the shared recordException helper', () => {
    const storage = new MemoryStorage(50);
    const recorder = new Recorder(storage);
    recordException(recorder, new Error('boom'));

    const entries = storage.list({ type: 'exception' }).entries;
    expect(entries).toHaveLength(1);
    const payload = entries[0].payload as ExceptionPayload;
    expect(payload.message).toBe('boom');
    expect(payload.name).toBe('Error');
    expect(payload.stack).toContain('boom');
  });

  it('registers and unregisters process listeners', () => {
    const storage = new MemoryStorage(50);
    const recorder = new Recorder(storage);
    const before = process.listenerCount('uncaughtException');
    const uninstall = installExceptionInterceptor(recorder);
    expect(process.listenerCount('uncaughtException')).toBe(before + 1);
    uninstall();
    expect(process.listenerCount('uncaughtException')).toBe(before);
  });
});

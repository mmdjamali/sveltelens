import { describe, it, expect } from 'vitest';
import { MemoryStorage } from '../src/storage/memory.js';
import { Recorder } from '../src/recorder.js';
import { requestContext } from '../src/context.js';

describe('Recorder + requestContext correlation', () => {
  it('tags entries recorded inside requestContext.run with that requestId', async () => {
    const storage = new MemoryStorage(10);
    const recorder = new Recorder(storage);

    await requestContext.run({ requestId: 'req-1' }, async () => {
      // simulate an async gap, e.g. an awaited query/fetch happening deeper in the call stack
      await new Promise((resolve) => setTimeout(resolve, 5));
      recorder.record({ type: 'log', payload: { level: 'log', message: 'inside request' } });
    });

    recorder.record({ type: 'log', payload: { level: 'log', message: 'outside request' } });

    const entries = storage.list().entries;
    const inside = entries.find((e) => e.payload.message === 'inside request');
    const outside = entries.find((e) => e.payload.message === 'outside request');
    expect(inside?.requestId).toBe('req-1');
    expect(outside?.requestId).toBeNull();
  });

  it('an explicit requestId overrides the ambient context', () => {
    const storage = new MemoryStorage(10);
    const recorder = new Recorder(storage);
    const entry = recorder.record({
      type: 'log',
      requestId: 'explicit',
      payload: { level: 'log', message: 'x' },
    });
    expect(entry.requestId).toBe('explicit');
  });

  it('emits an entry event for live streaming', () => {
    const storage = new MemoryStorage(10);
    const recorder = new Recorder(storage);
    let received: unknown = null;
    recorder.on('entry', (e) => (received = e));
    recorder.record({ type: 'log', payload: { level: 'log', message: 'x' } });
    expect(received).not.toBeNull();
  });
});

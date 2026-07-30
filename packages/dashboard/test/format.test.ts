import { describe, it, expect } from 'vitest';
import type { Entry } from '../src/lib/types';
import {
  formatDuration,
  formatBytes,
  interpolateSql,
  exceptionLocation,
  stripAnsi,
  entrySummary,
  timelineSummary,
  prettyJson,
} from '../src/lib/format';

function entry(partial: Partial<Entry> & Pick<Entry, 'type' | 'payload'>): Entry {
  return {
    id: 'e1',
    timestamp: 0,
    durationMs: null,
    offsetMs: null,
    requestId: null,
    ...partial,
  } as Entry;
}

describe('formatDuration', () => {
  it('switches from ms to seconds at a second', () => {
    expect(formatDuration(999)).toBe('999ms');
    expect(formatDuration(1000)).toBe('1.00s');
  });

  it('renders a missing duration as a dash', () => {
    expect(formatDuration(null)).toBe('—');
  });
});

describe('formatBytes', () => {
  it('switches units at each 1024 boundary', () => {
    expect(formatBytes(1023)).toBe('1023 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
  });
});

describe('interpolateSql', () => {
  it('substitutes positional placeholders in order', () => {
    expect(interpolateSql('select * from t where a = ? and b = ?', ['x', 2])).toBe(
      'select * from t where a = "x" and b = 2'
    );
  });

  it('leaves placeholders alone once the params run out', () => {
    expect(interpolateSql('a = ? and b = ?', ['x'])).toBe('a = "x" and b = ?');
  });

  it('returns the sql untouched when there are no params', () => {
    expect(interpolateSql('select 1', [])).toBe('select 1');
  });
});

describe('exceptionLocation', () => {
  it('picks the first stack frame', () => {
    const stack = ['Error: nope', '    at load (/app/src/routes/+page.server.ts:5:23)', '    at run (/app/other.js:1:1)'].join(
      '\n'
    );
    expect(exceptionLocation(stack)).toBe('/app/src/routes/+page.server.ts:5:23');
  });

  it('has nothing to report without a stack', () => {
    expect(exceptionLocation(null)).toBeNull();
    expect(exceptionLocation('Error: no frames here')).toBeNull();
  });
});

describe('stripAnsi', () => {
  it('removes colour codes from console output', () => {
    expect(stripAnsi('\x1b[35m➜\x1b[0m ready')).toBe('➜ ready');
  });
});

describe('entrySummary', () => {
  it('summarises each entry type by its own most identifying field', () => {
    expect(entrySummary(entry({ type: 'request', payload: { path: '/todos' } } as never))).toBe('/todos');
    expect(entrySummary(entry({ type: 'query', payload: { sql: 'select 1' } } as never))).toBe('select 1');
    expect(
      entrySummary(entry({ type: 'exception', payload: { name: 'TypeError', message: 'nope' } } as never))
    ).toBe('TypeError: nope');
    expect(
      entrySummary(entry({ type: 'action', payload: { actionName: 'create', path: '/?/create' } } as never))
    ).toBe('create — /?/create');
  });
});

describe('timelineSummary', () => {
  it('counts each type and totals the durations it knows', () => {
    const entries = [
      entry({ type: 'query', durationMs: 10, payload: { sql: 'a' } } as never),
      entry({ type: 'query', durationMs: 15, payload: { sql: 'b' } } as never),
      entry({ type: 'client-request', durationMs: 30, payload: { url: 'u' } } as never),
      entry({ type: 'log', payload: { level: 'log', message: 'hi' } } as never),
    ];
    expect(timelineSummary(entries)).toBe('2 queries · 25ms DB · 1 http call · 30ms · 1 log');
  });

  it('is empty when there is nothing to summarise', () => {
    expect(timelineSummary([])).toBe('');
  });
});

describe('prettyJson', () => {
  it('reformats json and passes anything else through', () => {
    expect(prettyJson('{"a":1}')).toBe('{\n  "a": 1\n}');
    expect(prettyJson('not json')).toBe('not json');
    expect(prettyJson(null)).toBe('');
  });
});

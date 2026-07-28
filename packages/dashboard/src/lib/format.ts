import type { Entry, EntryType, LogPayload } from './types';

export function timeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const s = Math.floor(diffMs / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// Badge overrides: subtle tinted surface, no border — the dashboard is dark-only.
const NEUTRAL = 'bg-muted text-muted-foreground';
const RED = 'bg-red-500/10 text-red-400';
const AMBER = 'bg-amber-500/10 text-amber-400';
const SKY = 'bg-sky-500/10 text-sky-400';
const EMERALD = 'bg-emerald-500/10 text-emerald-400';
const VIOLET = 'bg-violet-500/10 text-violet-400';

export function statusClass(status: number | null): string {
  if (status === null) return NEUTRAL;
  if (status >= 500) return RED;
  if (status >= 400) return AMBER;
  if (status >= 300) return SKY;
  if (status >= 200) return EMERALD;
  return NEUTRAL;
}

const METHOD_CLASSES: Record<string, string> = {
  GET: SKY,
  POST: EMERALD,
  PUT: AMBER,
  PATCH: AMBER,
  DELETE: RED,
};

export function methodClass(method: string): string {
  return METHOD_CLASSES[method.toUpperCase()] ?? NEUTRAL;
}

const LEVEL_CLASSES: Record<LogPayload['level'], string> = {
  error: RED,
  warn: AMBER,
  info: SKY,
  debug: VIOLET,
  log: EMERALD,
};

export function levelClass(level: LogPayload['level']): string {
  return LEVEL_CLASSES[level] ?? NEUTRAL;
}

const ENTRY_TYPE_CLASSES: Record<EntryType, string> = {
  request: SKY,
  'client-request': VIOLET,
  query: AMBER,
  log: EMERALD,
  exception: RED,
  action: VIOLET,
};

export function entryTypeClass(type: EntryType): string {
  return ENTRY_TYPE_CLASSES[type];
}

// Solid fill colors for timeline waterfall bars/markers — same hues as the tinted badges above.
const ENTRY_TYPE_BAR_CLASSES: Record<EntryType, string> = {
  request: 'bg-sky-500',
  'client-request': 'bg-violet-500',
  query: 'bg-amber-500',
  log: 'bg-emerald-500',
  exception: 'bg-red-500',
  action: 'bg-violet-500',
};

export function entryTypeBarClass(type: EntryType): string {
  return ENTRY_TYPE_BAR_CLASSES[type];
}

// The "verb" badge next to the type badge: HTTP method, log level, or exception name.
export function entryVerb(entry: Entry): string | null {
  if (entry.type === 'request' || entry.type === 'client-request') return entry.payload.method;
  if (entry.type === 'action') return entry.payload.actionName.toUpperCase();
  // 'log' level is redundant with the type badge, which already reads "LOG".
  if (entry.type === 'log') return entry.payload.level === 'log' ? null : entry.payload.level.toUpperCase();
  if (entry.type === 'exception') return entry.payload.name;
  return null;
}

export function entryVerbClass(entry: Entry): string {
  if (entry.type === 'log') return levelClass(entry.payload.level);
  if (entry.type === 'exception') return entryTypeClass('exception');
  if (entry.type === 'action') return methodClass(entry.payload.method);
  if (entry.type === 'request' || entry.type === 'client-request') return methodClass(entry.payload.method);
  return NEUTRAL;
}

export function entryStatus(entry: Entry): number | null {
  if (entry.type === 'request' || entry.type === 'client-request' || entry.type === 'action') return entry.payload.status;
  return null;
}

// Strips ANSI escape codes (e.g. from console color output) so raw terminal formatting
// never leaks into rendered log text.
export function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
}

// The one-line summary shown in the entry list, detail header, and related-entries list.
export function entrySummary(entry: Entry): string {
  switch (entry.type) {
    case 'request':
      return entry.payload.path;
    case 'client-request':
      return entry.payload.url;
    case 'query':
      return entry.payload.sql;
    case 'log':
      return stripAnsi(entry.payload.message);
    case 'exception':
      return `${entry.payload.name}: ${entry.payload.message}`;
    case 'action':
      return `${entry.payload.actionName} — ${entry.payload.path}`;
  }
}

export function formatAbsoluteTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });
}

// The aggregate stats line above the timeline, e.g. "3 queries · 24ms DB · 1 http call · 15ms".
export function timelineSummary(entries: Entry[]): string {
  const parts: string[] = [];

  const queries = entries.filter((e) => e.type === 'query');
  if (queries.length) {
    const known = queries.filter((e) => e.durationMs !== null);
    const dbMs = known.reduce((sum, e) => sum + (e.durationMs ?? 0), 0);
    parts.push(
      `${queries.length} ${queries.length === 1 ? 'query' : 'queries'}${known.length ? ` · ${formatDuration(dbMs)} DB` : ''}`
    );
  }

  const calls = entries.filter((e) => e.type === 'client-request');
  if (calls.length) {
    const known = calls.filter((e) => e.durationMs !== null);
    const httpMs = known.reduce((sum, e) => sum + (e.durationMs ?? 0), 0);
    parts.push(
      `${calls.length} http ${calls.length === 1 ? 'call' : 'calls'}${known.length ? ` · ${formatDuration(httpMs)}` : ''}`
    );
  }

  const actions = entries.filter((e) => e.type === 'action').length;
  if (actions) parts.push(`${actions} ${actions === 1 ? 'action' : 'actions'}`);

  const logs = entries.filter((e) => e.type === 'log').length;
  if (logs) parts.push(`${logs} ${logs === 1 ? 'log' : 'logs'}`);

  const exceptions = entries.filter((e) => e.type === 'exception').length;
  if (exceptions) parts.push(`${exceptions} ${exceptions === 1 ? 'exception' : 'exceptions'}`);

  return parts.join(' · ');
}

export function formatDuration(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const SLOW_QUERY_MS = 100;

// Telescope-style slow query highlighting: red past 2x threshold, amber past threshold.
export function durationClass(ms: number | null): string {
  if (ms === null) return NEUTRAL;
  if (ms >= SLOW_QUERY_MS * 2) return RED;
  if (ms >= SLOW_QUERY_MS) return AMBER;
  return NEUTRAL;
}

// Naive positional `?` placeholder interpolation for display only — not SQL-safe, never
// used for anything but showing the developer what ran.
export function interpolateSql(sql: string, params: unknown[]): string {
  if (!params.length) return sql;
  let i = 0;
  return sql.replace(/\?/g, () => (i < params.length ? JSON.stringify(params[i++]) : '?'));
}

// First "at <file>:<line>:<col>" frame in a stack trace, e.g. "src/routes/+page.server.ts:42:11".
export function exceptionLocation(stack: string | null): string | null {
  if (!stack) return null;
  const match = stack.match(/at .*?\(?([^\s()]+:\d+:\d+)\)?/);
  return match ? match[1] : null;
}

export function prettyJson(text: string | null): string {
  if (text === null) return '';
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

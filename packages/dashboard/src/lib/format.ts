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

// Badge overrides: tinted surface + border, readable in both themes.
const NEUTRAL = 'border-border bg-muted text-muted-foreground';
const RED = 'border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400';
const AMBER = 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400';
const SKY = 'border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-400';
const EMERALD = 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';

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

export function prettyJson(text: string | null): string {
  if (text === null) return '';
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

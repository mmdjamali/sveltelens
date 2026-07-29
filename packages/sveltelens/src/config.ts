/** User-facing plugin options. Lives here, next to the defaults that fill them in. */
export interface SveltelensConfig {
  enabled?: boolean;
  path?: string;
  storage?: 'memory' | 'sqlite';
  sqlitePath?: string;
  maxEntries?: number;
  ignore?: (string | RegExp)[];
  redactHeaders?: string[];
}

export const DEFAULT_PATH = '/__sveltelens';
export const DEFAULT_REDACT_HEADERS = ['authorization', 'cookie'];
export const DEFAULT_MAX_ENTRIES = 1000;
export const DEFAULT_IGNORE = [DEFAULT_PATH, '/__sveltelens/*', '/@vite/*', '/@fs/*', '/@id/*', '/__vite_ping', '/node_modules/*'];

export type ResolvedConfig = Required<
  Pick<SveltelensConfig, 'enabled' | 'path' | 'maxEntries' | 'ignore' | 'redactHeaders'>
> &
  SveltelensConfig;

export function resolveConfig(config: SveltelensConfig = {}): ResolvedConfig {
  const path = config.path ?? DEFAULT_PATH;
  return {
    ...config,
    enabled: config.enabled ?? true,
    path,
    storage: config.storage ?? 'memory',
    maxEntries: config.maxEntries ?? DEFAULT_MAX_ENTRIES,
    ignore: config.ignore ?? [path, `${path}/*`, ...DEFAULT_IGNORE],
    redactHeaders: config.redactHeaders ?? DEFAULT_REDACT_HEADERS,
  };
}

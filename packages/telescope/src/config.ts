import type { TelescopeConfig } from './types.js';

export const DEFAULT_PATH = '/__telescope';
export const DEFAULT_REDACT_HEADERS = ['authorization', 'cookie'];
export const DEFAULT_MAX_ENTRIES = 1000;
export const DEFAULT_IGNORE = [DEFAULT_PATH, '/__telescope/*', '/@vite/*', '/@fs/*', '/@id/*', '/__vite_ping', '/node_modules/*'];

export type ResolvedConfig = Required<
  Pick<TelescopeConfig, 'enabled' | 'path' | 'maxEntries' | 'ignore' | 'redactHeaders'>
> &
  TelescopeConfig;

export function resolveConfig(config: TelescopeConfig = {}): ResolvedConfig {
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

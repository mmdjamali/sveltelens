import type { IncomingMessage } from 'node:http';

/**
 * Rejects cross-origin browser requests (fetch/XHR/WebSocket always attach
 * `Origin`) while allowing non-browser clients (curl, server-to-server)
 * that omit the header. This is the correct default for a tool with no
 * prior auth story and no configurable allow-list.
 */
export function isSameOrigin(req: IncomingMessage): boolean {
  const origin = req.headers.origin;
  if (!origin) return true; // non-browser clients (curl, server-to-server) send no Origin
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

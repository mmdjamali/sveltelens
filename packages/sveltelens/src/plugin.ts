import type { Plugin, ViteDevServer } from 'vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import sirv from 'sirv';
import { resolveConfig, type SveltelensConfig } from './config.js';
import { createStorage } from './storage/index.js';
import { Recorder } from './recorder.js';
import { installInterceptors } from './intercept/index.js';
import { createApiMiddleware } from './api/rest.js';
import { installStreamServer } from './api/ws.js';
import { setSveltelensState } from './state.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const DASHBOARD_DIST = path.join(currentDir, '../dashboard-dist');

/**
 * The dashboard ships as a static SPA shell that assumes it is loaded at exactly one
 * level below the mount path: its asset URLs are relative (`./_app/...`) and SvelteKit
 * derives the router base from the document's own depth (`new URL(".", location)`).
 * Both hold for the prerendered list pages, but not for a directly-loaded nested route
 * like `/requests/:id` — the extra segment resolves assets to `/requests/_app/...` and
 * boots the router with base `/requests`, giving a 404 and links like
 * `/__sveltelens/requests/requests`. Pin both to the mount path so any depth works.
 */
export function pinShellToMountPath(html: string, mountPath: string): string {
  const base = mountPath.replace(/\/+$/, '');
  const pinned = `base: ${JSON.stringify(base)}`;
  const patched = html
    .replace('<head>', `<head>\n\t<base href="${base}/">`)
    .replace(/base: new URL\("\.", ?location\)\.pathname\.slice\(0, ?-1\)/, pinned);

  if (!patched.includes(pinned)) {
    console.warn('[sveltelens] could not pin the dashboard router base — nested routes may 404 on direct load');
  }
  return patched;
}

export function sveltelens(userConfig: SveltelensConfig = {}): Plugin {
  const config = resolveConfig(userConfig);

  return {
    name: 'sveltelens',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      if (!config.enabled) return;

      const storage = createStorage(config);
      const recorder = new Recorder(storage);
      setSveltelensState({ recorder, config });
      installInterceptors(recorder, config.redactHeaders, config.redactBodyKeys);

      let uninstallStream: (() => void) | null = null;
      if (server.httpServer) {
        uninstallStream = installStreamServer(server.httpServer, recorder, config.path);
      }
      server.httpServer?.once('close', () => uninstallStream?.());

      server.middlewares.use(createApiMiddleware(storage, recorder, config.path));

      // sirv resolves relative asset URLs against the request's directory, so a
      // request for the bare mount path (no trailing slash) must redirect first.
      server.middlewares.use((req, res, next) => {
        if (req.url === config.path) {
          res.statusCode = 302;
          res.setHeader('location', `${config.path}/`);
          res.end();
          return;
        }
        next();
      });

      server.middlewares.use(config.path, sirv(DASHBOARD_DIST, { dev: true, etag: true }));

      // SPA fallback for routes with no matching static file (e.g. /requests/:id).
      const shellHtml = pinShellToMountPath(
        fs.readFileSync(path.join(DASHBOARD_DIST, 'index.html'), 'utf-8'),
        config.path
      );
      server.middlewares.use(config.path, (_req, res) => {
        res.statusCode = 200;
        res.setHeader('content-type', 'text/html');
        res.end(shellHtml);
      });

      server.httpServer?.once('listening', () => {
        const address = server.httpServer?.address();
        const port = typeof address === 'object' && address ? address.port : '';
        console.log(`  \x1b[35m➜\x1b[0m  Sveltelens:  \x1b[1mhttp://localhost:${port}${config.path}\x1b[0m`);
      });
    },
  };
}

export type { SveltelensConfig } from './config.js';

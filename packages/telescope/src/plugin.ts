import type { Plugin, ViteDevServer } from 'vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sirv from 'sirv';
import type { TelescopeConfig } from './types.js';
import { resolveConfig } from './config.js';
import { createStorage } from './storage/index.js';
import { Recorder } from './recorder.js';
import { installInterceptors } from './intercept/index.js';
import { createApiMiddleware } from './api/rest.js';
import { installStreamServer } from './api/ws.js';
import { setTelescopeState } from './state.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const DASHBOARD_DIST = path.join(currentDir, '../dashboard-dist');

export function telescope(userConfig: TelescopeConfig = {}): Plugin {
  const config = resolveConfig(userConfig);

  return {
    name: 'sveltecope',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      if (!config.enabled) return;

      const storage = createStorage(config);
      const recorder = new Recorder(storage);
      setTelescopeState({ recorder, config });
      installInterceptors(recorder, config.redactHeaders);

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

      server.middlewares.use(config.path, sirv(DASHBOARD_DIST, { dev: true, single: true, etag: true }));

      server.httpServer?.once('listening', () => {
        const address = server.httpServer?.address();
        const port = typeof address === 'object' && address ? address.port : '';
        // eslint-disable-next-line no-console
        console.log(`  \x1b[35m➜\x1b[0m  Telescope:  \x1b[1mhttp://localhost:${port}${config.path}\x1b[0m`);
      });
    },
  };
}

export type { TelescopeConfig } from './types.js';

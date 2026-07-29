import http from 'node:http';

export const MOCK_API_PORT = 4310;

// ponytail: module-level singleton guard, survives Vite HMR reloading this module
const globalKey = '__SVELTELENS_DEMO_MOCK_SERVER__';
const g = globalThis as typeof globalThis & { [globalKey]?: http.Server };

if (!g[globalKey]) {
  const server = http.createServer((_req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ pong: true, at: Date.now() }));
  });
  server.listen(MOCK_API_PORT);
  g[globalKey] = server;
}

import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import type { HttpServer } from 'vite';
import { WebSocketServer } from 'ws';
import type { Recorder } from '../recorder.js';
import type { Entry } from '../types.js';

/** Dedicated `ws` server on `${basePath}/api/stream`, pushing every recorded entry live. */
export function installStreamServer(
  httpServer: HttpServer,
  recorder: Recorder,
  basePath: string
): () => void {
  const streamPath = `${basePath}/api/stream`;
  const wss = new WebSocketServer({ noServer: true });

  const onEntry = (entry: Entry) => {
    const message = JSON.stringify({ type: 'entry', entry });
    for (const client of wss.clients) {
      if (client.readyState === client.OPEN) client.send(message);
    }
  };
  recorder.on('entry', onEntry);

  const onUpgrade = (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    const url = new URL(req.url ?? '', 'http://localhost');
    if (url.pathname !== streamPath) return;
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  };
  httpServer.on('upgrade', onUpgrade);

  return () => {
    recorder.off('entry', onEntry);
    httpServer.off('upgrade', onUpgrade);
    wss.close();
  };
}

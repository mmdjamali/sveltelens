import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pinShellToMountPath } from '../src/plugin.js';

const DASHBOARD_INDEX = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../dashboard-dist/index.html'
);

/** Resolve a relative URL the way a browser would, honouring <base>. */
function resolveAsset(html: string, documentUrl: string): string {
  const baseTag = html.match(/<base href="([^"]+)">/)?.[1];
  const documentBase = new URL(documentUrl, 'http://localhost');
  const effectiveBase = baseTag ? new URL(baseTag, documentBase) : documentBase;
  return new URL('./_app/immutable/entry/start.js', effectiveBase).pathname;
}

describe('pinShellToMountPath', () => {
  const shell = fs.readFileSync(DASHBOARD_INDEX, 'utf-8');

  it('pins the SvelteKit router base to the mount path', () => {
    const patched = pinShellToMountPath(shell, '/__telescope');

    expect(patched).toContain('base: "/__telescope"');
    expect(patched).not.toContain('new URL(".", location)');
  });

  it('resolves assets to the mount root at every route depth', () => {
    const patched = pinShellToMountPath(shell, '/__telescope');

    for (const url of ['/__telescope/', '/__telescope/requests', '/__telescope/requests/abc123']) {
      expect(resolveAsset(patched, url)).toBe('/__telescope/_app/immutable/entry/start.js');
    }
  });

  it('is unaffected by a trailing slash on the configured path', () => {
    expect(pinShellToMountPath(shell, '/dev/scope/')).toContain('base: "/dev/scope"');
    expect(pinShellToMountPath(shell, '/dev/scope/')).toContain('<base href="/dev/scope/">');
  });

  it('warns instead of silently shipping an unpinned shell', () => {
    const warnings: unknown[] = [];
    const original = console.warn;
    console.warn = (...args: unknown[]) => warnings.push(args[0]);
    try {
      pinShellToMountPath('<head></head>', '/__telescope');
    } finally {
      console.warn = original;
    }
    expect(warnings).toHaveLength(1);
  });
});

import { cpSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dashboardRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(dashboardRoot, 'build');
const dest = path.join(dashboardRoot, '../sveltelens/dashboard-dist');

if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
console.log(`Copied dashboard build → ${dest}`);

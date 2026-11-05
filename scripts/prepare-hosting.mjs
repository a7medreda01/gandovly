import { renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
// A root index.html is served before Vercel's conditional rewrites. Keep the
// Angular shell under another name so social crawlers reach the metadata route.
const browser = new URL('../dist/TngProject/browser/', import.meta.url);
renameSync(fileURLToPath(new URL('index.html', browser)), fileURLToPath(new URL('app-shell.html', browser)));
console.log('Prepared app-shell.html for tenant-aware root previews.');

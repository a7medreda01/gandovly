import { copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const browser = new URL('../dist/TngProject/browser/', import.meta.url);
const indexPath = fileURLToPath(new URL('index.html', browser));
const appShellPath = fileURLToPath(new URL('app-shell.html', browser));

if (existsSync(indexPath) && !existsSync(appShellPath)) {
  copyFileSync(indexPath, appShellPath);
  console.log('Prepared app-shell.html from index.html.');
} else if (existsSync(appShellPath) && !existsSync(indexPath)) {
  copyFileSync(appShellPath, indexPath);
  console.log('Restored index.html from app-shell.html.');
} else if (existsSync(indexPath) && existsSync(appShellPath)) {
  console.log('Both index.html and app-shell.html are ready.');
}

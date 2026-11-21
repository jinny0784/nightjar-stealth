// Nightjar local server: serves game/ at http://localhost:8080 so the
// game can be played and screenshotted in a desktop browser.
//   node serve.ts

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'game');
const types: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
};

createServer((req, res) => {
  const path = (req.url ?? '/').split('?')[0];
  const rel = path === '/' ? 'index.html' : path.slice(1);
  const file = join(root, rel);
  if (!existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404); res.end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(8080, () => console.log('Nightjar at http://localhost:8080'));

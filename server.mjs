// Local dev server: serves public/ and the same handlers as the Vercel functions.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { services } from './lib/core.mjs';
import chatH from './api/chat.mjs';
import ttsH from './api/tts.mjs';
import unlocksH from './api/unlocks.mjs';
import configH from './api/config.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 5173);
const ROUTES = { '/api/chat': chatH, '/api/tts': ttsH, '/api/unlocks': unlocksH, '/api/config': configH };
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };

// minimal Vercel-style req/res helpers
function wrap(res) {
  res.status = c => { res.statusCode = c; return res; };
  res.json = o => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };
  res.send = b => res.end(b);
  return res;
}
const readBody = req => new Promise(r => { let d = ''; req.on('data', c => d += c); req.on('end', () => { try { r(JSON.parse(d || '{}')); } catch { r({}); } }); });

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    const h = ROUTES[url.pathname];
    if (h) {
      req.query = Object.fromEntries(url.searchParams);
      if (req.method === 'POST') req.body = await readBody(req);
      return await h(req, wrap(res));
    }
    const file = join(ROOT, 'public', url.pathname === '/' ? 'index.html' : url.pathname);
    if (!file.startsWith(join(ROOT, 'public'))) { res.writeHead(403); return res.end(); }
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' }); res.end(data);
  } catch (e) {
    if (e.code === 'ENOENT') { res.writeHead(404); return res.end('not found'); }
    console.error(e); res.writeHead(500); res.end(e.message);
  }
}).listen(PORT, () => console.log(`U-Bot Voice on http://localhost:${PORT}`, services()));

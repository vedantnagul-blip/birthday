#!/usr/bin/env node
/**
 * Zero-dependency static server for the birthday-four snapshot.
 *
 *   node server.mjs            -> http://localhost:3000
 *   PORT=8080 node server.mjs
 *
 * What it adds on top of a plain static file server:
 *   /_next/image?url=/ref/girl1.jpg&w=256&q=75   -> serves ./ref/girl1.jpg
 *   /api/time                                    -> { "now": <epoch ms> }
 *
 * Node 18+ required (no npm install needed).
 */
import { createServer } from 'node:http';
import { createReadStream, promises as fs } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.wav': 'audio/wav',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.otf': 'font/otf',
  '.ttf': 'font/ttf',
};

/** Resolve a URL pathname to a file inside ROOT, or null if it escapes. */
function safePath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const p = normalize(join(ROOT, decoded));
  if (!p.startsWith(ROOT.endsWith(sep) ? ROOT : ROOT + sep) && p !== ROOT) return null;
  return p;
}

async function statFile(p) {
  try {
    const s = await fs.stat(p);
    if (s.isFile()) return p;
    if (s.isDirectory()) {
      const idx = join(p, 'index.html');
      const si = await fs.stat(idx).catch(() => null);
      if (si && si.isFile()) return idx;
    }
  } catch {}
  return null;
}

function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'text/plain; charset=utf-8' });
  res.end(body);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = url.pathname;

  // --- Next.js image optimizer emulation ---
  if (pathname === '/_next/image') {
    const target = url.searchParams.get('url') || '';
    const p = safePath(target.startsWith('/') ? target : '/' + target);
    const file = p && (await statFile(p));
    if (file) {
      res.writeHead(200, {
        'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=0, must-revalidate',
      });
      return createReadStream(file).pipe(res);
    }
    return send(res, 404, 'image not found');
  }

  // --- countdown clock ---
  if (pathname === '/api/time') {
    return send(res, 200, JSON.stringify({ now: Date.now() }), MIME['.json']);
  }

  if (pathname === '/') pathname = '/index.html';
  const p = safePath(pathname);
  const file = p && (await statFile(p));
  if (!file) return send(res, 404, '404 Not Found');

  const type = MIME[extname(file).toLowerCase()] || 'application/octet-stream';
  const size = (await fs.stat(file)).size;
  const range = req.headers.range;

  // byte-range support (needed for <video>/<audio> seeking)
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    if (m) {
      let start = m[1] ? parseInt(m[1], 10) : 0;
      let end = m[2] ? parseInt(m[2], 10) : size - 1;
      if (isNaN(start) || isNaN(end) || start > end || start >= size) {
        res.writeHead(416, { 'Content-Range': `bytes */${size}` });
        return res.end();
      }
      res.writeHead(206, {
        'Content-Type': type,
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
      });
      return createReadStream(file, { start, end }).pipe(res);
    }
  }

  res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes' });
  createReadStream(file).pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`\n  🎂  birthday-four snapshot running`);
  console.log(`      http://localhost:${PORT}\n`);
});

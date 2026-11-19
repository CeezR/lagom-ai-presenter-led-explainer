/* A tiny local web server for one video folder: serves the deck and saves recordings into takes/.
   Why: a page on http://localhost keeps camera/mic permissions, and the server lets the in-browser recorder write each
   second of video straight into takes/ (a crash or a long take loses nothing), with no folder picker and no download dialog.
   Only listens on 127.0.0.1 and only accepts take-YYYYMMDD-HHMMSS.webm into takes/. */
import { createServer } from 'node:http';
import { appendFileSync, createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const EXPORT = fileURLToPath(new URL('./export.mjs', import.meta.url));
/** Run export.mjs on a finished take. Resolves { ok, mp4, report } (the checks, or why it could not run). */
const exportTake = file => new Promise(done => {
  const p = spawn(process.execPath, [EXPORT, file], { stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; p.stdout.on('data', d => { log += d; }); p.stderr.on('data', d => { log += d; });
  p.on('error', e => done({ ok: false, report: String(e) }));
  p.on('close', code => done({ ok: code === 0, mp4: (log.match(/-> (.+\.mp4)/) ?? [])[1], report: log.split('\n').filter(l => /PASS|FAIL|not found|failed/.test(l)).join('\n') }));
});

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webm': 'video/webm', '.txt': 'text/plain; charset=utf-8' };
const TAKE = /^take-\d{8}-\d{6}\.webm$/;

/** Start the server for a video folder. Resolves with { url, close }. Tries ports from `port` upward. */
export function serve(dir, port = 4173) {
  const takes = join(dir, 'takes');
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const host = req.headers.host ?? '';
      if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) { res.writeHead(403).end(); return; }   // refuse DNS-rebinding lookalikes
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/api/take' && req.method === 'POST') {
        const name = url.searchParams.get('name') ?? '';
        if (!TAKE.test(name)) { res.writeHead(400).end('bad take name'); return; }
        const chunks = [];
        req.on('data', c => chunks.push(c));
        req.on('end', () => {
          mkdirSync(takes, { recursive: true });
          const file = join(takes, name), body = Buffer.concat(chunks);
          if (url.searchParams.get('first') === '1') writeFileSync(file, body); else appendFileSync(file, body);
          res.writeHead(204).end();
        });
        return;
      }
      if (url.pathname === '/api/export' && req.method === 'POST') {   // the recorder says the take is complete: make the checked MP4
        const name = url.searchParams.get('name') ?? '';
        if (!TAKE.test(name) || !existsSync(join(takes, name))) { res.writeHead(400).end('bad take name'); return; }
        exportTake(join(takes, name)).then(r => { res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(r)); });
        return;
      }
      const rel = normalize(decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)).replace(/^([/\\])+/, '');
      const file = join(dir, rel);
      if (rel.startsWith('..') || !file.startsWith(dir) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404).end('not found'); return; }
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
      createReadStream(file).pipe(res);
    });
    const tryPort = p => {
      server.once('error', e => e.code === 'EADDRINUSE' && p < port + 20 ? tryPort(p + 1) : reject(e));
      server.listen(p, '127.0.0.1', () => resolve({ url: `http://localhost:${p}/`, close: () => server.close() }));
    };
    tryPort(port);
  });
}

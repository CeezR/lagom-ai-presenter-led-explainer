/* A tiny local web server for one video folder: serves the deck and saves recordings into takes/.
   Why: a page on http://localhost keeps camera/mic permissions, and the server lets the in-browser recorder write each
   second of video straight into takes/ (a crash or a long take loses nothing), with no folder picker and no download dialog.
   Only listens on 127.0.0.1 and only accepts take-YYYYMMDD-HHMMSS.webm into takes/. */
import { createServer } from 'node:http';
import { appendFileSync, closeSync, createReadStream, existsSync, mkdirSync, openSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname, join, normalize } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const EXPORT = fileURLToPath(new URL('./export.mjs', import.meta.url));
const running = new Map();   // take name -> { name, started, promise }: the MP4s being made right now
/** Exports still running, so record.mjs can warn and wait on Ctrl+C instead of leaving a half-made MP4. */
export const exportsRunning = () => [...running.values()];
/** Run export.mjs on a finished take. Resolves { ok, mp4, report } (the checks, or why it could not run).
   It runs detached with its output in takes/<take>.export.log: Ctrl+C in the terminal does not reach it, and it still
   finishes if this server or its window is closed (a long take takes minutes to encode). The log is removed when it passes. */
const exportTake = file => {
  const name = basename(file);
  if (running.has(name)) return running.get(name).promise;
  const logFile = file.replace(/\.webm$/, '.export.log');
  const job = { name, started: Date.now() };
  console.log(`Making the MP4 for ${name} (about 1 min per 10 min of video)...`);
  job.promise = new Promise(done => {
    const fd = openSync(logFile, 'w');
    const p = spawn(process.execPath, [EXPORT, file], { stdio: ['ignore', fd, fd], detached: true, windowsHide: true });
    closeSync(fd);
    p.on('error', e => done({ ok: false, report: String(e) }));
    p.on('close', code => {
      const log = existsSync(logFile) ? readFileSync(logFile, 'utf8') : '';
      const r = { ok: code === 0, mp4: (log.match(/-> (.+\.mp4)/) ?? [])[1], report: log.split(/\r?\n|\r/).filter(l => /PASS|FAIL|not found|failed/.test(l)).join('\n') };
      if (r.ok) rmSync(logFile, { force: true });
      console.log(r.ok ? `MP4 ready and checked: ${r.mp4}` : `MP4 for ${name} did not pass, see ${logFile}\n${r.report}`);
      done(r);
    });
  }).catch(e => ({ ok: false, report: String(e) })).finally(() => running.delete(name));
  running.set(name, job);
  return job.promise;
};

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

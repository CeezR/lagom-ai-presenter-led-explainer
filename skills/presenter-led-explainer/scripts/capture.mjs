#!/usr/bin/env node
/* Capture every slide as a PNG next to its scene file, plus one overview image of the whole deck.
   Why: so the repo shows what the presentation looks like without opening any HTML. Re-run after any change to a deck.
   Output: scenes/<id>.png for each slide and <video>/overview.png (all slides in a grid, in order). Both are git-ignored: regenerate them any time.
   Each slide is captured once its animation has settled: the last cue + 2.5 s (before the loop restarts). Override per slide with
   "capture": <seconds> in deck.json. Needs Chrome, Edge or Chromium (set CHROME=/path/to/browser if it is not found). No other dependencies.
   Run: node capture.mjs [videos/001-slug] [--only s03,s05] [--size 1280] */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { skillDir, videoDir } from './lib.mjs';

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const only = flag('--only') ? flag('--only').split(',') : null;
const W = +flag('--size', 1280), H = Math.round(W * 9 / 16);
const dir = videoDir(args.find(a => !a.startsWith('--') && a !== flag('--only') && a !== flag('--size')));
const deck = JSON.parse(readFileSync(join(dir, 'deck.json'), 'utf8'));
const scenes = join(dir, 'scenes');

function findBrowser() {
  const c = [process.env.CHROME,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Chromium.app/Contents/MacOS/Chromium',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge'].filter(Boolean);
  return c.find(p => (p.includes('/') || p.includes('\\')) ? existsSync(p) : spawnSync(p, ['--version'], { stdio: 'ignore' }).status === 0);
}
const chrome = findBrowser();
if (!chrome) { console.error('No Chrome, Edge or Chromium found. Install one, or set CHROME=/path/to/browser.'); process.exit(1); }

/** Seconds into the slide at which the picture has settled. */
function settled(s, html) {
  if (s.capture != null) return s.capture;
  const cues = JSON.parse((html.match(/data-cues='([^']*)'/) ?? [])[1] ?? '[]'), loop = +((html.match(/data-loop="(\d+)"/) ?? [])[1] ?? 0);
  const t = Math.max(2, (cues.at(-1) ?? 0) + 2.5);
  return loop ? Math.min(t, loop - .5) : t;
}
function shot(url, out, w, h) {
  const r = spawnSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', `--window-size=${w},${h}`, '--virtual-time-budget=2500', `--screenshot=${out}`, url], { stdio: 'ignore' });
  return r.status === 0 && existsSync(out);
}

const slides = deck.slides.filter(s => existsSync(join(scenes, `${s.id}.html`)));
let failed = 0;
for (const s of slides) {
  if (only && !only.includes(s.id)) continue;
  const html = readFileSync(join(scenes, `${s.id}.html`), 'utf8'), t = settled(s, html), out = join(scenes, `${s.id}.png`);
  const ok = shot(`${pathToFileURL(join(scenes, `${s.id}.html`)).href}?still=1&at=${t}`, out, W, H);
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${s.id}.png  (t=${t}s)`); if (!ok) failed++;
}

// the overview: a contact sheet of every slide image, in deck order
const cols = 3, pad = 30, gap = 24, cw = Math.floor((1920 - 2 * pad - gap * (cols - 1)) / cols), ch = Math.round(cw * 9 / 16), cell = ch + 50;
const rows = Math.ceil(slides.length / cols), total = 2 * pad + rows * cell + (rows - 1) * gap + 70;
const font = pathToFileURL(join(skillDir, 'runtime', 'vendor', 'kalam-latin-700-normal.woff2')).href;
const cells = slides.map((s, i) => `<figure><img src="scenes/${s.id}.png"><figcaption><b>${i + 1}</b> ${esc(s.title ?? s.id)} <i>${s.id}</i></figcaption></figure>`).join('');
function esc(x) { return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
const sheet = join(dir, '_overview.html');
writeFileSync(sheet, `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:K;src:url("${font}");font-weight:700}
body{margin:0;background:#F4F0E8;font:700 28px K,sans-serif;color:#2A2420}
h1{margin:0;padding:${pad - 6}px ${pad}px 0;font-size:34px}
.g{display:grid;grid-template-columns:repeat(${cols},${cw}px);gap:${gap}px;padding:${pad}px;padding-top:18px}
figure{margin:0}img{display:block;width:${cw}px;height:${ch}px;border:3px solid #2A2420;border-radius:10px;background:#fff;box-sizing:border-box}
figcaption{padding:8px 4px 0;font-size:24px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}b{color:#F07A1A}i{font-style:normal;opacity:.45;font-size:20px}
</style><h1>${esc(deck.title ?? '')}</h1><div class="g">${cells}</div>`);
const okSheet = shot(pathToFileURL(sheet).href, join(dir, 'overview.png'), 1920, total);
rmSync(sheet, { force: true });
console.log(`${okSheet ? 'ok  ' : 'FAIL'} overview.png  (${slides.length} slides)`);
process.exit(failed || !okSheet ? 1 : 0);

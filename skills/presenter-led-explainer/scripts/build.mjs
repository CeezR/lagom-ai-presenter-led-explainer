#!/usr/bin/env node
/* Build a video's deck: deck.json + scenes/<id>.html -> index.html (the Reveal.js shell).
   Why: each slide is its own HTML page (scenes/), shown in an iframe; one invisible fragment per talking point makes the
   arrow key step through the points while the scene page animates. Press T in the deck to see the talking points.
   Run: node build.mjs [videos/001-slug] */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { videoDir } from './lib.mjs';

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** The Reveal shell page for a deck. */
export function deckPage(deck) {
  const secs = deck.slides.map(s => {
    const frags = s.points.map((_, j) => `<span class="fragment" data-fragment-index="${j}"></span>`).join('');
    return `<section data-scene="scenes/${s.id}.html"><iframe tabindex="-1"></iframe>${frags}</section>`;
  }).join('\n');
  const points = deck.slides.map(s => [s.title, ...s.points]);
  return `<!doctype html>
<html lang="${deck.lang ?? 'en'}"><head><meta charset="utf-8">
<title>${esc(deck.title)}</title>
<link rel="stylesheet" href="runtime/vendor/dist/reset.css">
<link rel="stylesheet" href="runtime/vendor/dist/reveal.css">
<style>
html,body{background:#fff}
.reveal .slides section{padding:0;height:100%;width:100%;text-align:left}
.reveal iframe{position:absolute;inset:0;width:1920px;height:1080px;border:0;pointer-events:none;background:#fff}
.reveal .fragment{display:none}
#pts{display:none;position:fixed;left:16px;bottom:16px;max-width:42vw;background:rgba(42,36,32,.92);color:#fff;font:600 20px/1.35 Kalam,cursive,sans-serif;padding:14px 18px;border-radius:12px;z-index:9}
#pts b{color:#F07A1A} #pts div{opacity:.35} #pts div.on{opacity:1}
</style></head>
<body>
<div class="reveal"><div class="slides">
${secs}
</div></div>
<div id="pts"></div>
<script src="runtime/vendor/dist/reveal.js"></script>
<script>
const POINTS = ${JSON.stringify(points)};
Reveal.initialize({width:1920,height:1080,margin:0,hash:true,controls:false,progress:false,transition:'fade',slideNumber:false,fragments:true});
const frame = s => s && s.querySelector('iframe');
const shown = s => s.querySelectorAll('.fragment.visible').length;
const all = () => [...document.querySelectorAll('.slides > section')];
function load(s) { const f = frame(s); if (f && !f.src.includes('scenes/')) f.src = s.dataset.scene; return f; }
function enter(s) {
  const f = load(s); if (!f) return;
  const send = () => f.contentWindow.postMessage({type: 'enter', step: shown(s)}, '*');
  if (f.dataset.ready) send(); else f.addEventListener('load', () => { f.dataset.ready = 1; send(); }, {once: true});
}
function near() { const a = all(), i = a.indexOf(Reveal.getCurrentSlide()); [a[i], a[i + 1]].forEach(s => s && load(s)); }
function notes() { const s = Reveal.getCurrentSlide(), i = all().indexOf(s), n = shown(s);
  document.getElementById('pts').innerHTML = POINTS[i].map((t, j) => j === 0 ? '<b>' + t + '</b>' : '<div class="' + (j <= n ? 'on' : '') + '">' + j + '. ' + t + '</div>').join(''); }
Reveal.on('ready', e => { near(); enter(e.currentSlide); notes(); });
Reveal.on('slidechanged', e => { near(); enter(e.currentSlide); notes(); });
const sync = () => { const s = Reveal.getCurrentSlide(), f = frame(s); if (f && f.contentWindow) f.contentWindow.postMessage({type: 'step', step: shown(s)}, '*'); notes(); };
Reveal.on('fragmentshown', sync); Reveal.on('fragmenthidden', sync);
addEventListener('keydown', e => { if (e.key === 't' || e.key === 'T') { const p = document.getElementById('pts'); p.style.display = p.style.display === 'block' ? 'none' : 'block'; } });
</script></body></html>`;
}

/** Build index.html for one video folder; complain about slides without a scene file. */
export function build(dir) {
  const deck = JSON.parse(readFileSync(join(dir, 'deck.json'), 'utf8'));
  for (const s of deck.slides) if (!existsSync(join(dir, 'scenes', `${s.id}.html`))) console.warn(`warning: scenes/${s.id}.html is missing`);
  writeFileSync(join(dir, 'index.html'), deckPage(deck));
  console.log(`built ${deck.slides.length} slides -> ${join(dir, 'index.html')}`);
}

if (process.argv[1]?.endsWith('build.mjs')) build(videoDir(process.argv[2]));

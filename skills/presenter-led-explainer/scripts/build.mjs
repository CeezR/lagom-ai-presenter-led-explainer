#!/usr/bin/env node
/* Build a video's deck: deck.json + scenes/<id>.html -> index.html (the Reveal.js shell).
   Why: each slide is its own HTML page (scenes/), shown in an iframe, and plays one continuous animation by itself.
   One key press = the next slide; nothing inside a slide needs a click. The talking points are speaker notes only.
   Keys in the deck: N = notes in a separate window (not recorded), T = notes on the slide, R = record.
   Run: node build.mjs [videos/001-slug] */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { skillDir, videoDir } from './lib.mjs';

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** The speaker notes of a slide (deck.json "notes"; "points" is the old name). */
const notesOf = s => s.notes ?? s.points ?? [];

/** The Reveal shell page for a deck: one slide = one scene page in an iframe = one click. No fragments inside a slide. */
export function deckPage(deck) {
  const secs = deck.slides.map(s => `<section data-scene="scenes/${s.id}.html"><iframe tabindex="-1"></iframe></section>`).join('\n');
  const notes = deck.slides.map(s => [s.title, ...notesOf(s)]);
  return `<!doctype html>
<html lang="${deck.lang ?? 'en'}"><head><meta charset="utf-8">
<title>${esc(deck.title)}</title>
<link rel="stylesheet" href="runtime/vendor/dist/reset.css">
<link rel="stylesheet" href="runtime/vendor/dist/reveal.css">
<style>
html,body{background:#fff}
.reveal .slides section{padding:0;height:100%;width:100%;text-align:left}
.reveal iframe{position:absolute;inset:0;width:1920px;height:1080px;border:0;pointer-events:none;background:#fff}
#pts{display:none;position:fixed;left:16px;bottom:16px;max-width:42vw;background:rgba(42,36,32,.92);color:#fff;font:600 20px/1.35 Kalam,cursive,sans-serif;padding:14px 18px;border-radius:12px;z-index:9}
#pts b{color:#F07A1A} #pts div{margin-top:6px}
</style></head>
<body>
<div class="reveal"><div class="slides">
${secs}
</div></div>
<div id="pts"></div>
<script src="runtime/vendor/dist/reveal.js"></script>
<script>
const NOTES = ${JSON.stringify(notes)};
Reveal.initialize({width:1920,height:1080,margin:0,hash:true,controls:false,progress:false,transition:'fade',slideNumber:false,fragments:false});
// on a wide screen the 16:9 stage is pinned to the left edge, so the free strip on the right is where the webcam bubble sits and the
// presenter's face never covers the picture. ?align=center brings Reveal's centred layout back. Reveal re-centres on every layout, so redo it after each.
const pinLeft = () => { if (new URLSearchParams(location.search).get('align') === 'center') return;
  const sl = document.querySelector('.reveal .slides'); if (!sl) return;
  const t = 'translate(0px, -50%) scale(' + Reveal.getScale() + ')';
  if (sl.style.transform !== t || sl.style.left !== '0px') { sl.style.left = '0px'; sl.style.transformOrigin = '0 50%'; sl.style.transform = t; } };
const all = () => [...document.querySelectorAll('.slides > section')];
const frame = s => s && s.querySelector('iframe');
function load(s) { const f = frame(s); if (f && !f.src.includes('scenes/')) { f.addEventListener('load', () => { f.dataset.ready = 1; }); f.src = s.dataset.scene; } return f; }
const tell = (f, type) => f && f.contentWindow && f.contentWindow.postMessage({type}, '*');
// the shown slide starts its animation; every other slide is paused
function enter(cur) {
  all().forEach(s => { const f = frame(s); if (s !== cur && f && f.dataset.ready) tell(f, 'leave'); });
  const f = load(cur); if (!f) return;
  if (f.dataset.ready) tell(f, 'enter'); else f.addEventListener('load', () => tell(f, 'enter'), {once: true});
}
function near() { const a = all(), i = a.indexOf(Reveal.getCurrentSlide()); [a[i], a[i + 1]].forEach(s => s && load(s)); }
// speaker notes: key N = separate window (not recorded), key T = on the slide
let popup = null;
function notes() { const i = all().indexOf(Reveal.getCurrentSlide());
  const html = NOTES[i].map((t, j) => j === 0 ? '<b>' + t + '</b>' : '<div>' + j + '. ' + t + '</div>').join('');
  document.getElementById('pts').innerHTML = html;
  if (popup && !popup.closed) popup.document.body.innerHTML = html; }
function openNotes() { popup = window.open('', 'notes', 'width=560,height=640'); if (!popup) return;
  popup.document.title = 'Notes'; popup.document.head.innerHTML = '<style>body{font:600 28px/1.4 Kalam,"Comic Sans MS",cursive;background:#2A2420;color:#fff;padding:20px}b{color:#F07A1A;font-size:34px}div{margin-top:14px}</style>'; notes(); }
Reveal.on('ready', e => { pinLeft(); near(); enter(e.currentSlide); notes(); });
Reveal.on('resize', pinLeft);
new MutationObserver(pinLeft).observe(document.querySelector('.reveal .slides'), {attributes: true, attributeFilter: ['style']});
Reveal.on('slidechanged', e => { near(); enter(e.currentSlide); notes(); });
addEventListener('keydown', e => { if (e.key === 'n' || e.key === 'N') { e.preventDefault(); e.stopPropagation(); openNotes(); }
  if (e.key === 't' || e.key === 'T') { const p = document.getElementById('pts'); p.style.display = p.style.display === 'block' ? 'none' : 'block'; } }, true);
</script>
<script src="runtime/recorder.js"></script>
</body></html>`;
}

/** The robot mascot (front view) from style/robot/robot.svg as one group, at the origin, with a marker in its right hand. */
export function robotGroup(scale = 1.8) {
  const svg = readFileSync(join(skillDir, 'style', 'robot', 'robot.svg'), 'utf8');
  const a = svg.indexOf('<g id="robot"'), b = svg.indexOf('<g id="robot-q"');
  const marker = '<g id="robot-marker" transform="rotate(-20)"><path d="M-8 -34L8 -34L8 30L0 48L-8 30Z" fill="#FFFFFF" stroke="#2A2420" stroke-width="4" stroke-linejoin="round"/>'
    + '<path d="M-5 34L0 48L5 34Z" fill="#F07A1A" stroke="#2A2420" stroke-width="3" stroke-linejoin="round"/></g>';
  return svg.slice(a, b)
    .replace('transform="translate(140 310)"', `transform="scale(${scale})"`)
    .replace(/(<g id="robot-hand-r"[^>]*>)/, `$1${marker}`);
}

/** Slides with "template": "intro" | "outro" get their scene page from templates/<name>.html, filled from deck.json "presenter"
    (name, brand, tagline) and the slide (caption, title). Rebuilt on every build, so the settings stay in one place. */
export function renderTemplate(dir, deck, s) {
  const p = { name: 'Your Name', brand: 'Your Brand', tagline: '', signoff: '', photo: '', ...deck.presenter };
  p.wordmark ??= p.brand;   // the big written word; defaults to the brand
  // photo (a file in the video folder, ideally square): a round portrait on the left with the name under it; without one the name sits under the tagline
  const photoBlock = p.photo ? `<g id="brand-photo" opacity="0"><clipPath id="photo-clip"><circle cx="535" cy="470" r="150"/></clipPath><image href="../${esc(p.photo)}" x="385" y="320" width="300" height="300" preserveAspectRatio="xMidYMid slice" clip-path="url(#photo-clip)"/><circle cx="535" cy="470" r="156" fill="none" stroke="#F07A1A" stroke-width="10"/></g>` : '';
  const caption = s.caption ?? esc((s.template === 'outro' ? [p.brand] : [p.name, p.brand]).filter(Boolean).join(' · '));   // the outro leaves the name to the intro   // s.caption may use <em> like any caption
  const html = readFileSync(join(skillDir, 'templates', `${s.template}.html`), 'utf8')
    .replaceAll('{{id}}', s.id).replaceAll('{{lang}}', deck.lang ?? 'en').replaceAll('{{title}}', esc(s.title ?? s.id))
    .replaceAll('{{photoBlock}}', photoBlock).replaceAll('{{nameX}}', p.photo ? 535 : 1195).replaceAll('{{nameY}}', p.photo ? 740 : 830)
    .replaceAll('{{wordmark}}', esc(p.wordmark)).replaceAll('{{signoff}}', esc(p.signoff)).replaceAll('{{name}}', esc(p.name)).replaceAll('{{brand}}', esc(p.brand)).replaceAll('{{tagline}}', esc(p.tagline))
    .replaceAll('{{caption}}', JSON.stringify(caption).replace(/<\//g, '<\\/')).replaceAll('{{robot}}', robotGroup());
  writeFileSync(join(dir, 'scenes', `${s.id}.html`), html);
}

/** Build index.html for one video folder; complain about slides without a scene file. */
export function build(dir) {
  const deck = JSON.parse(readFileSync(join(dir, 'deck.json'), 'utf8'));
  for (const s of deck.slides) if (s.template) renderTemplate(dir, deck, s);
  const ids = deck.slides.map(s => s.id);
  if (ids.join() !== [...ids].sort().join()) console.warn('note: slide ids are not in play order; run renumber.mjs so scenes/ lists them as they play');
  for (const s of deck.slides) if (!existsSync(join(dir, 'scenes', `${s.id}.html`))) console.warn(`warning: scenes/${s.id}.html is missing`);
  writeFileSync(join(dir, 'index.html'), deckPage(deck));
  console.log(`built ${deck.slides.length} slides -> ${join(dir, 'index.html')}`);
}

if (process.argv[1]?.endsWith('build.mjs')) build(videoDir(process.argv[2]));

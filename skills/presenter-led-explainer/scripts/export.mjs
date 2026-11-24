#!/usr/bin/env node
/* Turn a take (browser WebM) into an upload-ready MP4 and check that the result is valid.
   Why: the browser writes WebM without a duration and with a variable frame rate. LinkedIn, YouTube Studio previews and most
   editors reject or mis-handle that. This re-encodes to H.264 + AAC at a constant 29.97 fps with the index at the front, fits the picture into
   a 1920x1080 (16:9) frame with white bars (the deck page is white; slides with a tinted background show a visible edge) because LinkedIn sponsored posts only accept
   16:9, 1:1, 4:5 or 9:16 and under 30 fps, then verifies the file (streams, limits, A/V length, a full decode) and prints a pass/fail report.
   Needs ffmpeg and ffprobe on PATH. Never touches the take. Writes next to videos/NNN/out/ (or beside the file if it is not in takes/).
   Run: node export.mjs <take.webm> [--out file.mp4] [--crf 20] [--ss 0] [--to 389] [--keep-size] */
import { closeSync, existsSync, mkdirSync, openSync, readSync, renameSync, rmSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const valued = ['--out', '--crf', '--ss', '--to'].map(n => flag(n));
const keepSize = args.includes('--keep-size');   // skip the 16:9 frame and keep the recorded size
const input = args.find(a => !a.startsWith('--') && !valued.includes(a));
if (!input || !existsSync(input)) { console.error('usage: export <take.webm> [--out file.mp4] [--crf 20] [--ss START] [--to END]'); process.exit(1); }
for (const t of ['ffmpeg', 'ffprobe']) if (spawnSync(t, ['-version'], { windowsHide: true }).error) { console.error(`${t} not found. Install ffmpeg: https://ffmpeg.org`); process.exit(1); }

const src = resolve(input);
const outDir = basename(dirname(src)) === 'takes' ? join(dirname(dirname(src)), 'out') : dirname(src);
mkdirSync(outDir, { recursive: true });
const out = resolve(flag('--out', join(outDir, basename(src).replace(/\.\w+$/, '') + '.mp4')));
if (out === src) { console.error('refusing to overwrite the input'); process.exit(1); }

// 1. encode: constant 30 fps (fixes the timestamps), 4:2:0 8-bit, High profile, stereo AAC, moov atom first.
//    ffmpeg writes the index last, so it encodes to <out>.part and only a finished file gets the .mp4 name:
//    an interrupted export never leaves an .mp4 that will not open.
const trim = [...(flag('--ss') ? ['-ss', flag('--ss')] : []), ...(flag('--to') ? ['-to', flag('--to')] : [])];
const part = out + '.part';
console.log(`encoding ${basename(src)} -> ${out}`);
const enc = spawnSync('ffmpeg', ['-y', '-v', 'error', '-stats', ...trim, '-i', src,
  '-vf', (keepSize ? 'fps=30000/1001,scale=trunc(iw/2)*2:trunc(ih/2)*2' : 'fps=30000/1001,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:white,setsar=1') + ',format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', flag('--crf', '20'), '-profile:v', 'high', '-level', '4.2',
  '-af', 'aresample=async=1:first_pts=0', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-ac', '2', '-movflags', '+faststart', '-f', 'mp4', part], { stdio: 'inherit', windowsHide: true });
if (enc.status !== 0) { rmSync(part, { force: true }); console.error('ffmpeg failed'); process.exit(1); }
renameSync(part, out);

// 2. verify
const probe = JSON.parse(spawnSync('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', out], { encoding: 'utf8', windowsHide: true }).stdout || '{}');
const v = probe.streams?.find(s => s.codec_type === 'video'), a = probe.streams?.find(s => s.codec_type === 'audio'), f = probe.format ?? {};
const fps = v ? v.avg_frame_rate.split('/').reduce((x, y) => x / y) : 0, dur = +f.duration, size = statSync(out).size;
const top = (() => {   // is the moov atom before the media data? (the browser can start playing / the uploader can read it from the front)
  const fd = openSync(out, 'r'), names = []; let pos = 0;
  try { for (let i = 0; i < 8; i++) { const h = Buffer.alloc(16); if (!readSync(fd, h, 0, 16, pos)) break; let n = h.readUInt32BE(0); names.push(h.toString('latin1', 4, 8)); if (n === 1) n = Number(h.readBigUInt64BE(8)); if (!n) break; pos += n; } } finally { closeSync(fd); }
  return names;
})();
const dec = spawnSync('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'], { encoding: 'utf8', windowsHide: true });
const decodeErrors = (dec.stderr || '').split('\n').filter(Boolean).length;
const checks = [
  ['container is MP4', /mp4/.test(f.format_name ?? '')],
  ['video is H.264, yuv420p, even size', v?.codec_name === 'h264' && v.pix_fmt === 'yuv420p' && v.width % 2 === 0 && v.height % 2 === 0, v && `${v.codec_name} ${v.pix_fmt} ${v.width}x${v.height}`],
  ['constant frame rate under 30 (sponsored posts)', v && v.r_frame_rate === v.avg_frame_rate && fps > 29 && fps < 30, v && `${fps.toFixed(2)} fps`],
  ['audio is AAC at 48 kHz', a?.codec_name === 'aac' && +a.sample_rate === 48000, a && `${a.codec_name} ${a.sample_rate} Hz, ${a.channels} ch`],
  ['duration is real and within 3 s - 10 min', dur >= 3 && dur <= 600, `${dur.toFixed(1)} s`],
  ['audio and video are the same length (±0.25 s)', v && a && Math.abs(+v.duration - +a.duration) < .25, v && a && `${(+v.duration).toFixed(2)} vs ${(+a.duration).toFixed(2)} s`],
  ['aspect ratio 16:9, 1:1, 4:5 or 9:16 (sponsored posts)', v && [16 / 9, 1, .8, 9 / 16].some(r => Math.abs(v.width / v.height - r) < .01), v && (v.width / v.height).toFixed(3) + ':1'],
  ['size under 200 MB (sponsored limit is 500 MB)', size < 200e6, `${(size / 1e6).toFixed(1)} MB`],
  ['index (moov) before media data', top.indexOf('moov') >= 0 && top.indexOf('moov') < top.indexOf('mdat'), top.join(' ')],
  ['full decode has no errors', decodeErrors === 0, decodeErrors ? `${decodeErrors} error lines` : ''],
];
let ok = true;
console.log('\nChecks on ' + out);
for (const [name, pass, detail] of checks) { ok &&= !!pass; console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`); }
console.log(ok ? '\nValid. Upload this file.' : '\nNot valid: see the FAIL lines above.');
process.exit(ok ? 0 : 1);

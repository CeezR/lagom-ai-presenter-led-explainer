#!/usr/bin/env node
/* Transcribe a take with Whisper (subtitles + text next to the take).
   Why: the transcript is what the AI edits from: cut mistakes, find chapters, write the description.
   Needs the "whisper" command (pip install openai-whisper) and ffmpeg on PATH. Nothing is sent to a service.
   Run: node transcribe.mjs <takes/take-....mkv> [--model small] [--lang sv] */
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const file = args.find(a => !a.startsWith('--') && a !== flag('--model') && a !== flag('--lang'));
if (!file) { console.error('usage: transcribe <take file> [--model small] [--lang sv]'); process.exit(1); }
const abs = resolve(file);
const w = ['--model', flag('--model', 'small'), '--output_format', 'all', '--output_dir', dirname(abs), ...(flag('--lang') ? ['--language', flag('--lang')] : []), abs];
const r = spawnSync('whisper', w, { stdio: 'inherit', shell: process.platform === 'win32' });
if (r.error || r.status !== 0) {
  console.error('\nCould not run Whisper. Install it with:  pip install openai-whisper   (it also needs ffmpeg: https://ffmpeg.org)\nAny other transcriber works too: save the result as a .srt or .txt next to the take.');
  process.exit(1);
}

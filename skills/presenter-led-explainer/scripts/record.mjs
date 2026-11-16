#!/usr/bin/env node
/* Present and record in the browser: serve the deck on localhost and open it in Chrome or Edge.
   Why: the deck is a web page, so the browser can record it (tab + webcam + mic) with no extra software.
   In the page press R to start (3-2-1) and R again to stop; takes are saved to videos/NNN-slug/takes/. N opens the notes window.
   Run: node record.mjs [videos/001-slug] [--no-open] */
import { spawn, spawnSync } from 'node:child_process';
import { serve } from './serve.mjs';
import { videoDir } from './lib.mjs';

const args = process.argv.slice(2);
const dir = videoDir(args.find(a => !a.startsWith('--')));
const { url } = await serve(dir);

/** Open Chrome or Edge (they can record tabs); fall back to the default browser. */
function openBrowser(u) {
  if (process.platform === 'win32') {
    for (const b of ['msedge', 'chrome']) if (spawnSync('cmd', ['/c', 'start', '""', b, u], { stdio: 'ignore' }).status === 0) return;
  } else if (process.platform === 'darwin') {
    for (const b of ['Google Chrome', 'Microsoft Edge']) if (spawnSync('open', ['-a', b, u], { stdio: 'ignore' }).status === 0) return;
  }
  spawn(process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open', process.platform === 'win32' ? ['/c', 'start', '""', u] : [u], { stdio: 'ignore', detached: true }).unref();
}

console.log(`Deck:   ${url}\nTakes:  ${dir}/takes\n\nIn the browser: F11 for full screen, R = start/stop recording, N = notes window, arrow keys = next point.\nPress Ctrl+C here when you are done.`);
if (!args.includes('--no-open')) openBrowser(url);

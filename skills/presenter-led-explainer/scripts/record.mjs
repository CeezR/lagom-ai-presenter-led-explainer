#!/usr/bin/env node
/* Present and record in the browser: serve the deck on localhost and open it in Chrome or Edge.
   Why: the deck is a web page, so the browser can record it (tab + webcam + mic) with no extra software.
   In the page press R to start (3-2-1) and R again to stop; takes are saved to videos/NNN-slug/takes/. N opens the notes window.
   Run: node record.mjs [videos/001-slug] [--no-open] */
import { spawn, spawnSync } from 'node:child_process';
import { exportsRunning, serve } from './serve.mjs';
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

// Ctrl+C while an MP4 is being made: say so and wait for it. A second Ctrl+C leaves at once; the export runs detached
// (see serve.mjs), so it still finishes in the background and the MP4 still lands in out/.
let warned = false;
process.on('SIGINT', async () => {
  const jobs = exportsRunning();
  if (!jobs.length) process.exit(0);
  if (warned) { console.log('\nClosing. The MP4 is still being made in the background and will appear in out/ when it is done.'); process.exit(0); }
  warned = true;
  const ago = j => { const m = Math.round((Date.now() - j.started) / 60000); return m ? `started ${m} min ago` : 'just started'; };
  const list = jobs.map(j => `${j.name} (${ago(j)})`).join(', ');
  console.log(`\nWait: the MP4 is still being made for ${list}.\nThis closes by itself when it is done. Press Ctrl+C again to close now; the MP4 is still finished in the background.`);
  await Promise.all(jobs.map(j => j.promise));
  process.exit(0);
});

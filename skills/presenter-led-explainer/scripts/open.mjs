#!/usr/bin/env node
/* Open a video's deck in the default browser. Why: one command to start presenting; F11 for full screen, arrow keys to step. */
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { openPath, videoDir } from './lib.mjs';
const url = pathToFileURL(join(videoDir(process.argv[2]), 'index.html')).href;
console.log('opening', url);
openPath(url);

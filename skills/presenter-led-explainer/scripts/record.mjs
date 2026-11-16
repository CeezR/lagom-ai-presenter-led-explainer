#!/usr/bin/env node
/* Start OBS recording straight into the video's takes/ folder.
   Why: so a recording never has to be moved or renamed by hand. It writes an OBS profile ("presenter-led-explainer":
   1080p30, recordings go to this video's takes/), then launches OBS with that profile and --startrecording.
   OBS must be installed, and have a scene with your screen, webcam and mic (see reference/obs-setup.md). Stop in OBS.
   Run: node record.mjs [videos/001-slug] [--collection "Scene collection name"] [--dry-run] */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';
import { videoDir } from './lib.mjs';

const PROFILE = 'presenter-led-explainer';
const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const ci = args.indexOf('--collection');
const collection = ci >= 0 ? args[ci + 1] : null;
const dir = videoDir(args.find(a => !a.startsWith('--') && a !== collection));
const takes = join(dir, 'takes');

/** Where this OS keeps OBS: [executable candidates, config folder]. */
function obsPaths() {
  if (process.platform === 'win32') {
    const pf = [process.env.ProgramFiles, process.env['ProgramFiles(x86)']].filter(Boolean);
    return [pf.map(p => join(p, 'obs-studio', 'bin', '64bit', 'obs64.exe')), join(process.env.APPDATA ?? '', 'obs-studio')];
  }
  if (process.platform === 'darwin') return [['/Applications/OBS.app/Contents/MacOS/OBS'], join(homedir(), 'Library', 'Application Support', 'obs-studio')];
  return [['/usr/bin/obs', '/usr/local/bin/obs'], join(homedir(), '.config', 'obs-studio')];
}
const [exes, config] = obsPaths();
const exe = exes.find(existsSync);
if (!exe && !dry) { console.error('OBS Studio not found. Install it from https://obsproject.com and run this again.\nLooked in:\n  ' + exes.join('\n  ')); process.exit(1); }

const ini = `[General]
Name=${PROFILE}

[Video]
BaseCX=1920
BaseCY=1080
OutputCX=1920
OutputCY=1080
FPSType=0
FPSCommon=30

[Output]
Mode=Simple

[SimpleOutput]
FilePath=${takes}
RecFormat2=mkv
RecQuality=Stream
FilenameFormatting=take-%CCYY%MM%DD-%hh%mm%ss
`;
const profileDir = join(config, 'basic', 'profiles', PROFILE);
const obsArgs = ['--profile', PROFILE, '--startrecording', ...(collection ? ['--collection', collection] : [])];
console.log(`OBS: ${exe ?? '(not installed)'}\nprofile: ${join(profileDir, 'basic.ini')}\ntakes:   ${takes}\nlaunch:  ${obsArgs.join(' ')}`);
if (dry) process.exit(0);

mkdirSync(takes, { recursive: true });
mkdirSync(profileDir, { recursive: true });
writeFileSync(join(profileDir, 'basic.ini'), ini);
// OBS looks for its data folder relative to the working directory on Windows, so start it from its own folder.
spawn(exe, obsArgs, { cwd: dirname(exe), stdio: 'ignore', detached: true }).unref();
console.log('OBS is starting and will begin recording. Open the deck (node open.mjs), present, then stop the recording in OBS.\nIf OBS was already running, close it first so the profile is picked up.');

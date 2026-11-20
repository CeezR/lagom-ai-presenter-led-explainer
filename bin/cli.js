#!/usr/bin/env node
/* Entry point for `npx github:CeezR/lagom-ai-presenter-led-explainer <command>`.
   Why: the repo folder skills/presenter-led-explainer IS the skill, so install = copy that folder to where the agent looks.
   The other commands just run the skill's own scripts, so they behave the same installed or from the repo. */
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const SKILL = 'presenter-led-explainer';
const skillDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'skills', SKILL);
const [cmd, ...args] = process.argv.slice(2);

// agent -> [project folder, personal folder]
const TARGETS = {
  claude: ['.claude/skills', '.claude/skills'],
  copilot: ['.github/skills', '.copilot/skills'],
  agents: ['.agents/skills', '.agents/skills'],
};

function install(flags) {
  const agent = Object.keys(TARGETS).find(a => flags.includes('--' + a)) ?? 'claude';
  const personal = flags.includes('--global');
  const dirFlag = flags.indexOf('--dir');
  const base = dirFlag >= 0 ? resolve(flags[dirFlag + 1]) : personal ? join(homedir(), TARGETS[agent][1]) : join(process.cwd(), TARGETS[agent][0]);
  const dest = join(base, SKILL);
  if (existsSync(dest)) rmSync(dest, { recursive: true });
  mkdirSync(base, { recursive: true });
  cpSync(skillDir, dest, { recursive: true });
  console.log(`Installed ${SKILL} -> ${dest}\nNext: ask your agent to make a presenter-led explainer, or run  node ${join(dest, 'scripts', 'new.mjs')} my-first-video`);
}

if (cmd === 'install') install(args);
else if (['new', 'build', 'open', 'record', 'transcribe', 'export', 'capture', 'renumber'].includes(cmd)) {
  const r = spawnSync(process.execPath, [join(skillDir, 'scripts', `${cmd}.mjs`), ...args], { stdio: 'inherit' });
  process.exit(r.status ?? 1);
} else {
  console.log(`presenter-led-explainer
  install [--claude|--copilot|--agents] [--global] [--dir <path>]   copy the skill where your agent reads skills
  new <slug> [--name N --brand B --tagline T]   scaffold videos/NNN-slug/ (script, deck with intro + outro, takes)
  build [video]     rebuild the deck's index.html from deck.json
  open [video]      open the deck in your browser
  record [video]    serve the deck and record in the browser (R = start/stop)
  transcribe <file> transcribe a take with Whisper`);
}

#!/usr/bin/env node
/* Scaffold a new video: videos/NNN-slug/ with script.md, deck.json, one scene per slide, the runtime and an empty takes/.
   Why: every video starts from the same structure, so the agent, the deck and the recorder always know where things are.
   Run: node new.mjs <slug> [--title "Name"] [--lang sv] */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { skillDir, videosDir } from './lib.mjs';
import { build } from './build.mjs';

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const slug = args.find(a => !a.startsWith('--') && a !== flag('--title') && a !== flag('--lang'));
if (!slug || !/^[a-z0-9-]+$/.test(slug)) { console.error('usage: new <slug>   (lowercase letters, digits, dashes)'); process.exit(1); }
const title = flag('--title', slug.replace(/-/g, ' ')), lang = flag('--lang', 'en');

const root = videosDir();
mkdirSync(root, { recursive: true });
const n = readdirSync(root).filter(d => /^\d{3}-/.test(d)).length + 1;
const dir = join(root, `${String(n).padStart(3, '0')}-${slug}`);
if (existsSync(dir)) { console.error(dir, 'already exists'); process.exit(1); }

const slides = [{ id: 's01', title: 'Opening', points: ['The question this video answers.', 'Why it matters.'] }];
mkdirSync(join(dir, 'scenes'), { recursive: true });
mkdirSync(join(dir, 'takes'));
writeFileSync(join(dir, 'takes', '.gitkeep'), '');
cpSync(join(skillDir, 'runtime'), join(dir, 'runtime'), { recursive: true });
writeFileSync(join(dir, 'deck.json'), JSON.stringify({ title, lang, slides }, null, 2) + '\n');
writeFileSync(join(dir, 'script.md'), `# ${title}\n\n- **Question:** \n- **One core idea:** \n- **Audience:** \n\n## Slide 1: Opening\nWhat you say, in your own words.\n`);
const tpl = readFileSync(join(skillDir, 'templates', 'scene.html'), 'utf8');
for (const s of slides) writeFileSync(join(dir, 'scenes', `${s.id}.html`), tpl
  .replaceAll('{{id}}', s.id).replaceAll('{{title}}', s.title).replaceAll('{{lang}}', lang).replaceAll('{{steps}}', s.points.length)
  .replace('{{captions}}', s.points.map(p => `  ${JSON.stringify(p)},`).join('\n')));
build(dir);
console.log(`created ${dir}\nNext: write script.md, edit deck.json + scenes/, then "open" to preview and "record" to film.`);

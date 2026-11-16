/* Shared helpers: where the skill lives, which video folder a command works on, and how to open things on this OS. */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

export const skillDir = join(dirname(fileURLToPath(import.meta.url)), '..');
export const videosDir = () => join(process.cwd(), 'videos');

/** The video folder to act on: the argument, or the newest videos/NNN-* folder. */
export function videoDir(arg) {
  if (arg && !arg.startsWith('--')) return resolve(arg);
  const root = videosDir();
  const all = existsSync(root) ? readdirSync(root).filter(d => /^\d{3}-/.test(d) && statSync(join(root, d)).isDirectory()).sort() : [];
  if (!all.length) throw new Error('No videos/NNN-slug folder here. Run "new <slug>" first.');
  return join(root, all.at(-1));
}

/** Open a file or URL with the OS default app. */
export function openPath(p) {
  const [cmd, args] = process.platform === 'win32' ? ['cmd', ['/c', 'start', '""', p]] : process.platform === 'darwin' ? ['open', [p]] : ['xdg-open', [p]];
  spawn(cmd, args, { stdio: 'ignore', detached: true }).unref();
}

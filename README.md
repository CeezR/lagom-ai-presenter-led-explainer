# Presenter-led explainer

An AI agent skill for making **presenter-led explainer videos**: you talk to a Reveal.js deck while your browser records your face,
voice and the slides. No recording software to install. The AI helps with the idea, the script, the slides and the edit. You are always the voice.

```
idea  ->  script.md + deck (one self-playing animation per slide, speaker notes for you)  ->  you approve  ->  record in the browser (a few takes)  ->  AI edits
```

## Install

Needs Node 18+. From your project folder:

```sh
npx github:CeezR/lagom-ai-presenter-led-explainer install --claude    # .claude/skills/
npx github:CeezR/lagom-ai-presenter-led-explainer install --copilot   # .github/skills/
npx github:CeezR/lagom-ai-presenter-led-explainer install --agents    # .agents/skills/
```

Add `--global` to install for all your projects (`~/.claude/skills`, `~/.copilot/skills`, `~/.agents/skills`),
or `--dir <path>` for any other folder. The repo folder `skills/presenter-led-explainer/` is exactly what gets installed.
Check your agent's documentation if it reads skills from another location.

Then ask your agent: *"Make a presenter-led explainer about ..."*. It follows `SKILL.md`.

## Commands

Run through npx or directly from the installed skill (`node <skill>/scripts/<name>.mjs`):

| Command | What it does |
|---|---|
| `new <slug>` | Scaffold `videos/NNN-slug/`: `script.md`, `deck.json`, `scenes/`, `runtime/`, `takes/` |
| `build [video]` | Rebuild `index.html` from `deck.json` |
| `open [video]` | Open the deck in your browser without recording (arrow keys = next slide, **N** speaker notes in a separate window) |
| `record [video]` | Serve the deck on localhost and open it in Chrome/Edge. **R** start/stop recording, **N** notes window, F11 full screen. Takes are saved in `takes/` |
| `transcribe <take>` | Whisper transcript, the basis for AI editing |

## Requirements

- Chrome or Edge (already on Windows) and Node 18+. The browser asks once per session for camera, microphone and "share this tab".
- Optional: `ffmpeg`, `auto-editor` and `openai-whisper` for editing and transcripts.

## What is in the skill

- `SKILL.md`: the workflow the agent follows.
- `runtime/`: Reveal.js, the scene stylesheet and a small animation engine (`motion.js`, conveyor and office kits).
- `style/`: the default look (palette, handwriting font, object-only world rules, robot mascot).
- `templates/`: the scene page.
- `examples/001-produktivitet/`: a finished 13-slide animated deck (Swedish). Open its `index.html`.
- `reference/`: deck format, recording, editing.

No recordings, keys or accounts are involved. Takes stay in each video's `takes/` folder and are gitignored.

MIT licensed. Kalam font: SIL OFL (see `runtime/vendor/OFL.txt`). Reveal.js: MIT.

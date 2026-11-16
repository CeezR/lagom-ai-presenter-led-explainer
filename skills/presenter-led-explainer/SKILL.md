---
name: presenter-led-explainer
description: Plan and produce a presenter-led explainer video where a human talks to a Reveal.js deck while OBS records their face, voice and screen. Use when the user wants to turn a topic or idea into an explainer video, write the script and slides for one, start a recording, or edit a recorded take.
---

# Presenter-led explainer

The human is the presenter. Your job is everything around them: shape the idea, write a script they can read or listen to,
build a deck they can talk to, get OBS recording, and edit the take afterwards. You never synthesize their voice.

## Workflow

1. **Discuss the idea.** Settle three things with the user before writing anything: the question the video answers,
   the one core idea, and the audience. Keep the video to one idea. Ask only what you cannot decide yourself.
2. **Scaffold.** From the user's project root run `node <skill>/scripts/new.mjs <slug> [--title "..."] [--lang sv]`.
   This creates `videos/NNN-slug/` with `script.md`, `deck.json`, `scenes/`, `runtime/` and `takes/`.
3. **Write `script.md`.** One section per slide, in the language the user will speak. It is a listening script: the user
   reads or hears it to prepare, then talks freely on camera. They do not read it aloud. Short sentences, concrete examples.
4. **Build the deck.** One slide = one entry in `deck.json` (`id`, `title`, 2-4 `points`) + one file `scenes/<id>.html`.
   Read `reference/deck-format.md` for the page contract and `style/STYLE.md` for the look. The points are the presenter's
   reminders: each arrow-key press reveals the next point, and the scene shows one handwritten caption per point.
   Run `node <skill>/scripts/build.mjs` after changing `deck.json`.
5. **Review with the user.** Run `node <skill>/scripts/open.mjs`. The user steps through the deck (arrow keys, T = talking
   points). Iterate until they approve the script and the slides. Do not record before they approve.
6. **Record.** `node <skill>/scripts/record.mjs` starts OBS recording into `videos/NNN-slug/takes/`. The user presents a few
   takes and stops OBS. First time on a machine: follow `reference/obs-setup.md`.
7. **Edit.** `node <skill>/scripts/transcribe.mjs takes/<file>` gives a transcript. Then follow `reference/editing.md`:
   pick the best take, cut mistakes and dead air, add chapters, write the title and description. Keep the original takes.

## Rules

- Recordings (`*.mkv`, `*.mp4`, audio) stay local and gitignored. Never commit them or upload them anywhere without asking.
- Never ask for, print or store API keys. Nothing in this skill needs one.
- Follow `style/STYLE.md` unless the user gives another direction. Hand-authored SVG only, no raster images in decks.
- Keep each slide simple. If a scene needs more than a few objects and one motion, split the slide.
- Do not commit or publish unless the user asks.

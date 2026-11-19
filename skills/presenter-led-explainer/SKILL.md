---
name: presenter-led-explainer
description: Plan and produce a presenter-led explainer video where a human talks to a Reveal.js deck while the browser records their face, voice and the slides. Use when the user wants to turn a topic or idea into an explainer video, write the script and slides for one, start a recording, or edit a recorded take.
---

# Presenter-led explainer

The human is the presenter. Your job is everything around them: shape the idea, write a script they can read or listen to,
build a deck they can talk to, get the recording running in the browser, and edit the take afterwards. You never synthesize their voice.

## Workflow

1. **Discuss the idea.** Settle three things with the user before writing anything: the question the video answers,
   the one core idea, and the audience. Keep the video to one idea. Ask only what you cannot decide yourself.
2. **Scaffold.** From the user's project root run `node <skill>/scripts/new.mjs <slug> [--title "..."] [--lang sv]`.
   Add `--name "..." --brand "..." [--tagline "..."]` for the presenter (ask the user once; they land in `deck.json` "presenter").
   This creates `videos/NNN-slug/` with `script.md`, `deck.json`, `scenes/`, `runtime/` and `takes/`, and a deck that already has
   the three fixed slides: the hook (`s01`), the intro (`intro`) and the outro (`outro`).
3. **Write `script.md`.** Start with the hook, then the intro, end with the outro (see "Start and end" below). One section per slide, in the language the user will speak. It is a listening script: the user
   reads or hears it to prepare, then talks freely on camera. They do not read it aloud. Short sentences, concrete examples.
4. **Build the deck.** One slide = one entry in `deck.json` (`id`, `title`, `notes`) + one file `scenes/<id>.html`.
   Read `reference/deck-format.md` for the page contract and `style/STYLE.md` for the look. Follow the slide rules below.
   Run `node <skill>/scripts/build.mjs` after changing `deck.json`.
5. **Review with the user.** Run `node <skill>/scripts/open.mjs`. The user steps through the deck with the arrow keys (N = notes
   window). Iterate until they approve the script and the slides. Do not record before they approve.
6. **Record.** `node <skill>/scripts/record.mjs` serves the deck on localhost and opens it in Chrome or Edge. In the page: F11 for
   full screen, **R** starts (3-2-1) and **R** stops, arrow keys go to the next slide, **N** opens the speaker notes in a
   separate window that is not recorded. The webcam appears as a bubble in the corner. Takes land in `videos/NNN-slug/takes/`.
   The user presents a few takes. Details: `reference/recording.md`.
7. **Export and edit.** Stopping a recording already makes a checked, upload-ready MP4 in `out/` (the raw WebM in `takes/` is not accepted by LinkedIn); redo or trim it with `node <skill>/scripts/export.mjs takes/<file> --to <seconds>`. `node <skill>/scripts/transcribe.mjs takes/<file>` gives a transcript. Then follow `reference/editing.md`:
   pick the best take, cut mistakes and dead air, add chapters, write the title and description. Keep the original takes.

## Slide rules (the presenter is winging it live)

- **One click per slide.** The next slide is the only reveal. Nothing inside a slide waits for a key press, so the presenter never
  has to time a click to what they are saying.
- **One continuous animation per slide.** It starts by itself when the slide appears and builds in roughly 10 seconds (the
  length is up to the slide). `data-cues` times its internal steps. It then rests in a final state that carries the whole message,
  so the picture is right whether the presenter talks for 20 seconds or 2 minutes.
- **Loop or play once.** Prefer a loop (`data-loop`): the build-up fades out and starts over, with ambient motion (belts,
  engines, spinning parts) running throughout, so nothing pops in and out awkwardly. Play once (no `data-loop`) when the end state
  is the point and replaying would look wrong, e.g. a part is swapped, a curve is drawn: build once, then only ambient motion.
- **One idea per slide.** If an idea needs steps the presenter must trigger, split it into two slides.
- **The slide shows one caption line, not the talking points.** `notes` in `deck.json` are speaker notes for the presenter's eyes
  only (N = separate window that is not recorded). Never put several talking points on screen.

## Start and end (every video)

- **Hook first, then the presenter.** `s01` is the question of the video, so viewers know in seconds why to stay. Right after it
  comes `intro` (15-20 s): who the presenter is, what they do, their brand, what the channel explains, what this video covers.
  On a first video they may say a little more about why the channel exists.
- **Outro last.** One sentence that sums up the idea, then the sign-off: name, brand, "see you in the next video", what the next
  video is about, and optionally where to find more (a link in the description). No sales pitch on screen, and no engagement
  bait: do not tell viewers to like, subscribe or comment, and do not end on a question to the viewer unless the user asks for it.
- **Templates.** Slides with `"template": "intro"` or `"outro"` are generated by `build.mjs` from `templates/intro.html` and
  `templates/outro.html`: the wordmark writes itself and is underlined, the presenter's photo and name fade in (intro), or the sign-off line does (outro).
  The text comes from `deck.json` "presenter" (`name`, `brand`, `tagline`) and an optional slide `caption`, so change it there,
  not in the scene file. To make an outro that ties back to the video's own picture (e.g. the example's calm conveyor belt),
  drop `template` from the slide and write `scenes/outro.html` yourself; `runtime/brand.js` (`brandWrite`) still writes the name.

## Rules

- Recordings (`*.mkv`, `*.mp4`, audio) stay local and gitignored. Never commit them or upload them anywhere without asking.
- Never ask for, print or store API keys. Nothing in this skill needs one.
- Follow `style/STYLE.md` unless the user gives another direction. Hand-authored SVG only, no raster images in decks.
- Keep each slide simple. If a scene needs more than a few objects and one motion, split the slide.
- Do not commit or publish unless the user asks.

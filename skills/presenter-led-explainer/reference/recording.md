# Recording in the browser

`node scripts/record.mjs` starts a small server on `http://localhost:4173/` (127.0.0.1 only) and opens the deck in Chrome or Edge.
Why a server: a localhost page keeps camera/mic permissions, and it lets the page save the recording straight into `takes/`.

In the deck page:
- **F11** full screen. Use a 16:9 window so the video is 16:9.
- **R** start. The browser asks for camera and microphone, shows your webcam bubble in the corner, then asks to share
  this tab (choose "This tab"). After a 3-2-1 countdown it records the slides plus the bubble, with your microphone.
- **R** again stops. The page confirms "Saved takes/take-YYYYMMDD-HHMMSS.webm". Chrome's own "Stop sharing" button also stops.
- **Arrow keys** go to the next or previous slide; each slide plays its animation by itself. **N** opens your speaker notes in a
  separate window (only the tab is recorded, so that window never appears in the video; put it on a second monitor).
  **T** shows them on the slide (that is recorded).
- Bubble position and size: add to the address, e.g. `?cam=bl` (bl, br, tl, tr) and `&size=22` (% of the page width).
- On a screen wider than 16:9 the slides are pinned to the left edge, so the free strip on the right is where the bubble sits and it stays off the picture. Add `&align=center` to centre the slides instead.

Video is written to disk once a second, so a crash loses at most a second. The raw take is WebM (VP9 + Opus) in `takes/`, a recording format that LinkedIn and most editors reject. When you stop, the page asks the
server to turn it into an MP4 (`out/<same name>.mp4`, H.264 + AAC, constant 30 fps) and check it; the toast says when it is ready. That MP4 is the file to
upload. To redo it, or to trim the end: `node scripts/export.mjs takes/<file>.webm --to <seconds>`. Needs ffmpeg; without it you keep the WebM.
Nothing leaves the machine. If the browser blocks camera, microphone or screen capture (some company policies do),
the page shows the error: ask IT, or use any other recorder and drop the file in `takes/`.
Firefox and Safari cannot capture the current tab this way: use Chrome or Edge.

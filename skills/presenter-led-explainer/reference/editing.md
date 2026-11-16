# Editing a take

Tools: `ffmpeg` (https://ffmpeg.org) and optionally `auto-editor` (`pip install auto-editor`). Keep the originals in `takes/`; write results to `out/` (gitignored).

1. **Transcribe**: `node scripts/transcribe.mjs takes/<file>.mkv` writes `.srt`, `.txt` and `.json` next to the take.
2. **Choose the take**: read the transcripts, pick the one with the cleanest delivery. Tell the user which and why.
3. **Cut dead air**: `auto-editor takes/<file>.mkv --margin 0.3sec -o out/<name>.mp4`.
4. **Cut mistakes**: from the transcript timestamps list the segments to drop, then cut with ffmpeg
   (`ffmpeg -i in.mp4 -ss START -to END -c copy part.mp4`, then concat). Confirm the cut list with the user first.
5. **Chapters and text**: write chapter timestamps (one per slide, from the transcript), a title and a short description to `out/<name>.md`.
6. **Subtitles**: the `.srt` can be burned in or uploaded as a caption file.
Never delete a take. Never upload anything without being asked.

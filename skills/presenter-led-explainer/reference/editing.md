# Editing a take

Tools: `ffmpeg` (https://ffmpeg.org) and optionally `auto-editor` (`pip install auto-editor`). Keep the originals in `takes/`; write results to `out/` (gitignored).

0. **Make it editable**: browser recordings are WebM without a duration. First re-encode once:
   `ffmpeg -i takes/<file>.webm -c:v libx264 -crf 18 -c:a aac out/<name>.mp4`. Use that file below. The last second of a take shows the R key press: trim it.
1. **Transcribe**: `node scripts/transcribe.mjs takes/<file>.webm` writes `.srt`, `.txt` and `.json` next to the take.
2. **Choose the take**: read the transcripts, pick the one with the cleanest delivery. Tell the user which and why.
3. **Cut dead air**: `auto-editor takes/<file>.webm --margin 0.3sec -o out/<name>.mp4`.
4. **Cut mistakes**: from the transcript timestamps list the segments to drop, then cut with ffmpeg
   (`ffmpeg -i in.mp4 -ss START -to END -c copy part.mp4`, then concat). Confirm the cut list with the user first.
5. **Chapters and text**: write chapter timestamps (one per slide, from the transcript), a title and a short description to `out/<name>.md`.
6. **Subtitles**: the `.srt` can be burned in or uploaded as a caption file.
Never delete a take. Never upload anything without being asked.

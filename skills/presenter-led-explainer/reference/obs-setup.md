# OBS setup (once per machine)

1. Install OBS Studio from https://obsproject.com.
2. Create a scene (e.g. "Presenter") with three sources:
   - **Display Capture** (or Window Capture of the browser showing the deck, full screen with F11).
   - **Video Capture Device**: your webcam. Make it small and put it in the bottom-right or bottom-left corner. Optional:
     a rounded corner via Filters > Image Mask/Blend.
   - **Audio Input Capture**: your microphone. Add the **Noise Suppression** filter.
3. Settings > Video: base and output resolution 1920x1080, 30 fps. (`record.mjs` writes this into its own profile.)
4. Put the talking-points panel (key T in the deck) on a second monitor, or leave it off: it is part of the page and would be recorded.
5. `node scripts/record.mjs` starts OBS with the profile "presenter-led-explainer" and recording into the video's `takes/`.
   Pass `--collection "<name>"` to use a specific scene collection. Close OBS first if it is already running.
6. Stop the recording in OBS (or with your hotkey). Files are named `take-YYYYMMDD-HHMMSS.mkv`.

Optional: OBS plugin "Source Record" saves webcam and screen as separate files, so the AI can re-lay-out later.
If the recording is mkv and an editor needs mp4: `ffmpeg -i take.mkv -c copy take.mp4`.

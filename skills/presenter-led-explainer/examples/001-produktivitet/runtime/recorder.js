/* Record the deck from inside the browser: webcam bubble + this tab + microphone -> takes/ via the local server.
   Why: replaces a separate recording program. Press R to start (3-2-1) and R again to stop. Works on http://localhost
   (node scripts/record.mjs). Output is WebM; edit it with ffmpeg. */
(() => {
  const local = location.protocol === 'http:' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const q = new URLSearchParams(location.search);
  let rec = null, cam = null, bubble = null, busy = false;
  const state = window.__rec = { recording: false, file: null, bytes: 0, error: null };

  const el = (tag, css, parent = document.body) => { const e = document.createElement(tag); e.style.cssText = css; parent.appendChild(e); return e; };
  const toast = (msg, ms = 3500) => { const t = el('div', 'position:fixed;left:50%;top:24px;transform:translateX(-50%);background:#2A2420;color:#fff;font:600 22px Kalam,sans-serif;padding:10px 20px;border-radius:12px;z-index:99'); t.textContent = msg; setTimeout(() => t.remove(), ms); };
  const stamp = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `take-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.webm`; };

  /** The webcam bubble in a corner of the page. It is part of the page, so the tab capture records it. ?cam=bl|br|tl|tr&size=18 (size = % of the page width) */
  function showBubble(stream) {
    const pos = q.get('cam') ?? 'br', size = +(q.get('size') ?? 18);
    bubble = el('video', `position:fixed;${pos[0] === 't' ? 'top' : 'bottom'}:2vw;${pos[1] === 'l' ? 'left' : 'right'}:2vw;width:${size}vw;aspect-ratio:4/3;object-fit:cover;border-radius:2vw;border:.4vw solid #2A2420;background:#2A2420;z-index:50`);
    bubble.muted = true; bubble.autoplay = true; bubble.playsInline = true; bubble.srcObject = new MediaStream(stream.getVideoTracks());
  }

  async function countdown() {
    const c = el('div', 'position:fixed;inset:0;display:grid;place-items:center;font:700 260px Kalam,sans-serif;color:#F07A1A;z-index:99;background:rgba(255,255,255,.55)');
    for (const n of [3, 2, 1]) { c.textContent = n; await new Promise(r => setTimeout(r, 900)); }
    c.remove(); await new Promise(r => setTimeout(r, 250));   // let the overlay leave the picture before recording starts
  }

  async function start() {
    cam = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: { echoCancellation: true, noiseSuppression: true } });
    showBubble(cam);
    const tab = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: false, preferCurrentTab: true, selfBrowserSurface: 'include', surfaceSwitching: 'exclude' });
    await countdown();
    const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m));
    rec = new MediaRecorder(new MediaStream([...tab.getVideoTracks(), ...cam.getAudioTracks()]), { mimeType: mime, videoBitsPerSecond: 6e6 });
    const name = stamp();
    let first = true, queue = Promise.resolve();
    rec.ondataavailable = e => {                       // chunks go to the server one after the other, in order
      if (!e.data.size) return;
      const f = first; first = false; state.bytes += e.data.size;
      queue = queue.then(() => fetch(`/api/take?name=${name}${f ? '&first=1' : ''}`, { method: 'POST', body: e.data })).catch(err => { state.error = String(err); });
    };
    rec.onstop = async () => {
      await queue;
      [tab, cam].forEach(s => s.getTracks().forEach(t => t.stop()));
      bubble?.remove(); bubble = null; rec = null; state.recording = false; document.title = document.title.replace('● ', '');
      toast(state.error ? 'Saving failed: ' + state.error : `Saved takes/${name}`);
    };
    tab.getVideoTracks()[0].onended = () => rec && rec.state !== 'inactive' && rec.stop();   // the browser's own "Stop sharing" button
    rec.start(1000);
    state.recording = true; state.file = name; document.title = '● ' + document.title;
  }

  async function toggle() {
    if (busy) return;
    if (rec) { rec.stop(); return; }
    if (!local) { toast('Recording needs the local server: run  node scripts/record.mjs', 6000); return; }
    busy = true;
    try { await start(); } catch (e) { state.error = String(e); toast('Could not start: ' + e.message, 6000); cam?.getTracks().forEach(t => t.stop()); bubble?.remove(); bubble = null; }
    busy = false;
  }

  addEventListener('keydown', e => { if ((e.key === 'r' || e.key === 'R') && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); e.stopPropagation(); toggle(); } }, true);
})();

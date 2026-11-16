/* Brand kit for the intro and outro slides: the robot mascot writes the brand name with a marker, underlines it, then rests and waves.
   Why: the presenter's name and brand open and close every video the same way, so a channel looks like one channel.
   Stateless like the rest of motion.js: every position is a function of time, so replays and ?at=N are always clean.

   The scene needs (templates/intro.html and outro.html have them): a <text id="brand-text"> inside a group clipped by
   <rect id="brand-clip-rect">, a <path id="brand-underline">, an optional <text id="brand-tagline">, and the robot group "robot"
   (with a marker in its right hand, inserted by build.mjs). */
function brandWrite(L, o = {}) {
  const S = o.scale ?? 1.5;                       // robot size
  const st = { fly: 1, write: 2, rest: 3, ...o.steps };   // which cue starts each phase
  const from = o.from ?? [-260, 420];             // where the robot flies in from (world px)
  const rest = o.rest ?? [1640, 840];             // where it ends, hovering
  const writeDur = o.writeDur ?? 3.2;
  const TIP = [74 * S, -10 * S];                  // marker tip relative to the robot's origin (hand at 74,-60, tip 50 below)
  const text = L.el('brand-text'), clip = L.el('brand-clip-rect'), line = L.el('brand-underline'), tag = L.el('brand-tagline');
  const box = () => { try { return text.getBBox(); } catch (e) { return { x: 0, y: 0, width: 0, height: 0 }; } };
  const writeK = () => { const a = M.since(st.write); return a < 0 ? 0 : M.clamp(a / writeDur); };
  // the marker tip runs along the word, a little up and down like handwriting
  const base = +text.getAttribute('y'), fs = +(text.getAttribute('font-size') || 200);   // baseline and letter size
  const tipAt = (k, t) => { const b = box(); return [b.x + b.width * k, base - fs * (.32 + .12 * M.wave(t, .23))]; };
  const robotAt = t => {
    const f = M.since(st.fly), r = M.since(st.rest), k = writeK();
    const p0 = tipAt(0, t), start = [p0[0] - TIP[0], p0[1] - TIP[1]];
    if (f < 0) return { x: from[0], y: from[1], o: o.visibleAtStart ? 1 : 0 };
    if (M.since(st.write) < 0) { const e = M.ease(f / 1.1); return { x: M.lerp(from[0], start[0], e), y: M.lerp(from[1], start[1], e) - 60 * Math.sin(Math.PI * M.clamp(f / 1.1)), o: 1 }; }
    const p = tipAt(k, t), w = [p[0] - TIP[0], p[1] - TIP[1]];
    if (r < 0) return { x: w[0], y: w[1], o: 1 };
    const e = M.ease(r / 1.2);                     // done: a little hop over to the resting spot
    return { x: M.lerp(w[0], rest[0], e), y: M.lerp(w[1], rest[1], e) - 120 * Math.sin(Math.PI * M.clamp(r / 1.2)), o: 1 };
  };
  L.track('robot', t => { const p = robotAt(t); return { x: p.x, y: p.y - 6 * M.wave(t, 2.2), o: p.o }; });
  L.track('robot-antenna', t => ({ r: 12 * M.wave(t, 1.1) }));
  L.track('robot-head', t => ({ r: M.since(st.write) >= 0 && M.since(st.rest) < 0 ? 6 : 4 * M.wave(t, 2.6) }));   // looks down at the word while writing
  // the right arm holds still while writing, then waves (the marker goes with it)
  L.track('robot-arm-r', t => { const r = M.since(st.rest); return { r: r < 1.2 ? 0 : -18 + 26 * M.wave(t, .8) }; });
  L.frame(t => {
    const b = box(), k = writeK();
    clip.setAttribute('x', b.x - 40); clip.setAttribute('y', b.y - 60); clip.setAttribute('height', b.height + 120);
    clip.setAttribute('width', Math.max(0, b.width * k + (k > 0 ? 20 : 0) + (k >= 1 ? 40 : 0)));
    if (line) {   // the orange underline, drawn once the word is done
      const y = base + fs * .14, d = `M${b.x + 10} ${y} C${b.x + b.width * .35} ${y + 16} ${b.x + b.width * .7} ${y - 8} ${b.x + b.width - 10} ${y + 4}`;
      if (line.getAttribute('d') !== d) { line.setAttribute('d', d); line._len = line.getTotalLength(); line.style.strokeDasharray = line._len; }
      const a = M.since(st.rest); line.style.strokeDashoffset = line._len * (1 - (a < 0 ? 0 : M.easeOut(a / .8)));
    }
    if (tag) { const a = M.since(st.rest) - .6; tag.style.opacity = a < 0 ? 0 : M.clamp(a / .8); }
  });
}

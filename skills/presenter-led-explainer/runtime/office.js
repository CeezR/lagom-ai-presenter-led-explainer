/* The shared office life of the office frames (1987 and the 90s): the clock ticks, the printer prints, the stamp comes down. */
function office(L, desks) {
  L.track('wall-clock-hand-m', t => ({ r: 200 * t }));
  L.track('wall-clock-hand-h', t => ({ r: 17 * t }));
  desks.forEach((d, i) => {
    L.track(`desk-${d}-pc-screen`, t => ({ o: .65 + .35 * M.wave(t, .5, i * .3) }));
  });
  L.track('desk-1-printer-sheet', t => { const k = M.loop(t, 2.4); return { y: -22 * Math.min(1, k * 1.6), o: k > .85 ? (1 - k) / .15 : 1 }; });
  L.track('desk-3-stamp-handle', t => { const k = M.loop(t, 1.8); return { y: k < .12 ? 18 * k / .12 : k < .24 ? 18 * (1 - (k - .12) / .12) : 0 }; });
}

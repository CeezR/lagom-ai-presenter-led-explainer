/* s09 · Datorerna (beat 31-35): 1987, a PC on every desk. Solow's quote drops in. Then paper sheets walk the zig-zag from desk to desk:
   printed out on one computer, typed into the next. */
M.captions([
  'Samma sak hände med <em>datorerna</em>',
  '1987: datoråldern syns överallt, utom i <em>produktivitetsstatistiken</em>',
  'En dator på varje skrivbord, men <em>blanketterna</em>, pärmarna och stämplarna fanns kvar',
  'Man skrev <em>ut</em> från en dator och skrev <em>in</em> samma sak i nästa',
]);
const A = M.layer('P10');
office(A, [1, 2, 3, 4]);
A.track('gauge-needle', t => ({ r: 2.5 * M.wave(t, .9) }));
A.track('solow-newspaper', t => ({ y: -300 * (1 - M.bounce(t / 1.1)), r: .5 * M.wave(t, 3) }));
A.track('parcel-hero', t => ({ y: -4 * Math.abs(M.wave(t, 1.2)) }));

const B = M.layer('P11');
office(B, [1, 2, 3, 4]);
B.track('gauge-needle', t => ({ r: 2.5 * M.wave(t, .9) }));
// where the zig-zag touches a desk: the low points of the dotted path (it is drawn right to left; the sheets go left to right)
const trail = B.el('paper-trail-path'), L = trail.getTotalLength(), lows = [];
for (let d = 8; d < L - 8; d += 4) { const y = trail.getPointAtLength(d).y; if (y > 780 && y >= trail.getPointAtLength(d - 4).y && y >= trail.getPointAtLength(d + 4).y) lows.push(d); }
const stopsD = [L, ...lows.reverse(), 0], DWELL = 1.2, RIDE = 2.2, CYC = stopsD.length * DWELL + (stopsD.length - 1) * RIDE;
const dist = c => { const seg = DWELL + RIDE; let i = Math.floor(c / seg); if (i >= stopsD.length - 1) return stopsD[stopsD.length - 1]; const r = c - i * seg;
  return r < DWELL ? stopsD[i] : M.lerp(stopsD[i], stopsD[i + 1], M.ease((r - DWELL) / RIDE)); };
const sheet = B.el('hero-sheet'), sheets = [sheet, ...[1, 2].map(() => { const c = sheet.cloneNode(true); c.removeAttribute('id'); c.querySelectorAll('[id]').forEach(e => e.removeAttribute('id')); sheet.parentNode.appendChild(c); return c; })];
sheets.forEach((el, i) => B.track(el, (t, step, k) => {
  const c = ((t - i * CYC / 3) % CYC + CYC) % CYC, p = trail.getPointAtLength(dist(c)), moving = c > DWELL && dist(c) !== stopsD[stopsD.length - 1] && ((c % (DWELL + RIDE)) > DWELL);
  return { x: p.x - k.cx, y: p.y - k.cy, r: 5 * M.wave(t, .9, i) + (moving ? 9 * M.wave(t, .45, i) : 0), o: i > 0 && t < i * CYC / 3 ? 0 : 1 };
}));

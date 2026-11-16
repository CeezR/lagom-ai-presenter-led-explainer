/* s08 · Den nya fabriken (beat 26-30). Point 1: motors hop out of the box into every machine. Point 2: the one-floor hall, daylight from the
   roof, machines in the order of the work; parcels flow through them. Point 3: the ruler "40 år" grows and the gauge climbs. */
M.captions('Inte motorn gav lyftet. Det var den <em>nya fabriken</em>');
const A = M.layer('P09-start');
A.spin('electric-motor-pulley', 300);
A.flow('floors-slide-path', 40, '16 12');
A.flow('motor-hops', 50, '10 10');
const hops = [...A.el('motor-hops').querySelectorAll(':scope > path')];
[1, 2, 3].forEach(i => A.track(`parcel-hero-open-motor-${i}`, (t, step, k) => {
  const a = M.since(1); if (a < 0) return {};
  const c = ((a - i * .6) / 4.2) % 1;
  if (c < 0) return { o: 0 };
  const hop = M.clamp(c / .6), p = A.at(hops[i - 1], M.ease(hop));
  return { x: (p.x - 600) / 1.4, y: (p.y - 780) / 1.4 - 40 * Math.sin(Math.PI * hop), r: 360 * hop, o: c > .85 ? (1 - c) / .15 : 1 };
}));
for (let f = 1; f <= 4; f++) for (let m = 1; m <= 4; m++) {
  A.track(`floor-${f}-machine-${m}`, t => ({ y: 1.6 * M.wave(t, .24, (f * 4 + m) * .13) }));
  A.track(`floor-${f}-machine-${m}-motor`, t => ({ s: 1 + .1 * M.wave(t, .5, m * .2) }));
}

const B = M.layer('P09');
B.track('new-daylight', t => ({ o: .75 + .25 * M.wave(t, 4) }));
['new-work-1', 'new-work-2', 'new-work-3', 'new-product-1'].forEach(id => B.el(id).style.display = 'none');
// parcels travel through the hall: in at the left, into a machine (hidden while it works, the machine bumps), out the other side
const MX = [600, 860, 1120, 1380], Y = 890;
const legsH = [{ type: 'drop', to: [440, Y], d: .7 }, { type: 'move', to: [1640, Y], d: 9.6 }];
const hall = M.sprites(B, 'new-work-1', 7, { scale: .78 });
const hallState = (i, t) => {
  const s = life(t, 1 + i * 2.1, 14.7, [440, Y - 300], legsH, { pop: true });
  if (s) s.inside = MX.findIndex(m => Math.abs(s.x - m) < 78);
  return s;
};
B.frame(t => hall.forEach((p, i) => { const s = hallState(i, t); if (s && s.inside >= 0) s.o = 0; p.show(s); }));
[1, 2, 3, 4].forEach((m, k) => {
  B.track(`new-machine-${m}`, t => { let b = 0; for (let i = 0; i < 7; i++) { const s = hallState(i, t); if (s && s.inside === k) b = 1; }
    return { y: b ? 5 * M.wave(t, .18) : 1.2 * M.wave(t, .24, m * .2) }; });
  B.track(`new-machine-${m}-motor`, t => ({ s: 1 + .1 * M.wave(t, .5, m * .2) }));
});
['new-crate-1', 'new-crate-2'].forEach((id, i) => B.track(id, t => ({ y: -3 * Math.abs(M.wave(t, 1.4, i * .4)) })));
const ruler = B.el('ruler-40'); if (ruler) ruler.dataset.pivot = '0 0';
B.track('ruler-40', () => { const a = M.since(3); return { sx: a < 0 ? .001 : M.ease(a / 2.4), sy: 1 }; });
B.popAt('ruler-label', 3, 2.2);
B.track('hall-gauge-dial-needle', () => { const a = M.since(3); return { r: -95 * (1 - M.ease(a < 0 ? 0 : a / 3)) }; });

/* s03 · Teamet som ett band (beat 5-7). Point 1: the code folds up into a parcel that drops onto the belt. Point 2: it rides through the
   four stations (waits at each while the lamp, lens, needle and stamp work) and hops onto the users' porch; more parcels follow. */
M.captions('Varje ändring är ett <em>paket</em> på ett band');
const A = M.layer('P03');
A.belt('belt-rollers', 150);
A.huts();
['magnifier-circle', 'magnifier-callout', 'parcel-hero-big'].forEach(id => A.el(id).style.display = 'none');
A.el('parcel-hero').style.display = 'none';
A.el('lectern').style.display = 'none';
// the code ribbon flies from the developers' sign down to where the parcel is born
A.track('code-fold', t => { const a = M.since(1), k = a < 0 ? 0 : M.ease(a / 1.1);
  return { x: -345 * k, y: 567 * k, s: 1 - .6 * k, r: -25 * k + 6 * M.wave(t, .5), o: a < 0 ? 0 : a > 1.05 ? 0 : 1 }; });
const stops = [BELT.dev, BELT.review, BELT.test, BELT.approval], legs = [{ type: 'drop', to: [BELT.start, BELT.y], d: .8 }, { type: 'wait', d: .3 }, ...ride(stops, 150, 1.1)];
const hero = M.sprites(A, 'parcel-hero', 1)[0];
const crowd = M.sprites(A, 'parcel-hero', 6, { recolor: true });
A.frame(() => {
  const a = M.since(1), b = M.since(2);
  // the hero: born at the end of point 1's ribbon, waits at the start of the belt, rides at point 2
  hero.show(a < 1 ? null : b < 0 ? M.journey([BELT.start, BELT.y - 330], [{ type: 'drop', to: [BELT.start, BELT.y], d: .8 }], a - 1)
    : life(b, 0, 99, [BELT.start, BELT.y], [{ type: 'wait', d: .01 }, ...ride(stops, 150, 1.1)], { loop: false }));
  crowd.forEach((p, i) => p.show(b < 0 ? null : life(b, 2.8 * (i + 1), 2.8 * 7, [BELT.start, BELT.y - 330], legs, { pop: true })));
});

// the camera: wide at first, close on the developers when the parcel is born, then it follows the hero parcel to the users
const heroAt = b => { const s = life(b, 0, 99, [BELT.start, BELT.y], [{ type: 'wait', d: .01 }, ...ride(stops, 150, 1.1)], { loop: false }); return s ? s.x : BELT.start; };
A.camera(t => {
  const a = M.since(1), b = M.since(2), wide = { cx: 3330, w: 2050 }, dev = { cx: 2680, w: 1150 };
  let v = M.cam(wide, dev, a < 0 ? 0 : M.ease(a / 1.4));
  if (b >= 0) v = M.cam(dev, { cx: Math.min(3700, Math.max(2780, heroAt(Math.max(0, b - .5)) + 120)), w: 1350 }, M.ease(b / 1.2));
  return v;
});

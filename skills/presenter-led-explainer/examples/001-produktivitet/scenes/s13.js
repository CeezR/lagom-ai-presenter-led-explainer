/* s13 · Tillbaka till teamet (beat 48-51). Point 1: the team has its motor, everything runs fast and parcels drop in with a bounce.
   Point 2: the old shaft in the roof shows again, the belt is still built for the old speed. Point 3: one parcel reaches the users. */
M.captions([
  'Tillbaka till teamet. Paketen går <em>fortare än någonsin</em>',
  'Teamet har fått sin <em>elmotor</em>',
  'Men bandet är byggt för den <em>gamla farten</em>. Precis som axeln i taket',
  'Det som räknas är inte hur fort ett steg går. Det är vad som <em>kommer fram</em>',
]);
const A = M.layer('P15');
A.belt('belt-rollers', 70);
A.huts(2.2);
['pile-review', 'pile-test', 'pile-approval'].forEach((id, i) => A.track(id, t => ({ r: 1.1 * M.wave(t, 1.1, i * .3) })));
A.track('pile-wobble', t => ({ o: .3 + .7 * (.5 + .5 * M.wave(t, .4)) }));
A.track('bottleneck-outline', t => ({ s: 1 + .04 * M.wave(t, 1.1) }));
// point 1: parcels rain down onto the piles in a quick, bouncing rhythm, then clear away and start again
for (let i = 0; i < 8; i++) A.track(`pour-${i}`, t => {
  const a = M.since(1); if (a < 0) return { o: 0 };
  const c = a % 7, f = c - i * .5;
  return { y: f < 0 ? -460 : -460 * (1 - M.bounce(f / .9)), o: f < 0 ? 0 : c > 6.3 ? (7 - c) / .7 : Math.min(1, f * 8), sy: f > .85 && f < 1.1 ? .85 : 1 };
});
A.track('dev-motor-icon', t => { const a = M.since(1); return a < 0 ? { o: 0, s: .001 } : { ...M.pop(a), r: 4 * M.wave(t, .2) }; });
A.track('ghost-shaft', t => { const a = M.since(2); return a < 0 ? { o: 0 } : { o: Math.min(1, a * 1.5) * (.55 + .45 * M.wave(t, 1.6)) }; });
// the one parcel that comes out the other end, slowly, at the old speed
const slow = M.sprites(A, 'pour-0', 1, { recolor: false, scale: .9 })[0];
A.frame(t => slow.show(life(t, 0, 24, [BELT.start, BELT.y - 300], [{ type: 'drop', to: [BELT.start, BELT.y], d: .7 }, ...ride([], 70, 0)], { pop: true })));
A.popAt('users-house-porch-parcels', 3);

// the camera rests on the piles; at point 3 it pans right to the porch where one parcel arrives
A.camera(() => { const a = M.since(3); return M.cam({ cx: 3020, w: 2000, fy: 700 }, { cx: 3560, w: 1500, fy: 700 }, a < 0 ? 0 : M.ease(a / 1.6)); });

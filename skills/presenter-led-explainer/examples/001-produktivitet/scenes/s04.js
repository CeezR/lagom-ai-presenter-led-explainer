/* s04 · AI-kollegan (beat 8-10). Frame 1: the developers get an AI colleague, the keyboard glows and parcels leave the screen faster and
   faster. Frame 2 (point 2): the belt fills up and the parcels queue in front of review; at the users' porch they still arrive one by one. */
M.captions('Nu får utvecklarna en <em>AI-kollega</em>');
const A = M.layer('P04-start');
A.desk();
A.flow('ai-cable', 70);
A.track('robot-arm-l', t => ({ r: 16 * M.wave(t, .2) }));
A.track('robot-arm-r', t => ({ r: -10 + 16 * M.wave(t, .2, .5) }));
A.track('keyboard', t => ({ y: .8 * M.wave(t, .2) }));
['pop-0', 'pop-1', 'pop-2'].forEach(id => A.el(id).style.display = 'none');
const births = [0, 1, 1.8, 2.45, 2.95, 3.35, 3.7, 4, 4.3, 4.6], out = M.sprites(A, 'monitor-parcels', 0);
const flyers = births.map((_, i) => M.sprites(A, 'pop-0', 1, { scale: 1.1 })[0]);
A.frame(() => {
  const a = M.since(1);
  flyers.forEach((p, i) => p.show(a < 0 ? null : life(a, births[i] + .2, 7, [900 + 20 * (i % 3), 690],
    [{ type: 'hop', to: [2200, 120 + 50 * (i % 4)], d: 1.2 - .04 * i, h: 260 + 30 * (i % 3), spin: 360 + 90 * (i % 2) }], { pop: true })));
});

const B = M.layer('P04');
B.belt('belt-rollers', 200);
B.huts(1.4);
B.el('lectern').style.display = 'none';
['stream-0', 'stream-1', 'stream-2', 'stream-3', 'stream-4', 'parcel-hero'].forEach(id => B.el(id).style.display = 'none');
const Q = queue({ n: 12, every: .45, gateX: 2840, gap: 84, service: 2.4, room: 5, v: 200 });
const qs = M.sprites(B, 'stream-0', 12, { scale: .95 });
B.frame(t => qs.forEach((p, i) => p.show(Q.at(i, t))));
[0, 1, 2].forEach(i => B.track(`cal-page-${i}`, t => {
  const k = M.loop(t * .3 + i / 3, 1);
  return { y: 90 * k, x: 24 * Math.sin(k * 5), r: 40 * k, o: Math.min(1, k * 8, (1 - k) * 3) };
}));

// the camera slowly pans between the queue in front of review (left) and the porch where parcels arrive one by one (right)
B.camera(t => ({ cx: 3150 - 430 * Math.cos(t * 2 * Math.PI / 18), w: 1600 }));

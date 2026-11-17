/* s04 · AI-kollegan (beat 8-10). Frame 1: the developers get an AI colleague, the keyboard glows and parcels leave the screen faster and
   faster. The belt with the queue in front of review now opens s05. */
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

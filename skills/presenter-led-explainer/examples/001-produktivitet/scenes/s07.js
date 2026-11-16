/* s07 · Elmotorn i den gamla fabriken (beat 21-25). Point 1: the steam engine is rolled out and a big electric motor is lowered in.
   Point 2: one machine has to move, so the whole factory stops: same shafts, same belts, no lift. Point 3: the adoption meter slowly fills. */
M.captions([
  'Så vad gjorde man med elen?',
  'Man bytte ångmaskinen mot en stor <em>elmotor</em>',
  'Men axeln satt kvar. Remmarna satt kvar. Huset var detsamma: <em>inget lyft</em>',
  '1899: under <em>5 %</em>. Tjugo år senare: ungefär <em>hälften</em>',
]);
const A = M.layer('P08');
// when point 2 is said the factory stops for a moment (one machine moved, everything waits); the clock simply stops counting
let t2 = null;
A.clock = t => { const a = M.since(2); if (a < 0) { t2 = null; return t; } if (t2 === null) t2 = t - a; return t - M.clamp(t - (t2 + .4), 0, 2.6); };
['flywheel', 'drive-pulley'].forEach(id => A.spin(id, 140));
A.spin('electric-motor-pulley', 400);
A.flow('motor-belt', 140, '12 9');
A.track('old-engine-rolled-out', () => { const a = M.since(1); return { x: a < 0 ? 420 : 420 * (1 - M.ease(a / 2)) }; });
A.track('electric-motor', t => { const b = M.since(1) - 1.6; return b < 0 ? { o: 0 } : { o: 1, y: -600 * (1 - M.bounce(b / 1.2)) + (b > 1.2 ? .9 * M.wave(A.clock(t), .11) : 0) }; });
[1, 2, 3, 4].forEach(f => {
  A.track(`floor-${f}-shaft`, t => ({ y: .9 * M.wave(A.clock(t), .11, f * .2) }));
  [1, 2, 3, 4].forEach(m => {
    A.flow(`floor-${f}-belt-${m}`, 90, '12 9');
    A.track(`floor-${f}-machine-${m}`, t => ({ y: 1.6 * M.wave(A.clock(t), .26, (f + m) * .17) }));
  });
});
A.flow('power-belt', -90, '12 9');
A.swing('crane-hook', 7, 3.2);
A.track('power-flow', t => ({ o: .5 + .5 * (.5 + .5 * M.wave(t, 1.6)) }));
A.track('factory-gauge-dial', t => ({ r: 1.2 * M.wave(t, 1.3) }));
A.track('adoption-meter-fill', () => { const a = M.since(3); return { sy: .06 + .94 * M.ease(a < 0 ? 0 : a / 3.5), sx: 1 }; });
A.popAt('adoption-meter-label-1', 3); A.popAt('adoption-meter-label-2', 3, 2.2);

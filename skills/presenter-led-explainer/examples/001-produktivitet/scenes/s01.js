/* s01 · Frågan (beat 1): the code types itself, the stopwatch races, the robot hovers, but the "siffrorna" gauge hardly moves. */
M.captions([
  'Om alla blir <em>snabbare</em> med AI – varför syns det inte i <em>siffrorna</em>?',
  'Om alla blir <em>snabbare</em> med AI – varför syns det inte i <em>siffrorna</em>?',
  'Det har ett namn: <em>produktivitetsparadoxen</em>',
]);
const A = M.layer('P01');
A.desk();
// the stopwatch speeds up when the point "alla blir snabbare" is said, the gauge keeps still
A.track('stopwatch-single-hand', t => ({ r: (M.since(1) >= 0 ? 900 : 540) * t }));
A.track('siffrorna-gauge-needle', t => ({ r: .8 * M.wave(t, 1.3) }));

/* s02 · Riksbanken (beat 2-4): letters fly from the bank to the towers (point 1), the AI windows light up one tower at a time (point 2),
   the gauges stay low (point 3) and the name of the puzzle is written above the skyline. */
M.captions([
  'Riksbanken frågade <em>41</em> av Sveriges största företag',
  '<em>41</em> av Sveriges största företag intervjuades',
  'I stort sett <em>alla</em> använder AI',
  'Men effekten är än så länge <em>liten</em>',
]);
const A = M.layer('P02');
const towers = [1, 2, 4, 5];
towers.forEach((n, i) => A.robot(`tower-${n}-`, i * .23));
[1, 2, 3, 4, 5].forEach(n => A.track(`tower-${n}-gauge-needle`, t => ({ r: 3 * M.wave(t, .9, n * .3) })));
towers.forEach((n, i) => A.track(`tower-${n}-ai-light`, t => {
  const a = M.since(2) - i * .35;
  return a < 0 ? { o: .2 } : { o: Math.min(1, a * 3) * (.75 + .25 * M.wave(t, 1.3, i * .25)), s: 1 + .12 * Math.max(0, 1 - a * 2) };
}));
const arcs = [...A.el('envelopes').querySelectorAll(':scope > path')];
[1, 2, 3].forEach(i => A.track(`envelope-${i}`, (t, step, k) => {
  const a = M.since(1);
  if (a < 0) return { o: 0 };
  const c = (a * .2 + (i - 1) / 3) % 1, p = A.at(arcs[i - 1], M.ease(c));
  return { x: p.x - k.cx, y: p.y - k.cy, r: 14 * M.wave(t, 1.1, i * .3), s: c > .85 ? (1 - c) / .15 : .6 + .4 * Math.min(1, c * 5), o: Math.min(1, c / .08) };
}));
A.popAt('title-paradox', 3);

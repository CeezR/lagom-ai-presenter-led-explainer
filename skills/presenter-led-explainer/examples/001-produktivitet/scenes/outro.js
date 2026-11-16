/* outro · Lagom AI. The calm version of the team belt from s03: the belt runs, each parcel rides through the stations without a queue
   and lands on the users' porch, one after another (step 1). Then the brand name is written above the belt and underlined (step 2-3).
   Plays once; the parcels keep arriving, so the picture rests however long the sign-off takes. */
M.captions('César Forthomme · <em>Lagom AI</em>');
const A = M.layer('P03');
A.belt('belt-rollers', 150);
A.huts(.7);
['magnifier-circle', 'magnifier-callout', 'parcel-hero-big', 'code-fold', 'lectern', 'parcel-hero'].forEach(id => A.el(id).style.display = 'none');
// an even flow: a new parcel every 2.6 s, a short stop at each station, a hop onto the porch
const stops = [BELT.dev, BELT.review, BELT.test, BELT.approval];
const legs = [{ type: 'drop', to: [BELT.start, BELT.y], d: .8 }, { type: 'wait', d: .2 }, ...ride(stops, 170, .35)];
const period = 2.6, n = Math.ceil(M.dur(legs) / period) + 1;
const flow = M.sprites(A, 'parcel-hero', n, { recolor: true });
const hero = M.sprites(A, 'parcel-hero', 1)[0];   // every fourth parcel is the orange hero
A.frame(t => {
  const a = M.since(1);
  flow.forEach((p, i) => {
    const s = a < 0 ? null : life(a, i * period, n * period, [BELT.start, BELT.y - 330], legs, { pop: true });
    p.show(i === 0 ? null : s);
    if (i === 0) hero.show(s);
  });
});
brandWrite(A, { steps: { fly: 2, write: 2, rest: 3 }, writeDur: 2.6 });

/* s05 · Flaskhalsen (beat 11-14). First the belt from the AI-colleague story (moved here from s04): parcels queue in front of review while they
   still arrive one by one at the users' porch. Point 1 (switch to the piles): parcels leave the stations and land on three growing piles in front of review, test and approval.
   Point 2 outlines the bottleneck, point 3 raises the book (Goldratt, The Goal). */
M.captions('Ett flöde går aldrig fortare än sitt <em>långsammaste steg</em>');
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

const A = M.layer('P05');
A.belt('belt-rollers', 260);
A.huts(1.3);
A.el('parcel-hero').style.display = 'none';
const build = piles(A, { review: .8, test: 1.4, approval: 2.0 });
const hero = M.sprites(A, 'parcel-hero', 1, { before: 'pile-review' })[0];
const cruise = M.sprites(A, 'parcel-hero', 3, { recolor: true, before: 'pile-review' });
const calm = ride([BELT.dev, BELT.review, BELT.test, BELT.approval], 220, .6);
A.frame(t => {
  const a = M.since(1);
  build(a < 0 ? -1 : a);
  cruise.forEach((p, i) => { const s = life(t, 1.5 * i, 14, [BELT.start, BELT.y - 300], [{ type: 'drop', to: [BELT.start, BELT.y], d: .6 }, ...calm], { pop: true });
    if (s && a >= 0) s.o = Math.max(0, 1 - a / .4) * (s.o ?? 1); p.show(a > .4 ? null : s); });
  // the orange hero parcel drops last, onto the top of the review pile, and the pile shakes
  const h = a < 8.5 ? null : M.journey([2980, 120], [{ type: 'drop', to: [2980, 570], d: .9 }], a - 8.5);
  if (h) h.r = 6;
  hero.show(h);
});
A.track('pile-wobble', t => ({ o: M.since(1) > 9 ? .3 + .7 * (.5 + .5 * M.wave(t, .5)) : 0 }));
A.track('bottleneck-outline', t => { const a = M.since(2); return a < 0 ? { o: 0 } : { o: Math.min(1, a * 2), s: 1 + .05 * M.wave(t, 1.1) }; });
A.popAt('lectern', 3); A.popAt('toc-title', 3, .3);

// the camera stays on the piles; when the book rises (point 3) it pans left to include it
A.camera(() => { const a = M.since(3); return M.cam({ cx: 3150, w: 1750 }, { cx: 2850, w: 1950 }, a < 0 ? 0 : M.ease(a / 1.4)); });

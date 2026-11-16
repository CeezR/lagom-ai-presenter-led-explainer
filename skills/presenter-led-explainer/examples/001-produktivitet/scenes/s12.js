/* s12 · J-kurvan: uppförsbacken (beat 43-47). Point 1: the hidden work under the curve (books, hammer, new workflow). Point 2: the curve turns and
   climbs steeply, the pencil draws it and trees grow along it. Point 3: cost shows first, benefit later. Point 4: electricity and the
   computer went through it, now AI stands at the start. */
M.captions('Först syns <em>kostnaden</em>, nyttan kommer efter. En <em>J-kurva</em>');
const A = M.layer('P14');
A.popAt('step-07-hidden-work', 1);
A.track('hidden-hammer', t => ({ r: M.since(1) < 0 ? 0 : 22 * Math.abs(M.wave(t, .7)) - 8 }));
A.track('hidden-book', t => ({ y: 2 * M.wave(t, 1.2) }));
A.track('hidden-flow', t => ({ x: 10 * M.wave(t, 1.4) }));
const up = A.el('curve-up'), upEnd = up.getPointAtLength(up.getTotalLength());
A.frame(() => { const a = M.since(2); M.draw(up, a < 0 ? 0 : (a - .2) / 2.6); });
A.track('pencil-climb', () => { const a = M.since(2), p = A.at(up, a < 0 ? 0 : M.ease((a - .2) / 2.6)); return { x: p.x - upEnd.x, y: p.y - upEnd.y, o: a < 0 ? 0 : Math.min(1, a * 3) }; });
// the orange J (glow + line) is drawn along with the pencil: the dip is there from the start, the climb comes at point 2
const jo = A.el('j-orange'), jg = A.el('j-glow'), f0 = A.el('curve-dip').getTotalLength() / jo.getTotalLength();
A.frame(() => { const a = M.since(2), p = f0 + (1 - f0) * (a < 0 ? 0 : M.ease((a - .2) / 2.6)); M.draw(jo, p); M.draw(jg, p); });
[1, 2, 3].forEach(i => A.track(`climb-tree-${i}`, () => M.pop(M.since(2) - (.8 + .7 * i))));
A.track('j-title', () => M.pop(M.since(2) - 3));
A.popAt('tag-cost', 3); A.popAt('tag-benefit', 3, .8);
A.popAt('token-motor', 4); A.popAt('token-pc', 4, .35);
A.track('label-ai', t => ({ s: M.since(4) >= 0 ? 1.15 + .12 * M.wave(t, .8) : 1 }));

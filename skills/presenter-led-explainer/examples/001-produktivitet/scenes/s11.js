/* s11 · J-kurvan (beat 39-42). The axes are drawn in (point 1, time along the bottom, productivity upwards), the new technique arrives
   and the line is expected to shoot up (point 2), but first it goes down: the dip is drawn (point 3). */
M.captions([
  'Ekonomer ritar det här som en kurva. Vi tar den <em>bit för bit</em>',
  'Längs botten går <em>tiden</em>. Uppåt går <em>produktiviteten</em>: hur mycket som blir klart',
  'Här kommer den <em>nya tekniken</em>. Man kunde tro att linjen går rakt upp',
  'Men först går den <em>ner</em>. En svacka',
]);
const A = M.layer('P13-axes');
A.frame(() => { const a = M.since(1);
  M.draw(A.el('axis-x'), a < 0 ? 0 : (a - .1) / 1.3); M.draw(A.el('axis-y'), a < 0 ? 0 : (a - 1.4) / 1.3); });
A.track('label-tid', () => M.pop(M.since(1) - 1.2));
A.track('label-produktivitet', () => M.pop(M.since(1) - 2.6)); A.track('label-produktivitet-sub', () => M.pop(M.since(1) - 3));
A.track('axis-y-stack', t => ({ y: -3 * Math.abs(M.wave(t, 1.6)), o: M.since(1) < 2.6 ? 0 : 1 }));

const B = M.layer('P13');
B.frame(t => { const a = M.since(3); M.draw(B.el('curve-pre'), t / .8); M.draw(B.el('curve-dip'), a < 0 ? 0 : a / 2.2); });
B.track('marker-bulb', t => M.pop(t - .6)); B.track('label-ny-teknik', t => M.pop(t - .9));
B.track('curve-expect', t => ({ o: Math.min(1, Math.max(0, (t - 1.3) / .6)) }));
B.track('label-svacka', () => M.pop(M.since(3) - 2));
// the pencil waits at the start of the dip and draws it
const dip = B.el('curve-dip'), p0 = dip.getPointAtLength(0);
B.track('pencil', () => { const a = M.since(3), p = B.at(dip, a < 0 ? 0 : M.ease(a / 2.2)); return { x: p.x - 830, y: p.y - 652 }; });

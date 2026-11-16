/* s10 · Kontoren byggs om (beat 36-38). Point 1: the gauge climbs. Point 2: the Brynjolfsson & Hitt board and its flow chart appear.
   Point 3: the extra desks and shelves fade out (dashed ghosts), a decision desk moves in next to the work, and a sheet runs straight through. */
M.captions([
  'Kontoren på <em>90-talet</em>',
  'I slutet av 90-talet tog produktiviteten i USA äntligen <em>fart</em>',
  'Lyftet kom hos de företag som <em>byggde om arbetet</em> runt datorerna',
  'Färre mellansteg. Beslut närmare jobbet. Information som gick <em>direkt</em>, inte via pärmar',
]);
const A = M.layer('P12');
office(A, [1]);
A.track('gauge-needle', () => { const a = M.since(1); return { r: -105 * (1 - M.ease(a < 0 ? 0 : a / 3)) }; });
A.popAt('bh-journal', 2);
A.track('bh-journal-flow', t => ({ s: 1 + .06 * M.wave(t, 1.2) }));
['shelves-ghost', 'desk-ghost-2', 'desk-ghost-3'].forEach((id, i) => A.track(id, t => { const a = M.since(3); return a < 0 ? { o: 0 } : { o: Math.min(1, a * 1.5) * (.6 + .4 * M.wave(t, 1.6, i * .3)) }; }));
A.track('decision-desk', () => { const a = M.since(3); return a < 0 ? { o: 0 } : { o: Math.min(1, a * 3), y: 140 * (1 - M.bounce(a / 1)) }; });
A.frame(() => { const a = M.since(3), e = A.el('straight-arrow'); if (e) { e.style.opacity = a < 0 ? 0 : 1; M.draw(e, a < 0 ? 0 : (a - .8) / 1.6); } });
A.track('pencil-cup', t => ({ r: 1.5 * M.wave(t, 1.8) }));
// the sheet from the printer goes straight along the arrow, no detours
const sheets = M.sprites(A, 'desk-1-printer-sheet', 2, { scale: 1.1, into: A.el('straight-arrow').parentNode });
A.frame(t => sheets.forEach((p, i) => { const a = M.since(3) - 2.4;
  p.show(a < 0 ? null : life(a, i * 2.6, 5.2, [380, 767], [{ type: 'wait', d: .3 }, { type: 'move', to: [1500, 767], d: 2.2, ease: 'inOut' }, { type: 'wait', d: .4 }], { pop: true })); }));

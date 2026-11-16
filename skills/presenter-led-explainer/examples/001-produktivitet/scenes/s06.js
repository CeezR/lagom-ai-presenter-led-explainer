/* s06 · Ångfabriken (beat 17-20): one steam engine turns the shaft in the ceiling, belts carry the power to every machine on four floors.
   Point 1: Paul David's plaque and the year, the electric motor rolls in on its cart. Point 2: power runs along every shaft. Point 3: the floors rise. */
M.captions('Vi har varit här förut: <em>elen</em> kommer, runt <em>år 1900</em>');
const A = M.layer('P07');
A.smoke('chimney-smoke', 3.4, 30);
['flywheel', 'drive-pulley', 'crank'].forEach(id => A.spin(id, 140));
A.track('steam-engine-piston-rod', t => ({ x: 14 * Math.cos(t * 140 * Math.PI / 180) }));
A.track('steam-engine-engine', t => ({ y: .8 * M.wave(t, .13) }));
[1, 2, 3, 4].forEach(f => {
  A.track(`floor-${f}-shaft`, t => ({ y: .9 * M.wave(t, .11, f * .2) }));
  [1, 2, 3, 4].forEach(m => {
    A.flow(`floor-${f}-belt-${m}`, 90, '12 9');
    A.track(`floor-${f}-machine-${m}`, t => ({ y: 1.6 * M.wave(t, .26, (f + m) * .17) }));
  });
  A.track(`floor-${f}`, () => { const a = M.since(3) - (4 - f) * .35; return { y: a > 0 && a < .6 ? -10 * Math.sin(Math.PI * a / .6) : 0 }; });
});
A.flow('power-belt', -90, '12 9');
A.swing('crane-hook', 7, 3.2);
A.track('factory-gauge-dial', t => ({ r: 2 * M.wave(t, .9) }));
A.popAt('paul-david-plaque', 1); A.popAt('year-calendar', 1, .25);
A.track('cart', () => { const a = M.since(1); return { x: -360 * (1 - M.ease((a < 0 ? 0 : a) / 1.8)) }; });
// point 2: orange power pulses run from the flywheel up the left belt and along every shaft
const NS = 'http://www.w3.org/2000/svg', svg = A.el('sepia-layer').parentNode;   // outside the sepia filter, so the pulses stay orange
const dots = [];
[815, 625, 435, 245].forEach((y, f) => { for (let i = 0; i < 6; i++) { const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', 12); c.setAttribute('fill', '#F07A1A');
  c.setAttribute('stroke', '#2A2420'); c.setAttribute('stroke-width', 3); svg.appendChild(c); dots.push({ c, y, i }); } });
A.frame(t => { const a = M.since(2);
  dots.forEach(d => { if (a < 0) { d.c.style.display = 'none'; return; } d.c.style.display = '';
    const k = ((t * 240 + d.i * 150) % 900) / 900;
    d.c.setAttribute('cx', 740 + 860 * k); d.c.setAttribute('cy', d.y); d.c.style.opacity = Math.min(1, a / .4) * Math.min(1, k * 10, (1 - k) * 6); }); });

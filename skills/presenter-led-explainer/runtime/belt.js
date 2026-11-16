/* Parcels on the team belt (P03, P04, P05, P15): shared physics, all stateless (a parcel's place is a function of time).
   Why: boxes that glide at one speed through the walls looked dead. Here they drop, ride, wait at a station, queue up behind a slow
   one, hop up onto a pile and land with a squash. World coordinates of the belt row (P03): belt top y 930, huts every 300 px. */
const BELT = { y: 930, start: 2420, dev: 2635, review: 2935, test: 3235, approval: 3535, porch: [3858, 942], end: 3760 };

/** A parcel's life, a cycle of `period` seconds that starts at `t0` (null before it is born); it fades out at the end. */
function life(t, t0, period, from, legs, o = {}) {
  const tt = t - t0; if (tt < 0) return null;
  const c = o.loop === false ? tt : tt % period, total = M.dur(legs);
  const s = M.journey(from, legs, c);
  if (!s) return null;
  if (c > total - .5) s.o = Math.max(0, (total - c) / .5);
  if (c > total) return null;
  if (c < .2 && o.pop) { s.sx *= .3 + .7 * M.easeOut(c / .2); s.sy *= .3 + .7 * M.easeOut(c / .2); s.o = c / .2; }
  return s;
}

/** Legs for a parcel that rides the belt and pauses at the given x positions, then (optionally) hops onto the porch. */
function ride(xs, speed, dwell, from = BELT.start, porch = true) {
  const legs = []; let x = from;
  for (const sx of xs) { legs.push({ type: 'move', to: [sx, BELT.y], d: Math.abs(sx - x) / speed }, { type: 'wait', d: dwell }); x = sx; }
  if (porch) legs.push({ type: 'move', to: [BELT.end, BELT.y], d: (BELT.end - x) / speed }, { type: 'hop', to: BELT.porch, d: .6, h: 90, spin: 8 }, { type: 'wait', d: 1.6 });
  return legs;
}

/** Parcels queue behind a slow station and leave one at a time. Returns state(i, t) for parcel i, or null.
    n parcels, one tries to enter every `every` s, the gate lets one through every `service` s, at most `room` wait in line. */
function queue(o) {
  const { n, every, gateX, gap, service, room, v, t0 = 0 } = o;
  const arrive = (gateX - gap - BELT.start) / v + .4;        // first parcel is at the gate this long after it is born
  const rel = i => t0 + arrive + i * service;                 // when parcel i is let through
  const born = i => Math.max(t0 + i * every, i >= room ? rel(i - room) - .3 : 0);
  const loopLen = rel(n) + (BELT.end - gateX) / v + 4;
  return {
    loopLen,
    at(i, T) {
      const t = T % loopLen, s = born(i); if (t < s) return null;
      const free = BELT.start + v * (t - s);
      let ahead = 0; for (let j = 0; j < i; j++) ahead += t < rel(j) ? 1 : Math.max(0, 1 - (t - rel(j)) / .5);
      const slot = gateX - gap * (1 + ahead), r = rel(i);
      if (t < r) return { x: Math.min(free, slot), y: BELT.y, sx: 1, sy: 1, r: 0, o: Math.min(1, (t - s) * 4) };
      const xr = gateX - gap, x = xr + v * (t - r), tEnd = r + (BELT.end - xr) / v;
      if (t < tEnd) return { x, y: BELT.y, sx: 1, sy: 1, r: 0, o: 1 };
      const s2 = M.journey([BELT.end, BELT.y], [{ type: 'hop', to: BELT.porch, d: .6, h: 90, spin: 8 }, { type: 'wait', d: 1.6 }], t - tEnd);
      if (!s2 || t - tEnd > 2.2) return null; s2.o = Math.min(1, (2.2 - (t - tEnd)) / .5); return s2;
    },
    /** When parcel i reaches the porch (for calendar pages and other reactions). */
    arrival: i => rel(i) + (BELT.end - gateX + gap) / v,
  };
}

/** The three piles of the bottleneck: each parcel of the drawing arrives in turn and lands on its slot (hop up, squash).
    Hides the drawn pile parcels and returns an update(t) with t = seconds since the piles started to build. */
function piles(L, rates) {
  const spec = { review: { from: BELT.start, rate: rates.review }, test: { from: 3100, rate: rates.test }, approval: { from: 3405, rate: rates.approval } };
  const slots = [];
  for (const [name, s] of Object.entries(spec)) {
    L.all(`[id^="pile-${name}-p"]`).sort((a, b) => a.id < b.id ? -1 : 1).forEach((el, k) => {
      const m = el.getAttribute('transform').match(/translate\(([-\d.]+) ([-\d.]+)\)(?: rotate\(([-\d.]+)\))?/);
      el.style.display = 'none';
      slots.push({ name, k, from: s.from, rate: s.rate, x: +m[1], y: +m[2], rot: +(m[3] || 0), el });
    });
  }
  const sp = M.sprites(L, 'parcel-hero', slots.length, { recolor: true, before: 'pile-review' });
  return t => slots.forEach((q, i) => {
    const row = q.y < 900 ? Math.round((930 - q.y) / 62) : 0, t0 = .4 + q.k * q.rate;
    const tt = t - t0; if (tt < 0) { sp[i].show(null); return; }
    const legs = row ? [{ type: 'move', to: [q.x - 30, BELT.y], d: Math.abs(q.x - 30 - q.from) / 260 }, { type: 'hop', to: [q.x, q.y], d: .55, h: 70 + 20 * row, spin: q.rot }]
                     : [{ type: 'move', to: [q.x, q.y], d: Math.abs(q.x - q.from) / 260, ease: 'out' }];
    const s = M.journey([q.from, BELT.y], legs, tt);
    if (s.done) s.r = q.rot; else if (tt < .25) { s.o = tt / .25; }
    sp[i].show(s);
  });
}

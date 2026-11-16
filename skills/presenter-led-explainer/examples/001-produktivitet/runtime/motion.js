/* Motion engine for one reveal scene (one HTML file = one scene).
   Why it exists: the place SVGs are static drawings. This moves their parts (spin, bob, slide, draw-on) by id,
   keeps each part's own transform (STYLE.md: append, never replace) and follows the talking points ("steps"):
   step 0 = nothing said yet, step n = n points shown. The parent deck sends steps with postMessage.

   A scene script does:  const A = M.layer('P03');  A.track('belt-rollers', (t, step) => ({x: ...}));  */
const M = (() => {
  const layers = [];
  const state = { step: 0, layer: 0, stepAt: { 0: 0 }, switch: [0], running: false };
  const now = () => performance.now() / 1000;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => (k = clamp(k), k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const back = k => { k = clamp(k); const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  const wave = (t, period, phase = 0) => Math.sin((t / period + phase) * Math.PI * 2);
  const loop = (t, period) => (t % period) / period;
  const pop = a => a < 0 ? { o: 0, s: .001 } : { o: Math.min(1, a * 5), s: Math.max(.001, back(a / .55)) };
  const num = s => s.split(/[ ,]+/).map(Number);

  /** Seconds since talking point n was shown (-1 while it is not shown). */
  const since = n => (state.step >= n && state.stepAt[n] !== undefined) ? now() - state.stepAt[n] : -1;

  /** Reveal a path (or every path inside a group) as if drawn: p 0..1. */
  function draw(el, p) {
    for (const path of el.matches('path,line,polyline') ? [el] : el.querySelectorAll('path,line,polyline')) {
      if (path._len === undefined) { try { path._len = path.getTotalLength(); } catch (e) { path._len = 0; } }
      if (!path._len) continue;
      path.style.strokeDasharray = path._len;
      path.style.strokeDashoffset = path._len * (1 - clamp(p));
    }
  }


  const easeIn = k => clamp(k) * clamp(k);
  const easeOut = k => 1 - Math.pow(1 - clamp(k), 2);
  const bounce = k => { k = clamp(k); const n = 7.5625, d = 2.75;
    if (k < 1 / d) return n * k * k; if (k < 2 / d) return n * (k -= 1.5 / d) * k + .75;
    if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + .9375; return n * (k -= 2.625 / d) * k + .984375; };
  const EASE = { linear: k => clamp(k), inOut: ease, in: easeIn, out: easeOut };

  /** Where a parcel is at time t, given its legs. A leg is {d, to:[x,y], type: wait | move | hop | drop, ease, h, spin}.
      move = slide (belt), hop = a parabola with landing squash, drop = fall with bounces. Returns null before the start. */
  function journey(from, legs, t) {
    if (t < 0) return null;
    let [x, y] = from, at = 0, prev = null;
    for (const g of legs) {
      const [tx, ty] = g.to || [x, y], u = g.d ? (t - at) / g.d : 1;
      if (t < at + g.d) {
        const k = clamp(u), s = { x, y, r: 0, sx: 1, sy: 1 };
        if (g.type === 'move') { const e = (EASE[g.ease] || EASE.linear)(k); s.x = lerp(x, tx, e); s.y = lerp(y, ty, e); }
        else if (g.type === 'hop') { s.x = lerp(x, tx, k); s.y = lerp(y, ty, k) - (g.h || 120) * 4 * k * (1 - k); s.r = (g.spin || 0) * k;
          const w = Math.sin(Math.PI * k); s.sx = 1 - .06 * w; s.sy = 1 + .1 * w; }
        else if (g.type === 'drop') { s.x = lerp(x, tx, k); s.y = lerp(y, ty, bounce(k)) ; if (k > .02 && k < .4) { s.sy = 1 + .05; } }
        if (prev && (prev.type === 'hop' || prev.type === 'drop') && t - at < .24) { const w = Math.sin(Math.PI * (t - at) / .24); s.sy *= 1 - .24 * w; s.sx *= 1 + .12 * w; }
        return s;
      }
      x = tx; y = ty; at += g.d; prev = g;
    }
    const s = { x, y, r: 0, sx: 1, sy: 1, done: true };
    if (prev && (prev.type === 'hop' || prev.type === 'drop') && t - at < .24) { const w = Math.sin(Math.PI * (t - at) / .24); s.sy = 1 - .24 * w; s.sx = 1 + .12 * w; }
    return s;
  }
  const dur = legs => legs.reduce((a, g) => a + (g.d || 0), 0);

  /** Cloneable parcels: a copy of an existing parcel in the drawing (no ids), optionally recoloured from the orange hero to a plain one. */
  function sprites(L, srcId, n, o = {}) {
    const src = L.el(srcId), out = [];
    for (let i = 0; i < n; i++) {
      const c = src.cloneNode(true); c.removeAttribute('id'); c.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
      if (o.recolor) c.innerHTML = c.innerHTML.split('#F07A1A').join('#5D7FA6');
      const S = o.scale || 1;
      c.style.display = 'none';
      const ref = o.before ? L.el(o.before) : null;
      if (ref) ref.parentNode.insertBefore(c, ref); else (o.into || src.parentNode).appendChild(c);   // same coordinate space as the original unless told otherwise
      out.push({ el: c, S,
        /** Show the parcel in state s (from journey), or hide it when s is null. */
        show(s) { if (!s) { c.style.display = 'none'; return; } c.style.display = '';
          c.setAttribute('transform', `translate(${s.x} ${s.y}) rotate(${s.r || 0}) scale(${(s.sx ?? 1) * S} ${(s.sy ?? 1) * S})`);
          c.style.opacity = s.o ?? 1; } });
    }
    return out;
  }

  /** The handwritten line on the slide: one per step (index = how many talking points have been said). */
  function caption(n) {
    const el = document.getElementById('cap'); if (!el) return;
    const text = state.captions[Math.min(n, state.captions.length - 1)];
    if (el.dataset.k === String(text)) return;
    el.dataset.k = text; el.innerHTML = text;
    el.classList.remove('write'); void el.offsetWidth; el.classList.add('write');
  }

  function layer(name) {
    const root = document.querySelector(`.layer[data-place="${name}"]`);
    const L = { name, root, tracks: [], frames: [], t0: now(), index: layers.length };
    layers.push(L);
    const q = id => root.querySelector('#' + CSS.escape(id));
    /** Move one or more parts. fn(t, step) -> {x,y,r,s,sx,sy,o} (translate, rotate deg, scale, opacity). */
    L.track = (target, fn) => {
      const els = typeof target === 'string' ? (q(target) ? [q(target)] : [...root.querySelectorAll(target)]) : [].concat(target);
      els.forEach((el, i) => { if (el) L.tracks.push({ el, fn, i, n: els.length, base: el.getAttribute('transform') || '' }); });
      return els;
    };
    L.el = q;
    L.all = sel => [...root.querySelectorAll(sel)];
    /** Free-form per-frame callback for things that are not one transform (draw-on, class toggles). */
    L.frame = fn => L.frames.push(fn);
    /** A camera: fn(t) -> {cx, w, fy}; the drawing is re-windowed every frame (cx = world x in the middle, w = world width on screen,
        fy = the world y that sits 56 % down the screen, below the caption). */
    L.camera = fn => { L.cam = fn; };
    L.clock = t => t;   // a scene can slow or stop its machines by replacing this (stateless: time that stops counting)
    L.spin = (target, dps, phase = 0) => L.track(target, t => ({ r: dps * L.clock(t) + phase }));
    L.swing = (target, deg, period, phase = 0) => L.track(target, t => ({ r: deg * wave(t, period, phase) }));
    L.bob = (target, dy, period, phase = 0) => L.track(target, t => ({ y: dy * wave(t, period, phase) }));
    /** A conveyor: the roller dots scroll rightwards (speed px/s), clipped to the belt, so the belt looks like it is running. */
    L.belt = (id, speed, spacing = 57.5) => {
      const el = q(id); if (!el) return;
      const b = el.getBBox(), NS = 'http://www.w3.org/2000/svg', svg = el.ownerSVGElement;
      const cid = `clip-${L.name}-${id}`;
      const cp = document.createElementNS(NS, 'clipPath'); cp.id = cid;
      cp.innerHTML = `<rect x="${b.x - 1}" y="${b.y - 4}" width="${b.width + 2}" height="${b.height + 8}"/>`;
      svg.querySelector('defs').appendChild(cp);
      const wrap = document.createElementNS(NS, 'g'); wrap.setAttribute('clip-path', `url(#${cid})`);
      el.parentNode.insertBefore(wrap, el); wrap.appendChild(el);
      const twin = el.cloneNode(true); twin.removeAttribute('id'); twin.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
      wrap.appendChild(twin);
      const dx = t => (L.clock(t) * speed) % spacing;
      L.track(el, t => ({ x: dx(t) }));
      L.track(twin, t => ({ x: dx(t) - spacing }));
    };
    /** The four stations of the team belt: lamp, lens, needle and stamp keep working. */
    L.huts = (busy = 1) => {
      L.track('hut-dev-lamp', t => ({ r: 14 * busy * wave(L.clock(t), 1.6) }));
      L.track('hut-review-lens', t => ({ r: 12 * busy * wave(L.clock(t), 2.4) }));
      L.track('hut-test-needle', t => ({ r: 40 * busy * wave(L.clock(t), 1.3) }));
      L.track('hut-approval-press', t => { const k = loop(L.clock(t), 2.2); return { y: busy * (k < .15 ? 14 * k / .15 : k < .3 ? 14 * (1 - (k - .15) / .15) : 0) }; });
    };
    /** Marching dashes along a line or every line in a group: belts and cables that look like they carry something. */
    L.flow = (id, speed = 60, dash = '14 10') => {
      const el = q(id); if (!el) return;
      const ps = el.matches('path,line,polyline') ? [el] : [...el.querySelectorAll('path,line,polyline')];
      ps.forEach(p => { p.style.strokeDasharray = dash; });
      L.frame(t => ps.forEach(p => { p.style.strokeDashoffset = -L.clock(t) * speed; }));
    };
    /** Smoke: the puffs rise, grow and fade, in two copies half a period apart so the chimney never runs dry. */
    L.smoke = (id, period = 3.2, rise = 90) => {
      const el = q(id); if (!el) return;
      const twin = el.cloneNode(true); twin.removeAttribute('id'); twin.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
      el.parentNode.insertBefore(twin, el.nextSibling);
      const f = ph => t => { const k = loop(t + ph * period, period); return { y: -rise * k, x: 24 * k, s: .55 + .8 * k, o: .95 * (k < .15 ? k / .15 : 1 - (k - .15) / .85) }; };
      L.track(el, f(0)); L.track(twin, f(.5));
    };
    /** The robot mascot at rest: hovers, antenna wobbles, one arm waves. `p` is the id prefix (tower-1- in the skyline). */
    L.robot = (p = '', phase = 0, wave_ = 1) => {
      L.track(p + 'robot', t => ({ y: -6 * wave(L.clock(t), 2.2, phase) }));
      L.track(p + 'robot-antenna', t => ({ r: 12 * wave(L.clock(t), 1.1, phase) }));
      L.track(p + 'robot-head', t => ({ r: 4 * wave(L.clock(t), 2.6, phase) }));
      L.track(p + 'robot-arm-r', t => ({ r: wave_ * (-18 + 26 * wave(L.clock(t), .8, phase)) }));
    };
    /** Code that types itself in, line by line, with the cursor at the end of the line being typed. */
    L.typing = (codeId, cursorId, cycle = 8) => {
      const code = q(codeId), cur = q(cursorId); if (!code) return;
      const paths = [...code.querySelectorAll('path')], per = (cycle - 1.8) / paths.length;
      const cb = cur ? cur.getBBox() : null;
      L.frame(t => {
        const tt = t % cycle; let tip = null;
        paths.forEach((p, i) => { const k = clamp((tt - i * per) / (per * 1.6)); draw(p, k); if (k > 0) tip = p.getPointAtLength(p.getTotalLength() * k); });
        code.style.opacity = tt > cycle - .5 ? (cycle - tt) / .5 : 1;
        if (cur && tip) { cur.setAttribute('transform', `translate(${tip.x + 8 - cb.x} ${tip.y - cb.y - cb.height / 2})`); cur.style.opacity = Math.floor(t * 2.5) % 2 ? .15 : 1; }
      });
    };
    /** The programmer's desk: typing, a stopwatch racing, a gauge that hardly moves, the robot. */
    L.desk = () => {
      L.typing('code-typing', 'code-cursor');
      L.track('stopwatch-single-hand', t => ({ r: 540 * t }));
      L.track('stopwatch-single-spin', t => ({ r: 90 * t }));
      L.track('siffrorna-gauge-needle', t => ({ r: 2.2 * wave(L.clock(t), .8) }));
      L.robot();
    };
    /** A part that appears at talking point n: grows in with a bounce (hidden before). */
    L.popAt = (target, n, delay = 0) => L.track(target, () => { const a = since(n); return pop(a < 0 ? -1 : a - delay); });
    /** A point on a path's way (k 0..1), for things that ride a drawn line. */
    L.at = (pathEl, k) => pathEl.getPointAtLength(pathEl.getTotalLength() * clamp(k));
    return L;
  }

  function apply(L, t) {
    if (L.cam) { const v = L.cam(t, state.step), w = v.w, h = w * 9 / 16, svg = L.root.querySelector('svg');
      svg.setAttribute('viewBox', `${v.cx - w / 2} ${(v.fy ?? 790) - .56 * h} ${w} ${h}`); }
    for (const k of L.tracks) {
      const el = k.el;
      if (!el.isConnected) continue;
      if (k.cx === undefined) {
        const piv = el.dataset.pivot ? num(el.dataset.pivot) : null;
        let b = { x: 0, y: 0, width: 0, height: 0 };
        try { b = el.getBBox(); } catch (e) { /* not rendered yet */ }
        k.cx = piv ? piv[0] : b.x + b.width / 2;
        k.cy = piv ? piv[1] : b.y + b.height / 2;
      }
      const v = k.fn(t, state.step, k) || {};
      let pre = '', post = '';
      if (v.x || v.y) pre = `translate(${v.x || 0} ${v.y || 0}) `;
      if (v.r) post += ` rotate(${v.r} ${k.cx} ${k.cy})`;
      if (v.s !== undefined || v.sx !== undefined || v.sy !== undefined)
        post += ` translate(${k.cx} ${k.cy}) scale(${v.sx ?? v.s ?? 1} ${v.sy ?? v.s ?? 1}) translate(${-k.cx} ${-k.cy})`;
      el.setAttribute('transform', (pre + k.base + post).trim());
      if (v.o !== undefined) el.style.opacity = v.o;
    }
    for (const f of L.frames) f(t, state.step);
  }

  function tick() {
    const T = now();
    for (const L of layers) if (L.index === state.layer || L.fading) apply(L, T - L.t0);
    if (state.running) requestAnimationFrame(tick);
  }

  /** Show layer i (cross-fade) and restart its clock. */
  function showLayer(i, restart) {
    layers.forEach(L => {
      const on = L.index === i;
      if (on && (restart || !L.root.classList.contains('on'))) L.t0 = now();
      if (!on && L.root.classList.contains('on')) { L.fading = true; setTimeout(() => { L.fading = false; }, 800); }
      L.root.classList.toggle('on', on);
    });
    state.layer = i;
  }

  /** Talking point n has been said: update the strip and maybe switch to the next place frame. */
  function setStep(n, restart) {
    n = clamp(n, 0, +(document.body.dataset.steps || 0));
    if (restart) state.stepAt = { 0: now() };
    for (let s = (restart ? 1 : state.step + 1); s <= n; s++) state.stepAt[s] = now();
    for (const s of Object.keys(state.stepAt)) if (+s > n) delete state.stepAt[s];
    state.step = n;
    if (state.captions) caption(n);
    let k = 0; state.switch.forEach((from, idx) => { if (n >= from) k = idx; });
    if (k !== state.layer || restart) showLayer(k, restart);
  }

  function fit() {
    const f = document.getElementById('frame');
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    f.style.transform = `scale(${s})`;
    f.style.left = (innerWidth - 1920 * s) / 2 + 'px';
    f.style.top = (innerHeight - 1080 * s) / 2 + 'px';
  }

  function start() {
    state.switch = JSON.parse(document.body.dataset.switch || '[0]');
    const q = new URLSearchParams(location.search);
    fit(); addEventListener('resize', fit);
    state.running = true;
    setStep(+(q.get('step') || 0), true);
    requestAnimationFrame(tick);
    // the deck (parent window) drives steps; standalone, the arrow keys do
    addEventListener('message', e => {
      const d = e.data || {};
      if (d.type === 'enter') setStep(d.step || 0, true);
      if (d.type === 'step') setStep(d.step);
    });
    addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === ' ') setStep(state.step + 1);
      if (e.key === 'ArrowLeft') setStep(state.step - 1);
    });
  }

  return { cam: (a, b, k) => ({ cx: lerp(a.cx, b.cx, k), w: lerp(a.w, b.w, k), fy: lerp(a.fy ?? 790, b.fy ?? 790, k) }), layer, start, since, setStep, draw, pop, journey, dur, sprites, bounce, easeIn, easeOut,
    captions: list => { state.captions = list; }, clamp, lerp, ease, back, wave, loop, state, now };
})();

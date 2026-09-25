/* plot.js: the grapher's math, with no DOM (the page is grapher.js; tests are in test/grapher.mjs).
   - read(): turns what a student types into something plottable: y = f(x), a piecewise function,
     or an equation in x and y such as a circle (x - 1)^2 + (y + 2)^2 = 9.
   - sample(): adaptive sampling that breaks at asymptotes and jumps and finds where a domain starts or ends.
   - contour(): the zero set of F(x, y) for equations (marching squares).
   - render helpers: the coordinate plane, ticks and curves as SVG strings.
   - checkDrawing(): does a student's drawing (pen strokes, points, lines, parabolas, circles) show the graph? */
(function (G) {
  'use strict';
  const MX = G.MX;
  const P = {};
  const PE = (m) => new MX.ParseError(m);

  // ---------- colors: the preset swatches (validated categorical palette), light and dark steps ----------
  P.PALETTE = [
    { id: 'blue', name: 'Blue', light: '#2a78d6', dark: '#3987e5' },
    { id: 'orange', name: 'Orange', light: '#eb6834', dark: '#d95926' },
    { id: 'aqua', name: 'Aqua', light: '#1baf7a', dark: '#199e70' },
    { id: 'yellow', name: 'Yellow', light: '#eda100', dark: '#c98500' },
    { id: 'magenta', name: 'Magenta', light: '#e87ba4', dark: '#d55181' },
    { id: 'green', name: 'Green', light: '#008300', dark: '#008300' },
    { id: 'violet', name: 'Violet', light: '#4a3aa7', dark: '#9085e9' },
    { id: 'red', name: 'Red', light: '#e34948', dark: '#e66767' },
  ];
  P.colorOf = (c, dark) => {
    const p = P.PALETTE.find((x) => x.id === c);
    if (p) return dark ? p.dark : p.light;
    return /^#[0-9a-f]{6}$/i.test(c || '') ? c : P.PALETTE[0][dark ? 'dark' : 'light'];
  };

  // ---------- reading an input ----------
  const compile = (n) => (MX.V && MX.V.compile ? MX.V.compile(n) : (env) => MX.evalAST(n, env));
  const varsOf = (n) => MX.ast.vars(n);
  function onlyVars(n, allowed, what) {
    for (const v of varsOf(n)) if (!allowed.includes(v)) throw PE('“' + v + '” isn’t a variable here. ' + what);
  }
  // a condition like "x < 0", "-1 <= x < 2", "x >= 3" → {test(x), ends: [{x, closed}]}
  function readCond(src) {
    const s = MX.normalizeInput(src).replace(/≠/g, '!=');
    const bits = s.split(/(<=|>=|<|>)/).map((b) => b.trim());
    if (bits.length < 3 || bits.length % 2 === 0) throw PE('Write each condition like x < 0 or -1 ≤ x < 2.');
    const rels = [];
    for (let k = 0; k + 2 < bits.length; k += 2) {
      const L = MX.parse(bits[k]), R = MX.parse(bits[k + 2]);
      onlyVars(L, ['x'], 'Conditions use x.'); onlyVars(R, ['x'], 'Conditions use x.');
      rels.push({ l: compile(L), r: compile(R), op: bits[k + 1], L, R });
    }
    const ends = [];
    rels.forEach((q) => {
      const lv = varsOf(q.L).size, rv = varsOf(q.R).size;
      if (lv && !rv) ends.push({ x: MX.evalAST(q.R, {}), closed: q.op.includes('=') });
      else if (rv && !lv) ends.push({ x: MX.evalAST(q.L, {}), closed: q.op.includes('=') });
    });
    const test = (x) => rels.every((q) => {
      const a = q.l({ x }), b = q.r({ x }), eq = Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(a), Math.abs(b));
      return q.op === '<' ? !eq && a < b : q.op === '>' ? !eq && a > b : q.op === '<=' ? eq || a < b : eq || a > b;
    });
    return { test, ends, tex: MX.previewTex('ineq', s) || s };
  }
  // piecewise: "x+1 if x<0; x^2 if x>=0" or "{x+1, x<0; x^2, x>=0}"
  function readPiecewise(raw) {
    const body = raw.trim().replace(/^\{/, '').replace(/\}$/, '');
    const pieces = body.split(';').map((p) => p.trim()).filter(Boolean);
    if (pieces.length < 2) throw PE('A piecewise function needs at least two pieces separated by “;”.');
    const out = pieces.map((p) => {
      let e, c;
      const m = p.match(/^(.*?)\s+if\s+(.*)$/i);
      if (m) { e = m[1]; c = m[2]; } else {
        let depth = 0, cut = -1;
        for (let i = 0; i < p.length; i++) { if (p[i] === '(') depth++; else if (p[i] === ')') depth--; else if (p[i] === ',' && depth === 0) cut = i; }
        if (cut < 0) throw PE('Write each piece like “x + 1 if x < 0”.');
        e = p.slice(0, cut); c = p.slice(cut + 1);
      }
      const ast = MX.parse(MX.normalizeInput(e));
      onlyVars(ast, ['x'], 'Use x as the variable.');
      const cond = readCond(c);
      return { f: compile(ast), ast, cond };
    });
    const f = (x) => { for (const q of out) if (q.cond.test(x)) return q.f({ x }); return NaN; };
    // breakpoints: where a piece starts or stops; the dot there is closed if that piece includes it
    const dots = [];
    out.forEach((q) => q.cond.ends.forEach((e) => {
      const y = q.f({ x: e.x });
      if (isFinite(y)) dots.push({ x: e.x, y, closed: e.closed });
    }));
    const merged = [];
    dots.forEach((d) => {
      const same = merged.find((m) => Math.abs(m.x - d.x) < 1e-9 && Math.abs(m.y - d.y) < 1e-9);
      if (same) same.closed = same.closed || d.closed; else merged.push(Object.assign({}, d));
    });
    // a closed dot is only right where f really takes that value
    merged.forEach((d) => { d.closed = Math.abs(f(d.x) - d.y) < 1e-9; });
    const tex = out.map((q) => MX.astTex(q.ast) + ' \\text{ if } ' + q.cond.tex).join(';\\quad ');
    return { kind: 'fn', f, tex, dots: merged, pieces: out, piecewise: true };
  }
  // what the student typed → {kind:'fn', f, tex, ast?} or {kind:'rel', F(x,y), tex}
  P.read = function (raw) {
    const src = String(raw || '').trim();
    if (!src) throw PE('Type a function, like 2x - 3 or x^2.');
    if (src.length > 300) throw PE('That is too long.');
    const head = /^\s*(?:y|[a-zA-Z]\s*\(\s*x\s*\))\s*=\s*/.exec(src), explicitHead = !!head && !/=/.test(src.slice(head[0].length));
    let s = explicitHead ? src.slice(head[0].length) : src;
    if (/;|\sif\s/i.test(s)) return readPiecewise(s);
    s = MX.normalizeInput(s);
    if (/[<>]/.test(s)) throw PE('Graph an equation or a function. Inequalities can’t be shaded yet.');
    if (s.includes('=')) {
      const [a, b, extra] = s.split('=');
      if (extra !== undefined) throw PE('Use only one “=”.');
      if (!a.trim() || !b.trim()) throw PE('Something is missing on one side of “=”.');
      const L = MX.parse(a), R = MX.parse(b);
      onlyVars(L, ['x', 'y'], 'Use x and y.'); onlyVars(R, ['x', 'y'], 'Use x and y.');
      const l = compile(L), r = compile(R);
      return { kind: 'rel', F: (x, y) => l({ x, y }) - r({ x, y }), tex: MX.astTex(L) + ' = ' + MX.astTex(R) };
    }
    const ast = MX.parse(s);
    onlyVars(ast, ['x'], explicitHead ? 'Use x as the variable.' : 'Use x as the variable (or write an equation with x and y).');
    const c = compile(ast);
    return { kind: 'fn', f: (x) => c({ x }), ast, tex: MX.astTex(ast) };
  };

  // ---------- windows and ticks ----------
  P.DEFAULT_WIN = { xmin: -10, xmax: 10, ymin: -10, ymax: 10, xstep: 1, ystep: 1 };
  P.cleanWin = function (w) {
    const n = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);
    const o = {};
    for (const k of Object.keys(P.DEFAULT_WIN)) o[k] = n(w && w[k], P.DEFAULT_WIN[k]);
    if (!(o.xmax > o.xmin)) { o.xmin = -10; o.xmax = 10; }
    if (!(o.ymax > o.ymin)) { o.ymin = -10; o.ymax = 10; }
    if (!(o.xstep > 0)) o.xstep = 1;
    if (!(o.ystep > 0)) o.ystep = 1;
    // at most 200 grid lines per axis
    while ((o.xmax - o.xmin) / o.xstep > 200) o.xstep *= 2;
    while ((o.ymax - o.ymin) / o.ystep > 200) o.ystep *= 2;
    return o;
  };
  // label every k-th tick so there are at most about `most` labels
  P.labelEvery = (span, step, most = 11) => { let k = 1; while (span / (step * k) > most) k = k === 1 ? 2 : k === 2 ? 5 : k * 2; return k; };
  const fmt = (v) => { const r = Math.round(v * 1e9) / 1e9; return (Object.is(r, -0) ? 0 : r).toString().replace('-', '−'); };
  P.fmt = fmt;

  // ---------- sampling y = f(x) ----------
  // Returns segments (arrays of [x, y]) that stop at asymptotes and jumps and reach domain edges exactly.
  P.sample = function (f, win, px = 600) {
    const { xmin, xmax, ymin, ymax } = win;
    const H = ymax - ymin, lo = ymin - 2 * H, hi = ymax + 2 * H;
    const dxPix = (xmax - xmin) / px, dyPix = H / px;
    const clampY = (y) => Math.max(lo, Math.min(hi, y));
    const fin = (y) => typeof y === 'number' && isFinite(y);
    const segs = [];
    let cur = null;
    const push = (x, y) => { if (!cur) { cur = []; segs.push(cur); } cur.push([x, clampY(y)]); };
    const cut = () => { cur = null; };
    // refine between (a, fa) and (b, fb), both finite
    function refine(a, fa, b, fb, depth) {
      const m = (a + b) / 2, fm = f(m);
      if (!fin(fm)) { // a gap in the middle: close each side at its domain edge
        edgeBetween(a, fa, m, fm); cut(); edgeBetween(m, fm, b, fb); return;
      }
      const offPix = Math.abs(fm - (fa + fb) / 2) / dyPix;
      const both = Math.max(Math.abs(fa), Math.abs(fb));
      if (depth < 14 && (offPix > 0.4 || Math.abs(fb - fa) / dyPix > 60) && !(fa > hi && fb > hi && fm > hi) && !(fa < lo && fb < lo && fm < lo)) {
        refine(a, fa, m, fm, depth + 1);
        refine(m, fm, b, fb, depth + 1);
        return;
      }
      // still a big step after all that refining: a jump or an asymptote, so lift the pen
      if (depth >= 14 && Math.abs(fb - fa) / dyPix > 4 && both > 0) { cut(); push(b, fb); return; }
      push(b, fb);
    }
    // one of fa / fb is not finite: bisect for the domain edge and add the last finite point
    function edgeBetween(a, fa, b, fb) {
      const aIn = fin(fa);
      if (aIn === fin(fb)) { if (fin(fb)) push(b, fb); return; }
      let p = a, q = b;
      for (let i = 0; i < 50; i++) { const m = (p + q) / 2; if (fin(f(m)) === aIn) p = m; else q = m; }
      const edge = aIn ? p : q, fe = f(edge);
      if (aIn) { if (fin(fe)) push(edge, fe); cut(); } else { cut(); if (fin(fe)) push(edge, fe); push(b, fb); }
    }
    let px0 = xmin, py0 = f(px0);
    if (fin(py0)) push(px0, py0);
    for (let k = 1; k <= px; k++) {
      const x = xmin + k * dxPix, y = f(x);
      if (fin(py0) && fin(y)) refine(px0, py0, x, y, 0);
      else edgeBetween(px0, py0, x, y);
      px0 = x; py0 = y;
    }
    return segs.filter((s) => s.length > 1 || (s.length === 1 && s[0][1] >= ymin && s[0][1] <= ymax));
  };

  // ---------- F(x, y) = 0 by marching squares ----------
  P.contour = function (F, win, cols = 180, rows = 180) {
    const { xmin, xmax, ymin, ymax } = win;
    const dx = (xmax - xmin) / cols, dy = (ymax - ymin) / rows;
    const val = [];
    for (let j = 0; j <= rows; j++) { const row = []; for (let i = 0; i <= cols; i++) row.push(F(xmin + i * dx, ymin + j * dy)); val.push(row); }
    const segs = [];
    const lerp = (x1, y1, v1, x2, y2, v2) => { const t = v1 / (v1 - v2); return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)]; };
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x0 = xmin + i * dx, y0 = ymin + j * dy, x1 = x0 + dx, y1 = y0 + dy;
      const a = val[j][i], b = val[j][i + 1], c = val[j + 1][i + 1], d = val[j + 1][i];
      if (![a, b, c, d].every(isFinite)) continue;
      const pts = [];
      if ((a < 0) !== (b < 0)) pts.push(lerp(x0, y0, a, x1, y0, b));
      if ((b < 0) !== (c < 0)) pts.push(lerp(x1, y0, b, x1, y1, c));
      if ((c < 0) !== (d < 0)) pts.push(lerp(x1, y1, c, x0, y1, d));
      if ((d < 0) !== (a < 0)) pts.push(lerp(x0, y1, d, x0, y0, a));
      // a sign change across a pole (like 1/x = y's far side) is not a curve: require F small at the crossing
      const small = (p) => Math.abs(F(p[0], p[1])) <= 0.05 * (Math.abs(a) + Math.abs(b) + Math.abs(c) + Math.abs(d) + 1e-9);
      if (pts.length === 2) { if (small(pts[0]) && small(pts[1])) segs.push([pts[0], pts[1]]); }
      else if (pts.length === 4) { if (pts.every(small)) segs.push([pts[0], pts[1]], [pts[2], pts[3]]); }
    }
    return segs;
  };

  // ---------- SVG ----------
  // a plane of W × H pixels for win: grid, axes with arrows, tick labels. Returns {X, Y, inv, body, clip}
  P.plane = function (win, W, H, o = {}) {
    const pad = o.pad != null ? o.pad : 0;
    const sx = (W - 2 * pad) / (win.xmax - win.xmin), sy = (H - 2 * pad) / (win.ymax - win.ymin);
    const X = (x) => pad + (x - win.xmin) * sx, Y = (y) => H - pad - (y - win.ymin) * sy;
    const inv = (px, py) => [win.xmin + (px - pad) / sx, win.ymin + (H - pad - py) / sy];
    const r = (v) => Math.round(v * 10) / 10;
    let b = '';
    const gx = [], gy = [];
    for (let x = Math.ceil(win.xmin / win.xstep - 1e-9) * win.xstep; x <= win.xmax + 1e-9; x += win.xstep) gx.push(x);
    for (let y = Math.ceil(win.ymin / win.ystep - 1e-9) * win.ystep; y <= win.ymax + 1e-9; y += win.ystep) gy.push(y);
    b += '<g class="gr-grid">' + gx.map((x) => '<line x1="' + r(X(x)) + '" y1="0" x2="' + r(X(x)) + '" y2="' + H + '"/>').join('') +
      gy.map((y) => '<line x1="0" y1="' + r(Y(y)) + '" x2="' + W + '" y2="' + r(Y(y)) + '"/>').join('') + '</g>';
    const ax = win.ymin <= 0 && win.ymax >= 0 ? Y(0) : null, ay = win.xmin <= 0 && win.xmax >= 0 ? X(0) : null;
    if (ax != null) b += '<line class="gr-axis" x1="0" y1="' + r(ax) + '" x2="' + W + '" y2="' + r(ax) + '"/><path class="gr-arrow" d="M' + W + ' ' + r(ax) + 'l-9 -4.5v9z"/><path class="gr-arrow" d="M0 ' + r(ax) + 'l9 -4.5v9z"/>';
    if (ay != null) b += '<line class="gr-axis" x1="' + r(ay) + '" y1="0" x2="' + r(ay) + '" y2="' + H + '"/><path class="gr-arrow" d="M' + r(ay) + ' 0l-4.5 9h9z"/><path class="gr-arrow" d="M' + r(ay) + ' ' + H + 'l-4.5 -9h9z"/>';
    // tick labels sit along the axes (or along the bottom/left edge when an axis is off screen)
    const kx = P.labelEvery(win.xmax - win.xmin, win.xstep, Math.max(4, Math.floor(W / 44)));
    const ky = P.labelEvery(win.ymax - win.ymin, win.ystep, Math.max(4, Math.floor(H / 34)));
    const ly = ax != null ? Math.min(H - 6, ax + 17) : H - 6, lx = ay != null ? ay - 6 : 30;
    let t = '';
    gx.forEach((x) => {
      const n = Math.round((x - 0) / win.xstep);
      if (Math.abs(x) < 1e-9 || n % kx !== 0 || X(x) < 12 || X(x) > W - 12) return;
      t += '<line class="gr-tick" x1="' + r(X(x)) + '" y1="' + r((ax != null ? ax : H) - 4) + '" x2="' + r(X(x)) + '" y2="' + r((ax != null ? ax : H) + 4) + '"/>';
      t += '<text class="gr-lab" x="' + r(X(x)) + '" y="' + r(ly) + '" text-anchor="middle">' + fmt(x) + '</text>';
    });
    gy.forEach((y) => {
      const n = Math.round(y / win.ystep);
      if (Math.abs(y) < 1e-9 || n % ky !== 0 || Y(y) < 10 || Y(y) > H - 10) return;
      t += '<line class="gr-tick" x1="' + r((ay != null ? ay : 0) - 4) + '" y1="' + r(Y(y)) + '" x2="' + r((ay != null ? ay : 0) + 4) + '" y2="' + r(Y(y)) + '"/>';
      t += '<text class="gr-lab" x="' + r(ay != null ? lx : 6) + '" y="' + r(Y(y) + 4) + '" text-anchor="' + (ay != null ? 'end' : 'start') + '">' + fmt(y) + '</text>';
    });
    if (ax != null && ay != null) t += '<text class="gr-lab" x="' + r(ay - 6) + '" y="' + r(Math.min(H - 6, ax + 17)) + '" text-anchor="end">0</text>';
    return { X, Y, inv, W, H, body: b, labels: t, sx, sy };
  };
  // "M…L…" path data for segments in math coordinates
  P.path = (segs, pl) => segs.map((s) => 'M' + s.map((p) => (Math.round(pl.X(p[0]) * 10) / 10) + ' ' + (Math.round(pl.Y(p[1]) * 10) / 10)).join('L')).join('');
  // the segments that draw a parsed input in a window
  P.curves = function (g, win, px) {
    if (g.kind === 'fn') return P.sample(g.f, win, px);
    const s = P.contour(g.F, win);
    return s;
  };

  // ---------- shapes built from two points ----------
  // line through a and b; parabola with vertex v through p; circle with center c through p
  P.shape = function (t, a, b, win) {
    if (t === 'line') {
      if (Math.abs(b[0] - a[0]) < 1e-12) {
        if (Math.abs(b[1] - a[1]) < 1e-12) return null;
        return { kind: 'vline', x: a[0], segs: [[[a[0], win.ymin - 1], [a[0], win.ymax + 1]]] };
      }
      const m = (b[1] - a[1]) / (b[0] - a[0]), c = a[1] - m * a[0];
      return { kind: 'fn', f: (x) => m * x + c, m, c, segs: [[[win.xmin, m * win.xmin + c], [win.xmax, m * win.xmax + c]]] };
    }
    if (t === 'parabola') {
      const [h, k] = a;
      if (Math.abs(b[0] - h) < 1e-12) return null;
      const A = (b[1] - k) / ((b[0] - h) * (b[0] - h));
      const f = (x) => A * (x - h) * (x - h) + k;
      return { kind: 'fn', f, a: A, h, k, segs: P.sample(f, win, 300) };
    }
    if (t === 'circle') {
      const R = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (R < 1e-12) return null;
      const pts = [];
      for (let i = 0; i <= 180; i++) { const t2 = (i / 180) * 2 * Math.PI; pts.push([a[0] + R * Math.cos(t2), a[1] + R * Math.sin(t2)]); }
      return { kind: 'circle', c: a, r: R, segs: [pts] };
    }
    return null;
  };
  // snap a point to the grid: to the step, or to a fifth of it when the step is 5 or more
  P.snapUnit = (step) => (step >= 5 ? step / 5 : step);
  P.snap = (p, win) => { const ux = P.snapUnit(win.xstep), uy = P.snapUnit(win.ystep); return [Math.round(p[0] / ux) * ux, Math.round(p[1] / uy) * uy]; };

  // ---------- checking a drawing ----------
  // distance in grid squares, so "half a grid square" means the same on any window
  const gdist = (p, q, win) => Math.hypot((p[0] - q[0]) / win.xstep, (p[1] - q[1]) / win.ystep);
  // distance (in grid squares) from p to a set of polylines. Segments are bucketed into grid-square cells once,
  // so each query only looks at nearby segments; distances beyond `cap` are reported as cap + 1.
  function segIndex(segs, win) {
    const cells = new Map(), list = [];
    for (const s of segs) for (let i = 0; i < s.length; i++) {
      const a = s[i], b = s[i + 1] || s[i];
      const ax = a[0] / win.xstep, ay = a[1] / win.ystep, bx = b[0] / win.xstep, by = b[1] / win.ystep;
      if (![ax, ay, bx, by].every(isFinite)) continue;
      const k = list.push([ax, ay, bx, by]) - 1;
      const x0 = Math.floor(Math.min(ax, bx)), x1 = Math.floor(Math.max(ax, bx)), y0 = Math.floor(Math.min(ay, by)), y1 = Math.floor(Math.max(ay, by));
      if ((x1 - x0 + 1) * (y1 - y0 + 1) > 4000) continue; // an enormous segment far off screen can't be near anything we test
      for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) { const key = cx + ',' + cy; let c = cells.get(key); if (!c) cells.set(key, (c = [])); c.push(k); }
    }
    return { cells, list };
  }
  function distIdx(p, idx, win, cap = 3) {
    const px = p[0] / win.xstep, py = p[1] / win.ystep, cx0 = Math.floor(px), cy0 = Math.floor(py);
    if (!idx.stamp || idx.stamp.length < idx.list.length) { idx.stamp = new Uint32Array(idx.list.length); idx.tick = 0; }
    const stamp = idx.stamp, tick = ++idx.tick;
    let best = cap + 1;
    const scan = (r0, r1) => {
      for (let cx = cx0 - r1; cx <= cx0 + r1; cx++) for (let cy = cy0 - r1; cy <= cy0 + r1; cy++) {
        if (Math.max(Math.abs(cx - cx0), Math.abs(cy - cy0)) < r0) continue;
        const c = idx.cells.get(cx + ',' + cy);
        if (!c) continue;
        for (const k of c) {
          if (stamp[k] === tick) continue;
          stamp[k] = tick;
          const q = idx.list[k], ax = q[0], ay = q[1], dx = q[2] - ax, dy = q[3] - ay, L = dx * dx + dy * dy;
          let t = L ? ((px - ax) * dx + (py - ay) * dy) / L : 0;
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          const ex = px - ax - t * dx, ey = py - ay - t * dy, dd = Math.sqrt(ex * ex + ey * ey);
          if (dd < best) best = dd;
        }
      }
    };
    scan(0, 1); // the point's own cell and its neighbors
    if (best > 1) scan(2, Math.ceil(cap)); // only look farther when nothing is within one grid square
    return best;
  }
  const inWin = (p, win) => p[0] >= win.xmin && p[0] <= win.xmax && p[1] >= win.ymin && p[1] <= win.ymax;
  // evenly spaced points along polylines (spacing in grid squares), keeping only points inside the window
  function resample(segs, win, spacing) {
    const out = [];
    for (const s of segs) {
      if (s.length === 1) { if (inWin(s[0], win)) out.push(s[0]); continue; }
      for (let i = 0; i + 1 < s.length; i++) {
        const a = s[i], b = s[i + 1], L = gdist(a, b, win), n = Math.max(1, Math.ceil(L / spacing));
        for (let k = 0; k < n; k++) { const p = [a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]; if (inWin(p, win)) out.push(p); }
      }
      const last = s[s.length - 1];
      if (inWin(last, win)) out.push(last);
    }
    return out;
  }
  // the target curve as segments, sampled a little finer than the screen
  function targetSegs(g, win) {
    if (g.kind === 'fn') return P.sample(g.f, win, 600);
    return P.contour(g.F, win, 240, 240);
  }
  // key points of a function's graph inside the window: intercepts and turning points
  function keyPoints(g, win) {
    const pts = [];
    if (g.kind !== 'fn') return pts;
    const f = g.f, n = 2000, dx = (win.xmax - win.xmin) / n;
    const y0 = f(0);
    if (win.xmin <= 0 && win.xmax >= 0 && isFinite(y0) && y0 >= win.ymin && y0 <= win.ymax) pts.push({ p: [0, y0], what: 'the y-intercept' });
    let px = win.xmin, py = f(px), pd = null;
    for (let k = 1; k <= n; k++) {
      const x = win.xmin + k * dx, y = f(x);
      if (isFinite(py) && isFinite(y)) {
        if (py === 0 || (py < 0) !== (y < 0)) {
          if (Math.abs(y - py) < (win.ymax - win.ymin) / 4) { // a crossing, not a jump across an asymptote
            let a = px, b = x;
            for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if ((f(m) < 0) === (f(a) < 0)) a = m; else b = m; }
            pts.push({ p: [(a + b) / 2, 0], what: 'an x-intercept' });
          }
        }
        const d = y - py;
        if (pd != null && d * pd < 0 && Math.abs(d) < (win.ymax - win.ymin) / 50 && y >= win.ymin && y <= win.ymax) pts.push({ p: [px, py], what: pd > 0 ? 'a high point (vertex)' : 'a low point (vertex)' });
        pd = d !== 0 ? d : pd;
      } else pd = null;
      px = x; py = y;
    }
    const uniq = [];
    pts.forEach((q) => { if (inWin(q.p, win) && !uniq.some((u) => gdist(u.p, q.p, win) < 0.5)) uniq.push(q); });
    return uniq.slice(0, 12);
  }
  // items: [{t:'stroke', pts}, {t:'point', p}, {t:'line'|'parabola'|'circle', a, b}]
  // → {ok, msgs:[…], off:[points to highlight], target: segments to draw on check}
  P.TOL = 0.5; // grid squares, for pen strokes
  P.TOL_SHAPE = 0.15; // for lines, parabolas and circles built from snapped points
  P.TOL_KEY = 0.3; // intercepts and turning points must be this close to the drawing
  P.checkDrawing = function (g, items, win) {
    const tol = P.TOL, msgs = [];
    const tsegs = targetSegs(g, win);
    const target = resample(tsegs, win, 0.1);
    if (!target.length) return { ok: false, msgs: ['That graph doesn’t pass through this window. Change the window so part of it shows.'], off: [], target: tsegs };
    // pen strokes get half a grid square of slack; lines, parabolas and circles are built exactly from
    // snapped points, so they must match much more closely (a line one unit too high is wrong, not wobbly)
    const drawn = [], points = [], dpts = [];
    items.forEach((it) => {
      if (it.t === 'point') { points.push(it.p); return; }
      let segs = null, t = tol;
      if (it.t === 'stroke') segs = [it.pts];
      else { const sh = P.shape(it.t, it.a, it.b, win); if (sh) { segs = sh.segs; t = P.TOL_SHAPE; } }
      if (!segs) return;
      segs.forEach((q) => drawn.push(q));
      resample(segs, win, 0.1).forEach((p) => dpts.push({ p, t }));
    });
    if (!dpts.length && !points.length) return { ok: false, msgs: ['Draw the graph first.'], off: [], target: tsegs };
    const off = [];
    const tIdx = segIndex(tsegs, win), dIdx = segIndex(drawn, win);
    // 1. points: each must be on the graph
    let badPts = 0;
    points.forEach((p) => { if (distIdx(p, tIdx, win) > 0.2) { badPts++; off.push(p); } });
    if (points.length && badPts) msgs.push(badPts === 1 ? 'One of your points is not on the graph.' : badPts + ' of your points are not on the graph.');
    // points only: enough of them, and spread out, to pin the graph down
    if (!dpts.length) {
      const need = g.kind === 'fn' && g.ast && MX.toPoly && isLinear(g) ? 2 : 3;
      if (!badPts && points.length < need) msgs.push('Plot at least ' + need + ' points, or connect them with a line, a parabola or the pen.');
      return { ok: !badPts && points.length >= need, msgs: msgs.length ? msgs : ['All ' + points.length + ' points are on the graph.'], off, target: tsegs };
    }
    // 2. the drawing stays close to the graph
    let near = 0;
    const far = [];
    dpts.forEach(({ p, t }) => { const d = distIdx(p, tIdx, win); if (d <= t) near++; else far.push([p, d]); });
    const acc = near / dpts.length;
    const wild = far.filter(([, d]) => d > 3 * tol);
    far.forEach(([p]) => off.push(p));
    const exact = dpts.some((q) => q.t < tol);
    if (acc < 0.9) msgs.push(acc < 0.6 ? (exact ? 'Your line or curve is not the graph of this equation. Check the points you picked.' : 'Most of your drawing is not on the graph.') : exact ? 'Your line or curve is close, but not on the graph. Check the points you picked.' : 'Part of your drawing is more than half a grid square away from the graph.');
    else if (wild.length > 0.02 * dpts.length) msgs.push('Some of your drawing is far from the graph.');
    // 3. the drawing covers the graph (the part inside the window)
    let covered = 0;
    target.forEach((p) => { if (distIdx(p, dIdx, win) <= tol) covered++; });
    const cov = covered / target.length;
    if (cov < 0.8) msgs.push('Your drawing doesn’t cover enough of the graph. Draw it across the whole window.');
    // 4. key points
    const keys = keyPoints(g, win), missed = keys.filter((k) => distIdx(k.p, dIdx, win) > P.TOL_KEY);
    missed.slice(0, 3).forEach((k) => msgs.push('Your drawing misses ' + k.what + ' at (' + fmt(round2(k.p[0])) + ', ' + fmt(round2(k.p[1])) + ').'));
    const ok = acc >= 0.9 && wild.length <= 0.02 * dpts.length && cov >= 0.8 && !missed.length && !badPts;
    if (ok) msgs.unshift('Yes! Your drawing matches the graph.');
    return { ok, msgs, off: off.slice(0, 400), target: tsegs, accuracy: acc, coverage: cov };
  };
  const round2 = (v) => Math.round(v * 100) / 100;
  function isLinear(g) {
    try { const p = MX.toPoly(g.ast); if (!p) return false; for (const k of p.keys ? p.keys() : Object.keys(p)) { const deg = (String(k).match(/x\^?(\d*)/) || [])[1]; if (deg && +deg > 1) return false; } return !!p; } catch (e) { return false; }
  }
  // ---------- drawings as short text (saved answers are capped at 2000 characters) ----------
  // "p:x,y" point · "line:x,y,x,y" · "parabola:…" · "circle:…" · "s:x,y x,y …" pen stroke; items joined by ";"
  const r2 = (v) => Math.round(v * 100) / 100;
  P.encode = function (items, win) {
    const w = win || P.DEFAULT_WIN;
    const out = [];
    let budget = 1900;
    for (const it of items) {
      let s = '';
      if (it.t === 'point') s = 'p:' + r2(it.p[0]) + ',' + r2(it.p[1]);
      else if (it.t === 'line' || it.t === 'parabola' || it.t === 'circle') s = it.t + ':' + [it.a[0], it.a[1], it.b[0], it.b[1]].map(r2).join(',');
      else if (it.t === 'stroke') {
        // keep a point every ~0.2 grid squares, at most 60 per stroke
        const keep = [it.pts[0]];
        for (const q of it.pts) { const l = keep[keep.length - 1]; if (Math.hypot((q[0] - l[0]) / w.xstep, (q[1] - l[1]) / w.ystep) >= 0.2) keep.push(q); }
        const last = it.pts[it.pts.length - 1];
        if (keep[keep.length - 1] !== last) keep.push(last);
        const step = Math.max(1, Math.ceil(keep.length / 60));
        const pts = keep.filter((_, k) => k % step === 0 || k === keep.length - 1);
        s = 's:' + pts.map((q) => r2(q[0]) + ',' + r2(q[1])).join(' ');
      }
      if (!s || s.length > budget) continue;
      budget -= s.length + 1;
      out.push(s);
    }
    return out.join(';');
  };
  P.decode = function (str) {
    const items = [];
    const num = (v) => { const n = +v; return isFinite(n) && Math.abs(n) < 1e6 ? n : null; };
    String(str || '').split(';').slice(0, 60).forEach((part) => {
      const m = /^(p|line|parabola|circle|s):(.*)$/.exec(part.trim());
      if (!m) return;
      if (m[1] === 's') {
        const pts = m[2].split(' ').map((q) => q.split(',').map(num)).filter((q) => q.length === 2 && q[0] !== null && q[1] !== null);
        if (pts.length > 1) items.push({ t: 'stroke', pts });
        return;
      }
      const v = m[2].split(',').map(num);
      if (v.some((x) => x === null)) return;
      if (m[1] === 'p' && v.length === 2) items.push({ t: 'point', p: v });
      else if (m[1] !== 'p' && v.length === 4) items.push({ t: m[1], a: [v[0], v[1]], b: [v[2], v[3]] });
    });
    return items;
  };
  MX.Plot = P;
})(typeof window !== 'undefined' ? window : globalThis);

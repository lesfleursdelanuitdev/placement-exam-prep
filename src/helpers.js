/* helpers.js: shared pieces for problem generators */
(function (G) {
  'use strict';
  const MX = G.MX;
  const { Q, S } = MX;
  const H = (MX.H = {});

  H.box = (tex) => '\\boxed{' + tex + '}';
  // coefficient in front of a variable, from a number or Q: 1 -> '', -1 -> '-'
  H.cq = (q) => { q = MX.Q.of(q); return q.eq(1) ? '' : q.eq(-1) ? '-' : q.tex(); };

  // coefficient (Q) times variables with signed exponents, written as a fraction with positive exponents
  H.fracMono = function (coef, vars, order) {
    coef = Q.of(coef);
    const names = order || Object.keys(vars).sort();
    const top = {}, bot = {};
    for (const k of names) {
      const e = vars[k] || 0;
      if (e > 0) top[k] = e;
      else if (e < 0) bot[k] = -e;
    }
    const neg = coef.n < 0;
    const a = Math.abs(coef.n), d = coef.d;
    const mt = MX.mono(top, names), mb = MX.mono(bot, names);
    const numTex = (a === 1 && mt.tex ? '' : String(a)) + mt.tex;
    const numAsc = (a === 1 && mt.asc ? '' : String(a)) + mt.asc;
    const denTex = (d === 1 ? '' : String(d)) + mb.tex;
    const denAsc = (d === 1 ? '' : String(d)) + mb.asc;
    const sg = neg ? '-' : '';
    if (!denTex) return { tex: sg + numTex, asc: sg + numAsc };
    const denWrapped = (denAsc.length > 1 && !/^[a-zA-Z0-9]$/.test(denAsc)) ? '(' + denAsc + ')' : denAsc;
    return { tex: sg + '\\frac{' + numTex + '}{' + denTex + '}', asc: sg + numAsc + '/' + denWrapped };
  };

  // point helpers
  const qs = (v) => (v instanceof Q ? v.str() : MX.num(v));
  const qt = (v) => (v instanceof Q ? v.tex() : MX.texNum(v));
  H.pt = (x, y) => ({ asc: '(' + qs(x) + ', ' + qs(y) + ')', tex: '\\left(' + qt(x) + ', ' + qt(y) + '\\right)' });
  H.qs = qs; H.qt = qt;

  // scientific notation of N * 10^k (N integer)
  H.sci = function (N, k) {
    const neg = N < 0;
    let s = String(Math.abs(N));
    let exp = k + s.length - 1;
    s = s.replace(/0+$/, '') || '0';
    const mant = s[0] + (s.length > 1 ? '.' + s.slice(1) : '');
    const value = (neg ? -1 : 1) * parseFloat(mant) * Math.pow(10, exp);
    const m = (neg ? '-' : '') + mant;
    return { mant: m, exp, value, tex: m + ' \\times 10^{' + exp + '}', asc: m + ' x 10^' + exp };
  };
  // plain decimal string of N * 10^k
  H.decStr = function (N, k) {
    const neg = N < 0;
    let s = String(Math.abs(N));
    if (k >= 0) s = s + '0'.repeat(k);
    else {
      const p = -k;
      if (s.length <= p) s = '0.' + '0'.repeat(p - s.length) + s;
      else s = s.slice(0, s.length - p) + '.' + s.slice(s.length - p);
      s = s.replace(/\.?0+$/, '');
    }
    if (k >= 0) s = MX.commas(+s);
    return (neg ? '-' : '') + s;
  };

  // shuffle a correct option among distractors -> {options, answer}
  H.choices = function (rng, correct, distractors) {
    const all = [{ h: correct, ok: true }, ...distractors.map((h) => ({ h, ok: false }))];
    const sh = rng.shuffle(all);
    return { options: sh.map((o) => o.h), answer: sh.findIndex((o) => o.ok) };
  };

  // small plane with a curve, for graph multiple-choice
  H.graphSvg = function (f, o = {}) {
    const pl = S.plane(Object.assign({ xmin: -10, xmax: 10, ymin: -10, ymax: 10, w: 190, h: 190, step: 1, labelEvery: 5, pad: 16 }, o));
    let b = pl.body + pl.curve(f, 'acc thick');
    (o.dots || []).forEach((p) => { b += pl.dot(p[0], p[1]); });
    return S.svg(pl.W, pl.H, b, o.label || 'graph');
  };
  H.nlSvg = (val, closed, dir, o = {}) =>
    S.numberLine(Object.assign({ min: -5, max: 5, val, closed, dir, w: 280 }, o));
  // 4 number-line options for x (op) v
  H.nlChoices = function (rng, op, v, o = {}) {
    const closed = op.includes('=');
    const dir = op[0] === '>' ? 'right' : 'left';
    const other = dir === 'right' ? 'left' : 'right';
    return H.choices(rng, H.nlSvg(v, closed, dir, o), [H.nlSvg(v, !closed, dir, o), H.nlSvg(v, closed, other, o), H.nlSvg(v, !closed, other, o)]);
  };

  // ---------- intervals and regions ----------
  // a region is a sorted list of intervals {lo, hi, lc, hc}; ends may be numbers, Q, or ±Infinity
  const INF = Infinity;
  const rv = (v) => (v instanceof Q ? v.val() : v);
  const endAsc = (v) => (rv(v) === INF ? 'inf' : rv(v) === -INF ? '-inf' : v instanceof Q ? v.str() : MX.num(v));
  const endTex = (v) => (rv(v) === INF ? '\\infty' : rv(v) === -INF ? '-\\infty' : v instanceof Q ? v.tex() : MX.texNum(v));
  H.iv = (lo, hi, lc, hc) => ({ lo, hi, lc: rv(lo) !== -INF && !!lc, hc: rv(hi) !== INF && !!hc });
  H.ALLREAL = [{ lo: -INF, hi: INF, lc: false, hc: false }];
  H.regionAsc = (reg) => (reg.length ? reg.map((r) => (r.lc ? '[' : '(') + endAsc(r.lo) + ', ' + endAsc(r.hi) + (r.hc ? ']' : ')')).join(' ∪ ') : 'no solution');
  H.regionTex = (reg) => (reg.length ? reg.map((r) => (r.lc ? '[' : '(') + endTex(r.lo) + ', ' + endTex(r.hi) + (r.hc ? ']' : ')')).join(' \\cup ') : '\\text{no solution}');
  // inequality form in variable v: x > 3, -2 <= x < 5, x < -1 or x > 3
  H.regionIneqTex = function (reg, v = 'x') {
    if (!reg.length) return '\\text{no solution}';
    return reg.map((r) => {
      const L = rv(r.lo) === -INF, U = rv(r.hi) === INF;
      if (L && U) return '\\text{all real numbers}';
      if (L) return v + (r.hc ? ' \\le ' : ' \\lt ') + endTex(r.hi);
      if (U) return v + (r.lc ? ' \\ge ' : ' \\gt ') + endTex(r.lo);
      return endTex(r.lo) + (r.lc ? ' \\le ' : ' \\lt ') + v + (r.hc ? ' \\le ' : ' \\lt ') + endTex(r.hi);
    }).join('\\ \\text{ or }\\ ');
  };
  H.complement = function (reg) {
    if (!reg.length) return H.ALLREAL.slice();
    const out = [];
    const first = reg[0], last = reg[reg.length - 1];
    if (rv(first.lo) !== -INF) out.push({ lo: -INF, hi: first.lo, lc: false, hc: !first.lc });
    for (let k = 0; k + 1 < reg.length; k++) out.push({ lo: reg[k].hi, hi: reg[k + 1].lo, lc: !reg[k].hc, hc: !reg[k + 1].lc });
    if (rv(last.hi) !== INF) out.push({ lo: last.hi, hi: INF, lc: !last.hc, hc: false });
    return out.filter((r) => rv(r.hi) > rv(r.lo));
  };
  // a number-line window around the finite endpoints
  H.regionWindow = function (reg, extra = []) {
    const ends = [];
    reg.forEach((r) => { [r.lo, r.hi].forEach((e) => { if (isFinite(rv(e))) ends.push(rv(e)); }); });
    extra.forEach((e) => ends.push(rv(e)));
    if (!ends.length) ends.push(0);
    let lo = Math.floor(Math.min(...ends)), hi = Math.ceil(Math.max(...ends));
    const span = Math.max(hi - lo, 1);
    const step = span <= 12 ? 1 : span <= 30 ? 2 : span <= 60 ? 5 : span <= 150 ? 10 : Math.pow(10, Math.ceil(Math.log10(span / 15)));
    lo = Math.floor((lo - Math.max(2, span * 0.25) * (step > 1 ? 1 : 1)) / step) * step;
    hi = Math.ceil((hi + Math.max(2, span * 0.25)) / step) * step;
    const le = (hi - lo) / step > 14 ? step * 2 : step;
    return { min: lo, max: hi, step, labelEvery: le };
  };
  H.regionSvg = (reg, win, o = {}) => S.regionLine(Object.assign({ region: reg, w: 280 }, win || H.regionWindow(reg), o));
  const regKey = (reg) => JSON.stringify(reg.map((r) => [rv(r.lo), rv(r.hi), !!r.lc, !!r.hc]));
  // the correct graph plus three plausible wrong ones (flip the dots, the opposite region, reversed direction)
  H.regionChoices = function (rng, reg, extra) {
    const win = H.regionWindow(reg, extra || []);
    const flip = reg.map((r) => Object.assign({}, r, { lc: rv(r.lo) !== -INF && !r.lc, hc: rv(r.hi) !== INF && !r.hc }));
    const comp = H.complement(reg);
    const compFlip = comp.map((r) => Object.assign({}, r, { lc: rv(r.lo) !== -INF && !r.lc, hc: rv(r.hi) !== INF && !r.hc }));
    const neg = reg.map((r) => ({ lo: -rv(r.hi), hi: -rv(r.lo), lc: r.hc, hc: r.lc })).reverse();
    const seen = new Set([regKey(reg)]), pool = [];
    for (const c of [flip, comp, compFlip, neg]) { const k = regKey(c); if (c.length && !seen.has(k)) { seen.add(k); pool.push(c); } }
    let shift = 1;
    while (pool.length < 3) { const c = reg.map((r) => ({ lo: rv(r.lo) + shift, hi: rv(r.hi) + shift, lc: r.lc, hc: r.hc })); const k = regKey(c); if (!seen.has(k)) { seen.add(k); pool.push(c); } shift++; }
    return H.choices(rng, H.regionSvg(reg, win), pool.slice(0, 3).map((c) => H.regionSvg(c, win)));
  };

  // ---------- function plots ----------
  // o = {r | win:{xmin,xmax,ymin,ymax}, w, h, pieces:[{f, from, to, openFrom, openTo, dotFrom, dotTo, cls}], dots:[[x,y,closed]], label}
  // pieces are sampled finely, clipped to the window, and get arrows wherever they run off it
  H.fnPlot = function (o) {
    const R = o.r || 8;
    const win = Object.assign({ xmin: -R, xmax: R, ymin: -R, ymax: R }, o.win || {});
    const span = win.xmax - win.xmin;
    const pl = S.plane(Object.assign({ w: o.w || 230, h: o.h || o.w || 230, step: o.step || (span > 24 ? 2 : 1), labelEvery: o.labelEvery || (span >= 16 ? 4 : 2), pad: 18 }, o.ystep ? { ystep: o.ystep, ylabelEvery: o.ylabelEvery || o.ystep * 2 } : {}, win));
    let b = pl.body;
    const inY = (y) => isFinite(y) && y >= win.ymin - 1e-9 && y <= win.ymax + 1e-9;
    const ends = []; // endpoint dots, drawn after every curve
    (o.pieces || []).forEach((pc) => {
      const a = Math.max(pc.from == null ? -Infinity : pc.from, win.xmin), z = Math.min(pc.to == null ? Infinity : pc.to, win.xmax);
      if (!(z > a)) return;
      const n = 260, segs = [];
      let cur = null, prevIn = false, prevY = null;
      for (let k = 0; k <= n; k++) {
        const x = a + ((z - a) * k) / n, y = pc.f(x);
        const jump = prevY != null && Math.abs(y - prevY) > (win.ymax - win.ymin) * 0.6;
        if (inY(y) && !jump) {
          if (!cur) { cur = { pts: [], clipStart: k > 0 || (pc.from == null || pc.from === -Infinity || pc.from < win.xmin) }; segs.push(cur); }
          cur.pts.push([x, y]);
        } else if (cur) { cur.clipEnd = true; cur = null; }
        prevY = y;
      }
      if (cur) cur.clipEnd = pc.to == null || pc.to === Infinity || pc.to > win.xmax;
      segs.forEach((s) => {
        if (s.pts.length < 2) return;
        const px = s.pts.map((p) => [pl.X(p[0]), pl.Y(p[1])]);
        b += S.pline(px, pc.cls || 'acc thick');
        const m = px.length;
        if (s.clipStart && !(pc.from != null && isFinite(pc.from) && pc.from >= win.xmin && s.pts[0][0] === a)) b += S.arrow(px[Math.min(3, m - 1)][0], px[Math.min(3, m - 1)][1], px[0][0], px[0][1], 'acc', 8);
        if (s.clipEnd && !(pc.to != null && isFinite(pc.to) && pc.to <= win.xmax && s.pts[m - 1][0] === z)) b += S.arrow(px[Math.max(0, m - 4)][0], px[Math.max(0, m - 4)][1], px[m - 1][0], px[m - 1][1], 'acc', 8);
      });
      const endDot = (x, open) => { const y = pc.f(x); if (inY(y)) ends.push({ x, y, open: !!open }); };
      if (pc.from != null && isFinite(pc.from) && pc.from >= win.xmin && pc.dotFrom !== false) endDot(pc.from, pc.openFrom);
      if (pc.to != null && isFinite(pc.to) && pc.to <= win.xmax && pc.dotTo !== false) endDot(pc.to, pc.openTo);
    });
    // where two pieces meet at the same point and one includes it, show only the closed dot
    const same = (p, q) => Math.abs(p.x - q.x) < 1e-9 && Math.abs(p.y - q.y) < 1e-9;
    ends.filter((e) => !(e.open && ends.some((f) => !f.open && same(e, f))))
      .forEach((e, i, arr) => { if (arr.findIndex((f) => same(e, f) && f.open === e.open) === i) b += S.circle(pl.X(e.x), pl.Y(e.y), 4.2, e.open ? 'paperf acc' : 'accf acc'); });
    (o.dots || []).forEach(([x, y, closed]) => { b += S.circle(pl.X(x), pl.Y(y), 4.2, closed === false ? 'paperf acc' : 'accf acc'); });
    return S.svg(pl.W, pl.H, b, o.label || 'graph of a function');
  };
  // f(x) = { rows } with a drawn brace; rows = [[exprTex, conditionTex], ...]
  H.piecewiseHTML = function (name, rows) {
    const h = (rows.length * 1.75).toFixed(2);
    const brace = `<svg class="pw-br" viewBox="0 0 10 100" preserveAspectRatio="none" style="height:${h}em" aria-hidden="true"><path d="M9 1 C4 1 5.2 8 5.2 24 C5.2 42 4 47 1 50 C4 53 5.2 58 5.2 76 C5.2 92 4 99 9 99" fill="none" stroke="currentColor" stroke-width="1.3" vector-effect="non-scaling-stroke"/></svg>`;
    const body = rows.map(([e, c]) => `<span class="pw-e">${MX.texHTML(e)}</span><span class="pw-c">if&nbsp;${MX.texHTML(c)}</span>`).join('');
    return `<span class="pw">${MX.texHTML(name + ' =')}${brace}<span class="pw-rows">${body}</span></span>`;
  };
  // plain-text version for screen readers and answers
  H.piecewiseText = (name, rows) => name + ' = ' + rows.map(([e, c]) => e + ' if ' + c).join('; ');

  // readable list "a, b and c"
  H.list = (arr) => (arr.length < 2 ? arr.join('') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1]);
  H.rel = (op) => ({ '<': '\\lt', '>': '\\gt', '<=': '\\le', '>=': '\\ge', '=': '=' }[op]);
  H.flip = (op) => ({ '<': '>', '>': '<', '<=': '>=', '>=': '<=' }[op]);
  // a random integer in [a,b] not in the excluded list
  H.intNot = (rng, a, b, not) => { let v; do { v = rng.int(a, b); } while (not.includes(v)); return v; };
  // resample until ok (guards against infinite loops)
  H.until = function (fn, ok, tries = 400) {
    let v;
    for (let i = 0; i < tries; i++) { v = fn(); if (ok(v)) return v; }
    throw new Error('generator could not satisfy constraints');
  };
  // units select helper
  H.units = (answer, options) => ({ answer, options });
})(typeof window !== 'undefined' ? window : globalThis);

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

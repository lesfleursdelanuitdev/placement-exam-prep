/* Absolute value, absolute value equations, piecewise functions, transformations of functions */
(function (G) {
  'use strict';
  const MX = G.MX;
  const { Q, T, H, S } = MX;
  const SEC = 'Absolute value';
  const FSEC = 'Relations & functions';
  const ADDED = 'Added';
  const A = (t) => T`\left|${t}\right|`;
  const lin = (a, b, v = 'x') => MX.lin(a, b, v);
  const qv = (q) => (q instanceof Q ? q : new Q(q));
  // a solution set part: vals are Q or numbers
  function setPart(vals, points, v = 'x') {
    const u = [];
    vals.map(qv).forEach((q) => { if (!u.some((w) => w.eq(q))) u.push(q); });
    u.sort((a, b) => a.val() - b.val());
    if (!u.length) return { kind: 'set', answers: [], answer: 'no solution', show: '\\text{no solution}', points };
    return { kind: 'set', answers: u.map((q) => q.str()), answer: '{' + u.map((q) => q.str()).join(', ') + '}', show: u.map((q) => v + ' = ' + q.tex()).join('\\ \\text{ or }\\ '), points };
  }
  const SET_HINT = 'List every solution, separated by commas. If there is none, use the “no solution” button.';

  // ================= absolute value expressions =================
  function absTerm(rng) {
    const kind = rng.pick(['negabs', 'diff', 'coef', 'plain']);
    if (kind === 'negabs') { const a = rng.int(2, 12); return { tex: T`-${A('-' + a)}`, val: -a, step: T`\(${A('-' + a)} = ${a}\), so \(-${A('-' + a)} = -${a}\)` }; }
    if (kind === 'diff') { let b, c; do { b = rng.int(-9, 12); c = rng.int(-9, 12); } while (b === c); return { tex: A(b + ' - ' + MX.par(c)), val: Math.abs(b - c), step: T`\(${A(b + ' - ' + MX.par(c))} = ${A(b - c)} = ${Math.abs(b - c)}\)` }; }
    if (kind === 'coef') { const k = rng.int(2, 5), d = -rng.int(2, 9); return { tex: T`${k}${A(d)}`, val: k * -d, step: T`\(${k}${A(d)} = ${k}\cdot${-d} = ${k * -d}\)` }; }
    const e = rng.nz(-15, 15); return { tex: A(e), val: Math.abs(e), step: T`\(${A(e)} = ${Math.abs(e)}\)` };
  }
  const CMP = [
    { tex: (n) => A('-' + n), val: (n) => n },
    { tex: (n) => T`-${A(n)}`, val: (n) => -n },
    { tex: (n) => T`-${A('-' + n)}`, val: (n) => -n },
    { tex: (n) => T`-\left(-${n}\right)`, val: (n) => n },
    { tex: (n) => A(n), val: (n) => n },
  ];
  MX.register({
    id: 'abs-value', section: SEC, title: 'Absolute value expressions', kind: 'skill', sources: [ADDED],
    slots: [{ label: 'Absolute value', source: ADDED, pool: ['simplify', 'order', 'compare', 'evaluate', 'distance'] }],
    lesson: T`<p>The <strong>absolute value</strong> \(|a|\) is the distance from \(a\) to 0 on the number line, so it is never negative: \(|7| = 7\) and \(|-7| = 7\).</p>
<ul><li>A negative sign <em>outside</em> the bars stays: \(-|-7| = -7\).</li>
<li>Absolute value bars are grouping symbols. Simplify what's inside first, then take the absolute value: \(|3 - 8| = |-5| = 5\).</li>
<li>Then follow the order of operations: \(10 - 2|1 - 4| = 10 - 2\cdot3 = 4\) (multiply before subtracting).</li>
<li>The distance between \(a\) and \(b\) on the number line is \(|a - b|\).</li></ul>
<p class="warn">\(|a - b|\) is not \(|a| - |b|\): \(|2 - 9| = 7\), but \(|2| - |9| = -7\).</p>`,
    variants: {
      simplify: {
        name: 'Simplify',
        gen(rng) {
          const n = rng.int(2, 3), terms = Array.from({ length: n }, () => absTerm(rng)), ops = terms.map((t, k) => (k ? rng.pick(['+', '-']) : ''));
          let v = 0, tex = '';
          terms.forEach((t, k) => { const s = ops[k] === '-' ? -1 : 1; v += s * t.val; tex += (k ? ' ' + ops[k] + ' ' : '') + t.tex; });
          const valsTex = terms.map((t, k) => (k ? ' ' + ops[k] + ' ' + MX.par(t.val) : String(t.val))).join('');
          return {
            prompt: T`Simplify: \(${tex}\)`,
            parts: [{ kind: 'num', answer: String(v), points: 2 }],
            solution: [...terms.map((t) => t.step), T`\(${valsTex} = ${H.box(String(v))}\)`],
          };
        },
      },
      order: {
        name: 'Order of operations',
        gen(rng) {
          const a = rng.int(4, 20), b = rng.int(2, 5);
          let c, d; do { c = rng.int(-6, 9); d = rng.int(-6, 9); } while (c === d);
          const inner = Math.abs(c - d), v = a - b * inner;
          return {
            prompt: T`Simplify: \(${a} - ${b}${A(c + ' - ' + MX.par(d))}\)`,
            parts: [{ kind: 'num', answer: String(v), points: 2 }],
            solution: [
              T`Inside the bars first: \(${c} - ${MX.par(d)} = ${c - d}\), and \(${A(c - d)} = ${inner}\).`,
              T`Multiply before subtracting: \(${b}\cdot${inner} = ${b * inner}\).`,
              T`\(${a} - ${b * inner} = ${H.box(String(v))}\) (not \(\left(${a} - ${b}\right)\cdot${inner}\)).`,
            ],
          };
        },
      },
      compare: {
        name: 'Compare values',
        gen(rng) {
          const n = rng.int(2, 15);
          const [i, j] = rng.sample([0, 1, 2, 3, 4], 2);
          const L = CMP[i], R = CMP[j], lv = L.val(n), rvv = R.val(n);
          const rel = lv < rvv ? 0 : lv === rvv ? 1 : 2;
          return {
            prompt: T`Fill in the box with \(\lt\), \(=\) or \(\gt\): \(${L.tex(n)} \quad \square \quad ${R.tex(n)}\)`,
            parts: [
              { label: 'a', ask: T`Value of \(${L.tex(n)}\)`, kind: 'num', answer: String(lv), points: 1 },
              { label: 'b', ask: T`Value of \(${R.tex(n)}\)`, kind: 'num', answer: String(rvv), points: 1 },
              { label: 'c', ask: 'Which sign goes in the box?', kind: 'choice', options: ['&lt;', '=', '&gt;'], inline: true, answer: rel, points: 1 },
            ],
            solution: [T`\(${L.tex(n)} = ${lv}\) and \(${R.tex(n)} = ${rvv}\).`, T`\(${lv} ${['\\lt', '=', '\\gt'][rel]} ${rvv}\)`],
          };
        },
      },
      evaluate: {
        name: 'Evaluate for given values',
        gen(rng) {
          const x = rng.nz(-9, 9), y = rng.nz(-9, 9);
          const forms = [
            { tex: A('x - y'), val: Math.abs(x - y), sub: A(x + ' - ' + MX.par(y)) },
            { tex: T`${A('x')} - ${A('y')}`, val: Math.abs(x) - Math.abs(y), sub: T`${A(x)} - ${A(y)}` },
            { tex: A('2x + y'), val: Math.abs(2 * x + y), sub: A('2' + MX.par(x) + ' + ' + MX.par(y)) },
            { tex: T`-${A('x')} + 3${A('y')}`, val: -Math.abs(x) + 3 * Math.abs(y), sub: T`-${A(x)} + 3${A(y)}` },
            { tex: T`${A('x y')}`, val: Math.abs(x * y), sub: A(MX.par(x) + '\\cdot' + MX.par(y)) },
          ];
          const F = rng.pick(forms);
          return {
            prompt: T`Evaluate \(${F.tex}\) when \(x = ${x}\) and \(y = ${y}\).`,
            parts: [{ kind: 'num', answer: String(F.val), points: 2 }],
            solution: [T`Substitute: \(${F.sub}\)`, T`Simplify inside each pair of bars, take absolute values, then finish: \(${H.box(String(F.val))}\)`],
          };
        },
      },
      distance: {
        name: 'Distance on the number line',
        gen(rng) {
          let a, b; do { a = rng.int(-12, 10); b = rng.int(-10, 12); } while (a === b || (a >= 0 && b >= 0));
          const d = Math.abs(a - b), lo = Math.min(a, b) - 2, hi = Math.max(a, b) + 2;
          const W = 300, Hh = 60, pad = 18, X = (v) => pad + ((v - lo) * (W - 2 * pad)) / (hi - lo);
          let v = S.line(6, 26, W - 6, 26, 'ln') ;
          for (let t = lo; t <= hi; t++) v += S.line(X(t), 22, X(t), 30, 'ln thin') + ((t - lo) % Math.max(1, Math.round((hi - lo) / 8)) === 0 || t === a || t === b ? S.text(X(t), 48, String(t), { cls: 'tx tick' }) : '');
          v += S.line(X(a), 26, X(b), 26, 'acc ray') + S.circle(X(a), 26, 5, 'accf acc') + S.circle(X(b), 26, 5, 'accf acc') + S.q((X(a) + X(b)) / 2, 14, '?');
          return {
            prompt: T`Use absolute value to find the distance between \(${a}\) and \(${b}\) on the number line.`,
            visual: S.svg(W, Hh, v, 'Two points on a number line'),
            parts: [{ kind: 'num', answer: String(d), points: 2 }],
            solution: [T`Distance \(= ${A('a - b')}\).`, T`\(${A(a + ' - ' + MX.par(b))} = ${A(a - b)} = ${H.box(String(d))}\)`, T`(Either order works: \(${A(b + ' - ' + MX.par(a))}\) is also ${d}.)`],
          };
        },
      },
    },
  });

  // ================= absolute value equations =================
  function absEq(rng) {
    const a = rng.pick([1, 1, 2, 3, 4, 5]) * rng.pick([1, 1, -1]), b = rng.nz(-9, 9), c = rng.int(1, 12);
    return { a, b, c, e: lin(a, b), s1: new Q(c - b, a), s2: new Q(-c - b, a) };
  }
  MX.register({
    id: 'abs-equation', section: SEC, title: 'Absolute value equations', kind: 'skill', sources: [ADDED],
    slots: [{ label: 'Absolute value equations', source: ADDED, pool: ['basic', 'isolate', 'two', 'zero', 'none'] }],
    lesson: T`<p>If \(|X| = a\), then \(X\) is \(a\) units from 0, so there are two cases:</p>
\[|X| = a \;\Rightarrow\; X = a \quad\text{or}\quad X = -a \qquad (a \gt 0)\]
<ol><li><strong>Isolate the absolute value</strong> first: \(3|x - 2| + 1 = 13 \Rightarrow |x - 2| = 4\).</li>
<li>Look at the other side. If it is <strong>negative</strong>, stop: there is <strong>no solution</strong>. If it is <strong>0</strong>, there is just one case, \(X = 0\).</li>
<li>Otherwise write the two equations and solve each one.</li></ol>
<p>Two absolute values: \(|X| = |Y|\) means \(X = Y\) or \(X = -Y\).</p>
<p>Answer with every solution separated by commas, like <code>-3, 7</code>.</p>`,
    variants: {
      basic: {
        name: 'Two solutions',
        gen(rng) {
          const q = absEq(rng);
          return {
            prompt: T`Solve: \(${A(q.e.tex)} = ${q.c}\)`,
            parts: [Object.assign(setPart([q.s1, q.s2], 3), { ask: SET_HINT })],
            solution: [
              T`Two cases: \(${q.e.tex} = ${q.c}\) or \(${q.e.tex} = -${q.c}\).`,
              T`\(${q.e.tex} = ${q.c}\) gives \(x = ${q.s1.tex()}\); \(${q.e.tex} = -${q.c}\) gives \(x = ${q.s2.tex()}\).`,
              T`\(${H.box(T`x = ${q.s1.tex()} \text{ or } x = ${q.s2.tex()}`)}\)`,
            ],
          };
        },
      },
      isolate: {
        name: 'Isolate the absolute value first',
        gen(rng) {
          const q = absEq(rng), k = rng.pick([2, 3, 4, -2, -3]), m = rng.nz(-12, 12), n = k * q.c + m;
          return {
            prompt: T`Solve: \(${k === -1 ? '-' : k}${A(q.e.tex)} ${MX.sgnTerm(m)} = ${n}\)`,
            parts: [Object.assign(setPart([q.s1, q.s2], 3), { ask: SET_HINT })],
            solution: [
              T`${m > 0 ? 'Subtract ' + m : 'Add ' + -m}: \(${k}${A(q.e.tex)} = ${n - m}\). Divide by ${k}: \(${A(q.e.tex)} = ${q.c}\).`,
              T`\(${q.e.tex} = ${q.c}\) or \(${q.e.tex} = -${q.c}\), so \(x = ${q.s1.tex()}\) or \(x = ${q.s2.tex()}\).`,
              T`\(${H.box(T`x = ${q.s1.tex()} \text{ or } x = ${q.s2.tex()}`)}\)`,
            ],
          };
        },
      },
      two: {
        name: 'Two absolute values',
        gen(rng) {
          let a, b, c, d, s1, s2;
          do { a = rng.int(1, 5); b = rng.nz(-9, 9); c = rng.int(1, 5) * rng.pick([1, -1]); d = rng.nz(-9, 9); } while (a === c || a === -c || (s1 = new Q(d - b, a - c), s2 = new Q(-d - b, a + c), s1.eq(s2)));
          const L = lin(a, b), R = lin(c, d);
          return {
            prompt: T`Solve: \(${A(L.tex)} = ${A(R.tex)}\)`,
            parts: [Object.assign(setPart([s1, s2], 3), { ask: SET_HINT })],
            solution: [
              T`The insides are equal or opposites: \(${L.tex} = ${R.tex}\) or \(${L.tex} = -\left(${R.tex}\right)\).`,
              T`First: \(${a - c}x = ${d - b}\), so \(x = ${s1.tex()}\). Second: \(${L.tex} = ${lin(-c, -d).tex}\), so \(${a + c}x = ${-d - b}\) and \(x = ${s2.tex()}\).`,
              T`\(${H.box(T`x = ${s1.tex()} \text{ or } x = ${s2.tex()}`)}\)`,
            ],
          };
        },
      },
      zero: {
        name: 'Equal to zero (one solution)',
        gen(rng) {
          const q = absEq(rng), m = rng.nz(-9, 9);
          return {
            prompt: T`Solve: \(${A(q.e.tex)} ${MX.sgnTerm(m)} = ${m}\)`,
            parts: [Object.assign(setPart([new Q(-q.b, q.a)], 3), { ask: SET_HINT })],
            solution: [T`Isolate: \(${A(q.e.tex)} = 0\).`, T`Only 0 has absolute value 0, so \(${q.e.tex} = 0\) and \(x = ${new Q(-q.b, q.a).tex()}\).`, T`\(${H.box(T`x = ${new Q(-q.b, q.a).tex()}`)}\)`],
          };
        },
      },
      none: {
        name: 'No solution',
        gen(rng) {
          const q = absEq(rng), k = rng.pick([1, 2, 3]), m = rng.int(2, 12), n = m - k * rng.int(1, 6);
          return {
            prompt: T`Solve: \(${k === 1 ? '' : k}${A(q.e.tex)} + ${m} = ${n}\)`,
            parts: [Object.assign(setPart([], 3), { ask: SET_HINT })],
            solution: [T`Subtract ${m}: \(${k === 1 ? '' : k}${A(q.e.tex)} = ${n - m}\)${k === 1 ? '' : T`, so \(${A(q.e.tex)} = ${new Q(n - m, k).tex()}\)`}.`, T`An absolute value is never negative, so nothing works.`, T`\(${H.box('\\text{no solution}')}\)`],
          };
        },
      },
    },
  });

  // ================= piecewise functions =================
  const PIECE = {
    lin: (rng) => { const m = rng.pick([-2, -1, 1, 2, 0.5, -0.5]), b = rng.int(-4, 4); return { f: (x) => m * x + b, tex: MX.lin(new Q(m * 2, 2), b).tex }; },
    con: (rng) => { const k = rng.int(-5, 6); return { f: () => k, tex: String(k) }; },
    sq: (rng) => { const k = rng.int(-4, 2); return { f: (x) => x * x + k, tex: T`x^{2} ${k ? MX.sgnTerm(k) : ''}` }; },
  };
  // two or three pieces split at integer breakpoints
  function makePiecewise(rng, nPieces) {
    const breaks = nPieces === 3 ? (() => { const b1 = rng.int(-4, 0); return [b1, b1 + rng.int(2, 4)]; })() : [rng.int(-3, 3)];
    const kinds = nPieces === 3 ? rng.shuffle(['lin', 'con', 'sq']) : rng.sample(['lin', 'con', 'sq', 'lin'], 2);
    const pcs = kinds.map((k) => PIECE[k](rng));
    const leftClosed = breaks.map(() => rng.chance(0.5)); // does the left piece include the breakpoint?
    const conds = pcs.map((p, i) => {
      const lo = i ? breaks[i - 1] : null, hi = i < breaks.length ? breaks[i] : null;
      const loIn = lo != null && !leftClosed[i - 1], hiIn = hi != null && leftClosed[i];
      let tex;
      if (lo == null) tex = T`x ${hiIn ? '\\le' : '\\lt'} ${hi}`;
      else if (hi == null) tex = T`x ${loIn ? '\\ge' : '\\gt'} ${lo}`;
      else tex = T`${lo} ${loIn ? '\\le' : '\\lt'} x ${hiIn ? '\\le' : '\\lt'} ${hi}`;
      return { lo, hi, loIn, hiIn, tex };
    });
    const f = (x) => { for (let i = 0; i < pcs.length; i++) { const c = conds[i]; if ((c.lo == null || x > c.lo || (x === c.lo && c.loIn)) && (c.hi == null || x < c.hi || (x === c.hi && c.hiIn))) return pcs[i].f(x); } return NaN; };
    const which = (x) => conds.findIndex((c) => (c.lo == null || x > c.lo || (x === c.lo && c.loIn)) && (c.hi == null || x < c.hi || (x === c.hi && c.hiIn)));
    return { pcs, conds, breaks, f, which, rows: pcs.map((p, i) => [p.tex, conds[i].tex]) };
  }
  // does the piece stay on the 8 × 8 grid for a stretch of its interval next to the breakpoint?
  const visibleSpan = (f, a, z) => { let n = 0; for (let k = 0; k <= 8; k++) { const y = f(a + ((z - a) * k) / 8); if (isFinite(y) && Math.abs(y) <= 7.5) n++; } return n >= 5; };
  const plotPw = (pw, o = {}) => H.fnPlot({ r: 8, pieces: pw.pcs.map((p, i) => ({ f: o.swap ? pw.pcs[(i + 1) % pw.pcs.length].f : p.f, from: pw.conds[i].lo == null ? -Infinity : pw.conds[i].lo, to: pw.conds[i].hi == null ? Infinity : pw.conds[i].hi, openFrom: o.flip ? pw.conds[i].loIn : !pw.conds[i].loIn, openTo: o.flip ? pw.conds[i].hiIn : !pw.conds[i].hiIn })), label: 'graph of a piecewise function' });
  const numTex = (v) => MX.texNum(Math.round(v * 100) / 100);
  MX.register({
    id: 'fn-piecewise', section: FSEC, title: 'Piecewise functions', kind: 'skill', sources: [ADDED],
    slots: [{ label: 'Piecewise functions', source: ADDED, pool: ['evaluate', 'graph', 'read', 'abs', 'apply'] }],
    lesson: T`<p>A <strong>piecewise function</strong> uses different formulas on different parts of its domain:</p>
<p>${H.piecewiseHTML('f(x)', [['2x + 1', 'x \\lt 1'], ['4 - x', 'x \\ge 1']])}</p>
<ul><li><strong>To evaluate</strong> \(f(a)\): find the one condition that \(a\) satisfies, and use only that formula. Watch the boundary: here \(f(1)\) uses \(4 - x\) because of the \(\ge\), so \(f(1) = 3\).</li>
<li><strong>To graph</strong>: draw each formula only over its own interval. At a boundary, a closed dot ● means the point is included (\(\le, \ge\)); an open dot ○ means it isn't (\(\lt, \gt\)).</li>
<li>A graph is still a function as long as no \(x\) gets two outputs, so each boundary point is filled in on at most one piece.</li></ul>
<p>Absolute value is piecewise: \(|x| = x\) if \(x \ge 0\) and \(|x| = -x\) if \(x \lt 0\).</p>`,
    variants: {
      evaluate: {
        name: 'Evaluate',
        gen(rng) {
          const pw = makePiecewise(rng, rng.chance(0.5) ? 2 : 3);
          const pts = rng.shuffle([pw.breaks[0], pw.breaks[pw.breaks.length - 1] + rng.int(1, 3), pw.breaks[0] - rng.int(1, 3)]);
          const uniq = [...new Set(pts)];
          return {
            prompt: T`Let ${H.piecewiseHTML('f(x)', pw.rows)}`,
            parts: uniq.map((t, k) => ({ label: 'abc'[k], ask: T`\(f(${t})\)`, kind: 'num', answer: MX.num(pw.f(t)), points: 1 })),
            solution: uniq.map((t) => { const i = pw.which(t); return T`\(x = ${t}\) satisfies \(${pw.conds[i].tex}\), so use \(${pw.pcs[i].tex}\): \(f(${t}) = ${numTex(pw.f(t))}\)`; }),
          };
        },
      },
      graph: {
        name: 'Choose the graph',
        gen(rng) {
          // the jump at the breakpoint must be visible, or the open and closed dots could not be told apart
          let pw, b0, yL, yR, tries = 0;
          do {
            pw = makePiecewise(rng, 2); b0 = pw.breaks[0];
            yL = pw.pcs[0].f(b0); yR = pw.pcs[1].f(b0); tries++;
          } while (tries < 60 && (Math.abs(yL - yR) < 1.5 || Math.abs(yL) > 6.5 || Math.abs(yR) > 6.5 || !visibleSpan(pw.pcs[0].f, b0 - 4, b0) || !visibleSpan(pw.pcs[1].f, b0, b0 + 4)));
          const ch = H.choices(rng, plotPw(pw), [plotPw(pw, { flip: true }), plotPw(pw, { swap: true }), plotPw(pw, { swap: true, flip: true })]);
          return {
            prompt: T`Which graph shows ${H.piecewiseHTML('f(x)', pw.rows)}`,
            parts: [{ kind: 'choice', graph: true, options: ch.options, answer: ch.answer, points: 3 }],
            solution: [
              T`Left of \(x = ${pw.breaks[0]}\) the graph follows \(${pw.pcs[0].tex}\); to the right it follows \(${pw.pcs[1].tex}\).`,
              T`At \(x = ${pw.breaks[0]}\): the dot on the ${pw.conds[0].hiIn ? 'left piece is closed (●) and the right piece is open (○)' : 'left piece is open (○) and the right piece is closed (●)'}, because of the ${pw.conds[0].hiIn ? '\\(\\le\\)' : '\\(\\lt\\)'} in the first condition.`,
            ],
          };
        },
      },
      read: {
        name: 'Read values from the graph',
        gen(rng) {
          const pw = makePiecewise(rng, 2);
          const b0 = pw.breaks[0], xs = rng.shuffle([b0, b0 - rng.int(1, 3), b0 + rng.int(1, 3)]);
          if (xs.some((x) => Math.abs(pw.f(x)) > 7.5 || !Number.isInteger(pw.f(x) * 2)) || new Set(xs.map((x) => pw.f(x))).size < 2) return this.gen(rng);
          return {
            prompt: T`The graph of a piecewise function \(f\) is shown. Use it to find each value.`,
            visual: plotPw(pw),
            parts: xs.map((t, k) => ({ label: 'abc'[k], ask: T`\(f(${t})\)`, kind: 'num', answer: MX.num(pw.f(t)), points: 1 })),
            solution: [T`Go to each \(x\)-value and read the height of the graph there. At the boundary \(x = ${b0}\), use the closed dot ●, not the open one.`, ...xs.map((t) => T`\(f(${t}) = ${numTex(pw.f(t))}\)`)],
          };
        },
      },
      abs: {
        name: 'Absolute value as a piecewise function',
        gen(rng) {
          const h = rng.nz(-6, 6), e = lin(1, -h).tex;
          const right = [[e, T`x \ge ${h}`], [T`-\left(${e}\right)`, T`x \lt ${h}`]];
          const w1 = [[e, T`x \ge ${-h}`], [T`-\left(${e}\right)`, T`x \lt ${-h}`]];
          const w2 = [[T`-\left(${e}\right)`, T`x \ge ${h}`], [e, T`x \lt ${h}`]];
          const w3 = [[e, T`x \ge 0`], [T`-\left(${e}\right)`, T`x \lt 0`]];
          const ch = H.choices(rng, H.piecewiseHTML('f(x)', right), [w1, w2, w3].map((r) => H.piecewiseHTML('f(x)', r)));
          return {
            prompt: T`Which piecewise definition is equal to \(f(x) = ${A(e)}\)?`,
            parts: [{ kind: 'choice', options: ch.options, answer: ch.answer, points: 2 }],
            solution: [T`\(${A(e)} = ${e}\) when the inside is \(\ge 0\), that is \(x \ge ${h}\).`, T`When the inside is negative (\(x \lt ${h}\)), the absolute value flips its sign: \(-\left(${e}\right)\).`],
          };
        },
      },
      apply: {
        name: 'Piecewise pricing',
        gen(rng) {
          const base = rng.int(4, 9), cut = rng.int(2, 5), extra = rng.pick([1.25, 1.5, 2, 2.5, 3]);
          const C = (w) => (w <= cut ? base : base + extra * (w - cut));
          const w1 = rng.int(1, cut), w2 = cut + rng.int(2, 6);
          const rows = [[String(base), T`0 \lt w \le ${cut}`], [T`${base} + ${extra}\left(w - ${cut}\right)`, T`w \gt ${cut}`]];
          const vis = H.fnPlot({ win: { xmin: 0, xmax: cut + 8, ymin: 0, ymax: Math.ceil(C(cut + 8) / 5) * 5 + 5 }, w: 240, h: 170, step: 1, labelEvery: 2, ystep: 5, ylabelEvery: 10, pieces: [{ f: () => base, from: 0, to: cut, openFrom: true }, { f: C, from: cut, to: cut + 8, openFrom: true, dotTo: false }], label: 'shipping cost graph' });
          return {
            prompt: T`A shop charges shipping by weight \(w\) (in pounds): ${H.piecewiseHTML('C(w)', rows)} in dollars.`,
            visual: vis,
            parts: [
              { label: 'a', ask: T`Cost to ship a ${w1}-pound package, \(C(${w1})\)`, kind: 'num', pre: '$', answer: MX.money(C(w1)), tol: 0.005, show: '\\$' + MX.money(C(w1)), points: 1 },
              { label: 'b', ask: T`Cost to ship a ${w2}-pound package, \(C(${w2})\)`, kind: 'num', pre: '$', answer: MX.money(C(w2)), tol: 0.005, show: '\\$' + MX.money(C(w2)), points: 2 },
            ],
            solution: [T`\(${w1} \le ${cut}\), so the flat rate applies: \(C(${w1}) = ${base}\).`, T`\(${w2} \gt ${cut}\): \(C(${w2}) = ${base} + ${extra}\left(${w2} - ${cut}\right) = ${base} + ${MX.num(extra * (w2 - cut))} = ${MX.money(C(w2))}\)`],
          };
        },
      },
    },
  });

  // ================= transformations of functions =================
  const PARENT = {
    sq: { name: 'x^{2}', f: (x) => x * x, tex: (u) => (u === 'x' ? 'x^{2}' : T`\left(${u}\right)^{2}`), asc: (u) => (u === 'x' ? 'x^2' : '(' + u + ')^2'), plain: 'x^{2}', typeable: true },
    cube: { name: 'x^{3}', f: (x) => x * x * x, tex: (u) => (u === 'x' ? 'x^{3}' : T`\left(${u}\right)^{3}`), asc: (u) => (u === 'x' ? 'x^3' : '(' + u + ')^3'), plain: 'x^{3}', typeable: true },
    sqrt: { name: '\\sqrt{x}', f: (x) => (x >= 0 ? Math.sqrt(x) : NaN), tex: (u) => T`\sqrt{${u}}`, asc: (u) => '√(' + u + ')', plain: '\\sqrt{x}', typeable: true },
    abs: { name: '|x|', f: (x) => Math.abs(x), tex: (u) => A(u), asc: (u) => '|' + u + '|', plain: '\\left|x\\right|', typeable: true },
    recip: { name: '\\frac{1}{x}', f: (x) => (Math.abs(x) < 1e-9 ? NaN : 1 / x), tex: (u) => T`\frac{1}{${u}}`, asc: (u) => '1/(' + u + ')', plain: '\\frac{1}{x}', typeable: true },
    cbrt: { name: '\\sqrt[3]{x}', f: (x) => Math.cbrt(x), tex: (u) => T`\sqrt[3]{${u}}`, asc: null, plain: '\\sqrt[3]{x}', typeable: false },
  };
  const inner = (h) => (h ? lin(1, -h) : { tex: 'x', asc: 'x' });
  const aTex = (a) => (a === 1 ? '' : a === -1 ? '-' : a === 0.5 ? '\\frac{1}{2}' : a === -0.5 ? '-\\frac{1}{2}' : String(a));
  const aAsc = (a) => (a === 1 ? '' : a === -1 ? '-' : a === 0.5 ? '(1/2)' : a === -0.5 ? '-(1/2)' : String(a));
  const gTex = (P, a, h, k) => aTex(a) + P.tex(inner(h).tex) + (k ? ' ' + MX.sgnTerm(k) : '');
  const gAsc = (P, a, h, k) => aAsc(a) + P.asc(inner(h).asc) + (k ? (k > 0 ? '+' : '-') + Math.abs(k) : '');
  const gFn = (P, a, h, k) => (x) => a * P.f(x - h) + k;
  function describe(a, h, k) {
    const steps = [];
    if (h) steps.push(`shift ${h > 0 ? 'right' : 'left'} ${Math.abs(h)} unit${Math.abs(h) === 1 ? '' : 's'}`);
    if (Math.abs(a) !== 1) steps.push(Math.abs(a) > 1 ? `stretch vertically by a factor of ${Math.abs(a)}` : 'compress vertically by a factor of 1/2');
    if (a < 0) steps.push('reflect across the x-axis');
    if (k) steps.push(`shift ${k > 0 ? 'up' : 'down'} ${Math.abs(k)} unit${Math.abs(k) === 1 ? '' : 's'}`);
    const s = steps.join(', ');
    return s[0].toUpperCase() + s.slice(1) + '.';
  }
  function pickTransform(rng, o = {}) {
    const keys = Object.keys(PARENT).filter((k) => !o.typeable || PARENT[k].typeable);
    const key = rng.pick(keys), P = PARENT[key];
    let a, h, k;
    do { a = rng.pick(o.simpleA || key === 'recip' ? [1, 1, -1] : [1, 1, -1, 2, -2, 0.5]); h = rng.int(-5, 5); k = rng.int(-5, 5); } while ((o.needHK && (!h || !k)) || (!h && !k && a === 1));
    return { key, P, a, h, k };
  }
  const tPlot = (P, a, h, k, o = {}) => H.fnPlot({ r: 8, pieces: [{ f: gFn(P, a, h, k) }], label: 'graph of a transformed function', ...o });
  MX.register({
    id: 'fn-transform', section: FSEC, title: 'Transformations of functions', kind: 'skill', sources: [ADDED],
    slots: [{ label: 'Transformations', source: ADDED, pool: ['describe', 'equation', 'graph', 'point', 'hscale', 'parent', 'fromGraph'] }],
    lesson: T`<p>Start from a basic graph, \(y = f(x)\): \(x^{2}\), \(x^{3}\), \(\sqrt{x}\), \(\sqrt[3]{x}\), \(|x|\) or \(\frac{1}{x}\). Then</p>
\[g(x) = a\,f(x - h) + k\]
<ul><li>\(h\): <strong>horizontal shift</strong>. \(f(x - 3)\) moves the graph <em>right</em> 3; \(f(x + 3)\) moves it <em>left</em> 3 (the opposite of the sign you see).</li>
<li>\(k\): <strong>vertical shift</strong>. \(+k\) moves it up, \(-k\) down.</li>
<li>\(a\): if \(a \lt 0\) the graph is <strong>reflected across the \(x\)-axis</strong>; if \(|a| \gt 1\) it is <strong>stretched</strong> vertically, and if \(0 \lt |a| \lt 1\) it is <strong>compressed</strong>.</li>
<li>\(f(-x)\) reflects across the \(y\)-axis.</li>
<li>\(f(bx)\) changes the graph <strong>horizontally</strong>: if \(b \gt 1\) it is compressed by a factor of \(\frac{1}{b}\), and if \(0 \lt b \lt 1\) it is stretched. Every \(x\)-value is divided by \(b\).</li></ul>
<p>Every point moves the same way: if \((p, q)\) is on \(f\), then \((p + h,\ aq + k)\) is on \(g\). With \(f(bx)\), \((p, q)\) moves to \(\left(\frac{p}{b}, q\right)\).</p>
<p class="warn">Order matters when you combine them: stretch or reflect first, then shift.</p>`,
    variants: {
      describe: {
        name: 'Describe the transformation',
        gen(rng) {
          const { P, a, h, k } = pickTransform(rng, { needHK: true });
          const ch = H.choices(rng, describe(a, h, k), [describe(a, -h, k), describe(a, h, -k), describe(-a, -h, k)]);
          return {
            prompt: T`How is the graph of \(g(x) = ${gTex(P, a, h, k)}\) obtained from the graph of \(f(x) = ${P.plain}\)?`,
            parts: [{ kind: 'choice', options: ch.options, answer: ch.answer, points: 2 }],
            solution: [T`Match \(g(x) = a\,f(x - h) + k\): \(a = ${MX.num(a)}\), \(h = ${h}\), \(k = ${k}\).`, T`${h > 0 ? T`\(x - ${h}\) moves it right ${h}` : T`\(x + ${-h}\) moves it left ${-h}`}; ${k > 0 ? 'up' : 'down'} ${Math.abs(k)}${a < 0 ? '; the negative reflects it across the x-axis' : ''}${Math.abs(a) !== 1 ? (Math.abs(a) > 1 ? '; ' + Math.abs(a) + ' stretches it' : '; 1/2 compresses it') : ''}.`, describe(a, h, k)],
          };
        },
      },
      equation: {
        name: 'Write the equation',
        gen(rng) {
          const { P, a, h, k } = pickTransform(rng, { typeable: true });
          const words = describe(a, h, k).replace(/\.$/, '').toLowerCase();
          return {
            prompt: T`Start with \(f(x) = ${P.plain}\), then ${words}. Write the equation of the new function \(g\).`,
            parts: [{ kind: 'expr', pre: 'g(x) =', vars: ['x'], answer: gAsc(P, a, h, k), show: 'g(x) = ' + gTex(P, a, h, k), points: 3 }],
            solution: [T`Use \(g(x) = a\,f(x - h) + k\) with ${h ? (h > 0 ? T`\(h = ${h}\) (right)` : T`\(h = ${h}\) (left)`) : 'no horizontal shift'}, \(a = ${MX.num(a)}\) and \(k = ${k}\).`, T`\(${H.box('g(x) = ' + gTex(P, a, h, k))}\)`],
          };
        },
      },
      graph: {
        name: 'Choose the graph',
        gen(rng) {
          const { P, a, h, k } = pickTransform(rng, { simpleA: true, needHK: true });
          const ch = H.choices(rng, tPlot(P, a, h, k), [tPlot(P, a, -h, k), tPlot(P, a, h, -k), tPlot(P, -a, h, k)]);
          return {
            prompt: T`Which graph shows \(g(x) = ${gTex(P, a, h, k)}\)?`,
            parts: [{ kind: 'choice', graph: true, options: ch.options, answer: ch.answer, points: 3 }],
            solution: [T`Start from the graph of \(${P.plain}\).`, describe(a, h, k), T`Check one point: \(g(${h + 1}) = ${MX.num(a * P.f(1) + k)}\), so the graph passes through \((${h + 1}, ${MX.num(a * P.f(1) + k)})\).`],
          };
        },
      },
      point: {
        name: 'Move a point',
        gen(rng) {
          const p = rng.int(-4, 4), q = rng.int(-5, 5);
          const yflip = rng.chance(0.25);
          const a = yflip ? 1 : rng.pick([1, -1, 2, 3, -2]), h = yflip ? 0 : rng.nz(-5, 5), k = yflip ? rng.int(-5, 5) : rng.nz(-5, 5);
          const gT = yflip ? T`f(-x) ${k ? MX.sgnTerm(k) : ''}` : T`${aTex(a)}f\left(${inner(h).tex}\right) ${k ? MX.sgnTerm(k) : ''}`;
          const np = yflip ? [-p, q + k] : [p + h, a * q + k];
          const ans = H.pt(np[0], np[1]);
          return {
            prompt: T`The point \((${p}, ${q})\) is on the graph of \(y = f(x)\). Which point must be on the graph of \(y = ${gT}\)?`,
            parts: [{ kind: 'point', answer: ans.asc, show: ans.tex, points: 2 }],
            solution: yflip
              ? [T`\(f(-x)\) reflects across the \(y\)-axis: \(x\) changes sign. Then ${k ? T`add ${k} to \(y\)` : 'nothing else'}.`, T`\((${p}, ${q}) \to ${H.box(ans.tex)}\)`]
              : [T`\(x\): the input \(x ${MX.sgnTerm(-h)}\) equals ${p} when \(x = ${p + h}\) (shift ${h >= 0 ? 'right' : 'left'} ${Math.abs(h)}).`, T`\(y\): multiply by ${a}, then add ${k}: \(${a}\cdot${MX.par(q)} ${MX.sgnTerm(k)} = ${a * q + k}\).`, T`\(${H.box(ans.tex)}\)`],
          };
        },
      },
      hscale: {
        name: 'Horizontal stretch or compression',
        gen(rng) {
          const b = rng.pick([2, 3, 0.5]);
          const q = rng.int(-5, 5);
          const p = b === 0.5 ? rng.nz(-4, 4) : b * rng.nz(-3, 3);
          const k = rng.chance(0.5) ? 0 : rng.nz(-4, 4);
          const bTex = b === 0.5 ? '\\frac{1}{2}' : String(b);
          const nx = p / b;
          const ans = H.pt(nx, q + k);
          const gT = T`f\left(${bTex}x\right)${k ? ' ' + MX.sgnTerm(k) : ''}`;
          const right = b > 1 ? `Compress horizontally by a factor of 1/${b}` : 'Stretch horizontally by a factor of 2';
          const wrong = b > 1
            ? [`Stretch horizontally by a factor of ${b}`, `Stretch vertically by a factor of ${b}`, `Compress vertically by a factor of 1/${b}`]
            : ['Compress horizontally by a factor of 1/2', 'Compress vertically by a factor of 1/2', 'Stretch vertically by a factor of 2'];
          const ch = H.choices(rng, right, wrong);
          return {
            prompt: T`The point \((${p}, ${q})\) is on the graph of \(y = f(x)\). Let \(g(x) = ${gT}\).`,
            parts: [
              { label: 'a', ask: T`What does the \(${bTex}x\) inside \(f\) do to the graph?`, kind: 'choice', options: ch.options, answer: ch.answer, points: 1 },
              { label: 'b', ask: T`Which point must be on the graph of \(g\)?`, kind: 'point', answer: ans.asc, show: ans.tex, points: 2 },
            ],
            solution: [
              T`The input \(${bTex}x\) must equal ${p}, so \(x = ${MX.par(p)} \div ${bTex} = ${MX.num(nx)}\). Every \(x\)-value is divided by \(${bTex}\): ${right.toLowerCase()}.`,
              k ? T`The \(y\)-value gets ${k} added: \(${q} ${MX.sgnTerm(k)} = ${q + k}\).` : T`The \(y\)-value does not change.`,
              T`\(${H.box(ans.tex)}\)`,
            ],
          };
        },
      },
      parent: {
        name: 'Recognize a basic graph',
        gen(rng) {
          const keys = Object.keys(PARENT), key = rng.pick(keys), P = PARENT[key];
          const others = rng.sample(keys.filter((k) => k !== key), 3);
          const ch = H.choices(rng, T`\(f(x) = ${P.plain}\)`, others.map((k) => T`\(f(x) = ${PARENT[k].plain}\)`));
          return {
            prompt: T`Which basic function is graphed below?`,
            visual: tPlot(P, 1, 0, 0, { r: 5, labelEvery: 1 }),
            parts: [{ kind: 'choice', options: ch.options, answer: ch.answer, inline: true, points: 1 }],
            solution: [
              { sq: 'A U-shaped parabola with its lowest point at the origin: \\(x^{2}\\).', cube: 'Rises left to right, flattening at the origin and turning the other way: \\(x^{3}\\).', sqrt: 'Starts at the origin and rises slowly to the right only: \\(\\sqrt{x}\\).', abs: 'A V with its point at the origin: \\(|x|\\).', recip: 'Two separate branches that never touch the axes: \\(\\frac{1}{x}\\).', cbrt: 'An S-shape through the origin that keeps rising slowly in both directions: \\(\\sqrt[3]{x}\\).' }[key],
            ],
          };
        },
      },
      fromGraph: {
        name: 'Equation from a graph',
        gen(rng) {
          const key = rng.pick(['abs', 'sq', 'abs', 'sqrt']), P = PARENT[key];
          let a, h, k;
          do { a = rng.pick([1, -1]); h = rng.int(-4, 4); k = rng.int(-4, 4); } while (a === 1 && !h && !k);
          return {
            prompt: T`The graph is a transformation of \(f(x) = ${P.plain}\) (no stretch). Write its equation.`,
            visual: H.fnPlot({ r: 8, pieces: [{ f: gFn(P, a, h, k) }], dots: [[h, k, true]] }),
            parts: [{ kind: 'expr', pre: 'g(x) =', vars: ['x'], answer: gAsc(P, a, h, k), show: 'g(x) = ' + gTex(P, a, h, k), points: 3 }],
            solution: [T`The ${key === 'abs' ? 'point of the V' : key === 'sq' ? 'vertex' : 'starting point'} moved from \((0, 0)\) to \((${h}, ${k})\): \(h = ${h}\), \(k = ${k}\).`, T`It opens ${a > 0 ? (key === 'sqrt' ? 'upward' : 'up') : (key === 'sqrt' ? 'downward' : 'down')}, so \(a = ${a}\).`, T`\(${H.box('g(x) = ' + gTex(P, a, h, k))}\)`],
          };
        },
      },
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);

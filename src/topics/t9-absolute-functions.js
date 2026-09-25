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
  const V = MX.V;
  const qv = (q) => (q instanceof Q ? q : new Q(q));
  // a solution set part: vals are Q or numbers
  function setPart(vals, points, v = 'x') {
    const u = [];
    vals.map(qv).forEach((q) => { if (!u.some((w) => w.eq(q))) u.push(q); });
    u.sort((a, b) => a.val() - b.val());
    if (!u.length) return { kind: 'set', answers: [], answer: 'no solution', show: '\\text{no solution}', points };
    return { kind: 'set', answers: u.map((q) => q.str()), answer: '{' + u.map((q) => q.str()).join(', ') + '}', show: u.map((q) => v + ' = ' + q.tex()).join('\\ \\text{ or }\\ '), points };
  }
  // Every real solution of an equation in x on [-200, 200]. V.roots finds sign changes; |f| can also touch 0
  // at a corner (|3x + 2| = 0 at x = -2/3) between two samples without a sign change, which V.roots misses,
  // so local minima of |lhs - rhs| are refined here too and kept when they reach 0.
  function allRoots(eq) {
    const r = V.rel(eq)[0], d = (x) => MX.evalAST(r.lhs, { x }) - MX.evalAST(r.rhs, { x }), g = (x) => Math.abs(d(x));
    const n = 4000, lo = -200, hi = 200, X = (k) => lo + ((hi - lo) * k) / n, gr = (Math.sqrt(5) - 1) / 2;
    const ds = []; for (let k = 0; k <= n; k++) ds.push(d(X(k)));
    if (ds.every((v) => v === 0)) return 'all';
    const out = [];
    const add = (x) => {
      for (let q = 1; q <= 1000; q++) { const s = Math.round(x * q) / q; if (Math.abs(s - x) < 1e-6 && g(s) === 0) { x = s; break; } }
      if (g(x) <= 1e-9 && !out.some((y) => V.close(x, y))) out.push(x);
    };
    for (let k = 0; k <= n; k++) {
      if (ds[k] === 0) { add(X(k)); continue; }
      if (k < n && ds[k] * ds[k + 1] < 0) { // sign change: bisect
        let p = X(k), q = X(k + 1);
        for (let i = 0; i < 80; i++) { const m = (p + q) / 2; if ((d(m) < 0) === (ds[k] < 0)) p = m; else q = m; }
        add((p + q) / 2);
      }
      if (k > 0 && k < n && Math.abs(ds[k]) <= Math.abs(ds[k - 1]) && Math.abs(ds[k]) <= Math.abs(ds[k + 1])) { // dip: golden section
        let p = X(k - 1), q = X(k + 1);
        for (let i = 0; i < 90; i++) { const m1 = q - gr * (q - p), m2 = p + gr * (q - p); if (g(m1) < g(m2)) q = m2; else p = m1; }
        add((p + q) / 2);
      }
    }
    return out.sort((a, b) => a - b);
  }
  const solvesAll = (eq) => { let rs0 = null; return V.custom((a) => {
    const rs = rs0 || (rs0 = allRoots(eq));
    if (rs === 'all') return 'the equation is an identity';
    return V.sameSet(a, rs) || 'the solutions are ' + (rs.length ? rs.map((x) => MX.num(x, 6)).join(', ') : 'none');
  }); };
  const SET_HINT = 'List every solution, separated by commas. If there is none, use the “no solution” button.';

  // ================= absolute value expressions =================
  function absTerm(rng) {
    const kind = rng.pick(['negabs', 'diff', 'coef', 'plain']);
    if (kind === 'negabs') { const a = rng.int(2, 12); return { tex: T`-${A('-' + a)}`, asc: `-|-${a}|`, val: -a, step: T`\(${A('-' + a)} = ${a}\), so \(-${A('-' + a)} = -${a}\)` }; }
    if (kind === 'diff') { let b, c; do { b = rng.int(-9, 12); c = rng.int(-9, 12); } while (b === c); return { tex: A(b + ' - ' + MX.par(c)), asc: `|${b}-(${c})|`, val: Math.abs(b - c), step: T`\(${A(b + ' - ' + MX.par(c))} = ${A(b - c)} = ${Math.abs(b - c)}\)` }; }
    if (kind === 'coef') { const k = rng.int(2, 5), d = -rng.int(2, 9); return { tex: T`${k}${A(d)}`, asc: `${k}|${d}|`, val: k * -d, step: T`\(${k}${A(d)} = ${k}\cdot${-d} = ${k * -d}\)` }; }
    const e = rng.nz(-15, 15); return { tex: A(e), asc: `|${e}|`, val: Math.abs(e), step: T`\(${A(e)} = ${Math.abs(e)}\)` };
  }
  const CMP = [
    { tex: (n) => A('-' + n), asc: (n) => `|-${n}|`, val: (n) => n },
    { tex: (n) => T`-${A(n)}`, asc: (n) => `-|${n}|`, val: (n) => -n },
    { tex: (n) => T`-${A('-' + n)}`, asc: (n) => `-|-${n}|`, val: (n) => -n },
    { tex: (n) => T`-\left(-${n}\right)`, asc: (n) => `-(-${n})`, val: (n) => n },
    { tex: (n) => A(n), asc: (n) => `|${n}|`, val: (n) => n },
  ];
  MX.register({
    id: 'abs-value', section: SEC, title: 'Absolute value expressions', kind: 'skill', sources: [ADDED],
    slots: [{ label: 'Absolute value', source: ADDED, pool: ['simplify', 'order', 'compare', 'evaluate', 'distance'] }],
    lesson: T`<p>Absolute value measures how far a number is from 0, without caring about direction. A temperature of \(-7\) degrees and one of \(7\) degrees are both 7 degrees away from zero.</p>
<div class="box def"><h4>Definition <b>Absolute value</b></h4><p>The <strong>absolute value</strong> of a number \(a\), written \(\left|a\right|\), is its distance from 0 on the number line. A distance is never negative, so \(\left|a\right| \ge 0\). For example, \(\left|6\right| = 6\), \(\left|-6\right| = 6\) and \(\left|0\right| = 0\).</p></div>
<h3>The bars group like parentheses</h3>
<p>Work out everything inside the bars first, then take the absolute value. After that, follow the usual order of operations: multiply before you add or subtract.</p>
<div class="ex"><h4>Example</h4><p>Simplify \(12 - 3\left|2 - 6\right|\).</p><table class="st">
<tr><td>Simplify inside the bars.</td><td>\(2 - 6 = -4\)</td></tr>
<tr><td>Take the absolute value.</td><td>\(\left|-4\right| = 4\)</td></tr>
<tr><td>Multiply before subtracting.</td><td>\(3 \cdot 4 = 12\)</td></tr>
<tr><td>Subtract.</td><td>\(12 - 12 = 0\)</td></tr></table></div>
<p>To <strong>evaluate</strong> an expression, replace each variable with its value in parentheses, then simplify the same way. For \(x = -2\) and \(y = 1\): \(\ \left|3x + y\right| = \left|3(-2) + 1\right| = \left|-5\right| = 5\).</p>
<p>To <strong>compare</strong> two expressions, find the value of each one first. For example, \(-\left|-5\right| = -5\) and \(\left|-5\right| = 5\), so \(-\left|-5\right| \lt \left|-5\right|\).</p>
<div class="box warn"><h4>Watch out</h4><p>A minus sign <em>outside</em> the bars stays: \(-\left|-9\right| = -9\), while \(-(-9) = 9\). And you cannot split the bars across a subtraction: \(\left|2 - 9\right| = 7\), but \(\left|2\right| - \left|9\right| = -7\).</p></div>
<h3>Distance between two numbers</h3>
<div class="box rule"><h4>Rule <b>Distance on the number line</b></h4><p>The distance between \(a\) and \(b\) is \(\left|a - b\right|\). The order does not matter, because \(\left|a - b\right| = \left|b - a\right|\). For example, the distance between \(-8\) and \(3\) is \(\left|-8 - 3\right| = \left|-11\right| = 11\).</p></div>`,
    variants: {
      simplify: {
        name: 'Simplify',
        gen(rng) {
          const n = rng.int(2, 3), terms = Array.from({ length: n }, () => absTerm(rng)), ops = terms.map((t, k) => (k ? rng.pick(['+', '-']) : ''));
          let v = 0, tex = '', asc = '';
          terms.forEach((t, k) => { const s = ops[k] === '-' ? -1 : 1; v += s * t.val; tex += (k ? ' ' + ops[k] + ' ' : '') + t.tex; asc += (k ? ops[k] + '(' + t.asc + ')' : t.asc); });
          const valsTex = terms.map((t, k) => (k ? ' ' + ops[k] + ' ' + MX.par(t.val) : String(t.val))).join('');
          return {
            prompt: T`Simplify: \(${tex}\)`,
            parts: [{ kind: 'num', answer: String(v), points: 2, verify: V.value(asc) }],
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
            parts: [{ kind: 'num', answer: String(v), points: 2, verify: V.value(`${a}-${b}|${c}-(${d})|`) }],
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
              { label: 'a', ask: T`Value of \(${L.tex(n)}\)`, kind: 'num', answer: String(lv), points: 1, verify: V.value(L.asc(n)) },
              { label: 'b', ask: T`Value of \(${R.tex(n)}\)`, kind: 'num', answer: String(rvv), points: 1, verify: V.value(R.asc(n)) },
              { label: 'c', ask: 'Which sign goes in the box?', kind: 'choice', options: ['&lt;', '=', '&gt;'], inline: true, answer: rel, points: 1,
                verify: V.choice((i) => { const l = V.num(L.asc(n)), r = V.num(R.asc(n)); return [l < r, l === r, l > r][i]; }) },
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
            { tex: A('x - y'), asc: '|x-y|', val: Math.abs(x - y), sub: A(x + ' - ' + MX.par(y)) },
            { tex: T`${A('x')} - ${A('y')}`, asc: '|x|-|y|', val: Math.abs(x) - Math.abs(y), sub: T`${A(x)} - ${A(y)}` },
            { tex: A('2x + y'), asc: '|2x+y|', val: Math.abs(2 * x + y), sub: A('2' + MX.par(x) + ' + ' + MX.par(y)) },
            { tex: T`-${A('x')} + 3${A('y')}`, asc: '-|x|+3|y|', val: -Math.abs(x) + 3 * Math.abs(y), sub: T`-${A(x)} + 3${A(y)}` },
            { tex: T`${A('x y')}`, asc: '|x y|', val: Math.abs(x * y), sub: A(MX.par(x) + '\\cdot' + MX.par(y)) },
          ];
          const F = rng.pick(forms);
          return {
            prompt: T`Evaluate \(${F.tex}\) when \(x = ${x}\) and \(y = ${y}\).`,
            parts: [{ kind: 'num', answer: String(F.val), points: 2, verify: V.value(() => V.fn(F.asc)({ x, y })) }],
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
            // distance on the line: count unit steps from the left point to the right one
            parts: [{ kind: 'num', answer: String(d), points: 2, verify: V.value(() => { let n = 0; for (let t = Math.min(a, b); t < Math.max(a, b); t++) n++; return n; }) }],
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
    lesson: T`<p>An absolute value equation asks which numbers are a certain distance from 0. You can be 4 units from 0 on either side, so \(\left|x\right| = 4\) has two solutions: \(x = 4\) and \(x = -4\).</p>
<div class="box rule"><h4>Rule <b>Absolute value equations</b></h4><p>For any expression \(X\) and any number \(a\):</p><ul>
<li>If \(a \gt 0\), then \(\left|X\right| = a\) means \(X = a\) or \(X = -a\). (Two cases.)</li>
<li>If \(a = 0\), then \(\left|X\right| = 0\) means \(X = 0\). (One case.)</li>
<li>If \(a \lt 0\), then \(\left|X\right| = a\) has <strong>no solution</strong>, because an absolute value is never negative.</li></ul></div>
<div class="box how"><h4>How to <b>solve an absolute value equation</b></h4><ol>
<li>Isolate the absolute value: get \(\left|X\right|\) alone on one side.</li>
<li>Look at the number on the other side. If it is negative, stop: no solution. If it is 0, solve \(X = 0\).</li>
<li>If it is positive, write two equations: \(X = a\) and \(X = -a\).</li>
<li>Solve each one, and check your answers in the original equation.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Solve \(2\left|x - 3\right| + 1 = 9\).</p><table class="st">
<tr><td>Subtract 1 from both sides.</td><td>\(2\left|x - 3\right| = 8\)</td></tr>
<tr><td>Divide both sides by 2.</td><td>\(\left|x - 3\right| = 4\)</td></tr>
<tr><td>4 is positive, so write two equations.</td><td>\(x - 3 = 4 \quad\text{or}\quad x - 3 = -4\)</td></tr>
<tr><td>Solve each one.</td><td>\(x = 7 \quad\text{or}\quad x = -1\)</td></tr>
<tr><td>Check both in the original equation.</td><td>\(2\left|4\right| + 1 = 9\) ✓ \(\quad 2\left|-4\right| + 1 = 9\) ✓</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>Isolate first, then split. Splitting \(2\left|x - 3\right| + 1 = 9\) into \(2(x - 3) + 1 = 9\) or \(2(x - 3) + 1 = -9\) gives \(x = -2\), which is wrong. And if isolating gives something like \(\left|x + 5\right| = -2\), the answer is "no solution."</p></div>
<h3>Two absolute values</h3>
<p>If \(\left|X\right| = \left|Y\right|\), the two insides are the same distance from 0. So they are either equal or opposites: \(X = Y\) or \(X = -Y\).</p>
<div class="ex"><h4>Example</h4><p>Solve \(\left|x + 1\right| = \left|2x - 4\right|\).</p><table class="st">
<tr><td>Case 1: the insides are equal.</td><td>\(x + 1 = 2x - 4,\quad x = 5\)</td></tr>
<tr><td>Case 2: they are opposites. Put the second side in parentheses.</td><td>\(x + 1 = -\left(2x - 4\right) = -2x + 4\)</td></tr>
<tr><td>Solve case 2.</td><td>\(3x = 3,\quad x = 1\)</td></tr>
<tr><td>Check: \(\left|6\right| = \left|6\right|\) and \(\left|2\right| = \left|-2\right|\).</td><td>\(x = 5 \quad\text{or}\quad x = 1\)</td></tr></table></div>
<p>Type your answer as a list separated by commas, like <code>-1, 7</code>. If there is no solution, use the "no solution" button.</p>`,
    variants: {
      basic: {
        name: 'Two solutions',
        gen(rng) {
          const q = absEq(rng);
          return {
            prompt: T`Solve: \(${A(q.e.tex)} = ${q.c}\)`,
            parts: [Object.assign(setPart([q.s1, q.s2], 3), { ask: SET_HINT, verify: solvesAll(`|${q.e.asc}|=${q.c}`) })],
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
            parts: [Object.assign(setPart([q.s1, q.s2], 3), { ask: SET_HINT, verify: solvesAll(`${k}|${q.e.asc}|+(${m})=${n}`) })],
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
            parts: [Object.assign(setPart([s1, s2], 3), { ask: SET_HINT, verify: solvesAll(`|${L.asc}|=|${R.asc}|`) })],
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
            parts: [Object.assign(setPart([new Q(-q.b, q.a)], 3), { ask: SET_HINT, verify: solvesAll(`|${q.e.asc}|+(${m})=${m}`) })],
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
            parts: [Object.assign(setPart([], 3), { ask: SET_HINT, verify: solvesAll(`${k}|${q.e.asc}|+${m}=${n}`) })],
            solution: [T`Subtract ${m}: \(${k === 1 ? '' : k}${A(q.e.tex)} = ${n - m}\)${k === 1 ? '' : T`, so \(${A(q.e.tex)} = ${new Q(n - m, k).tex()}\)`}.`, T`An absolute value is never negative, so nothing works.`, T`\(${H.box('\\text{no solution}')}\)`],
          };
        },
      },
    },
  });

  // ================= piecewise functions =================
  const PIECE = {
    lin: (rng) => { const m = rng.pick([-2, -1, 1, 2, 0.5, -0.5]), b = rng.int(-4, 4); const L = MX.lin(new Q(m * 2, 2), b); return { f: (x) => m * x + b, tex: L.tex, asc: L.asc }; },
    con: (rng) => { const k = rng.int(-5, 6); return { f: () => k, tex: String(k), asc: String(k) }; },
    sq: (rng) => { const k = rng.int(-4, 2); return { f: (x) => x * x + k, tex: T`x^{2} ${k ? MX.sgnTerm(k) : ''}`, asc: `x^2+(${k})` }; },
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
      let tex, asc;
      if (lo == null) { tex = T`x ${hiIn ? '\\le' : '\\lt'} ${hi}`; asc = `x ${hiIn ? '<=' : '<'} ${hi}`; }
      else if (hi == null) { tex = T`x ${loIn ? '\\ge' : '\\gt'} ${lo}`; asc = `x ${loIn ? '>=' : '>'} ${lo}`; }
      else { tex = T`${lo} ${loIn ? '\\le' : '\\lt'} x ${hiIn ? '\\le' : '\\lt'} ${hi}`; asc = `${lo} ${loIn ? '<=' : '<'} x ${hiIn ? '<=' : '<'} ${hi}`; }
      return { lo, hi, loIn, hiIn, tex, asc };
    });
    const f = (x) => { for (let i = 0; i < pcs.length; i++) { const c = conds[i]; if ((c.lo == null || x > c.lo || (x === c.lo && c.loIn)) && (c.hi == null || x < c.hi || (x === c.hi && c.hiIn))) return pcs[i].f(x); } return NaN; };
    const which = (x) => conds.findIndex((c) => (c.lo == null || x > c.lo || (x === c.lo && c.loIn)) && (c.hi == null || x < c.hi || (x === c.hi && c.hiIn)));
    return { pcs, conds, breaks, f, which, rows: pcs.map((p, i) => [p.tex, conds[i].tex]), rowsAsc: pcs.map((p, i) => [p.asc, conds[i].asc]) };
  }
  // value of a piecewise definition written as rows [[formula, condition], …] (parser syntax) at x = t:
  // exactly one condition must hold, and its formula is evaluated. NaN when none or several hold.
  const memo = (fn) => { const m = new Map(); return (s, v) => { const key = s + '|' + v; if (!m.has(key)) m.set(key, fn(s, v)); return m.get(key); }; };
  const truthOf = memo((s) => V.truth(s)), fnOf = memo((s, v) => V.fn(s, v));
  function pwEval(rows, t, v = 'x') {
    const hit = rows.filter(([, c]) => truthOf(c)({ [v]: t }));
    return hit.length === 1 ? fnOf(hit[0][0], v)(t) : NaN;
  }
  // what a plot drawn from fnPlot pieces shows at x = t: the heights of the curves passing through t
  // and of the closed endpoint dots at t (open dots show nothing); NaN unless exactly one height
  function plotAt(pieces, t, win = 8) {
    const ys = [];
    pieces.forEach((pc) => {
      const a = pc.from == null ? -Infinity : pc.from, z = pc.to == null ? Infinity : pc.to;
      if (t > a && t < z) ys.push(pc.f(t));
      if ((t === a && !pc.openFrom) || (t === z && !pc.openTo)) { const y = pc.f(t); if (Math.abs(y) <= win) ys.push(y); }
    });
    return ys.length && ys.every((y) => isFinite(y) && V.close(y, ys[0])) ? ys[0] : NaN;
  }
  // does the plot show exactly the piecewise definition on the window [-8, 8]? (curves between the integers,
  // and the filled dot at each integer)
  function plotShows(pieces, rows) {
    for (let k = 0; k <= 160; k++) {
      const t = -8 + k / 10 + (k % 10 ? 0.0137 : 0);
      if (t > 8) break;
      const want = pwEval(rows, t), got = plotAt(pieces, t);
      if (Math.abs(want) > 7.5 && Number.isInteger(t)) continue; // a dot off the window cannot be shown
      if (!(isFinite(want) && isFinite(got) && V.close(want, got))) return false;
    }
    return true;
  }
  // does the piece stay on the 8 × 8 grid for a stretch of its interval next to the breakpoint?
  const visibleSpan = (f, a, z) => { let n = 0; for (let k = 0; k <= 8; k++) { const y = f(a + ((z - a) * k) / 8); if (isFinite(y) && Math.abs(y) <= 7.5) n++; } return n >= 5; };
  const pwPieces = (pw, o = {}) => pw.pcs.map((p, i) => ({ f: o.swap ? pw.pcs[(i + 1) % pw.pcs.length].f : p.f, from: pw.conds[i].lo == null ? -Infinity : pw.conds[i].lo, to: pw.conds[i].hi == null ? Infinity : pw.conds[i].hi, openFrom: o.flip ? pw.conds[i].loIn : !pw.conds[i].loIn, openTo: o.flip ? pw.conds[i].hiIn : !pw.conds[i].hiIn }));
  const plotPw = (pw, o = {}) => H.fnPlot({ r: 8, pieces: pwPieces(pw, o), label: 'graph of a piecewise function' });
  const numTex = (v) => MX.texNum(Math.round(v * 100) / 100);
  MX.register({
    id: 'fn-piecewise', section: FSEC, title: 'Piecewise functions', kind: 'skill', sources: [ADDED],
    slots: [{ label: 'Piecewise functions', source: ADDED, pool: ['evaluate', 'graph', 'read', 'abs', 'apply'] }],
    lesson: T`<p>Some rules change partway. A shop might charge one flat price for small packages and more for each extra pound after that. A <strong>piecewise function</strong> describes a rule like this: it uses different formulas on different parts of its domain.</p>
<div class="box def"><h4>Definition <b>Piecewise function</b></h4><p>A <strong>piecewise function</strong> is a list of formulas. Each formula comes with a condition that says which \(x\)-values it is for, and every \(x\) in the domain fits exactly one condition.</p></div>
<p>${H.piecewiseHTML('f(x)', [['x + 3', 'x \\lt 1'], ['2 - x', 'x \\ge 1']])}</p>
<h3>Evaluating</h3>
<div class="box how"><h4>How to <b>evaluate a piecewise function</b></h4><ol>
<li>Find the one condition that the input satisfies.</li>
<li>Use only that formula. Ignore the others.</li>
<li>Substitute and simplify.</li></ol></div>
<div class="ex"><h4>Example</h4><p>For the function \(f\) above, find \(f(-3)\), \(f(1)\) and \(f(4)\).</p><table class="st">
<tr><td>\(-3 \lt 1\), so use the first formula.</td><td>\(f(-3) = -3 + 3 = 0\)</td></tr>
<tr><td>\(1 \ge 1\) is true, so use the second formula.</td><td>\(f(1) = 2 - 1 = 1\)</td></tr>
<tr><td>\(4 \ge 1\), so use the second formula.</td><td>\(f(4) = 2 - 4 = -2\)</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>Be careful at a boundary. At \(x = 1\), the condition \(x \lt 1\) is false, so \(f(1)\) comes from \(2 - x\), not from \(x + 3\).</p></div>
<p>Word problems work the same way. First decide which condition the number meets, then use that formula.</p>
<h3>Graphing</h3>
<p>Draw each formula only over its own interval. Where a piece ends, a <strong>closed dot</strong> ● means that point is included (from \(\le\) or \(\ge\)). An <strong>open dot</strong> ○ means it is not (from \(\lt\) or \(\gt\)).</p>
<figure class="vis">${H.fnPlot({ r: 8, pieces: [{ f: (x) => x + 3, from: -Infinity, to: 1, openTo: true }, { f: (x) => 2 - x, from: 1, to: Infinity, openFrom: false }], label: 'graph of the piecewise function f' })}</figure>
<p>In this graph of \(f\), the left piece ends at the open dot \((1, 4)\) and the right piece starts at the closed dot \((1, 1)\). To read a value from a graph, go to the \(x\)-value and read the height there. At a boundary, use the closed dot.</p>
<h3>Absolute value is piecewise</h3>
<p>\(|x| = x\) when \(x \ge 0\), and \(|x| = -x\) when \(x \lt 0\). The split always happens where the inside equals 0. For example:</p>
<p>${H.piecewiseHTML('\\left|x - 2\\right|', [['x - 2', 'x \\ge 2'], ['-\\left(x - 2\\right)', 'x \\lt 2']])}</p>`,
    variants: {
      evaluate: {
        name: 'Evaluate',
        gen(rng) {
          const pw = makePiecewise(rng, rng.chance(0.5) ? 2 : 3);
          const pts = rng.shuffle([pw.breaks[0], pw.breaks[pw.breaks.length - 1] + rng.int(1, 3), pw.breaks[0] - rng.int(1, 3)]);
          const uniq = [...new Set(pts)];
          return {
            prompt: T`Let ${H.piecewiseHTML('f(x)', pw.rows)}`,
            parts: uniq.map((t, k) => ({ label: 'abc'[k], ask: T`\(f(${t})\)`, kind: 'num', answer: MX.num(pw.f(t)), points: 1, verify: V.value(() => pwEval(pw.rowsAsc, t)) })),
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
          const looks = [{}, { flip: true }, { swap: true }, { swap: true, flip: true }];
          const ch = H.choices(rng, plotPw(pw), looks.slice(1).map((o) => plotPw(pw, o)), looks.map((o) => pwPieces(pw, o)));
          return {
            prompt: T`Which graph shows ${H.piecewiseHTML('f(x)', pw.rows)}`,
            parts: [{ kind: 'choice', graph: true, options: ch.options, answer: ch.answer, data: ch.data, points: 3, verify: V.choiceData((pieces) => plotShows(pieces, pw.rowsAsc)) }],
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
          const shown = pwPieces(pw);
          return {
            prompt: T`The graph of a piecewise function \(f\) is shown. Use it to find each value.`,
            visual: H.fnPlot({ r: 8, pieces: shown, label: 'graph of a piecewise function' }),
            parts: xs.map((t, k) => ({ label: 'abc'[k], ask: T`\(f(${t})\)`, kind: 'num', answer: MX.num(pw.f(t)), points: 1, verify: V.value(() => plotAt(shown, t)) })),
            solution: [T`Go to each \(x\)-value and read the height of the graph there. At the boundary \(x = ${b0}\), use the closed dot ●, not the open one.`, ...xs.map((t) => T`\(f(${t}) = ${numTex(pw.f(t))}\)`)],
          };
        },
      },
      abs: {
        name: 'Absolute value as a piecewise function',
        gen(rng) {
          const h = rng.nz(-6, 6), E = lin(1, -h), e = E.tex, ea = E.asc;
          const right = [[e, T`x \ge ${h}`], [T`-\left(${e}\right)`, T`x \lt ${h}`]];
          const w1 = [[e, T`x \ge ${-h}`], [T`-\left(${e}\right)`, T`x \lt ${-h}`]];
          const w2 = [[T`-\left(${e}\right)`, T`x \ge ${h}`], [e, T`x \lt ${h}`]];
          const w3 = [[e, T`x \ge 0`], [T`-\left(${e}\right)`, T`x \lt 0`]];
          // the same four definitions in parser syntax, carried as option data
          const rowsAsc = [[[ea, `x>=${h}`], [`-(${ea})`, `x<${h}`]], [[ea, `x>=${-h}`], [`-(${ea})`, `x<${-h}`]], [[`-(${ea})`, `x>=${h}`], [ea, `x<${h}`]], [[ea, 'x>=0'], [`-(${ea})`, 'x<0']]];
          const ch = H.choices(rng, H.piecewiseHTML('f(x)', right), [w1, w2, w3].map((r) => H.piecewiseHTML('f(x)', r)), rowsAsc);
          const absF = V.fn(`|${ea}|`, 'x');
          const agrees = (rows) => { for (let k = -48; k <= 48; k++) { const t = k / 4; if (!V.close(pwEval(rows, t), absF(t))) return false; } return true; };
          return {
            prompt: T`Which piecewise definition is equal to \(f(x) = ${A(e)}\)?`,
            parts: [{ kind: 'choice', options: ch.options, answer: ch.answer, data: ch.data, points: 2, verify: V.choiceData(agrees) }],
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
          const rowsAsc = [[String(base), `0<w<=${cut}`], [`${base}+${extra}(w-${cut})`, `w>${cut}`]];
          const vis = H.fnPlot({ win: { xmin: 0, xmax: cut + 8, ymin: 0, ymax: Math.ceil(C(cut + 8) / 5) * 5 + 5 }, w: 240, h: 170, step: 1, labelEvery: 2, ystep: 5, ylabelEvery: 10, pieces: [{ f: () => base, from: 0, to: cut, openFrom: true }, { f: C, from: cut, to: cut + 8, openFrom: true, dotTo: false }], label: 'shipping cost graph' });
          return {
            prompt: T`A shop charges shipping by weight \(w\) (in pounds): ${H.piecewiseHTML('C(w)', rows)} in dollars.`,
            visual: vis,
            parts: [
              { label: 'a', ask: T`Cost to ship a ${w1}-pound package, \(C(${w1})\)`, kind: 'num', pre: '$', answer: MX.money(C(w1)), tol: 0.005, show: '\\$' + MX.money(C(w1)), points: 1, verify: V.value(() => pwEval(rowsAsc, w1, 'w')) },
              { label: 'b', ask: T`Cost to ship a ${w2}-pound package, \(C(${w2})\)`, kind: 'num', pre: '$', answer: MX.money(C(w2)), tol: 0.005, show: '\\$' + MX.money(C(w2)), points: 2, verify: V.value(() => pwEval(rowsAsc, w2, 'w')) },
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
  // ----- independent checks for transformations -----
  // the basic functions in parser syntax, keyed by how the prompt writes them
  const BASE = { 'x^{2}': 'x^2', 'x^{3}': 'x^3', '\\sqrt{x}': '√(x)', '\\left|x\\right|': '|x|', '\\frac{1}{x}': '1/(x)', '\\sqrt[3]{x}': '(x)^(1/3)' };
  const subX = (s, u) => s.replace(/x/g, '(' + u + ')');
  // follow a description like "Shift left 2 units, reflect across the x-axis, shift up 3 units." step by step,
  // starting from the basic function (parser syntax); null if a step is not understood
  function applyWords(text, base) {
    let s = base;
    for (const st of text.replace(/\.$/, '').toLowerCase().split(/,\s*/)) {
      let m;
      if ((m = /^shift (left|right) (\d+) units?$/.exec(st))) s = subX(s, 'x' + (m[1] === 'right' ? '-' : '+') + m[2]);
      else if ((m = /^shift (up|down) (\d+) units?$/.exec(st))) s = '(' + s + ')' + (m[1] === 'up' ? '+' : '-') + m[2];
      else if ((m = /^stretch vertically by a factor of (\d+)$/.exec(st))) s = m[1] + '*(' + s + ')';
      else if ((m = /^compress vertically by a factor of 1\/(\d+)$/.exec(st))) s = '(1/' + m[1] + ')*(' + s + ')';
      else if (st === 'reflect across the x-axis') s = '-(' + s + ')';
      else return null;
    }
    return s;
  }
  // two functions (parser strings, ASTs or JS functions of x) agree on the window: same domain, same values
  const asFn = (f) => (typeof f === 'function' ? f : ((n) => (x) => MX.evalAST(n, { x }))(V.parse(f)));
  function sameFn(f, g, R = 8) {
    const F = asFn(f), G2 = asFn(g);
    let n = 0;
    for (let k = 0; k <= 160; k++) {
      const x = -R + (2 * R * k) / 160 + 0.0173, u = F(x), w = G2(x);
      if (isFinite(u) !== isFinite(w)) return false;
      if (isFinite(u)) { if (!V.close(u, w, 1e-7)) return false; n++; }
    }
    return n >= 20;
  }
  // a point answer for y = (expression in f): the point must be on the graph for every f through (p, q).
  // gOf(F) builds the displayed right-hand side with F(u) (u = what is inside f) written out in parser syntax.
  const onEveryF = (p, q, gOf) => V.point((x, y) => {
    for (const c of [0.5, -1.7, 2.3]) {
      const g = V.fn(gOf((u) => `(${q}+(${c})*((${u})-(${p})))`), 'x')(x);
      if (!V.close(g, y)) return 'the point is not on the graph of g when f is the line through (' + p + ', ' + q + ') with slope ' + c;
    }
    return true;
  });
  const kAsc = (k) => (k ? (k > 0 ? '+' : '-') + Math.abs(k) : '');
  // the displayed g(x) = a f(x - h) + k in parser syntax, built from the basic function as written
  const gShown = (P, a, h, k) => aAsc(a) + subX(BASE[P.plain], inner(h).asc) + kAsc(k);
  const tPlot = (P, a, h, k, o = {}) => H.fnPlot({ r: 8, pieces: [{ f: gFn(P, a, h, k) }], label: 'graph of a transformed function', ...o });
  MX.register({
    id: 'fn-transform', section: FSEC, title: 'Transformations of functions', kind: 'skill', sources: [ADDED],
    slots: [{ label: 'Transformations', source: ADDED, pool: ['describe', 'equation', 'graph', 'point', 'hscale', 'parent', 'fromGraph'] }],
    lesson: T`<p>Many graphs are copies of a few basic graphs that have been moved, flipped or stretched. If you know the basic shape and the moves, you can sketch a graph or write its equation without plotting lots of points.</p>
<h3>The basic graphs</h3>
<p>Learn to recognize these six shapes. All of them pass through \((0, 0)\) except \(y = \frac{1}{x}\), which is not defined at \(x = 0\).</p>
${(() => {
  const mini = (f, tex, o = {}) => '<figure class="vis" style="width:118px;margin:0;text-align:center">' + H.fnPlot({ r: 3, w: 118, pieces: [Object.assign({ f }, o)], label: 'graph of y = ' + tex }) + '<figcaption>' + MX.texHTML('y = ' + tex) + '</figcaption></figure>';
  return '<div style="display:flex;flex-wrap:wrap;gap:10px 18px;margin:12px 0;max-width:70ch">'
    + mini((x) => x * x, 'x^{2}') + mini((x) => x * x * x, 'x^{3}') + mini((x) => Math.sqrt(x), '\\sqrt{x}', { from: 0, dotFrom: false })
    + mini((x) => Math.cbrt(x), '\\sqrt[3]{x}') + mini((x) => Math.abs(x), '\\left|x\\right|') + mini((x) => (x === 0 ? NaN : 1 / x), '\\frac{1}{x}')
    + '</div>';
})()}
<h3>Shifts, reflections and stretches</h3>
<div class="box rule"><h4>Rule <b>Transformations of \(y = f(x)\)</b></h4><p>In \(g(x) = a\,f(x - h) + k\):</p><ul>
<li>\(h\) shifts the graph <strong>right</strong> \(h\) units: \(f(x - 3)\) moves right 3, and \(f(x + 3)\) moves left 3.</li>
<li>\(k\) shifts the graph <strong>up</strong> \(k\) units: \(+2\) moves up 2, and \(-2\) moves down 2.</li>
<li>If \(a \lt 0\), the graph is <strong>reflected</strong> across the \(x\)-axis (turned upside down).</li>
<li>If \(|a| \gt 1\), it is <strong>stretched</strong> vertically (taller). If \(0 \lt |a| \lt 1\), it is <strong>compressed</strong> vertically (flatter).</li></ul></div>
<div class="box warn"><h4>Watch out</h4><p>The horizontal shift goes the opposite way from the sign you see: \(f(x + 3)\) moves <em>left</em>. Ask which \(x\) makes the inside 0. For \(x + 3\) that is \(x = -3\), to the left.</p></div>
<p>Every point moves the same way. If \((p, q)\) is on the graph of \(f\), then \((p + h,\ aq + k)\) is on the graph of \(g\). For the \(y\)-value, multiply by \(a\) <em>first</em>, then add \(k\).</p>
<div class="ex"><h4>Example</h4><p>Describe \(g(x) = -2|x + 3| + 1\) as a change of \(f(x) = |x|\). Then move the point \((2, 2)\) of \(f\).</p><table class="st">
<tr><td>Match \(a\,f(x - h) + k\).</td><td>\(a = -2,\quad h = -3,\quad k = 1\)</td></tr>
<tr><td>Read off each move.</td><td>\(\text{left } 3,\ \text{stretch by } 2,\ \text{reflect},\ \text{up } 1\)</td></tr>
<tr><td>Move the point: add \(h\) to \(x\); multiply \(y\) by \(a\), then add \(k\).</td><td>\(\left(2 - 3,\ -2 \cdot 2 + 1\right) = (-1, -3)\)</td></tr>
<tr><td>Check with the formula.</td><td>\(g(-1) = -2|2| + 1 = -3\) ✓</td></tr></table>
<figure class="vis">${H.fnPlot({ r: 6, pieces: [{ f: (x) => Math.abs(x), cls: 'ln dash' }, { f: (x) => -2 * Math.abs(x + 3) + 1 }], dots: [[2, 2, true], [-1, -3, true]], label: 'dashed graph of y = |x| and solid graph of g' })}<figcaption style="font-size:14px">Dashed: \(f(x) = |x|\). Solid: \(g(x)\).</figcaption></figure></div>
<h3>Changes inside \(f\)</h3>
<div class="box rule"><h4>Rule <b>Changing the input</b></h4><ul>
<li>\(f(-x)\) reflects the graph across the \(y\)-axis: \((p, q)\) moves to \((-p, q)\).</li>
<li>\(f(bx)\) with \(b \gt 1\) <strong>compresses</strong> the graph horizontally by a factor of \(\frac{1}{b}\). With \(0 \lt b \lt 1\) it <strong>stretches</strong> it horizontally by a factor of \(\frac{1}{b}\). Either way, \((p, q)\) moves to \(\left(\frac{p}{b}, q\right)\).</li></ul>
<p>For example, if \((6, 2)\) is on \(f\), then \((2, 2)\) is on \(y = f(3x)\), because \(3 \cdot 2 = 6\).</p></div>`,
    variants: {
      describe: {
        name: 'Describe the transformation',
        gen(rng) {
          const { P, a, h, k } = pickTransform(rng, { needHK: true });
          const ch = H.choices(rng, describe(a, h, k), [describe(a, -h, k), describe(a, h, -k), describe(-a, -h, k)]);
          return {
            prompt: T`How is the graph of \(g(x) = ${gTex(P, a, h, k)}\) obtained from the graph of \(f(x) = ${P.plain}\)?`,
            parts: [{ kind: 'choice', options: ch.options, answer: ch.answer, points: 2, verify: V.choice((i) => { const w = applyWords(ch.options[i], BASE[P.plain]); return !!w && sameFn(w, gShown(P, a, h, k)); }) }],
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
            parts: [{ kind: 'expr', pre: 'g(x) =', vars: ['x'], answer: gAsc(P, a, h, k), show: 'g(x) = ' + gTex(P, a, h, k), points: 3,
              verify: V.custom((ans) => { const w = applyWords(words, BASE[P.plain]); return !w ? 'could not read the description' : sameFn(ans, w) || 'the answer does not follow the described steps'; }) }],
            solution: [T`Use \(g(x) = a\,f(x - h) + k\) with ${h ? (h > 0 ? T`\(h = ${h}\) (right)` : T`\(h = ${h}\) (left)`) : 'no horizontal shift'}, \(a = ${MX.num(a)}\) and \(k = ${k}\).`, T`\(${H.box('g(x) = ' + gTex(P, a, h, k))}\)`],
          };
        },
      },
      graph: {
        name: 'Choose the graph',
        gen(rng) {
          const { P, a, h, k } = pickTransform(rng, { simpleA: true, needHK: true });
          const drawn = [[a, h, k], [a, -h, k], [a, h, -k], [-a, h, k]];
          const ch = H.choices(rng, tPlot(P, a, h, k), drawn.slice(1).map(([a2, h2, k2]) => tPlot(P, a2, h2, k2)), drawn.map(([a2, h2, k2]) => gFn(P, a2, h2, k2)));
          return {
            prompt: T`Which graph shows \(g(x) = ${gTex(P, a, h, k)}\)?`,
            parts: [{ kind: 'choice', graph: true, options: ch.options, answer: ch.answer, data: ch.data, points: 3, verify: V.choiceData((f) => sameFn(f, gShown(P, a, h, k))) }],
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
            parts: [{ kind: 'point', answer: ans.asc, show: ans.tex, points: 2, verify: onEveryF(p, q, (F) => (yflip ? F('-x') : aAsc(a) + F(inner(h).asc)) + kAsc(k)) }],
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
          // what each described change does to a test function, compared with f(bx)
          const testF = (t) => t * t * t + t + 1;
          const bNum = V.num(b === 0.5 ? '1/2' : String(b));
          const doesBx = (text) => {
            const m = /^(Compress|Stretch) (horizontally|vertically) by a factor of (1\/)?(\d+)$/.exec(text);
            if (!m) return false;
            const c = m[3] ? 1 / +m[4] : +m[4];
            return sameFn(m[2] === 'horizontally' ? (x) => testF(x / c) : (x) => c * testF(x), (x) => testF(bNum * x), 3);
          };
          return {
            prompt: T`The point \((${p}, ${q})\) is on the graph of \(y = f(x)\). Let \(g(x) = ${gT}\).`,
            parts: [
              { label: 'a', ask: T`What does the \(${bTex}x\) inside \(f\) do to the graph?`, kind: 'choice', options: ch.options, answer: ch.answer, points: 1, verify: V.choice((i) => doesBx(ch.options[i])) },
              { label: 'b', ask: T`Which point must be on the graph of \(g\)?`, kind: 'point', answer: ans.asc, show: ans.tex, points: 2, verify: onEveryF(p, q, (F) => F(`${bNum}x`) + kAsc(k)) },
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
            parts: [{ kind: 'choice', options: ch.options, answer: ch.answer, inline: true, points: 1,
              // read the formula off each option and compare it with the plotted curve
              verify: V.choice((i) => { const m = /^\\\(f\(x\) = (.*)\\\)$/.exec(ch.options[i]); return !!m && !!BASE[m[1]] && sameFn(BASE[m[1]], gFn(P, 1, 0, 0), 5); }) }],
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
          const curve = gFn(P, a, h, k);
          return {
            prompt: T`The graph is a transformation of \(f(x) = ${P.plain}\) (no stretch). Write its equation.`,
            visual: H.fnPlot({ r: 8, pieces: [{ f: curve }], dots: [[h, k, true]] }),
            parts: [{ kind: 'expr', pre: 'g(x) =', vars: ['x'], answer: gAsc(P, a, h, k), show: 'g(x) = ' + gTex(P, a, h, k), points: 3, verify: V.custom((ans) => sameFn(ans, curve) || 'the answer does not match the graph') }],
            solution: [T`The ${key === 'abs' ? 'point of the V' : key === 'sq' ? 'vertex' : 'starting point'} moved from \((0, 0)\) to \((${h}, ${k})\): \(h = ${h}\), \(k = ${k}\).`, T`It opens ${a > 0 ? (key === 'sqrt' ? 'upward' : 'up') : (key === 'sqrt' ? 'downward' : 'down')}, so \(a = ${a}\).`, T`\(${H.box('g(x) = ' + gTex(P, a, h, k))}\)`],
          };
        },
      },
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* Relations & functions: domain and range */
(function (G) {
  'use strict';
  const MX = G.MX;
  const { Q, T, H, S, poly } = MX;
  const SEC = 'Relations & functions';
  const ADDED = 'Added';

  // ---------- helpers ----------
  const qs = (v) => (v === Infinity ? '∞' : v === -Infinity ? '-∞' : v instanceof Q ? v.str() : MX.num(v));
  const qtx = (v) => (v === Infinity ? '\\infty' : v === -Infinity ? '-\\infty' : v instanceof Q ? v.tex() : MX.texNum(v));
  const val = (v) => (v instanceof Q ? v.val() : v);
  // one interval -> {asc, tex}
  function iv(lo, hi, lc, hc) {
    const L = val(lo) === -Infinity ? '(' : lc ? '[' : '(', R = val(hi) === Infinity ? ')' : hc ? ']' : ')';
    return { asc: L + qs(lo) + ', ' + qs(hi) + R, tex: L + qtx(lo) + ', ' + qtx(hi) + R };
  }
  const union = (list) => ({ asc: list.map((x) => x.asc).join(' ∪ '), tex: list.map((x) => x.tex).join(' \\cup ') });
  const ALL = iv(-Infinity, Infinity, false, false);
  const setOf = (vals) => {
    const u = [...new Set(vals)].sort((a, b) => a - b);
    return { list: u.map(String), asc: '{' + u.join(', ') + '}', tex: '\\{' + u.join(', ') + '\\}' };
  };
  const pairsTex = (ps) => '\\{' + ps.map(([x, y]) => '(' + x + ', ' + y + ')').join(', ') + '\\}';
  const tableHTML = (ps) => '<table class="xy"><tr><th><i>x</i></th>' + ps.map(([x]) => '<td>' + MX.texHTML(String(x)) + '</td>').join('') + '</tr><tr><th><i>y</i></th>' + ps.map(([, y]) => '<td>' + MX.texHTML(String(y)) + '</td>').join('') + '</tr></table>';
  function mapping(ps) {
    const xs = [...new Set(ps.map((p) => p[0]))].sort((a, b) => a - b), ys = [...new Set(ps.map((p) => p[1]))].sort((a, b) => a - b);
    const n = Math.max(xs.length, ys.length), Hh = 50 + n * 30, W = 300;
    const yOf = (k, len) => 40 + ((k + 0.5) * (Hh - 60)) / len;
    let b = S.ellipse(70, Hh / 2 + 5, 42, Hh / 2 - 12, 'ln soft') + S.ellipse(230, Hh / 2 + 5, 42, Hh / 2 - 12, 'ln soft2');
    b += S.text(70, 16, 'x (input)', { cls: 'tx small', w: 700 }) + S.text(230, 16, 'y (output)', { cls: 'tx small', w: 700 });
    xs.forEach((x, k) => { b += S.text(70, yOf(k, xs.length) + 4, String(x), { cls: 'tx', w: 700 }); });
    ys.forEach((y, k) => { b += S.text(230, yOf(k, ys.length) + 4, String(y), { cls: 'tx', w: 700 }); });
    ps.forEach(([x, y]) => { b += S.arrow(88, yOf(xs.indexOf(x), xs.length), 208, yOf(ys.indexOf(y), ys.length), 'acc', 7); });
    return S.svg(W, Hh, b, 'Mapping diagram from inputs to outputs');
  }
  // a relation graph on a small plane: curves = [{pts, a0, a1}] (arrow at start/end), dots = [[x, y, closed]]
  function relGraph(curves, dots, o = {}) {
    const R = o.r || 8;
    const pl = S.plane({ xmin: -R, xmax: R, ymin: -R, ymax: R, w: o.w || 230, h: o.h || 230, step: 1, labelEvery: R >= 8 ? 4 : 2, pad: 18 });
    let b = pl.body;
    const inWin = (p) => Math.abs(p[0]) <= R + 1e-9 && Math.abs(p[1]) <= R + 1e-9;
    curves.forEach((c) => {
      const pts = c.pts.filter(inWin);
      if (pts.length < 2) return;
      const px = pts.map((p) => [pl.X(p[0]), pl.Y(p[1])]);
      b += S.pline(px, 'acc thick');
      if (c.a0) b += S.arrow(px[1][0], px[1][1], px[0][0], px[0][1], 'acc', 8);
      if (c.a1) { const n = px.length; b += S.arrow(px[n - 2][0], px[n - 2][1], px[n - 1][0], px[n - 1][1], 'acc', 8); }
    });
    (dots || []).forEach(([x, y, closed]) => { b += S.circle(pl.X(x), pl.Y(y), 4.2, closed ? 'accf acc' : 'paperf acc'); });
    return S.svg(pl.W, pl.H, b, o.label || 'graph of a relation');
  }
  const sample = (f, a, b, n = 80) => Array.from({ length: n + 1 }, (_, k) => { const x = a + ((b - a) * k) / n; return [x, f(x)]; });
  const sampleT = (f, a, b, n = 120) => Array.from({ length: n + 1 }, (_, k) => f(a + ((b - a) * k) / n));
  const YES = 'Yes, it is a function', NO = 'No, it is not a function';
  const fnChoice = (isFn, verify) => ({ kind: 'choice', options: [YES, NO], answer: isFn ? 0 : 1, points: 2, verify });

  // ---------- verifier helpers (built from the data shown or drawn, never from the answer) ----------
  const V = MX.V;
  // "Yes" (option 0) is right exactly when the relation passes the test
  const yesIff = (test) => { let r = null; return V.choice((i) => (i === 0) === (r === null ? (r = test()) : r)); };
  // pairs: no input appears with two different outputs
  const pairsAreFn = (ps) => () => ps.every(([x, y]) => ps.every(([x2, y2]) => x2 !== x || y2 === y));
  // vertical line test on the polylines exactly as relGraph draws them (window-clipped): no vertical line
  // meets the drawing at two different heights (a vertical segment meets it everywhere)
  const passesVLT = (curves, R = 8) => () => {
    const inWin = (p) => Math.abs(p[0]) <= R + 1e-9 && Math.abs(p[1]) <= R + 1e-9;
    const segs = [];
    curves.forEach((c) => { const pts = c.pts.filter(inWin); for (let i = 1; i < pts.length; i++) segs.push([pts[i - 1], pts[i]]); });
    for (let k = 0; k <= 800; k++) {
      const x = -R + (2 * R * k) / 800 + 1e-4 * Math.sin(k); // off-grid probes
      const ys = [];
      for (const [[ax, ay], [bx, by]] of segs) {
        if (Math.abs(bx - ax) < 1e-12) { if (Math.abs(x - ax) < 0.02) return false; continue; }
        if ((x - ax) * (x - bx) > 0) continue;
        const y = ay + ((by - ay) * (x - ax)) / (bx - ax);
        if (!ys.some((z) => Math.abs(z - y) < 1e-6)) ys.push(y);
      }
      if (ys.length > 1) return false;
    }
    return true;
  };
  // a set answer lists exactly the distinct values in vals, each once
  const setIs = (vals) => V.custom((a) => {
    const want = [...new Set(vals)];
    if (a.length !== new Set(a.map(Number)).size) return 'a value is listed twice';
    return V.sameSet(a.map(Number), want) || 'the set should be {' + want.sort((p, q) => p - q).join(', ') + '}';
  });
  // domain and range of the graph of f drawn on [a, b], read numerically from f. Each end is 'arrow' (the
  // curve continues forever), true (closed dot) or false (open dot).
  // Returns {dom, rng}: region specs (env => bool) for V.region.
  function cover(f, a, b, ea, eb) {
    const EPS = 1e-9;
    const A = ea === 'arrow' ? -Infinity : a, B = eb === 'arrow' ? Infinity : b;
    const dom = (x) => (x > A + EPS || (Math.abs(x - A) <= EPS && ea === true)) && (x < B - EPS || (Math.abs(x - B) <= EPS && eb === true));
    const sa = ea === 'arrow' ? a - 40 : a, sb = eb === 'arrow' ? b + 40 : b, N = 4000;
    const xs = Array.from({ length: N + 1 }, (_, k) => sa + ((sb - sa) * k) / N), ys = xs.map(f);
    const gr = (Math.sqrt(5) - 1) / 2;
    const extreme = (sg) => { // sg = 1 for the minimum, -1 for the maximum; returns [value, closed]
      let i = 0;
      ys.forEach((y, k) => { if (sg * y < sg * ys[i]) i = k; });
      if (i === 0 && ea !== 'arrow') return [ys[0], ea === true];
      if (i === N && eb !== 'arrow') return [ys[N], eb === true];
      if (i === 0 || i === N) return [null, false]; // runs off along an arrow: settled by the limit below
      let p = xs[i - 1], q = xs[i + 1];
      for (let t = 0; t < 120; t++) { const m1 = q - gr * (q - p), m2 = p + gr * (q - p); if (sg * f(m1) < sg * f(m2)) q = m2; else p = m1; }
      return [Math.min(sg * ys[i], sg * f((p + q) / 2)) * sg, true];
    };
    let [lo, lc] = extreme(1), [hi, hc] = extreme(-1);
    [[ea, a - 1e8], [eb, b + 1e8]].forEach(([e, x]) => {
      if (e !== 'arrow') return;
      const y = f(x);
      if (y < -1e3) { lo = -Infinity; lc = false; }
      if (y > 1e3) { hi = Infinity; hc = false; }
    });
    if (lo === null || hi === null) throw new Error('cover: the curve runs off along an arrow without a limit');
    const rng = (y) => (y > lo + EPS || (Math.abs(y - lo) <= EPS && lc)) && (y < hi - EPS || (Math.abs(y - hi) <= EPS && hc));
    return { dom: (env) => dom(env.x), rng: (env) => rng(env.x) };
  }
  // interval parts for a drawn/stated function: domain and range checked against cover()
  const coverParts = (D, Rg, cv) => drParts(D, Rg).map((p, i) => Object.assign(p, { verify: V.region(i === 0 ? cv.dom : cv.rng, { n: 4000 }) }));
  const rangeVerify = (fs, a, b, ea, eb) => V.region(cover(V.fn(fs, 'x'), a, b, ea, eb).rng, { n: 4000 });

  function randomPairs(rng, n, isFn) {
    let xs = rng.sample([-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6], n);
    let ps = xs.map((x) => [x, rng.int(-6, 9)]);
    if (!isFn) { const k = rng.int(0, n - 2); let y; do { y = rng.int(-6, 9); } while (y === ps[k][1]); ps[n - 1] = [ps[k][0], y]; }
    return rng.shuffle(ps);
  }
  function repeatExplain(ps) {
    const seen = {};
    for (const [x, y] of ps) {
      if (seen[x] !== undefined && seen[x] !== y) return T`The input \(x = ${x}\) is paired with two different outputs (\(${seen[x]}\) and \(${y}\)), so it is <strong>not</strong> a function.`;
      seen[x] = y;
    }
    return T`Every input \(x\) appears with exactly one output, so it <strong>is</strong> a function (outputs may repeat; that's allowed).`;
  }

  // ================= relation or function =================
  MX.register({
    id: 'rel-function', section: SEC, title: 'Relations and functions', kind: 'skill', sources: [],
    slots: [{ label: 'Function or not?', source: ADDED, pool: ['pairs', 'table', 'mapping', 'graph'] }],
    lesson: T`<p>A <strong>relation</strong> is any set of ordered pairs \((x, y)\). A <strong>function</strong> is a relation where every input \(x\) has <strong>exactly one</strong> output \(y\).</p>
<ul><li><strong>Pairs, tables, mappings</strong>: look for an \(x\)-value that repeats with a different \(y\). If one does, it's not a function. (A repeated \(y\) is fine.)</li>
<li><strong>Graphs</strong>: the <strong>vertical line test</strong>. If any vertical line crosses the graph more than once, it's not a function.</li></ul>
<p>Lines (except vertical ones), parabolas that open up or down, and absolute-value graphs are functions. Circles, sideways parabolas and vertical lines are not.</p>`,
    variants: {
      pairs: {
        name: 'Ordered pairs',
        gen(rng) {
          const isFn = rng.chance(0.5), ps = randomPairs(rng, rng.int(4, 6), isFn);
          return { prompt: T`Is the relation \(${pairsTex(ps)}\) a function?`, parts: [fnChoice(isFn, yesIff(pairsAreFn(ps)))], solution: [repeatExplain(ps)] };
        },
      },
      table: {
        name: 'Table',
        gen(rng) {
          const isFn = rng.chance(0.5), ps = randomPairs(rng, rng.int(4, 6), isFn);
          return { prompt: T`Does the table describe \(y\) as a function of \(x\)? ${tableHTML(ps)}`, parts: [fnChoice(isFn, yesIff(pairsAreFn(ps)))], solution: [repeatExplain(ps)] };
        },
      },
      mapping: {
        name: 'Mapping diagram',
        gen(rng) {
          const isFn = rng.chance(0.5), ps = randomPairs(rng, rng.int(3, 5), isFn);
          return { prompt: T`Is the relation shown in the mapping diagram a function?`, visual: mapping(ps), parts: [fnChoice(isFn, yesIff(pairsAreFn(ps)))], solution: [T`Each arrow is one pair (input → output).`, repeatExplain(ps)] };
        },
      },
      graph: {
        name: 'Graph (vertical line test)',
        gen(rng) {
          const h = rng.int(-3, 3), k = rng.int(-3, 3);
          const shapes = [
            { fn: true, name: 'line', c: () => { const m = rng.pick([-2, -1, 1, 2, 0.5]); return [{ pts: sample((x) => m * (x - h) + k, -9, 9), a0: true, a1: true }]; } },
            { fn: true, name: 'parabola', c: () => { const a = rng.pick([1, -1, 0.5]); return [{ pts: sample((x) => a * (x - h) * (x - h) + k, -9, 9, 160), a0: true, a1: true }]; } },
            { fn: true, name: 'absolute value', c: () => { const a = rng.pick([1, -1]); return [{ pts: sample((x) => a * Math.abs(x - h) + k, -9, 9, 180), a0: true, a1: true }]; } },
            { fn: true, name: 'curve', c: () => [{ pts: sample((x) => Math.pow(x - h, 3) / 6 + k, -9, 9, 160), a0: true, a1: true }] },
            { fn: false, name: 'circle', c: () => { const r = rng.int(2, 4); return [{ pts: sampleT((t) => [h + r * Math.cos(t), k + r * Math.sin(t)], 0, 2 * Math.PI) }]; } },
            { fn: false, name: 'sideways parabola', c: () => { const a = rng.pick([1, -1, 0.5]); return [{ pts: sampleT((t) => [a * (t - k) * (t - k) + h, t], -9, 9, 180), a0: true, a1: true }]; } },
            { fn: false, name: 'vertical line', c: () => [{ pts: [[h, -8], [h, 8]], a0: true, a1: true }] }, // inside relGraph's ±8 window (±9 was clipped away, leaving a blank plane)
          ];
          const want = rng.chance(0.5);
          const sh = rng.pick(shapes.filter((s) => s.fn === want));
          const curves = sh.c();
          return {
            prompt: T`Is the relation graphed below a function?`,
            visual: relGraph(curves, []),
            parts: [fnChoice(sh.fn, yesIff(passesVLT(curves)))],
            solution: [
              T`Use the vertical line test: imagine vertical lines sweeping across the graph.`,
              sh.fn ? T`Every vertical line crosses this ${sh.name} at most once, so it <strong>is</strong> a function.` : T`Some vertical line crosses this ${sh.name} ${sh.name === 'vertical line' ? 'infinitely many times' : 'twice'}, so it is <strong>not</strong> a function.`,
            ],
          };
        },
      },
    },
  });

  // ================= domain & range of a relation (sets) =================
  function drSets(rng, form) {
    const ps = randomPairs(rng, rng.int(4, 6), rng.chance(0.5));
    const D = setOf(ps.map((p) => p[0])), Rg = setOf(ps.map((p) => p[1]));
    let prompt, visual;
    if (form === 'pairs') prompt = T`Find the domain and range of the relation \(${pairsTex(ps)}\).`;
    else if (form === 'table') prompt = T`Find the domain and range of the relation in the table. ${tableHTML(ps)}`;
    else if (form === 'mapping') { prompt = T`Find the domain and range of the relation in the mapping diagram.`; visual = mapping(ps); }
    else { prompt = T`Find the domain and range of the relation graphed below.`; visual = relGraph([], ps.map((p) => [p[0], p[1], true])); }
    return {
      prompt, visual,
      parts: [
        { label: 'a', ask: 'Domain (list each value once)', kind: 'set', answers: D.list, answer: D.asc, show: D.tex, points: 2, verify: setIs(ps.map((p) => p[0])) },
        { label: 'b', ask: 'Range (list each value once)', kind: 'set', answers: Rg.list, answer: Rg.asc, show: Rg.tex, points: 2, verify: setIs(ps.map((p) => p[1])) },
      ],
      solution: [
        form === 'points' ? T`Read each point: \(${pairsTex(ps.slice().sort((a, b) => a[0] - b[0]))}\)` : T`List the pairs: \(${pairsTex(ps)}\)`,
        T`Domain = all the \(x\)-values (inputs), each once: \(${D.tex}\)`,
        T`Range = all the \(y\)-values (outputs), each once: \(${Rg.tex}\)`,
      ],
    };
  }
  MX.register({
    id: 'rel-dr', section: SEC, title: 'Domain & range of a relation', kind: 'skill', sources: [],
    slots: [{ label: 'Domain & range (sets)', source: ADDED, pool: ['pairs', 'table', 'mapping', 'points'] }],
    lesson: T`<ul><li>The <strong>domain</strong> is the set of all inputs: the \(x\)-values.</li><li>The <strong>range</strong> is the set of all outputs: the \(y\)-values.</li></ul>
<p>For a list of pairs, a table, a mapping or a scatter of points, just collect the values and write each one <strong>once</strong>, usually smallest to largest:</p>
\[\{(1, 3), (2, 5), (1, 7)\}:\quad \text{domain } \{1, 2\},\ \text{range } \{3, 5, 7\}\]
<p>Type sets with braces: <code>{1, 2}</code>.</p>`,
    variants: {
      pairs: { name: 'Ordered pairs', gen: (rng) => drSets(rng, 'pairs') },
      table: { name: 'Table', gen: (rng) => drSets(rng, 'table') },
      mapping: { name: 'Mapping diagram', gen: (rng) => drSets(rng, 'mapping') },
      points: { name: 'Graph of points', gen: (rng) => drSets(rng, 'points') },
    },
  });

  // ================= domain & range from a graph (intervals) =================
  const drParts = (D, Rg) => [
    { label: 'a', ask: 'Domain (interval notation)', kind: 'interval', answer: D.asc, show: D.tex, points: 2 },
    { label: 'b', ask: 'Range (interval notation)', kind: 'interval', answer: Rg.asc, show: Rg.tex, points: 2 },
  ];
  MX.register({
    id: 'fn-graph-dr', section: SEC, title: 'Domain & range from a graph', kind: 'skill', sources: [],
    slots: [{ label: 'Domain & range from a graph', source: ADDED, pool: ['segment', 'parabola', 'ray', 'sqrt'] }],
    lesson: T`<p>Read the <strong>domain</strong> left to right along the \(x\)-axis, and the <strong>range</strong> bottom to top along the \(y\)-axis.</p>
<ul><li>A <strong>closed dot</strong> ● means the endpoint is included: use a bracket \([\ ]\).</li>
<li>An <strong>open dot</strong> ○ means it isn't: use a parenthesis \((\ )\).</li>
<li>An <strong>arrow</strong> means the graph keeps going: use \(\infty\) or \(-\infty\), always with a parenthesis.</li></ul>
<p>Examples: \([-3, 5)\) means \(-3 \le x \lt 5\); \([2, \infty)\) means \(y \ge 2\); \((-\infty, \infty)\) means all real numbers.</p>
<p>Type \(\infty\) with the ∞ button or as <code>inf</code>; you may also answer with inequalities like <code>-3 &lt;= x &lt; 5</code>.</p>`,
    variants: {
      segment: {
        name: 'Line segment',
        gen(rng) {
          let x1, x2, y1, y2;
          do { x1 = rng.int(-7, 2); x2 = rng.int(x1 + 3, 7); y1 = rng.int(-7, 7); y2 = rng.int(-7, 7); } while (y1 === y2);
          const c1 = rng.chance(0.6), c2 = rng.chance(0.5);
          const D = iv(x1, x2, c1, c2);
          const lo = y1 < y2 ? [y1, c1] : [y2, c2], hi = y1 < y2 ? [y2, c2] : [y1, c1];
          const Rg = iv(lo[0], hi[0], lo[1], hi[1]);
          return {
            prompt: T`Find the domain and range of the graph below.`,
            visual: relGraph([{ pts: [[x1, y1], [x2, y2]] }], [[x1, y1, c1], [x2, y2, c2]]),
            parts: coverParts(D, Rg, cover((x) => y1 + ((y2 - y1) * (x - x1)) / (x2 - x1), x1, x2, c1, c2)),
            solution: [
              T`Endpoints: \((${x1}, ${y1})\) (${c1 ? 'closed, included' : 'open, not included'}) and \((${x2}, ${y2})\) (${c2 ? 'closed, included' : 'open, not included'}).`,
              T`The \(x\)-values run from ${x1} to ${x2}: domain \(${H.box(D.tex)}\)`,
              T`The \(y\)-values run from ${lo[0]} to ${hi[0]}: range \(${H.box(Rg.tex)}\)`,
            ],
          };
        },
      },
      parabola: {
        name: 'Parabola',
        gen(rng) {
          const h = rng.int(-4, 4), k = rng.int(-5, 5), up = rng.chance(0.5), a = up ? 1 : -1;
          const Rg = up ? iv(k, Infinity, true, false) : iv(-Infinity, k, false, true);
          const fp = (x) => a * (x - h) * (x - h) + k;
          return {
            prompt: T`Find the domain and range of the parabola graphed below.`,
            visual: relGraph([{ pts: sample(fp, -9, 9, 200), a0: true, a1: true }], []),
            parts: coverParts(ALL, Rg, cover(fp, -9, 9, 'arrow', 'arrow')),
            solution: [
              T`The arrows show the parabola keeps spreading left and right forever: domain \(${H.box(ALL.tex)}\)`,
              T`Its vertex \((${h}, ${k})\) is the ${up ? 'lowest' : 'highest'} point, and it opens ${up ? 'up' : 'down'}.`,
              T`Range: \(${H.box(Rg.tex)}\)`,
            ],
          };
        },
      },
      ray: {
        name: 'Ray (one endpoint)',
        gen(rng) {
          const x1 = rng.int(-5, 4), y1 = rng.int(-5, 5), right = rng.chance(0.5), m = rng.pick([-2, -1, -0.5, 0.5, 1, 2]), closed = rng.chance(0.6);
          const end = right ? 9 : -9;
          const D = right ? iv(x1, Infinity, closed, false) : iv(-Infinity, x1, false, closed);
          const goesUp = (right && m > 0) || (!right && m < 0);
          const Rg = goesUp ? iv(y1, Infinity, closed, false) : iv(-Infinity, y1, false, closed);
          const fr = (x) => y1 + m * (x - x1);
          const pts = sample(fr, x1, end, 40);
          return {
            prompt: T`Find the domain and range of the graph below.`,
            visual: relGraph([{ pts, a1: true }], [[x1, y1, closed]]),
            // drawn from the dot at x1 to an arrow at `end`
            parts: coverParts(D, Rg, right ? cover(fr, x1, end, closed, 'arrow') : cover(fr, end, x1, 'arrow', closed)),
            solution: [
              T`The graph starts at \((${x1}, ${y1})\) with a ${closed ? 'closed dot (included)' : 'open dot (not included)'} and continues forever to the ${right ? 'right' : 'left'} and ${goesUp ? 'up' : 'down'}.`,
              T`Domain: \(${H.box(D.tex)}\)`,
              T`Range: \(${H.box(Rg.tex)}\)`,
            ],
          };
        },
      },
      sqrt: {
        name: 'Square-root curve',
        gen(rng) {
          const h = rng.int(-6, 2), k = rng.int(-5, 4), down = rng.chance(0.4), sgn = down ? -1 : 1;
          const D = iv(h, Infinity, true, false), Rg = down ? iv(-Infinity, k, false, true) : iv(k, Infinity, true, false);
          const fs = (x) => k + sgn * 1.5 * Math.sqrt(Math.max(0, x - h));
          return {
            prompt: T`Find the domain and range of the graph below.`,
            visual: relGraph([{ pts: sample(fs, h, 9, 120), a1: true }], [[h, k, true]]),
            parts: coverParts(D, Rg, cover(fs, h, 9, true, 'arrow')),
            solution: [T`The curve starts at \((${h}, ${k})\) (closed dot) and goes right forever.`, T`Domain: \(${H.box(D.tex)}\)`, T`It ${down ? 'falls' : 'rises'} forever from \(y = ${k}\): range \(${H.box(Rg.tex)}\)`],
          };
        },
      },
    },
  });

  // ================= domain from a formula =================
  // the domain is where the displayed formula evaluates to a real number, with `rules` restating the exact
  // conditions (denominator ≠ 0, radicand ≥ 0). Each rule's boundary is found by root finding; right at a
  // boundary r the rule is judged at r itself, and a point a hair away from r is judged by which side it is on,
  // so floating-point noise in f near r can't flip the answer.
  const domainVerify = (fs, rules) => {
    const f = V.fn(fs, 'x');
    let rs = null; // found on first use, so generating the question stays cheap
    const find = () => rs || (rs = rules.map((s) => { const r = V.rel(s)[0]; return { t: V.truth(s), roots: V.roots({ lhs: r.lhs, op: '=', rhs: r.rhs }, { n: 2000 }) }; }));
    const ok = (env) => {
      const x = env.x;
      for (const { t, roots } of find()) {
        const r = roots === 'all' ? null : roots.find((z) => Math.abs(x - z) <= 1e-6);
        if (r === undefined || r === null) { if (!t({ x })) return false; continue; }
        if (!t({ x: x === r ? r : r + (x - r) * 1e5 })) return false;
        if (x === r) continue; // on a boundary the rule decides (√0 is fine, 1/0 is caught by the rule)
      }
      return find().some(({ roots }) => roots !== 'all' && roots.some((z) => Math.abs(x - z) <= 1e-6)) || isFinite(f(x));
    };
    // a coarse scan finds the interval ends; single excluded points (holes) are probed explicitly
    const inside = (a, x) => a.some((r) => (x > r.lo || (x === r.lo && r.lc)) && (x < r.hi || (x === r.hi && r.hc)));
    return V.all(
      (a) => { find(); return V.region(ok, { n: 2000 })(a); },
      (a) => {
        for (const { roots } of find()) for (const z of roots === 'all' ? [] : roots) if (inside(a, z) !== ok({ x: z })) return 'x = ' + MX.num(z, 6) + (ok({ x: z }) ? ' is' : ' is not') + ' in the domain';
        return true;
      });
  };
  MX.register({
    id: 'fn-domain', section: SEC, title: 'Domain of a function from its formula', kind: 'skill', sources: [],
    slots: [{ label: 'Domain from a formula', source: ADDED, pool: ['rational', 'twoHoles', 'sqrt', 'poly', 'sqrtDen'] }],
    lesson: T`<p>Start with all real numbers, then remove anything that breaks the formula:</p>
<ul><li><strong>Polynomials</strong> never break: domain \((-\infty, \infty)\).</li>
<li><strong>Fractions</strong>: the denominator can't be 0. Solve denominator = 0 and remove those values: \(f(x) = \frac{1}{x - 3}\) has domain \((-\infty, 3) \cup (3, \infty)\).</li>
<li><strong>Square roots</strong>: the inside can't be negative. Solve inside \(\ge 0\): \(\sqrt{2x - 6}\) needs \(x \ge 3\), so \([3, \infty)\).</li>
<li><strong>Square root in a denominator</strong>: inside \(\gt 0\) (it can't be 0 either).</li></ul>`,
    variants: {
      rational: {
        name: 'Fraction',
        gen(rng) {
          const a = rng.nz(-9, 9), b = rng.nz(-8, 8);
          const f = T`\dfrac{${MX.lin(1, a).tex}}{${MX.lin(1, -b).tex}}`;
          const D = union([iv(-Infinity, b, false, false), iv(b, Infinity, false, false)]);
          return {
            prompt: T`Find the domain of \(f(x) = ${f}\). Write it in interval notation.`,
            parts: [{ kind: 'interval', answer: D.asc, show: D.tex, points: 3, verify: domainVerify(`(${MX.lin(1, a).asc})/(${MX.lin(1, -b).asc})`, [`${MX.lin(1, -b).asc} != 0`]) }],
            solution: [T`The denominator can't be 0: \(${MX.lin(1, -b).tex} = 0\) when \(x = ${b}\).`, T`All real numbers except ${b}: \(${H.box(D.tex)}\)`],
          };
        },
      },
      twoHoles: {
        name: 'Quadratic denominator',
        gen(rng) {
          let r, s; do { r = rng.int(-7, 7); s = rng.int(-7, 7); } while (r >= s);
          const k = rng.int(1, 9), den = MX.quad(1, -(r + s), r * s);
          const D = union([iv(-Infinity, r, false, false), iv(r, s, false, false), iv(s, Infinity, false, false)]);
          return {
            prompt: T`Find the domain of \(g(x) = \dfrac{${k}}{${den.tex}}\) in interval notation.`,
            parts: [{ kind: 'interval', answer: D.asc, show: D.tex, points: 3, verify: domainVerify(`${k}/(${den.asc})`, [`${den.asc} != 0`]) }],
            solution: [T`Set the denominator equal to 0 and factor: \(${den.tex} = \left(x ${MX.sgnTerm(-r)}\right)\left(x ${MX.sgnTerm(-s)}\right) = 0\)`, T`\(x = ${r}\) or \(x = ${s}\) must be removed.`, T`\(${H.box(D.tex)}\)`],
          };
        },
      },
      sqrt: {
        name: 'Square root',
        gen(rng) {
          const a = rng.nz(-4, 5), b = rng.int(-12, 12);
          const cut = new Q(-b, a);
          const D = a > 0 ? iv(cut, Infinity, true, false) : iv(-Infinity, cut, false, true);
          const In = MX.lin(a, b);
          return {
            prompt: T`Find the domain of \(f(x) = \sqrt{${In.tex}}\) in interval notation.`,
            parts: [{ kind: 'interval', answer: D.asc, show: D.tex, points: 3, verify: domainVerify(`sqrt(${In.asc})`, [`${In.asc} >= 0`]) }],
            solution: [T`The inside of a square root can't be negative: \(${In.tex} \ge 0\)`, T`\(${MX.coef(a)}x \ge ${-b}\)${a < 0 ? ', and dividing by a negative flips the sign' : ''}: \(x ${a > 0 ? '\\ge' : '\\le'} ${cut.tex()}\)`, T`\(${H.box(D.tex)}\)`],
          };
        },
      },
      poly: {
        name: 'Polynomial',
        gen(rng) {
          const P = MX.poly([[rng.nz(-4, 4), { x: rng.int(2, 3) }], [rng.nz(-9, 9), { x: 1 }], [rng.int(-9, 9), {}]]);
          return {
            prompt: T`Find the domain of \(h(x) = ${P.tex}\) in interval notation.`,
            parts: [{ kind: 'interval', answer: ALL.asc, show: ALL.tex, points: 3, verify: domainVerify(P.asc, []) }],
            solution: [T`A polynomial has no denominators and no square roots, so any real number works.`, T`\(${H.box(ALL.tex)}\) (all real numbers)`],
          };
        },
      },
      sqrtDen: {
        name: 'Square root in a denominator',
        gen(rng) {
          const h = rng.int(-8, 8), c = rng.int(1, 9);
          const D = iv(h, Infinity, false, false);
          return {
            prompt: T`Find the domain of \(f(x) = \dfrac{${c}}{\sqrt{${MX.lin(1, -h).tex}}}\) in interval notation.`,
            parts: [{ kind: 'interval', answer: D.asc, show: D.tex, points: 3, verify: domainVerify(`${c}/sqrt(${MX.lin(1, -h).asc})`, [`${MX.lin(1, -h).asc} > 0`]) }],
            solution: [T`The inside of the root can't be negative, and the denominator can't be 0, so the inside must be <em>positive</em>: \(${MX.lin(1, -h).tex} \gt 0\).`, T`\(x \gt ${h}\), which excludes the endpoint.`, T`\(${H.box(D.tex)}\)`],
          };
        },
      },
    },
  });

  // ================= range from a formula =================
  MX.register({
    id: 'fn-range', section: SEC, title: 'Range of a function from its formula', kind: 'skill', sources: [],
    slots: [{ label: 'Range from a formula', source: ADDED, pool: ['quad', 'quadStd', 'sqrt', 'abs', 'linear'] }],
    lesson: T`<p>The range is every output the function can produce. Picture (or sketch) the graph:</p>
<ul><li><strong>Non-horizontal line</strong> \(f(x) = mx + b\): every \(y\) is reached, range \((-\infty, \infty)\).</li>
<li><strong>Parabola</strong> \(a(x - h)^{2} + k\): the vertex height \(k\) is the minimum if \(a \gt 0\), range \([k, \infty)\); the maximum if \(a \lt 0\), range \((-\infty, k]\). From standard form, find the vertex with \(x = -\frac{b}{2a}\).</li>
<li><strong>Square root</strong> \(a\sqrt{x - h} + k\): starts at \(y = k\) and goes up if \(a \gt 0\) (\([k, \infty)\)) or down if \(a \lt 0\) (\((-\infty, k]\)).</li>
<li><strong>Absolute value</strong> \(a|x - h| + k\): same idea, a V with its point at \(y = k\).</li></ul>`,
    variants: {
      quad: {
        name: 'Parabola in vertex form',
        gen(rng) {
          const a = rng.nz(-3, 3), h = rng.int(-6, 6), k = rng.int(-9, 9);
          const Rg = a > 0 ? iv(k, Infinity, true, false) : iv(-Infinity, k, false, true);
          const f = T`${MX.coef(a)}\left(x ${MX.sgnTerm(-h)}\right)^{2} ${MX.sgnTerm(k)}`.replace(/\\left\(x \+ 0\\right\)|\\left\(x - 0\\right\)/, 'x');
          return {
            prompt: T`Find the range of \(f(x) = ${f}\) in interval notation.`,
            parts: [{ kind: 'interval', answer: Rg.asc, show: Rg.tex, points: 3, verify: rangeVerify(`${a}(x-(${h}))^2+(${k})`, -9, 9, 'arrow', 'arrow') }],
            solution: [T`Vertex form \(a\left(x - h\right)^{2} + k\): the vertex is \((${h}, ${k})\) and \(a = ${a}\).`, T`\(a ${a > 0 ? '\\gt' : '\\lt'} 0\), so the parabola opens ${a > 0 ? 'up and ' + k + ' is the smallest output' : 'down and ' + k + ' is the largest output'}.`, T`\(${H.box(Rg.tex)}\)`],
          };
        },
      },
      quadStd: {
        name: 'Parabola in standard form',
        gen(rng) {
          const a = rng.pick([1, -1, 2, -2]), h = rng.int(-5, 5), k = rng.int(-9, 9);
          const b = -2 * a * h, c = a * h * h + k;
          const Rg = a > 0 ? iv(k, Infinity, true, false) : iv(-Infinity, k, false, true);
          return {
            prompt: T`Find the range of \(f(x) = ${MX.quad(a, b, c).tex}\) in interval notation.`,
            parts: [{ kind: 'interval', answer: Rg.asc, show: Rg.tex, points: 3, verify: rangeVerify(MX.quad(a, b, c).asc, -9, 9, 'arrow', 'arrow') }],
            solution: [T`Vertex: \(x = -\frac{b}{2a} = -\frac{${b}}{2\left(${a}\right)} = ${h}\), and \(f(${h}) = ${k}\).`, T`\(a = ${a}\) is ${a > 0 ? 'positive (opens up)' : 'negative (opens down)'}, so ${k} is the ${a > 0 ? 'minimum' : 'maximum'}.`, T`\(${H.box(Rg.tex)}\)`],
          };
        },
      },
      sqrt: {
        name: 'Square root function',
        gen(rng) {
          const a = rng.pick([1, 2, 3, -1, -2]), h = rng.int(-6, 6), k = rng.int(-8, 8);
          const Rg = a > 0 ? iv(k, Infinity, true, false) : iv(-Infinity, k, false, true);
          return {
            prompt: T`Find the range of \(f(x) = ${MX.coef(a)}\sqrt{${MX.lin(1, -h).tex}} ${MX.sgnTerm(k)}\) in interval notation.`,
            // domain from the radicand: x - h >= 0
            parts: [{ kind: 'interval', answer: Rg.asc, show: Rg.tex, points: 3, verify: rangeVerify(`${a}*sqrt(${MX.lin(1, -h).asc})+(${k})`, h, h + 9, true, 'arrow') }],
            solution: [T`\(\sqrt{${MX.lin(1, -h).tex}}\) takes every value from 0 up.`, T`Multiplying by ${a} ${a > 0 ? 'keeps it going up' : 'flips it downward'}, and adding ${k} shifts the start to \(y = ${k}\).`, T`\(${H.box(Rg.tex)}\)`],
          };
        },
      },
      abs: {
        name: 'Absolute value function',
        gen(rng) {
          const a = rng.pick([1, 2, -1, -3]), h = rng.int(-6, 6), k = rng.int(-8, 8);
          const Rg = a > 0 ? iv(k, Infinity, true, false) : iv(-Infinity, k, false, true);
          return {
            prompt: T`Find the range of \(f(x) = ${MX.coef(a)}\left|${MX.lin(1, -h).tex}\right| ${MX.sgnTerm(k)}\) in interval notation.`,
            parts: [{ kind: 'interval', answer: Rg.asc, show: Rg.tex, points: 3, verify: rangeVerify(`${a}*|${MX.lin(1, -h).asc}|+(${k})`, -9, 9, 'arrow', 'arrow') }],
            solution: [T`\(\left|${MX.lin(1, -h).tex}\right| \ge 0\), with its smallest value 0 at \(x = ${h}\).`, T`The graph is a V with its point at \((${h}, ${k})\), opening ${a > 0 ? 'up' : 'down'}.`, T`\(${H.box(Rg.tex)}\)`],
          };
        },
      },
      linear: {
        name: 'Linear function',
        gen(rng) {
          const m = rng.nz(-6, 6), b = rng.int(-9, 9);
          return {
            prompt: T`Find the range of \(f(x) = ${MX.lin(m, b).tex}\) in interval notation.`,
            parts: [{ kind: 'interval', answer: ALL.asc, show: ALL.tex, points: 3, verify: rangeVerify(MX.lin(m, b).asc, -9, 9, 'arrow', 'arrow') }],
            solution: [T`The graph is a slanted line (slope ${m}), which rises or falls forever and hits every height.`, T`\(${H.box(ALL.tex)}\)`],
          };
        },
      },
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);

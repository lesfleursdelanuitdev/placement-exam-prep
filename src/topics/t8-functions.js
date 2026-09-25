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
    lesson: T`<p>A function is a rule that gives each input one output. You use functions all the time: each person has one birthday, and each item on a shelf has one price. This lesson shows how to tell whether a list of pairs, a table, a mapping diagram or a graph is a function.</p>
<div class="box def"><h4>Definition <b>Relation</b></h4><p>A <strong>relation</strong> is any set of ordered pairs \((x, y)\). The first number \(x\) is the <strong>input</strong>. The second number \(y\) is the <strong>output</strong>.</p></div>
<div class="box def"><h4>Definition <b>Function</b></h4><p>A <strong>function</strong> is a relation in which every input has <strong>exactly one</strong> output. If one input is paired with two different outputs, the relation is not a function.</p></div>
<h3>Pairs, tables and mapping diagrams</h3>
<p>These all show a list of input-output pairs. In a table, each column is one pair. In a mapping diagram, each arrow goes from an input to its output. To test for a function, focus on the inputs.</p>
<div class="box how"><h4>How to <b>test a list of pairs</b></h4><ol>
<li>Look at the inputs (the \(x\)-values).</li>
<li>Find any input that appears more than once.</li>
<li>If a repeated input has two different outputs, it is <strong>not</strong> a function. If no input does that, it <strong>is</strong> a function.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Is \(\{(2, 5), (-1, 3), (4, 5), (2, 7)\}\) a function?</p><table class="st">
<tr><td>List the inputs.</td><td>\(2,\ -1,\ 4,\ 2\)</td></tr>
<tr><td>The input 2 appears twice. Compare its outputs.</td><td>\((2, 5)\) and \((2, 7)\)</td></tr>
<tr><td>The input 2 has two different outputs.</td><td>\(\text{not a function}\)</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>A repeated <em>output</em> is fine. \(\{(1, 4), (3, 4)\}\) is a function: two inputs share the output 4, but each input still has only one output.</p></div>
<h3>Graphs: the vertical line test</h3>
<p>On a graph, every point is a pair. Two points straight above each other have the same \(x\) but different \(y\)-values, and a vertical line through them finds them both.</p>
<div class="box rule"><h4>Rule <b>Vertical line test</b></h4><p>A graph is a function if <strong>every</strong> vertical line crosses it at most once. If even one vertical line crosses it twice or more, it is not a function.</p></div>
${(() => {
  const fig = (pts, vx, hits, cap) => {
    const pl = S.plane({ xmin: -5, xmax: 5, ymin: -5, ymax: 5, w: 170, h: 170, step: 1, labelEvery: 5, pad: 14 });
    const b = pl.body + S.pline(pts.map((p) => [pl.X(p[0]), pl.Y(p[1])]), 'acc thick') + S.line(pl.X(vx), pl.Y(-5), pl.X(vx), pl.Y(5), 'ln dash') + hits.map((y) => S.circle(pl.X(vx), pl.Y(y), 4.2, 'accf acc')).join('');
    return '<figure class="vis" style="width:170px;margin:0">' + S.svg(pl.W, pl.H, b, cap) + '<figcaption style="font-size:14px;line-height:1.35">' + cap + '</figcaption></figure>';
  };
  return '<div style="display:flex;flex-wrap:wrap;gap:12px 32px;margin:12px 0">'
    + fig(sample((x) => (x * x) / 2 - 3, -4, 4), 2, [-1], 'Parabola: every vertical line crosses once. A function.')
    + fig(sampleT((t) => [3 * Math.cos(t), 3 * Math.sin(t)], 0, 2 * Math.PI), 1.5, [Math.sqrt(6.75), -Math.sqrt(6.75)], 'Circle: this vertical line crosses twice. Not a function.')
    + '</div>';
})()}
<p>Lines that are not vertical, parabolas that open up or down, V-shaped absolute value graphs and S-shaped curves like \(y = x^{3}\) all pass the test. Circles, parabolas that open sideways and vertical lines fail it.</p>`,
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
    lesson: T`<p>Every relation comes with two sets: the inputs it uses and the outputs it produces. They are called the domain and the range, and you will use them for every kind of function in this course.</p>
<div class="box def"><h4>Definition <b>Domain and range</b></h4><p>The <strong>domain</strong> of a relation is the set of all its inputs (the \(x\)-values). The <strong>range</strong> is the set of all its outputs (the \(y\)-values).</p></div>
<p>A <strong>set</strong> is a list of values inside braces, like \(\{1, 2, 3\}\). Each value is written only once, and the order does not matter. Listing from smallest to largest makes your work easy to check.</p>
<div class="box how"><h4>How to <b>find the domain and range of a relation</b></h4><ol>
<li>Write out the ordered pairs. In a table, each column is a pair. In a mapping diagram, each arrow is a pair. On a graph of points, read each dot as \((x, y)\).</li>
<li>Collect the first numbers, each one once. That is the domain.</li>
<li>Collect the second numbers, each one once. That is the range.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Find the domain and range of \(\{(3, -1), (0, 4), (-2, 4), (3, 6)\}\).</p><table class="st">
<tr><td>List the \(x\)-values.</td><td>\(3,\ 0,\ -2,\ 3\)</td></tr>
<tr><td>Write each one once, smallest first.</td><td>\(\text{Domain} = \{-2, 0, 3\}\)</td></tr>
<tr><td>List the \(y\)-values.</td><td>\(-1,\ 4,\ 4,\ 6\)</td></tr>
<tr><td>Write each one once, smallest first.</td><td>\(\text{Range} = \{-1, 4, 6\}\)</td></tr></table></div>
<p>Here is the same relation as a mapping diagram. The left oval holds the domain and the right oval holds the range. Each arrow is one pair.</p>
<figure class="vis">${mapping([[3, -1], [0, 4], [-2, 4], [3, 6]])}</figure>
<div class="box warn"><h4>Watch out</h4><p>Do not repeat a value, even when it shows up in several pairs. And keep the two sets apart: the domain uses only first numbers, and the range uses only second numbers.</p></div>
<p>To type a set, use braces and commas: <code>{-2, 0, 3}</code>.</p>`,
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
    lesson: T`<p>When a graph is a solid line or curve, its domain and range contain infinitely many numbers. You cannot list them all, so you describe them as intervals: "every number from here to there."</p>
<div class="box def"><h4>Definition <b>Interval notation</b></h4><p>An <strong>interval</strong> is written as its two ends with a comma between them. A <strong>bracket</strong> \([\ ]\) means that end is included. A <strong>parenthesis</strong> \((\ )\) means it is not. For example, \([-3, 5)\) means \(-3 \le x \lt 5\).</p></div>
<div class="box rule"><h4>Rule <b>Reading the ends of a graph</b></h4><ul>
<li>A <strong>closed dot</strong> ● is included: use a bracket.</li>
<li>An <strong>open dot</strong> ○ is not included: use a parenthesis.</li>
<li>An <strong>arrow</strong> means the graph goes on forever: use \(\infty\) or \(-\infty\), always with a parenthesis.</li></ul></div>
<div class="box how"><h4>How to <b>find the domain and range from a graph</b></h4><ol>
<li><strong>Domain:</strong> scan left to right. Find the smallest and largest \(x\)-values the graph reaches.</li>
<li><strong>Range:</strong> scan bottom to top. Find the lowest and highest \(y\)-values the graph reaches.</li>
<li>At each end, check for a dot or an arrow, and pick a bracket or a parenthesis.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Find the domain and range of the segment below.</p>
<figure class="vis">${relGraph([{ pts: [[-4, 5], [3, -2]] }], [[-4, 5, true], [3, -2, false]], { label: 'segment from a closed dot at (-4, 5) to an open dot at (3, -2)' })}</figure>
<table class="st">
<tr><td>Left to right, the graph runs from \(x = -4\) (closed dot) to \(x = 3\) (open dot).</td><td>\(\text{Domain} = [-4, 3)\)</td></tr>
<tr><td>Bottom to top, it runs from \(y = -2\) (open dot) to \(y = 5\) (closed dot).</td><td>\(\text{Range} = (-2, 5]\)</td></tr></table></div>
<p>Because this segment slopes down, the lowest point is at the <em>right</em> end. Always look for the lowest and highest points; do not just copy the endpoints in order.</p>
<h3>Graphs that go on forever</h3>
<p>A parabola with arrows on both sides covers every \(x\), so its domain is \((-\infty, \infty)\). Its range starts at the vertex. If the vertex is \((1, -3)\) and the parabola opens up, the range is \([-3, \infty)\).</p>
<p>A ray or a square-root curve starts at a dot and goes on forever in one direction. One end of each interval comes from the dot, and the other end is \(\infty\) or \(-\infty\).</p>
<div class="box warn"><h4>Watch out</h4><p>\(\infty\) is not a number you can reach, so it always gets a parenthesis: write \([2, \infty)\), never \([2, \infty]\).</p></div>
<p>Type \(\infty\) with the ∞ button or as <code>inf</code>. You may also answer with an inequality such as <code>-4 &lt;= x &lt; 3</code>.</p>`,
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
    lesson: T`<p>The domain of a function is every input you are allowed to use. With a formula, most numbers work. Your job is to find the few numbers that break the formula and leave them out.</p>
<div class="box def"><h4>Definition <b>Domain of a function</b></h4><p>The <strong>domain</strong> of \(f\) is the set of all \(x\)-values for which \(f(x)\) is a real number.</p></div>
<div class="box rule"><h4>Rule <b>What can break a formula</b></h4><ul>
<li><strong>Polynomials</strong> (no variable in a denominator, no roots) never break. Their domain is all real numbers, \((-\infty, \infty)\).</li>
<li><strong>Fractions:</strong> the denominator cannot be 0.</li>
<li><strong>Square roots:</strong> the inside cannot be negative, so the inside must be \(\ge 0\).</li>
<li><strong>Square root in a denominator:</strong> the inside cannot be negative <em>and</em> cannot be 0, so it must be \(\gt 0\).</li></ul></div>
<h3>Fractions: remove the zeros of the denominator</h3>
<div class="ex"><h4>Example</h4><p>Find the domain of \(g(x) = \dfrac{5}{x^{2} - x - 6}\).</p><table class="st">
<tr><td>Set the denominator equal to 0.</td><td>\(x^{2} - x - 6 = 0\)</td></tr>
<tr><td>Factor and solve.</td><td>\(\left(x - 3\right)\left(x + 2\right) = 0,\quad x = 3 \text{ or } x = -2\)</td></tr>
<tr><td>Remove those two numbers. Every other number works.</td><td>\((-\infty, -2) \cup (-2, 3) \cup (3, \infty)\)</td></tr></table></div>
<p>The symbol \(\cup\) (union) joins the pieces of the number line that are left. With one bad number, such as in \(\dfrac{1}{x - 4}\), you get two pieces: \((-\infty, 4) \cup (4, \infty)\).</p>
<h3>Square roots: the inside must be at least 0</h3>
<div class="ex"><h4>Example</h4><p>Find the domain of \(f(x) = \sqrt{6 - 2x}\).</p><table class="st">
<tr><td>The inside must not be negative.</td><td>\(6 - 2x \ge 0\)</td></tr>
<tr><td>Subtract 6 from both sides.</td><td>\(-2x \ge -6\)</td></tr>
<tr><td>Divide by \(-2\) and flip the inequality sign.</td><td>\(x \le 3\)</td></tr>
<tr><td>Write it as an interval.</td><td>\((-\infty, 3]\)</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>When you divide both sides of an inequality by a negative number, flip the sign. Also watch the endpoint: \(\sqrt{x - 4}\) allows \(x = 4\) (since \(\sqrt{0} = 0\)), so its domain is \([4, \infty)\). But \(\dfrac{1}{\sqrt{x - 4}}\) would divide by 0 at \(x = 4\), so its domain is \((4, \infty)\).</p></div>`,
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
    lesson: T`<p>The range of a function is every output it can produce. With a formula, the easiest way to find it is to picture the graph and ask two questions: how low does it go, and how high?</p>
<div class="box def"><h4>Definition <b>Range of a function</b></h4><p>The <strong>range</strong> of \(f\) is the set of all values \(f(x)\) takes as \(x\) runs through the domain.</p></div>
<p>A slanted line \(f(x) = mx + b\) (with \(m \ne 0\)) rises or falls forever, so it reaches every height. Its range is \((-\infty, \infty)\).</p>
<p>Parabolas, absolute value graphs and square-root graphs each have one special point at height \(k\): the vertex, the corner of the V, or the starting point. The graph goes on forever in one direction from that height and never passes it in the other.</p>
<div class="box rule"><h4>Rule <b>Range from the formula</b></h4><p>For \(f(x) = a(x - h)^{2} + k\), \(\ f(x) = a\left|x - h\right| + k\) or \(\ f(x) = a\sqrt{x - h} + k\):</p><ul>
<li>If \(a \gt 0\), the graph goes up from height \(k\). The range is \([k, \infty)\).</li>
<li>If \(a \lt 0\), the graph goes down from height \(k\). The range is \((-\infty, k]\).</li></ul></div>
<div class="ex"><h4>Example</h4><p>Find the range of \(f(x) = -2\left(x + 1\right)^{2} + 5\).</p><table class="st">
<tr><td>Match \(a(x - h)^{2} + k\).</td><td>\(a = -2,\quad h = -1,\quad k = 5\)</td></tr>
<tr><td>\(a \lt 0\), so the parabola opens down, and the vertex height 5 is the largest output.</td><td>\(f(x) \le 5\)</td></tr>
<tr><td>Write the interval.</td><td>\((-\infty, 5]\)</td></tr></table>
<figure class="vis">${H.fnPlot({ r: 8, pieces: [{ f: (x) => -2 * (x + 1) * (x + 1) + 5 }], dots: [[-1, 5, true]], label: 'parabola opening down with vertex at (-1, 5)' })}</figure></div>
<h3>Parabolas in standard form</h3>
<p>If the parabola is written as \(f(x) = ax^{2} + bx + c\), find the vertex first. Its \(x\)-value is \(x = -\dfrac{b}{2a}\). Put that value into \(f\) to get the height \(k\).</p>
<div class="ex"><h4>Example</h4><p>Find the range of \(f(x) = x^{2} - 6x + 4\).</p><table class="st">
<tr><td>Find the \(x\)-value of the vertex.</td><td>\(x = -\dfrac{-6}{2 \cdot 1} = 3\)</td></tr>
<tr><td>Find its height.</td><td>\(f(3) = 9 - 18 + 4 = -5\)</td></tr>
<tr><td>\(a = 1 \gt 0\), so it opens up and \(-5\) is the smallest output.</td><td>\([-5, \infty)\)</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>The range uses the <em>height</em> \(k\), not \(h\). For \(f(x) = 3\left|x - 4\right| - 2\), the corner is \((4, -2)\), so the range is \([-2, \infty)\), not \([4, \infty)\).</p></div>`,
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

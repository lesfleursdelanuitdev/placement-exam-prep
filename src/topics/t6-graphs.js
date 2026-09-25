/* Lines, parabolas, systems, variation */
(function (G) {
  'use strict';
  const MX = G.MX;
  const { Q, T, H, S, poly } = MX;
  const SEC = 'Graphs, lines & systems';

  const slopeInt = (m, b) => {
    // y = mx + b with Q m, b
    const mt = m.n === 0 ? '' : (m.eq(1) ? '' : m.eq(-1) ? '-' : m.tex()) + 'x';
    const ma = m.n === 0 ? '' : (m.eq(1) ? '' : m.eq(-1) ? '-' : m.d === 1 ? String(m.n) : '(' + m.str() + ')') + 'x';
    let bt = '', ba = '';
    if (b.n !== 0 || !mt) {
      if (!mt) { bt = b.tex(); ba = b.str(); }
      else { bt = (b.n < 0 ? ' - ' : ' + ') + b.abs().tex(); ba = (b.n < 0 ? '-' : '+') + b.abs().str(); }
    }
    return { tex: 'y = ' + mt + bt, asc: 'y=' + ma + ba };
  };
  MX.slopeInt = slopeInt;

  // ---------- verifier helpers ----------
  const V = MX.V;
  const SAMPLE_X = [-7.3, -4, -2.5, -1, 0, 0.7, 1.5, 3, 4.2, 6.9];
  // an intercept or point answer lies on the stated equation (and on the stated axis, if any)
  const onEq = (eq, axis) => V.point((x, y) => {
    if (axis === 'x' && !V.close(y, 0)) return 'an x-intercept has y = 0';
    if (axis === 'y' && !V.close(x, 0)) return 'a y-intercept has x = 0';
    return V.satisfies(eq, { x, y }) || 'the point is not on ' + eq;
  });
  // a graph option (data {f, dots}) draws the stated relation: its curve and every marked dot satisfy it
  const drawsRel = (eq) => (d) => {
    const t = V.truth(eq);
    return SAMPLE_X.every((x) => t({ x, y: d.f(x) })) && (d.dots || []).every(([x, y]) => t({ x, y }));
  };

  // ---------- intercepts and graphing lines ----------
  function lineGraph(m, b, o = {}) { return H.graphSvg((x) => m * x + b, o); }
  MX.register({
    id: 'line-standard', section: SEC, title: 'Intercepts & slope-intercept form', kind: 'skill',
    sources: ['Exam 1 #20', 'Exam 3 #11'],
    lesson: T`<p>For a line like \(4x - 3y = -1\):</p>
<ul><li><strong>x-intercept</strong>: set \(y = 0\) and solve for \(x\). The point is \((x, 0)\).</li>
<li><strong>y-intercept</strong>: set \(x = 0\) and solve for \(y\). The point is \((0, y)\).</li>
<li><strong>Slope-intercept form</strong> \(y = mx + b\): solve the equation for \(y\). \(m\) is the slope, \(b\) the y-intercept.</li></ul>
<p>To graph, plot both intercepts and draw the line through them.</p>
<p>Type points as <code>(-1/4, 0)</code>.</p>`,
    variants: {
      intercepts: {
        name: 'Find intercepts and y = mx + b',
        gen(rng) {
          let A, B, C;
          do { A = rng.nz(-6, 6); B = rng.nz(-6, 6); C = rng.nz(-9, 9); } while (MX.gcdAll([A, B, C]) !== 1 || Math.abs(A) === Math.abs(B));
          const xi = new Q(C, A), yi = new Q(C, B), m = new Q(-A, B);
          const px = H.pt(xi, 0), py = H.pt(0, yi), si = slopeInt(m, yi);
          const E = poly([[A, { x: 1 }], [B, { y: 1 }]], ['x', 'y']).tex + ' = ' + C;
          const Eq = poly([[A, { x: 1 }], [B, { y: 1 }]], ['x', 'y']).asc + '=' + C;
          return {
            prompt: T`Use the equation \(${E}\) to answer the questions below.`,
            parts: [
              { label: 'a', ask: 'Find the coordinates of the x-intercept.', kind: 'point', answer: px.asc, show: px.tex, points: 2, verify: onEq(Eq, 'x') },
              { label: 'b', ask: 'Find the coordinates of the y-intercept.', kind: 'point', answer: py.asc, show: py.tex, points: 2, verify: onEq(Eq, 'y') },
              { label: 'c', ask: 'Write the equation of the line in slope-intercept form.', kind: 'eq', form: 'slope', answer: si.asc, show: si.tex, points: 2, verify: V.explicit(Eq) },
            ],
            solution: [
              T`x-intercept: let \(y = 0\): \(${A}x = ${C}\), \(x = ${xi.tex()}\), so \(${px.tex}\)`,
              T`y-intercept: let \(x = 0\): \(${B}y = ${C}\), \(y = ${yi.tex()}\), so \(${py.tex}\)`,
              T`Solve for \(y\): \(${B}y = ${poly([[-A, { x: 1 }], [C, {}]]).tex}\), then divide by ${B}: \(${H.box(si.tex)}\)`,
            ],
          };
        },
      },
      graph: {
        name: 'Graph from standard form',
        gen(rng) {
          let xi, yi;
          do { xi = rng.nz(-8, 8); yi = rng.nz(-8, 8); } while (Math.abs(xi) === Math.abs(yi));
          let A = yi, B = xi, C = xi * yi;
          const g = MX.gcdAll([A, B, C]) * (A < 0 ? -1 : 1);
          A /= g; B /= g; C /= g;
          const E = poly([[A, { x: 1 }], [B, { y: 1 }]], ['x', 'y']).tex + ' = ' + C;
          const Eq = poly([[A, { x: 1 }], [B, { y: 1 }]], ['x', 'y']).asc + '=' + C;
          const m = -yi / xi;
          // each option carries the line and dots it draws
          const L = (mm, bb, dots) => ({ svg: lineGraph(mm, bb, { dots }), d: { f: (x) => mm * x + bb, dots } });
          const cands = [L(m, yi, [[xi, 0], [0, yi]]), L(yi / xi, -yi, [[xi, 0], [0, -yi]]), L(yi / xi, yi, [[-xi, 0], [0, yi]]), L(-xi / yi, xi, [[yi, 0], [0, xi]])];
          const opts = H.choices(rng, cands[0].svg, cands.slice(1).map((c) => c.svg), cands.map((c) => c.d));
          const px = H.pt(xi, 0), py = H.pt(0, yi);
          return {
            prompt: T`Graph the equation \(${E}\).`,
            parts: [
              { label: 'a', ask: 'x-intercept', kind: 'point', answer: px.asc, show: px.tex, points: 1, verify: onEq(Eq, 'x') },
              { label: 'b', ask: 'y-intercept', kind: 'point', answer: py.asc, show: py.tex, points: 1, verify: onEq(Eq, 'y') },
              { label: 'c', ask: 'Which graph is the line?', kind: 'choice', graph: true, options: opts.options, answer: opts.answer, data: opts.data, points: 2, verify: V.choiceData(drawsRel(Eq)) },
            ],
            solution: [
              T`\(y = 0\): \(${A}x = ${C}\), so the x-intercept is \(${px.tex}\)`,
              T`\(x = 0\): \(${B}y = ${C}\), so the y-intercept is \(${py.tex}\)`,
              T`Plot both intercepts and draw the line through them (slope \(${new Q(-yi, xi).tex()}\)).`,
            ],
          };
        },
      },
    },
  });

  // ---------- line through two points ----------
  MX.register({
    id: 'line-two-points', section: SEC, title: 'Line through two points', kind: 'skill',
    sources: ['Exam 1 #24', 'Exam 2 #27'],
    lesson: T`<ol><li>Slope: \(m = \dfrac{y_{2} - y_{1}}{x_{2} - x_{1}}\) (rise over run). Keep the same order on top and bottom.</li>
<li>Find \(b\): substitute \(m\) and one point into \(y = mx + b\) and solve for \(b\).</li>
<li>Write \(y = mx + b\).</li></ol>
<p><strong>Parallel</strong> lines have the same slope. <strong>Perpendicular</strong> slopes are negative reciprocals: flip the fraction and change the sign (\(-\frac{5}{3} \to \frac{3}{5}\)).</p>`,
    variants: {
      frac: {
        name: 'Fraction slope',
        gen(rng) {
          let p, q, b, t1, t2;
          do { q = rng.int(2, 5); p = rng.nz(-6, 6); b = rng.int(-9, 9); t1 = rng.int(-3, 3); t2 = rng.int(-3, 3); } while (MX.gcd(p, q) !== 1 || t1 === t2 || Math.abs(p * t1 + b) > 20 || Math.abs(p * t2 + b) > 20);
          return twoPoints(rng, [q * t1, p * t1 + b], [q * t2, p * t2 + b], new Q(p, q), new Q(b), 'perp');
        },
      },
      int: {
        name: 'Whole-number slope',
        gen(rng) {
          let m, b, x1, x2;
          do { m = rng.nz(-5, 5); b = rng.int(-12, 14); x1 = rng.int(-6, 6); x2 = rng.int(-6, 8); } while (x1 === x2 || Math.abs(m * x1 + b) > 30 || Math.abs(m * x2 + b) > 30);
          return twoPoints(rng, [x1, m * x1 + b], [x2, m * x2 + b], new Q(m), new Q(b), rng.chance(0.7) ? 'perp' : 'par');
        },
      },
    },
  });
  function twoPoints(rng, P1, P2, m, b, kind) {
    const si = slopeInt(m, b);
    // checks built from the two stated points only
    const [x1, y1] = P1, [x2, y2] = P2, slope = () => (y2 - y1) / (x2 - x1);
    const through = `(y-(${y1}))*((${x2})-(${x1}))=((${y2})-(${y1}))*(x-(${x1}))`;
    const vOther = V.custom((a) => (typeof a === 'number' && (kind === 'perp' ? V.close(a * slope(), -1) : V.close(a, slope()))) || 'wrong ' + (kind === 'perp' ? 'perpendicular' : 'parallel') + ' slope');
    const other = kind === 'perp' ? m.inv().neg() : m;
    const dy = P2[1] - P1[1], dx = P2[0] - P1[0];
    return {
      prompt: T`A line passes through the points \(${H.pt(...P1).tex}\) and \(${H.pt(...P2).tex}\).`,
      parts: [
        { label: 'a', ask: 'Find the slope of the line.', kind: 'num', frac: true, answer: m.str(), show: T`m = ${m.tex()}`, pre: 'm =', points: 2, verify: V.value(slope) },
        { label: 'b', ask: 'Find the equation of the line in slope-intercept form.', kind: 'eq', form: 'slope', answer: si.asc, show: si.tex, points: 3, verify: V.explicit(through) },
        { label: 'c', ask: `Find the slope of a line that is ${kind === 'perp' ? 'perpendicular' : 'parallel'} to this line.`, kind: 'num', frac: true, answer: other.str(), show: other.tex(), points: 1, verify: vOther },
      ],
      solution: [
        T`\(m = \dfrac{${P2[1]} - ${MX.par(P1[1])}}{${P2[0]} - ${MX.par(P1[0])}} = \dfrac{${dy}}{${dx}} = ${m.tex()}\)`,
        T`Substitute \(${H.pt(...P1).tex}\) into \(y = mx + b\): \(${P1[1]} = ${m.tex()}\cdot${MX.par(P1[0])} + b\), so \(b = ${b.tex()}\)`,
        T`\(${H.box(si.tex)}\)`,
        kind === 'perp' ? T`Perpendicular slope: flip and change sign: \(${H.box(other.tex())}\)` : T`Parallel lines have the same slope: \(${H.box(other.tex())}\)`,
      ],
    };
  }

  // ---------- parabolas ----------
  function parabola(rng, a) {
    let r1, r2, h, k, c;
    do {
      r1 = rng.int(-6, 6); r2 = rng.int(-6, 6);
      h = (r1 + r2) / 2; k = a * (h - r1) * (h - r2); c = a * r1 * r2;
    } while (r1 >= r2 || (r1 + r2) % 2 !== 0 || Math.abs(k) > 9 || Math.abs(c) > 10 || Math.abs(k) < 1);
    const f = (x) => a * (x - r1) * (x - r2);
    const b = -a * (r1 + r2);
    const E = MX.quad(a, b, c);
    const shift = k > 0 ? -3 : 3;
    const d2 = h !== 0 ? (x) => f(x + 2 * h) : (x) => f(x - 2);
    const opt = (g, dots) => H.graphSvg(g, { dots });
    const gs = [f, (x) => -f(x), d2, (x) => f(x) + shift]; // each option's data is the function it plots
    const opts = H.choices(rng, opt(gs[0], []), gs.slice(1).map((g) => opt(g, [])), gs.map((g) => ({ f: g })));
    // checks built from the displayed equation y = E
    const Ey = V.fn(E.asc, 'x');
    let xr = null; // roots of E = 0, found on first use
    const xs = [H.pt(r1, 0), H.pt(r2, 0)], yi = H.pt(0, c), vx = H.pt(h, k);
    const F1 = poly([[1, { x: 1 }], [-r1, {}]]), F2 = poly([[1, { x: 1 }], [-r2, {}]]);
    return {
      prompt: T`Use the equation \(y = ${E.tex}\) to answer the questions below.`,
      parts: [
        { label: 'a', ask: 'Find the x-intercepts. Write them as ordered pairs.', kind: 'points', answers: [xs[0].asc, xs[1].asc], show: xs[0].tex + '\\text{ and }' + xs[1].tex, joiner: 'and', points: 3, verify: V.pointSet(() => (xr = xr || V.roots(E.asc + '=0')).map((x) => [x, 0])) },
        { label: 'b', ask: 'Find the y-intercept. Write it as an ordered pair.', kind: 'point', answer: yi.asc, show: yi.tex, points: 2, verify: onEq('y=' + E.asc, 'y') },
        { label: 'c', ask: 'Find the vertex. Write it as an ordered pair.', kind: 'point', answer: vx.asc, show: vx.tex, points: 2,
          // on the parabola, and on its axis of symmetry: equal heights at equal distances either side
          verify: V.point((x, y) => (V.close(y, Ey(x)) && [0.5, 1, 2.3, 4].every((t) => V.close(Ey(x - t), Ey(x + t)))) || 'not the turning point of y = ' + E.asc) },
        { label: 'd', ask: 'Which graph shows the parabola?', kind: 'choice', graph: true, options: opts.options, answer: opts.answer, data: opts.data, points: 2, verify: V.choiceData(drawsRel('y=' + E.asc)) },
      ],
      solution: [
        T`x-intercepts: set \(y = 0\) and factor: \(${a < 0 ? '-' : ''}\left(${F1.tex}\right)\left(${F2.tex}\right) = 0\), so \(x = ${r1}\) or \(x = ${r2}\): \(${xs[0].tex}\) and \(${xs[1].tex}\)`,
        T`y-intercept: set \(x = 0\): \(y = ${c}\), so \(${yi.tex}\)`,
        T`Vertex: \(x = -\frac{b}{2a} = -\frac{${b}}{2\left(${a}\right)} = ${h}\); \(y = ${a < 0 ? '-' : ''}${MX.par(h)}^{2} ${MX.sgnTerm(b)}\cdot${MX.par(h)} ${MX.sgnTerm(c)} = ${k}\), so \(${vx.tex}\)`,
        T`The parabola opens ${a > 0 ? 'up' : 'down'} (\(a = ${a}\)), passes through the intercepts, and turns at the vertex.`,
      ],
    };
  }
  MX.register({
    id: 'parabola', section: 'Quadratic equations & functions', title: 'Parabolas: intercepts, vertex, graph', kind: 'skill',
    sources: ['Exam 1 #19', 'Exam 2 #22', 'Exam 3 #27'],
    lesson: T`<p>For \(y = ax^{2} + bx + c\):</p>
<ul><li><strong>x-intercepts</strong>: set \(y = 0\) and solve (factor, or use the quadratic formula).</li>
<li><strong>y-intercept</strong>: set \(x = 0\); it is always \((0, c)\).</li>
<li><strong>Vertex</strong>: \(x = -\frac{b}{2a}\); plug that \(x\) back in to get \(y\).</li>
<li>If \(a \gt 0\) it opens up (vertex is the lowest point); if \(a \lt 0\) it opens down.</li></ul>
<p>The vertex sits exactly halfway between the two x-intercepts.</p>`,
    variants: {
      up: { name: 'Opens up', gen: (rng) => parabola(rng, 1) },
      down: { name: 'Opens down', gen: (rng) => parabola(rng, -1) },
    },
  });

  // ---------- systems ----------
  function eqTex(a, b, c) { return poly([[a, { x: 1 }], [b, { y: 1 }]], ['x', 'y']).tex + ' = ' + c; }
  function eqTexDec(a, b, c) { // a,b,c are tenths
    const f = (v) => (v < 0 ? '-' : '') + (Math.abs(v) < 10 ? '.' + Math.abs(v) : MX.num(Math.abs(v) / 10));
    const t1 = f(a) + 'x', t2 = (b < 0 ? ' - ' : ' + ') + f(Math.abs(b)) + 'y';
    return t1 + t2 + ' = ' + f(c);
  }
  function elimSteps(a1, b1, c1, a2, b2, c2, x0, y0) {
    const L = MX.lcm(Math.abs(b1), Math.abs(b2));
    const m1 = L / b1, m2 = -L / b2;
    const A = m1 * a1 + m2 * a2, Cc = m1 * c1 + m2 * c2;
    const how = m1 === 1 ? T`multiply the second equation by ${m2}` : m2 === 1 ? T`multiply the first equation by ${m1}` : T`multiply the first equation by ${m1} and the second by ${m2}`;
    return [
      T`Eliminate \(y\): ${how}, so the \(y\)-terms are opposites.`,
      T`\(${eqTex(m1 * a1, m1 * b1, m1 * c1)}\) and \(${eqTex(m2 * a2, m2 * b2, m2 * c2)}\)`,
      T`Add them: \(${MX.coef(A)}x = ${Cc}\), so \(x = ${x0}\)`,
      T`Substitute into the first equation: \(${a1}\left(${x0}\right) ${b1 < 0 ? '-' : '+'} ${MX.coef(Math.abs(b1))}y = ${c1}\), so \(y = ${y0}\)`,
      T`\(${H.box(H.pt(x0, y0).tex)}\)`,
    ];
  }
  MX.register({
    id: 'systems', section: SEC, title: 'Solving systems of equations', kind: 'skill',
    sources: ['Exam 1 #25', 'Exam 2 #24', 'Exam 3 #16'],
    lesson: T`<p><strong>Elimination</strong> works well when both equations are in the form \(ax + by = c\):</p>
<ol><li>Multiply one or both equations so the \(x\)-terms (or \(y\)-terms) are opposites.</li><li>Add the equations; one variable disappears.</li>
<li>Solve for the remaining variable.</li><li>Substitute back into either original equation to get the other variable.</li></ol>
<p>With decimals, multiply the equation by 10 (or 100) first to clear them. Always write the answer as an ordered pair \((x, y)\) and check it in both equations.</p>`,
    variants: {
      elim: {
        name: 'Multiply both equations',
        gen(rng) {
          let a1, b1, a2, b2, x0, y0;
          do { a1 = rng.nz(-8, 8); b1 = rng.nz(-6, 6); a2 = rng.nz(-8, 8); b2 = rng.nz(-6, 6); x0 = rng.nz(-6, 6); y0 = rng.nz(-6, 6); } while (a1 * b2 - a2 * b1 === 0 || Math.abs(b1) === Math.abs(b2) || MX.gcd(a1, b1) !== 1 || MX.gcd(a2, b2) !== 1);
          const c1 = a1 * x0 + b1 * y0, c2 = a2 * x0 + b2 * y0;
          return sys(eqTex(a1, b1, c1), eqTex(a2, b2, c2), elimSteps(a1, b1, c1, a2, b2, c2, x0, y0), x0, y0, [[a1, b1, c1], [a2, b2, c2]]);
        },
      },
      scale: {
        name: 'Multiply one equation',
        gen(rng) {
          let a1, b1, a2, k, x0, y0;
          do { a1 = rng.nz(-8, 8); b1 = rng.nz(-6, 6); a2 = rng.nz(-9, 9); k = rng.pick([-3, -2, 2, 3]); x0 = rng.nz(-8, 8); y0 = rng.nz(-8, 8); } while (a1 * k * b1 - a2 * b1 === 0 || MX.gcd(a1, b1) !== 1);
          const b2 = k * b1, c1 = a1 * x0 + b1 * y0, c2 = a2 * x0 + b2 * y0;
          return sys(eqTex(a1, b1, c1), eqTex(a2, b2, c2), elimSteps(a1, b1, c1, a2, b2, c2, x0, y0), x0, y0, [[a1, b1, c1], [a2, b2, c2]]);
        },
      },
      decimal: {
        name: 'Decimal coefficients',
        gen(rng) {
          let a1, b1, a2, b2, x0, y0, c1;
          do { a1 = rng.int(1, 9); b1 = rng.nz(-9, 9); a2 = rng.nz(-9, 9); b2 = rng.nz(-9, 9); x0 = rng.nz(-5, 5); y0 = rng.nz(-5, 5); c1 = a1 * x0 + b1 * y0; } while (a1 * b2 - a2 * b1 === 0 || Math.abs(c1) > 9 || c1 === 0 || Math.abs(b1) === Math.abs(b2) || MX.gcd(a1, b1) !== 1);
          const c2 = a2 * x0 + b2 * y0;
          const steps = [T`Multiply the first equation by 10 to clear the decimals: \(${eqTex(a1, b1, c1)}\)`, ...elimSteps(a1, b1, c1, a2, b2, c2, x0, y0)];
          return sys(eqTexDec(a1, b1, c1), eqTex(a2, b2, c2), steps, x0, y0, [[a1 / 10, b1 / 10, c1 / 10], [a2, b2, c2]]);
        },
      },
    },
  });
  // co: the displayed coefficients [a, b, c] of ax + by = c for each equation; the answer must satisfy both,
  // and the system must have exactly one solution (otherwise a single point is the wrong answer)
  function sys(e1, e2, steps, x0, y0, co) {
    const p = H.pt(x0, y0);
    const eqs = co.map(([a, b, c]) => `${a}x+(${b})y=${c}`);
    const one = !V.close(co[0][0] * co[1][1] - co[1][0] * co[0][1], 0, 1e-12);
    return {
      prompt: T`Solve the system of linear equations algebraically. Write your solution as an ordered pair. \[${e1}\] \[${e2}\]`,
      parts: [{ kind: 'point', answer: p.asc, show: p.tex, points: 3, verify: V.point((x, y) => (one ? V.satisfies(eqs, { x, y }) || 'the point does not satisfy both equations' : 'the system does not have exactly one solution')) }],
      solution: steps,
    };
  }

  // ---------- variation ----------
  const PAIRS = [['y', 'x'], ['x', 'p'], ['d', 't'], ['A', 'r'], ['w', 'n']];
  function modelChoice(rng, u, w, kind) {
    // option 0 was w = k/u, which for inverse variation is the same model as u = k/w (two right options),
    // so inverse questions use u = k/w² instead
    const opts = [kind === 'inverse' ? T`\(${u} = \frac{k}{${w}^{2}}\)` : T`\(${w} = \frac{k}{${u}}\)`, T`\(${u} = \frac{k}{${w}}\)`, T`\(${u} = k${w}\)`, T`\(${w} = k${u}\)`];
    // what each option says, as a residual in (U, W, k) that is 0 when the option holds
    const rels = [kind === 'inverse' ? (U, W, k) => U - k / (W * W) : (U, W, k) => W - k / U, (U, W, k) => U - k / W, (U, W, k) => U - k * W, (U, W, k) => W - k * U];
    const correct = kind === 'direct' ? 2 : 1;
    const order = rng.shuffle([0, 1, 2, 3]);
    // "u varies directly as w" means u/w is the constant k; "inversely" means u·w is k
    const samples = [[2, 3], [5, 0.5], [7, 11], [1.5, 4]].map(([W, k]) => ({ U: kind === 'direct' ? k * W : k / W, W, k }));
    const verify = V.choiceData((rel) => samples.every(({ U, W, k }) => V.close(rel(U, W, k), 0, 1e-9)));
    return { label: 'a', ask: 'Choose the variation model (k is the constant of variation).', kind: 'choice', inline: true, options: order.map((i) => MX.rich(opts[i])), answer: order.indexOf(correct), data: order.map((i) => rels[i]), points: 1, verify };
  }
  MX.register({
    id: 'variation', section: SEC, title: 'Direct & inverse variation', kind: 'skill',
    sources: ['Exam 1 #22', 'Exam 2 #17'],
    lesson: T`<ul><li><strong>Direct</strong>: "\(y\) varies directly as \(x\)" means \(y = kx\). As one grows, so does the other.</li>
<li><strong>Inverse</strong>: "\(x\) varies inversely as \(p\)" means \(x = \frac{k}{p}\). As one grows, the other shrinks.</li>
<li>"...as the square of \(x\)" means use \(x^{2}\) in place of \(x\).</li></ul>
<ol><li>Write the model.</li><li>Plug in the given pair to find \(k\).</li><li>Use the model with that \(k\) to answer the question.</li></ol>`,
    variants: {
      direct: {
        name: 'Direct variation',
        gen(rng) {
          const [u, w] = rng.pick(PAIRS);
          const k = rng.int(2, 12), x1 = rng.int(2, 9), y2 = k * rng.int(2, 15);
          const y1 = k * x1, x2 = y2 / k;
          return {
            prompt: T`Suppose \(${u}\) varies directly as \(${w}\), and \(${u} = ${y1}\) when \(${w} = ${x1}\).`,
            parts: [
              modelChoice(rng, u, w, 'direct'),
              { label: 'b', ask: 'Solve for the constant of variation.', kind: 'num', pre: 'k =', answer: String(k), show: 'k = ' + k, points: 1, verify: V.solves(`${y1}=k*${x1}`, { v: 'k', lo: -1000, hi: 1000, n: 4000 }) },
              { label: 'c', ask: T`Find the value of \(${w}\) when \(${u}\) is ${y2}.`, kind: 'num', pre: w + ' =', answer: String(x2), show: T`${w} = ${x2}`, points: 1, verify: V.solves(`${y2}/x=${y1}/${x1}`, { lo: -1000, hi: 1000, n: 4000 }) },
            ],
            solution: [T`Model: \(${u} = k${w}\)`, T`\(${y1} = k\cdot${x1}\), so \(k = ${k}\)`, T`\(${y2} = ${k}${w}\), so \(${H.box(T`${w} = ${x2}`)}\)`],
          };
        },
      },
      inverse: {
        name: 'Inverse variation',
        gen(rng) {
          const [u, w] = rng.pick(PAIRS);
          let p1, x1, p2, k;
          do { p1 = rng.int(2, 10); x1 = rng.int(2, 60); k = p1 * x1; p2 = rng.int(2, 50); } while (k % p2 !== 0 || p2 === p1 || k > 600);
          const x2 = k / p2;
          return {
            prompt: T`Suppose that \(${u}\) varies inversely as \(${w}\), and \(${u} = ${x1}\) when \(${w} = ${p1}\).`,
            parts: [
              modelChoice(rng, u, w, 'inverse'),
              { label: 'b', ask: 'Find the constant of variation.', kind: 'num', pre: 'k =', answer: String(k), show: 'k = ' + k, points: 1, verify: V.solves(`${x1}=k/${p1}`, { v: 'k', lo: -1000, hi: 1000, n: 4000 }) },
              { label: 'c', ask: T`Find \(${u}\) when \(${w} = ${p2}\).`, kind: 'num', pre: u + ' =', answer: String(x2), show: T`${u} = ${x2}`, points: 2, verify: V.solves(`x*${p2}=${x1}*${p1}`, { lo: -1000, hi: 1000, n: 4000 }) },
            ],
            solution: [T`Model: \(${u} = \frac{k}{${w}}\)`, T`\(${x1} = \frac{k}{${p1}}\), so \(k = ${x1}\cdot${p1} = ${k}\)`, T`\(${u} = \frac{${k}}{${p2}} = ${H.box(String(x2))}\)`],
          };
        },
      },
      square: {
        name: 'Varies as the square',
        gen(rng) {
          const [u, w] = rng.pick(PAIRS);
          const k = rng.int(2, 6), x1 = rng.int(2, 5), x2 = H.intNot(rng, 2, 9, [x1]);
          return {
            prompt: T`\(${u}\) varies directly as the square of \(${w}\). When \(${w} = ${x1}\), \(${u} = ${k * x1 * x1}\).`,
            parts: [
              { label: 'a', ask: 'Find the constant of variation.', kind: 'num', pre: 'k =', answer: String(k), show: 'k = ' + k, points: 1, verify: V.solves(`${k * x1 * x1}=k*${x1}^2`, { v: 'k', lo: -1000, hi: 1000, n: 4000 }) },
              { label: 'b', ask: T`Find \(${u}\) when \(${w} = ${x2}\).`, kind: 'num', pre: u + ' =', answer: String(k * x2 * x2), show: T`${u} = ${k * x2 * x2}`, points: 2, verify: V.solves(`x/${x2}^2=${k * x1 * x1}/${x1}^2`, { lo: -1000, hi: 1000, n: 4000 }) },
            ],
            solution: [T`Model: \(${u} = k${w}^{2}\)`, T`\(${k * x1 * x1} = k\cdot${x1}^{2} = ${x1 * x1}k\), so \(k = ${k}\)`, T`\(${u} = ${k}\cdot${x2}^{2} = ${H.box(String(k * x2 * x2))}\)`],
          };
        },
      },
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);

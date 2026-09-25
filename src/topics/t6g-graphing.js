/* Graphing by hand: "graph it" practice. The student draws the graph on a grid with the grapher's tools
   (line, parabola, points, pen) and the drawing is checked against the equation. Practice only (not on the
   exam), because a drawing needs a pointer and a screen. */
(function (G) {
  'use strict';
  const MX = G.MX;
  const { Q, T, H } = MX;
  const V = MX.V;
  const SEC = 'Graphs, lines & systems';
  const WIN = { xmin: -10, xmax: 10, ymin: -10, ymax: 10, xstep: 1, ystep: 1 };
  const enc = (items) => MX.Plot.encode(items, WIN);
  const plot = (f, o = {}) => `<figure class="vis">${H.fnPlot(Object.assign({ r: 10, pieces: [{ f }], dots: o.dots || [], label: o.label || 'the graph' }, o))}</figure>`;
  // a q/p fraction in TeX and in parser syntax
  const frac = (q) => ({ tex: q.d === 1 ? String(q.n) : (q.n < 0 ? '-' : '') + T`\frac{${Math.abs(q.n)}}{${q.d}}`, asc: q.d === 1 ? String(q.n) : '(' + q.n + '/' + q.d + ')' });
  const coefTex = (q) => (q.eq(1) ? '' : q.eq(-1) ? '-' : frac(q).tex);
  const draw = (o) => Object.assign({ kind: 'draw', win: WIN, points: 3 }, o);

  MX.register({
    id: 'graph-draw', section: SEC, title: 'Graphing by hand', kind: 'skill', practiceOnly: true,
    sources: ['Added: practice with the grapher’s drawing tools'],
    lesson: T`<p>To graph an equation, you find a few points that make it true and connect them with the right shape. You don’t need many points if you know the shape: a line needs two, and a parabola needs its vertex and one more point.</p>
<div class="box how"><h4>How to <b>use the drawing tools</b></h4><ol>
<li><strong>Line:</strong> tap two points the line goes through. The tool draws the whole line.</li>
<li><strong>Parabola:</strong> tap the vertex first, then any other point on the parabola.</li>
<li><strong>Point:</strong> tap to plot points. Points snap to the grid.</li>
<li><strong>Pen:</strong> drag to draw any shape, such as a V for an absolute value graph.</li>
<li>Use <strong>Undo</strong> or <strong>Clear</strong> to fix a mistake, then press <strong>Check</strong>.</li></ol></div>
<h3>Lines</h3>
<div class="box rule"><h4>Rule <b>Slope-intercept form</b></h4><p>In \(y = mx + b\), the graph crosses the y-axis at \((0, b)\) and the slope \(m = \dfrac{\text{rise}}{\text{run}}\) tells you how to move to the next point.</p></div>
<div class="ex"><h4>Example</h4><p>Graph \(y = \frac{2}{3}x - 1\).</p><table class="st">
<tr><td>Start at the y-intercept.</td><td>\((0, -1)\)</td></tr>
<tr><td>The slope is \(\frac{2}{3}\): go up 2 and right 3.</td><td>\((3, 1)\)</td></tr>
<tr><td>Draw the line through the two points.</td><td>Line tool: tap \((0, -1)\), then \((3, 1)\).</td></tr></table></div>
<p>For a line in standard form, \(Ax + By = C\), find the intercepts: set \(x = 0\) to find \(y\), and set \(y = 0\) to find \(x\).</p>
<h3>Parabolas</h3>
<div class="box rule"><h4>Rule <b>Vertex form</b></h4><p>The graph of \(y = a(x - h)^{2} + k\) is a parabola with vertex \((h, k)\). It opens up when \(a > 0\) and down when \(a < 0\). One step right of the vertex, the graph is \(a\) units above (or below) it.</p></div>
<p>For \(y = x^{2} + bx + c\), the vertex is at \(x = -\dfrac{b}{2}\). Substitute that x to find the y-value of the vertex.</p>
<h3>Absolute value and square root graphs</h3>
<p>The graph of \(y = a|x - h| + k\) is a V with its corner at \((h, k)\). The graph of \(y = \sqrt{x - h} + k\) starts at \((h, k)\) and curves to the right. Plot a few points, then draw through them with the pen.</p>
<div class="box warn"><h4>Watch out</h4><p>In \(y = (x - 3)^{2}\) the vertex is at \(x = 3\), not \(x = -3\). The sign inside the parentheses is the opposite of the shift.</p></div>`,
    variants: {
      slope: {
        name: 'Line in slope-intercept form',
        gen(rng) {
          const m = rng.pick([new Q(1), new Q(-1), new Q(2), new Q(-2), new Q(3), new Q(-3), new Q(1, 2), new Q(-1, 2), new Q(2, 3), new Q(-2, 3), new Q(3, 4), new Q(-3, 4), new Q(1, 3)]);
          const b = rng.int(-5, 5);
          const run = m.d, rise = m.n;
          const fm = frac(m);
          const rhsTex = coefTex(m) + 'x' + (b ? ' ' + MX.sgnTerm(b) : '');
          const eq = `y=${fm.asc}x+(${b})`;
          return {
            prompt: T`Graph the line \(y = ${rhsTex}\).`,
            parts: [draw({ answer: `${fm.asc}x+(${b})`, show: T`y = ${rhsTex}`, tools: ['line', 'point', 'pen'], key: enc([{ t: 'line', a: [0, b], b: [run, b + rise] }]), verify: V.drawing(eq) })],
            solution: [
              T`The y-intercept is \(b = ${b}\): plot \((0, ${b})\).`,
              T`The slope is \(${fm.tex} = \frac{${rise}}{${run}}\): from \((0, ${b})\) go ${rise < 0 ? 'down ' + -rise : 'up ' + rise} and right ${run} to \((${run}, ${b + rise})\).`,
              T`Draw the line through the two points.` + plot((x) => m.val() * x + b, { dots: [[0, b], [run, b + rise]], label: 'the line' }),
            ],
          };
        },
      },
      standard: {
        name: 'Line in standard form (intercepts)',
        gen(rng) {
          let xi, yi, A, B, C;
          H.until(() => {
            xi = rng.nz(-6, 6); yi = rng.nz(-6, 6);
            // A x + B y = C through (xi, 0) and (0, yi): A = yi, B = xi, C = xi*yi, reduced
            const g = MX.gcdAll([yi, xi]);
            A = yi / g; B = xi / g; C = (xi * yi) / g;
            if (A < 0) { A = -A; B = -B; C = -C; }
            return true;
          }, () => Math.abs(xi) !== Math.abs(yi) || rng.chance(0.3));
          const lhs = MX.poly([[A, { x: 1 }], [B, { y: 1 }]]);
          return {
            prompt: T`Graph the line \(${lhs.tex} = ${C}\) by finding its intercepts.`,
            parts: [draw({ answer: `(${C}-(${A})x)/(${B})`, show: T`${lhs.tex} = ${C}`, tools: ['line', 'point', 'pen'], key: enc([{ t: 'line', a: [xi, 0], b: [0, yi] }]), verify: V.drawing(`${lhs.asc}=${C}`) })],
            solution: [
              T`x-intercept: set \(y = 0\). Then \(${MX.coef(A)}x = ${C}\), so \(x = ${xi}\): the point \((${xi}, 0)\).`,
              T`y-intercept: set \(x = 0\). Then \(${MX.coef(B)}y = ${C}\), so \(y = ${yi}\): the point \((0, ${yi})\).`,
              T`Draw the line through the two intercepts.` + plot((x) => (C - A * x) / B, { dots: [[xi, 0], [0, yi]], label: 'the line' }),
            ],
          };
        },
      },
      vertex: {
        name: 'Parabola in vertex form',
        gen(rng) {
          const a = rng.pick([new Q(1), new Q(-1), new Q(2), new Q(-2), new Q(1, 2), new Q(-1, 2)]);
          const h = rng.int(-4, 4), k = rng.int(-5, 5);
          const step = a.d === 2 ? 2 : 1, rise = a.val() * step * step;
          const inner = h === 0 ? 'x' : T`x ${MX.sgnTerm(-h)}`;
          const sq = h === 0 ? T`x^{2}` : T`\left(${inner}\right)^{2}`;
          const tex = coefTex(a) + sq + (k ? ' ' + MX.sgnTerm(k) : '');
          const fa = frac(a);
          return {
            prompt: T`Graph the parabola \(y = ${tex}\).`,
            parts: [draw({ answer: `${fa.asc}(x-(${h}))^2+(${k})`, show: T`y = ${tex}`, tools: ['parabola', 'point', 'pen'], key: enc([{ t: 'parabola', a: [h, k], b: [h + step, k + rise] }]), verify: V.drawing(`y=${fa.asc}(x-(${h}))^2+(${k})`) })],
            solution: [
              T`The vertex is \((h, k) = (${h}, ${k})\). The parabola opens ${a.sgn() > 0 ? 'up' : 'down'} because \(a = ${fa.tex}\) is ${a.sgn() > 0 ? 'positive' : 'negative'}.`,
              T`Move ${step} to the right of the vertex: \(y = ${fa.tex}\cdot${step}^{2} + ${MX.par(k)} = ${k + rise}\), so \((${h + step}, ${k + rise})\) is on the graph. By symmetry, so is \((${h - step}, ${k + rise})\).`,
              T`Draw the parabola through these points.` + plot((x) => a.val() * (x - h) * (x - h) + k, { dots: [[h, k], [h + step, k + rise], [h - step, k + rise]], label: 'the parabola' }),
            ],
          };
        },
      },
      standardQuad: {
        name: 'Parabola y = x² + bx + c',
        gen(rng) {
          const h = rng.int(-4, 4), k = rng.int(-6, 3), sgn = rng.chance(0.75) ? 1 : -1;
          const b = -2 * sgn * h, c = sgn * h * h + k;
          const P = MX.quad(sgn, b, c);
          return {
            prompt: T`Graph \(y = ${P.tex}\). Find the vertex first.`,
            parts: [draw({ answer: P.asc, show: T`y = ${P.tex}`, tools: ['parabola', 'point', 'pen'], key: enc([{ t: 'parabola', a: [h, k], b: [h + 1, k + sgn] }]), verify: V.drawing(`y=${P.asc}`) })],
            solution: [
              T`The vertex is at \(x = -\frac{b}{2a} = -\frac{${b}}{2\cdot${MX.par(sgn)}} = ${h}\).`,
              T`Its y-value: \(y = ${MX.quad(sgn, b, c).tex.replace(/x/g, '(' + h + ')')} = ${k}\). The vertex is \((${h}, ${k})\).`,
              T`One step right, \(x = ${h + 1}\) gives \(y = ${k + sgn}\). The parabola opens ${sgn > 0 ? 'up' : 'down'}.` + plot((x) => sgn * x * x + b * x + c, { dots: [[h, k], [h + 1, k + sgn], [h - 1, k + sgn]], label: 'the parabola' }),
            ],
          };
        },
      },
      abs: {
        name: 'Absolute value graph',
        gen(rng) {
          const a = rng.pick([1, -1, 2, -2]), h = rng.int(-4, 4), k = rng.int(-4, 4);
          const f = (x) => a * Math.abs(x - h) + k;
          const tex = MX.coef(a) + T`\left|${h === 0 ? 'x' : T`x ${MX.sgnTerm(-h)}`}\right|` + (k ? ' ' + MX.sgnTerm(k) : '');
          const L = h - 10 / Math.abs(a) - 2, R = h + 10 / Math.abs(a) + 2;
          return {
            prompt: T`Graph \(y = ${tex}\). Use the pen, or plot points first and draw through them.`,
            parts: [draw({ answer: `${a}|x-(${h})|+(${k})`, show: T`y = ${tex}`, tools: ['pen', 'point'], key: enc([{ t: 'stroke', pts: [[L, f(L)], [h, k], [R, f(R)]] }]), verify: V.drawing(`y=${a}|x-(${h})|+(${k})`) })],
            solution: [
              T`The corner of the V is at \((${h}, ${k})\). It opens ${a > 0 ? 'up' : 'down'}.`,
              T`The two sides have slopes \(${a}\) and \(${-a}\): one step right of the corner, \(y = ${k + a}\), and one step left, also \(${k + a}\).`,
              T`Draw the two straight sides from the corner.` + plot(f, { dots: [[h, k], [h + 1, k + a], [h - 1, k + a]], label: 'the V-shaped graph' }),
            ],
          };
        },
      },
      sqrt: {
        name: 'Square root graph',
        gen(rng) {
          const h = rng.int(-6, 2), k = rng.int(-4, 3);
          const f = (x) => Math.sqrt(x - h) + k;
          const pts = [];
          for (let x = h; x <= 10; x += 0.25) pts.push([x, f(x)]);
          const tex = T`\sqrt{${h === 0 ? 'x' : T`x ${MX.sgnTerm(-h)}`}}` + (k ? ' ' + MX.sgnTerm(k) : '');
          return {
            prompt: T`Graph \(y = ${tex}\). Plot a few points, then draw through them with the pen.`,
            parts: [draw({ answer: `sqrt(x-(${h}))+(${k})`, show: T`y = ${tex}`, tools: ['pen', 'point'], key: enc([{ t: 'stroke', pts }]), verify: V.drawing(`y=sqrt(x-(${h}))+(${k})`) })],
            solution: [
              T`The graph starts where the inside is 0: \(x = ${h}\), at the point \((${h}, ${k})\).`,
              T`Easy points use perfect squares: \(x = ${h + 1}\) gives \(y = ${k + 1}\), \(x = ${h + 4}\) gives \(y = ${k + 2}\), \(x = ${h + 9}\) gives \(y = ${k + 3}\).`,
              T`Draw a smooth curve from \((${h}, ${k})\) through those points, bending to the right.` + plot(f, { dots: [[h, k], [h + 1, k + 1], [h + 4, k + 2], [h + 9, k + 3]].filter((p) => p[0] <= 10), label: 'the square root graph' }),
            ],
          };
        },
      },
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);

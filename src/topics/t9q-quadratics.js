/* Quadratic equations & functions: completing the square, discriminant, quadratic form,
   vertex form and transformations, quadratic inequalities, and projectile / max-min applications */
(function (G) {
  'use strict';
  const MX = G.MX;
  const { Q, T, H, S, poly } = MX;
  const SEC = 'Quadratic equations & functions';
  const ADDED = 'Added';
  const SQF = [2, 3, 5, 6, 7, 10, 11, 13];
  const INF = Infinity;
  const sq = (h) => (h ? T`\left(x ${MX.sgnTerm(-h)}\right)^{2}` : 'x^{2}');
  const sqA = (h) => (h ? `(x${h > 0 ? '-' + h : '+' + -h})^2` : 'x^2');
  const coef = (a) => (a === 1 ? '' : a === -1 ? '-' : String(a));
  // "h ± √r" as answers and TeX; r may be a perfect square
  function pmRoots(h, r) {
    const s = Math.sqrt(r);
    if (Number.isInteger(s)) return { answers: [String(h + s), String(h - s)], tex: T`x = ${h + s} \text{ or } x = ${h - s}`, exact: false };
    const p = MX.sqrtParts(r), rt = (p.out === 1 ? '' : p.out) + '\\sqrt{' + p.in + '}', ra = (p.out === 1 ? '' : p.out) + '√(' + p.in + ')';
    return { answers: [h + '+' + ra, h + '-' + ra], tex: T`x = ${h === 0 ? '' : h} \pm ${rt}`, exact: true };
  }
  const setOfVals = (vals) => {
    const u = [];
    vals.forEach((v) => { if (!u.some((w) => Math.abs(w.v - v.v) < 1e-9)) u.push(v); });
    u.sort((a, b) => a.v - b.v);
    return u.length
      ? { kind: 'set', answers: u.map((x) => x.a), answer: '{' + u.map((x) => x.a).join(', ') + '}', show: u.map((x) => 'x = ' + x.t).join('\\ \\text{ or }\\ ') }
      : { kind: 'set', answers: [], answer: 'no solution', show: '\\text{no solution}' };
  };
  const num = (v) => ({ v, a: String(v), t: MX.texNum(v) });

  // ---------- local verifier helpers (independent re-derivations from the displayed expressions) ----------
  const cl = (a, b) => MX.V.close(a, b, 1e-9);
  // a, b, c of a displayed quadratic, read back from its values at -1, 0, 1
  function coefsOf(asc, v = 'x') {
    const f = MX.V.fn(asc, v), c = f(0);
    return { a: (f(1) + f(-1)) / 2 - c, b: (f(1) - f(-1)) / 2, c };
  }
  // x = x0 is an axis of symmetry of f (f(x0 + t) = f(x0 - t))
  const isAxis = (f, x0) => [0.7, 1.9, 3.3].every((t) => cl(f(x0 + t), f(x0 - t)));
  // the axis of symmetry of a parabola by symmetry: the midpoint of the solutions of f(x) = f(0), found numerically
  function symAxis(asc, v = 'x', span = 1000) {
    const f = MX.V.fn(asc, v), rs = MX.V.roots({ lhs: MX.V.parse(asc), rhs: { t: 'num', v: f(0) } }, { v, lo: -span, hi: span });
    return rs === 'all' || !rs.length || rs.length > 2 ? NaN : (rs[0] + rs[rs.length - 1]) / 2;
  }
  // exact sign of the integer-coefficient quadratic "asc" at a double x (BigInt arithmetic), as an inequality spec for
  // V.region: near a double root the values are far below V.region's equality tolerance, so floating point can't decide
  function exactIneq(asc, op) {
    const k = coefsOf(asc), [A, B, C] = [k.a, k.b, k.c].map((z) => BigInt(Math.round(z)));
    return (env) => {
      let x = env.x, e = 0n;
      if (!isFinite(x)) return false;
      while (!Number.isInteger(x)) { x *= 2; e++; }
      const n = BigInt(x), d = 1n << e, v = A * n * n + B * n * d + C * d * d, sg = v > 0n ? 1 : v < 0n ? -1 : 0;
      return { '<': sg < 0, '<=': sg <= 0, '>': sg > 0, '>=': sg >= 0 }[op];
    };
  }
  // number of real solutions of the quadratic equation "asc = 0": find the vertex by symmetry, then compare the
  // sign of the vertex value with the direction of opening (robust for double roots that sampling can miss)
  function nRoots(asc) {
    const f = MX.V.fn(asc, 'x'), x0 = symAxis(asc), k = coefsOf(asc), y0 = f(x0);
    if (!isFinite(y0) || !k.a) return NaN;
    if (Math.abs(y0) <= 1e-9 * Math.max(1, Math.abs(k.c), (k.b * k.b) / Math.abs(k.a))) return 1;
    return (y0 > 0) === (k.a > 0) ? 0 : 2;
  }
  const rootOf = (u) => { // real solutions of x^2 = u, as set entries
    if (u < 0) return [];
    if (u === 0) return [num(0)];
    const s = Math.sqrt(u);
    if (Number.isInteger(s)) return [num(s), num(-s)];
    const p = MX.sqrtParts(u), t = (p.out === 1 ? '' : p.out) + '\\sqrt{' + p.in + '}', a = (p.out === 1 ? '' : p.out) + '√(' + p.in + ')';
    return [{ v: s, a, t }, { v: -s, a: '-' + a, t: '-' + t }];
  };

  // ================= completing the square =================
  MX.register({
    id: 'quad-complete', section: SEC, title: 'Completing the square', kind: 'skill', sources: [ADDED],
    slots: [{ label: 'Completing the square', source: ADDED, pool: ['makeSquare', 'solve1', 'solveA', 'vertexForm'] }],
    lesson: T`<p>Some trinomials are perfect squares: \(x^{2} + 6x + 9 = \left(x + 3\right)^{2}\). <strong>Completing the square</strong> means adding the one number that turns \(x^{2} + bx\) into a perfect square like that. Once one side is a square, you can solve with square roots. It works for every quadratic equation, even ones that don't factor.</p>
<div class="box def"><h4>Definition <b>Perfect-square trinomial</b></h4><p>A <strong>perfect-square trinomial</strong> is a trinomial that equals a binomial squared, such as \(x^{2} - 10x + 25 = \left(x - 5\right)^{2}\).</p></div>
<h3>Find the number that completes the square</h3>
<p>Look at \(\left(x + 3\right)^{2} = x^{2} + 6x + 9\). The 3 is half of 6, and the 9 is \(3^{2}\). That pattern always holds.</p>
<div class="box rule"><h4>Rule <b>Completing the square</b></h4><p>To complete the square on \(x^{2} + bx\), take half of \(b\) and square it. Adding that number makes a binomial squared:</p>
\[x^{2} + bx + \left(\frac{b}{2}\right)^{2} = \left(x + \frac{b}{2}\right)^{2}\]</div>
<p>For \(x^{2} - 10x\): half of \(-10\) is \(-5\), and \(\left(-5\right)^{2} = 25\). So \(x^{2} - 10x + 25 = \left(x - 5\right)^{2}\). The number inside the binomial is half of \(b\), sign included.</p>
<h3>Solve an equation by completing the square</h3>
<div class="box how"><h4>How to <b>solve \(ax^{2} + bx + c = 0\) by completing the square</b></h4><ol>
<li>If \(a \ne 1\), divide every term by \(a\).</li>
<li>Move the constant to the right side.</li>
<li>Take half of the \(x\)-coefficient, square it, and add it to <em>both</em> sides.</li>
<li>Write the left side as a binomial squared.</li>
<li>Take the square root of both sides. Write \(\pm\) on the right.</li>
<li>Solve for \(x\) and simplify any radical.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Solve \(2x^{2} + 8x - 6 = 0\).</p><table class="st">
<tr><td>Divide every term by 2.</td><td>\(x^{2} + 4x - 3 = 0\)</td></tr>
<tr><td>Move the constant to the right.</td><td>\(x^{2} + 4x = 3\)</td></tr>
<tr><td>Half of 4 is 2, and \(2^{2} = 4\). Add 4 to both sides.</td><td>\(x^{2} + 4x + 4 = 3 + 4\)</td></tr>
<tr><td>Write the left side as a square.</td><td>\(\left(x + 2\right)^{2} = 7\)</td></tr>
<tr><td>Take square roots, with \(\pm\).</td><td>\(x + 2 = \pm\sqrt{7}\)</td></tr>
<tr><td>Subtract 2.</td><td>\(x = -2 \pm \sqrt{7}\)</td></tr></table></div>
<h3>Rewrite a function in vertex form</h3>
<p>The same idea turns \(y = ax^{2} + bx + c\) into <strong>vertex form</strong> \(y = a\left(x - h\right)^{2} + k\), which shows the vertex \(\left(h, k\right)\) of the parabola. There is no other side to add to here, so you add the number inside and take away the same amount outside.</p>
<div class="ex"><h4>Example</h4><p>Write \(y = 2x^{2} + 8x + 1\) in vertex form.</p><table class="st">
<tr><td>Factor 2 out of the \(x\)-terms.</td><td>\(y = 2\left(x^{2} + 4x\right) + 1\)</td></tr>
<tr><td>Add 4 inside. That really adds \(2 \cdot 4 = 8\), so subtract 8 outside.</td><td>\(y = 2\left(x^{2} + 4x + 4\right) + 1 - 8\)</td></tr>
<tr><td>Write the square and combine.</td><td>\(y = 2\left(x + 2\right)^{2} - 7\)</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>Whatever you add, add it to both sides of an equation. In vertex form, a number you add inside the parentheses gets multiplied by \(a\), so subtract \(a\) times that number outside.</p></div>`,
    variants: {
      makeSquare: {
        name: 'Make a perfect square',
        gen(rng) {
          const b = rng.nz(-12, 12), half = new Q(b, 2), c = half.mul(half);
          const f = MX.poly([[1, { x: 1 }], [half, {}]]);
          return {
            prompt: T`Find the number that makes \(${MX.quad(1, b, 0).tex} + \square\) a perfect-square trinomial, then write the trinomial as a binomial squared.`,
            parts: [
              { label: 'a', ask: 'The missing number', kind: 'num', frac: true, answer: c.str(), show: c.tex(), points: 1,
                // x^2 + bx + m is a perfect square exactly when it has a single (double) root
                verify: MX.V.custom((m) => typeof m === 'number' && nRoots(`${MX.quad(1, b, 0).asc}+(${m})`) === 1 && cl(coefsOf(`${MX.quad(1, b, 0).asc}+(${m})`).b ** 2, 4 * m) || 'x^2 + bx + m is not a perfect square') },
              { label: 'b', ask: 'The trinomial as a binomial squared', kind: 'factor', answer: '(' + f.asc + ')^2', factors: [f.asc, f.asc], show: T`\left(${f.tex}\right)^{2}`, points: 2, verify: MX.V.equiv(`${MX.quad(1, b, 0).asc}+(${b}/2)^2`) },
            ],
            solution: [T`Half of \(${b}\) is \(${half.tex()}\); squared, \(\left(${half.tex()}\right)^{2} = ${c.tex()}\).`, T`\(${MX.quad(1, b, 0).tex} + ${c.tex()} = ${H.box(T`\left(${f.tex}\right)^{2}`)}\)`],
          };
        },
      },
      solve1: {
        name: 'Solve (leading coefficient 1)',
        gen(rng) {
          const h = rng.nz(-7, 7), r = rng.pick([...SQF, ...SQF, 4, 9, 16, 12, 18, 20]);
          const b = -2 * h, c = h * h - r, R = pmRoots(h, r), moved = rng.chance(0.4);
          const eq = moved ? T`x^{2} ${MX.sgnTerm(b)}x = ${-c}` : T`${MX.quad(1, b, c).tex} = 0`;
          return {
            prompt: T`Solve by completing the square: \(${eq}\). Leave answers exact (simplified radicals).`,
            parts: [{ kind: 'nums', count: 2, var: 'x', pre: 'x =', joiner: 'or', exact: R.exact, radical: true, answers: R.answers, show: R.tex, points: 4,
              verify: MX.V.solves(moved ? `x^2+(${b})x=${-c}` : `${MX.quad(1, b, c).asc}=0`) }],
            solution: [
              moved ? T`The constant is already on the right.` : T`Move the constant: \(x^{2} ${MX.sgnTerm(b)}x = ${-c}\)`,
              T`Half of ${b} is ${-h}; \(\left(${-h}\right)^{2} = ${h * h}\). Add it to both sides: \(x^{2} ${MX.sgnTerm(b)}x + ${h * h} = ${-c} + ${h * h} = ${r}\)`,
              T`Factor: \(${sq(h)} = ${r}\), so \(x ${MX.sgnTerm(-h)} = \pm\sqrt{${r}}\).`,
              T`\(${H.box(R.tex)}\)`,
            ],
          };
        },
      },
      solveA: {
        name: 'Solve (leading coefficient not 1)',
        gen(rng) {
          const a = rng.pick([2, 3, 4, 5]), h = rng.nz(-5, 5), r = rng.pick([...SQF, 4, 9, 12]);
          const b = -2 * a * h, c = a * (h * h - r), R = pmRoots(h, r);
          return {
            prompt: T`Solve by completing the square: \(${MX.quad(a, b, c).tex} = 0\). Leave answers exact.`,
            parts: [{ kind: 'nums', count: 2, var: 'x', pre: 'x =', joiner: 'or', exact: R.exact, radical: true, answers: R.answers, show: R.tex, points: 4, verify: MX.V.solves(`${MX.quad(a, b, c).asc}=0`) }],
            solution: [
              T`Divide every term by ${a}: \(${MX.quad(1, -2 * h, h * h - r).tex} = 0\)`,
              T`Move the constant and add \(\left(${-h}\right)^{2} = ${h * h}\) to both sides: \(${sq(h)} = ${r}\)`,
              T`\(x ${MX.sgnTerm(-h)} = \pm\sqrt{${r}}\): \(${H.box(R.tex)}\)`,
            ],
          };
        },
      },
      vertexForm: {
        name: 'Rewrite in vertex form',
        gen(rng) {
          const a = rng.pick([1, 1, 2, -1, 3, -2]), h = rng.nz(-6, 6), k = rng.int(-12, 12);
          const b = -2 * a * h, c = a * h * h + k;
          const ans = coef(a) + sqA(h) + (k ? (k > 0 ? '+' : '-') + Math.abs(k) : '');
          const ansT = coef(a) + sq(h) + (k ? ' ' + MX.sgnTerm(k) : '');
          return {
            prompt: T`Complete the square to write \(y = ${MX.quad(a, b, c).tex}\) in vertex form \(y = a(x - h)^{2} + k\).`,
            parts: [{ kind: 'expr', form: 'vertex', pre: 'y =', vars: ['x'], answer: ans, show: 'y = ' + ansT, points: 3, verify: MX.V.equiv(MX.quad(a, b, c).asc) }],
            solution: [
              a === 1 ? T`Group the \(x\)-terms: \(y = \left(x^{2} ${MX.sgnTerm(-2 * h)}x\right) ${MX.sgnTerm(c)}\)` : T`Factor ${a} from the \(x\)-terms: \(y = ${a}\left(x^{2} ${MX.sgnTerm(-2 * h)}x\right) ${MX.sgnTerm(c)}\)`,
              T`Add and subtract \(\left(${-h}\right)^{2} = ${h * h}\) inside: ${a === 1 ? T`\(y = \left(x^{2} ${MX.sgnTerm(-2 * h)}x + ${h * h}\right) ${MX.sgnTerm(c)} - ${h * h}\)` : T`adding ${h * h} inside the parentheses adds \(${a}\cdot${h * h} = ${a * h * h}\), so subtract ${a * h * h} outside.`}`,
              T`\(${H.box('y = ' + ansT)}\) (vertex \((${h}, ${k})\))`,
            ],
          };
        },
      },
    },
  });

  // ================= the discriminant =================
  const TYPES = ['Two real solutions', 'One real solution (a repeated root)', 'Two complex (non-real) solutions'];
  function discCase(rng, kind) {
    for (;;) {
      const a = rng.nz(-5, 6), b = rng.int(-10, 10), c = rng.int(-10, 10), D = b * b - 4 * a * c;
      if (kind === 'pos' && D > 0) return { a, b, c, D };
      if (kind === 'neg' && D < 0) return { a, b, c, D };
      if (kind === 'zero') { const p = rng.int(1, 4), q = rng.nz(-6, 6), s = rng.pick([1, -1]); return { a: s * p * p, b: s * 2 * p * q, c: s * q * q, D: 0 }; }
    }
  }
  MX.register({
    id: 'quad-discriminant', section: SEC, title: 'The discriminant', kind: 'skill', sources: [ADDED],
    slots: [{ label: 'The discriminant', source: ADDED, pool: ['classify', 'intercepts', 'findK'] }],
    lesson: T`<p>The quadratic formula solves \(ax^{2} + bx + c = 0\): \(x = \dfrac{-b \pm \sqrt{b^{2} - 4ac}}{2a}\). The number under the square root tells you how many solutions there are, and what kind, before you do any other work.</p>
<div class="box def"><h4>Definition <b>Discriminant</b></h4><p>For \(ax^{2} + bx + c = 0\), the <strong>discriminant</strong> is \(D = b^{2} - 4ac\), the expression under the square root in the quadratic formula.</p></div>
<h3>What the discriminant tells you</h3>
<p>The formula adds and subtracts \(\sqrt{D}\). If \(D\) is positive, that gives two different answers. If \(D = 0\), adding and subtracting 0 gives the same answer twice. If \(D\) is negative, there is no real square root.</p>
<div class="box rule"><h4>Rule <b>Using the discriminant</b></h4><ul>
<li>\(D \gt 0\): two real solutions. If \(D\) is a perfect square (1, 4, 9, …), they are rational.</li>
<li>\(D = 0\): one real solution, called a repeated root.</li>
<li>\(D \lt 0\): no real solutions. There are two complex (non-real) solutions.</li></ul></div>
<div class="ex"><h4>Example</h4><p>How many solutions does \(2x^{2} + 3 = 5x\) have, and what kind?</p><table class="st">
<tr><td>Get 0 on one side first.</td><td>\(2x^{2} - 5x + 3 = 0\)</td></tr>
<tr><td>Read \(a\), \(b\), \(c\) with their signs.</td><td>\(a = 2,\ b = -5,\ c = 3\)</td></tr>
<tr><td>Compute the discriminant.</td><td>\(D = \left(-5\right)^{2} - 4\left(2\right)\left(3\right) = 25 - 24 = 1\)</td></tr>
<tr><td>\(D \gt 0\) and 1 is a perfect square.</td><td>two real, rational solutions</td></tr></table></div>
<h3>Counting x-intercepts</h3>
<p>The \(x\)-intercepts of \(f(x) = ax^{2} + bx + c\) are the real solutions of \(f(x) = 0\). So the discriminant also counts them: \(D \gt 0\) means the parabola crosses the \(x\)-axis twice, \(D = 0\) means its vertex just touches the axis, and \(D \lt 0\) means it never reaches the axis (0 intercepts).</p>
<h3>Choosing a coefficient for exactly one solution</h3>
<p>"Exactly one real solution" means \(D = 0\). Set the discriminant equal to 0 and solve for the unknown coefficient.</p>
<div class="ex"><h4>Example</h4><p>Find every \(k\) for which \(x^{2} + kx + 16 = 0\) has exactly one real solution.</p><table class="st">
<tr><td>Write \(D\) with \(a = 1\), \(b = k\), \(c = 16\).</td><td>\(D = k^{2} - 4\left(1\right)\left(16\right) = k^{2} - 64\)</td></tr>
<tr><td>Set \(D = 0\).</td><td>\(k^{2} - 64 = 0\)</td></tr>
<tr><td>Solve. Both signs work.</td><td>\(k = 8 \text{ or } k = -8\)</td></tr>
<tr><td>Check \(k = 8\).</td><td>\(x^{2} + 8x + 16 = \left(x + 4\right)^{2}\) ✓</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>Write the equation as \(ax^{2} + bx + c = 0\) before you read off \(a\), \(b\) and \(c\), and keep their signs. Squaring a negative \(b\) gives a positive number: \(\left(-5\right)^{2} = 25\), not \(-25\).</p></div>`,
    variants: {
      classify: {
        name: 'Number and type of solutions',
        gen(rng) {
          const kind = rng.pick(['pos', 'zero', 'neg']), { a, b, c, D } = discCase(rng, kind);
          const idx = kind === 'pos' ? 0 : kind === 'zero' ? 1 : 2;
          const E = MX.quad(a, b, c).asc;
          let nr = null; const nReal = () => (nr === null ? (nr = nRoots(E)) : nr);
          return {
            prompt: T`Use the discriminant to determine the number and type of solutions of \(${MX.quad(a, b, c).tex} = 0\).`,
            parts: [
              { label: 'a', ask: T`The discriminant \(b^{2} - 4ac\)`, kind: 'num', answer: String(D), points: 2,
                verify: MX.V.value(() => { const k = coefsOf(E); return k.b * k.b - 4 * k.a * k.c; }) },
              { label: 'b', ask: 'Number and type of solutions', kind: 'choice', options: TYPES, answer: idx, points: 1,
                // count the real roots of the displayed equation numerically: 2, 1 (touching), or 0
                verify: MX.V.choice((i) => [2, 1, 0][i] === nReal()) },
            ],
            solution: [T`\(a = ${a}\), \(b = ${b}\), \(c = ${c}\).`, T`\(D = ${MX.par(b)}^{2} - 4\left(${a}\right)\left(${c}\right) = ${b * b} ${MX.sgnTerm(-4 * a * c)} = ${D}\)`, T`\(D ${D > 0 ? '\\gt' : D === 0 ? '=' : '\\lt'} 0\): ${TYPES[idx].toLowerCase()}.`],
          };
        },
      },
      intercepts: {
        name: 'How many x-intercepts?',
        gen(rng) {
          const kind = rng.pick(['pos', 'zero', 'neg']), { a, b, c, D } = discCase(rng, kind);
          const n = D > 0 ? 2 : D === 0 ? 1 : 0;
          return {
            prompt: T`How many \(x\)-intercepts does the graph of \(f(x) = ${MX.quad(a, b, c).tex}\) have?`,
            parts: [{ kind: 'num', answer: String(n), points: 2, verify: MX.V.value(() => nRoots(MX.quad(a, b, c).asc)) }],
            solution: [T`\(x\)-intercepts are the real solutions of \(f(x) = 0\).`, T`\(D = ${MX.par(b)}^{2} - 4\left(${a}\right)\left(${c}\right) = ${D}\)`, T`\(D ${D > 0 ? '\\gt' : D === 0 ? '=' : '\\lt'} 0\), so there ${n === 1 ? 'is' : 'are'} \(${H.box(String(n))}\) \(x\)-intercept${n === 1 ? '' : 's'}.`],
          };
        },
      },
      findK: {
        name: 'Choose a coefficient for one solution',
        gen(rng) {
          if (rng.chance(0.5)) {
            const s = rng.int(1, 9), a = rng.pick([1, 1, 4, 9]), c = s * s;
            const k = 2 * Math.sqrt(a) * s;
            return {
              prompt: T`Find every value of \(k\) for which \(${coef(a)}x^{2} + kx + ${c} = 0\) has exactly one real solution.`,
              parts: [{ kind: 'nums', count: 2, pre: 'k =', joiner: 'or', answers: [String(k), String(-k)], show: T`k = \pm ${k}`, points: 3,
                verify: MX.V.all(
                  MX.V.solves(`k^2-4(${a})(${c})=0`, { v: 'k' }),
                  MX.V.custom((ks) => ks.every((kk) => nRoots(`${a}x^2+(${kk})x+${c}`) === 1) || 'some k does not give exactly one real solution')) }],
              solution: [T`One solution means \(D = 0\): \(k^{2} - 4\left(${a}\right)\left(${c}\right) = 0\).`, T`\(k^{2} = ${4 * a * c}\), so \(k = \pm${k}\).`, T`\(${H.box(T`k = ${k} \text{ or } k = -${k}`)}\)`],
            };
          }
          const b = rng.nz(-12, 12), c = new Q(b * b, 4);
          return {
            prompt: T`Find the value of \(c\) for which \(${MX.quad(1, b, 0).tex} + c = 0\) has exactly one real solution.`,
            parts: [{ kind: 'num', frac: true, pre: 'c =', answer: c.str(), show: 'c = ' + c.tex(), points: 3,
              verify: MX.V.custom((cc) => (typeof cc === 'number' && nRoots(`${MX.quad(1, b, 0).asc}+(${cc})`) === 1) || 'the equation does not have exactly one real solution for this c') }],
            solution: [T`One solution means \(D = b^{2} - 4ac = 0\): \(${MX.par(b)}^{2} - 4c = 0\).`, T`\(4c = ${b * b}\), so \(${H.box('c = ' + c.tex())}\)`],
          };
        },
      },
    },
  });

  // ================= equations in quadratic form =================
  const HINT = 'List every real solution, separated by commas.';
  MX.register({
    id: 'quad-form', section: SEC, title: 'Equations in quadratic form', kind: 'skill', sources: [ADDED],
    slots: [{ label: 'Equations in quadratic form', source: ADDED, pool: ['biquad', 'shifted', 'sqrtX', 'fracExp', 'negExp'] }],
    lesson: T`<p>Some equations are not quadratic, but they have the same shape as one: <em>something squared</em>, plus a number times <em>that same something</em>, plus a constant. If you give that "something" a new name, \(u\), the equation becomes an ordinary quadratic that you already know how to solve.</p>
<div class="box def"><h4>Definition <b>Quadratic form</b></h4><p>An equation is in <strong>quadratic form</strong> if a substitution \(u = \) (an expression in \(x\)) turns it into \(au^{2} + bu + c = 0\). The expression in the middle term is \(u\), and the leading term must be \(u^{2}\).</p></div>
<h3>Choosing u</h3>
<p>Look at the middle term. Its variable part is \(u\). Then check that the first term is the square of it.</p>
<ul>
<li>\(x^{4} - 13x^{2} + 36 = 0\): let \(u = x^{2}\), since \(\left(x^{2}\right)^{2} = x^{4}\).</li>
<li>\(\left(x - 2\right)^{2} + 3\left(x - 2\right) - 10 = 0\): let \(u = x - 2\).</li>
<li>\(x - 5\sqrt{x} + 6 = 0\): let \(u = \sqrt{x}\), since \(\left(\sqrt{x}\right)^{2} = x\).</li>
<li>\(x^{2/3} - x^{1/3} - 6 = 0\): let \(u = x^{1/3}\), since \(\left(x^{1/3}\right)^{2} = x^{2/3}\).</li>
<li>\(x^{-2} - 7x^{-1} + 12 = 0\): let \(u = x^{-1}\), since \(\left(x^{-1}\right)^{2} = x^{-2}\).</li></ul>
<div class="box how"><h4>How to <b>solve an equation in quadratic form</b></h4><ol>
<li>Choose \(u\) and rewrite the equation as \(au^{2} + bu + c = 0\).</li>
<li>Solve for \(u\) by factoring or the quadratic formula.</li>
<li>Substitute back: replace \(u\) with its expression in \(x\), and solve each equation for \(x\).</li>
<li>Check each answer in the original equation.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Solve \(x^{4} - 5x^{2} + 4 = 0\).</p><table class="st">
<tr><td>Let \(u = x^{2}\), so \(u^{2} = x^{4}\).</td><td>\(u^{2} - 5u + 4 = 0\)</td></tr>
<tr><td>Factor and solve for \(u\).</td><td>\(\left(u - 1\right)\left(u - 4\right) = 0,\ u = 1 \text{ or } u = 4\)</td></tr>
<tr><td>Substitute back and solve.</td><td>\(x^{2} = 1\) or \(x^{2} = 4\)</td></tr>
<tr><td>Each gives two solutions.</td><td>\(x = -2, -1, 1, 2\)</td></tr></table></div>
<h3>Getting back to x</h3>
<p>Undo whatever \(u\) did to \(x\). If \(u = x^{2}\), take square roots (\(\pm\)). If \(u = \sqrt{x}\), square. If \(u = x^{1/3}\), cube. If \(u = x^{-1} = \frac{1}{x}\), flip: \(x = \frac{1}{u}\).</p>
<div class="ex"><h4>Example</h4><p>Solve \(x - 3\sqrt{x} - 4 = 0\).</p><table class="st">
<tr><td>Let \(u = \sqrt{x}\), so \(u^{2} = x\).</td><td>\(u^{2} - 3u - 4 = 0\)</td></tr>
<tr><td>Factor and solve for \(u\).</td><td>\(\left(u - 4\right)\left(u + 1\right) = 0,\ u = 4 \text{ or } u = -1\)</td></tr>
<tr><td>\(\sqrt{x} = 4\): square both sides.</td><td>\(x = 16\)</td></tr>
<tr><td>\(\sqrt{x} = -1\) is impossible, because a square root is never negative.</td><td>no solution from this one</td></tr>
<tr><td>Check: \(16 - 3\sqrt{16} - 4 = 16 - 12 - 4\).</td><td>\(= 0\) ✓, so \(x = 16\)</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>Solving for \(u\) is only halfway. Always substitute back and solve for \(x\). Throw out impossible cases: \(\sqrt{x}\) can't be negative, and \(x^{2}\) can't be negative for a real \(x\).</p></div>`,
    variants: {
      biquad: {
        name: 'Fourth degree (u = x²)',
        gen(rng) {
          let p, q; do { p = rng.pick([1, 4, 9, 16, 2, 3, 5]); q = rng.pick([1, 4, 9, 25, 3, -1, -4, -9, 6]); } while (p === q);
          const sols = [...rootOf(p), ...rootOf(q)];
          return {
            prompt: T`Solve: \(${poly([[1, { x: 4 }], [-(p + q), { x: 2 }], [p * q, {}]]).tex} = 0\)`,
            parts: [Object.assign(setOfVals(sols), { ask: HINT, points: 4, verify: MX.V.solves(`${poly([[1, { x: 4 }], [-(p + q), { x: 2 }], [p * q, {}]]).asc}=0`) })],
            solution: [
              T`Let \(u = x^{2}\): \(${MX.quad(1, -(p + q), p * q, 'u').tex} = 0\), so \(\left(u ${MX.sgnTerm(-p)}\right)\left(u ${MX.sgnTerm(-q)}\right) = 0\) and \(u = ${p}\) or \(u = ${q}\).`,
              T`Back-substitute: ${[p, q].map((u) => (u < 0 ? T`\(x^{2} = ${u}\) has no real solution` : T`\(x^{2} = ${u}\) gives \(x = \pm${Number.isInteger(Math.sqrt(u)) ? Math.sqrt(u) : '\\sqrt{' + u + '}'}\)`)).join('; ')}.`,
              T`\(${H.box(setOfVals(sols).show)}\)`,
            ],
          };
        },
      },
      shifted: {
        name: 'Substitute for a binomial',
        gen(rng) {
          let p, q; do { p = rng.nz(-8, 8); q = rng.nz(-8, 8); } while (p === q || p + q === 0);
          const d = rng.nz(-6, 6), B = MX.lin(1, d);
          const sols = [num(p - d), num(q - d)];
          return {
            prompt: T`Solve: \(\left(${B.tex}\right)^{2} ${MX.sgnTerm(-(p + q))}\left(${B.tex}\right) ${MX.sgnTerm(p * q)} = 0\)`.replace(/\+ 1\\left|- 1\\left/g, (m) => m.replace(' 1', ' ')),
            parts: [Object.assign(setOfVals(sols), { ask: HINT, points: 4, verify: MX.V.solves(`(${B.asc})^2-(${p + q})(${B.asc})+(${p * q})=0`) })],
            solution: [
              T`Let \(u = ${B.tex}\): \(${MX.quad(1, -(p + q), p * q, 'u').tex} = 0\), so \(u = ${p}\) or \(u = ${q}\).`,
              T`\(${B.tex} = ${p}\) gives \(x = ${p - d}\); \(${B.tex} = ${q}\) gives \(x = ${q - d}\).`,
              T`\(${H.box(setOfVals(sols).show)}\)`,
            ],
          };
        },
      },
      sqrtX: {
        name: 'Square roots (u = √x)',
        gen(rng) {
          let p, q; do { p = rng.int(1, 7); q = rng.pick([rng.int(1, 8), -rng.int(1, 6)]); } while (p === q || p + q === 0);
          const sols = [p, q].filter((u) => u >= 0).map((u) => num(u * u));
          return {
            prompt: T`Solve: \(x ${MX.sgnTerm(-(p + q)).replace(/([+-]) 1$/, '$1 ')}\sqrt{x} ${MX.sgnTerm(p * q)} = 0\)`,
            parts: [Object.assign(setOfVals(sols), { ask: HINT, points: 4, verify: MX.V.solves(`x-(${p + q})√(x)+(${p * q})=0`) })],
            solution: [
              T`Let \(u = \sqrt{x}\) (so \(u^{2} = x\)): \(${MX.quad(1, -(p + q), p * q, 'u').tex} = 0\), so \(u = ${p}\) or \(u = ${q}\).`,
              T`${[p, q].map((u) => (u < 0 ? T`\(\sqrt{x} = ${u}\) is impossible (a square root is never negative)` : T`\(\sqrt{x} = ${u}\) gives \(x = ${u * u}\)`)).join('; ')}.`,
              T`\(${H.box(setOfVals(sols).show)}\)`,
            ],
          };
        },
      },
      fracExp: {
        name: 'Fractional exponents',
        gen(rng) {
          let p, q; do { p = rng.nz(-3, 4); q = rng.nz(-3, 4); } while (p === q || p + q === 0);
          const sols = [num(p * p * p), num(q * q * q)];
          return {
            prompt: T`Solve: \(x^{\frac{2}{3}} ${MX.sgnTerm(-(p + q)).replace(/([+-]) 1$/, '$1 ')}x^{\frac{1}{3}} ${MX.sgnTerm(p * q)} = 0\)`,
            // x^(2/3) is written (x^(1/3))^2 so the parser takes real cube roots of negative x
            parts: [Object.assign(setOfVals(sols), { ask: HINT, points: 4, verify: MX.V.solves(`(x^(1/3))^2-(${p + q})x^(1/3)+(${p * q})=0`) })],
            solution: [
              T`Let \(u = x^{\frac{1}{3}}\) (so \(u^{2} = x^{\frac{2}{3}}\)): \(${MX.quad(1, -(p + q), p * q, 'u').tex} = 0\), so \(u = ${p}\) or \(u = ${q}\).`,
              T`Cube both sides of \(x^{\frac{1}{3}} = u\): \(x = ${p}^{3} = ${p * p * p}\) or \(x = ${MX.par(q)}^{3} = ${q * q * q}\).`,
              T`\(${H.box(setOfVals(sols).show)}\)`,
            ],
          };
        },
      },
      negExp: {
        name: 'Negative exponents',
        gen(rng) {
          let p, q; do { p = rng.nz(-5, 6); q = rng.nz(-5, 6); } while (p === q || p + q === 0);
          const sols = [p, q].map((u) => { const r = new Q(1, u); return { v: r.val(), a: r.str(), t: r.tex() }; });
          return {
            prompt: T`Solve: \(x^{-2} ${MX.sgnTerm(-(p + q)).replace(/([+-]) 1$/, '$1 ')}x^{-1} ${MX.sgnTerm(p * q)} = 0\)`,
            parts: [Object.assign(setOfVals(sols), { ask: HINT, points: 4, verify: MX.V.solves(`x^(-2)-(${p + q})x^(-1)+(${p * q})=0`) })],
            solution: [
              T`Let \(u = x^{-1}\) (so \(u^{2} = x^{-2}\)): \(${MX.quad(1, -(p + q), p * q, 'u').tex} = 0\), so \(u = ${p}\) or \(u = ${q}\).`,
              T`\(x^{-1} = \frac{1}{x} = u\) means \(x = \frac{1}{u}\): \(x = ${new Q(1, p).tex()}\) or \(x = ${new Q(1, q).tex()}\).`,
              T`\(${H.box(setOfVals(sols).show)}\)`,
            ],
          };
        },
      },
    },
  });

  // ================= vertex form and transformations of parabolas =================
  const vf = (a, h, k) => ({ tex: coef(a) + sq(h) + (k ? ' ' + MX.sgnTerm(k) : ''), asc: (a === 0.5 ? '(1/2)' : a === -0.5 ? '-(1/2)' : coef(a)) + sqA(h) + (k ? (k > 0 ? '+' : '-') + Math.abs(k) : '') });
  const aT = (a) => (a === 0.5 ? '\\frac{1}{2}' : a === -0.5 ? '-\\frac{1}{2}' : coef(a));
  const parabolaPlot = (a, h, k, o = {}) => H.fnPlot({ r: 8, pieces: [{ f: (x) => a * (x - h) * (x - h) + k }], dots: o.dot === false ? [] : [[h, k, true]], label: 'graph of a parabola' });
  // verifiers for "vertex / axis / max or min" parts of the displayed parabola f (an expression string in x)
  const vVertex = (asc) => { const f = MX.V.fn(asc, 'x'); return MX.V.point((x, y) => (isAxis(f, x) && cl(f(x), y)) || 'not the vertex of the parabola'); };
  const vAxis = (asc) => {
    const f = MX.V.fn(asc, 'x');
    return MX.V.custom((e) => {
      if (e.op !== '=' || e.lhs.t !== 'var' || e.lhs.n !== 'x' || MX.ast.vars(e.rhs).size) return 'expected x = a number';
      return isAxis(f, MX.evalAST(e.rhs, {})) || 'not the axis of symmetry';
    });
  };
  // option 0 says "minimum, opens up", option 1 "maximum, opens down": far from the vertex f is above it when it opens up
  const vMinMax = (asc) => { const f = MX.V.fn(asc, 'x'); return MX.V.choice((i) => (i === 0) === (f(1000) > f(0) && f(-1000) > f(0))); };
  // read a description written by pDescribe back into a transformation of y = x^2, applied step by step in the listed order
  function describedFn(text) {
    let g = (x) => x * x;
    for (const step of text.replace(/\.$/, '').split(', ')) {
      const m = step.toLowerCase().match(/^(shift (right|left|up|down) (\d+)|stretch vertically by (\d+)|compress vertically by 1\/2|reflect across the x-axis)$/);
      if (!m) return null;
      const f0 = g, n = +m[3];
      if (m[2] === 'right') g = (x) => f0(x - n);
      else if (m[2] === 'left') g = (x) => f0(x + n);
      else if (m[2] === 'up') g = (x) => f0(x) + n;
      else if (m[2] === 'down') g = (x) => f0(x) - n;
      else if (m[4]) g = (x) => +m[4] * f0(x);
      else if (step.startsWith('compress') || step.startsWith('Compress')) g = (x) => f0(x) / 2;
      else g = (x) => -f0(x);
    }
    return g;
  }
  const sameFn = (f, g) => [-6.3, -2, -0.4, 0, 1.1, 2.5, 4, 7.7].every((x) => cl(f(x), g(x)));
  function pDescribe(a, h, k) {
    const s = [];
    if (h) s.push(`shift ${h > 0 ? 'right' : 'left'} ${Math.abs(h)}`);
    if (Math.abs(a) !== 1) s.push(Math.abs(a) > 1 ? `stretch vertically by ${Math.abs(a)}` : 'compress vertically by 1/2');
    if (a < 0) s.push('reflect across the x-axis');
    if (k) s.push(`shift ${k > 0 ? 'up' : 'down'} ${Math.abs(k)}`);
    const t = s.join(', ');
    return t[0].toUpperCase() + t.slice(1) + '.';
  }
  MX.register({
    id: 'quad-transform', section: SEC, title: 'Vertex form and transformations', kind: 'skill', sources: [ADDED],
    slots: [{ label: 'Vertex form and transformations', source: ADDED, pool: ['readVertex', 'axisStd', 'graph', 'describe', 'fromGraph'] }],
    lesson: T`<p>The graph of a quadratic function is a U-shaped curve called a <strong>parabola</strong>. Every parabola is \(y = x^{2}\) moved, stretched or flipped, and <strong>vertex form</strong> shows those changes at a glance.</p>
<div class="box def"><h4>Definition <b>Vertex and axis of symmetry</b></h4><p>The <strong>vertex</strong> is the turning point of the parabola: its lowest point if it opens up, its highest point if it opens down. The <strong>axis of symmetry</strong> is the vertical line through the vertex. The two halves of the parabola are mirror images across it.</p></div>
<div class="box rule"><h4>Rule <b>Vertex form</b></h4><p>In \(f(x) = a\left(x - h\right)^{2} + k\), the vertex is \(\left(h, k\right)\) and the axis of symmetry is \(x = h\). If \(a \gt 0\), the parabola opens up and \(k\) is the <strong>minimum</strong> value of \(f\). If \(a \lt 0\), it opens down and \(k\) is the <strong>maximum</strong> value.</p></div>
<p>For example, \(f(x) = \left(x - 2\right)^{2} - 3\) has \(h = 2\), \(k = -3\) and \(a = 1\). Its vertex is \(\left(2, -3\right)\), its axis is \(x = 2\), and \(-3\) is its minimum.</p>
<div class="vis" style="margin: 10px 0">${(() => { const X = (x) => 18 + (x + 3) * 19.4, Y = (y) => 212 - (y + 4) * 19.4; return H.fnPlot({ win: { xmin: -3, xmax: 7, ymin: -4, ymax: 6 }, pieces: [{ f: (x) => (x - 2) * (x - 2) - 3 }], dots: [[2, -3, true]], label: 'The parabola f(x) = (x − 2)² − 3 with vertex (2, −3) and axis of symmetry x = 2' }).replace('</svg>', S.line(X(2), Y(6), X(2), Y(-4), 'ln thin dash') + S.label(X(2) + 6, Y(5.4), 'x = 2', { cls: 'lbl', a: 'start' }) + S.label(X(2) + 8, Y(-3) + 16, 'vertex (2, −3)', { cls: 'lbl', a: 'start' }) + '</svg>'); })()}</div>
<h3>Reading the transformations</h3>
<div class="box rule"><h4>Property <b>How a, h and k move \(y = x^{2}\)</b></h4><ul>
<li>\(h\) shifts it sideways: \(\left(x - 3\right)^{2}\) moves it <strong>right</strong> 3, and \(\left(x + 3\right)^{2}\) moves it <strong>left</strong> 3.</li>
<li>\(k\) shifts it up or down: \(x^{2} + 4\) is \(x^{2}\) moved <strong>up</strong> 4, and \(x^{2} - 4\) is \(x^{2}\) moved <strong>down</strong> 4.</li>
<li>\(\left|a\right| \gt 1\) stretches it vertically (narrower). \(0 \lt \left|a\right| \lt 1\) compresses it (wider).</li>
<li>A negative \(a\) reflects it across the \(x\)-axis, so it opens down.</li></ul></div>
<div class="ex"><h4>Example</h4><p>Describe \(g(x) = -2\left(x + 1\right)^{2} + 4\).</p><table class="st">
<tr><td>Match \(a\left(x - h\right)^{2} + k\). Note \(x + 1 = x - \left(-1\right)\).</td><td>\(a = -2,\ h = -1,\ k = 4\)</td></tr>
<tr><td>Vertex and axis.</td><td>\(\left(-1, 4\right)\), axis \(x = -1\)</td></tr>
<tr><td>\(a \lt 0\): opens down.</td><td>maximum value 4</td></tr>
<tr><td>From \(y = x^{2}\):</td><td>left 1, stretch by 2, reflect across the \(x\)-axis, up 4</td></tr></table></div>
<h3>From standard form</h3>
<p>If the function is \(f(x) = ax^{2} + bx + c\), the axis of symmetry is \(x = -\frac{b}{2a}\). Put that \(x\) into \(f\) to get the \(y\)-coordinate of the vertex. For \(f(x) = 2x^{2} + 8x + 5\): \(x = -\frac{8}{2\left(2\right)} = -2\), and \(f(-2) = 8 - 16 + 5 = -3\), so the vertex is \(\left(-2, -3\right)\).</p>
<h3>From a graph</h3>
<p>Read the vertex \(\left(h, k\right)\) and write \(f(x) = a\left(x - h\right)^{2} + k\). Then put in one more point from the graph and solve for \(a\). If the vertex is \(\left(1, 2\right)\) and the graph passes through \(\left(2, 5\right)\), then \(5 = a\left(2 - 1\right)^{2} + 2\), so \(a = 3\) and \(f(x) = 3\left(x - 1\right)^{2} + 2\).</p>
<div class="box warn"><h4>Watch out</h4><p>The sign inside the parentheses is the opposite of the shift you might expect. \(\left(x + 3\right)^{2}\) means \(h = -3\): the vertex is at \(x = -3\), and the graph moves <em>left</em> 3.</p></div>`,
    variants: {
      readVertex: {
        name: 'Vertex, axis and max/min',
        gen(rng) {
          const a = rng.pick([1, -1, 2, -2, 3, -3, 0.5, -0.5]), h = rng.nz(-7, 7), k = rng.int(-9, 9), F = vf(a, h, k);
          const vx = H.pt(h, k);
          return {
            prompt: T`For \(f(x) = ${aT(a)}${sq(h)}${k ? ' ' + MX.sgnTerm(k) : ''}\):`,
            parts: [
              { label: 'a', ask: 'The vertex', kind: 'point', answer: vx.asc, show: vx.tex, points: 1, verify: vVertex(F.asc) },
              { label: 'b', ask: 'The axis of symmetry (an equation)', kind: 'eq', vars: ['x'], answer: 'x=' + h, show: 'x = ' + h, points: 1, verify: vAxis(F.asc) },
              { label: 'c', ask: T`Is \(${k}\) a maximum or a minimum value of \(f\)?`, kind: 'choice', options: [T`Minimum: the parabola opens up`, T`Maximum: the parabola opens down`], answer: a > 0 ? 0 : 1, points: 1, verify: vMinMax(F.asc) },
            ],
            solution: [T`Compare with \(a(x - h)^{2} + k\): \(h = ${h}\) (watch the sign inside), \(k = ${k}\), \(a = ${MX.num(a)}\).`, T`Vertex \(${vx.tex}\), axis of symmetry \(x = ${h}\).`, T`\(a ${a > 0 ? '\\gt' : '\\lt'} 0\), so it opens ${a > 0 ? 'up and ' + k + ' is the minimum' : 'down and ' + k + ' is the maximum'}.`],
          };
        },
      },
      axisStd: {
        name: 'From standard form',
        gen(rng) {
          const a = rng.pick([1, -1, 2, -2, 3]), h = rng.nz(-5, 5), k = rng.int(-12, 12);
          const b = -2 * a * h, c = a * h * h + k, vx = H.pt(h, k);
          return {
            prompt: T`Find the axis of symmetry and the vertex of \(f(x) = ${MX.quad(a, b, c).tex}\).`,
            parts: [
              { label: 'a', ask: 'Axis of symmetry', kind: 'eq', vars: ['x'], answer: 'x=' + h, show: 'x = ' + h, points: 2, verify: vAxis(MX.quad(a, b, c).asc) },
              { label: 'b', ask: 'Vertex', kind: 'point', answer: vx.asc, show: vx.tex, points: 2, verify: vVertex(MX.quad(a, b, c).asc) },
            ],
            solution: [T`\(x = -\frac{b}{2a} = -\frac{${b}}{2\left(${a}\right)} = ${h}\)`, T`\(f(${h}) = ${a}${MX.par(h)}^{2} ${MX.sgnTerm(b)}\cdot${MX.par(h)} ${MX.sgnTerm(c)} = ${k}\)`, T`Axis \(${H.box('x = ' + h)}\), vertex \(${H.box(vx.tex)}\)`],
          };
        },
      },
      graph: {
        name: 'Choose the graph',
        gen(rng) {
          const a = rng.pick([1, -1, 2, -2]), h = rng.nz(-5, 5), k = rng.nz(-5, 5);
          // each option carries the curve it plots
          const curve = (A, h0, k0) => (x) => A * (x - h0) * (x - h0) + k0;
          const ch = H.choices(rng, parabolaPlot(a, h, k), [parabolaPlot(a, -h, k), parabolaPlot(a, h, -k), parabolaPlot(-a, h, k)], [curve(a, h, k), curve(a, -h, k), curve(a, h, -k), curve(-a, h, k)]);
          const shown = MX.V.fn(vf(a, h, k).asc, 'x');
          return {
            prompt: T`Which graph shows \(f(x) = ${vf(a, h, k).tex}\)?`,
            parts: [{ kind: 'choice', graph: true, options: ch.options, answer: ch.answer, data: ch.data, points: 3, verify: MX.V.choiceData((g) => sameFn(g, shown)) }],
            solution: [T`Vertex \((${h}, ${k})\); it opens ${a > 0 ? 'up' : 'down'}${Math.abs(a) > 1 ? ' and is narrower than \\(x^{2}\\)' : ''}.`, T`Check a point: \(f(${h + 1}) = ${a + k}\), so the graph passes through \((${h + 1}, ${a + k})\).`],
          };
        },
      },
      describe: {
        name: 'Describe the transformation',
        gen(rng) {
          const a = rng.pick([1, -1, 2, -2, 3, 0.5]), h = rng.nz(-6, 6), k = rng.nz(-6, 6);
          const ch = H.choices(rng, pDescribe(a, h, k), [pDescribe(a, -h, k), pDescribe(a, h, -k), pDescribe(-a, -h, -k)]);
          return {
            prompt: T`How is the graph of \(g(x) = ${aT(a)}${sq(h)} ${MX.sgnTerm(k)}\) obtained from the graph of \(y = x^{2}\)?`,
            parts: [{ kind: 'choice', options: ch.options, answer: ch.answer, points: 2,
              verify: MX.V.choice((i) => { const g = describedFn(ch.options[i]), shown = MX.V.fn(`${a === 0.5 ? '(1/2)' : coef(a)}${sqA(h)}+(${k})`, 'x'); return !!g && sameFn(g, shown); }) }],
            solution: [T`\(h = ${h}\): ${h > 0 ? 'right' : 'left'} ${Math.abs(h)}. \(k = ${k}\): ${k > 0 ? 'up' : 'down'} ${Math.abs(k)}. \(a = ${MX.num(a)}\)${a < 0 ? ': reflected' : ''}${Math.abs(a) !== 1 ? (Math.abs(a) > 1 ? ', stretched' : ', compressed') : ''}.`, pDescribe(a, h, k)],
          };
        },
      },
      fromGraph: {
        name: 'Equation from a graph',
        gen(rng) {
          const a = rng.pick([1, -1, 2, -2]), h = rng.int(-4, 4), k = rng.int(-5, 5), F = vf(a, h, k);
          if (Math.abs(a + k) > 7) return this.gen(rng);
          const dots = [[h, k, true], [h + 1, a + k, true]];
          return {
            prompt: T`Write the equation of the parabola in vertex form. The vertex and one other point are marked.`,
            visual: H.fnPlot({ r: 8, pieces: [{ f: (x) => a * (x - h) * (x - h) + k }], dots }),
            parts: [{ kind: 'expr', form: 'vertex', pre: 'f(x) =', vars: ['x'], answer: F.asc, show: 'f(x) = ' + F.tex, points: 3,
              // from the marked points only: the vertex dot is on the curve and is its axis, the other dot is on the curve,
              // and the answer is a quadratic (second differences constant)
              verify: MX.V.custom((e) => {
                const g = (x) => MX.evalAST(e, { x }), [[vx, vy], [px, py]] = dots;
                if (!cl(g(vx), vy) || !isAxis(g, vx)) return 'the marked vertex is not the vertex of this curve';
                if (!cl(g(px), py)) return 'the curve misses the marked point';
                const d2 = (x) => g(x + 1) - 2 * g(x) + g(x - 1);
                return [-3, 0.5, 4].every((x) => cl(d2(x), d2(0))) || 'not a parabola';
              }) }],
            solution: [T`Vertex \((${h}, ${k})\), so \(f(x) = a${sq(h)} ${MX.sgnTerm(k)}\).`, T`The point \((${h + 1}, ${a + k})\): \(${a + k} = a\left(${h + 1} ${MX.sgnTerm(-h)}\right)^{2} ${MX.sgnTerm(k)} = a ${MX.sgnTerm(k)}\), so \(a = ${a}\).`, T`\(${H.box('f(x) = ' + F.tex)}\)`],
          };
        },
      },
    },
  });

  // ================= quadratic inequalities =================
  function qIneq(rng, forceA) {
    let r1, r2; do { r1 = rng.int(-7, 6); r2 = rng.int(-6, 8); } while (r1 >= r2);
    const a = forceA || rng.pick([1, 1, 1, -1, 2]), op = rng.pick(['<', '<=', '>', '>=']);
    const inside = (a > 0) === (op[0] === '<');
    const closed = op.length === 2;
    const reg = inside ? [H.iv(r1, r2, closed, closed)] : [H.iv(-INF, r1, false, closed), H.iv(r2, INF, closed, false)];
    return { r1, r2, a, op, reg, inside, closed, b: -a * (r1 + r2), c: a * r1 * r2 };
  }
  const OPT = { '<': '\\lt', '<=': '\\le', '>': '\\gt', '>=': '\\ge' };
  MX.register({
    id: 'quad-ineq', section: SEC, title: 'Quadratic inequalities', kind: 'skill', sources: [ADDED],
    slots: [{ label: 'Quadratic inequalities', source: ADDED, pool: ['factor', 'rearrange', 'graph', 'special'] }],
    lesson: T`<p>A quadratic inequality such as \(x^{2} - x - 6 \lt 0\) asks: for which \(x\) is the quadratic negative? Picture the parabola \(y = x^{2} - x - 6\). The answer is every \(x\) where the graph is <em>below</em> the \(x\)-axis. The graph can only switch between below and above where it crosses the axis, so those crossing points are the key.</p>
<div class="box def"><h4>Definition <b>Critical points</b></h4><p>The <strong>critical points</strong> of \(ax^{2} + bx + c \lt 0\) (or \(\le\), \(\gt\), \(\ge\)) are the solutions of \(ax^{2} + bx + c = 0\). They are the \(x\)-intercepts of the parabola, and they split the number line into intervals where the sign stays the same.</p></div>
<div class="vis" style="margin: 10px 0">${(() => { const X = (x) => 18 + (x + 5) * (194 / 11), Y = (y) => 212 - (y + 7) * (194 / 14); return H.fnPlot({ win: { xmin: -5, xmax: 6, ymin: -7, ymax: 7 }, pieces: [{ f: (x) => (x + 2) * (x - 3) }], dots: [[-2, 0, false], [3, 0, false]], label: 'The parabola y = (x + 2)(x − 3): below the x-axis between −2 and 3, above it outside' }).replace('</svg>', S.label(X(1.5), Y(-3), 'y < 0', { cls: 'lbl' }) + S.label(X(-4), Y(2), 'y > 0', { cls: 'lbl' }) + S.label(X(5), Y(2), 'y > 0', { cls: 'lbl' }) + '</svg>'); })()}</div>
<p>Here \(x^{2} - x - 6 = \left(x + 2\right)\left(x - 3\right)\), so the critical points are \(-2\) and 3. The parabola opens up, so it is below the axis between them: \(x^{2} - x - 6 \lt 0\) on \(\left(-2, 3\right)\), and \(x^{2} - x - 6 \gt 0\) on \(\left(-\infty, -2\right) \cup \left(3, \infty\right)\).</p>
<div class="box how"><h4>How to <b>solve a quadratic inequality</b></h4><ol>
<li>Move every term to one side so the other side is 0.</li>
<li>Find the critical points by solving \(ax^{2} + bx + c = 0\).</li>
<li>Decide the sign on each interval. Either test one number from each interval, or use the shape: if \(a \gt 0\), the quadratic is negative between the critical points and positive outside them; if \(a \lt 0\), the opposite.</li>
<li>Write the intervals that make the inequality true. Use brackets \([\ ]\) at the critical points for \(\le\) or \(\ge\), and parentheses for \(\lt\) or \(\gt\).</li></ol></div>
<div class="ex"><h4>Example</h4><p>Solve \(x^{2} + 2x \ge 8\).</p><table class="st">
<tr><td>Get 0 on one side.</td><td>\(x^{2} + 2x - 8 \ge 0\)</td></tr>
<tr><td>Factor to find the critical points.</td><td>\(\left(x + 4\right)\left(x - 2\right) = 0,\ x = -4 \text{ or } x = 2\)</td></tr>
<tr><td>Test \(x = 0\) in the middle interval.</td><td>\(0 + 0 - 8 = -8\), not \(\ge 0\)</td></tr>
<tr><td>So the outside intervals work. The critical points count, because of \(\ge\).</td><td>\(\left(-\infty, -4\right] \cup \left[2, \infty\right)\)</td></tr></table></div>
<h3>No crossing points, or just one</h3>
<p>If the parabola never crosses the \(x\)-axis (the discriminant \(b^{2} - 4ac\) is negative), it is entirely above the axis or entirely below it. The answer is then all real numbers, \(\left(-\infty, \infty\right)\), or no solution. For example, \(x^{2} + 2x + 5\) opens up and has discriminant \(4 - 20 = -16\), so \(x^{2} + 2x + 5 \gt 0\) for every \(x\).</p>
<p>A perfect square like \(\left(x - 3\right)^{2}\) touches the axis at one point. It is 0 at \(x = 3\) and positive everywhere else. So \(\left(x - 3\right)^{2} \gt 0\) on \(\left(-\infty, 3\right) \cup \left(3, \infty\right)\), \(\left(x - 3\right)^{2} \ge 0\) for all real numbers, and \(\left(x - 3\right)^{2} \lt 0\) has no solution.</p>
<div class="box warn"><h4>Watch out</h4><p>Get 0 on one side before you factor. \(x\left(x - 3\right) \lt 4\) does <em>not</em> mean \(x \lt 4\); first rewrite it as \(x^{2} - 3x - 4 \lt 0\).</p></div>`,
    variants: {
      factor: {
        name: 'Factorable',
        gen(rng) {
          const q = qIneq(rng);
          const nl = H.regionChoices(rng, q.reg);
          return {
            prompt: T`Solve \(${MX.quad(q.a, q.b, q.c).tex} ${OPT[q.op]} 0\). Write the solution in interval notation and graph it.`,
            parts: [
              { label: 'a', ask: 'Solution (interval notation)', kind: 'interval', answer: H.regionAsc(q.reg), show: H.regionTex(q.reg), points: 3, verify: MX.V.region(`${MX.quad(q.a, q.b, q.c).asc} ${q.op} 0`) },
              { label: 'b', ask: 'Which graph shows the solution?', kind: 'choice', graph: true, options: nl.options, answer: nl.answer, data: nl.data, points: 1, verify: MX.V.choiceRegion(`${MX.quad(q.a, q.b, q.c).asc} ${q.op} 0`, { n: 4000 }) },
            ],
            solution: [
              T`Critical points: \(${MX.quad(q.a, q.b, q.c).tex} = ${q.a === 1 ? '' : q.a === -1 ? '-' : q.a}\left(x ${MX.sgnTerm(-q.r1)}\right)\left(x ${MX.sgnTerm(-q.r2)}\right) = 0\) at \(x = ${q.r1}\) and \(x = ${q.r2}\).`,
              T`The parabola opens ${q.a > 0 ? 'up' : 'down'}, so it is ${q.a > 0 ? 'below' : 'above'} the \(x\)-axis between ${q.r1} and ${q.r2}.`,
              T`We need ${q.op[0] === '<' ? 'negative' : 'positive'} values${q.closed ? ' or zero' : ''}: ${q.inside ? 'between the roots' : 'outside the roots'}. \(${H.box(H.regionTex(q.reg))}\)`,
            ],
          };
        },
      },
      rearrange: {
        name: 'Rearrange first',
        gen(rng) {
          const q = qIneq(rng, 1);
          if (!q.b || !q.c) return this.gen(rng);
          return {
            prompt: T`Solve \(${MX.poly([[1, { x: 2 }], [q.b, { x: 1 }]]).tex} ${OPT[q.op]} ${MX.num(-q.c)}\). Write the solution in interval notation.`,
            parts: [{ kind: 'interval', answer: H.regionAsc(q.reg), show: H.regionTex(q.reg), points: 3, verify: MX.V.region(`${MX.poly([[1, { x: 2 }], [q.b, { x: 1 }]]).asc} ${q.op} ${-q.c}`) }],
            solution: [
              T`Move everything to the left: \(${MX.quad(1, q.b, q.c).tex} ${OPT[q.op]} 0\)`,
              T`Factor: \(\left(x ${MX.sgnTerm(-q.r1)}\right)\left(x ${MX.sgnTerm(-q.r2)}\right)\), critical points ${q.r1} and ${q.r2}.`,
              T`It opens up, so it is negative between the roots and positive outside them: \(${H.box(H.regionTex(q.reg))}\)`,
            ],
          };
        },
      },
      graph: {
        name: 'Solve from a graph',
        gen(rng) {
          const q = qIneq(rng, rng.pick([1, -1]));
          if (Math.abs(q.a * ((q.r2 - q.r1) / 2) ** 2) > 7.5) return this.gen(rng);
          const f = (x) => q.a * (x - q.r1) * (x - q.r2);
          return {
            prompt: T`The graph of \(y = f(x)\) is shown. Use it to solve \(f(x) ${OPT[q.op]} 0\) in interval notation.`,
            visual: H.fnPlot({ r: 8, pieces: [{ f }], dots: [[q.r1, 0, true], [q.r2, 0, true]] }),
            // read from the plotted curve: where it is below / above (or on) the x-axis
            parts: [{ kind: 'interval', answer: H.regionAsc(q.reg), show: H.regionTex(q.reg), points: 3,
              verify: MX.V.region((env) => { const y = f(env.x); return { '<': y < 0, '<=': y <= 0, '>': y > 0, '>=': y >= 0 }[q.op]; }) }],
            solution: [T`The graph crosses the \(x\)-axis at \(x = ${q.r1}\) and \(x = ${q.r2}\).`, T`\(f(x) ${OPT[q.op]} 0\) where the graph is ${q.op[0] === '<' ? 'below' : 'above'} the axis${q.closed ? ' or on it' : ''}: ${q.inside ? 'between them' : 'outside them'}.`, T`\(${H.box(H.regionTex(q.reg))}\)`],
          };
        },
      },
      special: {
        name: 'No real roots or a double root',
        gen(rng) {
          const kind = rng.pick(['noroot', 'double']);
          if (kind === 'double') {
            const h = rng.nz(-6, 6), op = rng.pick(['>', '<', '>=']);
            const reg = op === '>' ? [H.iv(-INF, h, false, false), H.iv(h, INF, false, false)] : op === '<' ? [] : H.ALLREAL;
            return {
              prompt: T`Solve \(${MX.quad(1, -2 * h, h * h).tex} ${OPT[op]} 0\). Write the solution in interval notation (or “no solution”).`,
              parts: [{ kind: 'interval', answer: H.regionAsc(reg), show: H.regionTex(reg), points: 3, verify: MX.V.region(exactIneq(MX.quad(1, -2 * h, h * h).asc, op)) }],
              solution: [T`\(${MX.quad(1, -2 * h, h * h).tex} = \left(x ${MX.sgnTerm(-h)}\right)^{2}\), which is 0 at \(x = ${h}\) and positive everywhere else.`, op === '>' ? T`Positive for every \(x\) except ${h}.` : op === '<' ? T`A square is never negative.` : T`A square is always \(\ge 0\).`, T`\(${H.box(H.regionTex(reg))}\)`],
            };
          }
          let b, c; do { b = rng.int(-8, 8); c = rng.int(1, 20); } while (b * b - 4 * c >= 0);
          const a = rng.pick([1, -1]), op = rng.pick(['<', '>', '<=', '>=']);
          const always = (a > 0) === (op[0] === '>');
          const reg = always ? H.ALLREAL : [];
          return {
            prompt: T`Solve \(${MX.quad(a, a * b, a * c).tex} ${OPT[op]} 0\). Write the solution in interval notation (or “no solution”).`,
            parts: [{ kind: 'interval', answer: H.regionAsc(reg), show: H.regionTex(reg), points: 3, verify: MX.V.region(`${MX.quad(a, a * b, a * c).asc} ${op} 0`) }],
            solution: [T`Discriminant: \(${MX.par(a * b)}^{2} - 4\left(${a}\right)\left(${a * c}\right) = ${b * b - 4 * c}\lt 0\): no real roots, so the parabola never touches the \(x\)-axis.`, T`It opens ${a > 0 ? 'up, so it is always above the axis (always positive)' : 'down, so it is always below the axis (always negative)'}.`, T`\(${H.box(H.regionTex(reg))}\)`],
          };
        },
      },
    },
  });

  // ================= word problems: projectiles and max/min =================
  const WSEC = 'Word problems';
  function arcSvg(h0, peakT, peakH, tEnd, o = {}) {
    const W = 360, Hh = 186, gy = 158, X = (t) => 76 + (t / tEnd) * 268, Y = (h) => gy - (h / (peakH * 1.1)) * 136;
    let b = S.line(10, gy, W - 10, gy, 'ln ground');
    if (h0 > 0) b += S.rect(52, Y(h0), 24, gy - Y(h0), 'ln soft2') + S.label(46, Math.min(gy - 6, (Y(h0) + gy) / 2 + 4), h0 + ' ft', { cls: 'lbl', a: 'end' });
    const pts = []; for (let k = 0; k <= 60; k++) { const t = (tEnd * k) / 60, hh = -16 * t * t + o.v0 * t + h0; if (hh >= 0) pts.push([X(t), Y(hh)]); }
    b += S.pline(pts, 'acc dash') + S.circle(X(0), Y(h0), 5, 'sun ln');
    if (o.markPeak) b += S.line(X(peakT), Y(peakH), X(peakT), gy, 'ln thin dash') + S.q(X(peakT), Y(peakH) - 8, 'max?');
    if (o.markH) b += S.line(60, Y(o.markH), W - 10, Y(o.markH), 'mut dash') + S.text(W - 12, Y(o.markH) - 4, o.markH + ' ft', { cls: 'tx small', a: 'end' });
    if (o.markGround) b += S.q(Math.min(W - 20, X(tEnd) - 4), gy - 10, '?');
    b += S.text(W - 12, gy + 20, 'h = height (ft), t = time (s)', { cls: 'tx small mut', a: 'end' });
    return S.svg(W, Hh, b, 'Path of a thrown ball');
  }
  const proj = {
    ground: {
      name: 'When it hits the ground',
      gen(rng) {
        const v0 = rng.int(3, 10) * 8, h0 = rng.int(2, 30) * 5;
        const tg = (v0 + Math.sqrt(v0 * v0 + 64 * h0)) / 32, ans = Math.round(tg * 10) / 10;
        const peakT = v0 / 32, peakH = h0 + (v0 * v0) / 64;
        return {
          prompt: T`A ball is thrown upward from the top of a ${h0}-foot building with an initial speed of ${v0} feet per second. Its height after \(t\) seconds is \(h = -16t^{2} + ${v0}t + ${h0}\). How long until it hits the ground? Round to the nearest tenth of a second.`,
          visual: arcSvg(h0, peakT, peakH, tg, { v0, markGround: true }),
          parts: [{ kind: 'num', answer: String(ans), tol: 0.051, show: ans + '\\text{ seconds}', post: 'seconds', points: 4,
            // the exact landing time is the positive root of h = 0 (found numerically); the key is it rounded to the tenth
            verify: MX.V.custom((t) => {
              const rs = MX.V.roots(`-16x^2+${v0}x+${h0}=0`).filter((x) => x > 0);
              if (rs.length !== 1) return 'expected one positive landing time';
              return (typeof t === 'number' && Math.abs(t - Math.round(rs[0] * 10) / 10) < 1e-9) || 'the landing time rounds to ' + Math.round(rs[0] * 10) / 10;
            }) }],
          solution: [
            T`The ground is \(h = 0\): \(-16t^{2} + ${v0}t + ${h0} = 0\).`,
            T`Quadratic formula with \(a = -16\), \(b = ${v0}\), \(c = ${h0}\): \(t = \dfrac{-${v0} \pm \sqrt{${v0 * v0} + ${64 * h0}}}{-32}\).`,
            T`The positive solution is \(t \approx ${MX.num(tg, 3)}\) (a negative time makes no sense). \(${H.box(ans + '\\text{ s}')}\)`,
          ],
        };
      },
    },
    height: {
      name: 'When it reaches a height',
      gen(rng) {
        const t1 = rng.int(1, 2), t2 = t1 + rng.int(1, 3), v0 = 16 * (t1 + t2), h0 = rng.pick([0, 0, 5, 10, 20]);
        const Hh = h0 + 16 * t1 * t2, peakT = v0 / 32, peakH = h0 + (v0 * v0) / 64, tEnd = (v0 + Math.sqrt(v0 * v0 + 64 * h0)) / 32;
        return {
          prompt: T`A rocket is launched ${h0 ? 'from a ' + h0 + '-foot platform' : 'from the ground'} with an initial velocity of ${v0} feet per second, so its height is \(h = -16t^{2} + ${v0}t${h0 ? ' + ' + h0 : ''}\) after \(t\) seconds. When is it exactly ${Hh} feet high?`,
          visual: arcSvg(h0, peakT, peakH, tEnd, { v0, markH: Hh }),
          parts: [{ kind: 'nums', count: 2, pre: 't =', joiner: 'and', answers: [String(t1), String(t2)], show: T`t = ${t1}\text{ s and }t = ${t2}\text{ s}`, post: 'seconds', points: 4, verify: MX.V.solves(`-16x^2+${v0}x+${h0}=${Hh}`, { keep: (t) => t >= 0 }) }],
          solution: [
            T`Set \(h = ${Hh}\): \(-16t^{2} + ${v0}t${h0 ? ' + ' + h0 : ''} = ${Hh}\), so \(-16t^{2} + ${v0}t - ${Hh - h0} = 0\).`,
            T`Divide by \(-16\): \(${MX.quad(1, -(t1 + t2), t1 * t2, 't').tex} = 0\), which factors as \(\left(t - ${t1}\right)\left(t - ${t2}\right) = 0\).`,
            T`Once on the way up and once on the way down: \(${H.box(T`t = ${t1}\text{ and }t = ${t2}`)}\) seconds.`,
          ],
        };
      },
    },
    peak: {
      name: 'Maximum height',
      gen(rng) {
        const m = rng.int(1, 4), v0 = 32 * m, h0 = rng.pick([0, 4, 6, 10, 25, 40]);
        const peakH = h0 + 16 * m * m, tEnd = (v0 + Math.sqrt(v0 * v0 + 64 * h0)) / 32;
        // the peak by symmetry: halfway between the two times the height equals the launch height
        const hStr = `-16x^2+${v0}x+${h0}`, peakAt = () => symAxis(hStr), hAt = MX.V.fn(hStr, 'x');
        return {
          prompt: T`A ball is kicked upward ${h0 ? 'from ' + h0 + ' feet above the ground ' : ''}with an initial velocity of ${v0} feet per second. Its height is \(h = -16t^{2} + ${v0}t${h0 ? ' + ' + h0 : ''}\). When does it reach its maximum height, and what is that height?`,
          visual: arcSvg(h0, m, peakH, tEnd, { v0, markPeak: true }),
          parts: [
            { label: 'a', ask: 'Time to reach the maximum height', kind: 'num', answer: String(m), show: m + '\\text{ s}', post: 'seconds', points: 2, verify: MX.V.value(peakAt) },
            { label: 'b', ask: 'The maximum height', kind: 'num', answer: String(peakH), show: peakH + '\\text{ ft}', post: 'feet', points: 2, verify: MX.V.value(() => hAt(peakAt())) },
          ],
          solution: [T`The path is a parabola opening down, so the maximum is at the vertex: \(t = -\frac{b}{2a} = -\frac{${v0}}{2\left(-16\right)} = ${m}\).`, T`\(h(${m}) = -16\left(${m}\right)^{2} + ${v0}\left(${m}\right)${h0 ? ' + ' + h0 : ''} = ${peakH}\)`, T`\(${H.box(T`${m}\text{ s},\ ${peakH}\text{ ft}`)}\)`],
        };
      },
    },
    fence: {
      name: 'Largest fenced area',
      gen(rng) {
        const barn = rng.chance(0.5), P = barn ? rng.int(10, 60) * 4 : rng.int(10, 60) * 4;
        const w = P / 4, l = barn ? P / 2 : P / 4, A = w * l;
        const W = 340, Hh = 170;
        // area as a function of the side x touching the barn (or the width), from the stated fencing; best x by symmetry
        const areaStr = barn ? `x(${P}-2x)` : `x(${P}/2-x)`, bestX = () => symAxis(areaStr);
        const other = (x) => (barn ? P - 2 * x : P / 2 - x);
        let v = barn ? S.rect(40, 16, 260, 30, 'wood ln', 2) + S.text(170, 36, 'barn wall (no fence)', { cls: 'tx small', w: 700 }) + S.pline([[80, 46], [80, 140], [260, 140], [260, 46]], 'acc thick') : S.rect(90, 30, 160, 110, 'nofill acc thick');
        v += S.label(barn ? 72 : 82, barn ? 94 : 86, 'x', { cls: 'lbl', a: 'end' }) + S.label(barn ? 170 : 170, barn ? 158 : 158, barn ? P + ' − 2x' : P / 2 + ' − x', { cls: 'lbl' }) + S.text(170, barn ? 96 : 90, 'area = ?', { cls: 'tx small' });
        return {
          prompt: barn
            ? T`A farmer has ${P} feet of fencing to enclose a rectangular pen along a barn. The barn forms one side, so only three sides need fence. What dimensions give the largest area, and what is that area?`
            : T`You have ${P} feet of fencing to enclose a rectangular garden. What dimensions give the largest possible area, and what is that area?`,
          visual: S.svg(W, Hh, v, 'A fenced rectangle with sides in terms of x'),
          parts: [
            { label: 'a', ask: barn ? 'Width of each side touching the barn' : 'Width', kind: 'num', answer: String(w), show: w + '\\text{ ft}', post: 'feet', points: 1, verify: MX.V.value(bestX) },
            { label: 'b', ask: barn ? 'Length of the side parallel to the barn' : 'Length', kind: 'num', answer: String(l), show: l + '\\text{ ft}', post: 'feet', points: 1, verify: MX.V.value(() => other(bestX())) },
            { label: 'c', ask: 'Largest area', kind: 'num', answer: String(A), show: A + '\\text{ ft}^{2}', post: 'square feet', points: 2, verify: MX.V.value(() => MX.V.fn(areaStr, 'x')(bestX())) },
          ],
          solution: barn
            ? [T`Let \(x\) be each side touching the barn; the other side is \(${P} - 2x\). Area \(A = x\left(${P} - 2x\right) = -2x^{2} + ${P}x\).`, T`This parabola opens down; its vertex is at \(x = -\frac{${P}}{2\left(-2\right)} = ${w}\).`, T`Other side: \(${P} - 2\cdot${w} = ${l}\). Area \(= ${w}\cdot${l} = ${H.box(A + '\\text{ ft}^{2}')}\)`]
            : [T`Let \(x\) be the width; the length is \(${P / 2} - x\) (half the perimeter minus the width). \(A = x\left(${P / 2} - x\right) = -x^{2} + ${P / 2}x\).`, T`Vertex: \(x = -\frac{${P / 2}}{2\left(-1\right)} = ${w}\), and the length is also ${l}: a square.`, T`Area \(= ${w}^{2} = ${H.box(A + '\\text{ ft}^{2}')}\)`],
        };
      },
    },
    revenue: {
      name: 'Maximum revenue',
      gen(rng) {
        const p0 = rng.int(4, 12), n0 = rng.int(8, 30) * 10, drop = rng.pick([5, 10, 20]);
        // price p0 + x, customers n0 - drop*x; R(x) = (p0 + x)(n0 - drop x)
        const xv = (n0 / drop - p0) / 2;
        if (!Number.isInteger(xv * 2) || xv <= 0 || xv > 40) return this.gen(rng);
        const price = p0 + xv, cust = n0 - drop * xv, R = price * cust;
        const W = 340, Hh = 150;
        // revenue from the stated story: (price)(tickets sold) after x one-dollar increases; best x by symmetry
        const revStr = `(${p0}+x)(${n0}-${drop}x)`, bestInc = () => symAxis(revStr);
        let v = I_tag(80, 50, '$' + p0) + S.text(80, 90, n0 + ' tickets', { cls: 'tx small', w: 700 }) + S.text(80, 110, 'each +$1 → ' + drop + ' fewer', { cls: 'tx small' });
        // schematic: R(x) from x = 0 to 2·xv, scaled so the hump fills the panel (the axis does not start at 0)
        const Rx = (x) => (p0 + x) * (n0 - drop * x), lo = Rx(0) - (R - Rx(0)) * 0.35;
        const pts = []; for (let k = 0; k <= 40; k++) { const x = (2 * xv * k) / 40; pts.push([190 + (k / 40) * 130, 122 - ((Rx(x) - lo) / (R - lo)) * 84]); }
        v += S.line(184, 130, 332, 130, 'ln') + S.line(184, 130, 184, 12, 'ln') + S.pline(pts, 'acc thick') + S.text(190, 14, 'revenue', { cls: 'tx small', a: 'start' }) + S.text(330, 145, 'price', { cls: 'tx small', a: 'end' }) + S.circle(255, 38, 4, 'accf acc') + S.q(255, 28, 'max?');
        return {
          prompt: T`A theater sells ${n0} tickets a night at $${p0} each. For every $1 increase in price, it sells ${drop} fewer tickets. What ticket price gives the most revenue, and what is that revenue?`,
          visual: S.svg(W, Hh, v, 'Ticket price and a revenue parabola'),
          parts: [
            { label: 'a', ask: 'Best ticket price', kind: 'num', pre: '$', answer: MX.money(price), tol: 0.005, show: '\\$' + MX.money(price), points: 2, verify: MX.V.value(() => p0 + bestInc()) },
            { label: 'b', ask: 'Maximum revenue', kind: 'num', pre: '$', answer: MX.money(R), tol: 0.005, show: '\\$' + MX.commas(R), points: 2, verify: MX.V.value(() => MX.V.fn(revStr, 'x')(bestInc())) },
          ],
          solution: [
            T`Let \(x\) be the number of $1 increases. Price \(${p0} + x\), tickets \(${n0} - ${drop}x\).`,
            T`\(R = \left(${p0} + x\right)\left(${n0} - ${drop}x\right) = ${MX.quad(-drop, n0 - drop * p0, p0 * n0).tex}\), a parabola opening down.`,
            T`Vertex: \(x = -\frac{${n0 - drop * p0}}{2\left(-${drop}\right)} = ${MX.num(xv)}\), so the price is $${MX.money(price)} and \(R = ${MX.money(price)}\cdot${MX.num(cust)} = ${H.box('\\$' + MX.commas(R))}\)`,
          ],
        };
      },
    },
    mincost: {
      name: 'Minimum cost',
      gen(rng) {
        const a = rng.pick([0.5, 1, 2, 0.25]), xv = rng.int(5, 40) * (a === 0.25 ? 4 : 2), b = 2 * a * xv, c = rng.int(20, 90) * 50;
        const minC = c - a * xv * xv;
        if (minC <= 0) return this.gen(rng);
        const W = 320, Hh = 150;
        const costStr = `${MX.num(a)}x^2-${MX.num(b)}x+${c}`, bestN = () => symAxis(costStr);
        const pts = []; for (let k = 0; k <= 40; k++) { const x = (2 * xv * k) / 40; pts.push([50 + (k / 40) * 250, 104 - ((a * x * x - b * x + c - minC) / (c - minC)) * 84]); }
        const v = S.line(40, 130, 310, 130, 'ln') + S.line(40, 130, 40, 12, 'ln') + S.pline(pts, 'acc thick') + S.circle(175, 104, 4, 'accf acc') + S.q(175, 90, 'min?') + S.text(46, 14, 'cost', { cls: 'tx small', a: 'start' }) + S.text(308, 145, 'chairs made', { cls: 'tx small', a: 'end' });
        return {
          prompt: T`A workshop's daily cost to make \(x\) chairs is \(C(x) = ${MX.num(a) === '1' ? '' : MX.num(a)}x^{2} - ${MX.num(b)}x + ${MX.commas(c)}\) dollars. How many chairs should it make to keep the cost as low as possible, and what is the minimum cost?`,
          visual: S.svg(W, Hh, v, 'A cost parabola with a minimum'),
          parts: [
            { label: 'a', ask: 'Number of chairs', kind: 'num', answer: String(xv), show: String(xv), points: 2, verify: MX.V.value(bestN) },
            { label: 'b', ask: 'Minimum daily cost', kind: 'num', pre: '$', answer: String(minC), tol: 0.005, show: '\\$' + MX.commas(minC), points: 2, verify: MX.V.value(() => MX.V.fn(costStr, 'x')(bestN())) },
          ],
          solution: [T`\(C\) is a parabola opening up (\(a = ${MX.num(a)} \gt 0\)), so its lowest point is the vertex.`, T`\(x = -\frac{b}{2a} = \frac{${MX.num(b)}}{2\left(${MX.num(a)}\right)} = ${xv}\)`, T`\(C(${xv}) = ${MX.num(a)}\left(${xv}\right)^{2} - ${MX.num(b)}\left(${xv}\right) + ${c} = ${H.box('\\$' + MX.commas(minC))}\)`],
        };
      },
    },
  };
  const I_tag = (x, y, label) => S.I.tag(x, y, label, 'paperf');
  MX.register({
    id: 'w-quadratic', kind: 'word', section: WSEC, title: 'Quadratic applications', sources: ['added'],
    slots: [
      { label: 'Projectile motion', source: 'Added', pool: ['ground', 'height', 'peak'] },
      { label: 'Maximum and minimum', source: 'Added', pool: ['fence', 'revenue', 'mincost'] },
    ],
    lesson: T`<p>Many real quantities follow a parabola: the height of a thrown ball, or an area or a profit that rises and then falls. These problems ask one of two things. <em>When</em> does the quantity equal some value? Solve a quadratic equation. <em>What is the largest or smallest</em> value? Find the vertex.</p>
<h3>Objects thrown upward</h3>
<div class="box rule"><h4>Formula <b>Height of a projectile</b></h4><p>An object launched straight up from a height of \(h_{0}\) feet with a starting speed of \(v_{0}\) feet per second is at height \(h = -16t^{2} + v_{0}t + h_{0}\) feet after \(t\) seconds. The \(-16\) comes from gravity.</p></div>
<ul><li><strong>When does it hit the ground?</strong> The ground is height 0. Solve \(h = 0\) and keep the positive time.</li>
<li><strong>When is it at height \(H\)?</strong> Solve \(h = H\). There are usually two times: once going up and once coming down.</li>
<li><strong>How high does it go?</strong> The top of the path is the vertex. Find its time, then its height.</li></ul>
<div class="box rule"><h4>Rule <b>The vertex is the maximum or minimum</b></h4><p>For \(y = ax^{2} + bx + c\), the vertex is at \(x = -\frac{b}{2a}\). If \(a \lt 0\) the parabola opens down, and the vertex gives the <strong>maximum</strong>. If \(a \gt 0\) it opens up, and the vertex gives the <strong>minimum</strong>. Put \(x = -\frac{b}{2a}\) back into the formula to get that maximum or minimum value.</p></div>
<div class="ex"><h4>Example</h4><p>A ball is thrown up from a 64-foot roof at 48 ft/s, so \(h = -16t^{2} + 48t + 64\). When does it land, and how high does it go?</p><table class="st">
<tr><td>Landing: set \(h = 0\) and factor out \(-16\).</td><td>\(-16\left(t^{2} - 3t - 4\right) = 0\)</td></tr>
<tr><td>Factor and keep the positive time.</td><td>\(-16\left(t - 4\right)\left(t + 1\right) = 0,\ t = 4\text{ s}\)</td></tr>
<tr><td>Top of the path: \(a = -16\), \(b = 48\).</td><td>\(t = -\frac{48}{2\left(-16\right)} = 1.5\text{ s}\)</td></tr>
<tr><td>Height at that time.</td><td>\(-16\left(1.5\right)^{2} + 48\left(1.5\right) + 64 = 100\text{ ft}\)</td></tr></table></div>
<p>If the equation doesn't factor, use the quadratic formula and round the positive answer as asked.</p>
<h3>Largest area, most revenue, lowest cost</h3>
<p>First write the quantity as a quadratic in one variable. Then find the vertex.</p>
<ul><li><strong>Fencing:</strong> with \(P\) feet of fence around a rectangle, a width of \(x\) leaves a length of \(\frac{P}{2} - x\), so the area is \(x\left(\frac{P}{2} - x\right)\). If a wall forms one side, the fence covers only three sides.</li>
<li><strong>Revenue:</strong> revenue \(=\) price \(\times\) number sold. If each $1 price increase loses some customers, let \(x\) be the number of increases.</li>
<li><strong>Cost:</strong> the cost formula is usually given. Its vertex is the minimum.</li></ul>
<div class="ex"><h4>Example</h4><p>You have 80 feet of fence for a rectangular garden. What is the largest area?</p><table class="st">
<tr><td>Width \(x\); length is half of 80, minus \(x\).</td><td>\(A = x\left(40 - x\right) = -x^{2} + 40x\)</td></tr>
<tr><td>\(a = -1 \lt 0\), so the vertex is the maximum.</td><td>\(x = -\frac{40}{2\left(-1\right)} = 20\)</td></tr>
<tr><td>Length and area.</td><td>\(40 - 20 = 20\), \(A = 20 \cdot 20 = 400\text{ ft}^{2}\)</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>Answer the question that was asked. The vertex's \(x\) tells you <em>when</em> or <em>how many</em>. Put it back into the formula to get <em>how high</em>, <em>how much</em> or <em>what area</em>. Throw out negative times.</p></div>`,
    variants: proj,
  });
})(typeof window !== 'undefined' ? window : globalThis);

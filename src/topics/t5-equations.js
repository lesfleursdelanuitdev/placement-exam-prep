/* Equations and inequalities */
(function (G) {
  'use strict';
  const MX = G.MX;
  const { Q, T, H, poly } = MX;
  const SEC = 'Equations & inequalities';

  // ---------- linear equations ----------
  MX.register({
    id: 'lin-equation', section: SEC, title: 'Linear equations', kind: 'skill',
    sources: ['Exam 2 #9, #15', 'Exam 3 #2'],
    lesson: T`<p>An equation is a balance: both sides have the same value. To solve it, you do the same thing to both sides, one step at a time, until \(x\) is alone on one side. The number on the other side is the solution.</p>
<div class="box def"><h4>Definition <b>Linear equation</b></h4><p>A <strong>linear equation</strong> has a variable only to the first power, such as \(3\left(x - 4\right) = 2x + 1\). There is no \(x^{2}\) and no \(x\) in a denominator. It usually has exactly one solution.</p></div>
<h3>A plan that always works</h3>
<p>Each step undoes something that makes the equation messy. Do them in this order and skip any step you don't need.</p>
<div class="box how"><h4>How to <b>solve a linear equation</b></h4><ol>
<li><strong>Clear fractions.</strong> Find the LCD (least common denominator) of all the fractions. Multiply every term on both sides by it.</li>
<li><strong>Distribute</strong> to remove parentheses.</li>
<li><strong>Collect</strong> the \(x\) terms on one side and the plain numbers on the other. Add or subtract the same thing on both sides.</li>
<li><strong>Divide</strong> both sides by the number in front of \(x\).</li>
<li><strong>Check</strong>: put your answer into the original equation. Both sides should come out equal.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Solve \(3\left(x - 4\right) = 2x + 1\).</p><table class="st">
<tr><td>Distribute the 3.</td><td>\(3x - 12 = 2x + 1\)</td></tr>
<tr><td>Subtract \(2x\) from both sides.</td><td>\(x - 12 = 1\)</td></tr>
<tr><td>Add 12 to both sides.</td><td>\(x = 13\)</td></tr>
<tr><td>Check: both sides equal 27.</td><td>\(3\left(9\right) = 27,\quad 2\left(13\right) + 1 = 27\) ✓</td></tr></table></div>
<h3>Equations with fractions</h3>
<p>Fractions are easy to clear. Multiplying by the LCD turns every fraction into a whole number, and the rest is the plan above.</p>
<div class="ex"><h4>Example</h4><p>Solve \(\dfrac{1}{2}\left(x + 4\right) = \dfrac{1}{3}\left(x + 9\right)\).</p><table class="st">
<tr><td>The LCD of 2 and 3 is 6. Multiply both sides by 6.</td><td>\(3\left(x + 4\right) = 2\left(x + 9\right)\)</td></tr>
<tr><td>Distribute.</td><td>\(3x + 12 = 2x + 18\)</td></tr>
<tr><td>Subtract \(2x\), then subtract 12.</td><td>\(x = 6\)</td></tr>
<tr><td>Check: both sides equal 5.</td><td>\(\frac{1}{2}\left(10\right) = 5,\quad \frac{1}{3}\left(15\right) = 5\) ✓</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>Multiply <em>every</em> term by the LCD, including whole numbers. In \(\frac{x}{3} - 5 = \frac{x}{2}\), multiplying by 6 gives \(2x - 30 = 3x\), not \(2x - 5 = 3x\).</p></div>`,
    variants: {
      dist: {
        name: 'Distribute first',
        gen(rng) {
          let a, c, d, t, x0, b;
          do {
            a = rng.int(2, 5); c = rng.int(1, 4); d = rng.nz(-6, 6); t = rng.nz(-4, 4);
            x0 = a * t; b = (d + a * c) * t;
          } while (d + a * c === 0 || b <= 0 || b > 24 || x0 === 0);
          return {
            prompt: T`Solve the equation for \(x\): \(${a}\left(${b} - ${MX.coef(c)}x\right) = ${MX.coef(d)}x\)`,
            parts: [{ kind: 'num', frac: true, var: 'x', answer: String(x0), show: T`x = ${x0}`, points: 2, verify: MX.V.solves(`${a}(${b}-${c}x)=${d}x`) }],
            solution: [
              T`Distribute: \(${a * b} - ${a * c}x = ${MX.coef(d)}x\)`,
              T`Add \(${a * c}x\) to both sides: \(${a * b} = ${d + a * c}x\)`,
              T`Divide by ${d + a * c}: \(${H.box('x = ' + x0)}\)`,
            ],
          };
        },
      },
      frac: {
        name: 'Fractions on both sides',
        gen(rng) {
          let p, q, Lc, x0, m, n;
          do {
            [p, q] = rng.sample([2, 3, 4, 5, 6], 2);
            Lc = MX.lcm(p, q); x0 = Lc * rng.nz(-3, 4);
            n = rng.int(1, 9); m = n + x0 / p - x0 / q;
          } while (m === 0 || Math.abs(m) > 20);
          return {
            prompt: T`Solve the equation for \(x\): \(\dfrac{x}{${p}} ${MX.sgnTerm(-m)} = \dfrac{x}{${q}} - ${n}\)`,
            parts: [{ kind: 'num', frac: true, var: 'x', answer: String(x0), show: T`x = ${x0}`, points: 3, verify: MX.V.solves(`x/${p}-(${m})=x/${q}-${n}`) }],
            solution: [
              T`Multiply every term by the LCD ${Lc}: \(${MX.coef(Lc / p)}x ${MX.sgnTerm(-m * Lc)} = ${MX.coef(Lc / q)}x - ${n * Lc}\)`,
              T`Collect: \(${MX.coef(Lc / p - Lc / q)}x = ${m * Lc - n * Lc}\)`,
              T`\(${H.box('x = ' + x0)}\)`,
            ],
          };
        },
      },
      fracDist: {
        name: 'Fraction times a binomial',
        gen(rng) {
          let a, d, b, e, c, f, x0, Lc, co;
          H.until(() => {
            [a, d] = rng.sample([2, 3, 4, 6, 12], 2);
            b = rng.int(1, 6); e = rng.int(1, 6); c = rng.nz(-12, 12); x0 = rng.nz(-8, 8);
            Lc = MX.lcm(a, d);
            co = (Lc / a) * b - (Lc / d) * e;
            f = (x0 * co + (Lc / a) * c) / (Lc / d);
            return true;
          }, () => co !== 0 && Number.isInteger(f) && f !== 0 && Math.abs(f) <= 15);
          const B1 = poly([[b, { x: 1 }], [c, {}]]), B2 = poly([[e, { x: 1 }], [f, {}]]);
          const la = Lc / a, ld = Lc / d;
          return {
            prompt: T`Solve the equation: \(\dfrac{1}{${a}}\left(${B1.tex}\right) = \dfrac{1}{${d}}\left(${B2.tex}\right)\)`,
            parts: [{ kind: 'num', frac: true, var: 'x', answer: String(x0), show: T`x = ${x0}`, points: 3, verify: MX.V.solves(`(1/${a})(${B1.asc})=(1/${d})(${B2.asc})`) }],
            solution: [
              T`Multiply both sides by the LCD ${Lc}: \(${MX.coef(la)}\left(${B1.tex}\right) = ${MX.coef(ld)}\left(${B2.tex}\right)\)`,
              T`Distribute: \(${poly([[la * b, { x: 1 }], [la * c, {}]]).tex} = ${poly([[ld * e, { x: 1 }], [ld * f, {}]]).tex}\)`,
              T`Collect: \(${MX.coef(co)}x = ${ld * f - la * c}\)`,
              T`\(${H.box('x = ' + x0)}\)`,
            ],
          };
        },
      },
    },
  });

  // ---------- literal equations ----------
  const FORMULAS = {
    frac: [
      { f: T`n = \frac{2A}{B + d}`, v: 'A', e: 'n=2A/(B+d)', vars: ['n', 'A', 'B', 'd'], a: 'n(B+d)/2', t: T`\frac{n\left(B + d\right)}{2}`, s: [T`Multiply both sides by \(\left(B + d\right)\): \(n\left(B + d\right) = 2A\)`, T`Divide by 2.`] },
      { f: T`K = \frac{ma}{F}`, v: 'm', e: 'K=ma/F', vars: ['K', 'm', 'a', 'F'], a: 'KF/a', t: T`\frac{KF}{a}`, s: [T`Multiply both sides by \(F\): \(KF = ma\)`, T`Divide by \(a\).`] },
      { f: T`K = \frac{ma}{F}`, v: 'F', e: 'K=ma/F', vars: ['K', 'm', 'a', 'F'], a: 'ma/K', t: T`\frac{ma}{K}`, s: [T`Multiply both sides by \(F\): \(KF = ma\)`, T`Divide by \(K\).`] },
      { f: T`A = \frac{h\left(a + b\right)}{2}`, v: 'h', e: 'A=h(a+b)/2', vars: ['A', 'h', 'a', 'b'], a: '2A/(a+b)', t: T`\frac{2A}{a + b}`, s: [T`Multiply both sides by 2: \(2A = h\left(a + b\right)\)`, T`Divide by \(\left(a + b\right)\).`] },
      { f: T`V = \frac{1}{3}Bh`, v: 'h', e: 'V=(1/3)Bh', vars: ['V', 'B', 'h'], a: '3V/B', t: T`\frac{3V}{B}`, s: [T`Multiply both sides by 3: \(3V = Bh\)`, T`Divide by \(B\).`] },
    ],
    linear: [
      { f: T`P = 2l + 2w`, v: 'w', e: 'P=2l+2w', vars: ['P', 'l', 'w'], a: '(P-2l)/2', t: T`\frac{P - 2l}{2}`, s: [T`Subtract \(2l\): \(P - 2l = 2w\)`, T`Divide by 2.`] },
      { f: T`P = 2l + 2w`, v: 'l', e: 'P=2l+2w', vars: ['P', 'l', 'w'], a: '(P-2w)/2', t: T`\frac{P - 2w}{2}`, s: [T`Subtract \(2w\): \(P - 2w = 2l\)`, T`Divide by 2.`] },
      { f: T`y = mx + b`, v: 'x', e: 'y=mx+b', vars: ['y', 'm', 'x', 'b'], a: '(y-b)/m', t: T`\frac{y - b}{m}`, s: [T`Subtract \(b\): \(y - b = mx\)`, T`Divide by \(m\).`] },
      { f: T`ax + by = c`, v: 'y', e: 'ax+by=c', vars: ['a', 'x', 'b', 'y', 'c'], a: '(c-ax)/b', t: T`\frac{c - ax}{b}`, s: [T`Subtract \(ax\): \(by = c - ax\)`, T`Divide by \(b\).`] },
      { f: T`A = P + Prt`, v: 'r', e: 'A=P+Prt', vars: ['A', 'P', 'r', 't'], a: '(A-P)/(Pt)', t: T`\frac{A - P}{Pt}`, s: [T`Subtract \(P\): \(A - P = Prt\)`, T`Divide by \(Pt\).`] },
    ],
    mixed: [
      { f: T`I = Prt`, v: 't', e: 'I=Prt', vars: ['I', 'P', 'r', 't'], a: 'I/(Pr)', t: T`\frac{I}{Pr}`, s: [T`\(t\) is multiplied by \(Pr\).`, T`Divide both sides by \(Pr\).`] },
      { f: T`C = \frac{5}{9}\left(F - 32\right)`, v: 'F', e: 'C=(5/9)(F-32)', vars: ['C', 'F'], a: '9C/5+32', t: T`\frac{9}{5}C + 32`, s: [T`Multiply both sides by \(\frac{9}{5}\): \(\frac{9}{5}C = F - 32\)`, T`Add 32.`] },
      { f: T`S = \frac{a}{1 - r}`, v: 'a', e: 'S=a/(1-r)', vars: ['S', 'a', 'r'], a: 'S(1-r)', t: T`S\left(1 - r\right)`, s: [T`Multiply both sides by \(\left(1 - r\right)\).`, T`That leaves \(a\) by itself.`] },
      { f: T`m = \frac{y - k}{x - h}`, v: 'y', e: 'm=(y-k)/(x-h)', vars: ['m', 'y', 'k', 'x', 'h'], a: 'm(x-h)+k', t: T`m\left(x - h\right) + k`, s: [T`Multiply both sides by \(\left(x - h\right)\): \(m\left(x - h\right) = y - k\)`, T`Add \(k\).`] },
    ],
  };
  function literal(rng, key) {
    const F = rng.pick(FORMULAS[key]);
    return {
      prompt: T`Solve for \(${F.v}\): \(${F.f}\)`,
      parts: [{ kind: 'expr', lhs: F.v, vars: F.vars.filter((x) => x !== F.v), answer: F.a, show: F.v + ' = ' + F.t, pre: F.v + ' =', points: 2, verify: MX.V.solvesFor(F.e, F.v) }],
      solution: [...F.s, T`\(${H.box(F.v + ' = ' + F.t)}\)`],
    };
  }
  MX.register({
    id: 'literal', section: SEC, title: 'Solving a formula for a variable', kind: 'skill',
    sources: ['Exam 1 #16', 'Exam 2 #28', 'Exam 3 #3'],
    lesson: T`<p>A formula such as \(I = Prt\) is an equation with several letters. "Solve for \(t\)" means rewrite the formula so \(t\) is alone on one side. You use the same moves as for any linear equation. The answer is a new formula, not a number.</p>
<div class="box rule"><h4>Rule <b>Treat the other letters as numbers</b></h4><p>Every letter except the one you are solving for acts like a fixed number. Add, subtract, multiply or divide by it on both sides, just as you would with 3 or 7.</p></div>
<h3>Undo the formula in reverse order</h3>
<div class="box how"><h4>How to <b>solve a formula for one variable</b></h4><ol>
<li>If there is a fraction, multiply both sides by its denominator. If the denominator is a group like \(a + b\), multiply by the whole group.</li>
<li>Add or subtract to move terms without your variable to the other side.</li>
<li>Divide both sides by whatever is multiplying your variable. If that is a group, divide by the whole group and keep it in parentheses.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Solve \(C = 2a + 5b\) for \(b\).</p><table class="st">
<tr><td>Subtract \(2a\) from both sides.</td><td>\(C - 2a = 5b\)</td></tr>
<tr><td>Divide both sides by 5.</td><td>\(b = \dfrac{C - 2a}{5}\)</td></tr></table></div>
<div class="ex"><h4>Example</h4><p>Solve \(R = \dfrac{3V}{a + b}\) for \(V\).</p><table class="st">
<tr><td>Multiply both sides by the denominator \(\left(a + b\right)\).</td><td>\(R\left(a + b\right) = 3V\)</td></tr>
<tr><td>Divide both sides by 3.</td><td>\(V = \dfrac{R\left(a + b\right)}{3}\)</td></tr></table></div>
<p>If a fraction multiplies a group, as in \(y = \frac{2}{3}\left(x - 6\right)\), multiply both sides by the flipped fraction \(\frac{3}{2}\). That gives \(\frac{3}{2}y = x - 6\), so \(x = \frac{3}{2}y + 6\).</p>
<div class="box warn"><h4>Watch out</h4><p>When you divide, divide the <em>whole</em> side. \(\frac{C - 2a}{5}\) is right; \(C - \frac{2a}{5}\) is wrong. When you type an answer, use parentheses: <code>(C-2a)/5</code>, <code>R(a+b)/3</code>.</p></div>`,
    variants: {
      frac: { name: 'Formula with a fraction', gen: (rng) => literal(rng, 'frac') },
      linear: { name: 'Formula with a sum', gen: (rng) => literal(rng, 'linear') },
      mixed: { name: 'Other formulas', gen: (rng) => literal(rng, 'mixed') },
    },
  });

  // ---------- linear inequalities ----------
  // endpoints here are whole numbers in [-5, 5]; a narrower, coarser scan keeps the region checks fast
  // (V.region still bisects every boundary it finds and probes far outside the window)
  const RO = { lo: -30, hi: 30, n: 3000 };
  function ineqParts(rng, op, v, solutionPre, spec) {
    // spec: the inequality as displayed, in parser syntax
    const nl = H.nlChoices(rng, op, v);
    return {
      parts: [
        { label: 'a', ask: T`Solve the inequality for \(x\).`, kind: 'ineq', var: 'x', answer: 'x' + op + v, show: T`x ${H.rel(op)} ${v}`, points: 2, verify: MX.V.region(spec, RO) },
        { label: 'b', ask: 'Which graph shows the solution?', kind: 'choice', options: nl.options, answer: nl.answer, data: nl.data, graph: true, points: 2, verify: MX.V.choiceRegion(spec, RO) },
      ],
      solution: [
        ...solutionPre,
        T`\(${H.box(T`x ${H.rel(op)} ${v}`)}\)`,
        T`Graph: ${op.includes('=') ? 'a closed (filled) dot, because ' + v + ' is included' : 'an open dot, because ' + v + ' is not included'}, shading to the ${op[0] === '>' ? 'right' : 'left'}.`,
      ],
    };
  }
  const OPS = ['<', '<=', '>', '>='];
  MX.register({
    id: 'lin-inequality', section: SEC, title: 'Linear inequalities', kind: 'skill',
    sources: ['Exam 1 #18', 'Exam 2 #18'],
    lesson: T`<p>An inequality compares two sides with \(\lt\), \(\le\), \(\gt\) or \(\ge\) instead of \(=\). An equation like \(x = 3\) has one answer, but an inequality like \(x \gt 3\) has infinitely many. You solve it almost exactly like an equation.</p>
<div class="box def"><h4>Definition <b>Solution set</b></h4><p>The <strong>solution set</strong> of an inequality is every number that makes it true. For \(x \le 2\), that is 2 and every number below 2.</p></div>
<h3>Solve it like an equation, with one extra rule</h3>
<p>You may add or subtract any number on both sides. You may multiply or divide both sides by a positive number. Only a negative number needs care: \(2 \lt 5\), but \(-2 \gt -5\). Multiplying by a negative reverses the order.</p>
<div class="box rule"><h4>Rule <b>Flip the sign for a negative</b></h4><p>When you multiply or divide both sides by a <strong>negative</strong> number, reverse the inequality sign: \(\lt\) becomes \(\gt\), and \(\le\) becomes \(\ge\).</p></div>
<div class="ex"><h4>Example</h4><p>Solve \(-\left(2 + 3x\right) \le 10\).</p><table class="st">
<tr><td>Distribute the negative sign.</td><td>\(-2 - 3x \le 10\)</td></tr>
<tr><td>Add 2 to both sides.</td><td>\(-3x \le 12\)</td></tr>
<tr><td>Divide by \(-3\) and flip the sign.</td><td>\(x \ge -4\)</td></tr>
<tr><td>Check with \(x = 0\), which should work.</td><td>\(-\left(2 + 0\right) = -2 \le 10\) ✓</td></tr></table></div>
<p>A fraction in front of \(x\) works the same way: multiply by its flip. From \(-\frac{2}{3}x \gt 4\), multiply by \(-\frac{3}{2}\) and flip: \(x \lt -6\). When \(x\) is on both sides, collect the \(x\) terms on one side first, then divide.</p>
<h3>Graph the answer on a number line</h3>
<div class="box rule"><h4>Rule <b>Graphing an inequality</b></h4><p>Put a dot at the endpoint. Use a <strong>closed</strong> (filled) dot for \(\le\) or \(\ge\), because the endpoint is included. Use an <strong>open</strong> dot for \(\lt\) or \(\gt\), because it is not. Shade right for \(x \gt\) or \(x \ge\); shade left for \(x \lt\) or \(x \le\).</p></div>
<p>So \(x \ge -4\) is a filled dot at \(-4\), shaded to the right.</p>
<div class="box warn"><h4>Watch out</h4><p>Flip the sign only when you multiply or divide by a negative. A negative number somewhere else is no reason to flip: \(x + 5 \lt -1\) becomes \(x \lt -6\) after you subtract 5. Type \(\le\) as <code>&lt;=</code> and \(\ge\) as <code>&gt;=</code>.</p></div>`,
    variants: {
      frac: {
        name: 'Fraction coefficient',
        gen(rng) {
          const q = rng.pick([2, 3, 4]), p = rng.pick([1, 1, 2, 3].filter((x) => MX.gcd(x, q) === 1));
          const c = new Q(-p, q).mul(rng.chance(0.8) ? 1 : -1);
          const mults = [-4, -3, -2, -1, 1, 2, 3, 4].map((k) => k * q).filter((x) => Math.abs(x) <= 5);
          const v = rng.pick(mults.length ? mults : [q]);
          const a = rng.nz(-6, 6), b = c.mul(v).add(a).val();
          const opIn = rng.pick(OPS), op = c.n < 0 ? H.flip(opIn) : opIn;
          const lhs = T`${c.n < 0 ? '-' : ''}\frac{${Math.abs(c.n)}}{${c.d}}x ${MX.sgnTerm(a)}`;
          const r = ineqParts(rng, op, v, [
            T`${a > 0 ? 'Subtract ' + a : 'Add ' + -a} on both sides: \(${c.n < 0 ? '-' : ''}\frac{${Math.abs(c.n)}}{${c.d}}x ${H.rel(opIn)} ${b - a}\)`,
            T`Multiply both sides by \(${new Q(c.d, c.n).tex()}\)${c.n < 0 ? ' (negative, so flip the sign)' : ''}: \(x ${H.rel(op)} ${v}\)`,
          ], `(${c.str()})x+(${a}) ${opIn} ${b}`);
          return Object.assign({ prompt: T`Solve the inequality \(${lhs} ${H.rel(opIn)} ${b}\) for \(x\). Then graph the solution set.` }, r);
        },
      },
      dist: {
        name: 'Negative outside parentheses',
        gen(rng) {
          const v = rng.nz(-5, 5), b = rng.int(2, 9), a = rng.int(1, 9);
          const cRHS = -a - b * v, opIn = rng.pick(OPS), op = H.flip(opIn);
          const r = ineqParts(rng, op, v, [
            T`Distribute the negative: \(-${a} - ${b}x ${H.rel(opIn)} ${cRHS}\)`,
            T`Add ${a}: \(-${b}x ${H.rel(opIn)} ${cRHS + a}\)`,
            T`Divide by \(-${b}\) and flip the sign: \(x ${H.rel(op)} ${v}\)`,
          ], `-(${a}+${b}x) ${opIn} ${cRHS}`);
          return Object.assign({ prompt: T`Consider the inequality \(-\left(${a} + ${b}x\right) ${H.rel(opIn)} ${cRHS}\). Solve it for \(x\) and graph the solution.` }, r);
        },
      },
      both: {
        name: 'Variables on both sides',
        gen(rng) {
          let a, c, v, b, d;
          do { a = rng.nz(-6, 7); c = rng.nz(-6, 7); v = rng.nz(-5, 5); b = rng.nz(-9, 9); } while (a === c);
          d = (a - c) * v + b;
          const opIn = rng.pick(OPS), k = a - c, op = k < 0 ? H.flip(opIn) : opIn;
          const r = ineqParts(rng, op, v, [
            T`Move \(x\) terms left and numbers right: \(${MX.coef(k)}x ${H.rel(opIn)} ${d - b}\)`,
            T`Divide by ${k}${k < 0 ? ' (negative, so flip the sign)' : ''}: \(x ${H.rel(op)} ${v}\)`,
          ], `${poly([[a, { x: 1 }], [b, {}]]).asc} ${opIn} ${poly([[c, { x: 1 }], [d, {}]]).asc}`);
          return Object.assign({ prompt: T`Solve \(${poly([[a, { x: 1 }], [b, {}]]).tex} ${H.rel(opIn)} ${poly([[c, { x: 1 }], [d, {}]]).tex}\) for \(x\), then graph the solution.` }, r);
        },
      },
    },
  });

  // ---------- exponential equations ----------
  const BASES = [[2, 9], [3, 6], [5, 4], [4, 4]];
  MX.register({
    id: 'exp-equation', section: SEC, title: 'Exponential equations (same base)', kind: 'skill',
    sources: ['Exam 1 #12', 'Exam 2 #16', 'Exam 3 #10'],
    lesson: T`<p>In an exponential equation the variable is in the exponent, as in \(2^{x + 1} = 32\). If you can write both sides as powers of the same number, the problem turns into a linear equation you already know how to solve.</p>
<div class="box rule"><h4>Property <b>Equal powers, equal exponents</b></h4><p>If \(b^{M} = b^{N}\), then \(M = N\). This works for any base \(b \gt 0\) with \(b \ne 1\). Once the bases match, you can drop them and set the exponents equal.</p></div>
<h3>Know your powers</h3>
<p>You need to spot that a number is a power of 2, 3 or 5. These come up most often:</p>
<p>\(2^{3} = 8,\ 2^{4} = 16,\ 2^{5} = 32,\ 2^{6} = 64\)<br>\(3^{2} = 9,\ 3^{3} = 27,\ 3^{4} = 81,\ 3^{5} = 243\)<br>\(5^{2} = 25,\ 5^{3} = 125,\ 5^{4} = 625\)</p>
<div class="box rule"><h4>Rule <b>Negative exponents and powers of powers</b></h4><p>A fraction with 1 on top is a negative power: \(\frac{1}{b^{n}} = b^{-n}\), so \(\frac{1}{9} = 3^{-2}\). A power raised to a power multiplies the exponents: \(\left(b^{m}\right)^{n} = b^{mn}\), so \(4^{x} = \left(2^{2}\right)^{x} = 2^{2x}\).</p></div>
<div class="box how"><h4>How to <b>solve an equation with the variable in the exponent</b></h4><ol>
<li>Write both sides as powers of the same base.</li>
<li>Set the exponents equal to each other.</li>
<li>Solve the linear equation. Leave a fraction answer as a simplified fraction.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Solve \(3^{2x - 1} = \dfrac{1}{9}\).</p><table class="st">
<tr><td>Write \(\frac{1}{9}\) as a power of 3.</td><td>\(\frac{1}{9} = \frac{1}{3^{2}} = 3^{-2}\)</td></tr>
<tr><td>Now the bases match.</td><td>\(3^{2x - 1} = 3^{-2}\)</td></tr>
<tr><td>Set the exponents equal.</td><td>\(2x - 1 = -2\)</td></tr>
<tr><td>Solve.</td><td>\(2x = -1,\quad x = -\frac{1}{2}\)</td></tr></table></div>
<div class="ex"><h4>Example</h4><p>Solve \(4^{x + 1} = 8^{x}\).</p><table class="st">
<tr><td>Both 4 and 8 are powers of 2.</td><td>\(\left(2^{2}\right)^{x + 1} = \left(2^{3}\right)^{x}\)</td></tr>
<tr><td>Multiply the exponents.</td><td>\(2^{2x + 2} = 2^{3x}\)</td></tr>
<tr><td>Set the exponents equal and solve.</td><td>\(2x + 2 = 3x,\quad x = 2\)</td></tr>
<tr><td>Check: both sides equal 64.</td><td>\(4^{3} = 64,\quad 8^{2} = 64\) ✓</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>When you replace 4 by \(2^{2}\), the 2 multiplies the <em>whole</em> exponent. \(4^{x + 1} = 2^{2\left(x + 1\right)} = 2^{2x + 2}\), not \(2^{2x + 1}\).</p></div>`,
    variants: {
      common: {
        name: 'Rewrite the right side',
        gen(rng) {
          const [b, kmax] = rng.pick(BASES);
          const k = rng.int(2, kmax), p = rng.nz(-6, 6), q = rng.int(-9, 9);
          const ex = rng.chance(0.5) && p < 0 ? poly([[q, {}], [p, { x: 1 }]]) : poly([[p, { x: 1 }], [q, {}]]);
          const ans = new Q(k - q, p);
          if (ans.isInt() && rng.chance(0.5)) return this.gen(rng);
          return {
            prompt: T`Solve for \(x\): \(${b}^{${ex.tex}} = ${Math.pow(b, k)}\). Write your answer as a simplified fraction if needed.`,
            parts: [{ kind: 'num', frac: true, var: 'x', answer: ans.str(), show: T`x = ${ans.tex()}`, points: 3, verify: MX.V.solves(`${b}^(${ex.asc})=${Math.pow(b, k)}`, { lo: -60, hi: 60 }) }],
            solution: [
              T`\(${Math.pow(b, k)} = ${b}^{${k}}\), so \(${b}^{${ex.tex}} = ${b}^{${k}}\)`,
              T`Set exponents equal: \(${ex.tex} = ${k}\)`,
              T`\(${MX.coef(p)}x = ${k - q}\), so \(${H.box(T`x = ${ans.tex()}`)}\)`,
            ],
          };
        },
      },
      rewrite: {
        name: 'Different bases, same root',
        gen(rng) {
          const [A, C, g, al, be] = rng.pick([[4, 8, 2, 2, 3], [9, 27, 3, 2, 3], [25, 125, 5, 2, 3], [8, 16, 2, 3, 4], [4, 32, 2, 2, 5], [27, 9, 3, 3, 2]]);
          let m, r, n, s, den;
          do { m = rng.int(1, 3); r = rng.int(-4, 5); n = rng.int(1, 3); s = rng.int(-4, 5); den = al * m - be * n; } while (den === 0 || (r === 0 && s === 0));
          const ans = new Q(be * s - al * r, den);
          const L = poly([[m, { x: 1 }], [r, {}]]), R = poly([[n, { x: 1 }], [s, {}]]);
          return {
            prompt: T`Solve for \(x\): \(${A}^{${L.tex}} = ${C}^{${R.tex}}\)`,
            parts: [{ kind: 'num', frac: true, var: 'x', answer: ans.str(), show: T`x = ${ans.tex()}`, points: 3, verify: MX.V.solves(`${A}^(${L.asc})=${C}^(${R.asc})`, { lo: -60, hi: 60 }) }],
            solution: [
              T`\(${A} = ${g}^{${al}}\) and \(${C} = ${g}^{${be}}\), so \(${g}^{${al}\left(${L.tex}\right)} = ${g}^{${be}\left(${R.tex}\right)}\)`,
              T`Set exponents equal: \(${poly([[al * m, { x: 1 }], [al * r, {}]]).tex} = ${poly([[be * n, { x: 1 }], [be * s, {}]]).tex}\)`,
              T`\(${MX.coef(den)}x = ${be * s - al * r}\), so \(${H.box(T`x = ${ans.tex()}`)}\)`,
            ],
          };
        },
      },
      recip: {
        name: 'Negative exponent',
        gen(rng) {
          const [b, kmax] = rng.pick(BASES.slice(0, 3));
          const k = rng.int(1, Math.min(kmax, 5)), p = rng.nz(-5, 5), q = rng.int(-6, 6);
          const ans = new Q(-k - q, p);
          const ex = poly([[p, { x: 1 }], [q, {}]]);
          return {
            prompt: T`Solve: \(${b}^{${ex.tex}} = \dfrac{1}{${Math.pow(b, k)}}\)`,
            parts: [{ kind: 'num', frac: true, var: 'x', answer: ans.str(), show: T`x = ${ans.tex()}`, points: 3, verify: MX.V.solves(`${b}^(${ex.asc})=1/${Math.pow(b, k)}`, { lo: -60, hi: 60 }) }],
            solution: [
              T`\(\frac{1}{${Math.pow(b, k)}} = \frac{1}{${b}^{${k}}} = ${b}^{-${k}}\)`,
              T`Set exponents equal: \(${ex.tex} = -${k}\)`,
              T`\(${MX.coef(p)}x = ${-k - q}\), so \(${H.box(T`x = ${ans.tex()}`)}\)`,
            ],
          };
        },
      },
    },
  });

  // ---------- quadratics by factoring ----------
  const rootsShow = (rs, v = 'x') => rs.map((r) => v + ' = ' + (r instanceof Q ? r.tex() : r)).join(',\\quad ');
  MX.register({
    id: 'quad-factor', section: 'Quadratic equations & functions', title: 'Solving quadratics by factoring', kind: 'skill',
    sources: ['Exam 1 #14', 'Exam 2 #14', 'Exam 3 #14'],
    lesson: T`<p>A quadratic equation has an \(x^{2}\) term, so the tricks for linear equations can't get \(x\) alone. Instead you factor. Factoring works because of one simple fact about zero.</p>
<div class="box def"><h4>Definition <b>Quadratic equation</b></h4><p>A <strong>quadratic equation</strong> can be written in <strong>standard form</strong> \(ax^{2} + bx + c = 0\), where \(a \ne 0\). It can have two solutions, one, or none.</p></div>
<div class="box rule"><h4>Property <b>Zero-product property</b></h4><p>If \(A \cdot B = 0\), then \(A = 0\) or \(B = 0\). The only way a product can be zero is if one of its factors is zero.</p></div>
<p>The property needs a 0 on one side. It says nothing about \(A \cdot B = 6\), so always move every term to one side first.</p>
<div class="box how"><h4>How to <b>solve a quadratic by factoring</b></h4><ol>
<li>Move every term to one side so the other side is 0.</li>
<li>Factor completely. Take out the GCF (greatest common factor) first, then factor what is left.</li>
<li>Set each factor equal to 0.</li>
<li>Solve each small equation. Each one gives a solution.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Solve \(x^{2} + 2x = 15\).</p><table class="st">
<tr><td>Subtract 15 to get 0 on the right.</td><td>\(x^{2} + 2x - 15 = 0\)</td></tr>
<tr><td>Find two numbers that multiply to \(-15\) and add to 2: 5 and \(-3\).</td><td>\(\left(x + 5\right)\left(x - 3\right) = 0\)</td></tr>
<tr><td>Set each factor equal to 0.</td><td>\(x + 5 = 0 \text{ or } x - 3 = 0\)</td></tr>
<tr><td>Solve each one.</td><td>\(x = -5 \text{ or } x = 3\)</td></tr></table></div>
<p>If the leading coefficient is not 1, a factor may look like \(3x - 2\). Setting it to 0 gives a fraction: \(3x = 2\), so \(x = \frac{2}{3}\).</p>
<h3>When every term has an \(x\)</h3>
<p>Factor out the \(x\) along with the number. The \(x\) becomes its own factor and gives the solution \(x = 0\). A cubic (an \(x^{3}\) equation) can then have three solutions.</p>
<div class="ex"><h4>Example</h4><p>Solve \(2x^{3} - 10x^{2} + 12x = 0\).</p><table class="st">
<tr><td>Factor out the GCF \(2x\).</td><td>\(2x\left(x^{2} - 5x + 6\right) = 0\)</td></tr>
<tr><td>Factor the trinomial.</td><td>\(2x\left(x - 2\right)\left(x - 3\right) = 0\)</td></tr>
<tr><td>Set each factor equal to 0.</td><td>\(x = 0 \text{ or } x = 2 \text{ or } x = 3\)</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>Never divide both sides by \(x\). In \(4x^{2} = 16x\), dividing by \(x\) gives only \(x = 4\) and loses \(x = 0\). Factor instead: \(4x\left(x - 4\right) = 0\), so \(x = 0\) or \(x = 4\).</p></div>`,
    variants: {
      trinomial: {
        name: 'Trinomial',
        gen(rng) {
          const v = rng.pick(['t', 'x', 'n']);
          let r, s; do { r = rng.nz(-9, 9); s = rng.nz(-9, 9); } while (r === s || r + s === 0);
          const E = MX.quad(1, r + s, r * s, v);
          const F1 = poly([[1, { [v]: 1 }], [r, {}]]), F2 = poly([[1, { [v]: 1 }], [s, {}]]);
          return {
            prompt: T`Solve for \(${v}\) by factoring: \(${E.tex} = 0\)`,
            parts: [{ kind: 'nums', count: 2, var: v, pre: v + ' =', joiner: 'or', answers: [String(-r), String(-s)], show: rootsShow([-r, -s], v), points: 3, verify: MX.V.solves(`${E.asc}=0`, { v }) }],
            solution: [
              T`Two numbers that multiply to ${r * s} and add to ${r + s}: ${r} and ${s}.`,
              T`\(\left(${F1.tex}\right)\left(${F2.tex}\right) = 0\)`,
              T`\(${F1.tex} = 0\) or \(${F2.tex} = 0\): \(${H.box(rootsShow([-r, -s], v))}\)`,
            ],
          };
        },
      },
      gcf: {
        name: 'Common factor',
        gen(rng) {
          const a = rng.int(2, 7), k = rng.nz(-8, 8);
          const E = poly([[a, { x: 2 }], [-a * k, { x: 1 }]]);
          return {
            prompt: T`Solve the equation for \(x\): \(${E.tex} = 0\)`,
            parts: [{ kind: 'nums', count: 2, var: 'x', pre: 'x =', joiner: 'or', answers: ['0', String(k)], show: rootsShow([0, k]), points: 3, verify: MX.V.solves(`${E.asc}=0`) }],
            solution: [
              T`Factor out \(${a}x\): \(${a}x\left(x ${MX.sgnTerm(-k)}\right) = 0\)`,
              T`\(${a}x = 0\) or \(x ${MX.sgnTerm(-k)} = 0\)`,
              T`\(${H.box(rootsShow([0, k]))}\)`,
            ],
          };
        },
      },
      cubic: {
        name: 'Cubic with a GCF',
        gen(rng) {
          const g = rng.int(1, 4);
          let r, s; do { r = rng.nz(-8, 8); s = rng.nz(-8, 8); } while (r === s || r + s === 0);
          const E = poly([[g, { x: 3 }], [g * (r + s), { x: 2 }], [g * r * s, { x: 1 }]]);
          const In = MX.quad(1, r + s, r * s);
          const lead = (g === 1 ? '' : g) + 'x';
          return {
            prompt: T`Solve by factoring: \(${E.tex} = 0\)`,
            parts: [{ kind: 'nums', count: 3, var: 'x', pre: 'x =', joiner: 'or', answers: ['0', String(-r), String(-s)], show: rootsShow([0, -r, -s]), points: 4, verify: MX.V.solves(`${E.asc}=0`) }],
            solution: [
              T`Factor out \(${lead}\): \(${lead}\left(${In.tex}\right) = 0\)`,
              T`Factor the trinomial: \(${lead}\left(x ${MX.sgnTerm(r)}\right)\left(x ${MX.sgnTerm(s)}\right) = 0\)`,
              T`Set each factor to 0: \(${H.box(rootsShow([0, -r, -s]))}\)`,
            ],
          };
        },
      },
      ac: {
        name: 'Leading coefficient not 1',
        gen(rng) {
          let p, q, r, s;
          do { p = rng.int(2, 4); q = rng.nz(-7, 7); r = 1; s = rng.nz(-6, 6); } while (MX.gcd(p, q) !== 1 || p * s + q * r === 0);
          const E = MX.quad(p * r, p * s + q * r, q * s);
          const r1 = new Q(-q, p), r2 = new Q(-s, r);
          return {
            prompt: T`Solve by factoring: \(${E.tex} = 0\)`,
            parts: [{ kind: 'nums', count: 2, var: 'x', pre: 'x =', joiner: 'or', frac: true, answers: [r1.str(), r2.str()], show: rootsShow([r1, r2]), points: 3, verify: MX.V.solves(`${E.asc}=0`) }],
            solution: [
              T`Factor (AC method): \(\left(${poly([[p, { x: 1 }], [q, {}]]).tex}\right)\left(x ${MX.sgnTerm(s)}\right) = 0\)`,
              T`\(${poly([[p, { x: 1 }], [q, {}]]).tex} = 0 \Rightarrow x = ${r1.tex()}\); \(x ${MX.sgnTerm(s)} = 0 \Rightarrow x = ${r2.tex()}\)`,
              T`\(${H.box(rootsShow([r1, r2]))}\)`,
            ],
          };
        },
      },
    },
  });

  // ---------- square root property ----------
  MX.register({
    id: 'quad-sqrt', section: 'Quadratic equations & functions', title: 'Square root property', kind: 'skill',
    sources: ['Exam 1 #15', 'Exam 2 #8', 'Exam 3 #5'],
    lesson: T`<p>Some quadratics have no \(x\) term, like \(x^{2} = 36\). You don't need to factor these. You undo the square by taking a square root, but you must remember that two numbers have the same square: \(6^{2} = 36\) and \(\left(-6\right)^{2} = 36\).</p>
<div class="box rule"><h4>Property <b>Square root property</b></h4><p>If \(u^{2} = k\) and \(k \ge 0\), then \(u = \sqrt{k}\) or \(u = -\sqrt{k}\). You can write both at once as \(u = \pm\sqrt{k}\) (read "plus or minus").</p></div>
<p>Here \(u\) can be a single letter or a whole group such as \(2y - 1\).</p>
<div class="box how"><h4>How to <b>solve with the square root property</b></h4><ol>
<li>Get the squared part alone on one side. If it has a number in front, divide by that number.</li>
<li>Take the square root of both sides. Write \(\pm\) on the number side.</li>
<li>Simplify the square root. Take out any perfect-square factor: \(\sqrt{20} = \sqrt{4 \cdot 5} = 2\sqrt{5}\).</li>
<li>If the squared part was a group, solve the \(+\) and \(-\) cases separately.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Solve \(3x^{2} - 60 = 0\).</p><table class="st">
<tr><td>Add 60 to both sides.</td><td>\(3x^{2} = 60\)</td></tr>
<tr><td>Divide by 3.</td><td>\(x^{2} = 20\)</td></tr>
<tr><td>Take the square root, with \(\pm\).</td><td>\(x = \pm\sqrt{20}\)</td></tr>
<tr><td>Simplify: 4 is a perfect square factor of 20.</td><td>\(x = \pm 2\sqrt{5}\)</td></tr></table></div>
<div class="ex"><h4>Example</h4><p>Solve \(\left(2y - 1\right)^{2} = 25\).</p><table class="st">
<tr><td>The squared part is already alone. Take the square root.</td><td>\(2y - 1 = \pm 5\)</td></tr>
<tr><td>Solve the \(+\) case.</td><td>\(2y - 1 = 5,\quad y = 3\)</td></tr>
<tr><td>Solve the \(-\) case.</td><td>\(2y - 1 = -5,\quad y = -2\)</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>Don't forget the \(\pm\). Writing only \(x = 2\sqrt{5}\) misses half the answer. Type exact answers like <code>2√5</code> and <code>-2√5</code>, or one box with <code>+-2√5</code>.</p></div>`,
    variants: {
      binomial: {
        name: 'Squared binomial',
        gen(rng) {
          const v = rng.pick(['k', 'x', 'y']);
          const a = rng.int(1, 5), b = rng.nz(-9, 9), c = rng.int(2, 9);
          if (a === 1 && rng.chance(0.6)) return this.gen(rng);
          const r1 = new Q(c - b, a), r2 = new Q(-c - b, a);
          const B = poly([[a, { [v]: 1 }], [b, {}]]);
          return {
            prompt: T`Solve \(\left(${B.tex}\right)^{2} = ${c * c}\) for \(${v}\) by using the square root property.`,
            parts: [{ kind: 'nums', count: 2, var: v, pre: v + ' =', joiner: 'or', frac: true, exact: true, answers: [r1.str(), r2.str()], show: rootsShow([r1, r2], v), points: 3, verify: MX.V.solves(`(${B.asc})^2=${c * c}`, { v }) }],
            solution: [
              T`Square root of both sides: \(${B.tex} = \pm ${c}\)`,
              T`\(${B.tex} = ${c}\) gives \(${v} = ${r1.tex()}\); \(${B.tex} = -${c}\) gives \(${v} = ${r2.tex()}\)`,
              T`\(${H.box(rootsShow([r1, r2], v))}\)`,
            ],
          };
        },
      },
      simple: {
        name: 'Whole-number answers',
        gen(rng) {
          const a = rng.int(2, 9), r = rng.int(1, 9);
          return {
            prompt: T`Solve the equation for \(x\): \(${a}x^{2} = ${a * r * r}\)`,
            parts: [{ kind: 'nums', count: 2, var: 'x', pre: 'x =', joiner: 'or', exact: true, answers: [String(r), String(-r)], show: T`x = \pm ${r}`, points: 2, verify: MX.V.solves(`${a}x^2=${a * r * r}`) }],
            solution: [T`Divide by ${a}: \(x^{2} = ${r * r}\)`, T`\(x = \pm\sqrt{${r * r}} = \pm ${r}\)`, T`\(${H.box(T`x = ${r} \text{ or } x = -${r}`)}\)`],
          };
        },
      },
      radical: {
        name: 'Radical answers',
        gen(rng) {
          const a = rng.int(2, 6), s = rng.int(2, 5), f = rng.pick([2, 3, 5, 6, 7, 10]);
          const N = s * s * f;
          return {
            prompt: T`Use the square root property to solve \(${a}x^{2} - ${a * N} = 0\). Leave your answer in simplified radical form.`,
            parts: [{ kind: 'nums', count: 2, var: 'x', pre: 'x =', joiner: 'or', exact: true, radical: true, answers: [`${s}√(${f})`, `-${s}√(${f})`], show: T`x = \pm ${s}\sqrt{${f}}`, points: 3, verify: MX.V.solves(`${a}x^2-${a * N}=0`) }],
            solution: [T`\(${a}x^{2} = ${a * N}\), so \(x^{2} = ${N}\)`, T`\(x = \pm\sqrt{${N}} = \pm\sqrt{${s * s}\cdot${f}}\)`, T`\(${H.box(T`x = \pm ${s}\sqrt{${f}}`)}\)`],
          };
        },
      },
    },
  });

  // ---------- quadratic formula ----------
  const r2 = (x) => Math.round(x * 100) / 100;
  // rounded answers: find the exact roots of the displayed equation numerically, and require the key to be
  // exactly those roots rounded to the nearest hundredth (one key value per root)
  const roundedRoots = (eq) => {
    let rs = null;
    return MX.V.custom((a) => {
      rs = rs || MX.V.roots(eq);
      if (rs === 'all' || !Array.isArray(a) || a.length !== rs.length) return 'expected ' + (rs === 'all' ? 'a finite set' : rs.length) + ' rounded roots';
      const want = rs.map((x) => Math.round(x * 100) / 100);
      return MX.V.sameSet(a, want, 1e-9) || 'the roots round to ' + want.join(', ');
    });
  };
  function qfSteps(a, b, c, D) {
    return [
      T`Identify \(a = ${a}\), \(b = ${b}\), \(c = ${c}\).`,
      T`Discriminant: \(b^{2} - 4ac = ${MX.par(b)}^{2} - 4\left(${a}\right)\left(${c}\right) = ${b * b} ${MX.sgnTerm(-4 * a * c)} = ${D}\)`,
      T`\(x = \dfrac{${-b} \pm \sqrt{${D}}}{${2 * a}}\)`,
    ];
  }
  MX.register({
    id: 'quad-formula', section: 'Quadratic equations & functions', title: 'Quadratic formula', kind: 'skill',
    sources: ['Exam 1 #17', 'Exam 2 #26', 'Exam 3 #24'],
    lesson: T`<p>Factoring only works when the numbers cooperate. The quadratic formula solves <em>every</em> quadratic equation, including ones whose answers are messy decimals. You plug in three numbers and simplify.</p>
<div class="box rule"><h4>Formula <b>Quadratic formula</b></h4><p>The solutions of \(ax^{2} + bx + c = 0\), with \(a \ne 0\), are</p><p>\(x = \dfrac{-b \pm \sqrt{b^{2} - 4ac}}{2a}\)</p><p>The fraction bar runs under the <em>whole</em> top, not just the square root.</p></div>
<div class="box def"><h4>Definition <b>Discriminant</b></h4><p>The number under the square root, \(b^{2} - 4ac\), is the <strong>discriminant</strong>. If it is positive, there are two real solutions. If it is 0, there is one. If it is negative, there are no real solutions. If it is a perfect square (like 49) and \(a\), \(b\), \(c\) are integers, the answers are whole numbers or fractions.</p></div>
<div class="box how"><h4>How to <b>use the quadratic formula</b></h4><ol>
<li>Move every term to one side so the equation reads \(ax^{2} + bx + c = 0\).</li>
<li>Write down \(a\), \(b\) and \(c\), each with its sign.</li>
<li>Work out the discriminant \(b^{2} - 4ac\) first.</li>
<li>Put everything into the formula. Work out the \(+\) answer and the \(-\) answer separately.</li>
<li>If asked to round, round only at the very end.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Solve \(2x^{2} + x - 6 = 0\).</p><table class="st">
<tr><td>Read off the coefficients.</td><td>\(a = 2,\quad b = 1,\quad c = -6\)</td></tr>
<tr><td>Find the discriminant.</td><td>\(1^{2} - 4\left(2\right)\left(-6\right) = 1 + 48 = 49\)</td></tr>
<tr><td>Use the formula. \(\sqrt{49} = 7\).</td><td>\(x = \dfrac{-1 \pm 7}{4}\)</td></tr>
<tr><td>Work out both answers.</td><td>\(x = \frac{6}{4} = \frac{3}{2} \text{ or } x = \frac{-8}{4} = -2\)</td></tr></table></div>
<div class="ex"><h4>Example</h4><p>Solve \(x^{2} = 4x - 1\). Round to the nearest hundredth.</p><table class="st">
<tr><td>Move every term to the left.</td><td>\(x^{2} - 4x + 1 = 0\)</td></tr>
<tr><td>Read off the coefficients.</td><td>\(a = 1,\quad b = -4,\quad c = 1\)</td></tr>
<tr><td>Find the discriminant.</td><td>\(\left(-4\right)^{2} - 4\left(1\right)\left(1\right) = 12\)</td></tr>
<tr><td>Use the formula. \(-b = 4\).</td><td>\(x = \dfrac{4 \pm \sqrt{12}}{2}\)</td></tr>
<tr><td>\(\sqrt{12} \approx 3.4641\). Round only now.</td><td>\(x \approx 3.73 \text{ or } x \approx 0.27\)</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>Signs cause most mistakes. If \(b = -4\), then \(-b = 4\) and \(b^{2} = \left(-4\right)^{2} = 16\), which is positive. Always put a negative \(b\) in parentheses before you square it.</p></div>`,
    variants: {
      exact: {
        name: 'Rational answers',
        gen(rng) {
          let p, q, s;
          do { p = rng.int(2, 4); q = rng.nz(-7, 7); s = rng.nz(-6, 6); } while (MX.gcd(p, q) !== 1 || p * s + q === 0);
          const a = p, b = p * s + q, c = q * s, D = b * b - 4 * a * c;
          const x1 = new Q(-q, p), x2 = new Q(-s, 1);
          return {
            prompt: T`Solve \(${MX.quad(a, b, c).tex} = 0\) for \(x\) using the quadratic formula.`,
            parts: [{ kind: 'nums', count: 2, var: 'x', pre: 'x =', joiner: 'or', frac: true, answers: [x1.str(), x2.str()], show: rootsShow([x1, x2]), points: 3, verify: MX.V.solves(`${MX.quad(a, b, c).asc}=0`) }],
            solution: [...qfSteps(a, b, c, D), T`\(\sqrt{${D}} = ${Math.sqrt(D)}\): \(x = \frac{${-b} + ${Math.sqrt(D)}}{${2 * a}} = ${x1.eq(new Q(-b + Math.sqrt(D), 2 * a)) ? x1.tex() : x2.tex()}\) and \(x = \frac{${-b} - ${Math.sqrt(D)}}{${2 * a}} = ${x1.eq(new Q(-b + Math.sqrt(D), 2 * a)) ? x2.tex() : x1.tex()}\)`, T`\(${H.box(rootsShow([x1, x2]))}\)`],
          };
        },
      },
      round: {
        name: 'Round to hundredths',
        gen(rng) {
          let a, b, c, D;
          do { a = rng.int(1, 5); b = rng.nz(-12, 12); c = rng.nz(-12, 12); D = b * b - 4 * a * c; } while (D <= 0 || MX.isPerfectSquare(D));
          const x1 = r2((-b + Math.sqrt(D)) / (2 * a)), x2 = r2((-b - Math.sqrt(D)) / (2 * a));
          return {
            prompt: T`Use the quadratic formula to solve \(${MX.quad(a, b, c).tex} = 0\) for \(x\). Round your answers to the nearest hundredth.`,
            parts: [{ kind: 'nums', count: 2, var: 'x', pre: 'x ≈', joiner: 'or', tol: 0.006, answers: [x1.toFixed(2), x2.toFixed(2)], show: T`x \approx ${x1.toFixed(2)},\quad x \approx ${x2.toFixed(2)}`, points: 4, verify: roundedRoots(`${MX.quad(a, b, c).asc}=0`) }],
            solution: [...qfSteps(a, b, c, D), T`\(\sqrt{${D}} \approx ${MX.num(Math.sqrt(D), 4)}\)`, T`\(x = \frac{${-b} + ${MX.num(Math.sqrt(D), 4)}}{${2 * a}} \approx ${x1.toFixed(2)}\) and \(x = \frac{${-b} - ${MX.num(Math.sqrt(D), 4)}}{${2 * a}} \approx ${x2.toFixed(2)}\)`, T`\(${H.box(T`x \approx ${x1.toFixed(2)} \text{ or } x \approx ${x2.toFixed(2)}`)}\)`],
          };
        },
      },
      rearrange: {
        name: 'Rearrange first',
        gen(rng) {
          let a, b, k, D;
          do { a = rng.int(2, 5); b = rng.nz(-9, 9); k = rng.nz(-9, 9); D = b * b + 4 * a * k; } while (D <= 0 || MX.isPerfectSquare(D));
          const c = -k;
          const x1 = r2((-b + Math.sqrt(D)) / (2 * a)), x2 = r2((-b - Math.sqrt(D)) / (2 * a));
          return {
            prompt: T`Use the quadratic formula to solve \(${poly([[a, { x: 2 }], [b, { x: 1 }]]).tex} = ${k}\) for \(x\). Round your answers to the nearest hundredth.`,
            parts: [{ kind: 'nums', count: 2, var: 'x', pre: 'x ≈', joiner: 'or', tol: 0.006, answers: [x1.toFixed(2), x2.toFixed(2)], show: T`x \approx ${x1.toFixed(2)},\quad x \approx ${x2.toFixed(2)}`, points: 4, verify: roundedRoots(`${poly([[a, { x: 2 }], [b, { x: 1 }]]).asc}=${k}`) }],
            solution: [T`Move everything to one side: \(${MX.quad(a, b, c).tex} = 0\)`, ...qfSteps(a, b, c, D), T`\(\sqrt{${D}} \approx ${MX.num(Math.sqrt(D), 4)}\)`, T`\(x = \frac{${-b} + ${MX.num(Math.sqrt(D), 4)}}{${2 * a}} \approx ${x1.toFixed(2)}\) and \(x = \frac{${-b} - ${MX.num(Math.sqrt(D), 4)}}{${2 * a}} \approx ${x2.toFixed(2)}\)`, T`\(${H.box(T`x \approx ${x1.toFixed(2)} \text{ or } x \approx ${x2.toFixed(2)}`)}\)`],
          };
        },
      },
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);

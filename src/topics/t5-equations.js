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
    lesson: T`<p>Goal: get \(x\) alone. Undo things in this order:</p>
<ol><li><strong>Clear fractions</strong>: multiply every term on both sides by the LCD.</li><li><strong>Distribute</strong> to remove parentheses.</li>
<li><strong>Collect</strong> the \(x\) terms on one side and the numbers on the other.</li><li><strong>Divide</strong> by the coefficient of \(x\).</li></ol>
<p>Check by substituting your answer into the original equation.</p>
<p class="warn">When you multiply by the LCD, multiply <em>every</em> term, including whole numbers like the 5 in \(\frac{x}{3} - 5\).</p>`,
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
      { f: T`n = \frac{2A}{B + d}`, v: 'A', vars: ['n', 'A', 'B', 'd'], a: 'n(B+d)/2', t: T`\frac{n\left(B + d\right)}{2}`, s: [T`Multiply both sides by \(\left(B + d\right)\): \(n\left(B + d\right) = 2A\)`, T`Divide by 2.`] },
      { f: T`K = \frac{ma}{F}`, v: 'm', vars: ['K', 'm', 'a', 'F'], a: 'KF/a', t: T`\frac{KF}{a}`, s: [T`Multiply both sides by \(F\): \(KF = ma\)`, T`Divide by \(a\).`] },
      { f: T`K = \frac{ma}{F}`, v: 'F', vars: ['K', 'm', 'a', 'F'], a: 'ma/K', t: T`\frac{ma}{K}`, s: [T`Multiply both sides by \(F\): \(KF = ma\)`, T`Divide by \(K\).`] },
      { f: T`A = \frac{h\left(a + b\right)}{2}`, v: 'h', vars: ['A', 'h', 'a', 'b'], a: '2A/(a+b)', t: T`\frac{2A}{a + b}`, s: [T`Multiply both sides by 2: \(2A = h\left(a + b\right)\)`, T`Divide by \(\left(a + b\right)\).`] },
      { f: T`V = \frac{1}{3}Bh`, v: 'h', vars: ['V', 'B', 'h'], a: '3V/B', t: T`\frac{3V}{B}`, s: [T`Multiply both sides by 3: \(3V = Bh\)`, T`Divide by \(B\).`] },
    ],
    linear: [
      { f: T`P = 2l + 2w`, v: 'w', vars: ['P', 'l', 'w'], a: '(P-2l)/2', t: T`\frac{P - 2l}{2}`, s: [T`Subtract \(2l\): \(P - 2l = 2w\)`, T`Divide by 2.`] },
      { f: T`P = 2l + 2w`, v: 'l', vars: ['P', 'l', 'w'], a: '(P-2w)/2', t: T`\frac{P - 2w}{2}`, s: [T`Subtract \(2w\): \(P - 2w = 2l\)`, T`Divide by 2.`] },
      { f: T`y = mx + b`, v: 'x', vars: ['y', 'm', 'x', 'b'], a: '(y-b)/m', t: T`\frac{y - b}{m}`, s: [T`Subtract \(b\): \(y - b = mx\)`, T`Divide by \(m\).`] },
      { f: T`ax + by = c`, v: 'y', vars: ['a', 'x', 'b', 'y', 'c'], a: '(c-ax)/b', t: T`\frac{c - ax}{b}`, s: [T`Subtract \(ax\): \(by = c - ax\)`, T`Divide by \(b\).`] },
      { f: T`A = P + Prt`, v: 'r', vars: ['A', 'P', 'r', 't'], a: '(A-P)/(Pt)', t: T`\frac{A - P}{Pt}`, s: [T`Subtract \(P\): \(A - P = Prt\)`, T`Divide by \(Pt\).`] },
    ],
    mixed: [
      { f: T`I = Prt`, v: 't', vars: ['I', 'P', 'r', 't'], a: 'I/(Pr)', t: T`\frac{I}{Pr}`, s: [T`\(t\) is multiplied by \(Pr\).`, T`Divide both sides by \(Pr\).`] },
      { f: T`C = \frac{5}{9}\left(F - 32\right)`, v: 'F', vars: ['C', 'F'], a: '9C/5+32', t: T`\frac{9}{5}C + 32`, s: [T`Multiply both sides by \(\frac{9}{5}\): \(\frac{9}{5}C = F - 32\)`, T`Add 32.`] },
      { f: T`S = \frac{a}{1 - r}`, v: 'a', vars: ['S', 'a', 'r'], a: 'S(1-r)', t: T`S\left(1 - r\right)`, s: [T`Multiply both sides by \(\left(1 - r\right)\).`, T`That leaves \(a\) by itself.`] },
      { f: T`m = \frac{y - k}{x - h}`, v: 'y', vars: ['m', 'y', 'k', 'x', 'h'], a: 'm(x-h)+k', t: T`m\left(x - h\right) + k`, s: [T`Multiply both sides by \(\left(x - h\right)\): \(m\left(x - h\right) = y - k\)`, T`Add \(k\).`] },
    ],
  };
  function literal(rng, key) {
    const F = rng.pick(FORMULAS[key]);
    return {
      prompt: T`Solve for \(${F.v}\): \(${F.f}\)`,
      parts: [{ kind: 'expr', lhs: F.v, vars: F.vars.filter((x) => x !== F.v), answer: F.a, show: F.v + ' = ' + F.t, pre: F.v + ' =', points: 2 }],
      solution: [...F.s, T`\(${H.box(F.v + ' = ' + F.t)}\)`],
    };
  }
  MX.register({
    id: 'literal', section: SEC, title: 'Solving a formula for a variable', kind: 'skill',
    sources: ['Exam 1 #16', 'Exam 2 #28', 'Exam 3 #3'],
    lesson: T`<p>Treat every other letter as if it were a number and solve exactly as you would for \(x\): undo addition/subtraction, then multiplication/division.</p>
<ul><li>If the variable is in a denominator or the formula has a fraction, multiply both sides by that denominator first.</li>
<li>If the variable is multiplied by a group like \(B + d\), divide by the whole group; keep it in parentheses.</li></ul>
\[n = \frac{2A}{B + d}\;\Rightarrow\; n\left(B + d\right) = 2A \;\Rightarrow\; A = \frac{n\left(B + d\right)}{2}\]
<p>Type multiplication with parentheses when it matters: <code>n(B+d)/2</code>.</p>`,
    variants: {
      frac: { name: 'Formula with a fraction', gen: (rng) => literal(rng, 'frac') },
      linear: { name: 'Formula with a sum', gen: (rng) => literal(rng, 'linear') },
      mixed: { name: 'Other formulas', gen: (rng) => literal(rng, 'mixed') },
    },
  });

  // ---------- linear inequalities ----------
  function ineqParts(rng, op, v, solutionPre) {
    const nl = H.nlChoices(rng, op, v);
    return {
      parts: [
        { label: 'a', ask: T`Solve the inequality for \(x\).`, kind: 'ineq', var: 'x', answer: 'x' + op + v, show: T`x ${H.rel(op)} ${v}`, points: 2 },
        { label: 'b', ask: 'Which graph shows the solution?', kind: 'choice', options: nl.options, answer: nl.answer, graph: true, points: 2 },
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
    lesson: T`<p>Solve an inequality exactly like an equation, with one extra rule:</p>
<p class="key">When you multiply or divide both sides by a <strong>negative</strong> number, flip the inequality sign.</p>
<p>Graph on a number line: a <strong>closed</strong> dot for \(\le\) or \(\ge\) (the endpoint is included), an <strong>open</strong> dot for \(\lt\) or \(\gt\); shade toward the numbers that work (\(x \gt\) goes right, \(x \lt\) goes left).</p>
<p>Type \(\le\) as <code>&lt;=</code> and \(\ge\) as <code>&gt;=</code>.</p>`,
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
          ]);
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
          ]);
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
          ]);
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
    lesson: T`<p>If \(b^{M} = b^{N}\) then \(M = N\). So:</p>
<ol><li>Write both sides as powers of the same base: \(25 = 5^{2}\), \(64 = 2^{6}\), \(81 = 3^{4}\), \(\frac{1}{27} = 3^{-3}\).</li>
<li>Set the exponents equal.</li><li>Solve the linear equation.</li></ol>
\[5^{7 - 2x} = 25 = 5^{2}\;\Rightarrow\; 7 - 2x = 2 \;\Rightarrow\; x = \frac{5}{2}\]
<p>Useful powers: \(2^{5} = 32,\ 2^{6} = 64,\ 3^{4} = 81,\ 3^{5} = 243,\ 5^{3} = 125\).</p>`,
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
            parts: [{ kind: 'num', frac: true, var: 'x', answer: ans.str(), show: T`x = ${ans.tex()}`, points: 3 }],
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
            parts: [{ kind: 'num', frac: true, var: 'x', answer: ans.str(), show: T`x = ${ans.tex()}`, points: 3 }],
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
            parts: [{ kind: 'num', frac: true, var: 'x', answer: ans.str(), show: T`x = ${ans.tex()}`, points: 3 }],
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
    lesson: T`<p>The zero-product property: if \(AB = 0\), then \(A = 0\) or \(B = 0\).</p>
<ol><li>Get 0 on one side.</li><li>Factor completely (GCF first; don't divide the variable away, factor it out).</li>
<li>Set each factor equal to 0 and solve.</li></ol>
\[4x^{2} - 16x = 0 \;\Rightarrow\; 4x\left(x - 4\right) = 0 \;\Rightarrow\; x = 0 \text{ or } x = 4\]
<p class="warn">Dividing both sides by \(x\) loses the solution \(x = 0\).</p>`,
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
            parts: [{ kind: 'nums', count: 2, var: v, pre: v + ' =', joiner: 'or', answers: [String(-r), String(-s)], show: rootsShow([-r, -s], v), points: 3 }],
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
            parts: [{ kind: 'nums', count: 2, var: 'x', pre: 'x =', joiner: 'or', answers: ['0', String(k)], show: rootsShow([0, k]), points: 3 }],
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
            parts: [{ kind: 'nums', count: 3, var: 'x', pre: 'x =', joiner: 'or', answers: ['0', String(-r), String(-s)], show: rootsShow([0, -r, -s]), points: 4 }],
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
            parts: [{ kind: 'nums', count: 2, var: 'x', pre: 'x =', joiner: 'or', frac: true, answers: [r1.str(), r2.str()], show: rootsShow([r1, r2]), points: 3 }],
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
    lesson: T`<p>If \(u^{2} = k\) then \(u = \sqrt{k}\) or \(u = -\sqrt{k}\), written \(u = \pm\sqrt{k}\).</p>
<ol><li>Isolate the squared part.</li><li>Take the square root of both sides and remember the \(\pm\).</li>
<li>Simplify the radical, then finish solving for the variable.</li></ol>
\[\left(3k + 2\right)^{2} = 49 \;\Rightarrow\; 3k + 2 = \pm 7 \;\Rightarrow\; k = \frac{5}{3} \text{ or } k = -3\]
<p>Type exact answers like <code>3√5</code> and <code>-3√5</code> (or one box with <code>+-3√5</code>).</p>`,
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
            parts: [{ kind: 'nums', count: 2, var: v, pre: v + ' =', joiner: 'or', frac: true, exact: true, answers: [r1.str(), r2.str()], show: rootsShow([r1, r2], v), points: 3 }],
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
            parts: [{ kind: 'nums', count: 2, var: 'x', pre: 'x =', joiner: 'or', exact: true, answers: [String(r), String(-r)], show: T`x = \pm ${r}`, points: 2 }],
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
            parts: [{ kind: 'nums', count: 2, var: 'x', pre: 'x =', joiner: 'or', exact: true, radical: true, answers: [`${s}√(${f})`, `-${s}√(${f})`], show: T`x = \pm ${s}\sqrt{${f}}`, points: 3 }],
            solution: [T`\(${a}x^{2} = ${a * N}\), so \(x^{2} = ${N}\)`, T`\(x = \pm\sqrt{${N}} = \pm\sqrt{${s * s}\cdot${f}}\)`, T`\(${H.box(T`x = \pm ${s}\sqrt{${f}}`)}\)`],
          };
        },
      },
    },
  });

  // ---------- quadratic formula ----------
  const r2 = (x) => Math.round(x * 100) / 100;
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
    lesson: T`<p>For \(ax^{2} + bx + c = 0\):</p>
\[x = \frac{-b \pm \sqrt{b^{2} - 4ac}}{2a}\]
<ol><li>Write the equation as \(ax^{2} + bx + c = 0\) first (move everything to one side).</li><li>Read off \(a\), \(b\), \(c\) with their signs.</li>
<li>Compute the discriminant \(b^{2} - 4ac\) carefully; \(\left(-b\right)^{2}\) is positive.</li><li>Evaluate the \(+\) and \(-\) versions separately.</li></ol>
<p>When asked to round, round only at the very end.</p>`,
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
            parts: [{ kind: 'nums', count: 2, var: 'x', pre: 'x =', joiner: 'or', frac: true, answers: [x1.str(), x2.str()], show: rootsShow([x1, x2]), points: 3 }],
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
            parts: [{ kind: 'nums', count: 2, var: 'x', pre: 'x ≈', joiner: 'or', tol: 0.006, answers: [x1.toFixed(2), x2.toFixed(2)], show: T`x \approx ${x1.toFixed(2)},\quad x \approx ${x2.toFixed(2)}`, points: 4 }],
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
            parts: [{ kind: 'nums', count: 2, var: 'x', pre: 'x ≈', joiner: 'or', tol: 0.006, answers: [x1.toFixed(2), x2.toFixed(2)], show: T`x \approx ${x1.toFixed(2)},\quad x \approx ${x2.toFixed(2)}`, points: 4 }],
            solution: [T`Move everything to one side: \(${MX.quad(a, b, c).tex} = 0\)`, ...qfSteps(a, b, c, D), T`\(\sqrt{${D}} \approx ${MX.num(Math.sqrt(D), 4)}\)`, T`\(x = \frac{${-b} + ${MX.num(Math.sqrt(D), 4)}}{${2 * a}} \approx ${x1.toFixed(2)}\) and \(x = \frac{${-b} - ${MX.num(Math.sqrt(D), 4)}}{${2 * a}} \approx ${x2.toFixed(2)}\)`, T`\(${H.box(T`x \approx ${x1.toFixed(2)} \text{ or } x \approx ${x2.toFixed(2)}`)}\)`],
          };
        },
      },
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);

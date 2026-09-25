/* Rational expressions and equations */
(function (G) {
  'use strict';
  const MX = G.MX;
  const { Q, T, H, poly } = MX;
  const SEC = 'Rational expressions';
  const bin = (q, v) => poly([[1, { [v]: 1 }], [q, {}]]); // v + q
  const L = (t) => T`\left(${t}\right)`;
  // a num answer to "simplify this expression" (whose variable cancels out): the displayed expression
  // takes the answer's value at several values of v away from its poles
  const constIs = (expr, v) => MX.V.custom((a) => {
    if (typeof a !== 'number') return 'expected a number';
    const f = MX.V.fn(expr, v);
    let n = 0;
    for (const x of [-7.31, -2.13, 0.71, 1.93, 4.37, 11.71, 13.13, 17.57]) {
      const y = f(x);
      if (!isFinite(y)) continue;
      if (!MX.V.close(y, a, 1e-9)) return 'the expression equals ' + MX.num(y, 6) + ' at ' + v + ' = ' + x + ', not ' + MX.num(a, 6);
      n++;
    }
    return n >= 4 || 'could not test the expression at enough points';
  });

  MX.register({
    id: 'rat-simplify', section: SEC, title: 'Simplifying rational expressions', kind: 'skill',
    sources: ['Exam 1 #8', 'Exam 2 #5'],
    lesson: T`<p>A rational expression is simplified when the top and bottom share no common <em>factor</em>.</p>
<ol><li>Factor the numerator and the denominator completely.</li><li>Cancel factors that appear in both.</li><li>Leave the rest (factored form is fine).</li></ol>
<p>Opposites cancel to \(-1\): \(\frac{5 - x}{x - 5} = -1\), because \(5 - x = -(x - 5)\).</p>
<p class="warn">Cancel factors only, never terms: in \(\frac{x + 5}{5}\) you cannot cancel the 5s.</p>`,
    variants: {
      cancel1: {
        name: 'Cancel one factor',
        gen(rng) {
          const v = rng.pick(['x', 'y', 'a']);
          let r, s;
          do { r = rng.nz(-9, 9); s = rng.nz(-9, 9); } while (r === s || r + s === 0 && rng.chance(0.3));
          const Num = MX.quad(1, r + s, r * s, v), Den = bin(r, v), R = bin(s, v);
          return {
            prompt: T`Simplify: \(\dfrac{${Num.tex}}{${Den.tex}}\)`,
            parts: [{ kind: 'expr', form: 'rational', answer: R.asc, show: R.tex, points: 3, verify: MX.V.equiv(`(${Num.asc})/(${Den.asc})`) }],
            solution: [
              T`Factor the numerator: \(${Num.tex} = ${L(Den.tex)}${L(R.tex)}\)`,
              T`\(\dfrac{\strike{${L(Den.tex)}}${L(R.tex)}}{\strike{${Den.tex}}}\)`,
              T`\(${H.box(R.tex)}\)`,
            ],
          };
        },
      },
      both: {
        name: 'Factor top and bottom',
        gen(rng) {
          const v = rng.pick(['x', 'x', 'm', 't']);
          let a, b, c;
          do { a = rng.nz(-7, 7); b = rng.nz(-7, 7); c = rng.nz(-7, 7); } while (new Set([a, b, c]).size < 3 || a + b === 0 || a + c === 0);
          const Num = MX.quad(1, a + b, a * b, v), Den = MX.quad(1, a + c, a * c, v);
          const Fa = bin(a, v), Fb = bin(b, v), Fc = bin(c, v);
          const ansT = T`\frac{${Fb.tex}}{${Fc.tex}}`;
          return {
            prompt: T`Simplify: \(\dfrac{${Num.tex}}{${Den.tex}}\)`,
            parts: [{ kind: 'expr', form: 'rational', answer: '(' + Fb.asc + ')/(' + Fc.asc + ')', show: ansT, points: 3, verify: MX.V.equiv(`(${Num.asc})/(${Den.asc})`) }],
            solution: [
              T`Numerator: \(${Num.tex} = ${L(Fa.tex)}${L(Fb.tex)}\)`,
              T`Denominator: \(${Den.tex} = ${L(Fa.tex)}${L(Fc.tex)}\)`,
              T`Cancel the common factor \(${L(Fa.tex)}\): \(${H.box(ansT)}\)`,
            ],
          };
        },
      },
      neg: {
        name: 'Opposite factors',
        gen(rng) {
          const v = rng.pick(['x', 'y', 'n']);
          const c = rng.int(2, 9), k = rng.int(1, 4);
          const Num = poly([[k * c, {}], [-k, { [v]: 1 }]]), Den = poly([[1, { [v]: 2 }], [-c * c, {}]]);
          const R = k === 1 ? { tex: T`-\frac{1}{${v} + ${c}}`, asc: `-1/(${v}+${c})` } : { tex: T`-\frac{${k}}{${v} + ${c}}`, asc: `-${k}/(${v}+${c})` };
          return {
            prompt: T`Simplify: \(\dfrac{${Num.tex}}{${Den.tex}}\)`,
            parts: [{ kind: 'expr', form: 'rational', answer: R.asc, show: R.tex, points: 3, verify: MX.V.equiv(`(${Num.asc})/(${Den.asc})`) }],
            solution: [
              T`Factor: numerator \(${k === 1 ? '' : k}\left(${c} - ${v}\right)\), denominator \(\left(${v} - ${c}\right)\left(${v} + ${c}\right)\)`,
              T`\(${c} - ${v} = -\left(${v} - ${c}\right)\), so those factors cancel to \(-1\).`,
              T`\(${H.box(R.tex)}\)`,
            ],
          };
        },
      },
    },
  });

  MX.register({
    id: 'rat-divide', section: SEC, title: 'Multiplying & dividing rational expressions', kind: 'skill',
    sources: ['Exam 1 #7', 'Exam 2 #10', 'Exam 3 #17'],
    lesson: T`<p>To divide, multiply by the reciprocal of the second fraction:</p>
\[\frac{A}{B} \div \frac{C}{D} = \frac{A}{B}\cdot\frac{D}{C}\]
<ol><li>Flip the second fraction and change \(\div\) to \(\times\).</li><li>Factor every numerator and denominator (GCFs first).</li>
<li>Cancel common factors, including opposites like \(w - 3\) and \(3 - w\), which cancel to \(-1\).</li><li>Multiply what is left.</li></ol>`,
    variants: {
      opp: {
        name: 'Opposite binomials',
        gen(rng) {
          const v = rng.pick(['w', 'x', 'y']);
          const a = rng.int(2, 9);
          let k, m;
          do { k = rng.int(2, 12); m = k * rng.int(2, 6); } while (m > 60);
          if (rng.chance(0.4)) { k = rng.pick([4, 6, 8, 9, 10, 12]); m = H.until(() => rng.int(4, 40), (x) => MX.gcd(x, k) > 1 && x % k !== 0 && k % x !== 0); }
          const ans = new Q(-k, m);
          return {
            prompt: T`Divide: \(\dfrac{${k}}{${v} - ${a}} \div \dfrac{${m}}{${a} - ${v}}\)`,
            parts: [{ kind: 'num', frac: true, answer: ans.str(), show: ans.tex(), points: 3, verify: constIs(`(${k}/(${v}-${a}))/(${m}/(${a}-${v}))`, v) }],
            solution: [
              T`Multiply by the reciprocal: \(\dfrac{${k}}{${v} - ${a}} \cdot \dfrac{${a} - ${v}}{${m}}\)`,
              T`\(${a} - ${v} = -\left(${v} - ${a}\right)\), so \(\frac{${a} - ${v}}{${v} - ${a}} = -1\).`,
              T`\(-\frac{${k}}{${m}} = ${H.box(ans.tex())}\)`,
            ],
          };
        },
      },
      full: {
        name: 'Factor everything first',
        gen(rng) {
          let p, q, r, s, a, b, c;
          do {
            p = rng.int(2, 8); q = rng.int(2, 12); r = rng.int(2, 8); s = rng.int(2, 8);
            a = rng.nz(-6, 6); b = rng.int(1, 6); c = rng.nz(-6, 6);
          } while (a === c || b === -a || b === -c || a === -b || new Q(p * s, q * r).isInt());
          const N1 = poly([[p, { x: 1 }], [p * a, {}]]), D1 = poly([[q * b, {}], [-q, { x: 1 }]]);
          const N2 = poly([[r, { x: 1 }], [r * c, {}]]), D2 = poly([[s, { x: 1 }], [-s * b, {}]]);
          const C = new Q(p * s, q * r);
          const Fa = bin(a, 'x'), Fc = bin(c, 'x');
          const ansT = T`-\frac{${C.n === 1 ? '' : C.n}\left(${Fa.tex}\right)}{${C.d}\left(${Fc.tex}\right)}`;
          const ansA = `-${C.n === 1 ? '' : C.n}(${Fa.asc})/(${C.d}(${Fc.asc}))`;
          return {
            prompt: T`Divide: \(\dfrac{${N1.tex}}{${D1.tex}} \div \dfrac{${N2.tex}}{${D2.tex}}\)`,
            parts: [{ kind: 'expr', form: 'rational', answer: ansA, show: ansT, points: 4, verify: MX.V.equiv(`((${N1.asc})/(${D1.asc}))/((${N2.asc})/(${D2.asc}))`) }],
            solution: [
              T`Flip and multiply: \(\dfrac{${N1.tex}}{${D1.tex}} \cdot \dfrac{${D2.tex}}{${N2.tex}}\)`,
              T`Factor: \(\dfrac{${p}${L(Fa.tex)}}{${q}\left(${b} - x\right)} \cdot \dfrac{${s}\left(x - ${b}\right)}{${r}${L(Fc.tex)}}\)`,
              T`\(\frac{x - ${b}}{${b} - x} = -1\), and \(\frac{${p}\cdot${s}}{${q}\cdot${r}} = \frac{${p * s}}{${q * r}} = ${C.tex()}\)`,
              T`\(${H.box(ansT)}\)`,
            ],
          };
        },
      },
      mul: {
        name: 'Multiply',
        gen(rng) {
          let c, d, k;
          do { c = rng.int(1, 8); d = rng.nz(-6, 6); k = rng.int(2, 6); } while (d === c || d === -c);
          const N1 = poly([[1, { x: 2 }], [-c * c, {}]]), D1 = poly([[k, { x: 1 }], [k * d, {}]]);
          const N2 = bin(d, 'x'), D2 = bin(-c, 'x');
          const ansT = T`\frac{x + ${c}}{${k}}`;
          return {
            prompt: T`Multiply: \(\dfrac{${N1.tex}}{${D1.tex}} \cdot \dfrac{${N2.tex}}{${D2.tex}}\)`,
            parts: [{ kind: 'expr', form: 'rational', answer: `(x+${c})/${k}`, show: ansT, points: 3, verify: MX.V.equiv(`((${N1.asc})/(${D1.asc}))*((${N2.asc})/(${D2.asc}))`) }],
            solution: [
              T`Factor: \(\dfrac{\left(x - ${c}\right)\left(x + ${c}\right)}{${k}${L(N2.tex)}} \cdot \dfrac{${N2.tex}}{x - ${c}}\)`,
              T`Cancel \(${L(N2.tex)}\) and \(\left(x - ${c}\right)\).`,
              T`\(${H.box(ansT)}\)`,
            ],
          };
        },
      },
    },
  });

  MX.register({
    id: 'rat-addsub', section: SEC, title: 'Adding & subtracting rational expressions', kind: 'skill',
    sources: ['Exam 1 #4', 'Exam 2 #4', 'Exam 3 #6'],
    lesson: T`<p>Fractions need a common denominator before you add or subtract them.</p>
<ol><li>Factor each denominator.</li><li>Build the least common denominator (LCD): every factor, as many times as it appears in any one denominator.</li>
<li>Rewrite each fraction over the LCD by multiplying top and bottom by what's missing.</li>
<li>Combine the numerators. Put the second numerator in parentheses when subtracting.</li><li>Simplify: factor the numerator and cancel if possible.</li></ol>
<p class="warn">Subtracting a numerator means subtracting <em>every</em> term: \(-(w - 5) = -w + 5\).</p>`,
    variants: {
      unlike: {
        name: 'Different binomial denominators',
        gen(rng) {
          const v = rng.pick(['k', 'x', 'a', 'm']);
          let a, b, c, sg;
          do { a = rng.int(1, 7); b = rng.nz(-8, 8); c = rng.int(1, 7); sg = rng.sign(); } while (a + sg * c === 0);
          // a/(v+b) + sg*c/v = (a v + sg c (v + b)) / (v (v+b))
          const A1 = a + sg * c, B1 = sg * c * b;
          const Nm = poly([[A1, { [v]: 1 }], [B1, {}]]), Fb = bin(b, v);
          const ansT = T`\frac{${Nm.tex}}{${v}\left(${Fb.tex}\right)}`;
          return {
            prompt: T`${sg < 0 ? 'Subtract' : 'Add'}: \(\dfrac{${a}}{${Fb.tex}} ${sg < 0 ? '-' : '+'} \dfrac{${c}}{${v}}\)`,
            parts: [{ kind: 'expr', form: 'rational', answer: `(${Nm.asc})/(${v}(${Fb.asc}))`, show: ansT, points: 3, verify: MX.V.equiv(`${a}/(${Fb.asc})${sg < 0 ? '-' : '+'}${c}/${v}`) }],
            solution: [
              T`The LCD is \(${v}\left(${Fb.tex}\right)\).`,
              T`\(\dfrac{${a}\cdot ${v}}{${v}\left(${Fb.tex}\right)} ${sg < 0 ? '-' : '+'} \dfrac{${MX.coef(c)}\left(${Fb.tex}\right)}{${v}\left(${Fb.tex}\right)}\)`,
              T`Numerator: \(${a}${v} ${sg < 0 ? '-' : '+'} ${MX.coef(c)}\left(${Fb.tex}\right) = ${poly([[a, { [v]: 1 }], [sg * c, { [v]: 1 }], [sg * c * b, {}]]).tex} = ${Nm.tex}\)`,
              T`\(${H.box(ansT)}\)`,
            ],
          };
        },
      },
      monomial: {
        name: 'Monomial denominators',
        gen(rng) {
          const v = rng.pick(['R', 'x', 'y']);
          let a, c, d1, d2, Lc, al, be;
          do {
            a = rng.int(1, 9); c = rng.int(1, 9); d1 = rng.int(2, 15); d2 = rng.int(2, 12);
            Lc = MX.lcm(d1, d2); al = (a * Lc) / d1; be = (c * Lc) / d2;
          } while (d1 === d2 || MX.gcdAll([al, be, Lc]) !== 1 || MX.gcd(a, d1) !== 1 || MX.gcd(c, d2) !== 1 || Lc > 60);
          const sg = rng.sign();
          const Nm = poly([[al, { [v]: 1 }], [sg * be, {}]]);
          const ansT = T`\frac{${Nm.tex}}{${Lc}${v}^{2}}`;
          return {
            prompt: T`${sg < 0 ? 'Subtract' : 'Add'}: \(\dfrac{${a}}{${d1}${v}} ${sg < 0 ? '-' : '+'} \dfrac{${c}}{${d2}${v}^{2}}\)`,
            parts: [{ kind: 'expr', form: 'rational', answer: `(${Nm.asc})/(${Lc}${v}^2)`, show: ansT, points: 3, verify: MX.V.equiv(`${a}/(${d1}${v})${sg < 0 ? '-' : '+'}${c}/(${d2}${v}^2)`) }],
            solution: [
              T`LCD: \(\text{lcm}(${d1}, ${d2}) = ${Lc}\), and the highest power of \(${v}\) is \(${v}^{2}\), so the LCD is \(${Lc}${v}^{2}\).`,
              T`\(\dfrac{${a}}{${d1}${v}}\cdot\dfrac{${Lc / d1}${v}}{${Lc / d1}${v}} = \dfrac{${al}${v}}{${Lc}${v}^{2}}\) and \(\dfrac{${c}}{${d2}${v}^{2}}\cdot\dfrac{${Lc / d2}}{${Lc / d2}} = \dfrac{${be}}{${Lc}${v}^{2}}\)`,
              T`\(${H.box(ansT)}\)`,
            ],
          };
        },
      },
      same: {
        name: 'Same binomial after factoring',
        gen(rng) {
          const v = rng.pick(['w', 'x', 'p']);
          let m, r, C, D, k;
          do { m = rng.int(2, 4); r = rng.int(1, 6); C = rng.int(1, 3); D = rng.nz(-7, 7); k = rng.nz(-4, 4); } while (k % m === 0);
          const A = k + m * C, B = -k * r + m * D;
          const N1 = poly([[A, { [v]: 1 }], [B, {}]]), D1 = poly([[m, { [v]: 1 }], [-m * r, {}]]);
          const N2 = poly([[C, { [v]: 1 }], [D, {}]]), Fr = bin(-r, v);
          const ans = new Q(k, m);
          const combined = poly([[A, { [v]: 1 }], [B, {}], [-m * C, { [v]: 1 }], [-m * D, {}]]).tex;
          return {
            prompt: T`Subtract: \(\dfrac{${N1.tex}}{${D1.tex}} - \dfrac{${N2.tex}}{${Fr.tex}}\)`,
            parts: [{ kind: 'num', frac: true, answer: ans.str(), show: ans.tex(), points: 3, verify: constIs(`(${N1.asc})/(${D1.asc})-(${N2.asc})/(${Fr.asc})`, v) }],
            solution: [
              T`Factor the first denominator: \(${D1.tex} = ${m}\left(${Fr.tex}\right)\). The LCD is \(${m}\left(${Fr.tex}\right)\).`,
              T`\(\dfrac{${N1.tex}}{${m}\left(${Fr.tex}\right)} - \dfrac{${m}\left(${N2.tex}\right)}{${m}\left(${Fr.tex}\right)}\)`,
              T`Numerator: \(${combined} = ${poly([[k, { [v]: 1 }], [-k * r, {}]]).tex} = ${MX.coef(k)}\left(${Fr.tex}\right)\)`,
              T`\(\dfrac{${MX.coef(k)}\left(${Fr.tex}\right)}{${m}\left(${Fr.tex}\right)} = ${H.box(ans.tex())}\)`,
            ],
          };
        },
      },
    },
  });

  MX.register({
    id: 'rat-equation', section: SEC, title: 'Solving rational equations', kind: 'skill',
    sources: ['Exam 3 #15'],
    lesson: T`<p>Clear the fractions: multiply <em>every term</em> on both sides by the LCD. What's left is an ordinary equation.</p>
<ol><li>Note the values that make any denominator zero; they can't be solutions.</li><li>Multiply every term by the LCD and simplify.</li>
<li>Solve the resulting equation.</li><li>Check: throw out any answer that makes a denominator zero. If nothing is left, there is <strong>no solution</strong>.</li></ol>
<p>Type <code>no solution</code> when that happens.</p>`,
    variants: {
      e3: {
        name: 'Variable in one denominator',
        gen(rng) {
          let x0, a, p, q, rs, t;
          H.until(() => {
            x0 = rng.nz(-8, 8); a = rng.nz(-9, 9);
            q = rng.pick([2, 3, 4, 5, 6]); p = rng.int(1, q + 2) * rng.sign();
            t = new Q(x0 + a, x0);
            rs = t.add(new Q(p, q));
            return true;
          }, () => x0 + a !== 0 && !t.eq(1) && rs.n !== 0 && rs.d <= 12 && rs.d > 1 && new Q(p, q).d > 1);
          const pq = new Q(p, q);
          const Lc = MX.lcm(pq.d, rs.d);
          const lhsK = Lc, rhsX = rs.mul(Lc), pX = pq.mul(Lc);
          const Fa = bin(a, 'x');
          return {
            prompt: T`Solve: \(\dfrac{${Fa.tex}}{x} ${pq.n < 0 ? '-' : '+'} ${pq.abs().tex()} = ${rs.tex()}\)`,
            parts: [{ kind: 'num', frac: true, var: 'x', answer: String(x0), show: T`x = ${x0}`, points: 4, verify: MX.V.solves(`(${Fa.asc})/x${pq.n < 0 ? '-' : '+'}(${pq.abs().str()})=(${rs.str()})`) }],
            solution: [
              T`\(x \ne 0\). Multiply every term by the LCD \(${Lc}x\):`,
              T`\(${Lc}\left(${Fa.tex}\right) ${pX.n < 0 ? '-' : '+'} ${H.cq(pX.abs())}x = ${H.cq(rhsX)}x\)`,
              T`\(${poly([[lhsK, { x: 1 }], [lhsK * a, {}]]).tex} ${pX.n < 0 ? '-' : '+'} ${H.cq(pX.abs())}x = ${H.cq(rhsX)}x\)`,
              T`Collect \(x\) terms: \(${H.cq(new Q(lhsK).add(pX).sub(rhsX))}x = ${-lhsK * a}\), so \(x = ${x0}\). It doesn't make a denominator zero.`,
              T`\(${H.box('x = ' + x0)}\)`,
            ],
          };
        },
      },
      prop: {
        name: 'Proportion (cross-multiply)',
        gen(rng) {
          let x0, b, d, A, C, g;
          do {
            x0 = rng.nz(-9, 12); b = rng.nz(-6, 6); d = rng.nz(-6, 6);
            A = x0 - b; C = x0 + d;
          } while (A === 0 || C === 0 || A === C || Math.abs(A) > 15 || Math.abs(C) > 15);
          g = MX.gcd(A, C); A /= g; C /= g;
          if (A < 0 && C < 0) { A = -A; C = -C; }
          const Fb = bin(-b, 'x'), Fd = bin(d, 'x');
          return {
            prompt: T`Solve: \(\dfrac{${A}}{${Fb.tex}} = \dfrac{${C}}{${Fd.tex}}\)`,
            parts: [{ kind: 'num', frac: true, var: 'x', answer: String(x0), show: T`x = ${x0}`, points: 3, verify: MX.V.solves(`${A}/(${Fb.asc})=${C}/(${Fd.asc})`) }],
            solution: [
              T`Cross-multiply: \(${A}\left(${Fd.tex}\right) = ${C}\left(${Fb.tex}\right)\)`,
              T`\(${poly([[A, { x: 1 }], [A * d, {}]]).tex} = ${poly([[C, { x: 1 }], [-C * b, {}]]).tex}\)`,
              T`\(${A - C}x = ${-C * b - A * d}\), so \(x = ${x0}\). Check: it doesn't make either denominator zero.`,
              T`\(${H.box('x = ' + x0)}\)`,
            ],
          };
        },
      },
      extraneous: {
        name: 'Check for extraneous solutions',
        gen(rng) {
          const c = rng.int(2, 7), k = rng.int(1, 4);
          return {
            prompt: T`Solve: \(\dfrac{x}{x - ${c}} + ${k} = \dfrac{${c}}{x - ${c}}\)`,
            parts: [{ kind: 'num', var: 'x', answer: 'nosol', show: T`\text{no solution}`, points: 4, verify: MX.V.solves(`x/(x-${c})+${k}=${c}/(x-${c})`) }],
            solution: [
              T`\(x \ne ${c}\). Multiply every term by \(x - ${c}\): \(x + ${k}\left(x - ${c}\right) = ${c}\)`,
              T`\(${k + 1}x - ${k * c} = ${c}\), so \(${k + 1}x = ${c * (k + 1)}\) and \(x = ${c}\).`,
              T`But \(x = ${c}\) makes the denominators zero, so it is extraneous.`,
              T`\(${H.box('\\text{no solution}')}\)`,
            ],
          };
        },
      },
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);

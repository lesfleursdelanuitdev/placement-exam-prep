/* Polynomials, exponents, scientific notation */
(function (G) {
  'use strict';
  const MX = G.MX;
  const { Q, T, H, poly } = MX;
  const SEC = 'Polynomials & exponents';

  // ---------- adding & subtracting polynomials ----------
  function trip(rng) { return [rng.int(2, 15), rng.nz(-9, 9), rng.nz(-9, 9)]; }
  MX.register({
    id: 'poly-addsub', section: SEC, title: 'Adding & subtracting polynomials', kind: 'skill',
    sources: ['Exam 1 #1', 'Exam 2 #1'],
    lesson: T`<p>To subtract a polynomial, distribute the minus sign (or the number in front) to <em>every</em> term in the parentheses, then combine like terms: terms with the same variable and the same exponent.</p>
<ol><li>Remove parentheses. A minus sign in front changes the sign of every term inside.</li>
<li>Line up like terms: \(x^2\) with \(x^2\), \(x\) with \(x\), constants with constants.</li>
<li>Add their coefficients. The exponents do not change.</li></ol>
<p class="warn">Most common mistake: changing the sign of only the first term inside the parentheses.</p>`,
    variants: {
      sub: {
        name: 'Subtract two trinomials',
        gen(rng) {
          const v = rng.pick(['x', 'x', 'y', 't', 'a']);
          let A, B;
          do { A = trip(rng); B = trip(rng); } while (A[0] === B[0] || A[1] === B[1] || A[2] === B[2]);
          const P1 = MX.quad(...A, v), P2 = MX.quad(...B, v);
          const dist = poly([[A[0], { [v]: 2 }], [A[1], { [v]: 1 }], [A[2], {}], [-B[0], { [v]: 2 }], [-B[1], { [v]: 1 }], [-B[2], {}]]);
          const R = MX.quad(A[0] - B[0], A[1] - B[1], A[2] - B[2], v);
          return {
            prompt: T`Subtract: \(\left(${P1.tex}\right) - \left(${P2.tex}\right)\)`,
            parts: [{ kind: 'expr', form: 'expanded', answer: R.asc, show: R.tex, points: 3, verify: MX.V.equiv(`(${P1.asc})-(${P2.asc})`) }],
            solution: [
              T`Distribute the minus sign to every term in the second polynomial: \(${dist.tex}\)`,
              T`Combine like terms: \(${v}^{2}\): \(${A[0]} - ${B[0]} = ${A[0] - B[0]}\); \(${v}\): \(${A[1]} - ${MX.par(B[1])} = ${A[1] - B[1]}\); constants: \(${A[2]} - ${MX.par(B[2])} = ${A[2] - B[2]}\)`,
              T`\(${H.box(R.tex)}\)`,
            ],
          };
        },
      },
      subk: {
        name: 'Subtract a multiple',
        gen(rng) {
          const v = rng.pick(['x', 'x', 'y', 'm']);
          const k = rng.int(2, 5);
          let A, B;
          do { A = trip(rng); B = [rng.int(2, 6), rng.nz(-7, 7), rng.nz(-7, 7)]; } while (A[0] === k * B[0] || A[1] === k * B[1] || A[2] === k * B[2]);
          const P1 = MX.quad(...A, v), P2 = MX.quad(...B, v);
          const dist = poly([[A[0], { [v]: 2 }], [A[1], { [v]: 1 }], [A[2], {}], [-k * B[0], { [v]: 2 }], [-k * B[1], { [v]: 1 }], [-k * B[2], {}]]);
          const R = MX.quad(A[0] - k * B[0], A[1] - k * B[1], A[2] - k * B[2], v);
          return {
            prompt: T`Subtract: \(\left(${P1.tex}\right) - ${k}\left(${P2.tex}\right)\)`,
            parts: [{ kind: 'expr', form: 'expanded', answer: R.asc, show: R.tex, points: 3, verify: MX.V.equiv(`(${P1.asc})-${k}(${P2.asc})`) }],
            solution: [
              T`Distribute \(-${k}\) to every term: \(-${k}\left(${P2.tex}\right) = ${poly([[-k * B[0], { [v]: 2 }], [-k * B[1], { [v]: 1 }], [-k * B[2], {}]]).tex}\)`,
              T`Now the whole expression is \(${dist.tex}\)`,
              T`Combine like terms: \(${H.box(R.tex)}\)`,
            ],
          };
        },
      },
      add3: {
        name: 'Add and subtract three polynomials',
        gen(rng) {
          const v = rng.pick(['x', 'y', 'n']);
          const A = [rng.int(1, 9), rng.nz(-9, 9), rng.nz(-9, 9)];
          const B = [rng.nz(-6, 6), rng.nz(-9, 9), 0];
          const C = [rng.int(1, 6), 0, rng.nz(-9, 9)];
          const R = MX.quad(A[0] + B[0] - C[0], A[1] + B[1] - C[1], A[2] + B[2] - C[2], v);
          const P1 = MX.quad(...A, v), P2 = MX.quad(...B, v), P3 = MX.quad(...C, v);
          const dist = poly([[A[0], { [v]: 2 }], [A[1], { [v]: 1 }], [A[2], {}], [B[0], { [v]: 2 }], [B[1], { [v]: 1 }], [-C[0], { [v]: 2 }], [-C[2], {}]]);
          return {
            prompt: T`Simplify: \(\left(${P1.tex}\right) + \left(${P2.tex}\right) - \left(${P3.tex}\right)\)`,
            parts: [{ kind: 'expr', form: 'expanded', answer: R.asc, show: R.tex, points: 3, verify: MX.V.equiv(`(${P1.asc})+(${P2.asc})-(${P3.asc})`) }],
            solution: [
              T`Adding keeps signs; subtracting flips every sign in the last group: \(${dist.tex}\)`,
              T`Combine like terms: \(${H.box(R.tex)}\)`,
            ],
          };
        },
      },
    },
  });

  // ---------- dividing a polynomial by a monomial ----------
  MX.register({
    id: 'poly-divmono', section: SEC, title: 'Dividing a polynomial by a monomial', kind: 'skill',
    sources: ['Exam 1 #2', 'Exam 3 #9'],
    lesson: T`<p>Dividing by a single term is the same as dividing <em>each</em> term on top by it:</p>
\[\frac{a + b - c}{d} = \frac{a}{d} + \frac{b}{d} - \frac{c}{d}\]
<ol><li>Split into one fraction per term.</li><li>Divide the coefficients.</li><li>Subtract exponents of matching variables: \(\frac{m^{4}}{m^{3}} = m^{1}\).</li>
<li>If an exponent comes out negative, move that factor to the denominator: \(m^{-2} = \frac{1}{m^{2}}\).</li></ol>
<p class="warn">When the divisor is negative, every term changes sign.</p>`,
    variants: {
      two: {
        name: 'Two variables',
        gen(rng) {
          const [u, w] = rng.pick([['m', 'n'], ['a', 'b'], ['x', 'y'], ['p', 'q']]);
          const D = rng.int(2, 6), p = rng.int(2, 3), q = rng.int(2, 3);
          const k1 = rng.int(1, 5), e1 = rng.int(1, 2), f1 = rng.int(0, 3);
          const k2 = rng.int(1, 5) * rng.sign();
          const k3 = rng.int(1, 4) * rng.sign(), g = rng.int(1, p - 1), h = rng.int(1, q - 1);
          const orig = [[D * k1, { [u]: e1 + p, [w]: f1 + q }], [D * k2, { [u]: p, [w]: q }], [D * k3, { [u]: p - g, [w]: q - h }]];
          const top = poly(orig, [u, w]);
          const div = MX.poly([[D, { [u]: p, [w]: q }]], [u, w]);
          const r1 = H.fracMono(k1, { [u]: e1, [w]: f1 }, [u, w]);
          const r3 = H.fracMono(Math.abs(k3), { [u]: -g, [w]: -h }, [u, w]);
          const ansTex = r1.tex + (k2 < 0 ? ' - ' : ' + ') + Math.abs(k2) + (k3 < 0 ? ' - ' : ' + ') + r3.tex;
          const ansAsc = r1.asc + (k2 < 0 ? '-' : '+') + Math.abs(k2) + (k3 < 0 ? '-' : '+') + r3.asc;
          const pieces = orig.map((t) => '\\frac{' + MX.poly([[Math.abs(t[0]), t[1]]], [u, w]).tex + '}{' + div.tex + '}');
          const sgn = (c) => (c < 0 ? ' - ' : ' + ');
          return {
            prompt: T`Divide: \(\left(${top.tex}\right) \div \left(${div.tex}\right)\)`,
            parts: [{ kind: 'expr', form: 'terms', answer: ansAsc, show: ansTex, points: 3, verify: MX.V.equiv(`(${top.asc})/(${div.asc})`) }],
            solution: [
              T`Write one fraction per term: \(${pieces[0]}${sgn(orig[1][0])}${pieces[1]}${sgn(orig[2][0])}${pieces[2]}\)`,
              T`Divide coefficients and subtract exponents. First term: \(${D * k1} \div ${D} = ${k1}\), \(${u}^{${e1 + p} - ${p}} = ${u}^{${e1}}\), \(${w}^{${f1 + q} - ${q}} = ${w}^{${f1}}\)`,
              T`The middle term is the divisor times \(${Math.abs(k2)}\), so it becomes \(${Math.abs(k2)}\). In the last term the exponents come out negative: \(${u}^{-${g}}${w}^{-${h}}\), which moves to the denominator.`,
              T`\(${H.box(ansTex)}\)`,
            ],
          };
        },
      },
      neg: {
        name: 'Negative divisor',
        gen(rng) {
          const v = rng.pick(['x', 'x', 'y', 'a']);
          const C = rng.int(2, 6) * (rng.chance(0.7) ? -1 : 1), p = rng.int(2, 4);
          const a = rng.int(2, 7) * rng.sign(), e = rng.int(2, 5), b = rng.int(1, 5) * rng.sign();
          const top = poly([[C * a, { [v]: e + p }], [C * b, { [v]: p }]]);
          const div = poly([[C, { [v]: p }]]);
          const R = poly([[a, { [v]: e }], [b, {}]]);
          return {
            prompt: T`Divide: \(\dfrac{${top.tex}}{${div.tex}}\)`,
            parts: [{ kind: 'expr', form: 'terms', answer: R.asc, show: R.tex, points: 2, verify: MX.V.equiv(`(${top.asc})/(${div.asc})`) }],
            solution: [
              T`Split: \(\frac{${poly([[C * a, { [v]: e + p }]]).tex}}{${div.tex}} + \frac{${poly([[C * b, { [v]: p }]]).tex}}{${div.tex}}\)`,
              T`\(${C * a} \div ${MX.par(C)} = ${a}\) and \(${v}^{${e + p} - ${p}} = ${v}^{${e}}\); \(${C * b} \div ${MX.par(C)} = ${b}\) and \(${v}^{${p} - ${p}} = 1\)`,
              T`\(${H.box(R.tex)}\)`,
            ],
          };
        },
      },
    },
  });

  // ---------- special products ----------
  MX.register({
    id: 'special-products', section: SEC, title: 'Special products', kind: 'skill',
    sources: ['Exam 1 #3', 'Exam 2 #3', 'Exam 3 #4'],
    lesson: T`<p>Two patterns save a lot of work:</p>
\[(a - b)(a + b) = a^{2} - b^{2}\qquad (a + b)^{2} = a^{2} + 2ab + b^{2}\]
<p>The first is a <em>difference of squares</em>: the middle terms cancel. It works with radicals too, because \(\left(\sqrt{y}\right)^{2} = y\).</p>
<p>The second is a <em>perfect square</em>. You can also just FOIL: \((a+b)(a+b)\).</p>
<p class="warn">\((a + b)^{2}\) is <strong>not</strong> \(a^{2} + b^{2}\). The middle term \(2ab\) is easy to forget.</p>`,
    variants: {
      conjRad: {
        name: 'Conjugates with two radicals',
        gen(rng) {
          const v = rng.pick(['y', 'x', 'a']);
          const r = rng.pick([2, 3, 5, 6, 7, 10, 11, 13]);
          const R = poly([[1, { [v]: 1 }], [-r, {}]]);
          return {
            prompt: T`Multiply: \(\left(\sqrt{${v}} - \sqrt{${r}}\right)\left(\sqrt{${v}} + \sqrt{${r}}\right)\)`,
            parts: [{ kind: 'expr', form: 'expanded', answer: R.asc, show: R.tex, points: 3, verify: MX.V.equiv(`(√(${v})-√(${r}))(√(${v})+√(${r}))`) }],
            solution: [
              T`FOIL: \(\sqrt{${v}}\cdot\sqrt{${v}} + \sqrt{${v}}\sqrt{${r}} - \sqrt{${r}}\sqrt{${v}} - \sqrt{${r}}\cdot\sqrt{${r}}\)`,
              T`The two middle terms cancel (difference of squares).`,
              T`\(\left(\sqrt{${v}}\right)^{2} - \left(\sqrt{${r}}\right)^{2} = ${H.box(R.tex)}\)`,
            ],
          };
        },
      },
      conjInt: {
        name: 'Conjugates with a whole number',
        gen(rng) {
          const v = rng.pick(['y', 'x', 't']);
          const b = rng.int(2, 9), c = rng.int(1, 3);
          const pre = c === 1 ? '' : String(c);
          const R = poly([[c * c, { [v]: 1 }], [-b * b, {}]]);
          return {
            prompt: T`Multiply: \(\left(${pre}\sqrt{${v}} - ${b}\right)\left(${pre}\sqrt{${v}} + ${b}\right)\)`,
            parts: [{ kind: 'expr', form: 'expanded', answer: R.asc, show: R.tex, points: 2, verify: MX.V.equiv(`(${c}√(${v})-${b})(${c}√(${v})+${b})`) }],
            solution: [
              T`This is \((a - b)(a + b) = a^{2} - b^{2}\) with \(a = ${pre}\sqrt{${v}}\) and \(b = ${b}\).`,
              T`\(a^{2} = \left(${pre}\sqrt{${v}}\right)^{2} = ${c * c === 1 ? '' : c * c}${v}\) and \(b^{2} = ${b * b}\)`,
              T`\(${H.box(R.tex)}\)`,
            ],
          };
        },
      },
      square: {
        name: 'Square of a binomial',
        gen(rng) {
          const [u, w] = rng.pick([['x', 'y'], ['a', 'b'], ['m', 'n']]);
          const p = rng.int(1, 6), q = rng.int(1, 7) * rng.sign();
          if (p === 1 && Math.abs(q) === 1) return this.gen(rng);
          const B = poly([[p, { [u]: 1 }], [q, { [w]: 1 }]], [u, w]);
          const R = poly([[p * p, { [u]: 2 }], [2 * p * q, { [u]: 1, [w]: 1 }], [q * q, { [w]: 2 }]], [u, w]);
          return {
            prompt: T`Expand: \(\left(${B.tex}\right)^{2}\)`,
            parts: [{ kind: 'expr', form: 'expanded', answer: R.asc, show: R.tex, points: 3, verify: MX.V.equiv(`(${B.asc})^2`) }],
            solution: [
              T`Use \((a + b)^{2} = a^{2} + 2ab + b^{2}\) with \(a = ${MX.coef(p)}${u}\), \(b = ${MX.coef(q)}${w}\).`,
              T`\(a^{2} = ${p * p === 1 ? '' : p * p}${u}^{2}\), \(2ab = 2\left(${MX.coef(p)}${u}\right)\left(${MX.coef(q)}${w}\right) = ${2 * p * q}${u}${w}\), \(b^{2} = ${q * q === 1 ? '' : q * q}${w}^{2}\)`,
              T`\(${H.box(R.tex)}\)`,
            ],
          };
        },
      },
    },
  });

  // ---------- exponent rules ----------
  MX.register({
    id: 'exp-rules', section: SEC, title: 'Exponent rules', kind: 'skill',
    sources: ['Exam 1 #5, #6', 'Exam 2 #2', 'Exam 3 #1'],
    lesson: T`<p>The rules you need, for \(a \ne 0\):</p>
<ul><li>Product: \(a^{m}a^{n} = a^{m+n}\)</li><li>Quotient: \(\frac{a^{m}}{a^{n}} = a^{m-n}\)</li>
<li>Power: \(\left(a^{m}\right)^{n} = a^{mn}\) and \(\left(ab\right)^{n} = a^{n}b^{n}\)</li>
<li>Zero: \(a^{0} = 1\)</li><li>Negative: \(a^{-n} = \frac{1}{a^{n}}\) and \(\frac{1}{a^{-n}} = a^{n}\)</li></ul>
<p>Simplify each variable separately, reduce the numbers, then move any negative exponents across the fraction bar so every exponent is positive.</p>
<p class="warn">A negative exponent moves only its own factor: in \(4a^{-5}\) the 4 stays on top.</p>`,
    variants: {
      powers: {
        name: 'Powers of products',
        gen(rng) {
          const [u, w] = rng.pick([['m', 'n'], ['k', 'n'], ['a', 'b'], ['x', 'y']]);
          let a, b, p, c, q;
          do { a = rng.int(2, 5); b = rng.int(2, 5); p = rng.int(2, 3); c = rng.int(3, 7); q = rng.int(2, 3); } while (c * q - a * p === 0);
          const eu = c * q - a * p, ew = -b * p;
          const R = H.fracMono(1, { [u]: eu, [w]: ew }, [u, w]);
          return {
            prompt: T`Simplify: \(\left(${u}^{${a}}${w}^{${b}}\right)^{-${p}}\left(${u}^{${c}}${w}^{0}\right)^{${q}}\). Write the answer using positive exponents only.`,
            parts: [{ kind: 'expr', form: 'posexp', answer: R.asc, show: R.tex, points: 3, verify: MX.V.equiv(`(${u}^${a}*${w}^${b})^(-${p})*(${u}^${c}*${w}^0)^${q}`) }],
            solution: [
              T`Power rule: \(\left(${u}^{${a}}${w}^{${b}}\right)^{-${p}} = ${u}^{${-a * p}}${w}^{${-b * p}}\) and \(\left(${u}^{${c}}${w}^{0}\right)^{${q}} = ${u}^{${c * q}}\) (since \(${w}^{0} = 1\)).`,
              T`Product rule: \(${u}^{${-a * p} + ${c * q}}${w}^{${-b * p}} = ${u}^{${eu}}${w}^{${ew}}\)`,
              T`Move negative exponents to the denominator: \(${H.box(R.tex)}\)`,
            ],
          };
        },
      },
      quotient: {
        name: 'Quotient with negative exponents',
        gen(rng) {
          const [u, w] = rng.pick([['a', 'b'], ['x', 'y'], ['p', 'q']]);
          let A, B;
          do { A = rng.int(2, 9); B = rng.int(2, 15); } while (A === B || MX.gcd(A, B) === 1);
          const e1 = rng.int(2, 6), f1 = rng.int(2, 8), f2 = rng.int(1, 4), e2 = rng.int(2, 5);
          const co = new Q(A, B);
          const R = H.fracMono(co, { [u]: -(e1 + e2), [w]: f1 + f2 }, [u, w]);
          return {
            prompt: T`Simplify: \(\dfrac{${A}${u}^{-${e1}}${w}^{${f1}}}{${B}${w}^{-${f2}}${u}^{${e2}}}\). Write the answer using positive exponents only.`,
            parts: [{ kind: 'expr', form: 'posexp', answer: R.asc, show: R.tex, points: 3, verify: MX.V.equiv(`(${A}*${u}^(-${e1})*${w}^${f1})/(${B}*${w}^(-${f2})*${u}^${e2})`) }],
            solution: [
              T`Numbers: \(\frac{${A}}{${B}} = ${co.tex()}\)`,
              T`\(${u}\): \(${u}^{-${e1} - ${e2}} = ${u}^{${-(e1 + e2)}}\). \(${w}\): \(${w}^{${f1} - (-${f2})} = ${w}^{${f1 + f2}}\)`,
              T`Move \(${u}^{${-(e1 + e2)}}\) to the denominator: \(${H.box(R.tex)}\)`,
            ],
          };
        },
      },
      zero: {
        name: 'Zero and negative exponents',
        gen(rng) {
          const e = { y: rng.int(2, 6) };
          const xT = rng.int(1, 5), zT = rng.int(3, 8), zB = rng.int(1, 5);
          const R = H.fracMono(1, { x: -xT, z: -(zT + zB) }, ['x', 'y', 'z']);
          return {
            prompt: T`Simplify: \(\dfrac{x^{0}y^{${e.y}}z^{-${zT}}}{x^{${xT}}y^{${e.y}}z^{${zB}}}\). Write the answer using positive exponents only.`,
            parts: [{ kind: 'expr', form: 'posexp', answer: R.asc, show: R.tex, points: 3, verify: MX.V.equiv(`(x^0*y^${e.y}*z^(-${zT}))/(x^${xT}*y^${e.y}*z^${zB})`) }],
            solution: [
              T`\(x^{0} = 1\), so the only \(x\) is \(x^{${xT}}\) in the denominator.`,
              T`\(\frac{y^{${e.y}}}{y^{${e.y}}} = 1\)`,
              T`\(\frac{z^{-${zT}}}{z^{${zB}}} = z^{-${zT} - ${zB}} = z^{${-(zT + zB)}} = \frac{1}{z^{${zT + zB}}}\)`,
              T`\(${H.box(R.tex)}\)`,
            ],
          };
        },
      },
    },
  });

  // ---------- scientific notation ----------
  MX.register({
    id: 'sci-notation', section: SEC, title: 'Scientific notation', kind: 'skill',
    sources: ['Exam 1 #10', 'Exam 2 #7'],
    lesson: T`<p>A number is in scientific notation when it looks like \(a \times 10^{n}\) with \(1 \le a \lt 10\).</p>
<ul><li>Big numbers: move the decimal point left; the number of places is a positive \(n\). \(396{,}710 = 3.9671 \times 10^{5}\)</li>
<li>Small numbers: move it right; \(n\) is negative. \(0.00045 = 4.5 \times 10^{-4}\)</li>
<li>Multiplying: multiply the front numbers, add the exponents, then fix the front number if it is 10 or more.</li>
<li>Dividing: divide the front numbers, subtract the exponents, then fix if the front number is below 1.</li></ul>
<p>Type answers like <code>3.358 x 10^7</code>.</p>`,
    variants: {
      write: {
        name: 'Write a number in scientific notation',
        gen(rng) {
          const big = rng.chance(0.65);
          const digits = rng.int(2, 5);
          let N = rng.int(Math.pow(10, digits - 1) + 1, Math.pow(10, digits) - 1);
          if (N % 10 === 0) N += rng.int(1, 9);
          const k = big ? rng.int(1, 4) : -rng.int(digits + 1, digits + 4);
          const sc = H.sci(N, k), dec = H.decStr(N, k);
          return {
            prompt: T`Write the number \(${dec}\) in scientific notation.`,
            parts: [{ kind: 'sci', value: sc.value, answer: sc.asc, show: sc.tex, points: 2, verify: MX.V.value(() => Number(dec.replace(/,/g, ''))) }],
            solution: [
              T`Put the decimal point after the first nonzero digit: \(${sc.mant}\)`,
              big ? T`It moved ${sc.exp} places to the left, so the exponent is \(${sc.exp}\).` : T`It moved ${-sc.exp} places to the right, so the exponent is \(${sc.exp}\).`,
              T`\(${H.box(sc.tex)}\)`,
            ],
          };
        },
      },
      multiply: {
        name: 'Multiply',
        gen(rng) {
          const A = rng.int(11, 99), B = rng.int(11, 99);
          if (A % 10 === 0 || B % 10 === 0) return this.gen(rng);
          const m = rng.int(2, 9), n = rng.int(-3, 8);
          const a = H.sci(A, m - 1), b = H.sci(B, n - 1);
          const prod = H.sci(A * B, m + n - 2);
          const raw = (A * B) / 100;
          return {
            prompt: T`Multiply \(\left(${a.tex}\right)\) by \(\left(${b.tex}\right)\). Write your answer in scientific notation.`,
            parts: [{ kind: 'sci', value: prod.value, answer: prod.asc, show: prod.tex, points: 3, verify: MX.V.value(`(${a.mant}*10^(${a.exp}))*(${b.mant}*10^(${b.exp}))`) }],
            solution: [
              T`Multiply the front numbers: \(${a.mant} \times ${b.mant} = ${MX.num(raw)}\)`,
              T`Add the exponents: \(10^{${m}} \times 10^{${n}} = 10^{${m + n}}\)`,
              raw >= 10 ? T`\(${MX.num(raw)}\) is 10 or more, so move the decimal one place left and add 1 to the exponent.` : T`\(${MX.num(raw)}\) is already between 1 and 10.`,
              T`\(${H.box(prod.tex)}\)`,
            ],
          };
        },
      },
      divide: {
        name: 'Divide',
        gen(rng) {
          const b = rng.int(2, 9);
          let q; do { q = rng.int(11, 99); } while (q % 10 === 0);
          const E = rng.int(4, 10), n = rng.int(-3, 4);
          const top = H.sci(b * q, E - 1), bot = H.sci(b, n), ans = H.sci(q, E - n - 1);
          const rawFront = parseFloat(top.mant) / b;
          return {
            prompt: T`Divide: \(\dfrac{${top.tex}}{${bot.tex}}\). Write your answer in scientific notation.`,
            parts: [{ kind: 'sci', value: ans.value, answer: ans.asc, show: ans.tex, points: 3, verify: MX.V.value(`(${top.mant}*10^(${top.exp}))/(${bot.mant}*10^(${bot.exp}))`) }],
            solution: [
              T`Divide the front numbers: \(${top.mant} \div ${b} = ${MX.num(rawFront)}\)`,
              T`Subtract the exponents: \(10^{${top.exp} - ${MX.par(n)}} = 10^{${top.exp - n}}\)`,
              rawFront < 1 ? T`\(${MX.num(rawFront)}\) is less than 1, so move the decimal one place right and subtract 1 from the exponent.` : T`\(${MX.num(rawFront)}\) is already between 1 and 10.`,
              T`\(${H.box(ans.tex)}\)`,
            ],
          };
        },
      },
    },
  });

  // ---------- signs and powers ----------
  const FORMS = [
    { asc: (a, n) => `-${a}^${n}`, tex: (a, n) => T`-${a}^{${n}}`, val: (a, n) => -Math.pow(a, n), why: (a, n) => T`The exponent applies only to ${a}, then the result is made negative.` },
    { asc: (a, n) => `-(${a})^${n}`, tex: (a, n) => T`-\left(${a}\right)^{${n}}`, val: (a, n) => -Math.pow(a, n), why: (a, n) => T`Parentheses around ${a} change nothing: \(${a}^{${n}} = ${Math.pow(a, n)}\), then take the opposite.` },
    { asc: (a, n) => `(-${a})^${n}`, tex: (a, n) => T`\left(-${a}\right)^{${n}}`, val: (a, n) => Math.pow(-a, n), why: (a, n) => T`The negative is inside the parentheses, so it is multiplied ${n} times: ${n % 2 === 0 ? 'an even number of negatives is positive.' : 'an odd number of negatives is negative.'}` },
    { asc: (a, n) => `-(-${a})^${n}`, tex: (a, n) => T`-\left(-${a}\right)^{${n}}`, val: (a, n) => -Math.pow(-a, n), why: (a, n) => T`First \(\left(-${a}\right)^{${n}} = ${Math.pow(-a, n)}\), then the outside negative flips it.` },
  ];
  MX.register({
    id: 'signed-powers', section: SEC, title: 'Negative signs and powers', kind: 'skill',
    sources: ['Exam 3 #20'],
    lesson: T`<p>An exponent applies only to what it touches. Parentheses decide whether the negative sign is included.</p>
<ul><li>\(-2^{4} = -(2\cdot2\cdot2\cdot2) = -16\)</li><li>\(\left(-2\right)^{4} = (-2)(-2)(-2)(-2) = 16\)</li><li>\(-\left(-2\right)^{3} = -(-8) = 8\)</li></ul>
<p>Evaluate the power first, then apply the outside negative. An even number of negative factors gives a positive result; an odd number gives a negative result.</p>`,
    variants: {
      compare: {
        name: 'Evaluate and compare',
        gen(rng) {
          const a = rng.int(2, 5), n = rng.int(2, 4);
          const [i, j] = rng.sample([0, 1, 2, 3], 2);
          const L = FORMS[i], R = FORMS[j];
          const lv = L.val(a, n), rv = R.val(a, n);
          const rel = lv < rv ? 0 : lv === rv ? 1 : 2;
          return {
            prompt: T`Evaluate both expressions, then choose the sign that makes a true statement: \(${L.tex(a, n)} \quad \square \quad ${R.tex(a, n)}\)`,
            parts: [
              { label: 'a', ask: T`Value of \(${L.tex(a, n)}\)`, kind: 'num', answer: String(lv), points: 1, verify: MX.V.value(L.asc(a, n)) },
              { label: 'b', ask: T`Value of \(${R.tex(a, n)}\)`, kind: 'num', answer: String(rv), points: 1, verify: MX.V.value(R.asc(a, n)) },
              { label: 'c', ask: 'Which sign goes in the box?', kind: 'choice', options: ['&lt;', '=', '&gt;'], inline: true, answer: rel, points: 1,
                verify: MX.V.choice((i) => { const x = MX.V.num(L.asc(a, n)), y = MX.V.num(R.asc(a, n)); return [x < y, x === y, x > y][i]; }) },
            ],
            solution: [
              T`\(${L.tex(a, n)} = ${lv}\). ${L.why(a, n)}`,
              T`\(${R.tex(a, n)} = ${rv}\). ${R.why(a, n)}`,
              T`\(${lv} ${['\\lt', '=', '\\gt'][rel]} ${rv}\)`,
            ],
          };
        },
      },
      evaluate: {
        name: 'Evaluate an expression',
        gen(rng) {
          const a = rng.int(2, 4), n = rng.int(2, 4), b = rng.int(2, 5), m = rng.int(2, 3);
          const [i, j] = rng.sample([0, 2, 3], 2);
          const L = FORMS[i], R = FORMS[j];
          const lv = L.val(a, n), rv = R.val(b, m);
          const plus = rng.chance(0.5);
          const v = plus ? lv + rv : lv - rv;
          return {
            prompt: T`Evaluate: \(${L.tex(a, n)} ${plus ? '+' : '-'} \left(${R.tex(b, m)}\right)\)`,
            parts: [{ kind: 'num', answer: String(v), points: 2, verify: MX.V.value(`${L.asc(a, n)}${plus ? '+' : '-'}(${R.asc(b, m)})`) }],
            solution: [
              T`\(${L.tex(a, n)} = ${lv}\)`,
              T`\(${R.tex(b, m)} = ${rv}\)`,
              T`\(${lv} ${plus ? '+' : '-'} ${MX.par(rv)} = ${H.box(String(v))}\)`,
            ],
          };
        },
      },
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);

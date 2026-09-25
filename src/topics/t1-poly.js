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
    lesson: T`<p>Adding and subtracting polynomials is the same skill you use to simplify \(3x + 5x = 8x\): you combine like terms. The only new work is removing the parentheses correctly.</p>
<div class="box def"><h4>Definition <b>Like terms</b></h4><p><strong>Like terms</strong> have the same variables raised to the same exponents. \(4x^{2}\) and \(-9x^{2}\) are like terms. \(4x^{2}\) and \(4x\) are not. To combine like terms, add their <strong>coefficients</strong> (the numbers in front). The exponents do not change.</p></div>
<h3>Adding</h3>
<p>A plus sign in front of parentheses changes nothing. Drop the parentheses and combine like terms.</p>
<h3>Subtracting</h3>
<p>A minus sign in front of parentheses is really \(-1\) times the whole group. It has to reach every term inside.</p>
<div class="box rule"><h4>Rule <b>Subtracting a polynomial</b></h4><p>\(-\left(a - b + c\right) = -a + b - c\). Change the sign of <em>every</em> term inside. If a number stands in front, as in \(-3\left(\ldots\right)\), multiply every term inside by \(-3\).</p></div>
<div class="box how"><h4>How to <b>add or subtract polynomials</b></h4><ol>
<li>Remove the parentheses. A plus keeps the signs. A minus flips every sign. A number in front multiplies every term.</li>
<li>Group like terms: \(x^{2}\) with \(x^{2}\), \(x\) with \(x\), numbers with numbers.</li>
<li>Add the coefficients of each group. Keep the exponents.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Subtract \(\left(5x^{2} - 3x + 7\right) - \left(2x^{2} + 4x - 1\right)\).</p><table class="st">
<tr><td>Change the sign of every term in the second group.</td><td>\(5x^{2} - 3x + 7 - 2x^{2} - 4x + 1\)</td></tr>
<tr><td>Group like terms.</td><td>\(\left(5x^{2} - 2x^{2}\right) + \left(-3x - 4x\right) + \left(7 + 1\right)\)</td></tr>
<tr><td>Combine each group.</td><td>\(3x^{2} - 7x + 8\)</td></tr></table></div>
<div class="ex"><h4>Example</h4><p>Simplify \(\left(4y^{2} + y - 6\right) - 3\left(y^{2} - 2y + 5\right)\).</p><table class="st">
<tr><td>Multiply every term of the second group by \(-3\).</td><td>\(-3y^{2} + 6y - 15\)</td></tr>
<tr><td>Write the whole expression without parentheses.</td><td>\(4y^{2} + y - 6 - 3y^{2} + 6y - 15\)</td></tr>
<tr><td>Combine like terms.</td><td>\(y^{2} + 7y - 21\)</td></tr></table></div>
<p>With three polynomials, treat each group by the sign in front of it. Groups after a plus keep their signs. A group after a minus has every sign flipped.</p>
<div class="box warn"><h4>Watch out</h4><p>The most common mistake is changing the sign of only the first term inside the parentheses. \(-\left(2x^{2} + 4x - 1\right)\) is \(-2x^{2} - 4x + 1\), not \(-2x^{2} + 4x - 1\).</p></div>`,
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
    lesson: T`<p>When you add fractions with the same denominator, you write \(\frac{a}{d} + \frac{b}{d} = \frac{a + b}{d}\). Dividing a polynomial by a monomial runs that idea backward: you split one big fraction into one small fraction per term.</p>
<div class="box def"><h4>Definition <b>Monomial</b></h4><p>A <strong>monomial</strong> is a single term: a number times variables with whole-number exponents, such as \(3a^{2}b\) or \(-5x^{4}\). A <strong>polynomial</strong> is a sum of monomials.</p></div>
<h3>Divide each term separately</h3>
<div class="box rule"><h4>Rule <b>Dividing a polynomial by a monomial</b></h4><p>\(\dfrac{a + b - c}{d} = \dfrac{a}{d} + \dfrac{b}{d} - \dfrac{c}{d}\). Every term on top is divided by the monomial.</p></div>
<p>Each small fraction is a monomial divided by a monomial. Divide the numbers, then use the quotient rule on each variable.</p>
<div class="box rule"><h4>Property <b>Quotient rule for exponents</b></h4><p>\(\dfrac{a^{m}}{a^{n}} = a^{m - n}\). If the result is \(a^{0}\), that factor is 1. If the exponent is negative, move the factor to the denominator: \(a^{-2} = \dfrac{1}{a^{2}}\).</p></div>
<div class="box how"><h4>How to <b>divide a polynomial by a monomial</b></h4><ol>
<li>Write one fraction for each term on top.</li>
<li>Divide the coefficients, including their signs.</li>
<li>For each variable, subtract the exponents (top minus bottom).</li>
<li>Rewrite any negative exponent as a factor in the denominator.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Divide \(\left(6a^{4}b^{3} + 9a^{2}b^{2} - 3ab\right) \div \left(3a^{2}b^{2}\right)\).</p><table class="st">
<tr><td>Split into one fraction per term.</td><td>\(\dfrac{6a^{4}b^{3}}{3a^{2}b^{2}} + \dfrac{9a^{2}b^{2}}{3a^{2}b^{2}} - \dfrac{3ab}{3a^{2}b^{2}}\)</td></tr>
<tr><td>First term: \(6 \div 3 = 2\), \(a^{4-2}\), \(b^{3-2}\).</td><td>\(2a^{2}b\)</td></tr>
<tr><td>Second term: the top equals 3 times the bottom.</td><td>\(3\)</td></tr>
<tr><td>Third term: \(3 \div 3 = 1\), \(a^{1-2} = a^{-1}\), \(b^{1-2} = b^{-1}\).</td><td>\(\dfrac{1}{ab}\)</td></tr>
<tr><td>Put the pieces together.</td><td>\(2a^{2}b + 3 - \dfrac{1}{ab}\)</td></tr></table></div>
<div class="ex"><h4>Example</h4><p>Divide \(\dfrac{-10x^{5} + 15x^{2}}{-5x^{2}}\).</p><table class="st">
<tr><td>Divide the first term. A negative divided by a negative is positive.</td><td>\(\dfrac{-10x^{5}}{-5x^{2}} = 2x^{3}\)</td></tr>
<tr><td>Divide the second term. A positive divided by a negative is negative.</td><td>\(\dfrac{15x^{2}}{-5x^{2}} = -3\)</td></tr>
<tr><td>Put the pieces together.</td><td>\(2x^{3} - 3\)</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>When the divisor is negative, every term changes sign, not just the first one. And a term that divides out completely leaves its number, not 0: \(\frac{9a^{2}b^{2}}{3a^{2}b^{2}} = 3\).</p></div>`,
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
    lesson: T`<p>Some products come up so often that it pays to know their answers by pattern. You can always get them by FOIL (multiplying every term by every term), but the patterns are faster, and you will use them again when you factor.</p>
<h3>Squaring a binomial</h3>
<p>A <strong>binomial</strong> is a polynomial with two terms, like \(3x - 5y\). Squaring it means multiplying it by itself.</p>
<div class="box rule"><h4>Formula <b>Square of a binomial</b></h4><p>\(\left(a + b\right)^{2} = a^{2} + 2ab + b^{2}\) and \(\left(a - b\right)^{2} = a^{2} - 2ab + b^{2}\). In words: square the first term, add twice the product of the two terms, then add the square of the last term.</p></div>
<div class="ex"><h4>Example</h4><p>Expand \(\left(3x - 5y\right)^{2}\).</p><table class="st">
<tr><td>Name the two terms.</td><td>\(a = 3x,\ b = 5y\)</td></tr>
<tr><td>Square the first term.</td><td>\(\left(3x\right)^{2} = 9x^{2}\)</td></tr>
<tr><td>Twice the product. The sign is minus, as in the binomial.</td><td>\(2\left(3x\right)\left(5y\right) = 30xy\)</td></tr>
<tr><td>Square the last term.</td><td>\(\left(5y\right)^{2} = 25y^{2}\)</td></tr>
<tr><td>Put it together.</td><td>\(9x^{2} - 30xy + 25y^{2}\)</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>\(\left(a + b\right)^{2}\) is <strong>not</strong> \(a^{2} + b^{2}\). Try numbers: \(\left(2 + 3\right)^{2} = 25\), but \(2^{2} + 3^{2} = 13\). The missing 12 is the middle term \(2ab\).</p></div>
<h3>Multiplying conjugates</h3>
<div class="box def"><h4>Definition <b>Conjugates</b></h4><p>Two binomials are <strong>conjugates</strong> when they have the same two terms, but one is a sum and the other a difference: \(a - b\) and \(a + b\).</p></div>
<div class="box rule"><h4>Formula <b>Product of conjugates</b></h4><p>\(\left(a - b\right)\left(a + b\right) = a^{2} - b^{2}\). The two middle terms, \(+ab\) and \(-ab\), cancel. The result is called a <strong>difference of squares</strong>.</p></div>
<p>This works with square roots too, because squaring a square root undoes it: \(\left(\sqrt{y}\right)^{2} = y\) for \(y \ge 0\). So the roots disappear:</p><p>\(\left(\sqrt{y} - \sqrt{3}\right)\left(\sqrt{y} + \sqrt{3}\right) = y - 3\)</p>
<div class="ex"><h4>Example</h4><p>Multiply \(\left(2\sqrt{x} - 7\right)\left(2\sqrt{x} + 7\right)\).</p><table class="st">
<tr><td>These are conjugates. Name the terms.</td><td>\(a = 2\sqrt{x},\ b = 7\)</td></tr>
<tr><td>Square the first term. Square the 2 as well as the root.</td><td>\(\left(2\sqrt{x}\right)^{2} = 4x\)</td></tr>
<tr><td>Square the last term.</td><td>\(7^{2} = 49\)</td></tr>
<tr><td>Subtract.</td><td>\(4x - 49\)</td></tr></table></div>`,
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
    lesson: T`<p>An exponent counts how many times a base is multiplied by itself: \(a^{3} = a \cdot a \cdot a\). The rules below are shortcuts for that counting. They let you simplify a long expression without writing out every factor.</p>
<h3>The rules</h3>
<div class="box rule"><h4>Property <b>Properties of exponents</b></h4><p>For \(a \ne 0\), \(b \ne 0\) and integers \(m\) and \(n\) (positive, negative or zero):</p><ul>
<li>Product rule: \(a^{m} \cdot a^{n} = a^{m + n}\)</li>
<li>Quotient rule: \(\dfrac{a^{m}}{a^{n}} = a^{m - n}\)</li>
<li>Power rule: \(\left(a^{m}\right)^{n} = a^{mn}\)</li>
<li>Product to a power: \(\left(ab\right)^{n} = a^{n}b^{n}\)</li></ul></div>
<p>The product rule adds exponents because you are counting factors: \(a^{2} \cdot a^{3}\) is two \(a\)'s times three \(a\)'s, which is five \(a\)'s.</p>
<h3>Zero and negative exponents</h3>
<div class="box def"><h4>Definition <b>Zero and negative exponents</b></h4><p>For \(a \ne 0\): \(a^{0} = 1\), and \(a^{-n} = \dfrac{1}{a^{n}}\). Also \(\dfrac{1}{a^{-n}} = a^{n}\). A negative exponent means "take the reciprocal". It does not make the number negative: \(2^{-3} = \frac{1}{8}\).</p></div>
<p>So a factor with a negative exponent can move across the fraction bar, and its exponent becomes positive.</p>
<div class="box how"><h4>How to <b>simplify with positive exponents only</b></h4><ol>
<li>Use the power rules to remove parentheses.</li>
<li>Work on one variable at a time. Add exponents for a product, subtract them for a quotient.</li>
<li>Reduce the numbers like an ordinary fraction.</li>
<li>Move each factor with a negative exponent across the fraction bar.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Simplify \(\left(x^{2}y^{3}\right)^{-2}\left(x^{5}y^{0}\right)^{2}\).</p><table class="st">
<tr><td>Power rule on the first group.</td><td>\(x^{-4}y^{-6}\)</td></tr>
<tr><td>Power rule on the second group. \(y^{0} = 1\).</td><td>\(x^{10}\)</td></tr>
<tr><td>Product rule on \(x\).</td><td>\(x^{-4 + 10}y^{-6} = x^{6}y^{-6}\)</td></tr>
<tr><td>Move \(y^{-6}\) to the denominator.</td><td>\(\dfrac{x^{6}}{y^{6}}\)</td></tr></table></div>
<div class="ex"><h4>Example</h4><p>Simplify \(\dfrac{6a^{-2}b^{5}}{9a^{3}b^{-1}}\).</p><table class="st">
<tr><td>Reduce the numbers.</td><td>\(\dfrac{6}{9} = \dfrac{2}{3}\)</td></tr>
<tr><td>Quotient rule on \(a\).</td><td>\(a^{-2 - 3} = a^{-5}\)</td></tr>
<tr><td>Quotient rule on \(b\). Subtracting a negative adds.</td><td>\(b^{5 - (-1)} = b^{6}\)</td></tr>
<tr><td>Move \(a^{-5}\) to the denominator.</td><td>\(\dfrac{2b^{6}}{3a^{5}}\)</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>A negative exponent moves only its own factor. In \(4a^{-5}\) the 4 stays on top: \(4a^{-5} = \dfrac{4}{a^{5}}\), not \(\dfrac{1}{4a^{5}}\).</p></div>`,
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
    lesson: T`<p>Scientific notation is a short way to write very large or very small numbers. Instead of counting zeros, you write the digits once and let a power of 10 say how big the number is.</p>
<div class="box def"><h4>Definition <b>Scientific notation</b></h4><p>A number is in <strong>scientific notation</strong> when it is written as \(a \times 10^{n}\), where \(1 \le a \lt 10\) and \(n\) is an integer. The front number \(a\) has exactly one nonzero digit before the decimal point.</p></div>
<h3>Writing a number in scientific notation</h3>
<div class="box how"><h4>How to <b>write a number in scientific notation</b></h4><ol>
<li>Move the decimal point so that exactly one nonzero digit is to its left.</li>
<li>Count how many places you moved it. That count is the size of \(n\).</li>
<li>If the original number is 10 or more, \(n\) is positive. If it is less than 1, \(n\) is negative.</li></ol></div>
<p>For example, 52,600 is \(5.26 \times 10^{4}\) (the point moved 4 places left), and 0.000382 is \(3.82 \times 10^{-4}\) (it moved 4 places right).</p>
<h3>Multiplying and dividing</h3>
<p>Treat the front numbers and the powers of 10 separately. The powers of 10 follow the exponent rules.</p>
<div class="box rule"><h4>Rule <b>Multiplying and dividing in scientific notation</b></h4><p>\(\left(a \times 10^{m}\right)\left(b \times 10^{n}\right) = \left(a \cdot b\right) \times 10^{m + n}\) and \(\dfrac{a \times 10^{m}}{b \times 10^{n}} = \dfrac{a}{b} \times 10^{m - n}\).</p></div>
<div class="ex"><h4>Example</h4><p>Multiply \(\left(4.5 \times 10^{3}\right)\left(6 \times 10^{-7}\right)\).</p><table class="st">
<tr><td>Multiply the front numbers.</td><td>\(4.5 \times 6 = 27\)</td></tr>
<tr><td>Add the exponents.</td><td>\(10^{3 + (-7)} = 10^{-4}\)</td></tr>
<tr><td>27 is not less than 10. Move the point one place left and add 1 to the exponent.</td><td>\(27 \times 10^{-4} = 2.7 \times 10^{-3}\)</td></tr></table></div>
<div class="ex"><h4>Example</h4><p>Divide \(\dfrac{1.2 \times 10^{5}}{4 \times 10^{-2}}\).</p><table class="st">
<tr><td>Divide the front numbers.</td><td>\(1.2 \div 4 = 0.3\)</td></tr>
<tr><td>Subtract the exponents.</td><td>\(10^{5 - (-2)} = 10^{7}\)</td></tr>
<tr><td>0.3 is less than 1. Move the point one place right and subtract 1 from the exponent.</td><td>\(0.3 \times 10^{7} = 3 \times 10^{6}\)</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>Always check the front number at the end. If it is 10 or more, or less than 1, the answer is not in scientific notation yet. Making the front number smaller makes the exponent bigger, and the other way around.</p></div>
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
    lesson: T`<p>\(-3^{2}\) and \(\left(-3\right)^{2}\) look almost the same, but one is \(-9\) and the other is \(9\). The difference is what the exponent applies to, and the parentheses decide that.</p>
<div class="box def"><h4>Definition <b>Base</b></h4><p>The <strong>base</strong> is the number the exponent sits on. An exponent applies only to its base. In \(-3^{2}\) the base is 3, and the minus sign stays outside. In \(\left(-3\right)^{2}\) the base is \(-3\), because the parentheses put the minus sign inside.</p></div>
<h3>Power first, then the outside sign</h3>
<p>Order of operations puts exponents before multiplication, and a minus sign in front means "multiply by \(-1\)". So you work out the power first and apply any outside minus sign last.</p>
<div class="box rule"><h4>Rule <b>Powers of a negative number</b></h4><p>When the base is negative, count the negative factors. An <strong>even</strong> exponent gives a positive result: \(\left(-2\right)^{4} = 16\). An <strong>odd</strong> exponent gives a negative result: \(\left(-2\right)^{3} = -8\).</p></div>
<div class="ex"><h4>Example</h4><p>Evaluate each expression.</p><table class="st">
<tr><td>Base 2. Find \(2^{4}\), then make it negative.</td><td>\(-2^{4} = -\left(16\right) = -16\)</td></tr>
<tr><td>Parentheses around 2 alone change nothing.</td><td>\(-\left(2\right)^{4} = -16\)</td></tr>
<tr><td>Base \(-2\), even exponent.</td><td>\(\left(-2\right)^{4} = 16\)</td></tr>
<tr><td>Base \(-2\), odd exponent, then the outside minus flips it.</td><td>\(-\left(-2\right)^{3} = -\left(-8\right) = 8\)</td></tr></table></div>
<p>To compare two expressions, find the value of each one first, then compare the numbers: \(-2^{4} \lt \left(-2\right)^{4}\) because \(-16 \lt 16\).</p>
<div class="ex"><h4>Example</h4><p>Evaluate \(\left(-2\right)^{3} - \left(-3^{2}\right)\).</p><table class="st">
<tr><td>Base \(-2\), odd exponent.</td><td>\(\left(-2\right)^{3} = -8\)</td></tr>
<tr><td>Base 3. Square it, then make it negative.</td><td>\(-3^{2} = -9\)</td></tr>
<tr><td>Subtracting a negative is adding.</td><td>\(-8 - \left(-9\right) = -8 + 9 = 1\)</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>\(-3^{2}\) is \(-9\), not 9. Without parentheses, the minus sign is not part of the base. Many calculators agree: typing <code>-3^2</code> gives \(-9\).</p></div>`,
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

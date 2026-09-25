/* Radicals */
(function (G) {
  'use strict';
  const MX = G.MX;
  const { Q, T, H } = MX;
  const SEC = 'Radicals';
  const SQF = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15];
  const rootTex = (c, f) => (c === 1 ? '' : c === -1 ? '-' : String(c)) + '\\sqrt{' + f + '}';
  const rootAsc = (c, f) => (c === 1 ? '' : c === -1 ? '-' : String(c)) + '√(' + f + ')';

  MX.register({
    id: 'rad-simplify', section: SEC, title: 'Simplifying radicals', kind: 'skill',
    sources: ['Exam 1 #9', 'Exam 2 #6'],
    lesson: T`<p>A square root undoes squaring: \(\sqrt{49} = 7\) because \(7^{2} = 49\). Most numbers are not perfect squares, but many <em>contain</em> one as a factor. Simplifying a radical means pulling those perfect-square pieces out from under the root sign.</p>
<div class="box def"><h4>Definition <b>Simplified square root</b></h4><p>A square root is <strong>simplified</strong> when the expression under the root sign (the <strong>radicand</strong>) has no perfect-square factor other than 1. \(\sqrt{50}\) is not simplified, because \(50 = 25 \cdot 2\) and 25 is a perfect square. In this topic, variables stand for numbers that are 0 or positive.</p></div>
<h3>Split the root into pieces</h3>
<div class="box rule"><h4>Property <b>Product property of square roots</b></h4><p>\(\sqrt{ab} = \sqrt{a} \cdot \sqrt{b}\) when \(a \ge 0\) and \(b \ge 0\). For example, \(\sqrt{50} = \sqrt{25} \cdot \sqrt{2} = 5\sqrt{2}\).</p></div>
<p>Useful perfect squares: 4, 9, 16, 25, 36, 49, 64, 81, 100.</p>
<h3>Variables with exponents</h3>
<p>A power with an <em>even</em> exponent is a perfect square, and its square root has half the exponent: \(\sqrt{x^{10}} = x^{5}\), because \(\left(x^{5}\right)^{2} = x^{10}\). For an odd exponent, split off one factor: \(x^{7} = x^{6} \cdot x\). The \(x^{6}\) comes out as \(x^{3}\); the single \(x\) stays inside.</p>
<div class="box how"><h4>How to <b>simplify a square root</b></h4><ol>
<li>Write the number as (largest perfect square) \(\cdot\) (what is left).</li>
<li>Write each variable power as (largest even power) \(\cdot\) (what is left).</li>
<li>Take the square root of every perfect-square piece and put it in front.</li>
<li>Leave everything else under one root sign.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Simplify \(\sqrt{72x^{7}}\).</p><table class="st">
<tr><td>Find the largest perfect square in 72.</td><td>\(72 = 36 \cdot 2\)</td></tr>
<tr><td>Split the variable into an even power and what is left.</td><td>\(x^{7} = x^{6} \cdot x\)</td></tr>
<tr><td>Group the perfect squares.</td><td>\(\sqrt{36x^{6}} \cdot \sqrt{2x}\)</td></tr>
<tr><td>Take the square root of the perfect squares.</td><td>\(6x^{3}\sqrt{2x}\)</td></tr></table></div>
<div class="ex"><h4>Example</h4><p>Simplify \(\sqrt{45a^{4}b^{5}}\).</p><table class="st">
<tr><td>Split each part.</td><td>\(45 = 9 \cdot 5,\quad a^{4},\quad b^{5} = b^{4} \cdot b\)</td></tr>
<tr><td>Group the perfect squares.</td><td>\(\sqrt{9a^{4}b^{4}} \cdot \sqrt{5b}\)</td></tr>
<tr><td>Take their square roots.</td><td>\(3a^{2}b^{2}\sqrt{5b}\)</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>Use the <em>largest</em> perfect square. \(\sqrt{72} = 2\sqrt{18}\) is true but not finished, because 18 still contains 9. Going straight to \(72 = 36 \cdot 2\) gives \(6\sqrt{2}\) in one step.</p></div>
<p>Type radicals as <code>√(2x)</code> or <code>sqrt(2x)</code>, for example <code>6x^3√(2x)</code>.</p>`,
    variants: {
      onevar: {
        name: 'One variable',
        gen(rng) {
          const v = rng.pick(['t', 'x', 'n', 'a']);
          const s = rng.int(2, 7), f = rng.pick(SQF.slice(0, 7)), e = rng.int(3, 15);
          const c = s * s * f, h = Math.floor(e / 2), odd = e % 2;
          const inT = f + (odd ? v : ''), outT = s + v + (h > 1 ? '^{' + h + '}' : '');
          const outA = s + v + (h > 1 ? '^' + h : '');
          return {
            prompt: T`Simplify: \(\sqrt{${c}${v}^{${e}}}\). Answer in simplified radical form.`,
            parts: [{ kind: 'expr', form: 'radical', vars: [v], answer: outA + '√(' + inT + ')', show: outT + '\\sqrt{' + inT + '}', points: 3, verify: MX.V.equiv(`√(${c}${v}^${e})`) }],
            solution: [
              T`Largest perfect square in ${c}: \(${c} = ${s * s}\cdot${f}\).`,
              odd ? T`\(${v}^{${e}} = ${v}^{${2 * h}}\cdot ${v}\), and \(${v}^{${2 * h}}\) is a perfect square.` : T`\(${v}^{${e}}\) has an even exponent, so it is a perfect square.`,
              T`\(\sqrt{${s * s}${v}^{${2 * h}}}\cdot\sqrt{${inT}} = ${outT}\sqrt{${inT}}\)`,
              T`\(${H.box(outT + '\\sqrt{' + inT + '}')}\)`,
            ],
          };
        },
      },
      twovar: {
        name: 'Two variables',
        gen(rng) {
          const s = rng.int(2, 6), f = rng.pick(SQF.slice(0, 6));
          const ax = rng.int(1, 7), by = rng.pick([3, 5, 7, 9]);
          const c = s * s * f, hy = (by - 1) / 2;
          const outT = s + 'x^{' + ax + '}y' + (hy > 1 ? '^{' + hy + '}' : '');
          const outA = s + 'x^' + ax + 'y' + (hy > 1 ? '^' + hy : '');
          return {
            prompt: T`Simplify the radical \(\sqrt{${c}x^{${2 * ax}}y^{${by}}}\). Write your answer in radical form.`,
            parts: [{ kind: 'expr', form: 'radical', vars: ['x', 'y'], answer: outA + '√(' + f + 'y)', show: outT + '\\sqrt{' + f + 'y}', points: 3, verify: MX.V.equiv(`√(${c}x^${2 * ax}y^${by})`) }],
            solution: [
              T`\(${c} = ${s * s}\cdot${f}\), \(x^{${2 * ax}}\) is already a perfect square, and \(y^{${by}} = y^{${by - 1}}\cdot y\).`,
              T`\(\sqrt{${s * s}x^{${2 * ax}}y^{${by - 1}}}\cdot\sqrt{${f}y} = ${outT}\sqrt{${f}y}\)`,
              T`\(${H.box(outT + '\\sqrt{' + f + 'y}')}\)`,
            ],
          };
        },
      },
    },
  });

  MX.register({
    id: 'rad-addsub', section: SEC, title: 'Adding & subtracting radicals', kind: 'skill',
    sources: ['Exam 3 #18'],
    lesson: T`<p>Adding radicals works like combining like terms. You know \(2x + 5x = 7x\): you add the numbers in front and keep the \(x\). In the same way, \(2\sqrt{3} + 5\sqrt{3} = 7\sqrt{3}\). The \(\sqrt{3}\) plays the role of \(x\).</p>
<div class="box def"><h4>Definition <b>Like radicals</b></h4><p><strong>Like radicals</strong> have the same kind of root and the same radicand (the expression under the root sign). \(4\sqrt{7}\) and \(-\sqrt{7}\) are like radicals. \(\sqrt{7}\) and \(\sqrt{5}\) are not.</p></div>
<div class="box rule"><h4>Rule <b>Combining like radicals</b></h4><p>\(a\sqrt{n} + b\sqrt{n} = \left(a + b\right)\sqrt{n}\) and \(a\sqrt{n} - b\sqrt{n} = \left(a - b\right)\sqrt{n}\). Add or subtract the numbers in front; the radical stays the same.</p></div>
<h3>Simplify first</h3>
<p>Radicals that look different are often alike once you simplify them. \(\sqrt{12}\) and \(\sqrt{75}\) look unrelated, but \(\sqrt{12} = 2\sqrt{3}\) and \(\sqrt{75} = 5\sqrt{3}\).</p>
<div class="box how"><h4>How to <b>add or subtract square roots</b></h4><ol>
<li>Simplify each square root: pull out its largest perfect-square factor.</li>
<li>If there is a number in front, multiply it by what came out.</li>
<li>Combine the like radicals by adding or subtracting the numbers in front.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Add \(\sqrt{12} + \sqrt{75}\).</p><table class="st">
<tr><td>Simplify the first root.</td><td>\(\sqrt{12} = \sqrt{4 \cdot 3} = 2\sqrt{3}\)</td></tr>
<tr><td>Simplify the second root.</td><td>\(\sqrt{75} = \sqrt{25 \cdot 3} = 5\sqrt{3}\)</td></tr>
<tr><td>They are like radicals, so add the numbers in front.</td><td>\(2\sqrt{3} + 5\sqrt{3} = 7\sqrt{3}\)</td></tr></table></div>
<div class="ex"><h4>Example</h4><p>Simplify \(3\sqrt{8} - 2\sqrt{50}\).</p><table class="st">
<tr><td>Simplify \(\sqrt{8}\), then multiply by the 3 in front.</td><td>\(3 \cdot 2\sqrt{2} = 6\sqrt{2}\)</td></tr>
<tr><td>Simplify \(\sqrt{50}\), then multiply by the 2 in front.</td><td>\(2 \cdot 5\sqrt{2} = 10\sqrt{2}\)</td></tr>
<tr><td>Subtract the numbers in front.</td><td>\(6\sqrt{2} - 10\sqrt{2} = -4\sqrt{2}\)</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>You cannot add the numbers under the root sign: \(\sqrt{a} + \sqrt{b} \ne \sqrt{a + b}\). Try it: \(\sqrt{9} + \sqrt{16} = 3 + 4 = 7\), but \(\sqrt{25} = 5\).</p></div>`,
    variants: {
      two: {
        name: 'Two radicals',
        gen(rng) {
          const f = rng.pick(SQF.slice(0, 7));
          let a, b; do { a = rng.int(2, 8); b = rng.int(2, 8); } while (a === b);
          const sg = rng.sign(), r = a + sg * b;
          return {
            prompt: T`${sg < 0 ? 'Subtract' : 'Add'}: \(\sqrt{${a * a * f}} ${sg < 0 ? '-' : '+'} \sqrt{${b * b * f}}\)`,
            parts: [{ kind: 'expr', form: 'radical', vars: [], answer: rootAsc(r, f), show: rootTex(r, f), points: 3, verify: MX.V.equiv(`√(${a * a * f})${sg < 0 ? '-' : '+'}√(${b * b * f})`) }],
            solution: [
              T`\(\sqrt{${a * a * f}} = \sqrt{${a * a}\cdot${f}} = ${a}\sqrt{${f}}\)`,
              T`\(\sqrt{${b * b * f}} = \sqrt{${b * b}\cdot${f}} = ${b}\sqrt{${f}}\)`,
              T`\(${a}\sqrt{${f}} ${sg < 0 ? '-' : '+'} ${b}\sqrt{${f}} = ${H.box(rootTex(r, f))}\)`,
            ],
          };
        },
      },
      coef: {
        name: 'With coefficients',
        gen(rng) {
          const f = rng.pick([2, 3, 5, 6, 7]);
          let p, q, a, b, sg, r;
          do { p = rng.int(2, 5); q = rng.int(2, 5); a = rng.int(2, 4); b = rng.int(2, 5); sg = rng.sign(); r = p * a + sg * q * b; } while (a === b || r === 0);
          return {
            prompt: T`Simplify: \(${p}\sqrt{${a * a * f}} ${sg < 0 ? '-' : '+'} ${q}\sqrt{${b * b * f}}\)`,
            parts: [{ kind: 'expr', form: 'radical', vars: [], answer: rootAsc(r, f), show: rootTex(r, f), points: 3, verify: MX.V.equiv(`${p}√(${a * a * f})${sg < 0 ? '-' : '+'}${q}√(${b * b * f})`) }],
            solution: [
              T`\(${p}\sqrt{${a * a * f}} = ${p}\cdot${a}\sqrt{${f}} = ${p * a}\sqrt{${f}}\)`,
              T`\(${q}\sqrt{${b * b * f}} = ${q}\cdot${b}\sqrt{${f}} = ${q * b}\sqrt{${f}}\)`,
              T`\(${p * a}\sqrt{${f}} ${sg < 0 ? '-' : '+'} ${q * b}\sqrt{${f}} = ${H.box(rootTex(r, f))}\)`,
            ],
          };
        },
      },
    },
  });

  function quadExpr(rng, whole) {
    let f, s1, a1, d1, g;
    do {
      f = rng.pick(SQF); s1 = rng.int(1, 4); a1 = rng.nz(-6, 6); d1 = whole ? 1 : rng.int(2, 5); g = rng.int(2, 4);
    } while (MX.gcdAll([a1, s1, d1]) !== 1 || (s1 * g) * (s1 * g) * f > 400);
    const A = g * a1, s = g * s1, D = g * d1, N = s * s * f;
    const num = (x, y) => x + (y === 1 ? '√(' + f + ')' : y + '√(' + f + ')');
    const ansT = whole ? T`${a1} \pm ${s1 === 1 ? '' : s1}\sqrt{${f}}` : T`\frac{${a1} \pm ${s1 === 1 ? '' : s1}\sqrt{${f}}}{${d1}}`;
    const b1 = whole ? a1 + '+' + num('', s1) : '(' + a1 + '+' + num('', s1) + ')/' + d1;
    const b2 = whole ? a1 + '-' + num('', s1) : '(' + a1 + '-' + num('', s1) + ')/' + d1;
    return {
      prompt: T`Simplify: \(\dfrac{${A} \pm \sqrt{${N}}}{${D}}\)`,
      parts: [{ kind: 'radpm', answers: [b1, b2], answer: whole ? a1 + '±' + num('', s1) : '(' + a1 + '±' + num('', s1) + ')/' + d1, show: ansT, points: 3,
        // both values of the displayed (A ± √N)/D, evaluated directly
        verify: MX.V.custom((a) => MX.V.sameSet(a, [`(${A}+√(${N}))/${D}`, `(${A}-√(${N}))/${D}`].map(MX.V.num)) && a.length === 2 || 'the two values are ' + MX.num(MX.V.num(`(${A}+√(${N}))/${D}`), 6) + ' and ' + MX.num(MX.V.num(`(${A}-√(${N}))/${D}`), 6)) }],
      solution: [
        T`Simplify the radical: \(\sqrt{${N}} = \sqrt{${s * s}\cdot${f}} = ${s}\sqrt{${f}}\)`,
        T`Now \(\dfrac{${A} \pm ${s}\sqrt{${f}}}{${D}}\). Every term is divisible by ${g}.`,
        T`Divide each term by ${g}: \(${H.box(ansT)}\)`,
      ],
    };
  }
  MX.register({
    id: 'rad-quadexpr', section: SEC, title: 'Simplifying (a ± √b)/c', kind: 'skill',
    sources: ['Exam 3 #7'],
    lesson: T`<p>The quadratic formula often hands you an answer like \(\dfrac{4 \pm \sqrt{48}}{8}\). It is correct but not finished. This topic is the clean-up step: simplify the square root, then reduce the fraction.</p>
<p>The sign \(\pm\) means "plus or minus". The expression stands for two numbers: one with \(+\) and one with \(-\). You simplify both at once.</p>
<h3>Why you must divide every term</h3>
<p>A fraction with a sum on top splits into two fractions: \(\dfrac{a \pm b}{c} = \dfrac{a}{c} \pm \dfrac{b}{c}\). So to reduce it, the same number has to divide <em>both</em> terms on top as well as the bottom.</p>
<div class="box rule"><h4>Rule <b>Reducing \(\dfrac{a \pm b\sqrt{n}}{c}\)</b></h4><p>You may divide by a number \(g\) only if \(g\) divides all three numbers: \(a\), \(b\) and \(c\). Then \(\dfrac{a \pm b\sqrt{n}}{c} = \dfrac{a \div g \pm \left(b \div g\right)\sqrt{n}}{c \div g}\).</p></div>
<div class="box how"><h4>How to <b>simplify \(\dfrac{a \pm \sqrt{N}}{c}\)</b></h4><ol>
<li>Simplify the square root: pull out its largest perfect-square factor.</li>
<li>Find the greatest common factor of the number in front, the number multiplying the root, and the denominator.</li>
<li>Divide all three by it.</li>
<li>If the denominator becomes 1, drop it.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Simplify \(\dfrac{4 \pm \sqrt{48}}{8}\).</p><table class="st">
<tr><td>Simplify the root: \(48 = 16 \cdot 3\).</td><td>\(\sqrt{48} = 4\sqrt{3}\)</td></tr>
<tr><td>Rewrite the fraction.</td><td>\(\dfrac{4 \pm 4\sqrt{3}}{8}\)</td></tr>
<tr><td>4, 4 and 8 are all divisible by 4. Divide each by 4.</td><td>\(\dfrac{1 \pm \sqrt{3}}{2}\)</td></tr></table></div>
<div class="ex"><h4>Example</h4><p>Simplify \(\dfrac{6 \pm \sqrt{20}}{2}\).</p><table class="st">
<tr><td>Simplify the root: \(20 = 4 \cdot 5\).</td><td>\(\dfrac{6 \pm 2\sqrt{5}}{2}\)</td></tr>
<tr><td>6, 2 and 2 are all divisible by 2. Divide each by 2.</td><td>\(\dfrac{3 \pm \sqrt{5}}{1}\)</td></tr>
<tr><td>A denominator of 1 can be dropped.</td><td>\(3 \pm \sqrt{5}\)</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>You cannot cancel the denominator with just one term. In \(\frac{6 \pm \sqrt{5}}{3}\) the 3 divides the 6 but not the \(\sqrt{5}\) term, so it does not reduce. It is <em>not</em> \(2 \pm \sqrt{5}\).</p></div>
<p>Type the \(\pm\) as <code>+-</code>, for example <code>(1+-√3)/2</code>.</p>`,
    variants: {
      reduce: { name: 'Reduces to a fraction', gen: (rng) => quadExpr(rng, false) },
      whole: { name: 'Denominator divides out', gen: (rng) => quadExpr(rng, true) },
    },
  });

  function ratExp(rng, form) {
    const v = rng.pick(['D', 'x', 'y', 'a']);
    let n, m;
    do { n = rng.pick(form === 'sqrt' ? [2] : [3, 4, 5, 6, 8]); m = rng.int(1, 9); } while (m % n === 0 || (form === 'sqrt' && m < 3));
    const e = new Q(m, n);
    const radT = form === 'power' ? T`\left(\sqrt[${n}]{${v}}\right)^{${m}}` : n === 2 ? T`\sqrt{${v}^{${m}}}` : T`\sqrt[${n}]{${v}^{${m}}}`;
    return {
      prompt: T`Write \(${radT}\) using an exponent, without a radical.`,
      parts: [{ kind: 'expr', form: 'noradical', vars: [v], answer: `${v}^(${e.str()})`, show: T`${v}^{${e.tex()}}`, points: 2, verify: MX.V.equiv(form === 'power' ? `(${v}^(1/${n}))^${m}` : `(${v}^${m})^(1/${n})`) }],
      solution: [
        T`\(\sqrt[n]{${v}^{m}} = \left(\sqrt[n]{${v}}\right)^{m} = ${v}^{m/n}\): the power goes on top, the root goes on the bottom.`,
        T`Here \(m = ${m}\) and \(n = ${n}\): \(${v}^{\frac{${m}}{${n}}}\)${e.d !== n ? T`, which reduces to \(${v}^{${e.tex()}}\)` : ''}.`,
        T`\(${H.box(T`${v}^{${e.tex()}}`)}\)`,
      ],
    };
  }
  MX.register({
    id: 'rad-ratexp', section: SEC, title: 'Radicals as rational exponents', kind: 'skill',
    sources: ['Exam 3 #26'],
    lesson: T`<p>Roots and exponents are two ways to write the same thing. A root can always be rewritten as a power with a fraction for its exponent. This form is often easier to work with, because all the usual exponent rules still apply.</p>
<h3>Where fraction exponents come from</h3>
<p>By the power rule, \(\left(x^{\frac{1}{2}}\right)^{2} = x^{1} = x\). So \(x^{\frac{1}{2}}\) is the number whose square is \(x\), which is \(\sqrt{x}\). In the same way, \(x^{\frac{1}{3}} = \sqrt[3]{x}\).</p>
<div class="box def"><h4>Definition <b>Index of a root</b></h4><p>In \(\sqrt[n]{x}\), the small number \(n\) is the <strong>index</strong>. It tells you which root: 3 for a cube root, 4 for a fourth root. A plain square root \(\sqrt{x}\) has index 2, even though the 2 is not written.</p></div>
<div class="box rule"><h4>Rule <b>Rational exponents</b></h4><p>\(\sqrt[n]{x} = x^{\frac{1}{n}}\) and \(\sqrt[n]{x^{m}} = \left(\sqrt[n]{x}\right)^{m} = x^{\frac{m}{n}}\)</p><p>The power \(m\) goes on top of the fraction. The index \(n\) goes on the bottom. It does not matter whether the power is inside the root or outside it.</p></div>
<div class="box how"><h4>How to <b>write a root as an exponent</b></h4><ol>
<li>Find the index \(n\) of the root (2 if none is written).</li>
<li>Find the power \(m\) on the variable (inside or outside the root).</li>
<li>Write the variable with exponent \(\frac{m}{n}\).</li>
<li>Reduce the fraction if you can.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Write \(\sqrt[3]{y^{5}}\) and \(\sqrt{x^{7}}\) using exponents.</p><table class="st">
<tr><td>Cube root: index 3, power 5.</td><td>\(\sqrt[3]{y^{5}} = y^{\frac{5}{3}}\)</td></tr>
<tr><td>Square root: index 2 (not written), power 7.</td><td>\(\sqrt{x^{7}} = x^{\frac{7}{2}}\)</td></tr></table></div>
<div class="ex"><h4>Example</h4><p>Write \(\left(\sqrt[4]{a}\right)^{6}\) using an exponent.</p><table class="st">
<tr><td>The power is outside the root this time. Index 4, power 6.</td><td>\(a^{\frac{6}{4}}\)</td></tr>
<tr><td>Reduce the fraction.</td><td>\(a^{\frac{3}{2}}\)</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>Keep the fraction the right way up: power over root. \(\sqrt[3]{x^{2}} = x^{\frac{2}{3}}\), not \(x^{\frac{3}{2}}\).</p></div>
<p>Type the exponent in parentheses: <code>y^(5/3)</code>.</p>`,
    variants: {
      root: { name: 'nth root of a power', gen: (rng) => ratExp(rng, 'root') },
      power: { name: 'Power of an nth root', gen: (rng) => ratExp(rng, 'power') },
      sqrt: { name: 'Square root', gen: (rng) => ratExp(rng, 'sqrt') },
    },
  });

  MX.register({
    id: 'rad-equation', section: SEC, title: 'Radical equations', kind: 'skill',
    sources: ['Exam 1 #13', 'Exam 2 #13', 'Exam 3 #8'],
    lesson: T`<p>A <strong>radical equation</strong> has the variable under a root sign, such as \(\sqrt{x - 3} + 4 = 9\). Squaring undoes a square root, so the plan is to get the root by itself and then square both sides. What is left is an ordinary equation.</p>
<h3>Get the root alone, then square</h3>
<div class="box how"><h4>How to <b>solve an equation with a square root</b></h4><ol>
<li>Isolate the square root: move everything else to the other side.</li>
<li>If the root equals a negative number, stop. There is no solution.</li>
<li>Square both sides. If there is still a root, repeat steps 1 and 3.</li>
<li>Solve the equation that is left.</li>
<li>Check every answer in the <em>original</em> equation.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Solve \(\sqrt{x - 3} + 4 = 9\).</p><table class="st">
<tr><td>Isolate the root: subtract 4 from both sides.</td><td>\(\sqrt{x - 3} = 5\)</td></tr>
<tr><td>Square both sides.</td><td>\(x - 3 = 25\)</td></tr>
<tr><td>Solve.</td><td>\(x = 28\)</td></tr>
<tr><td>Check in the original equation.</td><td>\(\sqrt{25} + 4 = 5 + 4 = 9\) ✓</td></tr></table></div>
<h3>A root on each side</h3>
<p>If each side is a single square root, both are already isolated. Squaring removes both roots at once: \(\sqrt{3x - 8} = \sqrt{x}\) becomes \(3x - 8 = x\), so \(2x = 8\) and \(x = 4\). Check: \(\sqrt{4} = \sqrt{4}\) ✓.</p>
<h3>When a root equals a negative number</h3>
<div class="box rule"><h4>Property <b>A square root is never negative</b></h4><p>The symbol \(\sqrt{\ }\) always means the <em>principal</em> (0 or positive) root: \(\sqrt{25} = 5\), not \(-5\). So an equation like \(\sqrt{2x + 1} = -3\) has <strong>no solution</strong>. Type <code>no solution</code> for it.</p></div>
<p>If you square \(\sqrt{2x + 1} = -3\) anyway, you get \(2x + 1 = 9\) and \(x = 4\). But \(\sqrt{9} = 3\), not \(-3\). An answer like this, produced by the algebra but false in the original equation, is called <strong>extraneous</strong>. Squaring can create them, which is why the check is required.</p>
<div class="box warn"><h4>Watch out</h4><p>Isolate the root <em>before</em> squaring. Squaring \(\sqrt{x - 3} + 4\) does not give \(\left(x - 3\right) + 16\), because \(\left(a + b\right)^{2} \ne a^{2} + b^{2}\).</p></div>`,
    variants: {
      nosol: {
        name: 'Radical equals a negative',
        gen(rng) {
          const a = rng.int(2, 9), b = rng.int(1, 9), c = rng.int(1, 9), v = rng.pick(['t', 'x']);
          return {
            prompt: T`Solve for \(${v}\): \(\sqrt{${a}${v} + ${b}} = -${c}\)`,
            parts: [{ kind: 'num', var: v, answer: 'nosol', show: '\\text{no solution}', points: 3, verify: MX.V.solves(`√(${a}${v}+${b})=-${c}`, { v }) }],
            solution: [
              T`A principal square root is never negative, so \(\sqrt{${a}${v} + ${b}}\) can't equal \(-${c}\).`,
              T`(Squaring anyway gives \(${a}${v} + ${b} = ${c * c}\), \(${v} = ${new Q(c * c - b, a).tex()}\), but checking it gives \(\sqrt{${c * c}} = ${c} \ne -${c}\).)`,
              T`\(${H.box('\\text{no solution}')}\)`,
            ],
          };
        },
      },
      lin: {
        name: 'Square both sides',
        gen(rng) {
          const a = rng.int(2, 7), b = rng.int(1, 12), c = rng.int(2, 7), v = rng.pick(['t', 'x', 'y']);
          const ans = new Q(c * c + b, a);
          return {
            prompt: T`Solve: \(\sqrt{${a}${v} - ${b}} = ${c}\)`,
            parts: [{ kind: 'num', frac: true, var: v, answer: ans.str(), show: T`${v} = ${ans.tex()}`, points: 2, verify: MX.V.solves(`√(${a}${v}-${b})=${c}`, { v }) }],
            solution: [
              T`Square both sides: \(${a}${v} - ${b} = ${c * c}\)`,
              T`\(${a}${v} = ${c * c + b}\), so \(${v} = ${ans.tex()}\)`,
              T`Check: \(\sqrt{${c * c}} = ${c}\) ✓. \(${H.box(T`${v} = ${ans.tex()}`)}\)`,
            ],
          };
        },
      },
      both: {
        name: 'Radicals on both sides',
        gen(rng) {
          let a, b; do { a = rng.int(2, 7); b = rng.int(1, 11); } while (new Q(b, a - 1).isInt() && rng.chance(0.6));
          const ans = new Q(b, a - 1);
          return {
            prompt: T`Solve for \(x\): \(\sqrt{${a}x - ${b}} = \sqrt{x}\). Write your answer as a simplified fraction.`,
            parts: [{ kind: 'num', frac: true, var: 'x', answer: ans.str(), show: T`x = ${ans.tex()}`, points: 3, verify: MX.V.solves(`√(${a}x-${b})=√(x)`) }],
            solution: [
              T`Square both sides: \(${a}x - ${b} = x\)`,
              T`\(${a - 1}x = ${b}\), so \(x = ${ans.tex()}\)`,
              T`Check: both sides equal \(\sqrt{${ans.tex()}}\) ✓. \(${H.box(T`x = ${ans.tex()}`)}\)`,
            ],
          };
        },
      },
      shift: {
        name: 'Isolate the radical first',
        gen(rng) {
          const a = rng.nz(-9, 9), b = rng.int(1, 9), k = rng.int(2, 8);
          const c = b + k, ans = k * k - a;
          return {
            prompt: T`Solve: \(\sqrt{x ${MX.sgnTerm(a)}} + ${b} = ${c}\)`,
            parts: [{ kind: 'num', var: 'x', answer: String(ans), show: T`x = ${ans}`, points: 3, verify: MX.V.solves(`√(x+(${a}))+${b}=${c}`) }],
            solution: [
              T`Isolate the radical: \(\sqrt{x ${MX.sgnTerm(a)}} = ${k}\)`,
              T`Square: \(x ${MX.sgnTerm(a)} = ${k * k}\), so \(x = ${ans}\)`,
              T`Check: \(\sqrt{${k * k}} + ${b} = ${c}\) ✓. \(${H.box('x = ' + ans)}\)`,
            ],
          };
        },
      },
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);

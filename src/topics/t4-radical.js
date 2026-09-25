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
    lesson: T`<p>\(\sqrt{ab} = \sqrt{a}\sqrt{b}\), so pull out every perfect-square factor.</p>
<ol><li>Split the number into (largest perfect square) \(\times\) (what's left): \(50 = 25 \cdot 2\).</li>
<li>For each variable, use the largest even exponent: \(t^{13} = t^{12}\cdot t\), and \(\sqrt{t^{12}} = t^{6}\) (half the exponent).</li>
<li>Everything that is a perfect square comes out; the rest stays inside.</li></ol>
\[\sqrt{50t^{13}} = \sqrt{25t^{12}}\cdot\sqrt{2t} = 5t^{6}\sqrt{2t}\]
<p>Type radicals as <code>√(2t)</code> or <code>sqrt(2t)</code>; for example <code>5t^6√(2t)</code>.</p>`,
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
            parts: [{ kind: 'expr', form: 'radical', vars: [v], answer: outA + '√(' + inT + ')', show: outT + '\\sqrt{' + inT + '}', points: 3 }],
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
            parts: [{ kind: 'expr', form: 'radical', vars: ['x', 'y'], answer: outA + '√(' + f + 'y)', show: outT + '\\sqrt{' + f + 'y}', points: 3 }],
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
    lesson: T`<p>Only <em>like radicals</em> (same number under the root) can be combined, the same way \(5x - 6x = -x\):</p>
\[5\sqrt{7} - 6\sqrt{7} = -\sqrt{7}\]
<p>So simplify each radical first; different-looking radicals often turn out to be alike: \(\sqrt{175} = 5\sqrt{7}\) and \(\sqrt{252} = 6\sqrt{7}\).</p>
<p class="warn">\(\sqrt{a} + \sqrt{b} \ne \sqrt{a + b}\).</p>`,
    variants: {
      two: {
        name: 'Two radicals',
        gen(rng) {
          const f = rng.pick(SQF.slice(0, 7));
          let a, b; do { a = rng.int(2, 8); b = rng.int(2, 8); } while (a === b);
          const sg = rng.sign(), r = a + sg * b;
          return {
            prompt: T`${sg < 0 ? 'Subtract' : 'Add'}: \(\sqrt{${a * a * f}} ${sg < 0 ? '-' : '+'} \sqrt{${b * b * f}}\)`,
            parts: [{ kind: 'expr', form: 'radical', vars: [], answer: rootAsc(r, f), show: rootTex(r, f), points: 3 }],
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
            parts: [{ kind: 'expr', form: 'radical', vars: [], answer: rootAsc(r, f), show: rootTex(r, f), points: 3 }],
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
      parts: [{ kind: 'radpm', answers: [b1, b2], answer: whole ? a1 + '±' + num('', s1) : '(' + a1 + '±' + num('', s1) + ')/' + d1, show: ansT, points: 3 }],
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
    lesson: T`<p>This is the last step of the quadratic formula.</p>
<ol><li>Simplify the radical: \(\sqrt{90} = 3\sqrt{10}\).</li>
<li>Find a number that divides <em>every</em> term: the number in front, the coefficient of the radical, and the denominator.</li>
<li>Divide all three by it: \(\dfrac{-6 \pm 3\sqrt{10}}{9} = \dfrac{-2 \pm \sqrt{10}}{3}\).</li></ol>
<p class="warn">You can't cancel just one term with the denominator. \(\frac{-6 \pm \sqrt{10}}{9}\) doesn't reduce.</p>
<p>Type the ± as <code>+-</code>, for example <code>(-2+-√10)/3</code>.</p>`,
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
      parts: [{ kind: 'expr', form: 'noradical', vars: [v], answer: `${v}^(${e.str()})`, show: T`${v}^{${e.tex()}}`, points: 2 }],
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
    lesson: T`<p>A root is a fractional exponent:</p>
\[\sqrt[n]{x^{m}} = \left(\sqrt[n]{x}\right)^{m} = x^{\frac{m}{n}}\]
<p>The index of the root becomes the denominator; the power becomes the numerator. \(\sqrt[8]{D^{3}} = D^{\frac{3}{8}}\). A plain square root has index 2: \(\sqrt{x^{5}} = x^{\frac{5}{2}}\).</p>
<p>Type the exponent in parentheses: <code>D^(3/8)</code>. Reduce the fraction if you can.</p>`,
    variants: {
      root: { name: 'nth root of a power', gen: (rng) => ratExp(rng, 'root') },
      power: { name: 'Power of an nth root', gen: (rng) => ratExp(rng, 'power') },
      sqrt: { name: 'Square root', gen: (rng) => ratExp(rng, 'sqrt') },
    },
  });

  MX.register({
    id: 'rad-equation', section: SEC, title: 'Radical equations', kind: 'skill',
    sources: ['Exam 1 #13', 'Exam 2 #13', 'Exam 3 #8'],
    lesson: T`<p>Get the radical alone on one side, then square both sides.</p>
<ol><li>Isolate the square root.</li><li>If it equals a <em>negative</em> number, stop: a square root is never negative, so there is <strong>no solution</strong>.</li>
<li>Square both sides and solve.</li><li>Check every answer in the original equation; squaring can create answers that don't work.</li></ol>
<p>Type <code>no solution</code> when there isn't one.</p>`,
    variants: {
      nosol: {
        name: 'Radical equals a negative',
        gen(rng) {
          const a = rng.int(2, 9), b = rng.int(1, 9), c = rng.int(1, 9), v = rng.pick(['t', 'x']);
          return {
            prompt: T`Solve for \(${v}\): \(\sqrt{${a}${v} + ${b}} = -${c}\)`,
            parts: [{ kind: 'num', var: v, answer: 'nosol', show: '\\text{no solution}', points: 3 }],
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
            parts: [{ kind: 'num', frac: true, var: v, answer: ans.str(), show: T`${v} = ${ans.tex()}`, points: 2 }],
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
            parts: [{ kind: 'num', frac: true, var: 'x', answer: ans.str(), show: T`x = ${ans.tex()}`, points: 3 }],
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
            parts: [{ kind: 'num', var: 'x', answer: String(ans), show: T`x = ${ans}`, points: 3 }],
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

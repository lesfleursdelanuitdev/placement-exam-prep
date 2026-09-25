/* Factoring */
(function (G) {
  'use strict';
  const MX = G.MX;
  const { T, H, poly } = MX;
  const SEC = 'Factoring';
  const binom = (p, q, v) => poly([[p, { [v]: 1 }], [q, {}]]);

  MX.register({
    id: 'factor-trinomial', section: SEC, title: 'Factoring trinomials', kind: 'skill',
    sources: ['Exam 1 #11a', 'Exam 2 #11', 'Exam 3 #12'],
    lesson: T`<p>Always start by pulling out the greatest common factor (GCF). Then factor what is left.</p>
<p><strong>When the leading coefficient is 1</strong>, \(x^{2} + bx + c\): find two numbers that multiply to \(c\) and add to \(b\).</p>
<p><strong>When it isn't</strong>, \(ax^{2} + bx + c\) (the AC method):</p>
<ol><li>Multiply \(a \cdot c\).</li><li>Find two numbers that multiply to \(ac\) and add to \(b\).</li>
<li>Split the middle term into those two pieces.</li><li>Factor by grouping.</li></ol>
<p>Check by multiplying your factors back out.</p>
<p class="warn">"Factor completely" means no factor can be factored further, including a GCF hiding inside a binomial like \(3x + 9\).</p>`,
    variants: {
      ac: {
        name: 'Leading coefficient not 1',
        gen(rng) {
          const v = rng.pick(['x', 'r', 'y', 'n']);
          let p, q, r, s;
          do {
            p = rng.int(1, 5); r = rng.int(1, 4); q = rng.nz(-7, 7); s = rng.nz(-7, 7);
          } while (p * r === 1 || MX.gcd(p, q) !== 1 || MX.gcd(r, s) !== 1 || p * s + q * r === 0 || (p === r && q === s));
          const a = p * r, b = p * s + q * r, c = q * s;
          const Tri = MX.quad(a, b, c, v), F1 = binom(p, q, v), F2 = binom(r, s, v);
          const ans = '(' + F1.asc + ')(' + F2.asc + ')';
          const m = p * s, n = q * r;
          return {
            prompt: T`Factor completely: \(${Tri.tex}\)`,
            parts: [{ kind: 'factor', answer: ans, factors: [F1.asc, F2.asc], show: T`\left(${F1.tex}\right)\left(${F2.tex}\right)`, points: 3 }],
            solution: [
              T`There is no common factor. Multiply \(a \cdot c = ${a} \cdot ${MX.par(c)} = ${a * c}\).`,
              T`Two numbers that multiply to \(${a * c}\) and add to \(${b}\): \(${m}\) and \(${n}\).`,
              T`Split the middle term: \(${poly([[a, { [v]: 2 }], [m, { [v]: 1 }], [n, { [v]: 1 }], [c, {}]]).tex}\)`,
              T`Group: \(${MX.coef(p)}${v}\left(${F2.tex}\right) ${MX.sgnTerm(q)}\left(${F2.tex}\right)\)`,
              T`\(${H.box(T`\left(${F1.tex}\right)\left(${F2.tex}\right)`)}\)`,
            ],
          };
        },
      },
      gcf: {
        name: 'GCF first',
        gen(rng) {
          const v = rng.pick(['x', 'x', 'a', 'y']);
          const g = rng.int(2, 5);
          let q, s;
          do { q = rng.nz(-8, 8); s = rng.nz(-8, 8); } while (q + s === 0 || q === s);
          const Tri = MX.quad(g, g * (q + s), g * q * s, v), In = MX.quad(1, q + s, q * s, v);
          const F1 = binom(1, q, v), F2 = binom(1, s, v);
          return {
            prompt: T`Factor completely: \(${Tri.tex}\)`,
            parts: [{ kind: 'factor', answer: g + '(' + F1.asc + ')(' + F2.asc + ')', factors: [String(g), F1.asc, F2.asc], show: T`${g}\left(${F1.tex}\right)\left(${F2.tex}\right)`, points: 3 }],
            solution: [
              T`Every term is divisible by ${g}: \(${g}\left(${In.tex}\right)\)`,
              T`Two numbers that multiply to \(${q * s}\) and add to \(${q + s}\): \(${q}\) and \(${s}\).`,
              T`\(${H.box(T`${g}\left(${F1.tex}\right)\left(${F2.tex}\right)`)}\)`,
            ],
          };
        },
      },
      gcfx: {
        name: 'GCF with a variable',
        gen(rng) {
          const v = rng.pick(['x', 'y', 't']);
          const g = rng.int(1, 4);
          let q, s;
          do { q = rng.nz(-7, 7); s = rng.nz(-7, 7); } while (q + s === 0 || q === s);
          const Tri = poly([[g, { [v]: 3 }], [g * (q + s), { [v]: 2 }], [g * q * s, { [v]: 1 }]]);
          const In = MX.quad(1, q + s, q * s, v);
          const F1 = binom(1, q, v), F2 = binom(1, s, v);
          const lead = (g === 1 ? '' : g) + v;
          return {
            prompt: T`Factor completely: \(${Tri.tex}\)`,
            parts: [{ kind: 'factor', answer: lead + '(' + F1.asc + ')(' + F2.asc + ')', factors: [String(g), v, F1.asc, F2.asc], show: T`${lead}\left(${F1.tex}\right)\left(${F2.tex}\right)`, points: 3 }],
            solution: [
              T`The GCF is \(${lead}\): \(${lead}\left(${In.tex}\right)\)`,
              T`Two numbers that multiply to \(${q * s}\) and add to \(${q + s}\): \(${q}\) and \(${s}\).`,
              T`\(${H.box(T`${lead}\left(${F1.tex}\right)\left(${F2.tex}\right)`)}\)`,
            ],
          };
        },
      },
    },
  });

  MX.register({
    id: 'factor-grouping', section: SEC, title: 'Factoring by grouping', kind: 'skill',
    sources: ['Exam 1 #11b', 'Exam 3 #13'],
    lesson: T`<p>Four terms usually means grouping:</p>
<ol><li>Pair the terms: (first two) + (last two).</li><li>Factor the GCF out of each pair. If it works, both pairs leave the <em>same</em> binomial.</li>
<li>Factor that common binomial out: \(b(a + 5) + 2(a + 5) = (a + 5)(b + 2)\).</li></ol>
<p>If the second pair starts with a minus, factor out a negative so the binomials match. If the binomials don't match, try reordering the middle two terms.</p>
<p class="warn">Check whether a factor can still be factored (for example \(x^{2} - 4\)).</p>`,
    variants: {
      basic: {
        name: 'Two variables',
        gen(rng) {
          const [u, w] = rng.pick([['a', 'b'], ['x', 'y'], ['m', 'n']]);
          const p = rng.nz(-9, 9), q = rng.nz(-9, 9);
          const E = poly([[1, { [u]: 1, [w]: 1 }], [p, { [w]: 1 }], [q, { [u]: 1 }], [p * q, {}]], [u, w]);
          const F1 = binom(1, p, u), F2 = binom(1, q, w);
          return {
            prompt: T`Factor completely: \(${E.tex}\)`,
            parts: [{ kind: 'factor', answer: '(' + F1.asc + ')(' + F2.asc + ')', factors: [F1.asc, F2.asc], show: T`\left(${F1.tex}\right)\left(${F2.tex}\right)`, points: 2 }],
            solution: [
              T`Group the first two and last two terms: \(\left(${u}${w} ${MX.sgnTerm(p)}${w}\right) + \left(${poly([[q, { [u]: 1 }], [p * q, {}]]).tex}\right)\)`,
              T`Factor each group: \(${w}\left(${F1.tex}\right) ${MX.sgnTerm(q)}\left(${F1.tex}\right)\)`,
              T`\(${H.box(T`\left(${F1.tex}\right)\left(${F2.tex}\right)`)}\)`,
            ],
          };
        },
      },
      coef: {
        name: 'With coefficients',
        gen(rng) {
          let a, b, c, d;
          do { a = rng.int(1, 5); b = rng.int(1, 5); c = rng.int(1, 4); d = rng.int(1, 9); } while (MX.gcd(a, b) !== 1 || MX.gcd(c, d) !== 1 || a * b * c === 1);
          const sd = rng.sign() * d;
          const E = poly([[a * c, { x: 2, y: 1 }], [b * c, { x: 1, y: 2 }], [-a * sd, { x: 1 }], [-b * sd, { y: 1 }]], ['x', 'y']);
          const F1 = poly([[a, { x: 1 }], [b, { y: 1 }]], ['x', 'y']);
          const F2 = poly([[c, { x: 1, y: 1 }], [-sd, {}]], ['x', 'y']);
          const g1 = (c === 1 ? '' : c) + 'xy';
          return {
            prompt: T`Factor completely: \(${E.tex}\)`,
            parts: [{ kind: 'factor', answer: '(' + F1.asc + ')(' + F2.asc + ')', factors: [F1.asc, F2.asc], show: T`\left(${F1.tex}\right)\left(${F2.tex}\right)`, points: 3 }],
            solution: [
              T`Group: \(\left(${poly([[a * c, { x: 2, y: 1 }], [b * c, { x: 1, y: 2 }]], ['x', 'y']).tex}\right) + \left(${poly([[-a * sd, { x: 1 }], [-b * sd, { y: 1 }]], ['x', 'y']).tex}\right)\)`,
              T`Factor \(${g1}\) from the first group and \(${-sd}\) from the second: \(${g1}\left(${F1.tex}\right) ${MX.sgnTerm(-sd)}\left(${F1.tex}\right)\)`,
              T`\(${H.box(T`\left(${F1.tex}\right)\left(${F2.tex}\right)`)}\)`,
            ],
          };
        },
      },
      cubic: {
        name: 'Cubic, then difference of squares',
        gen(rng) {
          let a, b;
          do { a = rng.nz(-6, 6); b = rng.int(1, 5); } while (Math.abs(a) === b);
          const E = poly([[1, { x: 3 }], [a, { x: 2 }], [-b * b, { x: 1 }], [-a * b * b, {}]]);
          const F1 = binom(1, a, 'x');
          return {
            prompt: T`Factor completely: \(${E.tex}\)`,
            parts: [{ kind: 'factor', answer: '(x' + (a < 0 ? a : '+' + a) + ')(x-' + b + ')(x+' + b + ')', factors: [F1.asc, 'x-' + b, 'x+' + b], show: T`\left(${F1.tex}\right)\left(x - ${b}\right)\left(x + ${b}\right)`, points: 3 }],
            solution: [
              T`Group: \(x^{2}\left(${F1.tex}\right) - ${b * b}\left(${F1.tex}\right) = \left(${F1.tex}\right)\left(x^{2} - ${b * b}\right)\)`,
              T`\(x^{2} - ${b * b}\) is a difference of squares: \(\left(x - ${b}\right)\left(x + ${b}\right)\)`,
              T`\(${H.box(T`\left(${F1.tex}\right)\left(x - ${b}\right)\left(x + ${b}\right)`)}\)`,
            ],
          };
        },
      },
    },
  });

  MX.register({
    id: 'factor-dos', section: SEC, title: 'Difference of squares', kind: 'skill',
    sources: ['Exam 2 #12'],
    lesson: T`<p>\[A^{2} - B^{2} = (A - B)(A + B)\]</p>
<p>Recognize each term as a perfect square: \(9x^{2} = (3x)^{2}\) and \(4y^{4} = (2y^{2})^{2}\). Then write the two factors.</p>
<ul><li>Take out a GCF first if there is one: \(2x^{2} - 50 = 2(x^{2} - 25)\).</li>
<li>A <em>sum</em> of squares like \(x^{2} + 4\) does not factor.</li>
<li>Keep going if a factor is still a difference of squares: \(x^{4} - 16 = (x^{2} + 4)(x - 2)(x + 2)\).</li></ul>`,
    variants: {
      basic: {
        name: 'Two variables',
        gen(rng) {
          let a, b;
          do { a = rng.int(1, 9); b = rng.int(1, 9); } while (MX.gcd(a, b) !== 1 || a * b === 1);
          const k = rng.pick([1, 2]);
          const E = poly([[a * a, { x: 2 }], [-b * b, { y: 2 * k }]], ['x', 'y']);
          const Aa = MX.mono({ x: 1 }).tex, Bt = poly([[b, { y: k }]]);
          const F1 = poly([[a, { x: 1 }], [-b, { y: k }]], ['x', 'y']), F2 = poly([[a, { x: 1 }], [b, { y: k }]], ['x', 'y']);
          return {
            prompt: T`Factor completely: \(${E.tex}\)`,
            parts: [{ kind: 'factor', answer: '(' + F1.asc + ')(' + F2.asc + ')', factors: [F1.asc, F2.asc], show: T`\left(${F1.tex}\right)\left(${F2.tex}\right)`, points: 3 }],
            solution: [
              T`Both terms are perfect squares: \(${a * a === 1 ? '' : a * a}x^{2} = \left(${MX.coef(a)}${Aa}\right)^{2}\) and \(${b * b === 1 ? '' : b * b}y^{${2 * k}} = \left(${Bt.tex}\right)^{2}\)`,
              T`Use \(A^{2} - B^{2} = (A - B)(A + B)\).`,
              T`\(${H.box(T`\left(${F1.tex}\right)\left(${F2.tex}\right)`)}\)`,
            ],
          };
        },
      },
      gcf: {
        name: 'GCF first',
        gen(rng) {
          const g = rng.int(2, 7), c = rng.int(2, 9), v = rng.pick(['x', 'n', 'p']);
          const E = poly([[g, { [v]: 2 }], [-g * c * c, {}]]);
          return {
            prompt: T`Factor completely: \(${E.tex}\)`,
            parts: [{ kind: 'factor', answer: g + '(' + v + '-' + c + ')(' + v + '+' + c + ')', factors: [String(g), v + '-' + c, v + '+' + c], show: T`${g}\left(${v} - ${c}\right)\left(${v} + ${c}\right)`, points: 3 }],
            solution: [
              T`Factor out the GCF ${g}: \(${g}\left(${v}^{2} - ${c * c}\right)\)`,
              T`\(${v}^{2} - ${c * c} = \left(${v} - ${c}\right)\left(${v} + ${c}\right)\)`,
              T`\(${H.box(T`${g}\left(${v} - ${c}\right)\left(${v} + ${c}\right)`)}\)`,
            ],
          };
        },
      },
      fourth: {
        name: 'Factor twice',
        gen(rng) {
          const c = rng.int(1, 3), v = rng.pick(['x', 'y', 'm']);
          const E = poly([[1, { [v]: 4 }], [-Math.pow(c, 4), {}]]);
          return {
            prompt: T`Factor completely: \(${E.tex}\)`,
            parts: [{ kind: 'factor', answer: `(${v}^2+${c * c})(${v}-${c})(${v}+${c})`, factors: [`${v}^2+${c * c}`, `${v}-${c}`, `${v}+${c}`], show: T`\left(${v}^{2} + ${c * c}\right)\left(${v} - ${c}\right)\left(${v} + ${c}\right)`, points: 3 }],
            solution: [
              T`\(${v}^{4} = \left(${v}^{2}\right)^{2}\) and \(${Math.pow(c, 4)} = ${c * c}^{2}\), so \(${E.tex} = \left(${v}^{2} - ${c * c}\right)\left(${v}^{2} + ${c * c}\right)\)`,
              T`\(${v}^{2} - ${c * c}\) is again a difference of squares; \(${v}^{2} + ${c * c}\) is a sum and does not factor.`,
              T`\(${H.box(T`\left(${v}^{2} + ${c * c}\right)\left(${v} - ${c}\right)\left(${v} + ${c}\right)`)}\)`,
            ],
          };
        },
      },
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);

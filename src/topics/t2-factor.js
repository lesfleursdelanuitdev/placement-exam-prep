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
    lesson: T`<p>Factoring undoes multiplication. When you multiply \((x + 3)(x + 4)\) you get the trinomial \(x^{2} + 7x + 12\). Factoring goes the other way: you start with the trinomial and find the two binomials that multiply to give it.</p>
<div class="box def"><h4>Definition <b>Trinomial</b></h4><p>A <strong>trinomial</strong> is a polynomial with three terms, such as \(x^{2} + 7x + 12\). In \(ax^{2} + bx + c\), the number \(a\) is the <strong>leading coefficient</strong> and \(c\) is the <strong>constant term</strong>.</p></div>
<h3>Always look for a common factor first</h3>
<p>Before anything else, check whether every term shares a factor. If it does, factor it out. The trinomial that is left has smaller numbers and is easier to work with.</p>
<div class="box rule"><h4>Rule <b>Factor out the GCF first</b></h4><p>\(4x^{2} - 28x + 24 = 4\left(x^{2} - 7x + 6\right)\). Now factor only what is inside the parentheses, and keep the 4 in front.</p></div>
<h3>When the leading coefficient is 1</h3>
<p>For \(x^{2} + bx + c\), you need two numbers that <strong>multiply to \(c\)</strong> and <strong>add to \(b\)</strong>. Those two numbers go into the binomials.</p>
<div class="ex"><h4>Example</h4><p>Factor \(x^{2} + 7x + 12\).</p><table class="st">
<tr><td>We need two numbers that multiply to 12 and add to 7.</td><td>\(1 \cdot 12,\ 2 \cdot 6,\ 3 \cdot 4\)</td></tr>
<tr><td>Only 3 and 4 add to 7.</td><td>\(3 + 4 = 7\)</td></tr>
<tr><td>Write the factors.</td><td>\(\left(x + 3\right)\left(x + 4\right)\)</td></tr>
<tr><td>Check by multiplying.</td><td>\(x^{2} + 4x + 3x + 12 = x^{2} + 7x + 12\) ✓</td></tr></table></div>
<p>Signs help you search. If \(c\) is positive, both numbers have the same sign as \(b\). If \(c\) is negative, the numbers have opposite signs.</p>
<h3>When the leading coefficient is not 1</h3>
<p>For \(ax^{2} + bx + c\) with \(a \ne 1\), use the <em>ac method</em>. It turns the problem into one you can factor by grouping.</p>
<div class="box how"><h4>How to <b>factor \(ax^{2} + bx + c\) with the ac method</b></h4><ol>
<li>Factor out the GCF, if there is one.</li>
<li>Multiply \(a \cdot c\).</li>
<li>Find two numbers that multiply to \(ac\) and add to \(b\).</li>
<li>Split the middle term \(bx\) into two terms using those numbers.</li>
<li>Factor by grouping: take the GCF of the first two terms and of the last two terms.</li>
<li>Check by multiplying the factors.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Factor \(6x^{2} + 7x - 3\).</p><table class="st">
<tr><td>Multiply \(a \cdot c\).</td><td>\(6 \cdot (-3) = -18\)</td></tr>
<tr><td>Find two numbers that multiply to \(-18\) and add to 7.</td><td>\(9\) and \(-2\)</td></tr>
<tr><td>Split the middle term.</td><td>\(6x^{2} + 9x - 2x - 3\)</td></tr>
<tr><td>Group and factor each pair.</td><td>\(3x\left(2x + 3\right) - 1\left(2x + 3\right)\)</td></tr>
<tr><td>Factor out the common binomial.</td><td>\(\left(3x - 1\right)\left(2x + 3\right)\)</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>"Factor completely" means no factor can be factored any further. A common factor can hide inside a binomial: \(\left(3x + 9\right)\) is not finished, because it equals \(3\left(x + 3\right)\).</p></div>`,

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
            parts: [{ kind: 'factor', answer: ans, factors: [F1.asc, F2.asc], show: T`\left(${F1.tex}\right)\left(${F2.tex}\right)`, points: 3, verify: MX.V.equiv(Tri.asc) }],
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
            parts: [{ kind: 'factor', answer: g + '(' + F1.asc + ')(' + F2.asc + ')', factors: [String(g), F1.asc, F2.asc], show: T`${g}\left(${F1.tex}\right)\left(${F2.tex}\right)`, points: 3, verify: MX.V.equiv(Tri.asc) }],
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
            parts: [{ kind: 'factor', answer: lead + '(' + F1.asc + ')(' + F2.asc + ')', factors: [String(g), v, F1.asc, F2.asc], show: T`${lead}\left(${F1.tex}\right)\left(${F2.tex}\right)`, points: 3, verify: MX.V.equiv(Tri.asc) }],
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
            parts: [{ kind: 'factor', answer: '(' + F1.asc + ')(' + F2.asc + ')', factors: [F1.asc, F2.asc], show: T`\left(${F1.tex}\right)\left(${F2.tex}\right)`, points: 2, verify: MX.V.equiv(E.asc) }],
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
            parts: [{ kind: 'factor', answer: '(' + F1.asc + ')(' + F2.asc + ')', factors: [F1.asc, F2.asc], show: T`\left(${F1.tex}\right)\left(${F2.tex}\right)`, points: 3, verify: MX.V.equiv(E.asc) }],
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
            parts: [{ kind: 'factor', answer: '(x' + (a < 0 ? a : '+' + a) + ')(x-' + b + ')(x+' + b + ')', factors: [F1.asc, 'x-' + b, 'x+' + b], show: T`\left(${F1.tex}\right)\left(x - ${b}\right)\left(x + ${b}\right)`, points: 3, verify: MX.V.equiv(E.asc) }],
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

  // ---------- sum and difference of cubes ----------
  // g * v^gx * ((a v)^3 + sign (b w)^3), w = second variable or null
  function cubes(sign, a, b, v, w, g, gx) {
    const ord = w ? [v, w] : [v];
    const Wv = (e) => (w ? { [w]: e } : {});
    const inner = poly([[a * a * a, { [v]: 3 }], [sign * b * b * b, Wv(3)]], ord);
    const full = poly([[g * a * a * a, { [v]: 3 + gx }], [g * sign * b * b * b, Object.assign(Wv(3), gx ? { [v]: gx } : {})]], ord);
    const F1 = poly([[a, { [v]: 1 }], [sign * b, Wv(1)]], ord);
    const F2 = poly([[a * a, { [v]: 2 }], [-sign * a * b, Object.assign({ [v]: 1 }, Wv(1))], [b * b, Wv(2)]], ord);
    const At = poly([[a, { [v]: 1 }]]).tex, Bt = poly([[b, Wv(1)]]).tex;
    const pre = (g === 1 ? '' : String(g)) + (gx ? v + (gx > 1 ? '^' + gx : '') : '');
    const preT = (g === 1 ? '' : String(g)) + (gx ? v + (gx > 1 ? '^{' + gx + '}' : '') : '');
    const facs = [];
    if (g > 1) facs.push(String(g));
    for (let k = 0; k < gx; k++) facs.push(v);
    facs.push(F1.asc, F2.asc);
    const ansT = T`${preT}\left(${F1.tex}\right)\left(${F2.tex}\right)`;
    const sg = sign > 0 ? '+' : '-', og = sign > 0 ? '-' : '+';
    const steps = [];
    if (pre) steps.push(T`Take out the GCF first: \(${full.tex} = ${preT}\left(${inner.tex}\right)\)`);
    steps.push(T`Both terms are perfect cubes: \(${poly([[a * a * a, { [v]: 3 }]]).tex} = \left(${At}\right)^{3}\) and \(${poly([[b * b * b, Wv(3)]]).tex} = \left(${Bt}\right)^{3}\)`);
    steps.push(T`Use \(A^{3} ${sg} B^{3} = \left(A ${sg} B\right)\left(A^{2} ${og} AB + B^{2}\right)\) with \(A = ${At}\), \(B = ${Bt}\) (signs: same, opposite, always positive).`);
    steps.push(T`\(A^{2} = ${poly([[a * a, { [v]: 2 }]]).tex}\), \(AB = ${poly([[a * b, Object.assign({ [v]: 1 }, Wv(1))]], ord).tex}\), \(B^{2} = ${poly([[b * b, Wv(2)]]).tex}\)`);
    steps.push(T`\(${H.box(ansT)}\) (the quadratic factor doesn’t factor any further)`);
    return {
      prompt: T`Factor completely: \(${full.tex}\)`,
      parts: [{ kind: 'factor', answer: pre + '(' + F1.asc + ')(' + F2.asc + ')', factors: facs, show: ansT, points: 3, verify: MX.V.equiv(full.asc) }],
      solution: steps,
    };
  }
  const cubeVar = (rng) => rng.pick(['x', 'x', 'y', 'a', 'm', 't']);
  function perfectSquare(rng, withGcf) {
    const v = rng.pick(['x', 'x', 'y', 'n']);
    let a, b;
    do { a = withGcf ? 1 : rng.int(1, 5); b = rng.int(1, 9); } while (MX.gcd(a, b) !== 1 || (a === 1 && b === 1));
    const s = rng.sign(), g = withGcf ? rng.int(2, 5) : 1;
    const E = MX.quad(g * a * a, g * 2 * a * b * s, g * b * b, v), In = MX.quad(a * a, 2 * a * b * s, b * b, v);
    const F = poly([[a, { [v]: 1 }], [s * b, {}]]);
    const pre = g > 1 ? String(g) : '';
    const ansT = T`${pre}\left(${F.tex}\right)^{2}`;
    const steps = [];
    if (g > 1) steps.push(T`Take out the GCF: \(${E.tex} = ${g}\left(${In.tex}\right)\)`);
    steps.push(T`First and last terms are perfect squares: \(${poly([[a * a, { [v]: 2 }]]).tex} = \left(${poly([[a, { [v]: 1 }]]).tex}\right)^{2}\) and \(${b * b} = ${b}^{2}\)`);
    steps.push(T`Middle term check: \(2\cdot${poly([[a, { [v]: 1 }]]).tex}\cdot${b} = ${poly([[2 * a * b, { [v]: 1 }]]).tex}\) ✓, with a ${s < 0 ? 'minus' : 'plus'} sign.`);
    steps.push(T`So it is \(\left(A ${s < 0 ? '-' : '+'} B\right)^{2}\): \(${H.box(ansT)}\)`);
    return {
      prompt: T`Factor completely: \(${E.tex}\)`,
      parts: [{ kind: 'factor', answer: pre + '(' + F.asc + ')^2', factors: (g > 1 ? [String(g)] : []).concat([F.asc, F.asc]), show: ansT, points: 3, verify: MX.V.equiv(E.asc) }],
      solution: steps,
    };
  }
  const SPECIAL_LESSON = T`<p>Four patterns to recognize on sight:</p>
\[a^{2} - b^{2} = \left(a - b\right)\left(a + b\right)\]
\[a^{3} - b^{3} = \left(a - b\right)\left(a^{2} + ab + b^{2}\right)\]
\[a^{3} + b^{3} = \left(a + b\right)\left(a^{2} - ab + b^{2}\right)\]
\[a^{2} \pm 2ab + b^{2} = \left(a \pm b\right)^{2}\]
<p><strong>Perfect squares</strong>: 1, 4, 9, 16, 25, 36, 49, 64, 81, 100 and even powers like \(x^{2}, x^{4}, y^{6}\).<br>
<strong>Perfect cubes</strong>: 1, 8, 27, 64, 125, 216 and powers divisible by 3 like \(x^{3}, x^{6}\).</p>
<p class="key">Cube signs, <strong>SOAP</strong>: the first sign is the <strong>S</strong>ame as the original, the second is the <strong>O</strong>pposite, the last is <strong>A</strong>lways <strong>P</strong>ositive.</p>
<ol><li>Take out any GCF first: \(2x^{3} - 54 = 2\left(x^{3} - 27\right)\).</li><li>Identify \(a\) and \(b\) (what gets squared or cubed).</li><li>Fill in the pattern and simplify.</li><li>Check whether a factor can still be factored: \(x^{4} - 16 = \left(x^{2} + 4\right)\left(x - 2\right)\left(x + 2\right)\).</li></ol>
<p class="warn">A sum of squares like \(x^{2} + 9\) is prime, and the quadratic factor \(a^{2} \pm ab + b^{2}\) from a cube pattern never factors further.</p>`;
  const DOS_POOL = ['dos', 'dosGcf', 'dosTwice'], DOC_POOL = ['doc', 'docGcf', 'docCoef', 'sixth'], SOC_POOL = ['soc', 'socGcf', 'socCoef'];
  MX.register({
    id: 'factor-special', section: SEC, title: 'Special factoring patterns', kind: 'skill',
    sources: ['Exam 2 #12', 'added: sum & difference of cubes, perfect squares'],
    slots: [
      { label: 'Difference of squares', source: 'Exam 2 #12', pool: DOS_POOL },
      { label: 'Difference of squares', source: 'Exam 2 #12', pool: DOS_POOL },
      { label: 'Difference of cubes', source: 'Added', pool: DOC_POOL },
      { label: 'Difference of cubes', source: 'Added', pool: DOC_POOL },
      { label: 'Sum of cubes', source: 'Added', pool: SOC_POOL },
      { label: 'Sum of cubes', source: 'Added', pool: SOC_POOL },
      { label: 'Perfect-square trinomial', source: 'Added', pool: ['pst', 'pstGcf'] },
    ],
    lesson: SPECIAL_LESSON,
    variants: {
      dos: {
        name: 'Difference of squares',
        gen(rng) {
          let a, b;
          do { a = rng.int(1, 9); b = rng.int(1, 9); } while (MX.gcd(a, b) !== 1 || a * b === 1);
          const k = rng.pick([1, 2]);
          const E = poly([[a * a, { x: 2 }], [-b * b, { y: 2 * k }]], ['x', 'y']);
          const Aa = MX.mono({ x: 1 }).tex, Bt = poly([[b, { y: k }]]);
          const F1 = poly([[a, { x: 1 }], [-b, { y: k }]], ['x', 'y']), F2 = poly([[a, { x: 1 }], [b, { y: k }]], ['x', 'y']);
          return {
            prompt: T`Factor completely: \(${E.tex}\)`,
            parts: [{ kind: 'factor', answer: '(' + F1.asc + ')(' + F2.asc + ')', factors: [F1.asc, F2.asc], show: T`\left(${F1.tex}\right)\left(${F2.tex}\right)`, points: 3, verify: MX.V.equiv(E.asc) }],
            solution: [
              T`Both terms are perfect squares: \(${a * a === 1 ? '' : a * a}x^{2} = \left(${MX.coef(a)}${Aa}\right)^{2}\) and \(${b * b === 1 ? '' : b * b}y^{${2 * k}} = \left(${Bt.tex}\right)^{2}\)`,
              T`Use \(A^{2} - B^{2} = (A - B)(A + B)\).`,
              T`\(${H.box(T`\left(${F1.tex}\right)\left(${F2.tex}\right)`)}\)`,
            ],
          };
        },
      },
      dosGcf: {
        name: 'Difference of squares with a GCF',
        gen(rng) {
          const g = rng.int(2, 7), c = rng.int(2, 9), v = rng.pick(['x', 'n', 'p']);
          const E = poly([[g, { [v]: 2 }], [-g * c * c, {}]]);
          return {
            prompt: T`Factor completely: \(${E.tex}\)`,
            parts: [{ kind: 'factor', answer: g + '(' + v + '-' + c + ')(' + v + '+' + c + ')', factors: [String(g), v + '-' + c, v + '+' + c], show: T`${g}\left(${v} - ${c}\right)\left(${v} + ${c}\right)`, points: 3, verify: MX.V.equiv(E.asc) }],
            solution: [
              T`Factor out the GCF ${g}: \(${g}\left(${v}^{2} - ${c * c}\right)\)`,
              T`\(${v}^{2} - ${c * c} = \left(${v} - ${c}\right)\left(${v} + ${c}\right)\)`,
              T`\(${H.box(T`${g}\left(${v} - ${c}\right)\left(${v} + ${c}\right)`)}\)`,
            ],
          };
        },
      },
      dosTwice: {
        name: 'Difference of squares twice',
        gen(rng) {
          const c = rng.int(1, 3), v = rng.pick(['x', 'y', 'm']);
          const E = poly([[1, { [v]: 4 }], [-Math.pow(c, 4), {}]]);
          return {
            prompt: T`Factor completely: \(${E.tex}\)`,
            parts: [{ kind: 'factor', answer: `(${v}^2+${c * c})(${v}-${c})(${v}+${c})`, factors: [`${v}^2+${c * c}`, `${v}-${c}`, `${v}+${c}`], show: T`\left(${v}^{2} + ${c * c}\right)\left(${v} - ${c}\right)\left(${v} + ${c}\right)`, points: 3, verify: MX.V.equiv(E.asc) }],
            solution: [
              T`\(${v}^{4} = \left(${v}^{2}\right)^{2}\) and \(${Math.pow(c, 4)} = ${c * c}^{2}\), so \(${E.tex} = \left(${v}^{2} - ${c * c}\right)\left(${v}^{2} + ${c * c}\right)\)`,
              T`\(${v}^{2} - ${c * c}\) is again a difference of squares; \(${v}^{2} + ${c * c}\) is a sum and does not factor.`,
              T`\(${H.box(T`\left(${v}^{2} + ${c * c}\right)\left(${v} - ${c}\right)\left(${v} + ${c}\right)`)}\)`,
            ],
          };
        },
      },
      doc: {
        name: 'Difference of cubes',
        gen(rng) { let a, b; do { a = rng.int(1, 5); b = rng.int(1, 6); } while (MX.gcd(a, b) !== 1 || a * b === 1); return cubes(-1, a, b, cubeVar(rng), null, 1, 0); },
      },
      docCoef: {
        name: 'Difference of cubes, two variables',
        gen(rng) { let a, b; do { a = rng.int(1, 5); b = rng.int(1, 5); } while (MX.gcd(a, b) !== 1 || a * b === 1); return cubes(-1, a, b, 'x', 'y', 1, 0); },
      },
      docGcf: {
        name: 'Difference of cubes with a GCF',
        gen(rng) { return cubes(-1, 1, rng.int(1, 5), cubeVar(rng), null, rng.int(2, 6), rng.chance(0.35) ? 1 : 0); },
      },
      sixth: {
        name: 'Squares and cubes together',
        gen(rng) {
          const c = rng.pick([1, 2]), v = rng.pick(['x', 'y']);
          const E = poly([[1, { [v]: 6 }], [-Math.pow(c, 6), {}]]);
          const f = [`${v}-${c}`, `${v}+${c}`, `${v}^2+${c}${v}+${c * c}`, `${v}^2-${c}${v}+${c * c}`].map((x) => x.replace(/\+1([a-z])/, '+$1').replace(/-1([a-z])/, '-$1'));
          const ft = [poly([[1, { [v]: 1 }], [-c, {}]]), poly([[1, { [v]: 1 }], [c, {}]]), MX.quad(1, c, c * c, v), MX.quad(1, -c, c * c, v)];
          const ansT = ft.map((x) => T`\left(${x.tex}\right)`).join('');
          return {
            prompt: T`Factor completely: \(${E.tex}\)`,
            parts: [{ kind: 'factor', answer: f.map((x) => '(' + x + ')').join(''), factors: f, show: ansT, points: 3, verify: MX.V.equiv(E.asc) }],
            solution: [
              T`\(${v}^{6} = \left(${v}^{3}\right)^{2}\) and \(${Math.pow(c, 6)} = ${c * c * c}^{2}\): start with a difference of squares, \(\left(${v}^{3} - ${c * c * c}\right)\left(${v}^{3} + ${c * c * c}\right)\).`,
              T`Now each factor is a cube pattern: \(${v}^{3} - ${c * c * c} = ${T`\left(${ft[0].tex}\right)\left(${ft[2].tex}\right)`}\) and \(${v}^{3} + ${c * c * c} = ${T`\left(${ft[1].tex}\right)\left(${ft[3].tex}\right)`}\).`,
              T`\(${H.box(ansT)}\)`,
            ],
          };
        },
      },
      soc: {
        name: 'Sum of cubes',
        gen(rng) { let a, b; do { a = rng.int(1, 5); b = rng.int(1, 6); } while (MX.gcd(a, b) !== 1 || a * b === 1); return cubes(1, a, b, cubeVar(rng), null, 1, 0); },
      },
      socCoef: {
        name: 'Sum of cubes, two variables',
        gen(rng) { let a, b; do { a = rng.int(1, 5); b = rng.int(1, 5); } while (MX.gcd(a, b) !== 1 || a * b === 1); return cubes(1, a, b, 'x', 'y', 1, 0); },
      },
      socGcf: {
        name: 'Sum of cubes with a GCF',
        gen(rng) { return cubes(1, 1, rng.int(1, 5), cubeVar(rng), null, rng.int(2, 6), rng.chance(0.35) ? 1 : 0); },
      },
      pst: { name: 'Perfect-square trinomial', gen: (rng) => perfectSquare(rng, false) },
      pstGcf: { name: 'Perfect-square trinomial with a GCF', gen: (rng) => perfectSquare(rng, true) },
    },
  });

  // ---------- factoring strategy ----------
  // "prime" is right only if the displayed quadratic (read back from its text) has integer content 1
  // and a non-square discriminant, i.e. no factorization over the integers at all
  function primeCheck(src) {
    return MX.V.custom((a) => {
      if (!a || !a.prime) return 'the polynomial is prime';
      const f = MX.V.fn(src, (MX.ast.vars(MX.V.parse(src)).values().next().value));
      const c = f(0), b = (f(1) - f(-1)) / 2, A = (f(1) + f(-1)) / 2 - c;
      for (const t of [2, -3, 5]) if (!MX.V.close(f(t), A * t * t + b * t + c)) return 'not a quadratic';
      if (![A, b, c].every(Number.isInteger) || A === 0) return 'not an integer quadratic';
      if (MX.gcdAll([A, b, c].map(Math.abs).filter((x) => x)) !== 1) return 'there is a common factor ' + MX.gcdAll([A, b, c].map(Math.abs).filter((x) => x));
      const D = b * b - 4 * A * c;
      if (D >= 0 && Math.round(Math.sqrt(D)) ** 2 === D) return 'it factors: the discriminant ' + D + ' is a perfect square';
      return true;
    });
  }
  function primePoly(rng) {
    const v = rng.pick(['x', 'y', 'n']);
    if (rng.chance(0.4)) {
      const a0 = rng.pick([1, 1, 4, 9]), c = rng.int(1, 9);
      const a = MX.gcd(a0, c) === 1 ? a0 : 1; // 4x^2 + 16 = 4(x^2 + 4) has a GCF, so it is not prime

      const E = poly([[a, { [v]: 2 }], [c * c, {}]]);
      return { E, why: [T`Two terms added together: \(${E.tex}\) is a <em>sum</em> of squares.`, T`A sum of squares has no real factors, and there is no common factor to take out.`] };
    }
    let b, c;
    do { b = rng.nz(-9, 9); c = rng.nz(-15, 15); } while (MX.isPerfectSquare(b * b - 4 * c));
    const E = MX.quad(1, b, c, v);
    const pairs = [];
    for (let k = 1; k <= Math.abs(c); k++) if (Math.abs(c) % k === 0 && k <= Math.abs(c) / k) pairs.push(k + ' and ' + Math.abs(c) / k);
    return { E, why: [T`No common factor. Look for two numbers that multiply to ${c} and add to ${b}.`, T`Factor pairs of ${Math.abs(c)}: ${pairs.join('; ')}. With either sign, none of them add to ${b}.`] };
  }
  MX.register({
    id: 'factor-strategy', section: SEC, title: 'Factoring strategy', kind: 'skill',
    sources: ['added'],
    slots: [{ label: 'Factor completely', source: 'Added', pool: ['gcfOnly', 'prime', 'mixed'] }],
    lesson: T`<p>A checklist that works for every "factor completely" problem:</p>
<ol><li><strong>GCF first.</strong> Take out the greatest common factor of all the terms (numbers and variables).</li>
<li><strong>Count the terms</strong> of what's left:
<ul><li>2 terms: difference of squares, difference of cubes, or sum of cubes. A sum of squares is prime.</li>
<li>3 terms: perfect-square trinomial? Otherwise the trinomial method (AC method when the leading coefficient isn't 1).</li>
<li>4 terms: factor by grouping.</li></ul></li>
<li><strong>Check every factor</strong> and keep going until nothing factors further.</li>
<li>If nothing works and there's no GCF, the polynomial is <strong>prime</strong>. Type <code>prime</code>.</li></ol>
<p class="warn">Taking out a GCF is not the end: \(3x^{3} - 12x = 3x\left(x^{2} - 4\right) = 3x\left(x - 2\right)\left(x + 2\right)\).</p>`,
    variants: {
      gcfOnly: {
        name: 'Greatest common factor only',
        gen(rng) {
          let g, p, q, a, b, c;
          do { g = rng.int(2, 9); p = rng.int(1, 3); q = rng.int(1, 2); a = rng.int(1, 7); b = rng.int(1, 7) * rng.sign(); c = rng.int(1, 7) * rng.sign(); } while (MX.gcdAll([a, b, c]) !== 1);
          const inner = poly([[a, { x: 1 }], [b, { y: 1 }], [c, {}]], ['x', 'y']);
          const full = poly([[g * a, { x: p + 1, y: q }], [g * b, { x: p, y: q + 1 }], [g * c, { x: p, y: q }]], ['x', 'y']);
          const mono = MX.poly([[g, { x: p, y: q }]], ['x', 'y']);
          const facs = [String(g)];
          for (let k = 0; k < p; k++) facs.push('x');
          for (let k = 0; k < q; k++) facs.push('y');
          facs.push(inner.asc);
          const ansT = T`${mono.tex}\left(${inner.tex}\right)`;
          return {
            prompt: T`Factor completely. If the polynomial can't be factored, type prime. \(${full.tex}\)`,
            parts: [{ kind: 'factor', answer: mono.asc + '(' + inner.asc + ')', factors: facs, show: ansT, points: 3, verify: MX.V.equiv(full.asc) }],
            solution: [
              T`GCF of the numbers: ${g}. Smallest power of \(x\): \(x^{${p}}\); of \(y\): \(y^{${q}}\). So the GCF is \(${mono.tex}\).`,
              T`Divide each term by \(${mono.tex}\): \(${inner.tex}\)`,
              T`What's left has three terms with no pattern and no common factor, so we're done. \(${H.box(ansT)}\)`,
            ],
          };
        },
      },
      prime: {
        name: 'Prime polynomials',
        gen(rng) {
          const { E, why } = primePoly(rng);
          return {
            prompt: T`Factor completely. If the polynomial can't be factored, type prime. \(${E.tex}\)`,
            parts: [{ kind: 'factor', answer: 'prime', poly: E.asc, show: '\\text{prime}', points: 3, verify: primeCheck(E.asc) }],
            solution: [...why, T`\(${H.box('\\text{prime}')}\)`],
          };
        },
      },
      mixed: {
        name: 'Choose the method',
        gen(rng) {
          const v = rng.pick(['x', 'y', 'n']);
          const kind = rng.int(0, 3);
          const g = rng.int(2, 5);
          if (kind === 0) { // g v (v^2 - c^2)
            const c = rng.int(1, 7);
            const E = poly([[g, { [v]: 3 }], [-g * c * c, { [v]: 1 }]]);
            const ansT = T`${g}${v}\left(${v} - ${c}\right)\left(${v} + ${c}\right)`;
            return { prompt: T`Factor completely. If the polynomial can't be factored, type prime. \(${E.tex}\)`, parts: [{ kind: 'factor', answer: `${g}${v}(${v}-${c})(${v}+${c})`, factors: [String(g), v, `${v}-${c}`, `${v}+${c}`], show: ansT, points: 3, verify: MX.V.equiv(E.asc) }],
              solution: [T`GCF: \(${g}${v}\), leaving \(${v}^{2} - ${c * c}\).`, T`Two terms, a difference of squares: \(\left(${v} - ${c}\right)\left(${v} + ${c}\right)\)`, T`\(${H.box(ansT)}\)`] };
          }
          if (kind === 1) { // g (v^2 + (r+s) v + rs)
            let r, s2; do { r = rng.nz(-7, 7); s2 = rng.nz(-7, 7); } while (r === s2 || r + s2 === 0);
            const E = MX.quad(g, g * (r + s2), g * r * s2, v), In = MX.quad(1, r + s2, r * s2, v);
            const F1 = poly([[1, { [v]: 1 }], [r, {}]]), F2 = poly([[1, { [v]: 1 }], [s2, {}]]);
            const ansT = T`${g}\left(${F1.tex}\right)\left(${F2.tex}\right)`;
            return { prompt: T`Factor completely. If the polynomial can't be factored, type prime. \(${E.tex}\)`, parts: [{ kind: 'factor', answer: `${g}(${F1.asc})(${F2.asc})`, factors: [String(g), F1.asc, F2.asc], show: ansT, points: 3, verify: MX.V.equiv(E.asc) }],
              solution: [T`GCF: ${g}, leaving \(${In.tex}\).`, T`Three terms: two numbers that multiply to ${r * s2} and add to ${r + s2} are ${r} and ${s2}.`, T`\(${H.box(ansT)}\)`] };
          }
          if (kind === 2) { // g (v^2 + c^2): GCF then prime part
            const c = rng.int(1, 6);
            const E = poly([[g, { [v]: 2 }], [g * c * c, {}]]);
            const ansT = T`${g}\left(${v}^{2} + ${c * c}\right)`;
            return { prompt: T`Factor completely. If the polynomial can't be factored, type prime. \(${E.tex}\)`, parts: [{ kind: 'factor', answer: `${g}(${v}^2+${c * c})`, factors: [String(g), `${v}^2+${c * c}`], show: ansT, points: 3, verify: MX.V.equiv(E.asc) }],
              solution: [T`GCF: ${g}, leaving \(${v}^{2} + ${c * c}\).`, T`That's a sum of squares, which doesn't factor. The polynomial isn't prime, because the GCF came out.`, T`\(${H.box(ansT)}\)`] };
          }
          // four terms: grouping
          let a, b; do { a = rng.nz(-6, 6); b = rng.int(1, 5); } while (Math.abs(a) === b);
          const E = poly([[1, { [v]: 3 }], [a, { [v]: 2 }], [-b * b, { [v]: 1 }], [-a * b * b, {}]]);
          const F1 = poly([[1, { [v]: 1 }], [a, {}]]);
          const ansT = T`\left(${F1.tex}\right)\left(${v} - ${b}\right)\left(${v} + ${b}\right)`;
          return { prompt: T`Factor completely. If the polynomial can't be factored, type prime. \(${E.tex}\)`, parts: [{ kind: 'factor', answer: `(${F1.asc})(${v}-${b})(${v}+${b})`, factors: [F1.asc, `${v}-${b}`, `${v}+${b}`], show: ansT, points: 3, verify: MX.V.equiv(E.asc) }],
            solution: [T`No GCF. Four terms, so group: \(${v}^{2}\left(${F1.tex}\right) - ${b * b}\left(${F1.tex}\right) = \left(${F1.tex}\right)\left(${v}^{2} - ${b * b}\right)\)`, T`Check each factor: \(${v}^{2} - ${b * b}\) is a difference of squares.`, T`\(${H.box(ansT)}\)`] };
        },
      },
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);

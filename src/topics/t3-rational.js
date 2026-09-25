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
    lesson: T`<p>You already know how to reduce a number fraction: \(\frac{6}{8} = \frac{2 \cdot 3}{2 \cdot 4} = \frac{3}{4}\). You write the top and bottom as products and divide out the factor they share. Rational expressions work the same way. The only new part is that the factors are polynomials.</p>
<div class="box def"><h4>Definition <b>Rational expression</b></h4><p>A <strong>rational expression</strong> is a fraction whose numerator (top) and denominator (bottom) are polynomials, such as \(\frac{x^{2} - 9}{x + 3}\). It is <strong>simplified</strong> when the top and bottom have no common factor left. The denominator can never be 0, so values of the variable that make it 0 are not allowed.</p></div>
<h3>Factor, then cancel</h3>
<p>A <em>factor</em> is something that is multiplied. You can only cancel a factor that appears in both the top and the bottom. So the first job is always to factor.</p>
<div class="box how"><h4>How to <b>simplify a rational expression</b></h4><ol>
<li>Factor the numerator completely. Take out a GCF first if there is one.</li>
<li>Factor the denominator completely.</li>
<li>Cancel each factor that appears in both.</li>
<li>Write what is left. Leaving it in factored form is fine.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Simplify \(\dfrac{x^{2} + 2x - 15}{x^{2} - 9}\).</p><table class="st">
<tr><td>Factor the top: two numbers that multiply to \(-15\) and add to 2.</td><td>\(\left(x + 5\right)\left(x - 3\right)\)</td></tr>
<tr><td>Factor the bottom, a difference of squares.</td><td>\(\left(x - 3\right)\left(x + 3\right)\)</td></tr>
<tr><td>Cancel the common factor \(x - 3\).</td><td>\(\dfrac{\left(x + 5\right)\left(x - 3\right)}{\left(x - 3\right)\left(x + 3\right)}\)</td></tr>
<tr><td>Write what is left.</td><td>\(\dfrac{x + 5}{x + 3}\)</td></tr></table></div>
<h3>Opposite factors</h3>
<p>Sometimes the top and bottom hold factors that look alike but are written in the other order, like \(4 - x\) and \(x - 4\). These are <em>opposites</em>: \(4 - x = -\left(x - 4\right)\).</p>
<div class="box rule"><h4>Property <b>Opposites divide to \(-1\)</b></h4><p>\(\dfrac{a - b}{b - a} = -1\) (as long as \(a \ne b\)). So when you cancel a pair of opposites, leave a \(-1\) behind.</p></div>
<div class="ex"><h4>Example</h4><p>Simplify \(\dfrac{8 - 2x}{x^{2} - 16}\).</p><table class="st">
<tr><td>Factor the top (GCF 2) and the bottom.</td><td>\(\dfrac{2\left(4 - x\right)}{\left(x - 4\right)\left(x + 4\right)}\)</td></tr>
<tr><td>\(4 - x\) and \(x - 4\) are opposites, so they cancel to \(-1\).</td><td>\(\dfrac{2 \cdot \left(-1\right)}{x + 4}\)</td></tr>
<tr><td>Write the answer.</td><td>\(-\dfrac{2}{x + 4}\)</td></tr></table></div>
<p>Only a difference flips like this. A sum does not: \(x + 5\) and \(5 + x\) are the same factor, so they cancel to 1.</p>
<div class="box warn"><h4>Watch out</h4><p>Cancel factors, never terms. In \(\frac{x + 5}{5}\) the 5 on top is added, not multiplied, so you cannot cancel the 5s. The expression is already simplified.</p></div>`,
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
    lesson: T`<p>Multiplying and dividing rational expressions uses the same rules as number fractions. To multiply, multiply the tops and multiply the bottoms. To divide, flip the second fraction and multiply. The extra step is to factor first, so you can cancel before the numbers get big.</p>
<div class="box rule"><h4>Rule <b>Multiplying and dividing fractions</b></h4><p>\(\dfrac{A}{B} \cdot \dfrac{C}{D} = \dfrac{AC}{BD}\qquad\dfrac{A}{B} \div \dfrac{C}{D} = \dfrac{A}{B} \cdot \dfrac{D}{C}\)</p><p>\(\frac{D}{C}\) is the <strong>reciprocal</strong> of \(\frac{C}{D}\): the same fraction turned upside down.</p></div>
<h3>Multiplying</h3>
<p>When the fractions are multiplied, any factor on a top can cancel with the same factor on any bottom, even in the other fraction.</p>
<div class="box how"><h4>How to <b>multiply or divide rational expressions</b></h4><ol>
<li>If it is a division, change \(\div\) to \(\cdot\) and flip the <em>second</em> fraction.</li>
<li>Factor every numerator and denominator completely. Take out GCFs first.</li>
<li>Cancel factors that appear on a top and on a bottom. Opposites, like \(x - 2\) and \(2 - x\), cancel to \(-1\).</li>
<li>Multiply what is left: tops together, bottoms together.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Multiply \(\dfrac{x^{2} - 9}{4x + 8} \cdot \dfrac{x + 2}{x - 3}\).</p><table class="st">
<tr><td>Factor each part.</td><td>\(\dfrac{\left(x - 3\right)\left(x + 3\right)}{4\left(x + 2\right)} \cdot \dfrac{x + 2}{x - 3}\)</td></tr>
<tr><td>Cancel \(x - 3\) and \(x + 2\).</td><td>\(\dfrac{x + 3}{4} \cdot \dfrac{1}{1}\)</td></tr>
<tr><td>Write what is left.</td><td>\(\dfrac{x + 3}{4}\)</td></tr></table></div>
<h3>Dividing</h3>
<p>Flip first, then do everything you did for multiplying. Sometimes every variable factor cancels and the answer is just a number.</p>
<div class="ex"><h4>Example</h4><p>Divide \(\dfrac{6}{x - 2} \div \dfrac{9}{2 - x}\).</p><table class="st">
<tr><td>Flip the second fraction and multiply.</td><td>\(\dfrac{6}{x - 2} \cdot \dfrac{2 - x}{9}\)</td></tr>
<tr><td>\(2 - x\) and \(x - 2\) are opposites, so they cancel to \(-1\).</td><td>\(\dfrac{6 \cdot \left(-1\right)}{9}\)</td></tr>
<tr><td>Reduce the number fraction.</td><td>\(-\dfrac{6}{9} = -\dfrac{2}{3}\)</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>Flip only the second fraction, and flip it <em>before</em> you cancel anything. Cancelling across a \(\div\) sign gives the wrong answer.</p></div>`,
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
    lesson: T`<p>To add \(\frac{1}{6} + \frac{1}{4}\) you first rewrite both fractions over 12, a common denominator. Rational expressions work the same way: you can only add or subtract once the denominators match.</p>
<div class="box rule"><h4>Rule <b>Same denominator</b></h4><p>\(\dfrac{A}{C} + \dfrac{B}{C} = \dfrac{A + B}{C}\qquad\dfrac{A}{C} - \dfrac{B}{C} = \dfrac{A - B}{C}\)</p><p>Combine the tops. Keep the bottom.</p></div>
<h3>Finding the common denominator</h3>
<div class="box def"><h4>Definition <b>Least common denominator (LCD)</b></h4><p>The <strong>LCD</strong> is the smallest expression that every denominator divides into. Factor each denominator. The LCD uses every factor, each one as many times as it shows up in any single denominator.</p></div>
<p>For \(4x\) and \(6x^{2}\): the numbers need \(\text{lcm}(4, 6) = 12\), and the highest power of \(x\) is \(x^{2}\), so the LCD is \(12x^{2}\). For \(x + 3\) and \(x\): nothing is shared, so the LCD is the product \(x\left(x + 3\right)\).</p>
<div class="box how"><h4>How to <b>add or subtract rational expressions</b></h4><ol>
<li>Factor each denominator and find the LCD.</li>
<li>Rewrite each fraction over the LCD: multiply its top and bottom by the factors it is missing.</li>
<li>Combine the numerators. When subtracting, put the second numerator in parentheses.</li>
<li>Simplify the top, then factor it and cancel if you can.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Subtract \(\dfrac{2}{x + 3} - \dfrac{1}{x}\).</p><table class="st">
<tr><td>The LCD is the product of the two denominators.</td><td>\(x\left(x + 3\right)\)</td></tr>
<tr><td>The first fraction is missing \(x\); the second is missing \(x + 3\).</td><td>\(\dfrac{2x}{x\left(x + 3\right)} - \dfrac{x + 3}{x\left(x + 3\right)}\)</td></tr>
<tr><td>Subtract the tops. Keep the parentheses.</td><td>\(\dfrac{2x - \left(x + 3\right)}{x\left(x + 3\right)}\)</td></tr>
<tr><td>Simplify the top.</td><td>\(\dfrac{x - 3}{x\left(x + 3\right)}\)</td></tr></table></div>
<h3>When a denominator factors</h3>
<p>Always factor the denominators first. Two that look different may share a factor: \(2x - 8 = 2\left(x - 4\right)\), so the LCD of \(2x - 8\) and \(x - 4\) is just \(2\left(x - 4\right)\). When everything cancels, the answer can be a plain number.</p>
<div class="ex"><h4>Example</h4><p>Subtract \(\dfrac{5x - 14}{2x - 8} - \dfrac{2x - 5}{x - 4}\).</p><table class="st">
<tr><td>Factor the first denominator. The second fraction is missing a 2.</td><td>\(\dfrac{5x - 14}{2\left(x - 4\right)} - \dfrac{2\left(2x - 5\right)}{2\left(x - 4\right)}\)</td></tr>
<tr><td>Subtract the tops.</td><td>\(5x - 14 - 4x + 10 = x - 4\)</td></tr>
<tr><td>The top matches a bottom factor, so cancel it.</td><td>\(\dfrac{x - 4}{2\left(x - 4\right)} = \dfrac{1}{2}\)</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>Subtracting a numerator means subtracting <em>every</em> term in it: \(-\left(x + 3\right) = -x - 3\), not \(-x + 3\). The parentheses remind you.</p></div>`,
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
    lesson: T`<p>A <strong>rational equation</strong> is an equation with a variable in a denominator, such as \(\frac{6}{x} + 1 = 3\). Fractions are hard to solve with, so the plan is to get rid of them. Multiply both sides by the LCD, and what is left is an ordinary equation you already know how to solve.</p>
<h3>Clear the fractions</h3>
<div class="box how"><h4>How to <b>solve a rational equation</b></h4><ol>
<li>Write down the values of the variable that make any denominator 0. These can never be solutions.</li>
<li>Find the LCD of all the denominators.</li>
<li>Multiply <em>every term</em> on both sides by the LCD. Each denominator cancels.</li>
<li>Solve the equation that is left.</li>
<li>Check each answer. Throw out any value from step 1.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Solve \(\dfrac{x + 6}{x} + \dfrac{1}{2} = \dfrac{5}{2}\).</p><table class="st">
<tr><td>\(x\) cannot be 0. The LCD of \(x\), 2 and 2 is \(2x\).</td><td>\(x \ne 0\)</td></tr>
<tr><td>Multiply every term by \(2x\).</td><td>\(2\left(x + 6\right) + x = 5x\)</td></tr>
<tr><td>Simplify.</td><td>\(3x + 12 = 5x\)</td></tr>
<tr><td>Solve.</td><td>\(12 = 2x,\quad x = 6\)</td></tr>
<tr><td>Check: 6 is allowed, and \(\frac{12}{6} + \frac{1}{2} = \frac{5}{2}\).</td><td>\(x = 6\) ✓</td></tr></table></div>
<h3>Proportions</h3>
<p>When the equation is one fraction equal to one fraction, a shortcut does the same job.</p>
<div class="box rule"><h4>Rule <b>Cross-multiplying</b></h4><p>If \(\dfrac{a}{b} = \dfrac{c}{d}\), then \(ad = bc\) (with \(b \ne 0\), \(d \ne 0\)). For example, \(\frac{3}{x - 1} = \frac{2}{x + 1}\) becomes \(3\left(x + 1\right) = 2\left(x - 1\right)\), so \(3x + 3 = 2x - 2\) and \(x = -5\).</p></div>
<h3>Extraneous solutions</h3>
<div class="box def"><h4>Definition <b>Extraneous solution</b></h4><p>An <strong>extraneous solution</strong> is a number you get by correct algebra that does not work in the original equation. In a rational equation it is a value that makes a denominator 0. If every answer is extraneous, the equation has <strong>no solution</strong>.</p></div>
<div class="ex"><h4>Example</h4><p>Solve \(\dfrac{x}{x - 3} + 2 = \dfrac{3}{x - 3}\).</p><table class="st">
<tr><td>\(x\) cannot be 3. Multiply every term by \(x - 3\), including the 2.</td><td>\(x + 2\left(x - 3\right) = 3\)</td></tr>
<tr><td>Solve.</td><td>\(3x - 6 = 3,\quad x = 3\)</td></tr>
<tr><td>But \(x = 3\) makes the denominators 0. Throw it out.</td><td>\(\text{no solution}\)</td></tr></table></div>
<p>Type <code>no solution</code> when that happens.</p>
<div class="box warn"><h4>Watch out</h4><p>Multiply <em>every</em> term by the LCD, including terms with no fraction, like the 2 above. Missing one term is the most common error.</p></div>`,
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

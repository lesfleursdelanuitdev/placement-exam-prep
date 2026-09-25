/* Part III: linear equations & inequalities in depth.
   Original question generators for every skill in a standard "solving linear equations" chapter:
   general strategy, classifying equations, fraction/decimal coefficients; number, percent and interest problems;
   formulas and geometry; coin, ticket/stamp, mixture and motion problems; inequalities and interval notation;
   compound inequalities; absolute value inequalities. */
(function (G) {
  'use strict';
  const MX = G.MX;
  const { Q, T, H, S } = MX;
  const I = S.I;
  const SEC = 'Linear equations & inequalities';
  const ADD = 'Added';
  const INF = Infinity;
  const lin = (a, b, v = 'x') => MX.lin(a, b, v);
  const sg = (n) => MX.sgnTerm(n);
  const money2 = (v) => '$' + Number(MX.money(v)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const $ = (v) => (Number.isInteger(v) ? '$' + MX.commas(v) : money2(v));
  const OPT = { '<': '\\lt', '<=': '\\le', '>': '\\gt', '>=': '\\ge' };
  const FLIP = { '<': '>', '<=': '>=', '>': '<', '>=': '<=' };
  const OPS = ['<', '<=', '>', '>='];
  const ray = (v, op) => ({ '<': [H.iv(-INF, v, false, false)], '<=': [H.iv(-INF, v, false, true)], '>': [H.iv(v, INF, false, false)], '>=': [H.iv(v, INF, true, false)] }[op]);
  const ivPart = (reg, points, extra) => Object.assign({ kind: 'interval', answer: H.regionAsc(reg), show: H.regionTex(reg), points }, extra || {});
  const graphPart = (rng, reg, label, extra) => { const c = H.regionChoices(rng, reg, extra); return { label, ask: 'Which graph shows the solution?', kind: 'choice', graph: true, options: c.options, answer: c.answer, points: 1 }; };
  const qx = (q) => (q instanceof Q ? q : new Q(q));
  const texQ = (q) => qx(q).tex();

  // ---------- small pictures ----------
  function balance(left, right, label) {
    const W = 320, Hh = 150;
    let b = S.poly([[160, 132], [148, 146], [172, 146]], 'ln soft2') + S.line(160, 132, 160, 44, 'ln thick') + S.line(60, 44, 260, 44, 'ln thick') + S.circle(160, 44, 4, 'fillink nostroke');
    [[60, left], [260, right]].forEach(([x, t]) => {
      b += S.line(x, 44, x - 36, 84, 'ln thin') + S.line(x, 44, x + 36, 84, 'ln thin') + S.path(`M${x - 44} 84 Q${x} 104 ${x + 44} 84 Z`, 'ln soft');
      b += S.label(x, 76, t, { cls: 'lbl', size: t.length > 9 ? 12 : 14 });
    });
    return S.svg(W, Hh, b, label || 'A balance: both sides are equal');
  }
  function bars(items, total) { // items: [{w, label, cls}]
    const W = 340, sum = items.reduce((s, x) => s + x.w, 0), sc = 280 / sum;
    let x = 30, b = '';
    items.forEach((it) => { b += S.rect(x, 30, it.w * sc, 34, 'ln ' + (it.cls || 'soft'), 3) + S.text(x + (it.w * sc) / 2, 52, it.label, { cls: 'tx small', w: 700 }); x += it.w * sc; });
    if (total) b += S.dim(30, 84, 310, 84, total);
    return S.svg(W, total ? 104 : 80, b, 'A bar model of the unknown numbers');
  }
  const tiles = (labels) => {
    const W = 340; let b = '';
    labels.forEach((t, k) => { const x = 30 + k * 96; b += S.rect(x, 24, 80, 44, 'ln ' + (k % 2 ? 'soft2' : 'soft'), 6) + S.text(x + 40, 51, t, { cls: 'tx', w: 700 }); });
    return S.svg(W, 90, b, 'Consecutive numbers as tiles');
  };
  function stamp(x, y, w, h, label, cls) {
    let b = S.rect(x, y, w, h, 'ln ' + cls, 2);
    for (let k = 4; k < w; k += 8) { b += S.circle(x + k, y, 2, 'paperf nostroke') + S.circle(x + k, y + h, 2, 'paperf nostroke'); }
    return b + S.text(x + w / 2, y + h / 2 + 5, label, { cls: 'tx small', w: 700 });
  }
  function triangle(labels, o = {}) {
    const W = 320, Hh = 170, P = [[40, 145], [285, 145], [o.apex || 120, 25]];
    let b = S.poly(P, 'ln soft');
    b += S.label(64, 136, labels[0], { cls: 'lbl', a: 'start' }) + S.label(260, 136, labels[1], { cls: 'lbl', a: 'end' }) + S.label((o.apex || 120), 52, labels[2], { cls: 'lbl' });
    return S.svg(W, Hh, b, o.label || 'A triangle with its angles labeled');
  }

  // ======================================================================
  // 2.1 general strategy, classifying, fractions & decimals
  // ======================================================================
  const CLASS = ['Conditional: exactly one solution', 'Identity: every real number is a solution', 'Contradiction: no solution'];
  function classifyQ(rng, type) {
    const a = rng.pick([2, 3, 4, 5, -2, -3]), b = rng.nz(-7, 7), c = rng.nz(-5, 6);
    const L = T`${a}\left(${lin(1, b).tex}\right) ${c === 1 ? '+ x' : c === -1 ? '- x' : sg(c) + 'x'}`;
    const lx = a + c, l0 = a * b;
    let R, ans, show, steps;
    if (type === 'identity') { R = rng.chance(0.5) ? lin(lx, l0).tex : T`${l0} ${lx === 1 ? '+ x' : lx === -1 ? '- x' : sg(lx) + 'x'}`; ans = 'allreal'; show = '\\text{all real numbers}'; steps = T`Both sides simplify to \(${lin(lx, l0).tex}\): the equation is always true, so it is an <strong>identity</strong>.`; }
    else if (type === 'contra') { const k = rng.nz(-9, 9); R = lin(lx, l0 + k).tex; ans = 'nosol'; show = '\\text{no solution}'; steps = T`Subtracting \(${MX.coef(lx) || '1'}x\) from both sides leaves \(${l0} = ${l0 + k}\), which is false: a <strong>contradiction</strong>.`; }
    else { let e; do { e = rng.nz(-6, 8); } while (e === lx); const x0 = rng.nz(-8, 8), f = lx * x0 + l0 - e * x0; R = lin(e, f).tex; ans = String(x0); show = 'x = ' + x0; steps = T`\(${lin(lx, l0).tex} = ${lin(e, f).tex}\) gives \(${lx - e}x = ${f - l0}\), so \(x = ${x0}\): one solution, a <strong>conditional</strong> equation.`; }
    return {
      prompt: T`Classify the equation as conditional, an identity, or a contradiction, then give its solution: \(${L} = ${R}\)`,
      parts: [
        { label: 'a', ask: 'Type of equation', kind: 'choice', options: CLASS, answer: type === 'identity' ? 1 : type === 'contra' ? 2 : 0, points: 1 },
        { label: 'b', ask: 'Solution (a number, “no solution”, or “all real numbers”)', kind: 'num', var: 'x', answer: ans, show, points: 2 },
      ],
      solution: [T`Simplify the left side: \(${L} = ${lin(lx, l0).tex}\).`, steps, T`\(${H.box(show)}\)`],
    };
  }
  MX.register({
    id: 'lq-strategy', section: SEC, part: 3, title: 'Linear equations: strategy and special cases', kind: 'skill', sources: [ADD],
    slots: [
      { label: 'General strategy', source: ADD, pool: ['distribute', 'bothSides', 'nested'] },
      { label: 'Classify equations', source: ADD, pool: ['identity', 'contra', 'conditional'] },
      { label: 'Fraction or decimal coefficients', source: ADD, pool: ['fractions', 'decimals'] },
    ],
    lesson: T`<p><strong>General strategy</strong> for a linear equation:</p>
<ol><li>Simplify each side: clear fractions or decimals, distribute, combine like terms.</li>
<li>Collect the variable terms on one side and the constants on the other.</li><li>Divide by the coefficient of the variable.</li><li>Check in the original equation.</li></ol>
<p><strong>Three kinds of equations.</strong> If the variable terms cancel:</p>
<ul><li>a true statement like \(6 = 6\) means an <strong>identity</strong>: every real number is a solution;</li>
<li>a false statement like \(6 = 2\) means a <strong>contradiction</strong>: no solution.</li></ul>
<p>Otherwise it is a <strong>conditional</strong> equation with exactly one solution.</p>
<p><strong>Fractions or decimals:</strong> multiply <em>every</em> term by the LCD (for fractions) or by 10, 100, … (for decimals) first.</p>`,
    variants: {
      distribute: {
        name: 'Distribute first',
        gen(rng) {
          let a, b, c, d, e, x0, f;
          do { a = rng.pick([2, 3, 4, 5, -2, -3]); b = rng.pick([1, 2, 3]); c = rng.nz(-8, 8); d = rng.int(-15, 15); e = rng.nz(-7, 9); x0 = rng.nz(-9, 9); f = a * (b * x0 + c) + d - e * x0; } while (a * b === e || Math.abs(f) > 70);
          const L = T`${a}\left(${lin(b, c).tex}\right)${d ? ' ' + sg(d) : ''}`;
          return {
            prompt: T`Solve: \(${L} = ${lin(e, f).tex}\)`,
            parts: [{ kind: 'num', var: 'x', answer: String(x0), show: 'x = ' + x0, points: 3 }],
            solution: [T`Distribute: \(${lin(a * b, a * c + d).tex} = ${lin(e, f).tex}\)`, T`Collect: \(${a * b - e}x = ${f - a * c - d}\)`, T`\(${H.box('x = ' + x0)}\)`],
          };
        },
      },
      bothSides: {
        name: 'Like terms on both sides',
        gen(rng) {
          let p, q, r, s, x0, t;
          do { p = rng.int(2, 12); q = rng.nz(-12, 12); r = rng.int(1, 6); s = rng.nz(-8, 8); x0 = rng.nz(-9, 9); t = (p - r - s) * x0 + q; } while (p - r - s === 0 || p === r || Math.abs(t) > 80);
          return {
            prompt: T`Solve: \(${p}x ${sg(q)} - ${r === 1 ? '' : r}x = ${lin(s, t).tex}\)`,
            parts: [{ kind: 'num', var: 'x', answer: String(x0), show: 'x = ' + x0, points: 3 }],
            solution: [T`Combine like terms on the left: \(${lin(p - r, q).tex} = ${lin(s, t).tex}\)`, T`Collect: \(${p - r - s}x = ${t - q}\)`, T`\(${H.box('x = ' + x0)}\)`],
          };
        },
      },
      nested: {
        name: 'Nested grouping symbols',
        gen(rng) {
          let a, b, c, d, e, x0, f;
          do { a = rng.int(5, 20); b = rng.int(1, 12); c = rng.int(2, 6); d = rng.int(1, 9); e = rng.nz(-5, 5); x0 = rng.nz(-8, 8); f = a - b + c * x0 - d - e * x0; } while (c === e || Math.abs(f) > 60);
          return {
            prompt: T`Solve: \(${a} - \left[${b} - \left(${c}x - ${d}\right)\right] = ${lin(e, f).tex}\)`,
            parts: [{ kind: 'num', var: 'x', answer: String(x0), show: 'x = ' + x0, points: 3 }],
            solution: [T`Work from the inside out: \(${b} - \left(${c}x - ${d}\right) = ${lin(-c, b + d).tex}\).`, T`Then \(${a} - \left(${lin(-c, b + d).tex}\right) = ${lin(c, a - b - d).tex}\).`, T`\(${lin(c, a - b - d).tex} = ${lin(e, f).tex}\) gives \(${c - e}x = ${f - a + b + d}\), so \(${H.box('x = ' + x0)}\)`],
          };
        },
      },
      identity: { name: 'Identity', gen: (rng) => classifyQ(rng, 'identity') },
      contra: { name: 'Contradiction', gen: (rng) => classifyQ(rng, 'contra') },
      conditional: { name: 'Conditional', gen: (rng) => classifyQ(rng, 'cond') },
      fractions: {
        name: 'Fraction coefficients',
        gen(rng) {
          let q1, q2, p1, p2, r1, r2, x;
          do {
            [q1, q2] = rng.sample([2, 3, 4, 5, 6, 8], 2); p1 = rng.int(1, q1 - 1 || 1); p2 = rng.int(1, q2 - 1 || 1);
            r1 = new Q(rng.nz(-5, 5), rng.pick([1, 2, 3, 4])); r2 = new Q(rng.nz(-5, 5), rng.pick([1, 2, 3, 6]));
            const k = new Q(p1, q1).sub(new Q(p2, q2));
            x = k.n === 0 ? null : r2.sub(r1).div(k);
          } while (!x || MX.gcd(p1, q1) !== 1 || MX.gcd(p2, q2) !== 1 || Math.abs(x.n) > 60 || x.d > 12);
          const A = new Q(p1, q1), B = new Q(p2, q2), Lc = [q1, q2, r1.d, r2.d].reduce((m, v) => MX.lcm(m, v), 1);
          const t = (q, v) => (q.eq(1) ? v : q.tex() + v);
          return {
            prompt: T`Solve: \(${t(A, 'x')} ${r1.n < 0 ? '-' : '+'} ${r1.abs().tex()} = ${t(B, 'x')} ${r2.n < 0 ? '-' : '+'} ${r2.abs().tex()}\)`,
            parts: [{ kind: 'num', frac: true, var: 'x', answer: x.str(), show: 'x = ' + x.tex(), points: 3 }],
            solution: [T`Multiply every term by the LCD, ${Lc}: \(${A.mul(Lc).str()}x ${sg(r1.mul(Lc).val())} = ${B.mul(Lc).str()}x ${sg(r2.mul(Lc).val())}\)`, T`Collect: \(${A.sub(B).mul(Lc).str()}x = ${r2.sub(r1).mul(Lc).str()}\)`, T`\(${H.box('x = ' + x.tex())}\)`],
          };
        },
      },
      decimals: {
        name: 'Decimal coefficients',
        gen(rng) {
          let a, c, x0, b, d;
          do { a = rng.int(1, 40) * 5; c = rng.int(1, 40) * 5; x0 = rng.nz(-12, 20); b = rng.int(-60, 60) * 5; d = a * x0 + b - c * x0; } while (a === c || Math.abs(d) > 500);
          const f = (v) => MX.num(v / 100);
          const money = rng.chance(0.4);
          return {
            prompt: money
              ? T`Solve: \(${f(a)}x ${sg(b / 100).replace(/(\d)$/, '$1')} = ${f(c)}x ${sg(d / 100)}\)`
              : T`Solve: \(${f(a)}x ${sg(b / 100)} = ${f(c)}x ${sg(d / 100)}\)`,
            parts: [{ kind: 'num', var: 'x', answer: String(x0), show: 'x = ' + x0, points: 3 }],
            solution: [T`Multiply every term by 100 to clear the decimals: \(${a}x ${sg(b)} = ${c}x ${sg(d)}\)`, T`Collect: \(${a - c}x = ${d - b}\)`, T`\(${H.box('x = ' + x0)}\)`],
          };
        },
      },
    },
  });

  // ======================================================================
  // 2.2 number problems, percent applications, simple interest
  // ======================================================================
  const TIMES = { 2: 'twice', 3: 'three times', 4: 'four times', 5: 'five times' };
  MX.register({
    id: 'lq-problems', section: SEC, part: 3, title: 'Problem solving: numbers, percents, interest', kind: 'skill', sources: [ADD],
    slots: [
      { label: 'Number problems', source: ADD, pool: ['sumDiff', 'consecutive', 'translate'] },
      { label: 'Percent applications', source: ADD, pool: ['commission', 'markup', 'discountRate', 'original'] },
      { label: 'Simple interest', source: ADD, pool: ['findI', 'findR', 'findP', 'findT'] },
    ],
    lesson: T`<p><strong>A problem-solving plan:</strong> read the problem, name what you're looking for with a variable, translate the words into an equation, solve it, check the answer in the <em>words</em>, and answer with a sentence and units.</p>
<ul><li><strong>Numbers</strong>: "7 more than twice a number" is \(2n + 7\). Consecutive integers are \(n, n + 1, n + 2\); consecutive odd or even integers are \(n, n + 2, n + 4\).</li>
<li><strong>Percent</strong>: amount = rate × base. Commission = rate × sales; markup = rate × cost; discount = rate × original price. Always divide by the <em>original</em> amount for a percent change.</li>
<li><strong>Simple interest</strong>: \(I = Prt\), with the rate \(r\) as a decimal and the time \(t\) in years.</li></ul>`,
    variants: {
      sumDiff: {
        name: 'Two numbers',
        gen(rng) {
          const m = rng.pick([2, 3, 4]), k = rng.nz(-12, 15), n = rng.int(3, 30), big = m * n + k, S2 = n + big;
          if (big <= n) return this.gen(rng);
          return {
            prompt: T`One number is ${Math.abs(k)} ${k > 0 ? 'more' : 'less'} than ${TIMES[m]} another. Their sum is ${S2}. Find both numbers.`,
            visual: bars([{ w: n, label: 'n' }, { w: big, label: m + 'n ' + (k > 0 ? '+ ' : '− ') + Math.abs(k), cls: 'soft2' }], 'sum ' + S2),
            parts: [
              { label: 'a', ask: 'The smaller number', kind: 'num', answer: String(n), points: 1 },
              { label: 'b', ask: 'The larger number', kind: 'num', answer: String(big), points: 1 },
            ],
            solution: [T`Let \(n\) be the smaller number; the other is \(${lin(m, k, 'n').tex}\).`, T`\(n + ${lin(m, k, 'n').tex} = ${S2}\), so \(${m + 1}n ${sg(k)} = ${S2}\) and \(n = ${n}\).`, T`The numbers are \(${H.box(T`${n}\text{ and }${big}`)}\).`],
          };
        },
      },
      consecutive: {
        name: 'Consecutive integers',
        gen(rng) {
          const kind = rng.pick(['integers', 'odd integers', 'even integers']), cnt = rng.pick([2, 3]), step = kind === 'integers' ? 1 : 2;
          let n = rng.int(-30, 60); if (kind === 'odd integers' && n % 2 === 0) n++; if (kind === 'even integers' && Math.abs(n % 2) === 1) n++;
          const nums = Array.from({ length: cnt }, (_, k) => n + k * step), S2 = nums.reduce((s, v) => s + v, 0);
          const names = ['n', 'n + ' + step, 'n + ' + 2 * step].slice(0, cnt);
          return {
            prompt: T`The sum of ${cnt === 2 ? 'two' : 'three'} consecutive ${kind} is ${S2}. Find the numbers.`,
            visual: tiles(names),
            parts: nums.map((v, k) => ({ label: 'abc'[k], ask: ['First (smallest)', 'Second', 'Third'][k], kind: 'num', answer: String(v), points: 1 })),
            solution: [T`Let the first be \(n\); the others are \(${names.slice(1).join(',\\ ')}\).`, T`\(${names.join(' + ')} = ${S2}\), so \(${cnt}n + ${cnt === 2 ? step : 3 * step} = ${S2}\) and \(n = ${n}\).`, T`\(${H.box(nums.join(',\\ '))}\)`],
          };
        },
      },
      translate: {
        name: 'Translate and solve',
        gen(rng) {
          const n = rng.nz(-15, 25), a = rng.pick([2, 3, 4, 5, 6]), k = rng.int(2, 20);
          const forms = [
            { w: `${k} less than ${TIMES[a] || a + ' times'} a number is ${a * n - k}.`, eq: T`${a}n - ${k} = ${a * n - k}`, L: `${a}n − ${k}`, R: String(a * n - k) },
            { w: `The sum of ${TIMES[a] || a + ' times'} a number and ${k} is ${a * n + k}.`, eq: T`${a}n + ${k} = ${a * n + k}`, L: `${a}n + ${k}`, R: String(a * n + k) },
            { w: `${a} times the difference of a number and ${k} is ${a * (n - k)}.`, eq: T`${a}\left(n - ${k}\right) = ${a * (n - k)}`, L: `${a}(n − ${k})`, R: String(a * (n - k)) },
          ];
          const F = rng.pick(forms);
          return {
            prompt: T`Translate and solve: ${F.w} Find the number.`,
            visual: balance(F.L, F.R),
            parts: [{ kind: 'num', answer: String(n), points: 2 }],
            solution: [T`Let \(n\) be the number: \(${F.eq}\)`, T`Solve: \(${H.box('n = ' + n)}\)`],
          };
        },
      },
      commission: {
        name: 'Commission',
        gen(rng) {
          const r = rng.pick([2, 3, 4, 5, 6, 8, 10, 12]), sale = rng.int(20, 400) * 500, C = (sale * r) / 100;
          const ask = rng.pick(['C', 'S', 'r']);
          const who = rng.pick(['A real-estate agent', 'A car salesperson', 'A furniture salesperson']);
          const W = 340, Hh = 110;
          const v = S.svg(W, Hh, I.house(30, 90, 60, 40) + S.text(150, 50, ask === 'S' ? 'sale price = ?' : 'sale ' + $(sale), { cls: 'tx small', w: 700 }) + S.text(150, 74, ask === 'r' ? 'rate = ?' : 'rate ' + r + '%', { cls: 'tx small', w: 700 }) + I.coin(280, 50, 18, '$') + S.text(280, 96, ask === 'C' ? 'commission = ?' : $(C), { cls: 'tx small', w: 700 }), 'A sale and the commission on it');
          const P = {
            C: { q: T`${who} earns ${r}% commission. What is the commission on a ${$(sale)} sale?`, part: { kind: 'num', pre: '$', answer: String(C), tol: 0.005, show: '\\$' + MX.commas(C), points: 2 }, s: [T`Commission = rate × sale = \(${r / 100}\times${MX.commas(sale)} = ${MX.commas(C)}\)`] },
            S: { q: T`${who} earns ${r}% commission and earned ${$(C)} on one sale. What was the sale price?`, part: { kind: 'num', pre: '$', answer: String(sale), tol: 0.005, show: '\\$' + MX.commas(sale), points: 2 }, s: [T`\(${MX.commas(C)} = ${r / 100}S\)`, T`\(S = \frac{${MX.commas(C)}}{${r / 100}} = ${MX.commas(sale)}\)`] },
            r: { q: T`${who} earned ${$(C)} in commission on a ${$(sale)} sale. What is the commission rate?`, part: { kind: 'num', answer: String(r), post: '%', show: r + '\\%', points: 2 }, s: [T`\(${MX.commas(C)} = r\cdot${MX.commas(sale)}\), so \(r = \frac{${MX.commas(C)}}{${MX.commas(sale)}} = ${r / 100}\)`, T`As a percent: ${r}%.`] },
          }[ask];
          return { prompt: P.q, visual: v, parts: [P.part], solution: [...P.s, T`\(${H.box(P.part.show)}\)`] };
        },
      },
      markup: {
        name: 'Markup',
        gen(rng) {
          const cost = rng.int(8, 120) * (rng.chance(0.5) ? 1 : 0.5), r = rng.pick([20, 25, 30, 40, 50, 60, 75, 80]);
          const up = (cost * r) / 100, price = cost + up, item = rng.pick(['backpack', 'lamp', 'pair of boots', 'blender', 'guitar strap']);
          const findCost = rng.chance(0.4);
          const W = 340, Hh = 110;
          const v = S.svg(W, Hh, I.tag(20, 55, findCost ? 'cost ?' : 'cost ' + money2(cost), 'paperf') + S.arrow(150, 55, 190, 55, 'acc', 8) + S.text(170, 40, '+' + r + '%', { cls: 'tx small', w: 700 }) + I.tag(200, 55, findCost ? 'price ' + money2(price) : 'price ?', 'soft2'), 'Cost plus a percent markup gives the price');
          return findCost
            ? {
              prompt: T`A store marks up every item ${r}% over its cost. A ${item} sells for ${money2(price)}. What did the store pay for it?`,
              visual: v,
              parts: [{ kind: 'num', pre: '$', answer: MX.money(cost), tol: 0.005, show: '\\$' + MX.money(cost), points: 2 }],
              solution: [T`Price = cost + ${r}% of cost \(= ${1 + r / 100}c\).`, T`\(${1 + r / 100}c = ${MX.money(price)}\), so \(c = ${H.box('\\$' + MX.money(cost))}\)`],
            }
            : {
              prompt: T`A store buys a ${item} for ${money2(cost)} and marks it up ${r}%. What is the markup, and what is the selling price?`,
              visual: v,
              parts: [
                { label: 'a', ask: 'Markup', kind: 'num', pre: '$', answer: MX.money(up), tol: 0.005, show: '\\$' + MX.money(up), points: 1 },
                { label: 'b', ask: 'Selling price', kind: 'num', pre: '$', answer: MX.money(price), tol: 0.005, show: '\\$' + MX.money(price), points: 1 },
              ],
              solution: [T`Markup \(= ${r / 100}\times${MX.money(cost)} = ${MX.money(up)}\)`, T`Price \(= ${MX.money(cost)} + ${MX.money(up)} = ${H.box('\\$' + MX.money(price))}\)`],
            };
        },
      },
      discountRate: {
        name: 'Find the discount rate',
        gen(rng) {
          const orig = rng.int(12, 250), r = rng.pick([10, 15, 20, 25, 30, 35, 40, 45, 50, 60]), sale = Math.round(orig * (100 - r)) / 100;
          const item = rng.pick(['tent', 'jacket', 'phone case', 'printer', 'set of pans']);
          const W = 340, Hh = 100;
          const v = S.svg(W, Hh, I.tag(20, 50, 'was ' + $(orig), 'paperf') + S.line(36, 50, 36 + ('was ' + $(orig)).length * 7.4 + 8, 50, 'acc thick') + S.arrow(170, 50, 205, 50, 'acc', 8) + I.tag(212, 50, 'now ' + money2(sale), 'soft2') + S.q(190, 26, '?% off'), 'An original and a sale price');
          return {
            prompt: T`A ${item} that regularly costs ${$(orig)} is on sale for ${money2(sale)}. What is the discount rate?`,
            visual: v,
            parts: [{ kind: 'num', answer: String(r), tol: 0.051, post: '%', show: r + '\\%', points: 2 }],
            solution: [T`Discount \(= ${orig} - ${MX.money(sale)} = ${MX.money(orig - sale)}\).`, T`Rate \(= \frac{\text{discount}}{\text{original}} = \frac{${MX.money(orig - sale)}}{${orig}} = ${r / 100}\), which is ${r}%.`, T`\(${H.box(r + '\\%')}\)`],
          };
        },
      },
      original: {
        name: 'Find the original amount',
        gen(rng) {
          const up = rng.chance(0.5), r = rng.pick([5, 10, 12, 15, 20, 25, 40]), orig = rng.int(10, 60) * (up ? 1 : 2), now = (orig * (100 + (up ? r : -r))) / 100;
          const ctx = up ? rng.pick([['After a', 'raise, Kai earns', 'an hour', 'before the raise']]) : [['After a', 'price cut, a haircut costs', '', 'before the cut']][0];
          return {
            prompt: up
              ? T`After a ${r}% raise, Kai earns ${money2(now)} an hour. What did Kai earn per hour before the raise?`
              : T`After a ${r}% price cut, a train pass costs ${money2(now)}. What did it cost before the cut?`,
            visual: bars([{ w: 100, label: 'original = 100%' }, { w: r, label: (up ? '+' : '−') + r + '%', cls: 'soft2' }], (up ? 'new = ' : 'new = ') + (100 + (up ? r : -r)) + '% = ' + money2(now)),
            parts: [{ kind: 'num', pre: '$', answer: MX.money(orig), tol: 0.005, show: '\\$' + MX.money(orig), points: 2 }],
            solution: [T`The new amount is ${100 + (up ? r : -r)}% of the original: \(${(100 + (up ? r : -r)) / 100}x = ${MX.money(now)}\).`, T`\(x = \frac{${MX.money(now)}}{${(100 + (up ? r : -r)) / 100}} = ${H.box('\\$' + MX.money(orig))}\)`, T`(Not ${MX.money(now)} ${up ? '−' : '+'} ${r}% of ${MX.money(now)}: the percent is of the <em>original</em>.)`],
          };
        },
      },
      findI: { name: 'Find the interest', gen: (rng) => interest(rng, 'I') },
      findR: { name: 'Find the rate', gen: (rng) => interest(rng, 'r') },
      findP: { name: 'Find the principal', gen: (rng) => interest(rng, 'P') },
      findT: { name: 'Find the time', gen: (rng) => interest(rng, 't') },
    },
  });
  function interest(rng, ask) {
    const P = rng.int(5, 120) * 100, r = rng.pick([1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8]), t = rng.int(1, 12), I2 = Math.round(P * r * t) / 100;
    if (!Number.isInteger(I2 * 100)) return interest(rng, ask);
    const W = 340, Hh = 120;
    const lab = (k, v) => (ask === k ? k + ' = ?' : v);
    const vis = S.svg(W, Hh, I.piggy(60, 60, 30) + S.text(170, 36, lab('P', 'principal ' + $(P)), { cls: 'tx small', w: 700, a: 'start' }).replace('P = ?', 'principal = ?') + S.text(170, 58, lab('r', 'rate ' + r + '% per year'), { cls: 'tx small', w: 700, a: 'start' }).replace('r = ?', 'rate = ?') + S.text(170, 80, lab('t', 'time ' + t + ' years'), { cls: 'tx small', w: 700, a: 'start' }).replace('t = ?', 'time = ?') + S.text(170, 102, lab('I', 'interest ' + money2(I2)), { cls: 'tx small', w: 700, a: 'start' }).replace('I = ?', 'interest = ?'), 'Simple interest facts');
    const Q2 = {
      I: [T`Ana deposits ${$(P)} in an account that pays ${r}% simple interest per year. How much interest does she earn in ${t} year${t > 1 ? 's' : ''}?`, { kind: 'num', pre: '$', answer: MX.money(I2), tol: 0.005, show: '\\$' + Number(I2).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }, [T`\(I = Prt = ${P}\cdot${r / 100}\cdot${t} = ${MX.money(I2)}\)`]],
      r: [T`A loan of ${$(P)} for ${t} year${t > 1 ? 's' : ''} costs ${money2(I2)} in simple interest. What is the annual interest rate?`, { kind: 'num', answer: String(r), post: '%', show: r + '\\%' }, [T`\(${MX.money(I2)} = ${P}\cdot r\cdot${t} = ${P * t}r\)`, T`\(r = \frac{${MX.money(I2)}}{${P * t}} = ${r / 100}\), so ${r}%.`]],
      P: [T`An account paying ${r}% simple interest per year earned ${money2(I2)} in ${t} year${t > 1 ? 's' : ''}. How much was deposited?`, { kind: 'num', pre: '$', answer: String(P), tol: 0.005, show: '\\$' + MX.commas(P) }, [T`\(${MX.money(I2)} = P\cdot${r / 100}\cdot${t} = ${MX.num((r / 100) * t)}P\)`, T`\(P = \frac{${MX.money(I2)}}{${MX.num((r / 100) * t)}} = ${MX.commas(P)}\)`]],
      t: [T`How many years will it take ${$(P)} to earn ${money2(I2)} at ${r}% simple interest per year?`, { kind: 'num', answer: String(t), post: 'years', show: t + '\\text{ years}' }, [T`\(${MX.money(I2)} = ${P}\cdot${r / 100}\cdot t = ${MX.num((P * r) / 100)}t\)`, T`\(t = \frac{${MX.money(I2)}}{${MX.num((P * r) / 100)}} = ${t}\)`]],
    }[ask];
    return { prompt: Q2[0], visual: vis, parts: [Object.assign(Q2[1], { points: 2 })], solution: [T`Simple interest: \(I = Prt\) with \(r\) as a decimal.`, ...Q2[2], T`\(${H.box(Q2[1].show)}\)`] };
  }

  // ======================================================================
  // 2.3 formulas and geometry
  // ======================================================================
  const FORMULAS = [
    { f: T`d = rt`, v: 't', vars: ['d', 'r'], a: 'd/r', t: T`\frac{d}{r}`, s: [T`Divide both sides by \(r\).`] },
    { f: T`A = \frac{1}{2}bh`, v: 'b', vars: ['A', 'h'], a: '2A/h', t: T`\frac{2A}{h}`, s: [T`Multiply both sides by 2: \(2A = bh\).`, T`Divide by \(h\).`] },
    { f: T`V = LWH`, v: 'W', vars: ['V', 'L', 'H'], a: 'V/(LH)', t: T`\frac{V}{LH}`, s: [T`Divide both sides by \(LH\).`] },
    { f: T`I = Prt`, v: 'P', vars: ['I', 'r', 't'], a: 'I/(rt)', t: T`\frac{I}{rt}`, s: [T`Divide both sides by \(rt\).`] },
    { f: T`F = \frac{9}{5}C + 32`, v: 'C', vars: ['F'], a: '5(F-32)/9', t: T`\frac{5}{9}\left(F - 32\right)`, s: [T`Subtract 32: \(F - 32 = \frac{9}{5}C\).`, T`Multiply by \(\frac{5}{9}\).`] },
    { f: T`y = mx + b`, v: 'm', vars: ['y', 'x', 'b'], a: '(y-b)/x', t: T`\frac{y - b}{x}`, s: [T`Subtract \(b\): \(y - b = mx\).`, T`Divide by \(x\).`] },
    { f: T`A = \frac{1}{2}h\left(a + c\right)`, v: 'h', vars: ['A', 'a', 'c'], a: '2A/(a+c)', t: T`\frac{2A}{a + c}`, s: [T`Multiply by 2: \(2A = h\left(a + c\right)\).`, T`Divide by \(\left(a + c\right)\).`] },
    { f: T`P = a + b + c`, v: 'c', vars: ['P', 'a', 'b'], a: 'P-a-b', t: T`P - a - b`, s: [T`Subtract \(a\) and \(b\) from both sides.`] },
  ];
  MX.register({
    id: 'lq-formulas', section: SEC, part: 3, title: 'Formulas and geometry applications', kind: 'skill', sources: [ADD],
    slots: [
      { label: 'Solve a formula for a variable', source: ADD, pool: ['twoVar', 'formula'] },
      { label: 'Geometry applications', source: ADD, pool: ['angles', 'suppComp', 'sail', 'trapezoid'] },
    ],
    lesson: T`<p><strong>Solving a formula for one variable</strong> uses the same steps as solving an equation: treat every other letter as a number, then undo additions/subtractions and multiplications/divisions until the variable is alone.</p>
\[3x + 4y = 12 \;\Rightarrow\; 4y = 12 - 3x \;\Rightarrow\; y = \frac{12 - 3x}{4}\]
<p><strong>Geometry facts:</strong> the angles of a triangle add to \(180^{\circ}\); complementary angles add to \(90^{\circ}\), supplementary to \(180^{\circ}\); triangle area \(A = \frac{1}{2}bh\); trapezoid area \(A = \frac{1}{2}h\left(b_{1} + b_{2}\right)\).</p>
<p>Draw and label a picture, write the formula, substitute what you know, and solve.</p>`,
    variants: {
      twoVar: {
        name: 'Solve for y',
        gen(rng) {
          let a, b, c; do { a = rng.nz(-8, 8); b = rng.nz(-7, 7); c = rng.int(-24, 24); } while (Math.abs(b) === 1 || MX.gcdAll([a, b, c]) !== 1);
          const ans = `(${c}-(${a})x)/(${b})`, show = T`y = \frac{${c} ${sg(-a)}x}{${b}}`;
          return {
            prompt: T`Solve for \(y\): \(${MX.poly([[a, { x: 1 }], [b, { y: 1 }]], ['x', 'y']).tex} = ${c}\)`,
            parts: [{ kind: 'expr', lhs: 'y', vars: ['x'], pre: 'y =', answer: ans, show, points: 2 }],
            solution: [T`Move the \(x\)-term: \(${b}y = ${c} ${sg(-a)}x\).`, T`Divide by ${b}: \(${H.box(show)}\) (equivalently \(y = ${new Q(-a, b).tex()}x ${sg(new Q(c, b).val()) === '+ 0' ? '' : (c * b < 0 ? '- ' : '+ ') + new Q(Math.abs(c), Math.abs(b)).tex()}\)).`],
          };
        },
      },
      formula: {
        name: 'Solve a formula',
        gen(rng) {
          const F = rng.pick(FORMULAS);
          return {
            prompt: T`Solve \(${F.f}\) for \(${F.v}\).`,
            parts: [{ kind: 'expr', lhs: F.v, vars: F.vars, pre: F.v + ' =', answer: F.a, show: F.v + ' = ' + F.t, points: 2 }],
            solution: [...F.s, T`\(${H.box(F.v + ' = ' + F.t)}\)`],
          };
        },
      },
      angles: {
        name: 'Angles of a triangle',
        gen(rng) {
          let d, m, x; do { d = rng.int(5, 40); m = rng.pick([2, 3]); x = rng.int(15, 50); } while (180 - (x + x + d) - m * x !== 0 && (x = (180 - d) / (m + 2), !Number.isInteger(x) || x < 10));
          x = (180 - d) / (m + 2);
          if (!Number.isInteger(x) || x < 8) return this.gen(rng);
          const A = [x, x + d, m * x];
          return {
            prompt: T`In a triangle, the second angle is ${d}° more than the first, and the third angle is ${TIMES[m]} the first. Find all three angles.`,
            visual: triangle(['x°', '(x + ' + d + ')°', m + 'x°']),
            parts: A.map((v, k) => ({ label: 'abc'[k], ask: ['First angle', 'Second angle', 'Third angle'][k], kind: 'num', answer: String(v), post: 'degrees', points: 1 })),
            solution: [T`\(x + \left(x + ${d}\right) + ${m}x = 180\)`, T`\(${m + 2}x + ${d} = 180\), so \(x = ${x}\).`, T`Angles: \(${H.box(A.map((v) => v + '^{\\circ}').join(',\\ '))}\) (they add to 180°).`],
          };
        },
      },
      suppComp: {
        name: 'Complementary and supplementary angles',
        gen(rng) {
          const sup = rng.chance(0.55), total = sup ? 180 : 90, m = rng.pick([2, 3, 4]), k = rng.nz(-20, 20);
          const x = (total - k) / (m + 1);
          if (!Number.isInteger(x) || x <= 0 || m * x + k <= 0) return this.gen(rng);
          const big = m * x + k;
          const W = 320, Hh = 130;
          let v = sup ? S.line(30, 110, 290, 110, 'ln thick') + S.line(160, 110, 160 + 110 * Math.cos((x * Math.PI) / 180) * -1, 110 - 110 * Math.sin((x * Math.PI) / 180), 'acc thick') : S.line(80, 110, 290, 110, 'ln thick') + S.line(80, 110, 80, 10, 'ln thick') + S.rightAngle(80, 110, 12, 1, -1) + S.line(80, 110, 80 + 150 * Math.cos((x * Math.PI) / 180), 110 - 150 * Math.sin((x * Math.PI) / 180), 'acc thick');
          v += S.text(sup ? 250 : 190, sup ? 96 : 100, sup ? 'x°' : 'x°', { cls: 'tx lbl' }) + S.text(sup ? 90 : 122, sup ? 96 : 36, `(${m}x ${k > 0 ? '+' : '−'} ${Math.abs(k)})°`, { cls: 'tx lbl' });
          return {
            prompt: T`Two angles are ${sup ? 'supplementary' : 'complementary'}. The larger one is ${Math.abs(k)}° ${k > 0 ? 'more' : 'less'} than ${TIMES[m]} the smaller. Find both angles.`,
            visual: S.svg(W, Hh, v, sup ? 'Two angles on a straight line' : 'Two angles that make a right angle'),
            parts: [
              { label: 'a', ask: 'Smaller angle', kind: 'num', answer: String(x), post: 'degrees', points: 1 },
              { label: 'b', ask: 'Larger angle', kind: 'num', answer: String(big), post: 'degrees', points: 1 },
            ],
            solution: [T`${sup ? 'Supplementary' : 'Complementary'} angles add to ${total}°: \(x + \left(${m}x ${sg(k)}\right) = ${total}\).`, T`\(${m + 1}x = ${total - k}\), so \(x = ${x}\) and the other is \(${big}\).`, T`\(${H.box(x + '^{\\circ}\\text{ and }' + big + '^{\\circ}')}\)`],
          };
        },
      },
      sail: {
        name: 'Triangle area',
        gen(rng) {
          const b = rng.int(3, 20), h = rng.int(4, 30), A = (b * h) / 2, findH = rng.chance(0.5);
          const W = 300, Hh = 180;
          let v = S.line(150, 10, 150, 160, 'ln thick') + S.poly([[152, 20], [152, 150], [262, 150]], 'ln soft') + S.path('M60 160 L240 160 L220 176 L80 176 Z', 'ln wood');
          v += S.label(160, 90, findH ? 'h = ?' : h + ' ft', { cls: findH ? 'qm' : 'lbl', a: 'start' }) + S.label(207, 144, findH ? b + ' ft' : 'b = ?', { cls: findH ? 'lbl' : 'qm' }) + S.text(188, 128, 'A = ' + MX.num(A) + ' ft²', { cls: 'tx small' });
          return {
            prompt: findH ? T`A triangular sail has an area of ${MX.num(A)} square feet and a base of ${b} feet. How tall is it?` : T`A triangular sail is ${h} feet tall and has an area of ${MX.num(A)} square feet. How long is its base?`,
            visual: S.svg(W, Hh, v, 'A triangular sail with its base and height'),
            parts: [{ kind: 'num', answer: String(findH ? h : b), post: 'feet', show: (findH ? h : b) + '\\text{ ft}', points: 2 }],
            solution: [T`\(A = \frac{1}{2}bh\): \(${MX.num(A)} = \frac{1}{2}\cdot${findH ? b + '\\cdot h' : 'b\\cdot' + h}\)`, T`Multiply by 2: \(${MX.num(2 * A)} = ${findH ? b + 'h' : h + 'b'}\).`, T`\(${H.box((findH ? 'h = ' + h : 'b = ' + b) + '\\text{ ft}')}\)`],
          };
        },
      },
      trapezoid: {
        name: 'Trapezoid area',
        gen(rng) {
          const b1 = rng.int(3, 20), b2 = rng.int(b1 + 2, 34), h = rng.int(2, 16), A = (h * (b1 + b2)) / 2;
          if (!Number.isInteger(A * 2)) return this.gen(rng);
          const W = 320, Hh = 150;
          const v = S.poly([[40, 130], [290, 130], [230, 40], [90, 40]], 'ln soft') + S.line(110, 40, 110, 130, 'ln dash') + S.label(160, 32, b1 + ' m', { cls: 'lbl' }) + S.label(165, 146, 'b = ?', { cls: 'qm' }) + S.label(118, 90, h + ' m', { cls: 'lbl', a: 'start' }) + S.text(190, 96, 'A = ' + MX.num(A) + ' m²', { cls: 'tx small' });
          return {
            prompt: T`A garden bed is shaped like a trapezoid with area ${MX.num(A)} m². Its height is ${h} m and one base is ${b1} m. How long is the other base?`,
            visual: S.svg(W, Hh, v, 'A trapezoid with one base unknown'),
            parts: [{ kind: 'num', answer: String(b2), post: 'meters', show: b2 + '\\text{ m}', points: 2 }],
            solution: [T`\(A = \frac{1}{2}h\left(b_{1} + b_{2}\right)\): \(${MX.num(A)} = \frac{1}{2}\cdot${h}\left(${b1} + b\right)\)`, T`\(${MX.num(2 * A)} = ${h}\left(${b1} + b\right)\), so \(${b1} + b = ${b1 + b2}\) and \(b = ${b2}\).`, T`\(${H.box(b2 + '\\text{ m}')}\)`],
          };
        },
      },
    },
  });

  // ======================================================================
  // 2.4 coin, ticket & stamp, mixture, uniform motion (one variable)
  // ======================================================================
  const COINS = { n: ['nickels', 5], d: ['dimes', 10], q: ['quarters', 25] };
  MX.register({
    id: 'lq-applications', section: SEC, part: 3, title: 'Coins, tickets, mixtures and motion', kind: 'skill', sources: [ADD],
    slots: [
      { label: 'Coin problems', source: ADD, pool: ['coins'] },
      { label: 'Ticket and stamp problems', source: ADD, pool: ['tickets', 'stamps'] },
      { label: 'Mixture problems', source: ADD, pool: ['blend', 'solution'] },
      { label: 'Uniform motion', source: ADD, pool: ['meet', 'walkRun', 'late'] },
    ],
    lesson: T`<p>These problems all use one idea: <strong>number × value = total value</strong>, organized in a table.</p>
<table class="xy"><tr><th>Type</th><th>Number</th><th>Value</th><th>Total</th></tr><tr><td>dimes</td><td>\(x\)</td><td>0.10</td><td>\(0.10x\)</td></tr><tr><td>quarters</td><td>\(x - 4\)</td><td>0.25</td><td>\(0.25\left(x - 4\right)\)</td></tr></table>
<ul><li><strong>Coins, tickets, stamps</strong>: write every count in terms of one variable, then add the totals.</li>
<li><strong>Mixtures</strong>: amount × price (or percent) for each part adds up to the mixture's amount × price.</li>
<li><strong>Uniform motion</strong>: rate × time = distance. Moving toward each other, the distances add to the gap; one person doing two legs, the times add to the total time.</li></ul>`,
    variants: {
      coins: {
        name: 'Coins',
        gen(rng) {
          const [ka, kb] = rng.pick([['d', 'q'], ['n', 'd'], ['n', 'q'], ['q', 'd']]), A2 = COINS[ka], B2 = COINS[kb];
          const rel = rng.pick(['more', 'fewer', 'twice', 'three']), x = rng.int(4, 25), k = rng.int(2, 9);
          const other = rel === 'more' ? x + k : rel === 'fewer' ? x - k : rel === 'twice' ? 2 * x : 3 * x;
          if (other <= 0) return this.gen(rng);
          const V = x * A2[1] + other * B2[1], relTxt = rel === 'more' ? `${k} more ${B2[0]} than ${A2[0]}` : rel === 'fewer' ? `${k} fewer ${B2[0]} than ${A2[0]}` : `${rel === 'twice' ? 'twice' : 'three times'} as many ${B2[0]} as ${A2[0]}`;
          const oT = rel === 'more' ? 'x + ' + k : rel === 'fewer' ? 'x - ' + k : (rel === 'twice' ? 2 : 3) + 'x';
          const W = 340, Hh = 120;
          let v = '';
          for (let j = 0; j < 4; j++) v += I.coin(40 + j * 24, 50 + (j % 2) * 10, 14, A2[1] + '¢', 'soft');
          for (let j = 0; j < 4; j++) v += I.coin(170 + j * 28, 50 + (j % 2) * 8, 17, B2[1] + '¢', 'sun');
          v += S.text(76, 100, 'x ' + A2[0], { cls: 'tx small', w: 700 }) + S.text(212, 100, oT.replace('-', '−') + ' ' + B2[0], { cls: 'tx small', w: 700 }) + S.text(310, 30, 'total ' + money2(V / 100), { cls: 'tx small', w: 700, a: 'end' });
          return {
            prompt: T`A jar holds ${A2[0]} and ${B2[0]} worth ${money2(V / 100)} in all. There are ${relTxt}. How many of each coin are there?`,
            visual: S.svg(W, Hh, v, 'Two kinds of coins with a total value'),
            parts: [
              { label: 'a', ask: `Number of ${A2[0]}`, kind: 'num', answer: String(x), points: 1 },
              { label: 'b', ask: `Number of ${B2[0]}`, kind: 'num', answer: String(other), points: 1 },
            ],
            solution: [
              T`Let \(x\) = number of ${A2[0]}; then there are \(${oT}\) ${B2[0]}.`,
              T`Value in cents: \(${A2[1]}x + ${B2[1]}\left(${oT}\right) = ${V}\)`,
              T`Solve: \(x = ${x}\), so there are ${other} ${B2[0]}. \(${H.box(T`${x}\text{ ${A2[0]}},\ ${other}\text{ ${B2[0]}}`)}\)`,
            ],
          };
        },
      },
      tickets: {
        name: 'Tickets',
        gen(rng) {
          const pa = rng.int(8, 24), ps = rng.int(3, pa - 2), x = rng.int(20, 180), rel = rng.pick(['more', 'twice']), k = rng.int(10, 60);
          const s = rel === 'more' ? x + k : 2 * x, R = pa * x + ps * s;
          const ev = rng.pick(['a school concert', 'a science fair', 'a charity basketball game']);
          const W = 340, Hh = 130;
          const v = I.ticket(16, 22, 150, 44, 'ADULT $' + pa, 'soft') + I.ticket(16, 76, 150, 44, 'STUDENT $' + ps, 'soft2') + S.text(260, 56, 'revenue', { cls: 'tx small' }) + S.text(260, 80, $(R), { cls: 'tx', w: 700 });
          return {
            prompt: T`Tickets to ${ev} cost \$${pa} for adults and \$${ps} for students. ${rel === 'more' ? `There were ${k} more student tickets sold than adult tickets` : 'Twice as many student tickets as adult tickets were sold'}, and ticket sales totaled ${$(R)}. How many of each were sold?`,
            visual: S.svg(W, Hh, v, 'Adult and student tickets'),
            parts: [
              { label: 'a', ask: 'Adult tickets', kind: 'num', answer: String(x), points: 1 },
              { label: 'b', ask: 'Student tickets', kind: 'num', answer: String(s), points: 1 },
            ],
            solution: [T`Let \(a\) = adult tickets; student tickets \(= ${rel === 'more' ? 'a + ' + k : '2a'}\).`, T`\(${pa}a + ${ps}\left(${rel === 'more' ? 'a + ' + k : '2a'}\right) = ${R}\), so \(${pa + (rel === 'more' ? ps : 2 * ps)}a${rel === 'more' ? ' + ' + ps * k : ''} = ${R}\) and \(a = ${x}\).`, T`\(${H.box(T`${x}\text{ adult},\ ${s}\text{ student}`)}\)`],
          };
        },
      },
      stamps: {
        name: 'Stamps',
        gen(rng) {
          const [pa, pb] = rng.pick([[68, 24], [55, 15], [73, 40], [62, 18], [80, 35]]), x = rng.int(5, 30), k = rng.int(2, 8), rel = rng.pick(['fewer', 'more']);
          const y = rel === 'fewer' ? x - k : x + k;
          if (y <= 0) return this.gen(rng);
          const V = pa * x + pb * y;
          const v = stamp(30, 30, 70, 50, pa + '¢', 'soft') + stamp(120, 30, 70, 50, pb + '¢', 'soft2') + S.text(270, 50, 'spent', { cls: 'tx small' }) + S.text(270, 74, money2(V / 100), { cls: 'tx', w: 700 });
          return {
            prompt: T`Priya bought some ${pa}-cent stamps and some ${pb}-cent stamps for ${money2(V / 100)}. She bought ${k} ${rel} ${pb}-cent stamps than ${pa}-cent stamps. How many of each did she buy?`,
            visual: S.svg(340, 110, v, 'Two kinds of stamps'),
            parts: [
              { label: 'a', ask: `${pa}-cent stamps`, kind: 'num', answer: String(x), points: 1 },
              { label: 'b', ask: `${pb}-cent stamps`, kind: 'num', answer: String(y), points: 1 },
            ],
            solution: [T`Let \(x\) = number of ${pa}-cent stamps; then \(x ${rel === 'fewer' ? '-' : '+'} ${k}\) are ${pb}-cent stamps.`, T`\(${pa}x + ${pb}\left(x ${rel === 'fewer' ? '-' : '+'} ${k}\right) = ${V}\), so \(${pa + pb}x ${rel === 'fewer' ? '-' : '+'} ${pb * k} = ${V}\) and \(x = ${x}\).`, T`\(${H.box(T`${x}\text{ and }${y}`)}\)`],
          };
        },
      },
      blend: {
        name: 'Price blend',
        gen(rng) {
          const [thing, unit] = rng.pick([['coffee', 'pound'], ['trail mix', 'pound'], ['tea', 'ounce'], ['birdseed', 'pound']]);
          let a, b, c, Wt, x;
          do { a = rng.int(2, 16); b = rng.int(a + 2, 24); c = rng.int(a + 1, b - 1); Wt = rng.int(2, 20); x = (Wt * (b - c)) / (c - a); } while (!Number.isInteger(x) || x > 60);
          const v = I.bag(60, 110, '$' + a, 'soft') + S.text(60, 132, 'x ' + unit + 's', { cls: 'tx small' }) + S.text(112, 84, '+', { cls: 'tx', size: 22 }) + I.bag(160, 110, '$' + b, 'soft2') + S.text(160, 132, Wt + ' ' + unit + 's', { cls: 'tx small' }) + S.arrow(196, 84, 228, 84, 'acc', 8) + I.bag(275, 110, '$' + c, 'soft') + S.text(275, 132, 'mix', { cls: 'tx small' });
          return {
            prompt: T`A shop mixes ${thing} worth \$${a} per ${unit} with ${Wt} ${unit}s of ${thing} worth \$${b} per ${unit} to make a blend worth \$${c} per ${unit}. How many ${unit}s of the \$${a} ${thing} should it use?`,
            visual: S.svg(340, 140, v, 'Two prices mixed into a blend'),
            parts: [{ kind: 'num', answer: String(x), post: unit + 's', show: x + '\\text{ ' + unit + 's}', points: 3 }],
            solution: [T`Let \(x\) = ${unit}s of the \$${a} kind. The blend has \(x + ${Wt}\) ${unit}s.`, T`Value: \(${a}x + ${b}\cdot${Wt} = ${c}\left(x + ${Wt}\right)\)`, T`\(${a}x + ${b * Wt} = ${c}x + ${c * Wt}\), so \(${b * Wt - c * Wt} = ${c - a}x\) and \(${H.box('x = ' + x)}\)`],
          };
        },
      },
      solution: {
        name: 'Percent solution',
        gen(rng) {
          let p1, p2, p3, V, x;
          do { p1 = rng.int(1, 6) * 5; p2 = rng.int(8, 18) * 5; p3 = rng.int(p1 / 5 + 1, p2 / 5 - 1) * 5; V = rng.int(2, 20) * 5; x = (V * (p3 - p1)) / (p2 - p3); } while (!Number.isInteger(x) || x > 150);
          const unit = rng.pick(['ounces', 'milliliters', 'liters']);
          const v = I.beaker(30, 124, 60, 70, 0.5, p1 + '%') + S.text(60, 144, V + ' ' + unit, { cls: 'tx small' }) + S.text(118, 94, '+', { cls: 'tx', size: 22 }) + I.beaker(146, 124, 60, 70, 0.7, p2 + '%') + S.text(176, 144, 'x ' + unit, { cls: 'tx small' }) + S.text(236, 94, '=', { cls: 'tx', size: 22 }) + I.beaker(264, 124, 76, 80, 0.7, p3 + '%');
          return {
            prompt: T`How many ${unit} of a ${p2}% cleaning solution must be added to ${V} ${unit} of a ${p1}% solution to make a ${p3}% solution?`,
            visual: S.svg(360, 150, v, 'Two solutions of different strengths mixed'),
            parts: [{ kind: 'num', answer: String(x), post: unit, show: x + '\\text{ ' + unit + '}', points: 3 }],
            solution: [T`Pure cleaner in each part: \(${p1 / 100}\cdot${V} + ${p2 / 100}x = ${p3 / 100}\left(${V} + x\right)\)`, T`\(${MX.num((p1 * V) / 100)} + ${p2 / 100}x = ${MX.num((p3 * V) / 100)} + ${p3 / 100}x\), so \(${MX.num((p2 - p3) / 100)}x = ${MX.num(((p3 - p1) * V) / 100)}\)`, T`\(${H.box('x = ' + x)}\) ${unit}`],
          };
        },
      },
      meet: {
        name: 'Toward each other: when do they meet?',
        gen(rng) {
          const r1 = rng.int(2, 5), r2 = rng.int(8, 18), tMin = rng.pick([30, 45, 60, 90, 120]), t = tMin / 60, D = (r1 + r2) * t;
          if (!Number.isInteger(D * 4)) return this.gen(rng);
          const W = 360, Hh = 130;
          let v = S.rect(20, 76, W - 40, 14, 'road nostroke') + I.person(50, 76, 34) + I.car(310, 76, true, 'soft2');
          v += S.arrow(70, 44, 110, 44, 'acc', 7) + S.arrow(290, 44, 250, 44, 'acc', 7) + S.label(60, 30, 'walks ' + r1 + ' mph', { cls: 'lbl', a: 'start' }) + S.label(300, 30, 'bikes ' + r2 + ' mph', { cls: 'lbl', a: 'end' }) + S.dim(30, 110, W - 30, 110, MX.num(D) + ' miles apart');
          return {
            prompt: T`Lena and Omar are ${MX.num(D)} miles apart on a trail and start toward each other at the same time. Lena walks at ${r1} mph and Omar bikes at ${r2} mph. How long until they meet? Give the answer in hours.`,
            visual: S.svg(W, Hh, v, 'A walker and a cyclist approaching each other'),
            parts: [{ kind: 'num', answer: MX.num(t), post: 'hours', show: MX.num(t) + '\\text{ h}', points: 3 }],
            solution: [T`In \(t\) hours they cover \(${r1}t\) and \(${r2}t\) miles; together that's the ${MX.num(D)} miles between them.`, T`\(${r1}t + ${r2}t = ${MX.num(D)}\), so \(${r1 + r2}t = ${MX.num(D)}\).`, T`\(t = ${H.box(MX.num(t) + '\\text{ hours}')}\) (${tMin} minutes)`],
          };
        },
      },
      walkRun: {
        name: 'Two speeds on one trip',
        gen(rng) {
          const r1 = rng.int(5, 9), r2 = rng.int(2, r1 - 2), Tt = rng.pick([1.5, 2, 2.5, 3]), t1 = rng.pick([0.5, 1, 1.5, 2].filter((x) => x < Tt));
          const D = r1 * t1 + r2 * (Tt - t1);
          const W = 360, Hh = 120;
          const v = S.line(30, 70, 200, 70, 'acc thick') + S.line(200, 70, 330, 70, 'ln thick dash') + [30, 200, 330].map((x) => S.circle(x, 70, 6, 'paperf acc')).join('') + S.label(115, 54, 'jog ' + r1 + ' mph', { cls: 'lbl' }) + S.label(265, 54, 'walk ' + r2 + ' mph', { cls: 'lbl' }) + S.text(180, 102, MX.num(D) + ' miles in ' + MX.num(Tt) + ' hours total', { cls: 'tx small' });
          return {
            prompt: T`Mateo covered a ${MX.num(D)}-mile route in ${MX.num(Tt)} hours. He jogged part of the way at ${r1} mph and walked the rest at ${r2} mph. How long did he jog?`,
            visual: S.svg(W, Hh, v, 'A route with a jogging part and a walking part'),
            parts: [{ kind: 'num', answer: MX.num(t1), post: 'hours', show: MX.num(t1) + '\\text{ h}', points: 3 }],
            solution: [T`Let \(t\) = hours jogging; walking time is \(${MX.num(Tt)} - t\).`, T`Distances add: \(${r1}t + ${r2}\left(${MX.num(Tt)} - t\right) = ${MX.num(D)}\)`, T`\(${r1 - r2}t + ${MX.num(r2 * Tt)} = ${MX.num(D)}\), so \(t = ${H.box(MX.num(t1) + '\\text{ h}')}\)`],
          };
        },
      },
      late: {
        name: 'Late start: catching up',
        gen(rng) {
          const r1 = rng.pick([30, 36, 40, 45, 48, 50]), gapMin = rng.pick([15, 20, 30, 45]), g = gapMin / 60, r2 = rng.pick([r1 + 10, r1 + 12, r1 + 15, r1 + 20, r1 + 24, r1 + 30]);
          const t = (r1 * g) / (r2 - r1);
          if (!Number.isInteger(t * 60)) return this.gen(rng);
          const W = 360, Hh = 120;
          const v = S.rect(20, 76, W - 40, 14, 'road nostroke') + I.car(250, 76, false, 'soft2') + I.car(90, 76, false) + S.label(250, 44, 'bus ' + r1 + ' mph', { cls: 'lbl' }) + S.label(90, 44, 'car ' + r2 + ' mph', { cls: 'lbl' }) + S.text(170, 112, 'car leaves ' + gapMin + ' minutes later', { cls: 'tx small' });
          return {
            prompt: T`A bus leaves a station at ${r1} mph. ${gapMin} minutes later, a car leaves the same station on the same road at ${r2} mph. How many minutes after the car leaves does it catch up to the bus?`,
            visual: S.svg(W, Hh, v, 'A bus with a head start and a faster car'),
            parts: [{ kind: 'num', answer: String(t * 60), post: 'minutes', show: t * 60 + '\\text{ min}', points: 3 }],
            solution: [T`Work in hours: the head start is \(${MX.num(g)}\) h. Let \(t\) = the car's time; the bus has driven \(t + ${MX.num(g)}\) h.`, T`Equal distances: \(${r2}t = ${r1}\left(t + ${MX.num(g)}\right)\), so \(${r2 - r1}t = ${MX.num(r1 * g)}\) and \(t = ${MX.num(t)}\) h.`, T`\(${H.box(t * 60 + '\\text{ minutes}')}\)`],
          };
        },
      },
    },
  });

  // ======================================================================
  // 2.5 linear inequalities and interval notation
  // ======================================================================
  function solveLin(rng) { // a x + b  op  c x + d with an integer or fractional boundary
    let a, b, c, d, v;
    do { a = rng.nz(-7, 8); c = rng.int(-6, 6); b = rng.int(-15, 15); d = rng.int(-20, 20); } while (a === c || (v = new Q(d - b, a - c), v.d > 4 || Math.abs(v.val()) > 12));
    const op = rng.pick(OPS), k = a - c, fop = k < 0 ? FLIP[op] : op;
    return { a, b, c, d, op, k, fop, v, reg: ray(v.d === 1 ? v.n : v, fop) };
  }
  MX.register({
    id: 'lq-linear-ineq', section: SEC, part: 3, title: 'Linear inequalities and interval notation', kind: 'skill', sources: [ADD],
    slots: [
      { label: 'Number line and interval notation', source: ADD, pool: ['toInterval', 'fromGraph'] },
      { label: 'Solve linear inequalities', source: ADD, pool: ['solve', 'fractions'] },
      { label: 'Translate and solve', source: ADD, pool: ['translate'] },
      { label: 'Inequality applications', source: ADD, pool: ['profit', 'rental', 'fundraiser'] },
    ],
    lesson: T`<p><strong>Interval notation</strong> lists the smallest and largest values of a solution set:</p>
<table class="xy"><tr><th>Inequality</th><th>Interval</th><th>Graph</th></tr>
<tr><td>\(x \gt 3\)</td><td>\((3, \infty)\)</td><td>open dot at 3, shade right</td></tr>
<tr><td>\(x \le -1\)</td><td>\((-\infty, -1]\)</td><td>closed dot at \(-1\), shade left</td></tr>
<tr><td>\(-2 \lt x \le 5\)</td><td>\((-2, 5]\)</td><td>open at \(-2\), closed at 5</td></tr></table>
<p>A parenthesis means the endpoint is <em>not</em> included; a bracket means it is. \(\infty\) always takes a parenthesis.</p>
<p><strong>Solving</strong> works like an equation, except: <strong>multiplying or dividing by a negative number reverses the inequality sign.</strong></p>
<p>Word clues: at least \(\ge\), at most \(\le\), more than \(\gt\), less than \(\lt\), no more than \(\le\), minimum \(\ge\), maximum \(\le\).</p>`,
    variants: {
      toInterval: {
        name: 'Inequality to interval notation',
        gen(rng) {
          const kind = rng.pick(['ray', 'ray', 'between']);
          let reg, tex;
          if (kind === 'ray') { const v = rng.int(-9, 9), op = rng.pick(OPS); reg = ray(v, op); tex = rng.chance(0.3) ? T`${v} ${OPT[FLIP[op]]} x` : T`x ${OPT[op]} ${v}`; }
          else { const lo = rng.int(-9, 4), hi = rng.int(lo + 1, 10), lc = rng.chance(0.5), hc = rng.chance(0.5); reg = [H.iv(lo, hi, lc, hc)]; tex = T`${lo} ${lc ? '\\le' : '\\lt'} x ${hc ? '\\le' : '\\lt'} ${hi}`; }
          return {
            prompt: T`Graph \(${tex}\) on the number line and write it in interval notation.`,
            parts: [ivPart(reg, 1, { label: 'a', ask: 'Interval notation' }), graphPart(rng, reg, 'b')],
            solution: [T`${kind === 'ray' ? 'One endpoint; the other side goes on forever (∞ with a parenthesis).' : 'Two endpoints: brackets where the endpoint is included (≤), parentheses where it is not (<).'}`, T`\(${H.box(H.regionTex(reg))}\)`],
          };
        },
      },
      fromGraph: {
        name: 'Graph to interval notation',
        gen(rng) {
          const kind = rng.pick(['ray', 'between']);
          let reg;
          if (kind === 'ray') reg = ray(rng.int(-8, 8), rng.pick(OPS));
          else { const lo = rng.int(-8, 3), hi = rng.int(lo + 2, 9); reg = [H.iv(lo, hi, rng.chance(0.5), rng.chance(0.5))]; }
          return {
            prompt: T`Write the set shown on the number line in interval notation.`,
            visual: H.regionSvg(reg, null, { w: 300 }),
            parts: [ivPart(reg, 2)],
            solution: [T`Filled dot ● → bracket; open dot ○ → parenthesis; an arrow → \(\infty\) or \(-\infty\).`, T`\(${H.box(H.regionTex(reg))}\)`],
          };
        },
      },
      solve: {
        name: 'Solve and graph',
        gen(rng) {
          const s = solveLin(rng);
          const Lt = MX.lin(s.a, s.b).tex, Rt = s.c ? MX.lin(s.c, s.d).tex : String(s.d);
          return {
            prompt: T`Solve \(${Lt} ${OPT[s.op]} ${Rt}\). Graph the solution and write it in interval notation.`,
            parts: [ivPart(s.reg, 2, { label: 'a', ask: 'Solution (interval notation)' }), graphPart(rng, s.reg, 'b')],
            solution: [
              T`Collect terms: \(${s.k}x ${OPT[s.op]} ${s.d - s.b}\)`,
              T`Divide by ${s.k}${s.k < 0 ? ' — a negative, so reverse the sign' : ''}: \(x ${OPT[s.fop]} ${s.v.tex()}\)`,
              T`\(${H.box(H.regionTex(s.reg))}\)`,
            ],
          };
        },
      },
      fractions: {
        name: 'With fractions',
        gen(rng) {
          const q = rng.pick([2, 3, 4, 5, 6]), p = rng.pick([1, 1, 2, 3, -1, -2].filter((x) => MX.gcd(Math.abs(x), q) === 1)), b = rng.int(-9, 9), v = rng.int(-6, 6);
          const c = new Q(p * v, q).add(b), op = rng.pick(OPS), fop = p < 0 ? FLIP[op] : op, reg = ray(v, fop);
          return {
            prompt: T`Solve \(${p < 0 ? '-' : ''}\frac{${Math.abs(p)}}{${q}}x ${sg(b)} ${OPT[op]} ${c.tex()}\) and write the solution in interval notation.`,
            parts: [ivPart(reg, 3)],
            solution: [T`${b > 0 ? 'Subtract ' + b : 'Add ' + -b}: \(${p < 0 ? '-' : ''}\frac{${Math.abs(p)}}{${q}}x ${OPT[op]} ${c.sub(b).tex()}\)`, T`Multiply by \(${new Q(q, p).tex()}\)${p < 0 ? ' (negative: reverse the sign)' : ''}: \(x ${OPT[fop]} ${v}\)`, T`\(${H.box(H.regionTex(reg))}\)`],
          };
        },
      },
      translate: {
        name: 'Translate words',
        gen(rng) {
          const n = rng.int(2, 9), k = rng.int(2, 25), m = rng.int(-10, 40), op = rng.pick(OPS);
          const words = { '<': 'is less than', '<=': 'is at most', '>': 'is more than', '>=': 'is at least' }[op];
          const forms = [
            { w: `${k} more than a number ${words} ${m}.`, a: 1, b: k },
            { w: `${TIMES[n] || n + ' times'} a number, decreased by ${k}, ${words} ${m}.`, a: n, b: -k },
            { w: `The sum of ${TIMES[n] || n + ' times'} a number and ${k} ${words} ${m}.`, a: n, b: k },
          ];
          const F = rng.pick(forms), v = new Q(m - F.b, F.a), reg = ray(v.d === 1 ? v.n : v, op);
          return {
            prompt: T`Translate into an inequality and solve (let \(x\) be the number): ${F.w} Write the solution in interval notation.`,
            parts: [ivPart(reg, 2)],
            solution: [T`“${words}” means \(${OPT[op]}\): \(${MX.lin(F.a, F.b).tex} ${OPT[op]} ${m}\)`, T`\(x ${OPT[op]} ${v.tex()}\)`, T`\(${H.box(H.regionTex(reg))}\)`],
          };
        },
      },
      profit: {
        name: 'Break-even and profit',
        gen(rng) {
          const F = rng.int(6, 40) * 25, c = rng.int(2, 12), p = c + rng.int(3, 15), item = rng.pick(['cakes', 'T-shirts', 'candles', 'bird houses']);
          const need = Math.floor(F / (p - c)) + 1;
          const v = I.cupcake(60, 110, 50) + S.text(170, 40, 'fixed cost ' + $(F), { cls: 'tx small', w: 700, a: 'start' }) + S.text(170, 62, 'cost ' + $(c) + ' each', { cls: 'tx small', a: 'start' }) + S.text(170, 84, 'sells for ' + $(p) + ' each', { cls: 'tx small', a: 'start' }) + S.text(170, 110, 'profit when revenue > cost', { cls: 'tx small mut', a: 'start' });
          return {
            prompt: T`A small business making ${item} has fixed costs of ${$(F)} a month, plus ${$(c)} to make each one. It sells them for ${$(p)} each. How many must it sell in a month to make a profit (revenue greater than cost)?`,
            visual: S.svg(340, 130, v, 'Costs and price of a product'),
            parts: [{ kind: 'num', answer: String(need), ask: `The smallest number of ${item}`, points: 3 }],
            solution: [T`Revenue \(${p}x\), cost \(${F} + ${c}x\). Profit means \(${p}x \gt ${F} + ${c}x\).`, T`\(${p - c}x \gt ${F}\), so \(x \gt ${MX.num(F / (p - c), 3)}\).`, T`${Number.isInteger(F / (p - c)) ? 'Selling exactly ' + F / (p - c) + ' only breaks even, so' : 'Rounding up,'} the smallest whole number is \(${H.box(String(need))}\).`],
          };
        },
      },
      rental: {
        name: 'Budget limit',
        gen(rng) {
          const a = rng.int(20, 80), b = rng.pick([0.2, 0.25, 0.3, 0.4, 0.5, 0.75]), B = a + b * rng.int(40, 400) + rng.int(0, 9) * 0.1, mx = Math.floor((B - a) / b + 1e-9);
          const v = S.svg(340, 120, I.car(70, 100, false, 'soft2') + S.text(150, 44, 'rental: ' + $(a) + ' a day', { cls: 'tx small', w: 700, a: 'start' }) + S.text(150, 66, '+ ' + money2(b) + ' per mile', { cls: 'tx small', a: 'start' }) + S.text(150, 92, 'budget: at most ' + money2(B), { cls: 'tx small', w: 700, a: 'start' }), 'A rental with a daily fee and a per-mile charge');
          return {
            prompt: T`A one-day truck rental costs ${$(a)} plus ${money2(b)} per mile. Dev can spend at most ${money2(B)}. What is the greatest whole number of miles he can drive?`,
            visual: v,
            parts: [{ kind: 'num', answer: String(mx), post: 'miles', points: 3 }],
            solution: [T`\(${a} + ${b}m \le ${MX.money(B)}\)`, T`\(${b}m \le ${MX.money(B - a)}\), so \(m \le ${MX.num((B - a) / b, 3)}\).`, T`Round down: \(${H.box(mx + '\\text{ miles}')}\)`],
          };
        },
      },
      fundraiser: {
        name: 'Reach a goal',
        gen(rng) {
          const p = rng.pick([5, 8, 10, 12, 15, 20]), cost = rng.int(4, 40) * 25, goal = rng.int(4, 60) * 50, need = Math.ceil((goal + cost) / p - 1e-9);
          const v = S.svg(340, 110, I.ticket(20, 30, 140, 46, 'RAFFLE $' + p, 'soft') + S.text(190, 44, 'prizes cost ' + $(cost), { cls: 'tx small', a: 'start' }) + S.text(190, 68, 'goal: at least ' + $(goal) + ' profit', { cls: 'tx small', w: 700, a: 'start' }), 'Raffle tickets and a fundraising goal');
          return {
            prompt: T`A club sells raffle tickets for ${$(p)} each. The prizes cost ${$(cost)}. The club wants a profit of at least ${$(goal)}. What is the fewest tickets it must sell?`,
            visual: v,
            parts: [{ kind: 'num', answer: String(need), post: 'tickets', points: 3 }],
            solution: [T`Profit \(= ${p}t - ${cost} \ge ${goal}\)`, T`\(${p}t \ge ${goal + cost}\), so \(t \ge ${MX.num((goal + cost) / p, 3)}\).`, T`Round up: \(${H.box(need + '\\text{ tickets}')}\)`],
          };
        },
      },
    },
  });

  // ======================================================================
  // 2.6 compound inequalities
  // ======================================================================
  function interReg(r1, r2) { // intersection of two rays/intervals (single intervals)
    const lo = Math.max(r1.lo === -INF ? -INF : +r1.lo, r2.lo === -INF ? -INF : +r2.lo), hi = Math.min(r1.hi === INF ? INF : +r1.hi, r2.hi === INF ? INF : +r2.hi);
    if (lo > hi) return [];
    const lc = (+r1.lo === lo ? r1.lc : true) && (+r2.lo === lo ? r2.lc : true), hc = (+r1.hi === hi ? r1.hc : true) && (+r2.hi === hi ? r2.hc : true);
    if (lo === hi && !(lc && hc)) return [];
    if (lo === hi) return null; // a single point: avoided
    return [H.iv(lo, hi, lc, hc)];
  }
  function unionReg(r1, r2) {
    const all = [r1, r2].map((r) => ({ lo: +r.lo, hi: +r.hi, lc: r.lc, hc: r.hc })).sort((a, b) => a.lo - b.lo);
    const out = [];
    for (const x of all) {
      const last = out[out.length - 1];
      if (last && (x.lo < last.hi || (x.lo === last.hi && (x.lc || last.hc)))) { if (x.hi > last.hi || (x.hi === last.hi && x.hc)) { last.hi = x.hi; last.hc = x.hc; } }
      else out.push(Object.assign({}, x));
    }
    return out.map((r) => H.iv(r.lo, r.hi, r.lc, r.hc));
  }
  function simpleIneq(rng) { // a x + b op c with integer solution
    const a = rng.nz(-6, 6), v = rng.int(-9, 9), b = rng.int(-12, 12), op = rng.pick(OPS), c = a * v + b, fop = a < 0 ? FLIP[op] : op;
    return { tex: T`${MX.lin(a, b).tex} ${OPT[op]} ${c}`, a, b, c, op, fop, v, r: ray(v, fop)[0], step: T`\(${MX.lin(a, b).tex} ${OPT[op]} ${c}\) → \(${a}x ${OPT[op]} ${c - b}\) → \(x ${OPT[fop]} ${v}\)${a < 0 ? ' (divided by a negative, so the sign reversed)' : ''}` };
  }
  MX.register({
    id: 'lq-compound', section: SEC, part: 3, title: 'Compound inequalities', kind: 'skill', sources: [ADD],
    slots: [
      { label: '“And” inequalities', source: ADD, pool: ['double', 'andParts'] },
      { label: '“Or” inequalities', source: ADD, pool: ['or'] },
      { label: 'Compound inequality applications', source: ADD, pool: ['temperature', 'plan'] },
    ],
    lesson: T`<p>A <strong>compound inequality</strong> joins two inequalities with <em>and</em> or <em>or</em>.</p>
<ul><li><strong>And</strong>: the solution is where <em>both</em> are true, the <strong>overlap</strong> (intersection). A double inequality like \(-3 \lt 2x + 1 \le 7\) is an “and”: do the same thing to all three parts, and reverse <em>both</em> signs if you divide by a negative.</li>
<li><strong>Or</strong>: the solution is everything that makes <em>either</em> true, both pieces together (the <strong>union</strong>, written with \(\cup\)).</li></ul>
<p>Solve each part, graph both on one number line, then read off the overlap (and) or the combination (or). An “and” can have no solution; an “or” can cover all real numbers.</p>`,
    variants: {
      double: {
        name: 'Double inequality',
        gen(rng) {
          let a, b, lo, hi; do { a = rng.nz(-5, 6); b = rng.int(-10, 10); lo = rng.int(-8, 4); hi = rng.int(lo + 1, 9); } while (Math.abs(a) === 0);
          const lc = rng.chance(0.5), hc = rng.chance(0.5);
          const L = a * lo + b, U = a * hi + b;
          const reg = [H.iv(lo, hi, lc, hc)];
          const left = a > 0 ? L : U, right = a > 0 ? U : L, lsgn = a > 0 ? lc : hc, rsgn = a > 0 ? hc : lc;
          return {
            prompt: T`Solve \(${left} ${lsgn ? '\\le' : '\\lt'} ${MX.lin(a, b).tex} ${rsgn ? '\\le' : '\\lt'} ${right}\). Graph the solution and write it in interval notation.`,
            parts: [ivPart(reg, 2, { label: 'a', ask: 'Solution (interval notation)' }), graphPart(rng, reg, 'b')],
            solution: [T`Subtract ${b} from all three parts: \(${left - b} ${lsgn ? '\\le' : '\\lt'} ${a}x ${rsgn ? '\\le' : '\\lt'} ${right - b}\)`, T`Divide all three parts by ${a}${a < 0 ? ', reversing both signs (and then rewrite it smallest to largest)' : ''}: \(${lo} ${lc ? '\\le' : '\\lt'} x ${hc ? '\\le' : '\\lt'} ${hi}\)`, T`\(${H.box(H.regionTex(reg))}\)`],
          };
        },
      },
      andParts: {
        name: 'Two inequalities joined by “and”',
        gen(rng) {
          let p1, p2, reg; do { p1 = simpleIneq(rng); p2 = simpleIneq(rng); reg = interReg(p1.r, p2.r); } while (reg === null || (!reg.length && rng.chance(0.7)) || H.regionAsc(reg) === H.regionAsc([p1.r]) && rng.chance(0.6));
          return {
            prompt: T`Solve: \(${p1.tex}\) and \(${p2.tex}\). Write the solution in interval notation (or “no solution”).`,
            parts: [ivPart(reg, 3)],
            solution: [p1.step, p2.step, reg.length ? T`Both must hold: the overlap is \(${H.box(H.regionTex(reg))}\)` : T`The two pieces don't overlap: \(${H.box('\\text{no solution}')}\)`],
          };
        },
      },
      or: {
        name: '“Or” inequalities',
        gen(rng) {
          let p1, p2; do { p1 = simpleIneq(rng); p2 = simpleIneq(rng); } while (p1.fop[0] === p2.fop[0] && rng.chance(0.8));
          const reg = unionReg(p1.r, p2.r);
          return {
            prompt: T`Solve: \(${p1.tex}\) or \(${p2.tex}\). Write the solution in interval notation.`,
            parts: [ivPart(reg, 3)],
            solution: [p1.step, p2.step, T`Either one may hold: combine them. \(${H.box(H.regionTex(reg))}\)`],
          };
        },
      },
      temperature: {
        name: 'Temperature range',
        gen(rng) {
          const c1 = rng.pick([0, 5, 10, 15, 20]), c2 = c1 + rng.pick([5, 10, 15, 20]), f1 = (9 * c1) / 5 + 32, f2 = (9 * c2) / 5 + 32;
          const reg = [H.iv(c1, c2, true, true)];
          const v = S.svg(320, 150, I.thermo(60, 140, 120, 0.55) + S.text(110, 50, 'keep between', { cls: 'tx small', a: 'start' }) + S.text(110, 74, f1 + '°F and ' + f2 + '°F', { cls: 'tx', w: 700, a: 'start' }) + S.text(110, 104, 'F = (9/5)C + 32', { cls: 'tx small mut', a: 'start' }), 'A thermometer and a temperature range');
          return {
            prompt: T`A greenhouse must stay between ${f1}°F and ${f2}°F, inclusive. Using \(F = \frac{9}{5}C + 32\), what is the allowed range in degrees Celsius? Write it in interval notation.`,
            visual: v,
            parts: [ivPart(reg, 3)],
            solution: [T`\(${f1} \le \frac{9}{5}C + 32 \le ${f2}\)`, T`Subtract 32: \(${f1 - 32} \le \frac{9}{5}C \le ${f2 - 32}\). Multiply by \(\frac{5}{9}\): \(${c1} \le C \le ${c2}\).`, T`\(${H.box(H.regionTex(reg))}\)`],
          };
        },
      },
      plan: {
        name: 'Stay within a range',
        gen(rng) {
          const base = rng.int(15, 40), rate = rng.pick([0.05, 0.1, 0.15, 0.2, 0.25]), m1 = rng.int(1, 8) * 20, m2 = m1 + rng.int(2, 10) * 20;
          const lo = base + rate * m1, hi = base + rate * m2, reg = [H.iv(m1, m2, true, true)];
          const v = S.svg(320, 120, S.rect(40, 14, 60, 96, 'ln soft2', 8) + S.rect(46, 24, 48, 70, 'paperf nostroke') + S.text(140, 40, $(base) + ' a month', { cls: 'tx small', w: 700, a: 'start' }) + S.text(140, 62, '+ ' + money2(rate) + ' per minute', { cls: 'tx small', a: 'start' }) + S.text(140, 92, 'bill: ' + money2(lo) + ' to ' + money2(hi), { cls: 'tx small', w: 700, a: 'start' }), 'A phone plan and a bill range');
          return {
            prompt: T`A phone plan costs ${$(base)} a month plus ${money2(rate)} per minute of calls. Jo wants her bill to be at least ${money2(lo)} and at most ${money2(hi)}. How many minutes can she use? Write the answer in interval notation.`,
            visual: v,
            parts: [ivPart(reg, 3)],
            solution: [T`\(${MX.money(lo)} \le ${base} + ${rate}m \le ${MX.money(hi)}\)`, T`Subtract ${base}: \(${MX.money(lo - base)} \le ${rate}m \le ${MX.money(hi - base)}\). Divide by ${rate}: \(${m1} \le m \le ${m2}\).`, T`\(${H.box(H.regionTex(reg))}\)`],
          };
        },
      },
    },
  });

  // ======================================================================
  // 2.7 absolute value inequalities
  // ======================================================================
  function absIneq(rng, big) {
    const a = rng.pick([1, 1, 2, 3, 4, -2]), b = rng.nz(-9, 9), c = rng.int(1, 10), strict = rng.chance(0.5);
    const e1 = new Q(-c - b, a), e2 = new Q(c - b, a), lo = e1.val() < e2.val() ? e1 : e2, hi = e1.val() < e2.val() ? e2 : e1;
    const toV = (q) => (q.d === 1 ? q.n : q);
    const reg = big ? [H.iv(-INF, toV(lo), false, !strict), H.iv(toV(hi), INF, !strict, false)] : [H.iv(toV(lo), toV(hi), !strict, !strict)];
    return { a, b, c, strict, lo, hi, reg, e: MX.lin(a, b), op: big ? (strict ? '>' : '>=') : strict ? '<' : '<=' };
  }
  const A_ = (t) => T`\left|${t}\right|`;
  MX.register({
    id: 'lq-absineq', section: SEC, part: 3, title: 'Absolute value inequalities', kind: 'skill', sources: [ADD],
    slots: [
      { label: 'Absolute value “less than”', source: ADD, pool: ['lt', 'ltIsolate'] },
      { label: 'Absolute value “greater than”', source: ADD, pool: ['gt', 'gtIsolate'] },
      { label: 'Absolute value applications', source: ADD, pool: ['part', 'weight'] },
    ],
    lesson: T`<p>\(|X|\) is the distance of \(X\) from 0. Isolate the absolute value first, then:</p>
<ul><li><strong>Less than</strong>: \(|X| \lt a\) means \(-a \lt X \lt a\) (within \(a\) of 0: one piece, an “and”).</li>
<li><strong>Greater than</strong>: \(|X| \gt a\) means \(X \lt -a\) or \(X \gt a\) (farther than \(a\) from 0: two pieces, an “or”).</li></ul>
<p>The same holds with \(\le\) and \(\ge\) (brackets instead of parentheses).</p>
<p><strong>Special cases</strong> when the right side is negative: \(|X| \lt -3\) has <strong>no solution</strong> (a distance is never negative), and \(|X| \gt -3\) is true for <strong>all real numbers</strong>.</p>
<p><strong>Tolerance</strong>: “within \(t\) of \(L\)” is \(|x - L| \le t\), so \(L - t \le x \le L + t\).</p>`,
    variants: {
      lt: {
        name: 'Less than',
        gen(rng) {
          const q = absIneq(rng, false);
          return {
            prompt: T`Solve \(${A_(q.e.tex)} ${OPT[q.op]} ${q.c}\). Graph the solution and write it in interval notation.`,
            parts: [ivPart(q.reg, 2, { label: 'a', ask: 'Solution (interval notation)' }), graphPart(rng, q.reg, 'b')],
            solution: [T`Rewrite as one “between” statement: \(-${q.c} ${OPT[q.op]} ${q.e.tex} ${OPT[q.op]} ${q.c}\)`, T`Subtract ${q.b} and divide by ${q.a}${q.a < 0 ? ' (reverse the signs)' : ''}: the solutions are between \(${q.lo.tex()}\) and \(${q.hi.tex()}\).`, T`\(${H.box(H.regionTex(q.reg))}\)`],
          };
        },
      },
      ltIsolate: {
        name: 'Isolate first (less than)',
        gen(rng) {
          const neg = rng.chance(0.25), q = absIneq(rng, false), k = rng.pick([2, 3, 4]), m = rng.nz(-10, 10);
          if (neg) {
            const n = m - k * rng.int(1, 5);
            return {
              prompt: T`Solve \(${k}${A_(q.e.tex)} ${sg(m)} ${OPT[q.op]} ${n}\). Write the solution in interval notation (or “no solution”).`,
              parts: [ivPart([], 3)],
              solution: [T`Isolate: \(${A_(q.e.tex)} ${OPT[q.op]} ${new Q(n - m, k).tex()}\)`, T`An absolute value can't be less than a negative number.`, T`\(${H.box('\\text{no solution}')}\)`],
            };
          }
          const n = k * q.c + m;
          return {
            prompt: T`Solve \(${k}${A_(q.e.tex)} ${sg(m)} ${OPT[q.op]} ${n}\). Write the solution in interval notation.`,
            parts: [ivPart(q.reg, 3)],
            solution: [T`${m > 0 ? 'Subtract ' + m : 'Add ' + -m}, then divide by ${k}: \(${A_(q.e.tex)} ${OPT[q.op]} ${q.c}\)`, T`\(-${q.c} ${OPT[q.op]} ${q.e.tex} ${OPT[q.op]} ${q.c}\), so \(x\) is between \(${q.lo.tex()}\) and \(${q.hi.tex()}\).`, T`\(${H.box(H.regionTex(q.reg))}\)`],
          };
        },
      },
      gt: {
        name: 'Greater than',
        gen(rng) {
          const q = absIneq(rng, true);
          return {
            prompt: T`Solve \(${A_(q.e.tex)} ${OPT[q.op]} ${q.c}\). Graph the solution and write it in interval notation.`,
            parts: [ivPart(q.reg, 2, { label: 'a', ask: 'Solution (interval notation)' }), graphPart(rng, q.reg, 'b')],
            solution: [T`Split into two: \(${q.e.tex} ${OPT[q.op === '>' ? '<' : '<=']} -${q.c}\) or \(${q.e.tex} ${OPT[q.op]} ${q.c}\)`, T`Solve each: \(x\) is outside the interval from \(${q.lo.tex()}\) to \(${q.hi.tex()}\).`, T`\(${H.box(H.regionTex(q.reg))}\)`],
          };
        },
      },
      gtIsolate: {
        name: 'Isolate first (greater than)',
        gen(rng) {
          const neg = rng.chance(0.25), q = absIneq(rng, true), k = rng.pick([2, 3, 5]), m = rng.nz(-10, 10);
          if (neg) {
            const n = m - k * rng.int(1, 5);
            return {
              prompt: T`Solve \(${k}${A_(q.e.tex)} ${sg(m)} ${OPT[q.op]} ${n}\). Write the solution in interval notation.`,
              parts: [ivPart(H.ALLREAL, 3)],
              solution: [T`Isolate: \(${A_(q.e.tex)} ${OPT[q.op]} ${new Q(n - m, k).tex()}\)`, T`An absolute value is always \(\ge 0\), so it is always greater than a negative number.`, T`\(${H.box('(-\\infty, \\infty)')}\) (all real numbers)`],
            };
          }
          const n = k * q.c + m;
          return {
            prompt: T`Solve \(${k}${A_(q.e.tex)} ${sg(m)} ${OPT[q.op]} ${n}\). Write the solution in interval notation.`,
            parts: [ivPart(q.reg, 3)],
            solution: [T`Isolate: \(${A_(q.e.tex)} ${OPT[q.op]} ${q.c}\)`, T`Two pieces: \(${q.e.tex} ${OPT[q.op === '>' ? '<' : '<=']} -${q.c}\) or \(${q.e.tex} ${OPT[q.op]} ${q.c}\).`, T`\(${H.box(H.regionTex(q.reg))}\)`],
          };
        },
      },
      part: {
        name: 'Machine-part tolerance',
        gen(rng) {
          const L = rng.int(20, 90) / 10, t = rng.pick([0.02, 0.05, 0.1, 0.15, 0.2]), lo = Math.round((L - t) * 1000) / 1000, hi = Math.round((L + t) * 1000) / 1000;
          const reg = [H.iv(lo, hi, true, true)];
          const ch = H.choices(rng, T`\(\left|x - ${L}\right| \le ${t}\)`, [T`\(\left|x + ${L}\right| \le ${t}\)`, T`\(\left|x - ${t}\right| \le ${L}\)`, T`\(\left|x - ${L}\right| \ge ${t}\)`]);
          const v = S.svg(340, 110, S.rect(40, 40, 200, 26, 'ln soft2', 4) + S.rect(240, 44, 24, 18, 'ln soft', 2) + S.dim(40, 86, 240, 86, L + ' cm ± ' + t) + S.text(290, 58, 'bolt', { cls: 'tx small' }), 'A bolt with a target length and tolerance');
          return {
            prompt: T`A bolt is supposed to be ${L} cm long, and a bolt is accepted if its length \(x\) is within ${t} cm of that.`,
            visual: v,
            parts: [
              { label: 'a', ask: 'Which inequality describes an acceptable length?', kind: 'choice', options: ch.options, answer: ch.answer, points: 1 },
              ivPart(reg, 2, { label: 'b', ask: 'The acceptable lengths (interval notation)' }),
            ],
            solution: [T`“Within ${t} of ${L}”: the distance \(|x - ${L}|\) is at most ${t}.`, T`\(-${t} \le x - ${L} \le ${t}\), so \(${lo} \le x \le ${hi}\).`, T`\(${H.box(H.regionTex(reg))}\)`],
          };
        },
      },
      weight: {
        name: 'Package weight',
        gen(rng) {
          const L = rng.pick([12, 16, 18, 20, 24, 32]), t = rng.pick([0.25, 0.4, 0.5, 0.75]), lo = L - t, hi = L + t;
          const reg = [H.iv(-INF, lo, false, false), H.iv(hi, INF, false, false)];
          const v = S.svg(340, 110, I.box(40, 94, 90, 60, 'soft2') + S.text(85, 68, L + ' oz', { cls: 'tx', w: 700 }) + S.text(170, 50, 'rejected if the weight', { cls: 'tx small', a: 'start' }) + S.text(170, 72, 'is off by more than ' + t + ' oz', { cls: 'tx small', w: 700, a: 'start' }), 'A package with a labeled weight');
          return {
            prompt: T`A cereal box is labeled ${L} ounces. A quality check rejects a box whose weight \(w\) differs from ${L} oz by more than ${t} oz, that is, \(\left|w - ${L}\right| \gt ${t}\). Which weights are rejected? Write the answer in interval notation.`,
            visual: v,
            parts: [ivPart(reg, 3)],
            solution: [T`\(\left|w - ${L}\right| \gt ${t}\) means \(w - ${L} \lt -${t}\) or \(w - ${L} \gt ${t}\).`, T`\(w \lt ${lo}\) or \(w \gt ${hi}\).`, T`\(${H.box(H.regionTex(reg))}\)`],
          };
        },
      },
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);

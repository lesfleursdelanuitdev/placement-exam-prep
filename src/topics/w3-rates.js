/* Word problems: proportions, percent, inequalities from words, scientific notation in context */
(function (G) {
  'use strict';
  const MX = G.MX;
  const { Q, T, H, S } = MX;
  const I = S.I;
  const SEC = 'Word problems';
  const money2 = (v) => '$' + Number(MX.money(v)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const propSteps = (a, b, c, x, unitX) => [
    T`Set up a proportion with matching units on top and bottom: \(\dfrac{${a[0]}}{${a[1]}} = \dfrac{x}{${c}}\)`,
    T`Cross-multiply: \(${a[1]}x = ${a[0]}\cdot${c}\)`,
    T`\(x = \dfrac{${a[0]}\cdot${c}}{${a[1]}} = ${b}\)`,
    T`\(${H.box(x + (unitX ? '\\text{ ' + unitX + '}' : ''))}\)`,
  ];
  // ---------- independent checks (see src/verify.js) ----------
  const V = MX.V;
  // cents shown in a money string like "12.35" (the number the prompt displays)
  const centsOf = (s) => Math.round(parseFloat(String(s).replace(/[$,]/g, '')) * 100);
  // num/den rounded half up, exact integer arithmetic (num, den positive integers)
  const roundHalfUp = (num, den) => Math.floor((2 * num + den) / (2 * den));
  // the key (dollars) is num/den cents rounded to the nearest cent
  const centsIs = (num, den) => V.custom((a) => {
    const want = roundHalfUp(num, den);
    return V.close(a * 100, want, 1e-9) || 'the amount is $' + MX.money(want / 100) + ', not $' + MX.money(a);
  });
  // a proportion stated in the story, solved for x by root finding on [0, hi]
  // (linear, so 2,000 samples are plenty and keep it fast)
  const prop2 = (eq, hi) => V.solves(eq, { lo: 0, hi, n: 2000 });
  // plain number written out in the prompt ("45,000", "0.000034")
  const numOf = (s) => Number(String(s).replace(/,/g, ''));
  // value of a TeX "m \times 10^{e}" shown in the prompt
  const texSci = (t) => { const m = /^(-?[\d.]+) \\times 10\^\{(-?\d+)\}$/.exec(t); if (!m) throw new Error('not sci: ' + t); return parseFloat(m[1]) * Math.pow(10, +m[2]); };
  // the key is in scientific notation (1 <= |m| < 10) and equals the value computed from the prompt
  const sciIs = (f) => V.custom((a, part) => {
    const m = /^(-?[\d.]+) x 10\^(-?\d+)$/.exec(String(part.answer));
    if (!m || !(Math.abs(parseFloat(m[1])) >= 1 && Math.abs(parseFloat(m[1])) < 10)) return 'the key is not in scientific notation';
    const want = f();
    return V.close(a, want, 1e-9) || 'the value is ' + want + ', not ' + a;
  });
  // the relation a limit phrase states, read from its words: [op, n]
  const phraseRel = (s) => {
    const table = [[/no more than/i, '<='], [/at most/i, '<='], [/at least/i, '>='], [/minimum of/i, '>='], [/fewer than|less than/i, '<'], [/more than|taller than|greater than/i, '>']];
    const hit = table.find(([re]) => re.test(s));
    const n = /(\d+)/.exec(s);
    if (!hit || !n) throw new Error('cannot read the phrase: ' + s);
    return [hit[1], +n[1]];
  };
  const shirt = (x, y, cls) => S.path(`M${x - 22} ${y - 44} l12 -8 h20 l12 8 l10 14 l-10 6 l-4 -4 v34 h-36 v-34 l-4 4 l-10 -6 z`, 'ln ' + cls);

  // ================= PROPORTIONS =================
  const prop = {
    tax: {
      name: 'Sales tax',
      gen(rng) {
        let r, P1, T1, P2;
        do { r = rng.pick([5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5]); P1 = rng.int(15, 60); T1 = (P1 * r) / 100; P2 = rng.int(40, 160); } while (Math.round(T1 * 100) !== Math.round(T1 * 100 * 1000) / 1000 || Math.abs(T1 * 100 - Math.round(T1 * 100)) > 1e-9 || P2 === P1);
        const T2 = Math.round(P2 * r) / 100;
        const item = rng.pick(['sweater', 'jacket', 'backpack', 'pair of shoes', 'lamp']);
        const W = 360, Hh = 150;
        let v = shirt(70, 110, 'soft') + I.tag(40, 128, money2(P1), 'paperf') + S.text(70, 30, 'tax ' + money2(T1), { cls: 'tx small', w: 700 });
        v += shirt(250, 110, 'soft2') + I.tag(220, 128, money2(P2), 'paperf') + S.q(250, 30, 'tax = ?');
        return {
          prompt: T`If the sales tax on a ${money2(P1)} ${item} is ${money2(T1)}, find the sales tax on a ${money2(P2)} ${item}.`,
          visual: S.svg(W, Hh, v, 'Two items with price tags; the tax on the first is known'),
          parts: [{ kind: 'num', pre: '$', answer: MX.money(T2), tol: 0.006, show: '\\$' + MX.money(T2), points: 3, verify: centsIs(centsOf(MX.money(T1)) * P2, P1) }],
          solution: [
            T`Tax is proportional to price: \(\dfrac{\text{tax}}{\text{price}}\) is the same for both.`,
            T`\(\dfrac{${MX.money(T1)}}{${P1}} = \dfrac{x}{${P2}}\)`,
            T`\(x = \dfrac{${MX.money(T1)}\cdot${P2}}{${P1}} = ${MX.num((T1 * P2) / P1, 4)} \approx ${MX.money(T2)}\) (the tax rate is ${r}%)`,
            T`\(${H.box('\\$' + MX.money(T2))}\)`,
          ],
        };
      },
    },
    recipe: {
      name: 'Recipe scaling',
      gen(rng) {
        const [item, ing, unit] = rng.pick([['small cakes', 'sugar', 'grams'], ['cookies', 'flour', 'grams'], ['muffins', 'butter', 'grams'], ['pancakes', 'milk', 'milliliters']]);
        let n1, q1, n2, q2;
        do { n1 = rng.pick([4, 6, 8, 10, 12, 15, 16, 18, 20, 24]); q1 = rng.int(3, 40) * 5; n2 = rng.int(5, 60); q2 = (q1 * n2) / n1; } while (!Number.isInteger(q2) || n2 === n1 || n2 % n1 === 0);
        const W = 360, Hh = 150;
        let v = '';
        const shown = Math.min(n1, 12);
        for (let k = 0; k < shown; k++) v += I.cupcake(30 + (k % 6) * 30, 70 + Math.floor(k / 6) * 44, 24);
        if (n1 > 12) v += S.text(110, 138, '(' + n1 + ' in all)', { cls: 'tx small' });
        v += S.text(214, 70, '→', { cls: 'tx', size: 22 }) + I.bag(270, 116, '', 'soft2') + S.text(270, 96, q1 + ' g', { cls: 'tx small', w: 700 });
        if (unit === 'milliliters') v += S.text(270, 132, 'milk', { cls: 'tx small' });
        return {
          prompt: T`To make ${n1} ${item}, I need ${q1} ${unit} of ${ing}. How many ${unit} of ${ing} will I need to make ${n2} ${item}?`,
          visual: S.svg(W, Hh, v.replace(q1 + ' g', q1 + (unit === 'grams' ? ' g' : ' mL')), 'A batch of baked goods and the ingredient amount'),
          parts: [{ kind: 'num', answer: String(q2), show: q2 + '\\text{ ' + unit + '}', post: unit, points: 3, verify: prop2(`${q1}/${n1} = x/${n2}`, q1 * n2 + 10) }],
          solution: propSteps([q1, n1], q2, n2, q2, unit),
        };
      },
    },
    unitprice: {
      name: 'Unit price',
      gen(rng) {
        let k1, c1, k2, c2;
        do { k1 = rng.int(3, 12); c1 = rng.int(8, 60) * 25 / 100; k2 = rng.int(4, 30); c2 = (c1 * k2) / k1; } while (k2 === k1 || Math.abs(c2 * 100 - Math.round(c2 * 100)) > 1e-9);
        const item = rng.pick(['cans of soup', 'bottles of water', 'bags of chips', 'notebooks']);
        const W = 360, Hh = 140;
        let v = '';
        for (let k = 0; k < Math.min(k1, 6); k++) v += I.can(24 + k * 26, 110, 20, 40, '');
        v += S.text(100, 132, k1 + ' for ' + money2(c1), { cls: 'tx small', w: 700 }) + S.text(222, 88, '→', { cls: 'tx', size: 22 }) + S.q(290, 90, k2 + ' for ?');
        return {
          prompt: T`${k1} ${item} cost ${money2(c1)}. At the same price per item, how much do ${k2} ${item} cost?`,
          visual: S.svg(W, Hh, v, 'A group of items and their total price'),
          parts: [{ kind: 'num', pre: '$', answer: MX.money(c2), tol: 0.006, show: '\\$' + MX.money(c2), points: 3, verify: centsIs(centsOf(MX.money(c1)) * k2, k1) }],
          solution: propSteps([MX.money(c1), k1], MX.money(c2), k2, '\\$' + MX.money(c2)),
        };
      },
    },
    map: {
      name: 'Map scale',
      gen(rng) {
        const a = rng.pick([1, 1, 2]), b = rng.pick([10, 15, 20, 25, 40, 50, 60]), m = rng.int(3, 26) / 4;
        const d = (b * m) / a;
        const W = 360, Hh = 150;
        let v = S.rect(20, 14, 320, 110, 'ln soft', 4) + S.path('M40 100 Q120 40 190 80 T320 50', 'ln thin dash') + S.circle(60, 96, 5, 'accf nostroke') + S.circle(300, 54, 5, 'accf nostroke');
        v += S.text(60, 116, 'Oak City', { cls: 'tx small' }) + S.text(300, 44, 'Pine Bay', { cls: 'tx small' }) + S.label(180, 70, m + ' in on the map', { cls: 'lbl' });
        v += S.rect(210, 128, 60, 6, 'fillink nostroke') + S.text(240, 146, a + ' in = ' + b + ' mi', { cls: 'tx small' });
        return {
          prompt: T`On a map, ${a} inch${a > 1 ? 'es' : ''} represent${a > 1 ? '' : 's'} ${b} miles. Two cities are ${m} inches apart on the map. How far apart are they in real life?`,
          visual: S.svg(W, Hh, v, 'A map with a scale bar and two cities'),
          parts: [{ kind: 'num', answer: String(d), show: d + '\\text{ miles}', post: 'miles', points: 3, verify: prop2(`x/${m} = ${b}/${a}`, b * m + 10) }],
          solution: propSteps([b, a], d, m, d, 'miles'),
        };
      },
    },
    fuel: {
      name: 'Fuel use',
      gen(rng) {
        let g1, mpg, d2, g2;
        do { g1 = rng.int(5, 16); mpg = rng.int(18, 40); d2 = rng.int(4, 40) * 15; g2 = d2 / mpg; } while (!Number.isInteger(g2 * 2) || g2 === g1);
        const d1 = g1 * mpg;
        const W = 360, Hh = 140;
        let v = I.pump(30, 120) + S.text(46, 136, g1 + ' gal', { cls: 'tx small', w: 700 }) + I.ground(90, 350, 120) + I.car(150, 120, false);
        v += S.dim(110, 100, 330, 100, d1 + ' miles') + S.q(260, 60, d2 + ' miles → ? gal');
        return {
          prompt: T`A car used ${g1} gallons of gas to travel ${d1} miles. At that rate, how many gallons will it need to travel ${d2} miles?`,
          visual: S.svg(W, Hh, v, 'A gas pump and a car on a road'),
          parts: [{ kind: 'num', answer: String(g2), show: g2 + '\\text{ gallons}', post: 'gallons', points: 3, verify: prop2(`x/${d2} = ${g1}/${d1}`, d2 + g1 + 10) }],
          solution: propSteps([g1, d1], g2, d2, g2, 'gallons'),
        };
      },
    },
    wage: {
      name: 'Hourly pay',
      gen(rng) {
        let h1, rate, h2;
        do { h1 = rng.int(4, 30); rate = rng.int(30, 80) / 2; h2 = rng.int(5, 45); } while (h1 === h2);
        const e1 = h1 * rate, e2 = h2 * rate;
        const W = 360, Hh = 130;
        let v = I.clock(50, 60, 26) + S.text(50, 110, h1 + ' hours', { cls: 'tx small', w: 700 }) + S.text(110, 64, '→', { cls: 'tx', size: 20 }) + I.coin(160, 56, 16, '$') + S.text(160, 110, money2(e1), { cls: 'tx small', w: 700 });
        v += I.clock(250, 60, 26) + S.text(250, 110, h2 + ' hours', { cls: 'tx small', w: 700 }) + S.q(310, 64, '?');
        return {
          prompt: T`Luis earned ${money2(e1)} for working ${h1} hours. At the same hourly rate, how much will he earn for ${h2} hours?`,
          visual: S.svg(W, Hh, v, 'Hours worked and money earned'),
          parts: [{ kind: 'num', pre: '$', answer: MX.money(e2), tol: 0.006, show: '\\$' + MX.money(e2), points: 3, verify: centsIs(centsOf(MX.money(e1)) * h2, h1) }],
          solution: propSteps([MX.money(e1), h1], MX.money(e2), h2, '\\$' + MX.money(e2)),
        };
      },
    },
    paint: {
      name: 'Paint coverage',
      gen(rng) {
        let g1, cov, A2, g2;
        do { g1 = rng.int(1, 4); cov = rng.int(6, 16) * 25; A2 = rng.int(4, 60) * 50; g2 = (A2 * g1) / (g1 * cov); } while (!Number.isInteger(g2 * 2) || A2 === g1 * cov);
        const A1 = g1 * cov;
        const W = 360, Hh = 140;
        let v = I.can(26, 120, 40, 44, 'paint') + (g1 > 1 ? I.can(72, 120, 40, 44, 'paint') : '') + S.text(64, 136, g1 + ' gal', { cls: 'tx small', w: 700 });
        v += S.text(132, 88, 'covers', { cls: 'tx small' }) + S.rect(170, 30, 170, 90, 'ln soft2') + S.text(255, 70, MX.commas(A1) + ' sq ft', { cls: 'tx', w: 700 }) + S.q(255, 100, MX.commas(A2) + ' sq ft → ?');
        return {
          prompt: T`${g1} gallon${g1 > 1 ? 's' : ''} of paint cover${g1 > 1 ? '' : 's'} ${MX.commas(A1)} square feet. How many gallons are needed to cover ${MX.commas(A2)} square feet?`,
          visual: S.svg(W, Hh, v, 'Paint cans and the wall area they cover'),
          parts: [{ kind: 'num', answer: String(g2), show: g2 + '\\text{ gallons}', post: 'gallons', points: 3, verify: prop2(`x/${A2} = ${g1}/${A1}`, A2 + 10) }],
          solution: propSteps([g1, A1], g2, A2, g2, 'gallons'),
        };
      },
    },
  };
  const PROP_POOL = ['tax', 'recipe', 'unitprice', 'map', 'fuel', 'wage', 'paint'];
  MX.register({
    id: 'w-proportion', kind: 'word', section: SEC, title: 'Proportions & rates', sources: ['Exam 1 #21', 'Exam 2 #19'],
    slots: [
      { label: 'Proportion', source: 'Exam 1 #21', pool: PROP_POOL },
      { label: 'Proportion', source: 'Exam 2 #19', pool: PROP_POOL },
    ],
    lesson: T`<p>When two quantities grow together at a constant rate (tax and price, sugar and cakes, miles and gallons), their ratio stays the same.</p>
<ol><li>Write two equal fractions with the <em>same units in the same places</em>: \(\dfrac{180\text{ g}}{12\text{ cakes}} = \dfrac{x\text{ g}}{33\text{ cakes}}\).</li>
<li>Cross-multiply: \(12x = 180\cdot33\).</li><li>Divide: \(x = 495\) grams.</li></ol>
<p>Another way: find the unit rate first (15 g per cake), then multiply (\(15\cdot33\)). Round money to the nearest cent.</p>`,
    variants: prop,
  });

  // ================= PERCENT =================
  const pct = {
    score: {
      name: 'Percent correct',
      gen(rng) {
        const who = rng.pick(['Donovan', 'Aisha', 'Mei', 'Carlos', 'Priya']);
        let tot, c;
        do { tot = rng.pick([20, 25, 40, 50]); c = rng.int(Math.ceil(tot * 0.5), tot - 1); } while (((c / tot) * 100) % 1 !== 0);
        const w = tot - c, p = (c / tot) * 100;
        const W = 360, Hh = 30 + Math.ceil(tot / 10) * 22 + 10;
        let v = '';
        for (let k = 0; k < tot; k++) {
          const x = 30 + (k % 10) * 30, y = 20 + Math.floor(k / 10) * 22;
          v += S.rect(x, y, 24, 18, k < c ? 'ln soft' : 'ln paperf', 3) + S.text(x + 12, y + 13, k < c ? '✓' : '✗', { cls: 'tx small' + (k < c ? '' : ' mut') });
        }
        return {
          prompt: T`${who} took a test and got ${c} answers correct and ${w} incorrect. What was the percentage of correct answers?`,
          visual: S.svg(W, Hh, v, 'A grid of correct and incorrect answers'),
          parts: [{ kind: 'num', answer: String(p), show: p + '\\%', post: '%', points: 2, verify: prop2(`${c} = (x/100)(${c}+${w})`, 101) }],
          solution: [T`Total questions: \(${c} + ${w} = ${tot}\). (Don't divide by the ${w} wrong answers.)`, T`\(\dfrac{${c}}{${tot}} = ${MX.num(c / tot)}\)`, T`\(${MX.num(c / tot)}\times100 = ${H.box(p + '\\%')}\)`],
        };
      },
    },
    tip: {
      name: 'Tip',
      gen(rng) {
        const B = rng.int(1200, 9800) / 100, p = rng.pick([15, 18, 20, 22, 25]);
        // work in whole cents: B * p in floating point can land just under a half cent (12.3 * 15 = 184.4999…) and round the wrong way
        const tip = Math.round((Math.round(B * 100) * p) / 100) / 100, total = Math.round((B + tip) * 100) / 100;
        const W = 360, Hh = 150;
        let v = S.rect(110, 10, 140, 130, 'ln paperf', 3) + S.text(180, 32, 'RECEIPT', { cls: 'tx small', w: 700 }) + S.line(124, 42, 236, 42, 'ln thin dash');
        v += S.text(124, 64, 'meal', { cls: 'tx small', a: 'start' }) + S.text(236, 64, money2(B), { cls: 'tx small', a: 'end' });
        v += S.text(124, 86, 'tip ' + p + '%', { cls: 'tx small', a: 'start' }) + S.text(236, 86, '?', { cls: 'tx qm', a: 'end' });
        v += S.line(124, 98, 236, 98, 'ln thin') + S.text(124, 120, 'total', { cls: 'tx small', a: 'start', w: 700 }) + S.text(236, 120, '?', { cls: 'tx qm', a: 'end' });
        return {
          prompt: T`A meal costs ${money2(B)}. You want to leave a ${p}% tip. How much is the tip, and what is the total?`,
          visual: S.svg(W, Hh, v, 'A restaurant receipt with the tip and total missing'),
          parts: [
            { label: 'a', ask: 'Tip', kind: 'num', pre: '$', answer: MX.money(tip), tol: 0.006, show: '\\$' + MX.money(tip), points: 2, verify: centsIs(centsOf(MX.money(B)) * p, 100) },
            { label: 'b', ask: 'Total', kind: 'num', pre: '$', answer: MX.money(total), tol: 0.011, show: '\\$' + MX.money(total), points: 1, verify: centsIs(centsOf(MX.money(B)) * 100 + roundHalfUp(centsOf(MX.money(B)) * p, 100) * 100, 100) },
          ],
          solution: [T`${p}% as a decimal is ${p / 100}.`, T`Tip: \(${p / 100}\times${MX.money(B)} = ${MX.num((B * p) / 100, 4)} \approx ${MX.money(tip)}\)`, T`Total: \(${MX.money(B)} + ${MX.money(tip)} = ${MX.money(total)}\)`, T`\(${H.box(T`\$${MX.money(tip)},\ \$${MX.money(total)}`)}\)`],
        };
      },
    },
    change: {
      name: 'Percent increase or decrease',
      gen(rng) {
        const ctx = rng.pick([['The price of a bus pass', '$'], ['A town\'s population', ''], ['The number of students in a club', ''], ['The rent on an apartment', '$']]);
        let a, b2, pc;
        do { a = rng.int(4, 60) * 5; b2 = rng.int(4, 60) * 5; pc = ((b2 - a) / a) * 100; } while (a === b2 || Math.abs(pc) > 80 || Math.abs(pc * 10 - Math.round(pc * 10)) > 1e-9);
        const up = b2 > a;
        const W = 360, Hh = 150, sc = 100 / Math.max(a, b2);
        let v = S.rect(80, 130 - a * sc, 60, a * sc, 'soft ln') + S.rect(220, 130 - b2 * sc, 60, b2 * sc, 'soft2 ln') + I.ground(40, 320, 130);
        v += S.text(110, 146, 'before: ' + ctx[1] + a, { cls: 'tx small' }) + S.text(250, 146, 'after: ' + ctx[1] + b2, { cls: 'tx small' }) + S.arrow(150, 60, 208, 60, 'acc', 8) + S.q(180, 48, (up ? '+' : '−') + '?%');
        return {
          prompt: T`${ctx[0]} changed from ${ctx[1]}${MX.commas(a)} to ${ctx[1]}${MX.commas(b2)}. Find the percent ${up ? 'increase' : 'decrease'}.`,
          visual: S.svg(W, Hh, v, 'Two bars showing a value before and after a change'),
          parts: [{ kind: 'num', answer: String(Math.abs(pc)), tol: 0.051, show: Math.abs(pc) + '\\%', post: '%', points: 2, verify: prop2(`${b2} = ${a}(1 ${up ? '+' : '-'} x/100)`, 101) }],
          solution: [T`Percent change = \(\dfrac{\text{change}}{\text{original}}\times 100\). Divide by the <em>original</em> value.`, T`Change: \(${b2} - ${a} = ${b2 - a}\)`, T`\(\dfrac{${Math.abs(b2 - a)}}{${a}}\times100 = ${MX.num(Math.abs(pc))}\)`, T`\(${H.box(MX.num(Math.abs(pc)) + '\\%\\text{ ' + (up ? 'increase' : 'decrease') + '}')}\)`],
        };
      },
    },
    sale: {
      name: 'Sale price',
      gen(rng) {
        const P = rng.int(20, 300) - 0.01 * rng.pick([0, 0, 1]), p = rng.pick([10, 15, 20, 25, 30, 35, 40, 50]);
        const off = Math.round(P * p) / 100, sale = Math.round((P - off) * 100) / 100;
        const item = rng.pick(['a jacket', 'a bike helmet', 'a pair of headphones', 'a coffee maker']);
        const W = 360, Hh = 140;
        let v = I.tag(40, 60, money2(P), 'paperf') + S.line(56, 60, 56 + money2(P).length * 7.4 + 8, 60, 'acc thick') + S.text(90, 100, p + '% OFF', { cls: 'tx', w: 700, size: 18 });
        v += S.arrow(180, 60, 220, 60, 'acc', 8) + I.tag(230, 60, 'sale: ?', 'soft2');
        return {
          prompt: T`${item[0].toUpperCase() + item.slice(1)} regularly costs ${money2(P)}. It is on sale for ${p}% off. What is the sale price?`,
          visual: S.svg(W, Hh, v, 'A price tag with a percent-off discount'),
          parts: [{ kind: 'num', pre: '$', answer: MX.money(sale), tol: 0.011, show: '\\$' + MX.money(sale), points: 2, verify: V.custom((x) => {
            // the price you pay is (100 - p)% of the shown price; the key must be that amount to the nearest cent
            const exact = (centsOf(MX.money(P)) * (100 - p)) / 100;
            return Math.abs(x * 100 - exact) <= 0.5 + 1e-7 || 'the sale price is about $' + MX.num(exact / 100, 4) + ', not $' + MX.money(x);
          }) }],
          solution: [T`Discount: \(${p / 100}\times${MX.money(P)} \approx ${MX.money(off)}\)`, T`Sale price: \(${MX.money(P)} - ${MX.money(off)} = ${MX.money(sale)}\)`, T`(Shortcut: you pay ${100 - p}%, so \(${(100 - p) / 100}\times${MX.money(P)}\).) \(${H.box('\\$' + MX.money(sale))}\)`],
        };
      },
    },
    whole: {
      name: 'Find the whole',
      gen(rng) {
        let p, part, whole;
        do { p = rng.pick([10, 15, 20, 25, 30, 40, 45, 60, 75, 80]); whole = rng.int(8, 200); part = (p * whole) / 100; } while (!Number.isInteger(part) || part < 2);
        const ctx = rng.pick([
          (n) => [`${n} students in a class walk to school.`, 'of the class', 'How many students are in the class?'],
          (n) => [`${n} seats in a theater are filled.`, 'of all the seats', 'How many seats does the theater have?'],
          (n) => [`A team won ${n} games this season.`, 'of the games it played', 'How many games did the team play?'],
        ])(part);
        const W = 360, Hh = 110;
        let v = S.rect(30, 30, 300, 36, 'ln paperf') + S.rect(30, 30, 3 * p, 36, 'soft nostroke') + S.line(30 + 3 * p, 30, 30 + 3 * p, 66, 'ln');
        v += S.text(30 + 1.5 * p, 53, p + '% = ' + part, { cls: 'tx small', w: 700 }) + S.dim(30, 86, 330, 86, '100% = ?');
        return {
          prompt: T`${ctx[0]} That is ${p}% ${ctx[1]}. ${ctx[2]}`,
          visual: S.svg(W, Hh, v, 'A bar with part of it shaded to show a percent'),
          parts: [{ kind: 'num', answer: String(whole), show: String(whole), points: 2, verify: prop2(`${part} = (${p}/100)x`, 1000) }],
          solution: [T`"${part} is ${p}% of what number?" translates to \(${part} = ${p / 100}x\)`, T`\(x = \dfrac{${part}}{${p / 100}} = ${whole}\)`, T`\(${H.box(String(whole))}\)`],
        };
      },
    },
  };
  MX.register({
    id: 'w-percent', kind: 'word', section: SEC, title: 'Percent', sources: ['Exam 2 #25'],
    slots: [{ label: 'Percent', source: 'Exam 2 #25', pool: ['score', 'tip', 'change', 'sale', 'whole'] }],
    lesson: T`<p>Percent means "per hundred": \(p\% = \frac{p}{100}\).</p>
<ul><li><strong>What percent?</strong> \(\dfrac{\text{part}}{\text{whole}}\times100\). 40 correct out of 50 total: \(\frac{40}{50} = 0.8 = 80\%\). Use the <em>total</em>, not the number wrong.</li>
<li><strong>Percent of a number</strong>: change the percent to a decimal and multiply: 18% of \$40 is \(0.18\times40\).</li>
<li><strong>Percent change</strong>: \(\dfrac{\text{new} - \text{old}}{\text{old}}\times100\).</li>
<li><strong>Find the whole</strong>: part \(= \frac{p}{100}\times\) whole, so whole \(=\) part \(\div \frac{p}{100}\).</li></ul>`,
    variants: pct,
  });

  // ================= INEQUALITIES FROM WORDS =================
  const PHRASES = [
    { t: (n, w) => `${w} needs a score of at least ${n} on the final exam.`, op: '>=', what: (w) => `${w}'s score`, sign: 'EXAM', unit: 'points' },
    { t: (n) => `An elevator can safely carry at most ${n} pounds.`, op: '<=', what: () => 'the weight in the elevator', sign: 'MAX', unit: 'lb' },
    { t: (n) => `Riders must be taller than ${n} inches to ride the roller coaster.`, op: '>', what: () => 'a rider\'s height', sign: 'RIDE', unit: 'in' },
    { t: (n) => `On this road you may drive no more than ${n} miles per hour.`, op: '<=', what: () => 'your speed', sign: 'LIMIT', unit: 'mph' },
    { t: (n) => `Fewer than ${n} people are allowed in the room.`, op: '<', what: () => 'the number of people', sign: 'ROOM', unit: 'people' },
    { t: (n) => `A job requires a minimum of ${n} hours of training.`, op: '>=', what: () => 'the hours of training', sign: 'MIN', unit: 'hours' },
  ];
  const ineqNL = (rng, op, v, step) => H.nlChoices(rng, op, v, { min: v - 4 * step, max: v + 4 * step, step, labelEvery: 2 * step });
  const ineq = {
    phrase: {
      name: 'Translate a phrase',
      gen(rng) {
        const P = rng.pick(PHRASES), w = rng.pick(['Bill', 'Rosa', 'Kenji', 'Ana']);
        const step = rng.pick([1, 5, 10]), n = P.op === '<=' && P.unit === 'lb' ? rng.int(15, 30) * 100 : rng.int(4, 18) * 5;
        const st = P.unit === 'lb' ? 100 : step;
        const nl = ineqNL(rng, P.op, n, st);
        const W = 320, Hh = 120;
        let v = S.rect(90, 14, 140, 92, 'ln soft2', 10) + S.rect(98, 22, 124, 76, 'ln paperf', 6) + S.text(160, 46, P.sign, { cls: 'tx', w: 700, size: 15 }) + S.text(160, 80, n + ' ' + P.unit, { cls: 'tx', w: 700, size: 20 });
        // the relation the sentence states, read from its own words and number
        const [sop, sn] = phraseRel(P.t(n, w)), near = { lo: sn - 500, hi: sn + 500, n: 2000 };
        const said = (e) => ({ '<': e.x < sn, '<=': e.x <= sn, '>': e.x > sn, '>=': e.x >= sn })[sop];
        const words = { '>=': 'at least / minimum', '<=': 'at most / no more than', '>': 'more than / taller than', '<': 'less than / fewer than' }[P.op];
        return {
          prompt: T`${P.t(n, w)} Let \(x\) represent ${P.what(w)}.`,
          visual: S.svg(W, Hh, v, 'A sign showing the limit'),
          parts: [
            { label: 'a', ask: 'Write the phrase as an inequality.', kind: 'ineq', var: 'x', answer: 'x' + P.op + n, show: T`x ${H.rel(P.op)} ${n}`, points: 1, verify: V.region(said, near) },
            { label: 'b', ask: 'Which graph shows the inequality?', kind: 'choice', graph: true, options: nl.options, answer: nl.answer, data: nl.data, points: 1, verify: V.choiceRegion(said, near) },
          ],
          solution: [T`"${words}" means \(${H.rel(P.op)}\).`, T`\(${H.box(T`x ${H.rel(P.op)} ${n}`)}\)`, T`Graph: ${P.op.includes('=') ? 'closed dot' : 'open dot'} at ${n}, shaded to the ${P.op[0] === '>' ? 'right' : 'left'}.`],
        };
      },
    },
    budget: {
      name: 'Budget',
      gen(rng) {
        const [thing, fixedWhat, one] = rng.pick([['classes', 'a membership fee', 'class'], ['rides', 'an entrance fee', 'ride'], ['hours of bowling', 'a shoe rental fee', 'hour'], ['movies', 'a monthly fee', 'movie']]);
        const f = rng.int(2, 12) * 5, r = rng.int(4, 18), n = rng.int(4, 15), B = f + r * n;
        const W = 340, Hh = 120;
        let v = S.rect(30, 20, 150, 80, 'ln paperf', 4) + S.text(105, 44, fixedWhat + ': $' + f, { cls: 'tx small', w: 700 }) + S.text(105, 70, '$' + r + ' per ' + one, { cls: 'tx small' });
        v += S.text(260, 50, 'budget:', { cls: 'tx small' }) + S.text(260, 76, 'at most $' + B, { cls: 'tx', w: 700 });
        return {
          prompt: T`It costs ${fixedWhat} of $${f} plus $${r} for each of the ${thing}. Rosa can spend at most $${B}. Let \(x\) be the number of ${thing}. Write and solve an inequality, then find the greatest number of ${thing} she can afford.`,
          visual: S.svg(W, Hh, v, 'A price list and a budget'),
          parts: [
            { label: 'a', ask: T`Solve \(${f} + ${r}x \le ${B}\) for \(x\).`, kind: 'ineq', var: 'x', answer: 'x<=' + n, show: T`x \le ${n}`, points: 2, verify: V.region((e) => f + r * e.x <= B, { n: 2000 }) },
            { label: 'b', ask: `Greatest number of ${thing}`, kind: 'num', answer: String(n), show: String(n), points: 1, verify: V.custom((x) => {
              const cost = (k) => f + r * k;
              if (!Number.isInteger(x) || x < 0) return 'expected a whole number of ' + thing;
              return (cost(x) <= B && cost(x + 1) > B) || 'the greatest affordable number is not ' + x;
            }) },
          ],
          solution: [T`Total cost: \(${f} + ${r}x\); "at most" means \(\le\).`, T`\(${f} + ${r}x \le ${B}\), so \(${r}x \le ${B - f}\) and \(x \le ${n}\)`, T`\(${H.box(T`x \le ${n}`)}\): she can afford at most ${n}.`],
        };
      },
    },
    average: {
      name: 'Average needed',
      gen(rng) {
        let s, A, need;
        do { s = [rng.int(60, 98), rng.int(60, 98), rng.int(60, 98)]; A = rng.pick([75, 80, 85, 90]); need = 4 * A - s[0] - s[1] - s[2]; } while (need < 55 || need > 100);
        const W = 340, Hh = 150, base = 130, sc = 1.1;
        let v = I.ground(20, 320, base) + S.line(20, base - A * sc, 320, base - A * sc, 'acc dash') + S.text(318, base - A * sc - 6, 'average ' + A, { cls: 'tx small', a: 'end' });
        s.forEach((x, k) => { v += S.rect(40 + k * 64, base - x * sc, 44, x * sc, 'soft ln') + S.text(62 + k * 64, base - x * sc + 16, String(x), { cls: 'tx small', w: 700 }) + S.text(62 + k * 64, base + 14, 'test ' + (k + 1), { cls: 'tx small' }); });
        v += S.rect(232, base - need * sc, 44, need * sc, 'paperf ln dash') + S.q(254, base - need * sc + 20) + S.text(254, base + 14, 'test 4', { cls: 'tx small' });
        return {
          prompt: T`Jamal scored ${s[0]}, ${s[1]} and ${s[2]} on his first three tests. He wants an average of at least ${A} after the fourth test. Let \(x\) be his fourth score. What scores will do it?`,
          visual: S.svg(W, 150, v, 'Bar chart of three test scores with the fourth unknown'),
          parts: [
            { label: 'a', ask: T`Solve \(\dfrac{${s[0]} + ${s[1]} + ${s[2]} + x}{4} \ge ${A}\) for \(x\).`, kind: 'ineq', var: 'x', answer: 'x>=' + need, show: T`x \ge ${need}`, points: 2, verify: V.region((e) => (s[0] + s[1] + s[2] + e.x) / 4 >= A, { n: 2000 }) },
            { label: 'b', ask: 'Lowest score that works', kind: 'num', answer: String(need), show: String(need), points: 1, verify: V.custom((x) => {
              const avg = (k) => (s[0] + s[1] + s[2] + k) / 4;
              if (!Number.isInteger(x) || x < 0 || x > 100) return 'expected a whole-number test score';
              return (avg(x) >= A && avg(x - 1) < A) || 'the lowest score that works is not ' + x;
            }) },
          ],
          solution: [T`Multiply both sides by 4: \(${s[0] + s[1] + s[2]} + x \ge ${4 * A}\)`, T`Subtract: \(x \ge ${need}\)`, T`\(${H.box(T`x \ge ${need}`)}\)`],
        };
      },
    },
  };
  MX.register({
    id: 'w-ineq', kind: 'word', section: SEC, title: 'Inequalities from words', sources: ['Exam 3 #19'],
    slots: [{ label: 'Inequalities from words', source: 'Exam 3 #19', pool: ['phrase', 'budget', 'average'] }],
    lesson: T`<p>Translate the key phrase into a symbol:</p>
<ul><li><strong>at least, minimum, no less than</strong> → \(\ge\)</li><li><strong>at most, maximum, no more than</strong> → \(\le\)</li>
<li><strong>more than, greater than, exceeds, taller than</strong> → \(\gt\)</li><li><strong>less than, fewer than, below</strong> → \(\lt\)</li></ul>
<p>Build the expression from the story (fixed fee + rate × number), put the symbol between it and the limit, and solve like an equation. Graph with a closed dot for \(\le, \ge\) and an open dot for \(\lt, \gt\).</p>`,
    variants: ineq,
  });

  // ================= SCIENTIFIC NOTATION IN CONTEXT =================
  const PROD = [
    { t: (a, b) => `A large restaurant chain has about ${a} managers, and each makes on average $${b} per year. How much does the company spend on managers' salaries each year?`, u: 'dollars', A: [[25, 45], 4], B: [[35, 60], 3], icons: ['person', 'money'] },
    { t: (a, b) => `A city has about ${a} households. Each uses about ${b} gallons of water per year. How many gallons do all the households use in a year?`, u: 'gallons', A: [[20, 90], 4], B: [[70, 99], 3], icons: ['house', 'drop'] },
    { t: (a, b) => `A beehive has about ${a} bees, and each bee visits about ${b} flowers in its lifetime. How many flower visits is that in all?`, u: 'visits', A: [[30, 80], 3], B: [[12, 40], 2], icons: ['bee', 'flower'] },
    { t: (a, b) => `A stadium sells about ${a} tickets a season at an average price of $${b}. How much ticket money comes in each season?`, u: 'dollars', A: [[11, 29], 5], B: [[45, 95], 0], icons: ['person', 'money'] },
  ];
  function icon(kind, x, y) {
    switch (kind) {
      case 'person': return I.person(x, y + 30, 30);
      case 'money': return S.rect(x - 18, y, 36, 20, 'ln leaf') + S.text(x, y + 15, '$', { cls: 'tx small', w: 700 });
      case 'house': return I.house(x - 14, y + 30, 28, 18);
      case 'drop': return S.path(`M${x} ${y} q12 16 0 26 q-12 -10 0 -26 z`, 'ln water');
      case 'bee': return S.ellipse(x, y + 14, 12, 8, 'ln sun') + S.line(x - 3, y + 7, x - 3, y + 21, 'ln') + S.line(x + 3, y + 7, x + 3, y + 21, 'ln');
      case 'flower': return [0, 72, 144, 216, 288].map((a) => S.circle(x + 8 * Math.cos((a * Math.PI) / 180), y + 14 + 8 * Math.sin((a * Math.PI) / 180), 6, 'soft2 ln thin')).join('') + S.circle(x, y + 14, 5, 'sun nostroke');
    }
    return '';
  }
  const sci = {
    product: {
      name: 'Multiply large numbers',
      gen(rng) {
        const C = rng.pick(PROD);
        const na = rng.int(...C.A[0]), nb = rng.int(...C.B[0]);
        if (na % 10 === 0 || nb % 10 === 0) return this.gen(rng);
        const A = H.sci(na, C.A[1]), B = H.sci(nb, C.B[1]), P = H.sci(na * nb, C.A[1] + C.B[1]);
        const as = H.decStr(na, C.A[1]), bs = H.decStr(nb, C.B[1]);
        const W = 360, Hh = 120;
        let v = icon(C.icons[0], 60, 30) + S.text(60, 100, as, { cls: 'tx small', w: 700 }) + S.text(130, 60, '×', { cls: 'tx', size: 24 }) + icon(C.icons[1], 200, 30) + S.text(200, 100, bs, { cls: 'tx small', w: 700 });
        v += S.text(262, 60, '=', { cls: 'tx', size: 24 }) + S.q(310, 64, '?');
        return {
          prompt: T`${C.t(as, bs)} Put both numbers in scientific notation first, and leave your answer in scientific notation.`,
          visual: S.svg(W, Hh, v, 'A count multiplied by an amount each'),
          parts: [
            { label: 'a', ask: T`${as} in scientific notation`, kind: 'sci', value: A.value, answer: A.asc, show: A.tex, points: 1, verify: sciIs(() => numOf(as)) },
            { label: 'b', ask: T`${bs} in scientific notation`, kind: 'sci', value: B.value, answer: B.asc, show: B.tex, points: 1, verify: sciIs(() => numOf(bs)) },
            { label: 'c', ask: 'The product, in scientific notation', kind: 'sci', value: P.value, answer: P.asc, show: P.tex, post: C.u, points: 2, verify: sciIs(() => numOf(as) * numOf(bs)) },
          ],
          solution: [T`\(${as} = ${A.tex}\) and \(${bs} = ${B.tex}\)`, T`Multiply the front numbers: \(${A.mant}\times${B.mant} = ${MX.num(parseFloat(A.mant) * parseFloat(B.mant))}\); add the exponents: \(10^{${A.exp} + ${B.exp}} = 10^{${A.exp + B.exp}}\)`, T`Adjust so the front number is between 1 and 10: \(${H.box(P.tex)}\) ${C.u}`],
        };
      },
    },
    quotient: {
      name: 'Divide large numbers',
      gen(rng) {
        const kind = rng.pick(['light', 'probe', 'debt']);
        let nd, kd, ns, ks;
        if (kind === 'light') { nd = 15; kd = 7; ns = 3; ks = 5; }
        else {
          ns = rng.pick([2, 3, 4, 5, 6, 8, 12, 15, 25]); ks = rng.int(3, 6);
          let q; do { q = rng.int(11, 99); } while (q % 10 === 0);
          nd = ns * q; kd = rng.int(ks + 2, ks + 7);
        }
        const D = H.sci(nd, kd), Sp = H.sci(ns, ks), R = H.sci(nd / ns, kd - ks);
        const Dt = '\\(' + D.tex + '\\)', St = '\\(' + Sp.tex + '\\)';
        const text = {
          light: [`Light travels about ${St} kilometers per second. The Sun is about ${Dt} kilometers from Earth. How many seconds does sunlight take to reach Earth?`, 'seconds'],
          probe: [`A space probe travels about ${St} kilometers per hour. How many hours would it take to travel ${Dt} kilometers?`, 'hours'],
          debt: [`A country owes about ${Dt} dollars, shared by about ${St} people. How much is that per person?`, 'dollars'],
        }[kind];
        const W = 360, Hh = 110;
        const sup = (x, y, m, e) => '<text class="tx small" x="' + x + '" y="' + y + '" text-anchor="middle" font-weight="700">' + m + ' × 10<tspan dy="-6" font-size="9">' + e + '</tspan></text>';
        let v;
        if (kind === 'debt') {
          v = S.rect(40, 30, 70, 44, 'ln leaf') + S.text(75, 58, '$', { cls: 'tx', w: 700, size: 18 }) + sup(75, 94, D.mant, D.exp) + S.text(150, 58, '÷', { cls: 'tx', size: 24 });
          for (let k = 0; k < 5; k++) v += I.person(190 + k * 22, 74, 30);
          v += sup(234, 94, Sp.mant, Sp.exp) + S.q(330, 58, '?');
        } else {
          v = (kind === 'light' ? I.sun(50, 50, 16) : S.circle(50, 50, 12, 'soft2 ln')) + S.circle(310, 50, 12, 'water ln') + S.dim(76, 50, 294, 50, null) + sup(185, 38, D.mant, D.exp + '') + '<text class="tx small" x="185" y="82" text-anchor="middle">at ' + Sp.mant + ' × 10<tspan dy="-6" font-size="9">' + Sp.exp + '</tspan><tspan dy="6"> km per ' + (kind === 'light' ? 'second' : 'hour') + '</tspan></text>';
        }
        return {
          prompt: T`${text[0]} Give your answer in scientific notation.`,
          visual: S.svg(W, Hh, v, 'A total divided by a rate'),
          parts: [{ kind: 'sci', value: R.value, answer: R.asc, show: R.tex, post: text[1], points: 3, verify: sciIs(() => texSci(D.tex) / texSci(Sp.tex)) }],
          solution: [T`Divide: \(\dfrac{${D.tex}}{${Sp.tex}}\)`, T`Front numbers: \(${D.mant}\div${Sp.mant} = ${MX.num(parseFloat(D.mant) / parseFloat(Sp.mant), 6)}\); exponents: \(10^{${D.exp} - ${Sp.exp}} = 10^{${D.exp - Sp.exp}}\)`, T`Adjust if needed: \(${H.box(R.tex)}\) ${text[1]}`],
        };
      },
    },
    tiny: {
      name: 'Very small quantities',
      gen(rng) {
        const C = rng.pick([
          { t: (m, n) => `One grain of sand has a mass of about ${m} grams. What is the mass of ${n} grains?`, u: 'grams', m: [[11, 99], -6] },
          { t: (m, n) => `A red blood cell is about ${m} meters wide. How long would a line of ${n} cells be, placed side by side?`, u: 'meters', m: [[65, 85], -7] },
          { t: (m, n) => `A bacterium has a mass of about ${m} grams. What is the mass of ${n} bacteria?`, u: 'grams', m: [[11, 30], -13] },
        ]);
        const nm = rng.int(...C.m[0]);
        if (nm % 10 === 0) return this.gen(rng);
        const cnt = rng.int(2, 9), ck = rng.int(4, 8);
        const M = H.sci(nm, C.m[1]), N = H.sci(cnt, ck), P = H.sci(nm * cnt, C.m[1] + ck);
        const W = 360, Hh = 110;
        let v = S.circle(60, 50, 6, 'soft2 ln') + S.text(60, 86, 'one', { cls: 'tx small' }) + S.text(120, 56, '×', { cls: 'tx', size: 22 });
        for (let k = 0; k < 18; k++) v += S.circle(160 + (k % 6) * 16, 30 + Math.floor(k / 6) * 16, 5, 'soft2 ln thin');
        v += S.text(200, 96, H.decStr(cnt, ck) + ' of them', { cls: 'tx small' });
        return {
          prompt: T`${C.t('\\(' + M.tex + '\\)', H.decStr(cnt, ck))} Write the count in scientific notation, then give the answer in scientific notation.`,
          visual: S.svg(W, Hh, v, 'One tiny object and many of them'),
          parts: [
            { label: 'a', ask: T`${H.decStr(cnt, ck)} in scientific notation`, kind: 'sci', value: N.value, answer: N.asc, show: N.tex, points: 1, verify: sciIs(() => numOf(H.decStr(cnt, ck))) },
            { label: 'b', ask: 'The total, in scientific notation', kind: 'sci', value: P.value, answer: P.asc, show: P.tex, post: C.u, points: 2, verify: sciIs(() => texSci(M.tex) * numOf(H.decStr(cnt, ck))) },
          ],
          solution: [T`\(${H.decStr(cnt, ck)} = ${N.tex}\)`, T`\(\left(${M.tex}\right)\left(${N.tex}\right)\): front numbers \(${M.mant}\times${cnt} = ${MX.num(parseFloat(M.mant) * cnt)}\); exponents \(10^{${M.exp} + ${ck}} = 10^{${M.exp + ck}}\)`, T`\(${H.box(P.tex)}\) ${C.u}`],
        };
      },
    },
  };
  MX.register({
    id: 'w-sci', kind: 'word', section: SEC, title: 'Scientific notation in context', sources: ['Exam 3 #25'],
    slots: [{ label: 'Scientific notation', source: 'Exam 3 #25', pool: ['product', 'quotient', 'tiny'] }],
    lesson: T`<ol><li>Rewrite each number as \(a\times10^{n}\) with \(1 \le a \lt 10\): \(320{,}000 = 3.2\times10^{5}\).</li>
<li>Multiply (or divide) the front numbers.</li><li>Add the exponents when multiplying; subtract them when dividing.</li>
<li>If the front number is now 10 or more (or less than 1), move the decimal point and adjust the exponent: \(13.12\times10^{9} = 1.312\times10^{10}\).</li></ol>
<p>"Total" usually means multiply (number × amount each); "per person" or "how long" usually means divide.</p>`,
    variants: sci,
  });
})(typeof window !== 'undefined' ? window : globalThis);

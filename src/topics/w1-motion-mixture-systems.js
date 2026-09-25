/* Word problems: distance-rate-time, mixtures, linear systems in context */
(function (G) {
  'use strict';
  const MX = G.MX;
  const { Q, T, H, S } = MX;
  const I = S.I;
  const SEC = 'Word problems';
  const money2 = (v) => '$' + Number(MX.money(v)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const $ = (v) => (Number.isInteger(v) ? '$' + MX.commas(v) : money2(v));

  // ================= DISTANCE, RATE & TIME =================
  function road(W, H, y) {
    return S.rect(20, y, W - 40, 16, 'road nostroke') + S.line(28, y + 8, W - 28, y + 8, 'roadline');
  }
  const VEH = [
    { many: 'cars', one: 'car', lo: 40, hi: 70 },
    { many: 'trucks', one: 'truck', lo: 45, hi: 65 },
    { many: 'cyclists', one: 'cyclist', lo: 10, hi: 20 },
    { many: 'trains', one: 'train', lo: 50, hi: 85 },
  ];
  const motion = {
    toward: {
      name: 'Moving toward each other',
      gen(rng) {
        const v = rng.pick(VEH), t = rng.pick([2, 2, 3, 4]), d = rng.int(2, v.lo > 20 ? 12 : 4);
        const r = rng.int(v.lo + d, v.hi), D = (2 * r - d) * t;
        const W = 380, Hh = 160;
        let b = road(W, Hh, 96) + I.building(14, 94, 30, 34) + I.building(W - 44, 94, 30, 34);
        b += S.text(29, 142, 'A', { cls: 'tx small', w: 700 }) + S.text(W - 29, 142, 'B', { cls: 'tx small', w: 700 });
        b += I.car(118, 96, false) + I.car(262, 96, true, 'soft2');
        b += S.arrow(145, 62, 175, 62, 'acc', 7) + S.arrow(235, 62, 205, 62, 'acc', 7);
        b += S.label(118, 58, 'r mph', { cls: 'lbl' }) + S.label(262, 58, 'r − ' + d + ' mph', { cls: 'lbl' });
        b += S.dim(30, 128, W - 30, 128, D + ' miles', { dy: 4 });
        b += I.clock(190, 26, 12) + S.text(208, 31, 'meet after ' + t + ' h', { cls: 'tx small', a: 'start' });
        return {
          prompt: T`Two ${v.many} start from towns ${D} miles apart and travel toward each other on the same road. They pass one another ${t} hours later. Find the speed of each ${v.one} if one travels ${d} mph slower than the other.`,
          visual: S.svg(W, Hh, b, 'Two vehicles approaching each other on a road between two towns'),
          parts: [
            { label: 'a', ask: `Speed of the faster ${v.one}`, kind: 'num', answer: String(r), show: r + '\\text{ mph}', post: 'mph', points: 2 },
            { label: 'b', ask: `Speed of the slower ${v.one}`, kind: 'num', answer: String(r - d), show: r - d + '\\text{ mph}', post: 'mph', points: 2 },
          ],
          solution: [
            T`Let \(r\) be the faster speed; the slower speed is \(r - ${d}\). Each travels for ${t} hours, and distance = rate × time.`,
            T`Together they cover the whole ${D} miles: \(${t}r + ${t}\left(r - ${d}\right) = ${D}\)`,
            T`\(${2 * t}r - ${t * d} = ${D}\), so \(${2 * t}r = ${D + t * d}\) and \(r = ${r}\)`,
            T`\(${H.box(T`${r}\text{ mph and }${r - d}\text{ mph}`)}\)`,
          ],
        };
      },
    },
    apart: {
      name: 'Moving apart',
      gen(rng) {
        const v = rng.pick(VEH), t = rng.pick([2, 3, 4, 5]), d = rng.int(2, v.lo > 20 ? 15 : 5);
        const r = rng.int(v.lo, v.hi - d), D = (2 * r + d) * t;
        const W = 380, Hh = 160;
        let b = road(W, Hh, 96) + I.building(175, 94, 30, 34) + S.text(190, 52, 'start', { cls: 'tx small' });
        b += I.car(78, 96, true, 'soft2') + I.car(302, 96, false);
        b += S.arrow(60, 62, 30, 62, 'acc', 7) + S.arrow(320, 62, 350, 62, 'acc', 7);
        b += S.label(78, 58, 'r mph', { cls: 'lbl' }) + S.label(302, 58, 'r + ' + d + ' mph', { cls: 'lbl' });
        b += S.dim(30, 128, W - 30, 128, D + ' miles apart', { dy: 4 });
        b += I.clock(262, 26, 12) + S.text(280, 31, 'after ' + t + ' h', { cls: 'tx small', a: 'start' });
        return {
          prompt: T`Two ${v.many} leave the same place at the same time and travel in opposite directions. One travels ${d} mph faster than the other. After ${t} hours they are ${D} miles apart. Find the speed of each.`,
          visual: S.svg(W, Hh, b, 'Two vehicles moving apart in opposite directions'),
          parts: [
            { label: 'a', ask: `Speed of the slower ${v.one}`, kind: 'num', answer: String(r), show: r + '\\text{ mph}', post: 'mph', points: 2 },
            { label: 'b', ask: `Speed of the faster ${v.one}`, kind: 'num', answer: String(r + d), show: r + d + '\\text{ mph}', post: 'mph', points: 2 },
          ],
          solution: [
            T`Let \(r\) be the slower speed; the faster is \(r + ${d}\). Both travel ${t} hours.`,
            T`Their distances add to the gap between them: \(${t}r + ${t}\left(r + ${d}\right) = ${D}\)`,
            T`\(${2 * t}r + ${t * d} = ${D}\), so \(${2 * t}r = ${D - t * d}\) and \(r = ${r}\)`,
            T`\(${H.box(T`${r}\text{ mph and }${r + d}\text{ mph}`)}\)`,
          ],
        };
      },
    },
    catchup: {
      name: 'Catching up',
      gen(rng) {
        let t, t0, r1, diff, r2;
        do { t = rng.int(1, 6); t0 = rng.int(1, 3); r1 = rng.int(6, 12) * 5; diff = (r1 * t0) / t; r2 = r1 + diff; } while (!Number.isInteger(diff) || r2 > 90 || diff < 5);
        const dist = r2 * t;
        const W = 380, Hh = 160;
        let b = road(W, Hh, 96) + I.flag(34, 96, 40) + S.text(34, 142, 'depot', { cls: 'tx small' });
        b += I.car(250, 96, false, 'soft2') + I.car(84, 96, false);
        b += S.label(250, 58, 'truck: ' + r1 + ' mph', { cls: 'lbl' }) + S.label(96, 58, 'car: ' + r2 + ' mph', { cls: 'lbl' });
        b += S.dim(34, 128, 250, 128, 'head start: ' + t0 + ' h', { dy: 4 });
        b += S.q(330, 90, '?');
        return {
          prompt: T`A truck leaves a depot traveling ${r1} mph. ${t0} hour${t0 > 1 ? 's' : ''} later, a car leaves the same depot and follows the same road at ${r2} mph. How long after the car leaves will it catch up to the truck, and how far from the depot will they be?`,
          visual: S.svg(W, Hh, b, 'A truck with a head start and a faster car behind it'),
          parts: [
            { label: 'a', ask: 'Hours after the car leaves', kind: 'num', answer: String(t), show: t + '\\text{ hours}', post: 'hours', points: 2 },
            { label: 'b', ask: 'Distance from the depot', kind: 'num', answer: String(dist), show: dist + '\\text{ miles}', post: 'miles', points: 2 },
          ],
          solution: [
            T`Let \(t\) be the car's time. The truck has driven \(t + ${t0}\) hours. When the car catches up, the distances are equal.`,
            T`\(${r1}\left(t + ${t0}\right) = ${r2}t\)`,
            T`\(${r1}t + ${r1 * t0} = ${r2}t\), so \(${r1 * t0} = ${diff}t\) and \(t = ${t}\)`,
            T`Distance: \(${r2}\cdot${t} = ${dist}\) miles. \(${H.box(T`${t}\text{ h},\ ${dist}\text{ mi}`)}\)`,
          ],
        };
      },
    },
    roundtrip: {
      name: 'Round trip',
      gen(rng) {
        const [r1, r2] = rng.pick([[60, 40], [50, 30], [45, 30], [60, 45], [40, 30], [70, 35], [48, 36], [60, 30], [55, 33]]);
        const D = (r1 * r2) / MX.gcd(r1, r2) * rng.int(1, 2);
        const t1 = D / r1, t2 = D / r2, Tt = t1 + t2;
        if (!Number.isInteger(t1) || !Number.isInteger(t2) || D > 400) return this.gen(rng);
        const W = 380, Hh = 150;
        let b = I.house(34, 110, 40, 30) + S.text(54, 132, 'home', { cls: 'tx small' });
        b += I.building(W - 70, 110, 36, 46) + S.text(W - 52, 132, 'city', { cls: 'tx small' });
        b += S.path(`M86 78 Q190 30 ${W - 80} 78`, 'acc thick nofill') + S.arrow(W - 96, 70, W - 80, 78, 'acc', 8);
        b += S.path(`M${W - 80} 104 Q190 146 86 104`, 'ln thick nofill dash') + S.arrow(102, 112, 86, 104, 'ln', 8);
        b += S.label(190, 46, 'there: ' + r1 + ' mph', { cls: 'lbl' }) + S.label(190, 136, 'back: ' + r2 + ' mph', { cls: 'lbl' });
        b += S.label(190, 92, 'total time ' + Tt + ' h', { cls: 'small' }) + S.q(190, 72, 'distance = ?');
        return {
          prompt: T`Jordan drove to the city at an average speed of ${r1} mph and returned home on the same road at ${r2} mph. The round trip took ${Tt} hours of driving. How far is the city from Jordan's home?`,
          visual: S.svg(W, Hh, b, 'Round trip between home and the city at two speeds'),
          parts: [{ kind: 'num', answer: String(D), show: D + '\\text{ miles}', post: 'miles', points: 4 }],
          solution: [
            T`Let \(d\) be the one-way distance. Time = distance ÷ rate, so the trip there takes \(\frac{d}{${r1}}\) hours and back takes \(\frac{d}{${r2}}\) hours.`,
            T`\(\dfrac{d}{${r1}} + \dfrac{d}{${r2}} = ${Tt}\)`,
            T`Multiply by the LCD ${MX.lcm(r1, r2)}: \(${MX.lcm(r1, r2) / r1}d + ${MX.lcm(r1, r2) / r2}d = ${Tt * MX.lcm(r1, r2)}\), so \(${MX.lcm(r1, r2) / r1 + MX.lcm(r1, r2) / r2}d = ${Tt * MX.lcm(r1, r2)}\)`,
            T`\(d = ${D}\). Check: \(${t1} + ${t2} = ${Tt}\) hours ✓. \(${H.box(D + '\\text{ miles}')}\)`,
          ],
        };
      },
    },
    current: {
      name: 'With and against a current',
      gen(rng) {
        const plane = rng.chance(0.4);
        const bs = plane ? rng.int(20, 45) * 10 : rng.int(8, 25), c = plane ? rng.int(2, 8) * 10 : rng.int(2, Math.min(7, bs - 3));
        const t1 = plane ? rng.int(2, 5) : rng.int(2, 4), t2 = plane ? rng.int(2, 6) : rng.int(2, 6);
        const Dd = (bs + c) * t1, Du = (bs - c) * t2;
        const W = 380, Hh = 150;
        let b;
        if (plane) {
          b = I.sun(30, 26, 8) + I.plane(120, 70, false) + I.plane(270, 110, true);
          for (let x = 60; x < 340; x += 70) b += S.arrow(x, 30, x + 36, 30, 'mut', 6);
          b += S.text(200, 20, 'wind', { cls: 'tx small' });
          b += S.label(120, 100, 'with wind: ' + Dd + ' mi in ' + t1 + ' h', { cls: 'lbl' }) + S.label(270, 140, 'against: ' + Du + ' mi in ' + t2 + ' h', { cls: 'lbl' });
        } else {
          b = S.rect(0, 70, W, 60, 'water nostroke');
          for (let x = 30; x < W; x += 80) b += S.arrow(x, 120, x + 36, 120, 'mut', 6);
          b += S.text(W - 40, 64, 'current →', { cls: 'tx small' });
          b += I.boat(110, 90, false) + I.boat(270, 90, true);
          b += S.label(110, 46, 'downstream: ' + Dd + ' mi in ' + t1 + ' h', { cls: 'lbl' }) + S.label(270, 24, 'upstream: ' + Du + ' mi in ' + t2 + ' h', { cls: 'lbl' });
        }
        const what = plane ? 'plane' : 'boat', still = plane ? 'in calm air' : 'in still water', flow = plane ? 'wind' : 'current';
        return {
          prompt: plane
            ? T`A small plane flies ${Dd} miles with the wind in ${t1} hours. The return trip of ${Du} miles against the wind takes ${t2} hours. Find the speed of the plane in calm air and the speed of the wind.`
            : T`A boat travels ${Dd} miles downstream in ${t1} hours. Going upstream, it travels ${Du} miles in ${t2} hours. Find the speed of the boat in still water and the speed of the current.`,
          visual: S.svg(W, Hh, b, plane ? 'A plane flying with and against the wind' : 'A boat going downstream and upstream'),
          parts: [
            { label: 'a', ask: `Speed of the ${what} ${still}`, kind: 'num', answer: String(bs), show: bs + '\\text{ mph}', post: 'mph', points: 2 },
            { label: 'b', ask: `Speed of the ${flow}`, kind: 'num', answer: String(c), show: c + '\\text{ mph}', post: 'mph', points: 2 },
          ],
          solution: [
            T`Let \(b\) = ${what} speed ${still} and \(c\) = ${flow} speed. With the ${flow} the speeds add; against it they subtract.`,
            T`\(b + c = \frac{${Dd}}{${t1}} = ${bs + c}\) and \(b - c = \frac{${Du}}{${t2}} = ${bs - c}\)`,
            T`Add the equations: \(2b = ${2 * bs}\), so \(b = ${bs}\); then \(c = ${bs + c} - ${bs} = ${c}\)`,
            T`\(${H.box(T`${bs}\text{ mph},\ ${c}\text{ mph}`)}\)`,
          ],
        };
      },
    },
    average: {
      name: 'Average speed',
      gen(rng) {
        let r1, r2, t1, t2;
        do { r1 = rng.int(5, 14) * 5; r2 = rng.int(5, 14) * 5; t1 = rng.int(1, 4); t2 = rng.int(1, 4); } while (r1 === r2);
        const d1 = r1 * t1, d2 = r2 * t2, Tt = t1 + t2, avg = (d1 + d2) / Tt;
        const avgR = Math.round(avg * 10) / 10;
        const W = 380, Hh = 140;
        let b = S.line(30, 80, 190, 80, 'acc thick') + S.line(190, 80, 350, 80, 'ln thick dash');
        b += [30, 190, 350].map((x, k) => S.circle(x, 80, 6, 'paperf acc') + S.text(x, 108, ['start', 'stop', 'finish'][k], { cls: 'tx small' })).join('');
        b += S.label(110, 64, d1 + ' mi at ' + r1 + ' mph', { cls: 'lbl' }) + S.label(270, 64, d2 + ' mi at ' + r2 + ' mph', { cls: 'lbl' });
        b += S.q(190, 32, 'average speed = ?');
        return {
          prompt: T`On a road trip, Priya drove ${d1} miles at ${r1} mph, then ${d2} more miles at ${r2} mph. What was her average speed for the whole trip? Round to the nearest tenth if needed.`,
          visual: S.svg(W, Hh, b, 'A two-leg trip with different speeds'),
          parts: [
            { label: 'a', ask: 'Total driving time', kind: 'num', answer: String(Tt), show: Tt + '\\text{ hours}', post: 'hours', points: 1 },
            { label: 'b', ask: 'Average speed for the whole trip', kind: 'num', answer: String(avgR), tol: 0.051, show: avgR + '\\text{ mph}', post: 'mph', points: 3 },
          ],
          solution: [
            T`Time for each leg = distance ÷ rate: \(\frac{${d1}}{${r1}} = ${t1}\) h and \(\frac{${d2}}{${r2}} = ${t2}\) h, so ${Tt} hours in total.`,
            T`Average speed = total distance ÷ total time = \(\frac{${d1} + ${d2}}{${Tt}} = \frac{${d1 + d2}}{${Tt}} \approx ${avgR}\) mph`,
            T`It is <em>not</em> the average of ${r1} and ${r2} (${(r1 + r2) / 2}), because she spent different amounts of time at each speed.`,
            T`\(${H.box(avgR + '\\text{ mph}')}\)`,
          ],
        };
      },
    },
  };
  MX.register({
    id: 'w-motion', kind: 'word', section: SEC, title: 'Distance, rate & time', sources: ['Exam 1 #28'],
    slots: [{ label: 'Distance, rate & time', source: 'Exam 1 #28', pool: ['toward', 'apart', 'catchup', 'roundtrip', 'current', 'average'] }],
    lesson: T`<p>Everything comes from one formula: <strong>distance = rate × time</strong>, \(d = rt\) (so \(t = \frac{d}{r}\) and \(r = \frac{d}{t}\)).</p>
<p>Make a small table: one row per traveler, columns rate · time = distance. Then look for the relationship the story gives you:</p>
<ul><li><strong>Toward each other / opposite directions</strong>: the two distances <em>add</em> to the total.</li>
<li><strong>Catching up</strong>: the two distances are <em>equal</em> (the one who left first has more time).</li>
<li><strong>Round trip</strong>: same distance both ways; the two <em>times</em> add to the total time.</li>
<li><strong>Current or wind</strong>: speeds become \(b + c\) (with it) and \(b - c\) (against it).</li>
<li><strong>Average speed</strong> = total distance ÷ total time, not the average of the speeds.</li></ul>`,
    variants: motion,
  });

  // ================= MIXTURES =================
  const DRY = [
    { a: 'soil', b: 'fertilizer', unit: 'bag', units: 'bags', A: 'S', B: 'F', pa: [60, 80], pb: [85, 100], step: 5 },
    { a: 'Colombian coffee', b: 'Kona coffee', unit: 'pound', units: 'pounds', A: 'C', B: 'K', pa: [6, 9], pb: [12, 18], step: 1 },
    { a: 'peanuts', b: 'cashews', unit: 'pound', units: 'pounds', A: 'P', B: 'C', pa: [3, 5], pb: [8, 12], step: 1 },
    { a: 'lemon drops', b: 'chocolates', unit: 'pound', units: 'pounds', A: 'L', B: 'C', pa: [2, 4], pb: [7, 10], step: 1 },
  ];
  function sysParts(vars, eqs, eqShow, solveParts) {
    return [
      { label: 'a', ask: 'Write a system of two equations that models the situation.', kind: 'system', vars, answers: eqs, show: eqShow, points: 4, inputs: ['Equation 1', 'Equation 2'] },
      ...solveParts,
    ];
  }
  function solveSteps(eq1, eq2, subst, ans) { return [T`Equation 1: \(${eq1}\)`, T`Equation 2: \(${eq2}\)`, ...subst, ans]; }
  const mixture = {
    dry: {
      name: 'Blend by price',
      gen(rng) {
        const c = rng.pick(DRY);
        let pa, pb, a, bq, N, pm;
        do {
          pa = rng.int(c.pa[0] / c.step, c.pa[1] / c.step) * c.step; pb = rng.int(c.pb[0] / c.step, c.pb[1] / c.step) * c.step;
          N = rng.pick([10, 20, 24, 30, 40, 50, 60]); a = rng.int(2, N - 2); bq = N - a;
          pm = (pa * a + pb * bq) / N;
        } while (Math.round(pm * 100) !== pm * 100 || a === bq);
        const total = pa * a + pb * bq;
        const W = 380, Hh = 160;
        let v = I.bag(50, 120, c.A, 'soft') + I.tag(22, 142, $(pa) + '/' + c.unit, 'paperf');
        v += S.text(104, 100, '+', { cls: 'tx', size: 26, w: 700 }) + I.bag(160, 120, c.B, 'soft2') + I.tag(132, 142, $(pb) + '/' + c.unit, 'paperf');
        v += S.arrow(200, 96, 240, 96, 'acc', 8) + S.path('M252 128 L250 62 Q300 44 350 62 L348 128 Z', 'ln soft');
        v += S.text(300, 88, N + ' ' + c.units, { cls: 'tx', w: 700 }) + S.text(300, 108, 'at ' + money2(pm), { cls: 'tx small' });
        const e1 = `${c.A}+${c.B}=${N}`, e2 = `${pa}${c.A}+${pb}${c.B}=${pm}*${N}`;
        const e1t = `${c.A} + ${c.B} = ${N}`, e2t = `${pa}${c.A} + ${pb}${c.B} = ${MX.num(pm)}\\left(${N}\\right)`;
        return {
          prompt: T`How many ${c.units} of ${c.a} worth ${money2(pa)} per ${c.unit} and ${c.b} worth ${money2(pb)} per ${c.unit} should be mixed to get ${N} ${c.units} of a mixture worth ${money2(pm)} per ${c.unit}? Let \(${c.A}\) be the number of ${c.units} of ${c.a} and \(${c.B}\) the number of ${c.units} of ${c.b}.`,
          visual: S.svg(W, Hh, v, 'Two products with different prices mixed into one blend'),
          parts: sysParts([c.A, c.B], [e1, e2], T`${e1t},\quad ${e2t}`, [
            { label: 'b', ask: T`Solve: ${c.units} of ${c.a}`, kind: 'num', pre: c.A + ' =', answer: String(a), show: c.A + ' = ' + a, points: 1 },
            { label: 'c', ask: T`${c.units[0].toUpperCase() + c.units.slice(1)} of ${c.b}`, kind: 'num', pre: c.B + ' =', answer: String(bq), show: c.B + ' = ' + bq, points: 1 },
          ]),
          solution: solveSteps(e1t, e2t + ' = ' + total, [
            T`Quantity equation: the amounts add to ${N}. Value equation: price × amount for each adds to the value of the mixture, \(${MX.num(pm)}\cdot${N} = ${total}\).`,
            T`Substitute \(${c.A} = ${N} - ${c.B}\): \(${pa}\left(${N} - ${c.B}\right) + ${pb}${c.B} = ${total}\), so \(${pb - pa}${c.B} = ${total - pa * N}\) and \(${c.B} = ${bq}\)`,
          ], T`\(${H.box(T`${c.A} = ${a},\ ${c.B} = ${bq}`)}\)`),
        };
      },
    },
    invest: {
      name: 'Two interest rates',
      gen(rng) {
        let P, r1, r2, x, y, I1;
        do { P = rng.int(5, 30) * 1000; r1 = rng.int(2, 6); r2 = rng.int(r1 + 1, 9); x = rng.int(1, P / 1000 - 1) * 1000; y = P - x; I1 = (r1 * x + r2 * y) / 100; } while (!Number.isInteger(I1));
        const W = 380, Hh = 150;
        let v = I.box(30, 120, 100, 60, 'soft') + S.text(80, 88, 'account A', { cls: 'tx small' }) + S.text(80, 106, r1 + '% interest', { cls: 'tx', w: 700 });
        v += I.box(150, 120, 100, 60, 'soft2') + S.text(200, 88, 'account B', { cls: 'tx small' }) + S.text(200, 106, r2 + '% interest', { cls: 'tx', w: 700 });
        v += S.text(80, 138, 'x dollars', { cls: 'tx small' }) + S.text(200, 138, 'y dollars', { cls: 'tx small' });
        v += S.arrow(258, 92, 286, 92, 'acc', 7) + S.text(330, 80, 'total ' + $(P), { cls: 'tx small', w: 700 }) + S.text(330, 100, 'interest ' + $(I1), { cls: 'tx small', w: 700 });
        v += I.coin(318, 36, 14, '$') + I.coin(342, 44, 14, '$');
        const e1 = `x+y=${P}`, e2 = `${r1 / 100}x+${r2 / 100}y=${I1}`;
        const e1t = `x + y = ${MX.commas(P)}`, e2t = `${r1 / 100}x + ${r2 / 100}y = ${MX.commas(I1)}`;
        return {
          prompt: T`Ms. Lee invested a total of ${$(P)} in two accounts. One pays ${r1}% simple interest per year and the other pays ${r2}%. After one year she earned ${$(I1)} in interest. How much did she invest at each rate? Let \(x\) be the amount at ${r1}% and \(y\) the amount at ${r2}%.`,
          visual: S.svg(W, Hh, v, 'Money split between two accounts with different interest rates'),
          parts: sysParts(['x', 'y'], [e1, e2], T`${e1t},\quad ${e2t}`, [
            { label: 'b', ask: T`Amount at ${r1}%`, kind: 'num', pre: 'x = $', answer: String(x), show: '\\$' + MX.commas(x), points: 1 },
            { label: 'c', ask: T`Amount at ${r2}%`, kind: 'num', pre: 'y = $', answer: String(y), show: '\\$' + MX.commas(y), points: 1 },
          ]),
          solution: solveSteps(e1t, e2t, [
            T`Interest = rate × amount, with the rate as a decimal (${r1}% = ${r1 / 100}).`,
            T`Multiply equation 2 by 100: \(${r1}x + ${r2}y = ${I1 * 100}\). Substitute \(x = ${P} - y\): \(${r1 * P} + ${r2 - r1}y = ${I1 * 100}\), so \(y = ${y}\)`,
          ], T`\(${H.box(T`x = \$${MX.commas(x)},\ y = \$${MX.commas(y)}`)}\)`),
        };
      },
    },
    solution: {
      name: 'Two solutions',
      gen(rng) {
        const sub = rng.pick([['antifreeze', 'liters'], ['acid', 'liters'], ['saline', 'milliliters'], ['juice', 'gallons']]);
        let p1, p2, p3, V, x;
        do { p1 = rng.int(1, 5) * 10; p2 = rng.int(4, 9) * 10; p3 = rng.int(2, 8) * 5; V = rng.int(2, 12) * 10; x = ((p2 - p3) * V) / (p3 - p1); } while (!(p1 < p3 && p3 < p2) || !Number.isInteger(x) || x <= 0 || x > 300);
        const y = x + V;
        const W = 380, Hh = 150;
        let v = I.beaker(30, 124, 60, 70, 0.5, p1 + '%') + S.text(60, 144, 'x ' + sub[1] + ' ?', { cls: 'tx small' });
        v += S.text(118, 94, '+', { cls: 'tx', size: 24, w: 700 }) + I.beaker(146, 124, 60, 70, 0.75, p2 + '%') + S.text(176, 144, V + ' ' + sub[1], { cls: 'tx small' });
        v += S.text(236, 94, '=', { cls: 'tx', size: 24, w: 700 }) + I.beaker(264, 124, 80, 80, 0.7, p3 + '%') + S.text(304, 144, 'y ' + sub[1], { cls: 'tx small' });
        const e1 = `x+${V}=y`, e2 = [`${p1 / 100}x+${p2 / 100}*${V}=${p3 / 100}y`, `${p1 / 100}x+${p2 / 100}*${V}=${p3 / 100}(x+${V})`];
        const e1t = `x + ${V} = y`, e2t = `${p1 / 100}x + ${p2 / 100}\\left(${V}\\right) = ${p3 / 100}y`;
        return {
          prompt: T`How many ${sub[1]} of a ${p1}% ${sub[0]} solution should be added to ${V} ${sub[1]} of a ${p2}% ${sub[0]} solution to make a ${p3}% ${sub[0]} solution? Let \(x\) be the ${sub[1]} of ${p1}% solution added and \(y\) the ${sub[1]} of the final mixture.`,
          visual: S.svg(W, Hh, v, 'Two solutions of different strengths combined into a mixture'),
          parts: sysParts(['x', 'y'], [e1, e2], T`${e1t},\quad ${e2t}`, [
            { label: 'b', ask: T`Solve: ${sub[1]} of the ${p1}% solution`, kind: 'num', pre: 'x =', answer: String(x), show: 'x = ' + x, post: sub[1], points: 2 },
          ]),
          solution: solveSteps(e1t, e2t, [
            T`Volumes add (equation 1). The amount of pure ${sub[0]}, percent × volume, also adds (equation 2).`,
            T`Substitute \(y = x + ${V}\): \(${p1 / 100}x + ${(p2 * V) / 100} = ${p3 / 100}x + ${(p3 * V) / 100}\), so \(${(p3 - p1) / 100}x = ${((p2 - p3) * V) / 100}\) and \(x = ${x}\)`,
          ], T`\(${H.box(T`x = ${x}\text{ ${sub[1]}}`)}\)`),
        };
      },
    },
    dilute: {
      name: 'Diluting with water',
      gen(rng) {
        let p, q, V, w;
        do { p = rng.int(3, 9) * 10; q = rng.int(1, 8) * 5; V = rng.int(1, 10) * 10; w = ((p - q) * V) / q; } while (q >= p || !Number.isInteger(w) || w > 200);
        const y = V + w;
        const W = 380, Hh = 150;
        let v = S.rect(28, 64, 58, 62, 'ln water', 6) + S.rect(44, 52, 26, 12, 'ln soft') + S.text(57, 100, 'water', { cls: 'tx small', w: 700 }) + S.text(57, 144, 'x L (0%)', { cls: 'tx small' });
        v += S.text(118, 94, '+', { cls: 'tx', size: 24, w: 700 }) + I.beaker(146, 124, 60, 70, 0.75, p + '%') + S.text(176, 144, V + ' L', { cls: 'tx small' });
        v += S.text(236, 94, '=', { cls: 'tx', size: 24, w: 700 }) + I.beaker(264, 124, 80, 80, 0.8, q + '%') + S.text(304, 144, 'y L', { cls: 'tx small' });
        const e1 = `x+${V}=y`, e2 = [`${p / 100}*${V}=${q / 100}y`, `${p / 100}*${V}=${q / 100}(x+${V})`];
        const e1t = `x + ${V} = y`, e2t = `0x + ${p / 100}\\left(${V}\\right) = ${q / 100}y`;
        return {
          prompt: T`A lab has ${V} liters of a ${p}% acid solution. How many liters of pure water must be added to dilute it to a ${q}% solution? Let \(x\) be the liters of water added and \(y\) the liters of the final solution.`,
          visual: S.svg(W, Hh, v, 'Water added to an acid solution'),
          parts: sysParts(['x', 'y'], [e1, e2], T`${e1t},\quad ${e2t}`, [
            { label: 'b', ask: 'Solve: liters of water to add', kind: 'num', pre: 'x =', answer: String(w), show: 'x = ' + w, post: 'liters', points: 2 },
          ]),
          solution: solveSteps(e1t, e2t, [
            T`Water contains 0% acid, so only the original solution contributes acid: \(${p / 100}\cdot${V} = ${(p * V) / 100}\) liters.`,
            T`\(${(p * V) / 100} = ${q / 100}y\) gives \(y = ${y}\), so \(x = ${y} - ${V} = ${w}\)`,
          ], T`\(${H.box(T`${w}\text{ liters}`)}\)`),
        };
      },
    },
    alloy: {
      name: 'Metal alloy',
      gen(rng) {
        let p1, p2, p3, N, a, b2;
        do { p1 = rng.int(1, 5) * 10; p2 = rng.int(5, 9) * 10; N = rng.int(2, 12) * 10; a = rng.int(1, N / 10 - 1) * 10; b2 = N - a; p3 = (p1 * a + p2 * b2) / N; } while (p1 >= p2 || !Number.isInteger(p3) || a === b2);
        const W = 380, Hh = 140;
        const ingot = (x, y, lbl, cls) => S.poly([[x, y], [x + 76, y], [x + 64, y - 28], [x + 12, y - 28]], 'ln ' + cls) + S.text(x + 38, y - 9, lbl, { cls: 'tx small', w: 700 });
        let v = ingot(20, 90, p1 + '%', 'sun') + S.text(58, 112, 'a kg', { cls: 'tx small' });
        v += S.text(116, 82, '+', { cls: 'tx', size: 24, w: 700 }) + ingot(134, 90, p2 + '%', 'wood') + S.text(172, 112, 'b kg', { cls: 'tx small' });
        v += S.text(228, 82, '=', { cls: 'tx', size: 24, w: 700 }) + ingot(250, 90, p3 + '%', 'soft2') + S.text(288, 112, N + ' kg', { cls: 'tx small' }) + S.text(190, 130, 'percent copper by weight', { cls: 'tx small mut' });
        const e1 = `a+b=${N}`, e2 = `${p1 / 100}a+${p2 / 100}b=${p3 / 100}*${N}`;
        const e1t = `a + b = ${N}`, e2t = `${p1 / 100}a + ${p2 / 100}b = ${p3 / 100}\\left(${N}\\right)`;
        return {
          prompt: T`A metalworker has one alloy that is ${p1}% copper and another that is ${p2}% copper. How many kilograms of each should be melted together to make ${N} kg of an alloy that is ${p3}% copper? Let \(a\) be the kilograms of ${p1}% alloy and \(b\) the kilograms of ${p2}% alloy.`,
          visual: S.svg(W, Hh, v, 'Two copper alloys combined into one'),
          parts: sysParts(['a', 'b'], [e1, e2], T`${e1t},\quad ${e2t}`, [
            { label: 'b', ask: T`kg of the ${p1}% alloy`, kind: 'num', pre: 'a =', answer: String(a), show: 'a = ' + a, post: 'kg', points: 1 },
            { label: 'c', ask: T`kg of the ${p2}% alloy`, kind: 'num', pre: 'b =', answer: String(b2), show: 'b = ' + b2, post: 'kg', points: 1 },
          ]),
          solution: solveSteps(e1t, e2t, [
            T`Weights add to ${N}; the copper in each part adds to the copper in the result, \(${p3 / 100}\cdot${N} = ${(p3 * N) / 100}\) kg.`,
            T`Substitute \(a = ${N} - b\): \(${p1 / 100}\left(${N} - b\right) + ${p2 / 100}b = ${(p3 * N) / 100}\), so \(${(p2 - p1) / 100}b = ${((p3 - p1) * N) / 100}\) and \(b = ${b2}\)`,
          ], T`\(${H.box(T`a = ${a}\text{ kg},\ b = ${b2}\text{ kg}`)}\)`),
        };
      },
    },
  };
  MX.register({
    id: 'w-mixture', kind: 'word', section: SEC, title: 'Mixture problems', sources: ['Exam 1 #26', 'Exam 2 #29'],
    slots: [
      { label: 'Value mixture', source: 'Exam 1 #26', pool: ['dry', 'invest'] },
      { label: 'Percent mixture', source: 'Exam 2 #29', pool: ['solution', 'dilute', 'alloy'] },
    ],
    lesson: T`<p>Every mixture problem gives you two equations:</p>
<ol><li><strong>Amount</strong>: the parts add up to the whole. \(S + F = 40\)</li>
<li><strong>Value or ingredient</strong>: (rate × amount) for each part adds up to (rate × amount) for the whole.<br>
Price: \(70S + 90F = 77.50\cdot 40\). Percent: \(0.20x + 0.70\cdot60 = 0.50y\). Interest: \(0.04x + 0.06y = 620\)</li></ol>
<p>A table helps: rows for each ingredient and the mixture; columns amount, rate, amount × rate.</p>
<p>Pure water is 0%; a pure substance is 100%. Type equations like <code>70S + 90F = 77.5(40)</code>; any equivalent form is accepted.</p>`,
    variants: mixture,
  });

  // ================= LINEAR SYSTEMS IN CONTEXT =================
  const systems = {
    tickets: {
      name: 'Ticket sales',
      gen(rng) {
        const ev = rng.pick(['the premiere of a new movie', 'a school play', 'a county fair', 'a minor-league game']);
        let pa, pc, A, C, N, R;
        do { pa = rng.int(12, 30) / 2; pc = rng.int(4, pa * 2 - 4) / 2; N = rng.int(10, 60) * 10; A = rng.int(1, N / 10 - 1) * 10; C = N - A; R = pa * A + pc * C; } while (pc >= pa || A === C);
        const W = 380, Hh = 140;
        let v = I.ticket(20, 30, 160, 48, 'ADULT ' + money2(pa), 'soft') + I.ticket(20, 86, 160, 48, 'CHILD ' + money2(pc), 'soft2');
        v += S.text(270, 64, N + ' tickets sold', { cls: 'tx', w: 700 }) + S.text(270, 92, 'total ' + money2(R), { cls: 'tx', w: 700 });
        const e1 = `A+C=${N}`, e2 = `${pa}A+${pc}C=${R}`;
        const e1t = `A + C = ${N}`, e2t = `${MX.num(pa)}A + ${MX.num(pc)}C = ${MX.commas(R)}`;
        return {
          prompt: T`A theater charges ${money2(pa)} for an adult ticket and ${money2(pc)} for a child's ticket. For ${ev}, ${N} tickets were sold for a total revenue of ${money2(R)}. How many of each ticket were sold? Use \(A\) for adult tickets and \(C\) for child tickets.`,
          visual: S.svg(W, Hh, v, 'Adult and child tickets with prices and totals'),
          parts: sysParts(['A', 'C'], [e1, e2], T`${e1t},\quad ${e2t}`, [
            { label: 'b', ask: 'Adult tickets sold', kind: 'num', pre: 'A =', answer: String(A), show: 'A = ' + A, points: 1 },
            { label: 'c', ask: 'Child tickets sold', kind: 'num', pre: 'C =', answer: String(C), show: 'C = ' + C, points: 1 },
          ]),
          solution: solveSteps(e1t, e2t, [
            T`Count equation: the tickets add to ${N}. Money equation: price × number for each type adds to ${money2(R)}.`,
            T`Substitute \(C = ${N} - A\): \(${MX.num(pa)}A + ${MX.num(pc)}\left(${N} - A\right) = ${R}\), so \(${MX.num(pa - pc)}A = ${MX.num(R - pc * N)}\) and \(A = ${A}\)`,
          ], T`\(${H.box(T`A = ${A},\ C = ${C}`)}\)`),
        };
      },
    },
    coins: {
      name: 'Coins',
      gen(rng) {
        const [n1, v1, s1, n2, v2, s2] = rng.pick([['dimes', 0.1, 'd', 'quarters', 0.25, 'q'], ['nickels', 0.05, 'n', 'dimes', 0.1, 'd'], ['nickels', 0.05, 'n', 'quarters', 0.25, 'q']]);
        let a, b2, V;
        do { a = rng.int(5, 40); b2 = rng.int(5, 40); V = Math.round((a * v1 + b2 * v2) * 100) / 100; } while (a === b2);
        const N = a + b2;
        const W = 380, Hh = 130;
        let v = '';
        for (let k = 0; k < 4; k++) v += I.coin(40 + k * 22, 60 + (k % 2) * 10, 13, Math.round(v1 * 100) + '¢', 'soft');
        for (let k = 0; k < 4; k++) v += I.coin(150 + k * 26, 62 + (k % 2) * 8, 16, Math.round(v2 * 100) + '¢', 'sun');
        v += S.text(310, 58, N + ' coins', { cls: 'tx', w: 700 }) + S.text(310, 84, 'worth ' + money2(V), { cls: 'tx', w: 700 });
        const e1 = `${s1}+${s2}=${N}`, e2 = `${v1}${s1}+${v2}${s2}=${V}`;
        const e1t = `${s1} + ${s2} = ${N}`, e2t = `${v1}${s1} + ${v2}${s2} = ${MX.money(V)}`;
        return {
          prompt: T`A jar holds only ${n1} and ${n2}. There are ${N} coins worth ${money2(V)} in all. How many of each coin are there? Let \(${s1}\) be the number of ${n1} and \(${s2}\) the number of ${n2}.`,
          visual: S.svg(W, Hh, v, 'A pile of two kinds of coins'),
          parts: sysParts([s1, s2], [e1, e2], T`${e1t},\quad ${e2t}`, [
            { label: 'b', ask: T`Number of ${n1}`, kind: 'num', pre: s1 + ' =', answer: String(a), show: s1 + ' = ' + a, points: 1 },
            { label: 'c', ask: T`Number of ${n2}`, kind: 'num', pre: s2 + ' =', answer: String(b2), show: s2 + ' = ' + b2, points: 1 },
          ]),
          solution: solveSteps(e1t, e2t, [
            T`Multiply equation 2 by 100 to work in cents: \(${Math.round(v1 * 100)}${s1} + ${Math.round(v2 * 100)}${s2} = ${Math.round(V * 100)}\)`,
            T`Substitute \(${s1} = ${N} - ${s2}\): \(${Math.round(v1 * 100) * N} + ${Math.round((v2 - v1) * 100)}${s2} = ${Math.round(V * 100)}\), so \(${s2} = ${b2}\)`,
          ], T`\(${H.box(T`${s1} = ${a},\ ${s2} = ${b2}`)}\)`),
        };
      },
    },
    orders: {
      name: 'Two orders',
      gen(rng) {
        const [i1, i2, s1, s2] = rng.pick([['hot dogs', 'sodas', 'h', 's'], ['burritos', 'drinks', 'b', 'd'], ['notebooks', 'pens', 'n', 'p'], ['bagels', 'coffees', 'b', 'c']]);
        const qty = (n, w) => n + ' ' + (n === 1 ? w.replace(/s$/, '') : w);
        let p1, p2, a1, b1, a2, b2;
        do { p1 = rng.int(8, 30) / 4; p2 = rng.int(4, 16) / 4; a1 = rng.int(1, 5); b1 = rng.int(1, 5); a2 = rng.int(1, 5); b2 = rng.int(1, 5); } while (a1 * b2 - a2 * b1 === 0 || p1 === p2);
        const T1 = a1 * p1 + b1 * p2, T2 = a2 * p1 + b2 * p2;
        const W = 380, Hh = 150;
        const receipt = (x, n, a, b, tot) => S.rect(x, 20, 140, 110, 'ln paperf', 3) + S.text(x + 70, 42, 'Order ' + n, { cls: 'tx small', w: 700 }) +
          S.text(x + 14, 66, qty(a, i1), { cls: 'tx small', a: 'start' }) + S.text(x + 14, 86, qty(b, i2), { cls: 'tx small', a: 'start' }) +
          S.line(x + 12, 98, x + 128, 98, 'ln thin dash') + S.text(x + 126, 118, 'total ' + money2(tot), { cls: 'tx small', a: 'end', w: 700 });
        const v = receipt(30, 1, a1, b1, T1) + receipt(210, 2, a2, b2, T2);
        const e1 = `${a1}${s1}+${b1}${s2}=${T1}`, e2 = `${a2}${s1}+${b2}${s2}=${T2}`;
        const e1t = `${MX.coef(a1)}${s1} + ${MX.coef(b1)}${s2} = ${MX.money(T1)}`, e2t = `${MX.coef(a2)}${s1} + ${MX.coef(b2)}${s2} = ${MX.money(T2)}`;
        return {
          prompt: T`At a food stand, ${qty(a1, i1)} and ${qty(b1, i2)} cost ${money2(T1)}. At the same prices, ${qty(a2, i1)} and ${qty(b2, i2)} cost ${money2(T2)}. Find the price of each item. Let \(${s1}\) be the price of one of the ${i1} and \(${s2}\) the price of one of the ${i2}.`,
          visual: S.svg(W, Hh, v, 'Two receipts with different quantities and totals'),
          parts: sysParts([s1, s2], [e1, e2], T`${e1t},\quad ${e2t}`, [
            { label: 'b', ask: T`Price of one of the ${i1}`, kind: 'num', pre: s1 + ' = $', answer: MX.money(p1), tol: 0.005, show: '\\$' + MX.money(p1), points: 1 },
            { label: 'c', ask: T`Price of one of the ${i2}`, kind: 'num', pre: s2 + ' = $', answer: MX.money(p2), tol: 0.005, show: '\\$' + MX.money(p2), points: 1 },
          ]),
          solution: solveSteps(e1t, e2t, [
            T`Each order gives one equation: (number × price) for each item adds to the total.`,
            T`Eliminate one variable (multiply so the \(${s1}\)-terms match, then subtract): \(${s2} = ${MX.money(p2)}\), then substitute back: \(${s1} = ${MX.money(p1)}\)`,
          ], T`\(${H.box(T`${s1} = \$${MX.money(p1)},\ ${s2} = \$${MX.money(p2)}`)}\)`),
        };
      },
    },
    numbers: {
      name: 'Two numbers',
      gen(rng) {
        const x = rng.int(12, 90), y = rng.int(5, x - 3);
        const S1 = x + y, D1 = x - y;
        const W = 380, Hh = 120;
        let v = S.rect(40, 30, 150, 34, 'ln soft', 4) + S.rect(190, 30, 90, 34, 'ln soft2', 4);
        v += S.text(115, 52, 'x', { cls: 'tx', w: 700 }) + S.text(235, 52, 'y', { cls: 'tx', w: 700 });
        v += S.dim(40, 84, 280, 84, 'sum ' + S1) + S.text(330, 52, 'x − y = ' + D1, { cls: 'tx small' });
        return {
          prompt: T`The sum of two numbers is ${S1}. Their difference is ${D1}. Find the numbers. Let \(x\) be the larger number and \(y\) the smaller.`,
          visual: S.svg(W, Hh, v, 'Two bars for the unknown numbers with their sum'),
          parts: sysParts(['x', 'y'], [`x+y=${S1}`, `x-y=${D1}`], T`x + y = ${S1},\quad x - y = ${D1}`, [
            { label: 'b', ask: 'Larger number', kind: 'num', pre: 'x =', answer: String(x), show: 'x = ' + x, points: 1 },
            { label: 'c', ask: 'Smaller number', kind: 'num', pre: 'y =', answer: String(y), show: 'y = ' + y, points: 1 },
          ]),
          solution: solveSteps(`x + y = ${S1}`, `x - y = ${D1}`, [T`Add the equations: \(2x = ${S1 + D1}\), so \(x = ${x}\). Then \(y = ${S1} - ${x} = ${y}\).`], T`\(${H.box(T`x = ${x},\ y = ${y}`)}\)`),
        };
      },
    },
    plans: {
      name: 'Comparing two plans',
      gen(rng) {
        let f1, r1, f2, r2, x0;
        do { f1 = rng.int(1, 8) * 5; r1 = rng.int(4, 14); r2 = rng.int(2, r1 - 1); x0 = rng.int(2, 12); f2 = f1 + (r1 - r2) * x0; } while (f2 > 120 || r1 <= r2);
        const y0 = f1 + r1 * x0;
        const pl = S.plane({ xmin: 0, xmax: x0 * 2, ymin: 0, ymax: Math.ceil((f1 + r1 * x0 * 2) / 50) * 50, w: 230, h: 170, step: Math.max(1, Math.round(x0 / 3)), ystep: 50, labelEvery: Math.max(2, Math.round(x0 / 2)), ylabelEvery: 100, xlabel: 'classes', ylabel: '$' });
        let v = pl.body + pl.seg(0, f1, x0 * 2, f1 + r1 * x0 * 2, 'acc thick') + pl.seg(0, f2, x0 * 2, f2 + r2 * x0 * 2, 'ln thick dash') + S.q(pl.X(x0), pl.Y(y0) - 8, '?');
        v = S.g(v, 'translate(140 0)') + S.text(70, 50, 'Plan A: ' + $(f1), { cls: 'tx small', w: 700 }) + S.text(70, 66, '+ ' + $(r1) + ' per class', { cls: 'tx small' }) +
          S.text(70, 100, 'Plan B: ' + $(f2), { cls: 'tx small', w: 700 }) + S.text(70, 116, '+ ' + $(r2) + ' per class', { cls: 'tx small' });
        return {
          prompt: T`A gym offers two plans. Plan A costs ${$(f1)} to join plus ${$(r1)} per class. Plan B costs ${$(f2)} to join plus ${$(r2)} per class. Let \(x\) be the number of classes and \(y\) the total cost in dollars. For how many classes do the plans cost the same, and what is that cost?`,
          visual: S.svg(380, 170, v, 'Two cost lines crossing on a graph'),
          parts: sysParts(['x', 'y'], [`y=${f1}+${r1}x`, `y=${f2}+${r2}x`], T`y = ${f1} + ${r1}x,\quad y = ${f2} + ${r2}x`, [
            { label: 'b', ask: 'Number of classes when the costs are equal', kind: 'num', pre: 'x =', answer: String(x0), show: 'x = ' + x0, points: 1 },
            { label: 'c', ask: 'The cost at that point', kind: 'num', pre: 'y = $', answer: String(y0), show: '\\$' + y0, points: 1 },
          ]),
          solution: solveSteps(`y = ${f1} + ${r1}x`, `y = ${f2} + ${r2}x`, [
            T`Both equal \(y\), so set them equal: \(${f1} + ${r1}x = ${f2} + ${r2}x\)`,
            T`\(${r1 - r2}x = ${f2 - f1}\), so \(x = ${x0}\); then \(y = ${f1} + ${r1}\cdot${x0} = ${y0}\)`,
          ], T`\(${H.box(T`${x0}\text{ classes},\ \$${y0}`)}\)`),
        };
      },
    },
  };
  MX.register({
    id: 'w-systems', kind: 'word', section: SEC, title: 'Linear systems in context', sources: ['Exam 3 #23'],
    slots: [{ label: 'Linear systems', source: 'Exam 3 #23', pool: ['tickets', 'coins', 'orders', 'numbers', 'plans'] }],
    lesson: T`<p>When a story has <strong>two unknowns</strong>, you need <strong>two equations</strong>. Usually one counts things and the other adds up their value.</p>
<ol><li>Name the unknowns with the letters given (\(A\) = adult tickets, \(C\) = child tickets).</li>
<li>Count equation: \(A + C = 500\).</li><li>Value equation: (price × number) + (price × number) = total, \(7A + 3.5C = 2450\).</li>
<li>Solve by substitution or elimination, and check that the answers make sense (whole numbers of tickets, positive amounts).</li></ol>
<p>"Two plans cost the same" means set the two cost expressions equal.</p>`,
    variants: systems,
  });
})(typeof window !== 'undefined' ? window : globalThis);

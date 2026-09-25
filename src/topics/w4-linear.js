/* Word problems: linear models (slope as a rate of change) */
(function (G) {
  'use strict';
  const MX = G.MX;
  const { Q, T, H, S } = MX;
  const I = S.I;
  const SEC = 'Word problems';

  const niceStep = (range) => {
    const raw = range / 5, p = Math.pow(10, Math.floor(Math.log10(raw)));
    for (const k of [1, 2, 2.5, 5, 10]) if (k * p >= raw) return k * p;
    return 10 * p;
  };
  const dec = (q) => MX.num(q.val(), 4);

  // ---- contexts: m is a Q (slope), b a number (intercept) ----
  const CTX = [
    {
      key: 'lake', dep: { s: 'T', noun: 'water temperature', unit: '°C', u1: '°C' }, ind: { s: 'd', noun: 'depth', unit: 'feet', u1: 'foot deeper', per: 'foot' },
      up: 'rises', down: 'drops',
      gen: (rng) => ({ m: rng.pick([new Q(-11, 20), new Q(-3, 10), new Q(-1, 4), new Q(-2, 5), new Q(-9, 20)]), b: rng.int(120, 220) / 10 }),
      formula: (e) => T`The temperature of the water in a lake on an October day is given by \(${e}\), where \(d\) is the number of feet below the surface and \(T\) is the temperature in degrees Celsius.`,
      story: (m, b) => T`At the surface, the water in a lake is ${b} °C. It gets ${dec(m.abs())} °C colder for every foot you go down.`,
      when: (y) => `At what depth is the water ${y} °C?`, xWord: 'feet deep',
      icon: (x, y) => S.rect(x, y + 20, 80, 50, 'water nostroke') + S.line(x, y + 20, x + 80, y + 20, 'ln') + I.thermo(x + 40, y + 62, 38, 0.4),
    },
    {
      key: 'altitude', dep: { s: 'T', noun: 'air temperature', unit: '°F', u1: '°F' }, ind: { s: 'h', noun: 'altitude', unit: 'thousand feet', u1: 'thousand feet higher', per: 'thousand feet' },
      up: 'rises', down: 'drops',
      gen: (rng) => ({ m: new Q(-rng.pick([6, 7, 8, 9, 11]), 2), b: rng.int(55, 85) }),
      formula: (e) => T`On a hike, the air temperature is modeled by \(${e}\), where \(h\) is the altitude in thousands of feet and \(T\) is in °F.`,
      story: (m, b) => T`At sea level the air is ${b} °F, and it cools ${dec(m.abs())} °F for every thousand feet you climb.`,
      when: (y) => `At what altitude (in thousands of feet) is it ${y} °F?`, xWord: 'thousand feet',
      icon: (x, y) => S.poly([[x, y + 70], [x + 40, y + 10], [x + 80, y + 70]], 'ln soft2') + S.poly([[x + 32, y + 22], [x + 40, y + 10], [x + 48, y + 22]], 'paperf nostroke'),
    },
    {
      key: 'river', dep: { s: 'F', noun: 'water level', unit: 'feet', u1: 'foot' }, ind: { s: 'd', noun: 'time', unit: 'days', u1: 'day', per: 'day' },
      up: 'rises', down: 'falls',
      gen: (rng) => ({ m: rng.pick([new Q(-5, 2), new Q(-3, 2), new Q(-2), new Q(-3), new Q(-4, 3)]), b: rng.int(4, 8) * 5 }),
      formula: (e) => T`The equation \(${e}\) gives the water level of a river (\(F\), in feet) after \(d\) days.`,
      story: (m, b) => T`After a flood, a river is ${b} feet deep. The water level falls ${dec(m.abs())} feet each day.`,
      when: (y) => `After how many days will the water level be ${y} feet?`, xWord: 'days',
      icon: (x, y) => S.rect(x, y + 36, 80, 34, 'water nostroke') + S.rect(x + 50, y + 4, 8, 66, 'wood nostroke') + [0, 1, 2, 3].map((k) => S.line(x + 58, y + 12 + k * 14, x + 64, y + 12 + k * 14, 'ln thin')).join(''),
    },
    {
      key: 'tank', dep: { s: 'G', noun: 'amount of water in the tank', unit: 'gallons', u1: 'gallon' }, ind: { s: 't', noun: 'time', unit: 'minutes', u1: 'minute', per: 'minute' },
      up: 'increases', down: 'decreases',
      gen: (rng) => ({ m: new Q(-rng.int(5, 25)), b: rng.int(8, 24) * 25 }),
      formula: (e) => T`A tank is being drained. The amount of water left is \(${e}\), where \(G\) is in gallons and \(t\) is the time in minutes.`,
      story: (m, b) => T`A tank holds ${b} gallons of water. It drains at ${dec(m.abs())} gallons per minute.`,
      when: (y) => `After how many minutes will ${y} gallons be left?`, xWord: 'minutes',
      icon: (x, y) => S.rect(x + 10, y + 6, 56, 60, 'ln paperf', 4) + S.rect(x + 12, y + 30, 52, 34, 'water nostroke') + S.path(`M${x + 66} ${y + 56} h10 v10`, 'ln'),
    },
    {
      key: 'candle', dep: { s: 'H', noun: 'height of the candle', unit: 'inches', u1: 'inch' }, ind: { s: 't', noun: 'time', unit: 'hours', u1: 'hour', per: 'hour' },
      up: 'grows', down: 'shrinks',
      gen: (rng) => ({ m: rng.pick([new Q(-1, 2), new Q(-3, 4), new Q(-1), new Q(-3, 2), new Q(-5, 4)]), b: rng.int(8, 16) }),
      formula: (e) => T`A burning candle's height is \(${e}\) inches after \(t\) hours.`,
      story: (m, b) => T`A new candle is ${b} inches tall. It burns down ${dec(m.abs())} inches every hour.`,
      when: (y) => `After how many hours will the candle be ${y} inches tall?`, xWord: 'hours',
      icon: (x, y) => S.rect(x + 28, y + 24, 24, 46, 'ln soft2', 2) + S.path(`M${x + 40} ${y + 4} q8 10 0 18 q-8 -8 0 -18 z`, 'sun ln thin'),
    },
    {
      key: 'savings', dep: { s: 'y', noun: 'savings', unit: 'dollars', u1: 'dollar' }, ind: { s: 'x', noun: 'time', unit: 'weeks', u1: 'week', per: 'week' },
      up: 'increase', down: 'decrease',
      gen: (rng) => ({ m: new Q(rng.int(1, 8) * 5), b: rng.int(1, 10) * 10 }),
      formula: (e) => T`Tristan's savings are given by \(${e}\), where \(y\) is in dollars and \(x\) is the number of weeks he has been delivering papers.`,
      story: (m, b) => T`Tristan has $${b} saved. He earns $${dec(m)} each week delivering papers.`,
      when: (y) => `Tristan needs $${y} for a new bike. After how many weeks will he have it?`, xWord: 'weeks',
      icon: (x, y) => I.piggy(x + 36, y + 40, 26) + I.coin(x + 70, y + 12, 9, '$'),
    },
    {
      key: 'taxi', dep: { s: 'C', noun: 'fare', unit: 'dollars', u1: 'dollar' }, ind: { s: 'm', noun: 'distance', unit: 'miles', u1: 'mile', per: 'mile' },
      up: 'increases', down: 'decreases',
      gen: (rng) => ({ m: new Q(rng.pick([6, 8, 9, 10, 11, 12]), 4), b: rng.pick([2, 2.5, 3, 3.5, 4]) }),
      formula: (e) => T`A taxi fare is \(${e}\) dollars for a ride of \(m\) miles.`,
      story: (m, b) => T`A taxi charges $${MX.money(b)} to start the ride plus $${MX.money(m.val())} for each mile.`,
      when: (y) => `How many miles can you ride for $${MX.money(y)}?`, xWord: 'miles',
      icon: (x, y) => I.car(x + 40, y + 62, false, 'sun') + S.rect(x + 26, y + 22, 28, 12, 'ln paperf', 2) + S.text(x + 40, y + 31, 'TAXI', { cls: 'tx', size: 8, w: 700 }),
    },
    {
      key: 'phone', dep: { s: 'C', noun: 'monthly bill', unit: 'dollars', u1: 'dollar' }, ind: { s: 'g', noun: 'data used', unit: 'gigabytes', u1: 'gigabyte', per: 'gigabyte' },
      up: 'increases', down: 'decreases',
      gen: (rng) => ({ m: new Q(rng.int(4, 15)), b: rng.int(3, 9) * 5 }),
      formula: (e) => T`A phone plan's monthly bill is \(${e}\) dollars when you use \(g\) gigabytes of data.`,
      story: (m, b) => T`A phone plan costs $${b} a month plus $${dec(m)} for each gigabyte of data.`,
      when: (y) => `How many gigabytes give a bill of $${y}?`, xWord: 'gigabytes',
      icon: (x, y) => S.rect(x + 24, y + 4, 34, 64, 'ln soft2', 6) + S.rect(x + 28, y + 12, 26, 44, 'paperf nostroke') + [0, 1, 2].map((k) => S.rect(x + 32 + k * 7, y + 44 - k * 8, 5, 8 + k * 8, 'accf nostroke')).join(''),
    },
    {
      key: 'plant', dep: { s: 'h', noun: 'height of the plant', unit: 'centimeters', u1: 'centimeter' }, ind: { s: 'w', noun: 'time', unit: 'weeks', u1: 'week', per: 'week' },
      up: 'grows', down: 'shrinks',
      gen: (rng) => ({ m: new Q(rng.pick([1, 2, 3, 4, 5]), 2), b: rng.int(2, 12) }),
      formula: (e) => T`A plant's height is \(${e}\) centimeters after \(w\) weeks.`,
      story: (m, b) => T`A seedling is ${b} cm tall when you buy it, and it grows ${dec(m)} cm each week.`,
      when: (y) => `After how many weeks will the plant be ${y} cm tall?`, xWord: 'weeks',
      icon: (x, y) => S.poly([[x + 22, y + 48], [x + 58, y + 48], [x + 52, y + 72], [x + 28, y + 72]], 'ln wood') + S.line(x + 40, y + 48, x + 40, y + 14, 'ln') + S.ellipse(x + 30, y + 26, 10, 5, 'leaf nostroke') + S.ellipse(x + 50, y + 18, 10, 5, 'leaf nostroke'),
    },
    {
      key: 'car', dep: { s: 'V', noun: 'value of the car', unit: 'dollars', u1: 'dollar' }, ind: { s: 't', noun: 'age of the car', unit: 'years', u1: 'year', per: 'year' },
      up: 'increases', down: 'decreases',
      gen: (rng) => ({ m: new Q(-rng.int(12, 30) * 100), b: rng.int(30, 70) * 500 }),
      formula: (e) => T`The value of a car is \(${e}\) dollars, where \(t\) is the number of years since it was bought.`,
      story: (m, b) => T`A car costs $${MX.commas(b)} new and loses $${MX.commas(-m.val())} in value each year.`,
      when: (y) => `After how many years will the car be worth $${MX.commas(y)}?`, xWord: 'years',
      icon: (x, y) => I.car(x + 40, y + 60, false) + S.arrow(x + 70, y + 8, x + 70, y + 30, 'acc', 7) + S.text(x + 58, y + 20, '$', { cls: 'tx', w: 700 }),
    },
    {
      key: 'pool', dep: { s: 'G', noun: 'water in the pool', unit: 'gallons', u1: 'gallon' }, ind: { s: 't', noun: 'time', unit: 'minutes', u1: 'minute', per: 'minute' },
      up: 'increases', down: 'decreases',
      gen: (rng) => ({ m: new Q(rng.int(2, 12) * 5), b: rng.int(2, 16) * 50 }),
      formula: (e) => T`While a pool is being filled, it holds \(${e}\) gallons of water after \(t\) minutes.`,
      story: (m, b) => T`A pool already has ${b} gallons in it. A hose adds ${dec(m)} gallons per minute.`,
      when: (y) => `After how many minutes will the pool hold ${MX.commas(y)} gallons?`, xWord: 'minutes',
      icon: (x, y) => S.rect(x + 4, y + 36, 72, 30, 'ln paperf', 3) + S.rect(x + 6, y + 44, 68, 20, 'water nostroke') + S.path(`M${x + 76} ${y + 8} q-20 0 -20 26`, 'ln thick nofill'),
    },
  ];

  // equation of a context:  s = m*x + b
  function eqn(c, m, b, dep, ind) {
    const d = dep || c.dep.s, v = ind || c.ind.s;
    const mt = (m.n < 0 ? '-' : '') + (m.abs().eq(1) ? '' : m.d === 1 ? String(Math.abs(m.n)) : m.abs().tex());
    const tex = d + ' = ' + mt + v + (b ? (b < 0 ? ' - ' : ' + ') + MX.num(Math.abs(b)) : '');
    const asc = d + '=' + (m.d === 1 ? String(m.n) : '(' + m.str() + ')') + v + (b ? (b < 0 ? '-' : '+') + MX.num(Math.abs(b)) : '');
    return { tex, asc };
  }
  function pickTarget(rng, m, b) {
    const mv = m.val();
    const xmaxDec = mv < 0 ? Math.floor(b / -mv) - 1 : 40;
    for (let k = 0; k < 200; k++) {
      const x = rng.int(2, Math.max(3, Math.min(xmaxDec, 40)));
      const y = mv * x + b;
      if (Math.abs(y * 100 - Math.round(y * 100)) < 1e-6 && (mv > 0 || y > 0)) return { x, y: Math.round(y * 100) / 100 };
    }
    return { x: 2, y: Math.round((mv * 2 + b) * 100) / 100 };
  }
  function windowFor(m, b, tx) {
    const mv = m.val();
    let xmax = mv < 0 ? Math.max(tx + 1, (b / -mv) * 1.05) : Math.max(tx * 1.25, 5);
    const xs = niceStep(xmax);
    xmax = Math.ceil(xmax / xs) * xs;
    let ymax = Math.max(b, mv * xmax + b) * 1.12;
    const ys = niceStep(ymax);
    ymax = Math.ceil(ymax / ys) * ys;
    return { xmax, xs, ymax, ys };
  }
  function ctxGraph(c, lines, win, o = {}) {
    const pl = S.plane({ xmin: 0, xmax: win.xmax, ymin: 0, ymax: win.ymax, w: o.w || 220, h: o.h || 170, step: win.xs, ystep: win.ys, labelEvery: win.xs * 2, ylabelEvery: win.ys * 2, pad: 26, xlabel: c.ind.unit, ylabel: c.dep.unit });
    let b = pl.body;
    lines.forEach(([m, bb, cls]) => { b += pl.curve((x) => m * x + bb, cls || 'acc thick', 60); });
    return { svg: S.svg(pl.W, pl.H, b, o.label || 'graph of the model'), body: b, W: pl.W, H: pl.H };
  }
  const unitsFor = (c) => {
    const opts = [`${c.dep.unit} per ${c.ind.per}`, `${c.ind.unit} per ${c.dep.u1}`, c.dep.unit, c.ind.unit];
    return { answer: opts[0], options: opts };
  };
  function meaning(rng, c, m, b) {
    const mag = dec(m.abs()), ch = m.n > 0 ? c.up : c.down, other = m.n > 0 ? c.down : c.up;
    const indPhrase = c.ind.u1.includes(' ') ? c.ind.u1 : 'additional ' + c.ind.u1;
    const correct = `For each ${indPhrase}, the ${c.dep.noun} ${ch} by ${mag} ${c.dep.unit}.`;
    const wrongs = [
      `For each ${indPhrase}, the ${c.dep.noun} ${other} by ${mag} ${c.dep.unit}.`,
      `For each additional ${c.dep.u1}, the ${c.ind.noun} changes by ${mag} ${c.ind.unit}.`,
      `The ${c.dep.noun} is ${MX.commas(b)} ${c.dep.unit} when the ${c.ind.noun} is 0.`,
    ];
    const ch2 = H.choices(rng, correct, wrongs);
    return { kind: 'choice', options: ch2.options, answer: ch2.answer, correctText: correct };
  }
  const pickCtx = (rng, filter) => rng.pick(filter ? CTX.filter(filter) : CTX);

  const variants = {};
  // ----- slot 1: interpret the slope of a given equation -----
  variants.interpret = {
    name: 'Interpret the slope',
    gen(rng) {
      const c = pickCtx(rng);
      const { m, b } = c.gen(rng);
      const e = eqn(c, m, b);
      const tg = pickTarget(rng, m, b), win = windowFor(m, b, tg.x);
      const g = ctxGraph(c, [[m.val(), b]], win);
      const vis = S.svg(330, g.H, c.icon(8, 40) + S.g(g.body, 'translate(104 0)'), 'Illustration and graph of the linear model');
      const mean = meaning(rng, c, m, b);
      return {
        ctx: c.key,
        prompt: c.formula(e.tex),
        visual: vis,
        parts: [
          { label: 'a', ask: 'What is the slope? (Include units.)', kind: 'num', answer: m.str(), units: unitsFor(c), show: T`${m.tex()}\ \text{${c.dep.unit} per ${c.ind.per}}`, points: 2 },
          { label: 'b', ask: 'Which sentence explains the meaning of the slope?', kind: 'choice', options: mean.options, answer: mean.answer, points: 2 },
        ],
        solution: [
          T`In \(y = mx + b\) form, the slope is the number multiplying \(${c.ind.s}\): \(m = ${m.tex()}\)${m.d > 1 ? T` \(= ${dec(m)}\)` : ''}.`,
          T`Units of slope = (units of \(${c.dep.s}\)) per (unit of \(${c.ind.s}\)): ${c.dep.unit} per ${c.ind.per}.`,
          T`Meaning: ${mean.correctText}`,
        ],
      };
    },
  };
  // ----- slot 2: graph, solve for the input, interpret -----
  variants.graphsolve = {
    name: 'Graph and solve',
    gen(rng) {
      const c = pickCtx(rng);
      const { m, b } = c.gen(rng);
      const e = eqn(c, m, b);
      const tg = pickTarget(rng, m, b), win = windowFor(m, b, tg.x);
      const mv = m.val();
      const opt = (lines) => ctxGraph(c, lines, win, { w: 190, h: 150 }).svg;
      const gc = H.choices(rng, opt([[mv, b]]), [opt([[-mv, b]]), opt([[mv, b * 0.55]]), opt([[mv * 2, b]])]);
      const empty = ctxGraph(c, [], win);
      const vis = S.svg(330, empty.H, c.icon(8, 40) + S.g(empty.body, 'translate(104 0)'), 'Illustration and blank axes for graphing');
      const mean = meaning(rng, c, m, b);
      const un = { answer: c.ind.unit, options: [c.ind.unit, c.dep.unit, c.ind.unit === 'days' ? 'weeks' : 'days'] };
      return {
        ctx: c.key,
        prompt: c.formula(e.tex),
        visual: vis,
        parts: [
          { label: 'a', ask: 'Which graph shows the equation?', kind: 'choice', graph: true, options: gc.options, answer: gc.answer, points: 2 },
          { label: 'b', ask: c.when(tg.y), kind: 'num', answer: String(tg.x), units: un, show: tg.x + '\\text{ ' + c.ind.unit + '}', points: 3 },
          { label: 'c', ask: 'What does the slope represent in this problem?', kind: 'choice', options: mean.options, answer: mean.answer, points: 3 },
        ],
        solution: [
          T`Graph: start at the ${c.dep.s}-intercept \(\left(0, ${MX.num(b)}\right)\) and use the slope \(${m.tex()}\) (rise over run) to find more points.`,
          T`Set \(${c.dep.s} = ${MX.num(tg.y)}\): \(${MX.num(tg.y)} = ${e.tex.split(' = ')[1]}\), so \(${m.tex()}${c.ind.s} = ${MX.num(Math.round((tg.y - b) * 100) / 100)}\) and \(${c.ind.s} = ${tg.x}\)`,
          T`\(${H.box(tg.x + '\\text{ ' + c.ind.unit + '}')}\)`,
          T`Slope: ${mean.correctText}`,
        ],
      };
    },
  };
  // ----- slot 3: build the model from a story -----
  variants.build = {
    name: 'Build the equation',
    gen(rng) {
      const c = pickCtx(rng);
      const { m, b } = c.gen(rng);
      const e = eqn(c, m, b, 'y', 'x');
      const tg = pickTarget(rng, m, b);
      const mean = meaning(rng, c, m, b);
      let v = c.icon(10, 26);
      v += S.rect(110, 26, 210, 30, 'ln soft', 6) + S.text(215, 46, 'start: ' + MX.commas(b) + ' ' + c.dep.unit, { cls: 'tx small', w: 700 });
      v += S.rect(110, 66, 210, 30, 'ln soft2', 6) + S.text(215, 86, (m.n < 0 ? '−' : '+') + dec(m.abs()) + ' ' + c.dep.unit + ' per ' + c.ind.per, { cls: 'tx small', w: 700 });
      return {
        ctx: c.key,
        prompt: T`${c.story(m, b)} Let \(y\) be the ${c.dep.noun} (in ${c.dep.unit}) after \(x\) ${c.ind.unit}.`,
        visual: S.svg(330, 120, v, 'The starting amount and the rate of change'),
        parts: [
          { label: 'a', ask: T`Write an equation for \(y\) after \(x\) ${c.ind.unit}.`, kind: 'eq', form: 'slope', dep: 'y', vars: ['x', 'y'], answer: e.asc, show: e.tex, points: 2 },
          { label: 'b', ask: 'What is the slope? (Include units.)', kind: 'num', answer: m.str(), units: unitsFor(c), show: T`${m.tex()}\ \text{${c.dep.unit} per ${c.ind.per}}`, points: 3 },
          { label: 'c', ask: 'Which sentence interprets the slope?', kind: 'choice', options: mean.options, answer: mean.answer, points: 3 },
          { label: 'd', ask: c.when(tg.y), kind: 'num', answer: String(tg.x), show: tg.x + '\\text{ ' + c.ind.unit + '}', post: c.ind.unit, points: 2 },
        ],
        solution: [
          T`The starting amount is the y-intercept \(b = ${MX.num(b)}\); the amount it changes per ${c.ind.per} is the slope \(m = ${m.tex()}\).`,
          T`\(${H.box(e.tex)}\)`,
          T`Slope: \(${m.tex()}\) ${c.dep.unit} per ${c.ind.per}. ${mean.correctText}`,
          T`Set \(y = ${MX.num(tg.y)}\): \(${MX.num(tg.y)} = ${e.tex.split(' = ')[1]}\), so \(x = ${tg.x}\) ${c.ind.unit}.`,
        ],
      };
    },
  };

  MX.register({
    id: 'w-linear', kind: 'word', section: SEC, title: 'Linear models', sources: ['Exam 1 #23', 'Exam 2 #23', 'Exam 3 #28'],
    slots: [
      { label: 'Interpret the slope', source: 'Exam 1 #23', pool: ['interpret'] },
      { label: 'Graph and solve', source: 'Exam 2 #23', pool: ['graphsolve'] },
      { label: 'Build the equation', source: 'Exam 3 #28', pool: ['build'] },
    ],
    distinctContexts: true,
    lesson: T`<p>A quantity that changes by the same amount every step is a line: \(y = mx + b\).</p>
<ul><li>\(b\), the <strong>y-intercept</strong>, is the starting value (when \(x = 0\)).</li>
<li>\(m\), the <strong>slope</strong>, is the rate of change: how much \(y\) changes for each 1 unit of \(x\). Its units are "(y units) per (x unit)", like dollars per week or °C per foot.</li>
<li>A negative slope means the quantity goes down.</li></ul>
<p><strong>Interpreting the slope</strong>: "For each additional week, the savings increase by 15 dollars." Mention the number, both units, and the direction.</p>
<p><strong>Solving</strong>: to find when \(y\) reaches a value, substitute it for \(y\) and solve for \(x\).</p>`,
    variants,
  });
  MX.linearContexts = CTX;
})(typeof window !== 'undefined' ? window : globalThis);

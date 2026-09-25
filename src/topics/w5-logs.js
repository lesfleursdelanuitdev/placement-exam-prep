/* Word problems: exponential and logarithmic models */
(function (G) {
  'use strict';
  const MX = G.MX;
  const { T, H, S } = MX;
  const I = S.I;
  const SEC = 'Word problems';
  const money2 = (v) => (Number.isInteger(v) ? '$' + MX.commas(v) : '$' + Number(MX.money(v)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const niceStep = (range) => {
    const raw = range / 4, p = Math.pow(10, Math.floor(Math.log10(raw)));
    for (const k of [1, 2, 2.5, 5, 10]) if (k * p >= raw) return k * p;
    return 10 * p;
  };
  const fmtK = (v) => (v >= 1e6 ? MX.num(v / 1e6, 1) + 'M' : v >= 1e4 ? MX.num(v / 1e3, 0) + 'k' : MX.num(v, 1));
  // curve y = f(x) on [0, xmax] with optional target line / markers
  function chart(f, xmax, ymax, o = {}) {
    const xs = niceStep(xmax), ys = niceStep(ymax);
    const X = Math.ceil(xmax / xs) * xs, Y = Math.ceil(ymax / ys) * ys;
    const pl = S.plane({ xmin: 0, xmax: X, ymin: 0, ymax: Y, w: o.w || 250, h: o.h || 170, step: xs, ystep: ys, labelEvery: xs * 2, ylabelEvery: ys * 2, pad: 28, xlabel: o.xl, ylabel: o.yl });
    let b = pl.body.replace(/>(\d+(\.\d+)?)<\/text>/g, (m, n) => '>' + (Number(n) >= 1e4 ? fmtK(Number(n)) : n) + '</text>');
    b += pl.curve(f, 'acc thick', 80);
    if (o.target != null) b += pl.seg(0, o.target, X, o.target, 'ln dash') + S.text(pl.X(X) - 2, pl.Y(o.target) - 5, o.targetLabel || '', { cls: 'tx small', a: 'end' });
    (o.dots || []).forEach(([x, y, lab]) => { b += pl.dot(x, y) + (lab ? S.label(pl.X(x) + 6, pl.Y(y) - 6, lab, { cls: 'lbl', a: 'start' }) : ''); });
    (o.qs || []).forEach(([x, y]) => { b += S.q(pl.X(x), pl.Y(y) - 8); });
    return { body: b, W: pl.W, H: pl.H };
  }
  const withIcon = (icon, c, label) => S.svg(110 + c.W, Math.max(c.H, 120), icon + S.g(c.body, 'translate(110 0)'), label);
  const bank = (x, y) => S.poly([[x, y + 20], [x + 40, y], [x + 80, y + 20]], 'ln soft2') + [0, 1, 2, 3].map((k) => S.rect(x + 8 + k * 18, y + 24, 8, 36, 'ln paperf')).join('') + S.rect(x, y + 62, 80, 8, 'ln soft2') + S.text(x + 40, y + 16, '$', { cls: 'tx small', w: 700 });
  const dish = (x, y, n) => { let b = S.ellipse(x, y, 24, 16, 'ln paperf'); for (let k = 0; k < n; k++) b += S.circle(x - 12 + (k % 4) * 8, y - 6 + Math.floor(k / 4) * 8, 2.6, 'leaf nostroke'); return b; };

  const variants = {};
  // ---------- money ----------
  const FREQ = [[1, 'annually'], [2, 'semiannually'], [4, 'quarterly'], [12, 'monthly']];
  variants.compound = {
    name: 'Compound interest',
    gen(rng) {
      const P = rng.int(4, 40) * 500, r = rng.pick([2, 2.5, 3, 3.5, 4, 4.5, 5, 6]), [n, word] = rng.pick(FREQ), t = rng.int(3, 20);
      const A = P * Math.pow(1 + r / 100 / n, n * t), Ar = Math.round(A * 100) / 100;
      const c = chart((x) => P * Math.pow(1 + r / 100 / n, n * x), t, A * 1.12, { xl: 'years', yl: 'dollars', dots: [[0, P]], qs: [[t, A]] });
      return {
        prompt: T`You deposit ${money2(P)} in an account that pays ${r}% interest compounded ${word}. How much is in the account after ${t} years? Use \(A = P\left(1 + \frac{r}{n}\right)^{nt}\) and round to the nearest cent.`,
        visual: withIcon(bank(14, 30), c, 'An account balance growing over time'),
        parts: [{ kind: 'num', pre: 'A = $', tol: 0.011, answer: MX.money(Ar), show: '\\$' + MX.commas(MX.money(Ar)), points: 3 }],
        solution: [
          T`\(P = ${P}\), \(r = ${r / 100}\) (as a decimal), \(n = ${n}\) (${word}), \(t = ${t}\).`,
          T`\(A = ${P}\left(1 + \frac{${r / 100}}{${n}}\right)^{${n}\cdot${t}} = ${P}\left(${MX.num(1 + r / 100 / n, 6)}\right)^{${n * t}}\)`,
          T`\(A \approx ${H.box('\\$' + MX.commas(MX.money(Ar)))}\)`,
        ],
      };
    },
  };
  variants.continuous = {
    name: 'Continuous compounding',
    gen(rng) {
      const P = rng.int(4, 40) * 500, r = rng.pick([2, 2.5, 3, 3.5, 4, 4.5, 5, 6]), t = rng.int(3, 25);
      const A = P * Math.exp((r / 100) * t), Ar = Math.round(A * 100) / 100;
      const c = chart((x) => P * Math.exp((r / 100) * x), t, A * 1.12, { xl: 'years', yl: 'dollars', dots: [[0, P]], qs: [[t, A]] });
      return {
        prompt: T`${money2(P)} is invested at ${r}% interest compounded continuously. Use \(A = Pe^{rt}\) to find the balance after ${t} years, to the nearest cent.`,
        visual: withIcon(bank(14, 30), c, 'An account balance growing continuously'),
        parts: [{ kind: 'num', pre: 'A = $', tol: 0.011, answer: MX.money(Ar), show: '\\$' + MX.commas(MX.money(Ar)), points: 3 }],
        solution: [T`\(P = ${P}\), \(r = ${r / 100}\), \(t = ${t}\).`, T`\(A = ${P}e^{${r / 100}\cdot${t}} = ${P}e^{${MX.num((r / 100) * t, 4)}}\)`, T`\(e^{${MX.num((r / 100) * t, 4)}} \approx ${MX.num(Math.exp((r / 100) * t), 5)}\), so \(A \approx ${H.box('\\$' + MX.commas(MX.money(Ar)))}\)`],
      };
    },
  };
  variants.goal = {
    name: 'How long to reach a goal',
    gen(rng) {
      const P = rng.int(4, 30) * 500, r = rng.pick([3, 4, 5, 6, 7, 8]), mult = rng.pick([1.5, 2, 2, 3]);
      const Tg = P * mult, cont = rng.chance(0.5);
      const t = cont ? Math.log(mult) / (r / 100) : Math.log(mult) / Math.log(1 + r / 100), tr = Math.round(t * 10) / 10;
      const f = cont ? (x) => P * Math.exp((r / 100) * x) : (x) => P * Math.pow(1 + r / 100, x);
      const c = chart(f, t * 1.3, Tg * 1.25, { xl: 'years', yl: 'dollars', dots: [[0, P]], target: Tg, targetLabel: 'goal ' + money2(Tg), qs: [[t, Tg]] });
      return {
        prompt: cont
          ? T`${money2(P)} is invested at ${r}% compounded continuously (\(A = Pe^{rt}\)). How many years until the account reaches ${money2(Tg)}? Round to the nearest tenth of a year.`
          : T`${money2(P)} is invested at ${r}% interest compounded annually (\(A = P\left(1 + r\right)^{t}\)). How many years until the account reaches ${money2(Tg)}? Round to the nearest tenth of a year.`,
        visual: withIcon(bank(14, 30), c, 'Balance curve reaching a savings goal'),
        parts: [{ kind: 'num', tol: 0.051, post: 'years', answer: tr.toFixed(1), show: tr.toFixed(1) + '\\text{ years}', points: 3 }],
        solution: cont
          ? [T`\(${Tg} = ${P}e^{${r / 100}t}\), so \(e^{${r / 100}t} = ${mult}\)`, T`Take \(\ln\): \(${r / 100}t = \ln ${mult}\), so \(t = \dfrac{\ln ${mult}}{${r / 100}}\)`, T`\(t \approx ${H.box(tr.toFixed(1) + '\\text{ years}')}\)`]
          : [T`\(${Tg} = ${P}\left(${1 + r / 100}\right)^{t}\), so \(\left(${1 + r / 100}\right)^{t} = ${mult}\)`, T`Take \(\ln\): \(t\ln ${1 + r / 100} = \ln ${mult}\), so \(t = \dfrac{\ln ${mult}}{\ln ${1 + r / 100}}\)`, T`\(t \approx ${H.box(tr.toFixed(1) + '\\text{ years}')}\)`],
      };
    },
  };

  // ---------- growth and decay ----------
  variants.population = {
    name: 'Population growth',
    gen(rng) {
      const P0 = rng.int(20, 400) * 1000, k = rng.pick([0.8, 1.2, 1.5, 1.8, 2.1, 2.4, 3]), t = rng.int(5, 30);
      const Pt = P0 * Math.exp((k / 100) * t), Pr = Math.round(Pt);
      const c = chart((x) => P0 * Math.exp((k / 100) * x), t, Pt * 1.15, { xl: 'years', yl: 'people', dots: [[0, P0]], qs: [[t, Pt]] });
      let city = '';
      [[10, 44, 22, 46], [34, 26, 18, 64], [54, 50, 24, 40], [80, 36, 18, 54]].forEach(([x, y, w, h]) => { city += I.building(x, y + h, w, h); });
      return {
        prompt: T`A town has ${MX.commas(P0)} people and grows continuously at ${k}% per year, so \(P = ${MX.commas(P0)}e^{${k / 100}t}\). Estimate the population after ${t} years, to the nearest whole person.`,
        visual: withIcon(city, c, 'A town and its growing population curve'),
        parts: [{ kind: 'num', tol: 1.01, answer: String(Pr), show: MX.commas(Pr) + '\\text{ people}', post: 'people', points: 3 }],
        solution: [T`\(P = ${MX.commas(P0)}e^{${k / 100}\cdot${t}} = ${MX.commas(P0)}e^{${MX.num((k / 100) * t, 4)}}\)`, T`\(e^{${MX.num((k / 100) * t, 4)}} \approx ${MX.num(Math.exp((k / 100) * t), 5)}\)`, T`\(P \approx ${H.box(MX.commas(Pr))}\) people`],
      };
    },
  };
  variants.doubling = {
    name: 'Doubling time',
    gen(rng) {
      const N0 = rng.pick([50, 100, 200, 250, 500]), d = rng.pick([2, 3, 4, 5, 6, 8]), mult = rng.pick([10, 20, 30, 50, 100]);
      const N = N0 * mult, t = d * Math.log(mult) / Math.log(2), tr = Math.round(t * 10) / 10;
      let v = '';
      [1, 2, 4, 8].forEach((n, k) => { v += dish(30 + k * 62, 44, n) + S.text(30 + k * 62, 80, k === 0 ? 'start' : '+' + k * d + ' h', { cls: 'tx small' }); });
      v += S.text(125, 108, 'doubles every ' + d + ' hours', { cls: 'tx small', w: 700 });
      return {
        prompt: T`A culture starts with ${N0} bacteria and doubles every ${d} hours, so \(N = ${N0}\cdot 2^{t/${d}}\). How many hours until there are ${MX.commas(N)} bacteria? Round to the nearest tenth.`,
        visual: S.svg(250, 120, v, 'A bacteria culture doubling'),
        parts: [{ kind: 'num', tol: 0.051, post: 'hours', answer: tr.toFixed(1), show: tr.toFixed(1) + '\\text{ hours}', points: 3 }],
        solution: [T`\(${MX.commas(N)} = ${N0}\cdot 2^{t/${d}}\), so \(2^{t/${d}} = ${mult}\)`, T`Take \(\ln\): \(\dfrac{t}{${d}}\ln 2 = \ln ${mult}\), so \(t = \dfrac{${d}\ln ${mult}}{\ln 2}\)`, T`\(t \approx ${H.box(tr.toFixed(1) + '\\text{ hours}')}\)`],
      };
    },
  };
  variants.halflife = {
    name: 'Half-life',
    gen(rng) {
      const [what, hUnit] = rng.pick([['carbon-14', 'years'], ['iodine-131', 'days'], ['a medicine in the bloodstream', 'hours'], ['strontium-90', 'years']]);
      const A0 = rng.pick([10, 20, 50, 80, 100, 200]), h = hUnit === 'years' ? rng.pick([28, 5730, 30]) : hUnit === 'days' ? 8 : rng.pick([4, 6, 8]);
      const findTime = rng.chance(0.45);
      if (findTime) {
        const frac = rng.pick([0.3, 0.2, 0.1, 0.4, 0.15]), A = A0 * frac, t = h * Math.log(frac) / Math.log(0.5), big = h >= 1000, tr = big ? Math.round(t) : Math.round(t * 10) / 10;
        const c = chart((x) => A0 * Math.pow(0.5, x / h), t * 1.2, A0 * 1.1, { xl: hUnit, yl: 'mg', dots: [[0, A0]], target: A, targetLabel: MX.num(A) + ' mg', qs: [[t, A]] });
        return {
          prompt: T`The half-life of ${what} is ${MX.commas(h)} ${hUnit}. Starting with ${A0} mg, how long until ${MX.num(A)} mg remain? Use \(A = A_{0}\left(\frac{1}{2}\right)^{t/h}\) and round to the nearest ${big ? 'whole number' : 'tenth'}.`,
          visual: S.svg(c.W + 10, c.H, S.g(c.body, 'translate(10 0)'), 'A decay curve falling to a target amount'),
          parts: [{ kind: 'num', tol: big ? 0.51 : 0.051, post: hUnit, answer: big ? String(tr) : tr.toFixed(1), show: (big ? MX.commas(tr) : tr.toFixed(1)) + '\\text{ ' + hUnit + '}', points: 3 }],
          solution: [T`\(${MX.num(A)} = ${A0}\left(\frac{1}{2}\right)^{t/${h}}\), so \(\left(\frac{1}{2}\right)^{t/${h}} = ${frac}\)`, T`Take \(\ln\): \(\dfrac{t}{${h}}\ln\frac{1}{2} = \ln ${frac}\), so \(t = \dfrac{${h}\ln ${frac}}{\ln 0.5}\)`, T`\(t \approx ${H.box((big ? MX.commas(tr) : tr.toFixed(1)) + '\\text{ ' + hUnit + '}')}\)`],
        };
      }
      const t = h * rng.pick([0.5, 1.5, 2.5, 3, 0.75, 2]), A = A0 * Math.pow(0.5, t / h), Ar = Math.round(A * 100) / 100;
      const c = chart((x) => A0 * Math.pow(0.5, x / h), t * 1.3, A0 * 1.1, { xl: hUnit, yl: 'mg', dots: [[0, A0], [h, A0 / 2, 'half']], qs: [[t, A]] });
      return {
        prompt: T`The half-life of ${what} is ${MX.commas(h)} ${hUnit}. How much of a ${A0} mg sample is left after ${MX.commas(t)} ${hUnit}? Use \(A = A_{0}\left(\frac{1}{2}\right)^{t/h}\) and round to the nearest hundredth.`,
        visual: S.svg(c.W + 10, c.H, S.g(c.body, 'translate(10 0)'), 'A half-life decay curve'),
        parts: [{ kind: 'num', tol: 0.011, post: 'mg', answer: Ar.toFixed(2), show: Ar.toFixed(2) + '\\text{ mg}', points: 3 }],
        solution: [T`\(t/h = ${MX.commas(t)}/${MX.commas(h)} = ${MX.num(t / h)}\) half-lives.`, T`\(A = ${A0}\left(\frac{1}{2}\right)^{${MX.num(t / h)}}\)`, T`\(A \approx ${H.box(Ar.toFixed(2) + '\\text{ mg}')}\)`],
      };
    },
  };

  // ---------- log scales ----------
  function phBar(mark) {
    let b = '';
    for (let k = 0; k < 14; k++) b += S.rect(20 + k * 22, 60, 22, 22, 'nostroke', 0).replace('class="nostroke"', 'class="nostroke" style="fill:hsl(' + (k * 20) + ' 70% 55%)"');
    for (let k = 0; k <= 14; k += 2) b += S.text(20 + k * 22, 98, String(k), { cls: 'tx tick' });
    b += S.text(20, 52, 'acidic', { cls: 'tx small', a: 'start' }) + S.text(174, 52, 'neutral', { cls: 'tx small' }) + S.text(328, 52, 'basic', { cls: 'tx small', a: 'end' });
    if (mark != null) b += S.arrow(20 + mark * 22, 30, 20 + mark * 22, 58, 'acc', 7);
    return S.svg(350, 110, b, 'The pH scale from 0 to 14');
  }
  variants.ph = {
    name: 'pH',
    gen(rng) {
      if (rng.chance(0.55)) {
        const a = rng.int(11, 95) / 10, k = rng.int(2, 11), H1 = a * Math.pow(10, -k), ph = -Math.log10(H1), pr = Math.round(ph * 100) / 100;
        return {
          prompt: T`The pH of a solution is \(\text{pH} = -\log\left[\text{H}^{+}\right]\). Find the pH when \(\left[\text{H}^{+}\right] = ${MX.num(a)} \times 10^{-${k}}\) moles per liter. Round to the nearest hundredth.`,
          visual: phBar(null),
          parts: [{ kind: 'num', tol: 0.006, pre: 'pH =', answer: pr.toFixed(2), show: pr.toFixed(2), points: 3 }],
          solution: [T`\(\text{pH} = -\log\left(${MX.num(a)} \times 10^{-${k}}\right) = -\left(\log ${MX.num(a)} + \log 10^{-${k}}\right)\)`, T`\(= -\left(${MX.num(Math.log10(a), 4)} - ${k}\right) = ${k} - ${MX.num(Math.log10(a), 4)}\)`, T`\(\approx ${H.box(pr.toFixed(2))}\)`],
        };
      }
      const p1 = rng.int(2, 6), d = rng.int(1, 4), p2 = p1 + d;
      const [n1, n2] = rng.pick([['lemon juice', 'tomato juice'], ['vinegar', 'coffee'], ['soda', 'milk'], ['acid rain', 'rain water']]);
      return {
        prompt: T`${n1[0].toUpperCase() + n1.slice(1)} has a pH of ${p1} and ${n2} has a pH of ${p2}. Since \(\text{pH} = -\log\left[\text{H}^{+}\right]\), how many times greater is the hydrogen-ion concentration of the ${n1}?`,
        visual: phBar(p1),
        parts: [{ kind: 'num', answer: String(Math.pow(10, d)), show: MX.commas(Math.pow(10, d)) + '\\text{ times}', post: 'times', points: 3 }],
        solution: [T`\(\left[\text{H}^{+}\right] = 10^{-\text{pH}}\): \(10^{-${p1}}\) versus \(10^{-${p2}}\).`, T`\(\dfrac{10^{-${p1}}}{10^{-${p2}}} = 10^{${p2} - ${p1}} = 10^{${d}}\)`, T`Each 1 unit of pH is a factor of 10: \(${H.box(MX.commas(Math.pow(10, d)))}\) times.`],
      };
    },
  };
  variants.decibel = {
    name: 'Decibels',
    gen(rng) {
      const spk = S.rect(20, 40, 24, 36, 'ln soft2', 3) + S.poly([[44, 40], [68, 22], [68, 94], [44, 76]], 'ln soft2') + [0, 1, 2].map((k) => S.path(`M${80 + k * 14} ${40 - k * 6} q12 18 0 36`.replace(/q12 18 0 36/, 'q' + (12 + k * 4) + ' ' + (18 + k * 6) + ' 0 ' + (36 + k * 12)), 'ln nofill')).join('');
      if (rng.chance(0.55)) {
        const a = rng.int(11, 95) / 10, k = rng.int(2, 9), L = 10 * Math.log10((a * Math.pow(10, -k)) / 1e-12), Lr = Math.round(L * 10) / 10;
        return {
          prompt: T`Sound level in decibels is \(L = 10\log\dfrac{I}{I_{0}}\), where \(I_{0} = 10^{-12}\) W/m². Find the level of a sound with intensity \(I = ${MX.num(a)} \times 10^{-${k}}\) W/m². Round to the nearest tenth.`,
          visual: S.svg(200, 110, spk + S.text(150, 104, 'I = ' + MX.num(a) + ' × 10^-' + k, { cls: 'tx small' }), 'A speaker producing sound'),
          parts: [{ kind: 'num', tol: 0.051, post: 'dB', answer: Lr.toFixed(1), show: Lr.toFixed(1) + '\\text{ dB}', points: 3 }],
          solution: [T`\(\dfrac{I}{I_{0}} = \dfrac{${MX.num(a)} \times 10^{-${k}}}{10^{-12}} = ${MX.num(a)} \times 10^{${12 - k}}\)`, T`\(L = 10\left(\log ${MX.num(a)} + ${12 - k}\right) = 10\left(${MX.num(Math.log10(a), 4)} + ${12 - k}\right)\)`, T`\(L \approx ${H.box(Lr.toFixed(1) + '\\text{ dB}')}\)`],
        };
      }
      const L2 = rng.int(4, 7) * 10, d = rng.int(1, 4), L1 = L2 + 10 * d;
      const [s1, s2] = rng.pick([['a rock concert', 'a busy street'], ['a leaf blower', 'a conversation'], ['a siren', 'a vacuum cleaner']]);
      return {
        prompt: T`${s1[0].toUpperCase() + s1.slice(1)} measures ${L1} dB and ${s2} measures ${L2} dB. Using \(L = 10\log\dfrac{I}{I_{0}}\), how many times more intense is ${s1}?`,
        visual: S.svg(200, 110, spk + S.text(150, 104, L1 + ' dB vs ' + L2 + ' dB', { cls: 'tx small' }), 'A speaker producing sound'),
        parts: [{ kind: 'num', answer: String(Math.pow(10, d)), show: MX.commas(Math.pow(10, d)) + '\\text{ times}', post: 'times', points: 3 }],
        solution: [T`\(I = I_{0}\cdot 10^{L/10}\).`, T`\(\dfrac{I_{1}}{I_{2}} = 10^{(${L1} - ${L2})/10} = 10^{${d}}\)`, T`Every 10 dB is a factor of 10: \(${H.box(MX.commas(Math.pow(10, d)))}\) times.`],
      };
    },
  };
  variants.richter = {
    name: 'Earthquake magnitude',
    gen(rng) {
      let wave = '';
      const quake = (x0, amp) => { let d = `M${x0} 60`; for (let k = 0; k < 14; k++) d += ` L${x0 + 4 + k * 8} ${60 + (k % 2 ? 1 : -1) * amp * Math.sin((k + 1) / 4)}`; return d; };
      wave = S.line(10, 60, 330, 60, 'ln thin') + S.path(quake(20, 12), 'ln') + S.path(quake(190, 38), 'acc');
      if (rng.chance(0.5)) {
        const m2 = rng.int(30, 60) / 10, d = rng.int(1, 3), m1 = Math.round((m2 + d) * 10) / 10;
        return {
          prompt: T`Magnitude is \(M = \log\dfrac{I}{I_{0}}\). How many times more intense is a magnitude ${MX.num(m1)} earthquake than a magnitude ${MX.num(m2)} earthquake?`,
          visual: S.svg(340, 110, wave + S.text(70, 104, 'M ' + MX.num(m2), { cls: 'tx small' }) + S.text(240, 104, 'M ' + MX.num(m1), { cls: 'tx small', w: 700 }), 'Seismograph traces of two earthquakes'),
          parts: [{ kind: 'num', answer: String(Math.pow(10, d)), show: MX.commas(Math.pow(10, d)) + '\\text{ times}', post: 'times', points: 3 }],
          solution: [T`\(I = I_{0}\cdot 10^{M}\), so the ratio is \(10^{${MX.num(m1)} - ${MX.num(m2)}} = 10^{${d}}\)`, T`Each whole step in magnitude is a factor of 10.`, T`\(${H.box(MX.commas(Math.pow(10, d)))}\) times`],
        };
      }
      const m2 = rng.int(30, 55) / 10, f = rng.pick([10, 100, 1000, 50, 200, 500]), m1 = m2 + Math.log10(f), mr = Math.round(m1 * 10) / 10;
      return {
        prompt: T`An earthquake is ${MX.commas(f)} times as intense as a magnitude ${MX.num(m2)} earthquake. Using \(M = \log\dfrac{I}{I_{0}}\), what is its magnitude? Round to the nearest tenth.`,
        visual: S.svg(340, 110, wave + S.text(70, 104, 'M ' + MX.num(m2), { cls: 'tx small' }) + S.text(240, 104, MX.commas(f) + '× as intense', { cls: 'tx small', w: 700 }), 'Seismograph traces of two earthquakes'),
        parts: [{ kind: 'num', tol: 0.051, pre: 'M =', answer: mr.toFixed(1), show: mr.toFixed(1), points: 3 }],
        solution: [T`\(M = \log\dfrac{${MX.commas(f)}\,I}{I_{0}} = \log ${MX.commas(f)} + \log\dfrac{I}{I_{0}}\)`, T`\(= ${MX.num(Math.log10(f), 4)} + ${MX.num(m2)}\)`, T`\(\approx ${H.box(mr.toFixed(1))}\)`],
      };
    },
  };

  MX.register({
    id: 'w-logs', kind: 'word', section: SEC, title: 'Exponential & log models', sources: ['added'],
    slots: [
      { label: 'Money growth', source: 'Added', pool: ['compound', 'continuous', 'goal'] },
      { label: 'Growth and decay', source: 'Added', pool: ['population', 'doubling', 'halflife'] },
      { label: 'Log scales', source: 'Added', pool: ['ph', 'decibel', 'richter'] },
    ],
    lesson: T`<p><strong>Growth formulas</strong> (rates as decimals: 5% = 0.05):</p>
<ul><li>Compound interest: \(A = P\left(1 + \frac{r}{n}\right)^{nt}\), with \(n\) = times per year (12 for monthly).</li>
<li>Continuous growth or interest: \(A = Pe^{rt}\).</li>
<li>Doubling every \(d\): \(A = A_{0}\cdot 2^{t/d}\). Half-life \(h\): \(A = A_{0}\left(\frac{1}{2}\right)^{t/h}\).</li></ul>
<p><strong>Finding the amount</strong>: substitute and evaluate. <strong>Finding the time</strong>: isolate the power, then take \(\ln\) of both sides:</p>
\[2000 = 1000e^{0.05t} \Rightarrow e^{0.05t} = 2 \Rightarrow 0.05t = \ln 2 \Rightarrow t \approx 13.9\]
<p><strong>Log scales</strong> turn huge ranges into small numbers: \(\text{pH} = -\log\left[\text{H}^{+}\right]\), decibels \(L = 10\log\frac{I}{I_{0}}\), magnitude \(M = \log\frac{I}{I_{0}}\). One pH unit or one magnitude = a factor of 10; 10 decibels = a factor of 10.</p>`,
    variants,
  });
})(typeof window !== 'undefined' ? window : globalThis);

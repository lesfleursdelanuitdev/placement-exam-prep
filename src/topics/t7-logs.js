/* Logarithms */
(function (G) {
  'use strict';
  const MX = G.MX;
  const { Q, T, H } = MX;
  const SEC = 'Logarithms';
  const ADDED = 'Added';

  // name of a log with base b (number, 10 -> common, 'e' -> natural)
  function L(b) {
    if (b === 'e') return { tex: '\\ln', asc: 'ln', word: 'natural log' };
    if (b === 10) return { tex: '\\log', asc: 'log', word: 'common log' };
    return { tex: '\\log_{' + b + '}', asc: 'log_' + b, word: 'log base ' + b };
  }
  const bval = (b) => (b === 'e' ? Math.E : b);
  const qt = (q) => (q instanceof Q ? q.tex() : String(q));
  const qa = (q) => (q instanceof Q ? q.str() : String(q));
  // coefficient * log(v) as tex / ascii
  function logTerm(c, b, v, first) {
    c = Q.of(c);
    const n = L(b), neg = c.n < 0, a = c.abs();
    const ct = a.eq(1) ? '' : a.tex(), ca = a.eq(1) ? '' : a.d === 1 ? String(a.n) : '(' + a.str() + ')';
    return {
      tex: (neg ? (first ? '-' : ' - ') : first ? '' : ' + ') + ct + n.tex + '\\,' + v,
      asc: (neg ? '-' : first ? '' : '+') + ca + n.asc + '(' + v + ')',
    };
  }
  function sumLogs(list) { // list of [coef, base, var] and numbers [num]
    let tex = '', asc = '', first = true;
    for (const t of list) {
      if (t.length === 1) {
        const c = Q.of(t[0]);
        if (c.n === 0) continue;
        tex += (c.n < 0 ? (first ? '-' : ' - ') : first ? '' : ' + ') + c.abs().tex();
        asc += (c.n < 0 ? '-' : first ? '' : '+') + c.abs().str();
      } else {
        const r = logTerm(t[0], t[1], t[2], first);
        tex += r.tex; asc += r.asc;
      }
      first = false;
    }
    return { tex, asc };
  }
  const BASES = [2, 3, 4, 5, 6, 7, 10];
  const powStr = (b, k) => { const v = Math.pow(b, k); return k >= 0 ? { q: new Q(v), tex: String(v) } : { q: new Q(1, Math.pow(b, -k)), tex: '\\frac{1}{' + Math.pow(b, -k) + '}' }; };

  // ================= exponential <-> logarithmic form =================
  MX.register({
    id: 'log-form', section: SEC, title: 'Exponential & logarithmic form', kind: 'skill', sources: [],
    slots: [{ label: 'Exponential & logarithmic form', source: ADDED, pool: ['toExp', 'toLog', 'natural', 'common'] }],
    lesson: T`<p>A logarithm is an exponent. The two statements below say exactly the same thing:</p>
\[\log_{b} N = k \quad\Longleftrightarrow\quad b^{k} = N\]
<p>Read \(\log_{2} 32\) as "the power of 2 that gives 32". Since \(2^{5} = 32\), \(\log_{2} 32 = 5\).</p>
<ul><li>The <strong>base</strong> of the log is the base of the power.</li><li>The <strong>answer</strong> of the log is the exponent.</li><li>The number inside the log is the result of the power.</li></ul>
<p>Two special bases have their own names: the <strong>common log</strong> \(\log N\) means base 10, and the <strong>natural log</strong> \(\ln N\) means base \(e \approx 2.718\). So \(\ln 7 = x\) means \(e^{x} = 7\).</p>
<p>Type logs like <code>log_2(32)</code>, <code>log(1000)</code> and <code>ln(7)</code>, or use the log buttons.</p>`,
    variants: {
      toExp: {
        name: 'Log form to exponential form',
        gen(rng) {
          const b = rng.pick([2, 3, 4, 5, 6, 7]);
          let k; do { k = rng.int(-3, 5); } while (k === 0 || Math.pow(b, Math.abs(k)) > 2000);
          const N = powStr(b, k);
          return {
            prompt: T`Write \(\log_{${b}} ${N.tex} = ${k}\) in exponential form.`,
            parts: [{ kind: 'eqform', shape: 'exp', base: String(b), exp: String(k), val: N.q.str(), answer: `${b}^(${k})=${N.q.str()}`, show: T`${b}^{${k}} = ${N.tex}`, points: 2 }],
            solution: [T`\(\log_{b} N = k\) means \(b^{k} = N\).`, T`Here the base is ${b}, the exponent (the log's value) is ${k}, and the result is \(${N.tex}\).`, T`\(${H.box(T`${b}^{${k}} = ${N.tex}`)}\)`],
          };
        },
      },
      toLog: {
        name: 'Exponential form to log form',
        gen(rng) {
          if (rng.chance(0.35)) {
            const [B, root, e] = rng.pick([[25, 5, '1/2'], [9, 3, '1/2'], [49, 7, '1/2'], [8, 2, '1/3'], [27, 3, '1/3'], [16, 2, '1/4'], [64, 4, '1/3'], [100, 10, '1/2']]);
            const eq = new Q(...e.split('/').map(Number));
            return {
              prompt: T`Write \(${B}^{${eq.tex()}} = ${root}\) in logarithmic form.`,
              parts: [{ kind: 'eqform', shape: 'log', base: String(B), exp: e, val: String(root), answer: `log_${B}(${root})=${e}`, show: T`\log_{${B}} ${root} = ${eq.tex()}`, points: 2 }],
              solution: [T`\(b^{k} = N\) means \(\log_{b} N = k\).`, T`The base ${B} becomes the log's base; the exponent \(${eq.tex()}\) is the log's value.`, T`\(${H.box(T`\log_{${B}} ${root} = ${eq.tex()}`)}\)`],
            };
          }
          const b = rng.pick([2, 3, 4, 5, 6, 7]);
          let k; do { k = rng.int(-3, 5); } while (k === 0 || Math.pow(b, Math.abs(k)) > 2000);
          const N = powStr(b, k);
          return {
            prompt: T`Write \(${b}^{${k}} = ${N.tex}\) in logarithmic form.`,
            parts: [{ kind: 'eqform', shape: 'log', base: String(b), exp: String(k), val: N.q.str(), answer: `log_${b}(${N.q.str()})=${k}`, show: T`\log_{${b}} ${N.tex} = ${k}`, points: 2 }],
            solution: [T`\(b^{k} = N\) means \(\log_{b} N = k\).`, T`Base ${b}, exponent ${k}, result \(${N.tex}\).`, T`\(${H.box(T`\log_{${b}} ${N.tex} = ${k}`)}\)`],
          };
        },
      },
      natural: {
        name: 'Natural log and e',
        gen(rng) {
          const N = rng.int(2, 40), v = rng.pick(['x', 'y', 't']);
          if (rng.chance(0.5)) {
            return {
              prompt: T`Write \(e^{${v}} = ${N}\) in logarithmic form.`,
              parts: [{ kind: 'eqform', shape: 'log', base: 'e', exp: v, val: String(N), answer: `ln(${N})=${v}`, show: T`\ln ${N} = ${v}`, points: 2 }],
              solution: [T`Base \(e\) logs are natural logs: \(e^{k} = N\) means \(\ln N = k\).`, T`\(${H.box(T`\ln ${N} = ${v}`)}\)`],
            };
          }
          return {
            prompt: T`Write \(\ln ${N} = ${v}\) in exponential form.`,
            parts: [{ kind: 'eqform', shape: 'exp', base: 'e', exp: v, val: String(N), answer: `e^(${v})=${N}`, show: T`e^{${v}} = ${N}`, points: 2 }],
            solution: [T`\(\ln N = k\) means \(e^{k} = N\): the natural log has base \(e\).`, T`\(${H.box(T`e^{${v}} = ${N}`)}\)`],
          };
        },
      },
      common: {
        name: 'Common log (base 10)',
        gen(rng) {
          const k = rng.int(-3, 4) || 2;
          const N = powStr(10, k);
          const Nd = k >= 0 ? String(Math.pow(10, k)) : (0).toFixed(-k).slice(0, -1) + '1';
          if (rng.chance(0.5)) {
            return {
              prompt: T`Write \(\log ${Nd} = ${k}\) in exponential form.`,
              parts: [{ kind: 'eqform', shape: 'exp', base: '10', exp: String(k), val: Nd, answer: `10^(${k})=${Nd}`, show: T`10^{${k}} = ${Nd}`, points: 2 }],
              solution: [T`A log with no base written is the common log, base 10.`, T`\(\log N = k\) means \(10^{k} = N\).`, T`\(${H.box(T`10^{${k}} = ${Nd}`)}\)`],
            };
          }
          return {
            prompt: T`Write \(10^{${k}} = ${Nd}\) in logarithmic form.`,
            parts: [{ kind: 'eqform', shape: 'log', base: '10', exp: String(k), val: Nd, answer: `log(${Nd})=${k}`, show: T`\log ${Nd} = ${k}`, points: 2 }],
            solution: [T`Base 10 gives the common log, written without a base.`, T`\(${H.box(T`\log ${Nd} = ${k}`)}\)`],
            _n: N,
          };
        },
      },
    },
  });

  // ================= evaluating logs =================
  MX.register({
    id: 'log-eval', section: SEC, title: 'Evaluating logarithms', kind: 'skill', sources: [],
    slots: [{ label: 'Evaluate', source: ADDED, pool: ['basic', 'fraction', 'special'] }],
    lesson: T`<p>To evaluate \(\log_{b} N\), ask: <strong>"\(b\) to what power gives \(N\)?"</strong></p>
<ul><li>\(\log_{3} 81 = 4\) because \(3^{4} = 81\).</li><li>\(\log_{2} \frac{1}{8} = -3\) because \(2^{-3} = \frac{1}{8}\).</li><li>\(\log_{9} 3 = \frac{1}{2}\) because \(9^{1/2} = 3\).</li></ul>
<p>Rules that come straight from the definition:</p>
\[\log_{b} 1 = 0 \qquad \log_{b} b = 1 \qquad \log_{b} b^{k} = k \qquad b^{\log_{b} N} = N\]
<p>They hold for the special logs too: \(\log 10^{k} = k\), \(\ln e^{k} = k\), \(\ln 1 = 0\), \(\ln e = 1\), \(e^{\ln N} = N\).</p>`,
    variants: {
      basic: {
        name: 'Whole-number answers',
        gen(rng) {
          const b = rng.pick(BASES);
          let k; do { k = rng.int(1, 6); } while (Math.pow(b, k) > 5000);
          const N = Math.pow(b, k), n = L(b);
          return {
            prompt: T`Evaluate \(${n.tex}\,${MX.commas(N)}\).`,
            parts: [{ kind: 'num', nolog: true, answer: String(k), show: String(k), points: 2 }],
            solution: [T`Ask: ${b} to what power gives ${MX.commas(N)}?`, T`\(${b}^{${k}} = ${MX.commas(N)}\)`, T`\(${H.box(String(k))}\)`],
          };
        },
      },
      fraction: {
        name: 'Negative and fractional answers',
        gen(rng) {
          if (rng.chance(0.5)) {
            const b = rng.pick([2, 3, 4, 5, 10]);
            let k; do { k = rng.int(1, 5); } while (Math.pow(b, k) > 2000);
            const n = L(b), den = Math.pow(b, k);
            return {
              prompt: T`Evaluate \(${n.tex}\,\frac{1}{${den}}\).`,
              parts: [{ kind: 'num', nolog: true, frac: true, answer: String(-k), show: String(-k), points: 2 }],
              solution: [T`\(\frac{1}{${den}} = \frac{1}{${b}^{${k}}} = ${b}^{-${k}}\)`, T`So \(${n.tex}\,\frac{1}{${den}} = ${n.tex}\,${b}^{-${k}} = -${k}\)`, T`\(${H.box(String(-k))}\)`],
            };
          }
          const [B, N, num, den] = rng.pick([[9, 3, 1, 2], [4, 2, 1, 2], [25, 5, 1, 2], [8, 2, 1, 3], [27, 3, 1, 3], [16, 2, 1, 4], [8, 4, 2, 3], [27, 9, 2, 3], [16, 8, 3, 4], [100, 10, 1, 2], [4, 8, 3, 2], [9, 27, 3, 2]]);
          const q = new Q(num, den);
          return {
            prompt: T`Evaluate \(\log_{${B}} ${N}\).`,
            parts: [{ kind: 'num', nolog: true, frac: true, answer: q.str(), show: q.tex(), points: 2 }],
            solution: [T`Write both as powers of the same number: \(${B}\) and \(${N}\).`, T`\(${B}^{${q.tex()}} = ${N}\) (check: \(\left(\sqrt[${den}]{${B}}\right)^{${num}} = ${N}\))`, T`\(${H.box(q.tex())}\)`],
          };
        },
      },
      special: {
        name: 'Special logs and inverse rules',
        gen(rng) {
          const b = rng.pick([2, 3, 5, 7, 12]), k = rng.int(2, 9), N = rng.int(2, 30);
          const c = rng.pick([
            [T`\log_{${b}} 1`, 0, T`Any base to the 0 power is 1, so \(\log_{b} 1 = 0\).`],
            [T`\log_{${b}} ${b}`, 1, T`\(${b}^{1} = ${b}\), so \(\log_{b} b = 1\).`],
            [T`\log_{${b}} ${b}^{${k}}`, k, T`\(\log_{b} b^{k} = k\): the log undoes the power.`],
            [T`\ln e^{${k}}`, k, T`\(\ln\) is base \(e\), so \(\ln e^{k} = k\).`],
            [T`\ln 1`, 0, T`\(e^{0} = 1\), so \(\ln 1 = 0\).`],
            [T`\ln e`, 1, T`\(e^{1} = e\), so \(\ln e = 1\).`],
            [T`e^{\ln ${N}}`, N, T`\(e^{\ln N} = N\): the power undoes the log.`],
            [T`10^{\log ${N}}`, N, T`\(10^{\log N} = N\): base 10 undoes the common log.`],
            [T`${b}^{\log_{${b}} ${N}}`, N, T`\(b^{\log_{b} N} = N\).`],
            [T`\log ${MX.commas(Math.pow(10, k % 6 + 1))}`, k % 6 + 1, T`\(10^{${k % 6 + 1}} = ${MX.commas(Math.pow(10, k % 6 + 1))}\); the common log is base 10.`],
            [T`\log 0.${'0'.repeat((k % 3))}1`, -((k % 3) + 1), T`\(0.${'0'.repeat(k % 3)}1 = 10^{-${(k % 3) + 1}}\).`],
          ]);
          return {
            prompt: T`Evaluate \(${c[0]}\).`,
            parts: [{ kind: 'num', nolog: true, answer: String(c[1]), show: String(c[1]), points: 2 }],
            solution: [c[2], T`\(${H.box(String(c[1]))}\)`],
          };
        },
      },
    },
  });

  // ================= expanding =================
  const RULES = T`\[\log_{b}\left(MN\right) = \log_{b} M + \log_{b} N \qquad \log_{b}\frac{M}{N} = \log_{b} M - \log_{b} N \qquad \log_{b} M^{p} = p\log_{b} M\]`;
  const pickBase = (rng) => rng.pick([2, 3, 5, 10, 10, 'e', 'e']);
  MX.register({
    id: 'log-expand', section: SEC, title: 'Expanding logarithms', kind: 'skill', sources: [],
    slots: [{ label: 'Expand', source: ADDED, pool: ['rules', 'numbers', 'roots'] }],
    lesson: T`<p>The three log rules (for positive \(M\), \(N\)):</p>${RULES}
<ul><li><strong>Product</strong> → sum. <strong>Quotient</strong> → difference (top minus bottom). <strong>Power</strong> → coefficient in front.</li>
<li>A root is a fractional power: \(\sqrt{x} = x^{1/2}\), so \(\log\sqrt{x} = \frac{1}{2}\log x\).</li>
<li>Evaluate any log of a plain number when you can: \(\log_{2}\left(8x\right) = 3 + \log_{2} x\).</li></ul>
<p class="warn">\(\log\left(M + N\right)\) does <strong>not</strong> split. The rules are for products, quotients and powers only.</p>`,
    variants: {
      rules: {
        name: 'Product, quotient and power rules',
        gen(rng) {
          const b = pickBase(rng), n = L(b);
          const m = rng.int(1, 5), p = rng.int(1, 4), q = rng.int(1, 4);
          const top = (m === 1 ? 'x' : 'x^{' + m + '}') + (p === 1 ? 'y' : 'y^{' + p + '}');
          const bot = q === 1 ? 'z' : 'z^{' + q + '}';
          const R = sumLogs([[m, b, 'x'], [p, b, 'y'], [-q, b, 'z']]);
          return {
            prompt: T`Expand as much as possible: \(${n.tex}\left(\dfrac{${top}}{${bot}}\right)\)`,
            parts: [{ kind: 'expr', form: 'logexpand', vars: ['x', 'y', 'z'], answer: R.asc, show: R.tex, points: 3 }],
            solution: [
              T`Quotient rule: \(${n.tex}\left(${top}\right) - ${n.tex}\,${bot}\)`,
              T`Product rule on the top: \(${n.tex}\,${m === 1 ? 'x' : 'x^{' + m + '}'} + ${n.tex}\,${p === 1 ? 'y' : 'y^{' + p + '}'} - ${n.tex}\,${bot}\)`,
              T`Power rule brings each exponent to the front: \(${H.box(R.tex)}\)`,
            ],
          };
        },
      },
      numbers: {
        name: 'With a number to evaluate',
        gen(rng) {
          const b = rng.pick([2, 3, 5, 10, 'e']), n = L(b), m = rng.int(1, 5), k = rng.int(1, 4);
          const bv = b === 'e' ? 'e' : String(Math.pow(b, k));
          const numTex = b === 'e' ? 'e^{' + k + '}' : MX.commas(Math.pow(b, k));
          const divide = rng.chance(0.4);
          const xm = m === 1 ? 'x' : 'x^{' + m + '}';
          const R = divide ? sumLogs([[m, b, 'x'], [-k]]) : sumLogs([[k], [m, b, 'x']]);
          return {
            prompt: T`Expand as much as possible: \(${n.tex}\left(${divide ? '\\dfrac{' + xm + '}{' + numTex + '}' : numTex + xm}\right)\)`,
            parts: [{ kind: 'expr', form: 'logexpand', vars: ['x'], answer: R.asc, show: R.tex, points: 3 }],
            solution: [
              divide ? T`Quotient rule: \(${n.tex}\,${xm} - ${n.tex}\,${numTex}\)` : T`Product rule: \(${n.tex}\,${numTex} + ${n.tex}\,${xm}\)`,
              b === 'e' ? T`Evaluate the number: \(\ln e^{${k}} = ${k}\).` : T`Evaluate the number: \(${n.tex}\,${numTex} = ${k}\) because \(${b}^{${k}} = ${numTex}\).`,
              T`Power rule on \(${xm}\): \(${H.box(R.tex)}\)`,
            ],
          };
        },
      },
      roots: {
        name: 'Roots and powers',
        gen(rng) {
          const b = pickBase(rng), n = L(b), p = rng.int(2, 5);
          const R = sumLogs([[new Q(1, 2), b, 'x'], [-p, b, 'y']]);
          return {
            prompt: T`Expand as much as possible: \(${n.tex}\left(\dfrac{\sqrt{x}}{y^{${p}}}\right)\)`,
            parts: [{ kind: 'expr', form: 'logexpand', vars: ['x', 'y'], answer: R.asc, show: R.tex, points: 3 }],
            solution: [T`Rewrite the root as a power: \(\sqrt{x} = x^{\frac{1}{2}}\).`, T`Quotient rule: \(${n.tex}\,x^{\frac{1}{2}} - ${n.tex}\,y^{${p}}\)`, T`Power rule: \(${H.box(R.tex)}\)`],
          };
        },
      },
    },
  });

  // ================= condensing =================
  MX.register({
    id: 'log-condense', section: SEC, title: 'Condensing logarithms', kind: 'skill', sources: [],
    slots: [{ label: 'Condense', source: ADDED, pool: ['rules', 'fraction', 'number'] }],
    lesson: T`<p>Condensing runs the rules backward to get <strong>one</strong> logarithm:</p>${RULES}
<ol><li>Power rule first: move each coefficient up as an exponent, \(3\log x = \log x^{3}\).</li>
<li>Added logs combine into a product; subtracted logs go into the denominator.</li>
<li>All the logs must have the same base.</li></ol>
<p>A plain number can be written as a log to combine it: \(2 = \log_{3} 9\), so \(2 + \log_{3} x = \log_{3}\left(9x\right)\).</p>`,
    variants: {
      rules: {
        name: 'Coefficients to exponents',
        gen(rng) {
          const b = pickBase(rng), n = L(b), m = rng.int(1, 5), p = rng.int(1, 4), q = rng.int(1, 4);
          if (m === 1 && p === 1 && q === 1) return this.gen(rng);
          const S = sumLogs([[m, b, 'x'], [p, b, 'y'], [-q, b, 'z']]);
          const top = (m === 1 ? 'x' : 'x^{' + m + '}') + (p === 1 ? 'y' : 'y^{' + p + '}'), bot = q === 1 ? 'z' : 'z^{' + q + '}';
          const ansT = T`${n.tex}\left(\frac{${top}}{${bot}}\right)`;
          const ansA = `${n.asc}((x^${m}y^${p})/(z^${q}))`;
          return {
            prompt: T`Write as a single logarithm: \(${S.tex}\)`,
            parts: [{ kind: 'expr', form: 'logcondense', vars: ['x', 'y', 'z'], answer: ansA, show: ansT, points: 3 }],
            solution: [T`Power rule: \(${n.tex}\,${m === 1 ? 'x' : 'x^{' + m + '}'} + ${n.tex}\,${p === 1 ? 'y' : 'y^{' + p + '}'} - ${n.tex}\,${bot}\)`, T`Add → multiply, subtract → divide.`, T`\(${H.box(ansT)}\)`],
          };
        },
      },
      fraction: {
        name: 'Fractional coefficients',
        gen(rng) {
          const b = pickBase(rng), n = L(b), p = rng.int(1, 4);
          const S = sumLogs([[new Q(1, 2), b, 'x'], [p, b, 'y']]);
          const ansT = T`${n.tex}\left(${p === 1 ? 'y' : 'y^{' + p + '}'}\sqrt{x}\right)`;
          return {
            prompt: T`Write as a single logarithm: \(${S.tex}\)`,
            parts: [{ kind: 'expr', form: 'logcondense', vars: ['x', 'y'], answer: `${n.asc}(y^${p}√(x))`, show: ansT, points: 3 }],
            solution: [T`\(\frac{1}{2}${n.tex}\,x = ${n.tex}\,x^{\frac{1}{2}} = ${n.tex}\sqrt{x}\)`, T`Then the product rule combines the sum.`, T`\(${H.box(ansT)}\)`],
          };
        },
      },
      number: {
        name: 'Include a number',
        gen(rng) {
          const b = rng.pick([2, 3, 5, 10]), n = L(b), k = rng.int(1, 3), m = rng.int(1, 4);
          const N = Math.pow(b, k);
          const S = sumLogs([[k], [m, b, 'x']]);
          const ansT = T`${n.tex}\left(${N}${m === 1 ? 'x' : 'x^{' + m + '}'}\right)`;
          return {
            prompt: T`Write as a single logarithm: \(${S.tex}\)`,
            parts: [{ kind: 'expr', form: 'logcondense', vars: ['x'], answer: `${n.asc}(${N}x^${m})`, show: ansT, points: 3 }],
            solution: [T`Write the number as a log with the same base: \(${k} = ${n.tex}\,${b}^{${k}} = ${n.tex}\,${N}\)`, T`Power rule on the other term, then the product rule.`, T`\(${H.box(ansT)}\)`],
          };
        },
      },
    },
  });

  // ================= change of base =================
  function cob(rng, small) {
    let b, N;
    do {
      b = rng.pick([2, 3, 4, 5, 6, 7, 8, 9, 12]);
      N = small ? rng.pick([0.2, 0.5, 0.4, 0.25, 0.3, 0.7, 0.8]) : rng.int(3, 90);
    } while (Math.abs(Math.log(N) / Math.log(b) - Math.round(Math.log(N) / Math.log(b))) < 1e-9);
    const v = Math.log(N) / Math.log(b), r = Math.round(v * 100) / 100;
    return {
      prompt: T`Use the change-of-base formula to evaluate \(\log_{${b}} ${N}\).`,
      parts: [
        { label: 'a', ask: 'Rewrite it as a quotient of natural logs (or common logs).', kind: 'expr', form: 'cob', vars: [], answer: `ln(${N})/ln(${b})`, show: T`\frac{\ln ${N}}{\ln ${b}}`, points: 2 },
        { label: 'b', ask: 'Approximate it to the nearest hundredth.', kind: 'num', nolog: true, tol: 0.006, answer: r.toFixed(2), show: r.toFixed(2), points: 2 },
      ],
      solution: [
        T`Change of base: \(\log_{b} N = \dfrac{\ln N}{\ln b}\) (common logs work too: \(\dfrac{\log N}{\log b}\)).`,
        T`\(\log_{${b}} ${N} = \dfrac{\ln ${N}}{\ln ${b}} \approx \dfrac{${MX.num(Math.log(N), 4)}}{${MX.num(Math.log(b), 4)}}\)`,
        T`\(\approx ${H.box(r.toFixed(2))}\)${small ? ' (negative, because ' + N + ' is less than 1)' : ''}`,
      ],
    };
  }
  MX.register({
    id: 'log-cob', section: SEC, title: 'Change of base', kind: 'skill', sources: [],
    slots: [{ label: 'Change of base', source: ADDED, pool: ['value', 'small'] }],
    lesson: T`<p>Calculators have only \(\log\) (base 10) and \(\ln\) (base \(e\)). To evaluate any other base, use</p>
\[\log_{b} N = \frac{\ln N}{\ln b} = \frac{\log N}{\log b}\]
<p>Example: \(\log_{3} 20 = \dfrac{\ln 20}{\ln 3} \approx \dfrac{2.9957}{1.0986} \approx 2.73\). Check: \(3^{2.73} \approx 20\) ✓.</p>
<p class="warn">It's \(\ln N\) on <em>top</em> (the number inside) and \(\ln b\) on the bottom (the base). Round only at the end.</p>`,
    variants: {
      value: { name: 'Evaluate with change of base', gen: (rng) => cob(rng, false) },
      small: { name: 'Answers that are negative', gen: (rng) => cob(rng, true) },
    },
  });

  // ================= solving log equations =================
  MX.register({
    id: 'log-solve', section: SEC, title: 'Solving logarithmic equations', kind: 'skill', sources: [],
    slots: [{ label: 'Solve', source: ADDED, pool: ['basic', 'equal', 'sum', 'natural', 'nosol'] }],
    lesson: T`<p>Two situations:</p>
<ul><li><strong>One log equals a number</strong>: rewrite in exponential form. \(\log_{2}\left(x + 3\right) = 5 \Rightarrow x + 3 = 2^{5}\).</li>
<li><strong>Logs on both sides</strong> with the same base: set the insides equal. \(\log\left(2x + 3\right) = \log\left(x + 7\right) \Rightarrow 2x + 3 = x + 7\).</li></ul>
<p>With several logs, condense first: \(\log_{2} x + \log_{2}\left(x - 2\right) = 3 \Rightarrow \log_{2}\left(x\left(x - 2\right)\right) = 3\).</p>
<p class="key">Always check: the inside of every log must be positive. Throw out any answer that makes one zero or negative. If none survive, type <code>no solution</code>.</p>`,
    variants: {
      basic: {
        name: 'Rewrite in exponential form',
        gen(rng) {
          const b = rng.pick([2, 3, 4, 5, 10]), n = L(b);
          let k, a, c; do { k = rng.int(1, 4); a = rng.int(1, 5); c = rng.int(-9, 9); } while (Math.pow(b, k) > 1000 || Math.pow(b, k) - c <= 0);
          const x = new Q(Math.pow(b, k) - c, a);
          const In = MX.lin(a, c);
          return {
            prompt: T`Solve for \(x\): \(${n.tex}\left(${In.tex}\right) = ${k}\)`,
            parts: [{ kind: 'num', frac: true, nolog: true, var: 'x', answer: x.str(), show: T`x = ${x.tex()}`, points: 3 }],
            solution: [T`Exponential form: \(${In.tex} = ${b}^{${k}} = ${Math.pow(b, k)}\)`, T`\(${MX.coef(a)}x = ${Math.pow(b, k) - c}\), so \(x = ${x.tex()}\)`, T`Check: the inside is \(${Math.pow(b, k)} \gt 0\) ✓. \(${H.box(T`x = ${x.tex()}`)}\)`],
          };
        },
      },
      equal: {
        name: 'Logs on both sides',
        gen(rng) {
          const b = rng.pick([2, 3, 5, 10, 'e']), n = L(b);
          let x0, a1, a2, c1, c2; do { x0 = rng.int(-4, 9); a1 = rng.int(1, 6); a2 = rng.int(1, 6); c1 = rng.int(-9, 12); c2 = (a1 - a2) * x0 + c1; } while (a1 === a2 || a1 * x0 + c1 <= 0 || Math.abs(c2) > 20);
          const A1 = MX.lin(a1, c1), A2 = MX.lin(a2, c2);
          return {
            prompt: T`Solve: \(${n.tex}\left(${A1.tex}\right) = ${n.tex}\left(${A2.tex}\right)\)`,
            parts: [{ kind: 'num', frac: true, nolog: true, var: 'x', answer: String(x0), show: 'x = ' + x0, points: 3 }],
            solution: [T`Same base on both sides, so the insides are equal: \(${A1.tex} = ${A2.tex}\)`, T`\(${MX.coef(a1 - a2)}x = ${c2 - c1}\), so \(x = ${x0}\)`, T`Check: both insides equal ${a1 * x0 + c1} \(\gt 0\) ✓. \(${H.box('x = ' + x0)}\)`],
          };
        },
      },
      sum: {
        name: 'Condense first (one answer is extraneous)',
        gen(rng) {
          const b = rng.pick([2, 3, 10]), n = L(b);
          let k, p, q, pairs;
          do {
            k = rng.int(1, b === 10 ? 2 : 5);
            const N = Math.pow(b, k);
            pairs = [];
            for (let f = 1; f * f < N; f++) if (N % f === 0) pairs.push([f, N / f]);
            [p, q] = pairs.length ? rng.pick(pairs) : [0, 0];
          } while (!pairs.length || q - p > 30 || q === p);
          const d = q - p, N = p * q;
          return {
            prompt: T`Solve: \(${n.tex}\,x + ${n.tex}\left(x + ${d}\right) = ${k}\)`,
            parts: [{ kind: 'num', frac: true, nolog: true, var: 'x', answer: String(p), show: 'x = ' + p, points: 4 }],
            solution: [
              T`Product rule: \(${n.tex}\left(x\left(x + ${d}\right)\right) = ${k}\)`,
              T`Exponential form: \(x^{2} + ${d}x = ${N}\), so \(x^{2} + ${d}x - ${N} = 0\) and \(\left(x - ${p}\right)\left(x + ${q}\right) = 0\)`,
              T`\(x = ${p}\) or \(x = -${q}\). But \(${n.tex}\left(-${q}\right)\) doesn't exist (the inside of a log must be positive), so \(-${q}\) is extraneous.`,
              T`\(${H.box('x = ' + p)}\)`,
            ],
          };
        },
      },
      natural: {
        name: 'Natural log (round the answer)',
        gen(rng) {
          const a = rng.int(1, 4), c = rng.int(-6, 6), k = rng.int(1, 4);
          const x = (Math.exp(k) - c) / a, r = Math.round(x * 100) / 100;
          const In = MX.lin(a, c);
          return {
            prompt: T`Solve \(\ln\left(${In.tex}\right) = ${k}\). Give the exact answer or round to the nearest hundredth.`,
            parts: [{ kind: 'num', var: 'x', tol: 0.006, answer: r.toFixed(2), show: T`x = \frac{e^{${k}} ${MX.sgnTerm(-c)}}{${a}} \approx ${r.toFixed(2)}`, points: 3 }],
            solution: [T`Exponential form (base \(e\)): \(${In.tex} = e^{${k}}\)`, T`\(x = \dfrac{e^{${k}} ${MX.sgnTerm(-c)}}{${a}}\)`, T`\(e^{${k}} \approx ${MX.num(Math.exp(k), 4)}\), so \(x \approx ${H.box(r.toFixed(2))}\)`],
          };
        },
      },
      nosol: {
        name: 'No solution',
        gen(rng) {
          const b = rng.pick([2, 3, 10]), n = L(b);
          let x0, c1, c2; do { x0 = rng.int(1, 8); c1 = rng.int(1, 9); c2 = rng.int(1, 9); } while (x0 - c1 >= 0 || c2 - x0 <= 0);
          // log(x - c1) = log(c2' - x) with solution x0 where x0 - c1 < 0
          const s = 2 * x0 - c1; // x - c1 = s - x  ->  2x = s + c1
          return {
            prompt: T`Solve: \(${n.tex}\left(x - ${c1}\right) = ${n.tex}\left(${s} - x\right)\)`,
            parts: [{ kind: 'num', var: 'x', answer: 'nosol', show: '\\text{no solution}', points: 3 }],
            solution: [T`Set the insides equal: \(x - ${c1} = ${s} - x\), so \(2x = ${s + c1}\) and \(x = ${x0}\).`, T`Check: \(x - ${c1} = ${x0 - c1}\), which is not positive, so \(${n.tex}\left(${x0 - c1}\right)\) doesn't exist.`, T`The only candidate is extraneous: \(${H.box('\\text{no solution}')}\)`],
          };
        },
      },
    },
  });

  // ================= exponential equations with logs =================
  function expeq(rng, kind) {
    const b = rng.pick([2, 3, 4, 5, 6, 7]);
    let N;
    do { N = rng.int(3, 60); } while (Math.abs(Math.log(N) / Math.log(b) - Math.round(Math.log(N) / Math.log(b))) < 1e-9);
    let prompt, exact, exactT, x, steps;
    if (kind === 'common') {
      x = Math.log(N) / Math.log(b);
      prompt = T`\(${b}^{x} = ${N}\)`; exact = `ln(${N})/ln(${b})`; exactT = T`\frac{\ln ${N}}{\ln ${b}}`;
      steps = [T`Take the natural log of both sides: \(\ln ${b}^{x} = \ln ${N}\)`, T`Power rule: \(x\ln ${b} = \ln ${N}\), so \(x = \dfrac{\ln ${N}}{\ln ${b}}\)`];
    } else if (kind === 'natural') {
      const k = rng.int(2, 5);
      x = Math.log(N) / k;
      prompt = T`\(e^{${k}x} = ${N}\)`; exact = `ln(${N})/${k}`; exactT = T`\frac{\ln ${N}}{${k}}`;
      steps = [T`Take \(\ln\) of both sides: \(\ln e^{${k}x} = \ln ${N}\)`, T`\(\ln e^{${k}x} = ${k}x\), so \(x = \dfrac{\ln ${N}}{${k}}\)`];
    } else if (kind === 'isolate') {
      const a = rng.int(2, 6), c = rng.int(1, 20);
      x = Math.log(N) / Math.log(b);
      prompt = T`\(${a}\cdot${b}^{x} + ${c} = ${a * N + c}\)`; exact = `ln(${N})/ln(${b})`; exactT = T`\frac{\ln ${N}}{\ln ${b}}`;
      steps = [T`Isolate the power first: \(${a}\cdot${b}^{x} = ${a * N}\), so \(${b}^{x} = ${N}\)`, T`Take \(\ln\): \(x\ln ${b} = \ln ${N}\), so \(x = \dfrac{\ln ${N}}{\ln ${b}}\)`];
    } else {
      const h = rng.int(1, 5);
      x = h + Math.log(N) / Math.log(b);
      prompt = T`\(${b}^{x - ${h}} = ${N}\)`; exact = `${h}+ln(${N})/ln(${b})`; exactT = T`${h} + \frac{\ln ${N}}{\ln ${b}}`;
      steps = [T`Take \(\ln\): \(\left(x - ${h}\right)\ln ${b} = \ln ${N}\)`, T`\(x - ${h} = \dfrac{\ln ${N}}{\ln ${b}}\), so \(x = ${h} + \dfrac{\ln ${N}}{\ln ${b}}\)`];
    }
    const r = Math.round(x * 100) / 100;
    return {
      prompt: T`Solve ${prompt}. Give the exact answer, then round to the nearest hundredth.`,
      parts: [
        { label: 'a', ask: 'Exact answer (use logs)', kind: 'expr', form: 'exactlog', vars: [], pre: 'x =', answer: exact, show: T`x = ${exactT}`, points: 2 },
        { label: 'b', ask: 'Rounded to the nearest hundredth', kind: 'num', nolog: true, tol: 0.006, pre: 'x ≈', answer: r.toFixed(2), show: T`x \approx ${r.toFixed(2)}`, points: 2 },
      ],
      solution: [...steps, T`\(x = ${exactT} \approx ${H.box(r.toFixed(2))}\)`],
    };
  }
  MX.register({
    id: 'log-expeq', section: SEC, title: 'Exponential equations using logs', kind: 'skill', sources: [],
    slots: [{ label: 'Solve with logs', source: ADDED, pool: ['common', 'natural', 'isolate', 'shift'] }],
    lesson: T`<p>When the two sides can't be written with the same base, take a log of both sides and use the power rule to bring the variable down:</p>
\[5^{x} = 12 \;\Rightarrow\; \ln 5^{x} = \ln 12 \;\Rightarrow\; x\ln 5 = \ln 12 \;\Rightarrow\; x = \frac{\ln 12}{\ln 5} \approx 1.54\]
<ol><li>Isolate the power first (subtract and divide what's around it).</li><li>Take \(\ln\) (or \(\log\)) of both sides.</li><li>Power rule, then divide.</li></ol>
<p>With base \(e\), use \(\ln\): \(\ln e^{3x} = 3x\). The inverse rules \(\ln e^{x} = x\) and \(e^{\ln x} = x\) do the work.</p>
<p class="warn">\(\dfrac{\ln 12}{\ln 5}\) is not \(\ln\dfrac{12}{5}\) and not \(\ln 12 - \ln 5\).</p>`,
    variants: {
      common: { name: 'Any base', gen: (rng) => expeq(rng, 'common') },
      natural: { name: 'Base e', gen: (rng) => expeq(rng, 'natural') },
      isolate: { name: 'Isolate the power first', gen: (rng) => expeq(rng, 'isolate') },
      shift: { name: 'Expression in the exponent', gen: (rng) => expeq(rng, 'shift') },
    },
  });
  MX.logHelpers = { L, sumLogs };
  void qt; void qa; void bval;
})(typeof window !== 'undefined' ? window : globalThis);

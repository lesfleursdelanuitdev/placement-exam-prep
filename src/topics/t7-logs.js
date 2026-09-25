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

  // ---------- verifiers (built from the problem as displayed) ----------
  const V = MX.V;
  // a is exact correctly rounded to `places` decimals
  const roundedOK = (a, exact, places) => {
    if (typeof a !== 'number' || !isFinite(exact)) return 'expected a number';
    const s = Math.pow(10, places);
    if (Math.abs(a * s - Math.round(a * s)) > 1e-6) return 'the answer is not rounded to ' + places + ' places';
    return Math.abs(a - exact) <= 0.5 / s + 1e-9 * Math.max(1, Math.abs(exact)) ? true : 'the exact value is ' + MX.num(exact, 6) + ', which does not round to ' + a;
  };
  // the only real root of eq, rounded to `places`
  const roundedRoot = (eq, places, o = {}) => {
    let rs = null;
    return V.custom((a) => {
      rs = rs || V.roots(eq, o);
      if (!Array.isArray(rs) || rs.length !== 1) return 'expected exactly one solution of ' + eq;
      return roundedOK(a, rs[0], places);
    });
  };
  // the constant answer expression makes the stated equation true
  const makesTrue = (eq, v = 'x') => V.custom((a) => {
    if (MX.ast.vars(a).size) return 'the answer should be a number';
    const x = MX.evalAST(a, {});
    return V.truth(eq)({ [v]: x }) ? true : 'x = ' + MX.num(x, 6) + ' does not satisfy ' + eq;
  });
  // (base, exponent, value) read from "log_b(N) = k" or "b^k = N"
  const ungrp = (n) => { while (n && n.t === 'grp') n = n.a; return n; };
  const hasNode = (n, t) => !!n && typeof n === 'object' && (n.t === t || Object.keys(n).some((k) => k !== 't' && n[k] && typeof n[k] === 'object' && hasNode(n[k], t)));
  function triple(r) {
    const L = ungrp(r.lhs), R = ungrp(r.rhs);
    for (const [x, o] of [[L, R], [R, L]]) if (x.t === 'log') return { shape: 'log', base: x.k === 'c' ? { t: 'num', v: 10 } : x.b, exp: o, val: x.a };
    for (const [x, o] of [[L, R], [R, L]]) if (x.t === 'pow' && !hasNode(o, 'log')) return { shape: 'exp', base: x.a, exp: x.b, val: o };
    return null;
  }
  // "rewrite in the other form" (eqform): the answer is the other form of the given relation, with the same
  // base, exponent and value, and it is a true statement (at the given's solution when there is a variable)
  const eqForm = (given, v) => V.custom((a) => {
    const gr = V.rel(given)[0], g = triple(gr), t = triple(a);
    if (!g) return 'could not read the given relation';
    if (a.op !== '=') return 'expected an equation';
    if (!t || t.shape === g.shape || (t.shape === 'exp' && hasNode(a.lhs, 'log')) || (t.shape === 'exp' && hasNode(a.rhs, 'log'))) return 'expected the ' + (g.shape === 'log' ? 'exponential' : 'logarithmic') + ' form';
    const ev = MX.evalAST;
    for (const x of v ? [1.3, -0.7, 2.9] : [0]) {
      const env = v ? { [v]: x } : {};
      for (const key of ['base', 'exp', 'val']) if (!V.close(ev(g[key], env), ev(t[key], env), 1e-9)) return 'the ' + key + ' does not match the given relation';
    }
    let env = {};
    if (v) {
      const rs = V.roots(gr, { v, lo: -50, hi: 50, n: 4000 });
      if (!Array.isArray(rs) || rs.length !== 1) return 'the given relation should have one solution';
      env = { [v]: rs[0] };
    }
    const tv = (r) => V.close(ev(r.lhs, env), ev(r.rhs, env), 1e-9);
    if (!tv(gr)) return 'the given relation is false';
    return tv(a) ? true : 'the answer is not a true statement';
  });

  // ================= exponential <-> logarithmic form =================
  MX.register({
    id: 'log-form', section: SEC, title: 'Exponential & logarithmic form', kind: 'skill', sources: [],
    slots: [{ label: 'Exponential & logarithmic form', source: ADDED, pool: ['toExp', 'toLog', 'natural', 'common'] }],
    lesson: T`<p>A logarithm answers the question "which exponent?" You already know that \(2^{5} = 32\). The logarithm \(\log_{2}\,32\) asks for that exponent, so \(\log_{2}\,32 = 5\). A log and a power are two ways to write the same fact.</p>
<div class="box def"><h4>Definition <b>Logarithm</b></h4><p>For a base \(b \gt 0\) with \(b \ne 1\), and a number \(N \gt 0\):</p><p>\(\log_{b}\,N = k\) means \(b^{k} = N\).</p><p>Read \(\log_{b}\,N\) as "log base \(b\) of \(N\)". The value \(k\) of a logarithm is always an exponent.</p></div>
<h3>Switching between the two forms</h3>
<p>Both forms use the same three numbers. Only their places change:</p>
<ul><li>The <strong>base</strong> of the log is the base of the power.</li><li>The <strong>value</strong> of the log is the exponent.</li><li>The number <strong>inside</strong> the log is the result of the power.</li></ul>
<div class="ex"><h4>Example</h4><p>Write \(\log_{3}\,81 = 4\) in exponential form.</p><table class="st">
<tr><td>Name the parts: base, value, inside.</td><td>\(b = 3,\ k = 4,\ N = 81\)</td></tr>
<tr><td>The base gets the value as its exponent, and equals the inside.</td><td>\(3^{4} = 81\)</td></tr>
<tr><td>Check.</td><td>\(3 \cdot 3 \cdot 3 \cdot 3 = 81\) ✓</td></tr></table></div>
<div class="ex"><h4>Example</h4><p>Write \(5^{-2} = \frac{1}{25}\) in logarithmic form.</p><table class="st">
<tr><td>The base of the power becomes the base of the log.</td><td>\(\log_{5}\)</td></tr>
<tr><td>The result goes inside the log.</td><td>\(\log_{5}\,\frac{1}{25}\)</td></tr>
<tr><td>The exponent is the value of the log.</td><td>\(\log_{5}\,\frac{1}{25} = -2\)</td></tr></table></div>
<p>Fractional exponents work the same way: \(49^{1/2} = 7\) becomes \(\log_{49}\,7 = \frac{1}{2}\).</p>
<h3>Common and natural logs</h3>
<div class="box def"><h4>Definition <b>Common log and natural log</b></h4><p>The <strong>common log</strong> \(\log\,N\), written with no base, has base 10: \(\log\,N = k\) means \(10^{k} = N\).</p><p>The <strong>natural log</strong> \(\ln\,N\) has base \(e \approx 2.718\): \(\ln\,N = k\) means \(e^{k} = N\).</p></div>
<p>So \(\log\,1000 = 3\) because \(10^{3} = 1000\), and \(\log\,0.01 = -2\) because \(10^{-2} = 0.01\). Also \(\ln\,7 = x\) means \(e^{x} = 7\).</p>
<div class="box warn"><h4>Watch out</h4><p>The base of the log stays the base. \(\log_{2}\,8 = 3\) becomes \(2^{3} = 8\). It is not \(3^{2} = 8\) and not \(8^{3} = 2\).</p></div>
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
            parts: [{ kind: 'eqform', shape: 'exp', base: String(b), exp: String(k), val: N.q.str(), answer: `${b}^(${k})=${N.q.str()}`, show: T`${b}^{${k}} = ${N.tex}`, points: 2, verify: eqForm(`log_${b}(${N.q.str()})=${k}`) }],
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
              parts: [{ kind: 'eqform', shape: 'log', base: String(B), exp: e, val: String(root), answer: `log_${B}(${root})=${e}`, show: T`\log_{${B}} ${root} = ${eq.tex()}`, points: 2, verify: eqForm(`${B}^(${e})=${root}`) }],
              solution: [T`\(b^{k} = N\) means \(\log_{b} N = k\).`, T`The base ${B} becomes the log's base; the exponent \(${eq.tex()}\) is the log's value.`, T`\(${H.box(T`\log_{${B}} ${root} = ${eq.tex()}`)}\)`],
            };
          }
          const b = rng.pick([2, 3, 4, 5, 6, 7]);
          let k; do { k = rng.int(-3, 5); } while (k === 0 || Math.pow(b, Math.abs(k)) > 2000);
          const N = powStr(b, k);
          return {
            prompt: T`Write \(${b}^{${k}} = ${N.tex}\) in logarithmic form.`,
            parts: [{ kind: 'eqform', shape: 'log', base: String(b), exp: String(k), val: N.q.str(), answer: `log_${b}(${N.q.str()})=${k}`, show: T`\log_{${b}} ${N.tex} = ${k}`, points: 2, verify: eqForm(`${b}^(${k})=${N.q.str()}`) }],
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
              parts: [{ kind: 'eqform', shape: 'log', base: 'e', exp: v, val: String(N), answer: `ln(${N})=${v}`, show: T`\ln ${N} = ${v}`, points: 2, verify: eqForm(`e^(${v})=${N}`, v) }],
              solution: [T`Base \(e\) logs are natural logs: \(e^{k} = N\) means \(\ln N = k\).`, T`\(${H.box(T`\ln ${N} = ${v}`)}\)`],
            };
          }
          return {
            prompt: T`Write \(\ln ${N} = ${v}\) in exponential form.`,
            parts: [{ kind: 'eqform', shape: 'exp', base: 'e', exp: v, val: String(N), answer: `e^(${v})=${N}`, show: T`e^{${v}} = ${N}`, points: 2, verify: eqForm(`ln(${N})=${v}`, v) }],
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
              parts: [{ kind: 'eqform', shape: 'exp', base: '10', exp: String(k), val: Nd, answer: `10^(${k})=${Nd}`, show: T`10^{${k}} = ${Nd}`, points: 2, verify: eqForm(`log(${Nd})=${k}`) }],
              solution: [T`A log with no base written is the common log, base 10.`, T`\(\log N = k\) means \(10^{k} = N\).`, T`\(${H.box(T`10^{${k}} = ${Nd}`)}\)`],
            };
          }
          return {
            prompt: T`Write \(10^{${k}} = ${Nd}\) in logarithmic form.`,
            parts: [{ kind: 'eqform', shape: 'log', base: '10', exp: String(k), val: Nd, answer: `log(${Nd})=${k}`, show: T`\log ${Nd} = ${k}`, points: 2, verify: eqForm(`10^(${k})=${Nd}`) }],
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
    lesson: T`<p>To evaluate a logarithm means to find its value, and that value is an exponent. For \(\log_{b}\,N\), ask: <strong>"\(b\) to what power gives \(N\)?"</strong> For example, \(\log_{3}\,81 = 4\) because \(3^{4} = 81\).</p>
<div class="box how"><h4>How to <b>evaluate \(\log_{b}\,N\) without a calculator</b></h4><ol>
<li>Set the log equal to \(x\): \(\log_{b}\,N = x\).</li>
<li>Rewrite it in exponential form: \(b^{x} = N\).</li>
<li>Write both sides as powers of the same base.</li>
<li>Set the exponents equal and solve for \(x\).</li></ol></div>
<div class="ex"><h4>Example</h4><p>Evaluate \(\log_{4}\,8\).</p><table class="st">
<tr><td>Set the log equal to \(x\).</td><td>\(\log_{4}\,8 = x\)</td></tr>
<tr><td>Rewrite in exponential form.</td><td>\(4^{x} = 8\)</td></tr>
<tr><td>Write 4 and 8 as powers of 2.</td><td>\(\left(2^{2}\right)^{x} = 2^{3}\), so \(2^{2x} = 2^{3}\)</td></tr>
<tr><td>Set the exponents equal.</td><td>\(2x = 3\), so \(x = \frac{3}{2}\)</td></tr></table></div>
<h3>Negative and fractional answers</h3>
<p>The answer does not have to be a whole number.</p>
<ul><li>A fraction inside gives a negative answer, because a negative exponent makes a reciprocal: \(\log_{2}\,\frac{1}{8} = -3\) because \(2^{-3} = \frac{1}{8}\).</li>
<li>A root gives a fractional answer: \(\log_{9}\,3 = \frac{1}{2}\) because \(9^{1/2} = \sqrt{9} = 3\).</li>
<li>Decimals work with base 10: \(\log\,0.001 = -3\) because \(0.001 = 10^{-3}\).</li></ul>
<h3>Special values</h3>
<div class="box rule"><h4>Property <b>Special logs and inverse properties</b></h4><p>For any allowed base \(b\) and any \(N \gt 0\):</p><p>\(\log_{b}\,1 = 0\) because \(b^{0} = 1\).<br>\(\log_{b}\,b = 1\) because \(b^{1} = b\).<br>\(\log_{b}\,b^{k} = k\): the log undoes the power.<br>\(b^{\log_{b}\,N} = N\): the power undoes the log.</p></div>
<p>They hold for the common log and the natural log too: \(\log\,10^{k} = k\), \(10^{\log\,N} = N\), \(\ln\,1 = 0\), \(\ln\,e = 1\), \(\ln\,e^{k} = k\) and \(e^{\ln\,N} = N\). For example, \(\ln\,e^{6} = 6\) and \(5^{\log_{5}\,12} = 12\).</p>
<div class="box warn"><h4>Watch out</h4><p>\(\log_{b}\,1 = 0\), not 1. It is \(\log_{b}\,b\) that equals 1. Also, the number inside a log must be positive: \(\log_{2}\,0\) and \(\log_{2}\left(-4\right)\) have no value, because no power of 2 is zero or negative.</p></div>`,
    variants: {
      basic: {
        name: 'Whole-number answers',
        gen(rng) {
          const b = rng.pick(BASES);
          let k; do { k = rng.int(1, 6); } while (Math.pow(b, k) > 5000);
          const N = Math.pow(b, k), n = L(b);
          return {
            prompt: T`Evaluate \(${n.tex}\,${MX.commas(N)}\).`,
            parts: [{ kind: 'num', nolog: true, answer: String(k), show: String(k), points: 2, verify: V.value(`${n.asc}(${N})`) }],
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
              parts: [{ kind: 'num', nolog: true, frac: true, answer: String(-k), show: String(-k), points: 2, verify: V.value(`${n.asc}(1/${den})`) }],
              solution: [T`\(\frac{1}{${den}} = \frac{1}{${b}^{${k}}} = ${b}^{-${k}}\)`, T`So \(${n.tex}\,\frac{1}{${den}} = ${n.tex}\,${b}^{-${k}} = -${k}\)`, T`\(${H.box(String(-k))}\)`],
            };
          }
          const [B, N, num, den] = rng.pick([[9, 3, 1, 2], [4, 2, 1, 2], [25, 5, 1, 2], [8, 2, 1, 3], [27, 3, 1, 3], [16, 2, 1, 4], [8, 4, 2, 3], [27, 9, 2, 3], [16, 8, 3, 4], [100, 10, 1, 2], [4, 8, 3, 2], [9, 27, 3, 2]]);
          const q = new Q(num, den);
          return {
            prompt: T`Evaluate \(\log_{${B}} ${N}\).`,
            parts: [{ kind: 'num', nolog: true, frac: true, answer: q.str(), show: q.tex(), points: 2, verify: V.value(`log_${B}(${N})`) }],
            solution: [T`Write both as powers of the same number: \(${B}\) and \(${N}\).`, T`\(${B}^{${q.tex()}} = ${N}\) (check: \(\left(\sqrt[${den}]{${B}}\right)^{${num}} = ${N}\))`, T`\(${H.box(q.tex())}\)`],
          };
        },
      },
      special: {
        name: 'Special logs and inverse rules',
        gen(rng) {
          const b = rng.pick([2, 3, 5, 7, 12]), k = rng.int(2, 9), N = rng.int(2, 30);
          const c = rng.pick([
            [T`\log_{${b}} 1`, 0, T`Any base to the 0 power is 1, so \(\log_{b} 1 = 0\).`, `log_${b}(1)`],
            [T`\log_{${b}} ${b}`, 1, T`\(${b}^{1} = ${b}\), so \(\log_{b} b = 1\).`, `log_${b}(${b})`],
            [T`\log_{${b}} ${b}^{${k}}`, k, T`\(\log_{b} b^{k} = k\): the log undoes the power.`, `log_${b}(${b}^(${k}))`],
            [T`\ln e^{${k}}`, k, T`\(\ln\) is base \(e\), so \(\ln e^{k} = k\).`, `ln(e^(${k}))`],
            [T`\ln 1`, 0, T`\(e^{0} = 1\), so \(\ln 1 = 0\).`, `ln(1)`],
            [T`\ln e`, 1, T`\(e^{1} = e\), so \(\ln e = 1\).`, `ln(e)`],
            [T`e^{\ln ${N}}`, N, T`\(e^{\ln N} = N\): the power undoes the log.`, `e^(ln(${N}))`],
            [T`10^{\log ${N}}`, N, T`\(10^{\log N} = N\): base 10 undoes the common log.`, `10^(log(${N}))`],
            [T`${b}^{\log_{${b}} ${N}}`, N, T`\(b^{\log_{b} N} = N\).`, `${b}^(log_${b}(${N}))`],
            [T`\log ${MX.commas(Math.pow(10, k % 6 + 1))}`, k % 6 + 1, T`\(10^{${k % 6 + 1}} = ${MX.commas(Math.pow(10, k % 6 + 1))}\); the common log is base 10.`, `log(${Math.pow(10, k % 6 + 1)})`],
            [T`\log 0.${'0'.repeat((k % 3))}1`, -((k % 3) + 1), T`\(0.${'0'.repeat(k % 3)}1 = 10^{-${(k % 3) + 1}}\).`, `log(0.${'0'.repeat(k % 3)}1)`],
          ]);
          return {
            prompt: T`Evaluate \(${c[0]}\).`,
            parts: [{ kind: 'num', nolog: true, answer: String(c[1]), show: String(c[1]), points: 2, verify: V.value(c[3]) }],
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
    lesson: T`<p>A logarithm is an exponent, so logs follow the exponent rules. When you multiply powers you add exponents (\(b^{m} \cdot b^{n} = b^{m + n}\)). In the same way, the log of a product is a sum of logs. <strong>Expanding</strong> a log means breaking one log of a product, quotient or power into several simpler logs.</p>
<div class="box rule"><h4>Property <b>Product, quotient and power properties</b></h4><p>For positive \(M\) and \(N\) and any allowed base \(b\):</p><p><strong>Product:</strong> \(\log_{b}\left(MN\right) = \log_{b}\,M + \log_{b}\,N\)<br><strong>Quotient:</strong> \(\log_{b}\,\dfrac{M}{N} = \log_{b}\,M - \log_{b}\,N\)<br><strong>Power:</strong> \(\log_{b}\,M^{p} = p\log_{b}\,M\)</p><p>In words: a product becomes a sum, a quotient becomes top minus bottom, and an exponent moves to the front. They work the same for \(\log\) and \(\ln\).</p></div>
<h3>Roots and plain numbers</h3>
<p>A root is a fractional power: \(\sqrt{x} = x^{1/2}\) and \(\sqrt[3]{x} = x^{1/3}\). So \(\ln\,\sqrt{x} = \frac{1}{2}\ln\,x\).</p>
<p>If a plain number sits inside a log and you can evaluate it, do so: \(\log_{2}\left(8x\right) = \log_{2}\,8 + \log_{2}\,x = 3 + \log_{2}\,x\).</p>
<div class="box how"><h4>How to <b>expand a logarithm</b></h4><ol>
<li>Use the quotient property first: log of the top minus log of the bottom.</li>
<li>Use the product property to split each product into a sum.</li>
<li>Rewrite any root as a fractional power.</li>
<li>Use the power property to bring each exponent to the front.</li>
<li>Evaluate any log of a plain number.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Expand \(\log_{3}\left(\dfrac{9x^{2}}{y^{4}}\right)\).</p><table class="st">
<tr><td>Quotient property: top minus bottom.</td><td>\(\log_{3}\left(9x^{2}\right) - \log_{3}\,y^{4}\)</td></tr>
<tr><td>Product property on the top.</td><td>\(\log_{3}\,9 + \log_{3}\,x^{2} - \log_{3}\,y^{4}\)</td></tr>
<tr><td>Power property: exponents to the front.</td><td>\(\log_{3}\,9 + 2\log_{3}\,x - 4\log_{3}\,y\)</td></tr>
<tr><td>Evaluate \(\log_{3}\,9\), since \(3^{2} = 9\).</td><td>\(2 + 2\log_{3}\,x - 4\log_{3}\,y\)</td></tr></table></div>
<div class="ex"><h4>Example</h4><p>Expand \(\ln\left(\dfrac{\sqrt{x}}{y^{3}}\right)\).</p><table class="st">
<tr><td>Write the root as a power.</td><td>\(\ln\left(\dfrac{x^{1/2}}{y^{3}}\right)\)</td></tr>
<tr><td>Quotient property.</td><td>\(\ln\,x^{1/2} - \ln\,y^{3}\)</td></tr>
<tr><td>Power property.</td><td>\(\frac{1}{2}\ln\,x - 3\ln\,y\)</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>There is no rule for the log of a sum. \(\log\left(x + 2\right)\) does <strong>not</strong> equal \(\log\,x + \log\,2\). Leave it as it is. The properties are for products, quotients and powers only.</p></div>`,
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
            parts: [{ kind: 'expr', form: 'logexpand', vars: ['x', 'y', 'z'], answer: R.asc, show: R.tex, points: 3, verify: V.equiv(`${n.asc}((x^${m}y^${p})/(z^${q}))`) }],
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
            parts: [{ kind: 'expr', form: 'logexpand', vars: ['x'], answer: R.asc, show: R.tex, points: 3, verify: V.equiv(`${n.asc}(${divide ? `(x^${m})/(${b === 'e' ? `e^(${k})` : Math.pow(b, k)})` : `(${b === 'e' ? `e^(${k})` : Math.pow(b, k)})(x^${m})`})`) }],
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
            parts: [{ kind: 'expr', form: 'logexpand', vars: ['x', 'y'], answer: R.asc, show: R.tex, points: 3, verify: V.equiv(`${n.asc}(√(x)/y^${p})`) }],
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
    lesson: T`<p>Condensing is expanding in reverse. You start with several logs and combine them into <strong>one</strong> logarithm. You use the same three properties, read from right to left.</p>
<div class="box rule"><h4>Property <b>Combining logs with the same base</b></h4><p>For positive \(M\) and \(N\):</p><p>\(\log_{b}\,M + \log_{b}\,N = \log_{b}\left(MN\right)\)<br>\(\log_{b}\,M - \log_{b}\,N = \log_{b}\,\dfrac{M}{N}\)<br>\(p\log_{b}\,M = \log_{b}\,M^{p}\)</p><p>You can only combine logs that have the same base.</p></div>
<div class="box how"><h4>How to <b>condense to a single logarithm</b></h4><ol>
<li>Power property first: move each number in front of a log up as an exponent. A coefficient of \(\frac{1}{2}\) becomes a square root.</li>
<li>If there is a plain number, write it as a log with the same base: \(k = \log_{b}\,b^{k}\).</li>
<li>Logs that are added combine into a product on top. Logs that are subtracted go in the denominator.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Write \(2\log\,x + 3\log\,y - \log\,z\) as a single logarithm.</p><table class="st">
<tr><td>Power property: coefficients become exponents.</td><td>\(\log\,x^{2} + \log\,y^{3} - \log\,z\)</td></tr>
<tr><td>Product property for the sum.</td><td>\(\log\left(x^{2}y^{3}\right) - \log\,z\)</td></tr>
<tr><td>Quotient property for the difference.</td><td>\(\log\left(\dfrac{x^{2}y^{3}}{z}\right)\)</td></tr></table></div>
<div class="ex"><h4>Example</h4><p>Write \(2 + 3\log_{5}\,x\) as a single logarithm.</p><table class="st">
<tr><td>Write 2 as a base-5 log, since \(5^{2} = 25\).</td><td>\(2 = \log_{5}\,25\)</td></tr>
<tr><td>Power property on the other term.</td><td>\(\log_{5}\,25 + \log_{5}\,x^{3}\)</td></tr>
<tr><td>Product property.</td><td>\(\log_{5}\left(25x^{3}\right)\)</td></tr></table></div>
<p>Fractional coefficients turn into roots: \(\frac{1}{2}\ln\,x = \ln\,x^{1/2} = \ln\,\sqrt{x}\). So \(\frac{1}{2}\ln\,x + 4\ln\,y = \ln\left(y^{4}\sqrt{x}\right)\).</p>
<div class="box warn"><h4>Watch out</h4><p>Move the coefficients up <em>before</em> you combine. \(2\log\,x + \log\,y\) equals \(\log\left(x^{2}y\right)\). It is not \(\log\left(2xy\right)\) and not \(2\log\left(xy\right)\).</p></div>`,
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
            parts: [{ kind: 'expr', form: 'logcondense', vars: ['x', 'y', 'z'], answer: ansA, show: ansT, points: 3, verify: V.equiv(S.asc) }],
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
            parts: [{ kind: 'expr', form: 'logcondense', vars: ['x', 'y'], answer: `${n.asc}(y^${p}√(x))`, show: ansT, points: 3, verify: V.equiv(S.asc) }],
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
            parts: [{ kind: 'expr', form: 'logcondense', vars: ['x'], answer: `${n.asc}(${N}x^${m})`, show: ansT, points: 3, verify: V.equiv(S.asc) }],
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
        { label: 'a', ask: 'Rewrite it as a quotient of natural logs (or common logs).', kind: 'expr', form: 'cob', vars: [], answer: `ln(${N})/ln(${b})`, show: T`\frac{\ln ${N}}{\ln ${b}}`, points: 2, verify: V.equiv(`log_${b}(${N})`) },
        { label: 'b', ask: 'Approximate it to the nearest hundredth.', kind: 'num', nolog: true, tol: 0.006, answer: r.toFixed(2), show: r.toFixed(2), points: 2, verify: roundedRoot(`${b}^x=${N}`, 2, { lo: -10, hi: 10 }) },
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
    lesson: T`<p>Most calculators have only two log keys: <strong>LOG</strong> (base 10) and <strong>LN</strong> (base \(e\)). To find a log with any other base, such as \(\log_{3}\,20\), you change it into common or natural logs.</p>
<p>You can estimate first. Since \(3^{2} = 9\) and \(3^{3} = 27\), the value of \(\log_{3}\,20\) is between 2 and 3. It is not a whole number, so you need a calculator.</p>
<div class="box rule"><h4>Formula <b>Change of base</b></h4><p>For positive \(N\) and an allowed base \(b\):</p><p>\(\log_{b}\,N = \dfrac{\ln\,N}{\ln\,b} = \dfrac{\log\,N}{\log\,b}\)</p><p>The number inside goes on top. The base goes on the bottom. Both ways give the same answer.</p></div>
<div class="box how"><h4>How to <b>evaluate a log with change of base</b></h4><ol>
<li>Write the quotient: \(\ln\) of the inside over \(\ln\) of the base.</li>
<li>Compute it on a calculator. If you write down middle steps, keep at least four decimal places.</li>
<li>Round only at the end.</li>
<li>Check: the base raised to your answer should be close to the inside.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Evaluate \(\log_{3}\,20\) to the nearest hundredth.</p><table class="st">
<tr><td>Write the change-of-base quotient.</td><td>\(\log_{3}\,20 = \dfrac{\ln\,20}{\ln\,3}\)</td></tr>
<tr><td>Find each natural log.</td><td>\(\approx \dfrac{2.9957}{1.0986}\)</td></tr>
<tr><td>Divide and round.</td><td>\(\approx 2.73\)</td></tr>
<tr><td>Check.</td><td>\(3^{2.73} \approx 20.07\) ✓</td></tr></table></div>
<h3>Negative answers</h3>
<p>When the base is bigger than 1 and the inside is between 0 and 1, the log is negative. For example, \(\log_{2}\,0.5 = -1\) because \(2^{-1} = 0.5\). The formula handles this on its own, because the log of a number less than 1 is negative.</p>
<div class="ex"><h4>Example</h4><p>Evaluate \(\log_{4}\,0.3\) to the nearest hundredth.</p><table class="st">
<tr><td>Write the quotient.</td><td>\(\dfrac{\ln\,0.3}{\ln\,4}\)</td></tr>
<tr><td>Find each natural log.</td><td>\(\approx \dfrac{-1.2040}{1.3863}\)</td></tr>
<tr><td>Divide and round.</td><td>\(\approx -0.87\)</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>Put \(\ln\,N\) (the inside) on top and \(\ln\,b\) (the base) on the bottom. Also, \(\dfrac{\ln\,20}{\ln\,3}\) is a division of two logs. It is not \(\ln\,\dfrac{20}{3}\).</p></div>`,
    variants: {
      value: { name: 'Evaluate with change of base', gen: (rng) => cob(rng, false) },
      small: { name: 'Answers that are negative', gen: (rng) => cob(rng, true) },
    },
  });

  // ================= solving log equations =================
  MX.register({
    id: 'log-solve', section: SEC, title: 'Solving logarithmic equations', kind: 'skill', sources: [],
    slots: [{ label: 'Solve', source: ADDED, pool: ['basic', 'equal', 'sum', 'natural', 'nosol'] }],
    lesson: T`<p>A logarithmic equation has the variable inside a log, as in \(\log_{2}\left(x + 3\right) = 5\). You solve it by getting rid of the log. There are two ways, depending on what is on the other side. After you solve, you must always check your answers.</p>
<h3>A log equal to a number</h3>
<p>Rewrite the equation in exponential form. Then the log is gone. \(\log_{b}\,M = k\) becomes \(M = b^{k}\).</p>
<div class="ex"><h4>Example</h4><p>Solve \(\log_{2}\left(x + 3\right) = 5\).</p><table class="st">
<tr><td>Rewrite in exponential form.</td><td>\(x + 3 = 2^{5}\)</td></tr>
<tr><td>Evaluate the power and solve.</td><td>\(x + 3 = 32\), so \(x = 29\)</td></tr>
<tr><td>Check: the inside must be positive.</td><td>\(29 + 3 = 32 \gt 0\) ✓</td></tr></table></div>
<p>With \(\ln\), the base is \(e\): \(\ln\left(2x + 1\right) = 3\) becomes \(2x + 1 = e^{3}\), so \(x = \dfrac{e^{3} - 1}{2} \approx 9.54\).</p>
<h3>A log equal to a log</h3>
<div class="box rule"><h4>Property <b>One-to-one property of logarithms</b></h4><p>If \(\log_{b}\,M = \log_{b}\,N\), then \(M = N\). Equal logs with the same base have equal insides.</p></div>
<p>For example, \(\log\left(2x + 3\right) = \log\left(x + 7\right)\) gives \(2x + 3 = x + 7\), so \(x = 4\). Both insides equal 11, which is positive ✓.</p>
<div class="box how"><h4>How to <b>solve a logarithmic equation</b></h4><ol>
<li>If one side has several logs, condense them into one log.</li>
<li>If a log equals a number, rewrite in exponential form. If a log equals a log with the same base, set the insides equal.</li>
<li>Solve the equation that is left.</li>
<li>Check every answer in the original equation. The inside of every log must be positive. Throw out any answer that fails; it is <strong>extraneous</strong>. If no answer is left, there is <strong>no solution</strong>.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Solve \(\log_{2}\,x + \log_{2}\left(x - 2\right) = 3\).</p><table class="st">
<tr><td>Condense with the product property.</td><td>\(\log_{2}\left(x\left(x - 2\right)\right) = 3\)</td></tr>
<tr><td>Rewrite in exponential form.</td><td>\(x^{2} - 2x = 2^{3} = 8\)</td></tr>
<tr><td>Set the quadratic equal to 0 and factor.</td><td>\(x^{2} - 2x - 8 = 0\), so \(\left(x - 4\right)\left(x + 2\right) = 0\)</td></tr>
<tr><td>List the candidates.</td><td>\(x = 4\) or \(x = -2\)</td></tr>
<tr><td>Check \(x = -2\): \(\log_{2}\left(-2\right)\) does not exist.</td><td>reject \(-2\)</td></tr>
<tr><td>Check \(x = 4\).</td><td>\(\log_{2}\,4 + \log_{2}\,2 = 2 + 1 = 3\) ✓</td></tr></table></div>
<p>The answer is \(x = 4\).</p>
<div class="box warn"><h4>Watch out</h4><p>The answer itself may be negative. What must be positive is the inside of every log. For example, \(\log\left(x + 5\right) = 0\) gives \(x + 5 = 1\), so \(x = -4\), and that is fine because \(-4 + 5 = 1 \gt 0\).</p></div>
<p>If no answer survives the check, type <code>no solution</code>.</p>`,
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
            parts: [{ kind: 'num', frac: true, nolog: true, var: 'x', answer: x.str(), show: T`x = ${x.tex()}`, points: 3, verify: V.solves(`${n.asc}(${In.asc})=${k}`, { lo: -50, hi: 1100 }) }],
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
            parts: [{ kind: 'num', frac: true, nolog: true, var: 'x', answer: String(x0), show: 'x = ' + x0, points: 3, verify: V.solves(`${n.asc}(${A1.asc})=${n.asc}(${A2.asc})`) }],
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
            parts: [{ kind: 'num', frac: true, nolog: true, var: 'x', answer: String(p), show: 'x = ' + p, points: 4, verify: V.solves(`${n.asc}(x)+${n.asc}(x+${d})=${k}`) }],
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
            parts: [{ kind: 'num', var: 'x', tol: 0.006, answer: r.toFixed(2), show: T`x = \frac{e^{${k}} ${MX.sgnTerm(-c)}}{${a}} \approx ${r.toFixed(2)}`, points: 3, verify: roundedRoot(`ln(${In.asc})=${k}`, 2) }],
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
            parts: [{ kind: 'num', var: 'x', answer: 'nosol', show: '\\text{no solution}', points: 3, verify: V.solves(`${n.asc}(x-${c1})=${n.asc}(${s}-x)`) }],
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
    let prompt, exact, exactT, x, steps, eqA;
    if (kind === 'common') {
      x = Math.log(N) / Math.log(b);
      prompt = T`\(${b}^{x} = ${N}\)`; eqA = `${b}^x=${N}`; exact = `ln(${N})/ln(${b})`; exactT = T`\frac{\ln ${N}}{\ln ${b}}`;
      steps = [T`Take the natural log of both sides: \(\ln ${b}^{x} = \ln ${N}\)`, T`Power rule: \(x\ln ${b} = \ln ${N}\), so \(x = \dfrac{\ln ${N}}{\ln ${b}}\)`];
    } else if (kind === 'natural') {
      const k = rng.int(2, 5);
      x = Math.log(N) / k;
      prompt = T`\(e^{${k}x} = ${N}\)`; eqA = `e^(${k}x)=${N}`; exact = `ln(${N})/${k}`; exactT = T`\frac{\ln ${N}}{${k}}`;
      steps = [T`Take \(\ln\) of both sides: \(\ln e^{${k}x} = \ln ${N}\)`, T`\(\ln e^{${k}x} = ${k}x\), so \(x = \dfrac{\ln ${N}}{${k}}\)`];
    } else if (kind === 'isolate') {
      const a = rng.int(2, 6), c = rng.int(1, 20);
      x = Math.log(N) / Math.log(b);
      prompt = T`\(${a}\cdot${b}^{x} + ${c} = ${a * N + c}\)`; eqA = `${a}*${b}^x+${c}=${a * N + c}`; exact = `ln(${N})/ln(${b})`; exactT = T`\frac{\ln ${N}}{\ln ${b}}`;
      steps = [T`Isolate the power first: \(${a}\cdot${b}^{x} = ${a * N}\), so \(${b}^{x} = ${N}\)`, T`Take \(\ln\): \(x\ln ${b} = \ln ${N}\), so \(x = \dfrac{\ln ${N}}{\ln ${b}}\)`];
    } else {
      const h = rng.int(1, 5);
      x = h + Math.log(N) / Math.log(b);
      prompt = T`\(${b}^{x - ${h}} = ${N}\)`; eqA = `${b}^(x-${h})=${N}`; exact = `${h}+ln(${N})/ln(${b})`; exactT = T`${h} + \frac{\ln ${N}}{\ln ${b}}`;
      steps = [T`Take \(\ln\): \(\left(x - ${h}\right)\ln ${b} = \ln ${N}\)`, T`\(x - ${h} = \dfrac{\ln ${N}}{\ln ${b}}\), so \(x = ${h} + \dfrac{\ln ${N}}{\ln ${b}}\)`];
    }
    const r = Math.round(x * 100) / 100;
    return {
      prompt: T`Solve ${prompt}. Give the exact answer, then round to the nearest hundredth.`,
      parts: [
        { label: 'a', ask: 'Exact answer (use logs)', kind: 'expr', form: 'exactlog', vars: [], pre: 'x =', answer: exact, show: T`x = ${exactT}`, points: 2, verify: makesTrue(eqA) },
        { label: 'b', ask: 'Rounded to the nearest hundredth', kind: 'num', nolog: true, tol: 0.006, pre: 'x ≈', answer: r.toFixed(2), show: T`x \approx ${r.toFixed(2)}`, points: 2, verify: roundedRoot(eqA, 2, { lo: -20, hi: 30 }) },
      ],
      solution: [...steps, T`\(x = ${exactT} \approx ${H.box(r.toFixed(2))}\)`],
    };
  }
  MX.register({
    id: 'log-expeq', section: SEC, title: 'Exponential equations using logs', kind: 'skill', sources: [],
    slots: [{ label: 'Solve with logs', source: ADDED, pool: ['common', 'natural', 'isolate', 'shift'] }],
    lesson: T`<p>In an equation like \(5^{x} = 12\), the variable is in the exponent. Since \(5^{1} = 5\) and \(5^{2} = 25\), you know \(x\) is between 1 and 2, but 12 is not a nice power of 5. Logs solve this: the power property moves the exponent down to the front, where you can solve for it.</p>
<div class="box rule"><h4>Property <b>The power property does the work</b></h4><p>\(\ln\,b^{x} = x\,\ln\,b\). For base \(e\), \(\ln\,e^{x} = x\), because \(\ln\,e = 1\).</p></div>
<div class="box how"><h4>How to <b>solve an exponential equation with logs</b></h4><ol>
<li>Isolate the power: get \(b^{\text{something}}\) alone on one side.</li>
<li>Take \(\ln\) (or \(\log\)) of both sides.</li>
<li>Use the power property to bring the exponent to the front.</li>
<li>Solve for \(x\). This gives the exact answer, written with logs.</li>
<li>Use a calculator to round, if asked.</li></ol></div>
<div class="ex"><h4>Example</h4><p>Solve \(3\cdot 5^{x} + 4 = 40\).</p><table class="st">
<tr><td>Subtract 4 from both sides.</td><td>\(3\cdot 5^{x} = 36\)</td></tr>
<tr><td>Divide by 3 to isolate the power.</td><td>\(5^{x} = 12\)</td></tr>
<tr><td>Take \(\ln\) of both sides.</td><td>\(\ln\,5^{x} = \ln\,12\)</td></tr>
<tr><td>Power property.</td><td>\(x\,\ln\,5 = \ln\,12\)</td></tr>
<tr><td>Divide by \(\ln\,5\). This is the exact answer.</td><td>\(x = \dfrac{\ln\,12}{\ln\,5}\)</td></tr>
<tr><td>Round with a calculator.</td><td>\(x \approx 1.54\)</td></tr></table></div>
<h3>Base e</h3>
<p>When the base is \(e\), take \(\ln\) of both sides. The \(\ln\) and the \(e\) cancel. For \(e^{2x} = 15\): \(2x = \ln\,15\), so \(x = \dfrac{\ln\,15}{2} \approx 1.35\).</p>
<h3>An expression in the exponent</h3>
<p>Keep the whole exponent together in parentheses when it moves to the front.</p>
<div class="ex"><h4>Example</h4><p>Solve \(2^{x - 3} = 10\).</p><table class="st">
<tr><td>Take \(\ln\) of both sides and use the power property.</td><td>\(\left(x - 3\right)\ln\,2 = \ln\,10\)</td></tr>
<tr><td>Divide by \(\ln\,2\).</td><td>\(x - 3 = \dfrac{\ln\,10}{\ln\,2}\)</td></tr>
<tr><td>Add 3. Then round.</td><td>\(x = 3 + \dfrac{\ln\,10}{\ln\,2} \approx 6.32\)</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>Isolate the power <em>before</em> you take logs: \(3\cdot 5^{x}\) is not \(15^{x}\). Also, \(\dfrac{\ln\,12}{\ln\,5}\) is not \(\ln\,\dfrac{12}{5}\) and not \(\ln\,12 - \ln\,5\). Divide the two logs.</p></div>`,
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

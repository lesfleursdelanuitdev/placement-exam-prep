/* verify.js: independent answer checks.
   Every generated part carries verify(a, part). It is built from the problem as the student sees it
   (the equation, expression, story numbers or graph data), never from the generator's worked answer,
   and it re-derives the answer a different way: substitution, numeric root finding, equivalence at
   sample points, or sampling an inequality. `a` is the stored answer decoded by V.decode; a verifier
   returns true when the answer is right and a short reason string when it isn't.
   The test suite runs every verifier on the answer key (and on deliberately broken keys, which must be
   rejected), and the exam builder refuses any question whose key fails. */
(function (G) {
  'use strict';
  const MX = G.MX;
  const V = {};
  const INF = Infinity;
  const A = () => MX.ast;

  // ---------- small tools ----------
  const parse = (s) => (typeof s === 'string' ? MX.parse(MX.normalizeInput(s)) : s);
  V.parse = parse;
  // numeric value of a constant expression string ("3/4", "2√5", "-1.5") or a number
  V.num = (s) => (typeof s === 'number' ? s : s && s.t ? MX.evalAST(s, {}) : MX.evalAST(parse(String(s)), {}));
  V.close = (a, b, tol = 1e-6) => a === b || (isFinite(a) && isFinite(b) && Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b)));
  V.sameSet = (xs, ys, tol) => {
    const u = [];
    xs.forEach((x) => { if (!u.some((y) => V.close(x, y, tol))) u.push(x); });
    const w = [];
    ys.forEach((y) => { if (!w.some((x) => V.close(x, y, tol))) w.push(y); });
    return u.length === w.length && u.every((x) => w.some((y) => V.close(x, y, tol)));
  };
  // f(env) for an expression string; with a single variable name, f(x)
  V.fn = (s, v) => {
    const n = parse(s);
    return v ? (x, env) => MX.evalAST(n, Object.assign({}, env, { [v]: x })) : (env) => MX.evalAST(n, env || {});
  };
  // a relation "lhs op rhs" (op one of = < > <= >= !=); chains like "-3 < 2x+1 <= 7" become several
  const OPS = /(<=|>=|!=|=|<|>)/;
  V.rel = (s) => {
    const bits = MX.normalizeInput(String(s)).replace(/≠/g, '!=').split(OPS).map((x) => x.trim());
    if (bits.length < 3 || bits.length % 2 === 0) throw new Error('not a relation: ' + s);
    const out = [];
    for (let k = 0; k + 2 < bits.length; k += 2) out.push({ lhs: MX.parse(bits[k]), op: bits[k + 1], rhs: MX.parse(bits[k + 2]) });
    return out;
  };
  // does env satisfy the relation? equality is judged with a relative tolerance so 1/3 works in floating point
  function holds(r, env, tol = 1e-9) {
    const L = MX.evalAST(r.lhs, env), R = MX.evalAST(r.rhs, env);
    if (!isFinite(L) || !isFinite(R)) return false;
    const d = L - R, eq = Math.abs(d) <= tol * Math.max(1, Math.abs(L), Math.abs(R));
    switch (r.op) {
      case '=': return eq;
      case '!=': return !eq;
      case '<': return !eq && d < 0;
      case '>': return !eq && d > 0;
      case '<=': return eq || d < 0;
      case '>=': return eq || d > 0;
    }
    return false;
  }
  // truth of a relation spec at env: a string (chains allowed; "A and B", "A or B" allowed), a list (all must hold), or a function
  V.truth = (spec) => {
    if (typeof spec === 'function') return spec;
    if (Array.isArray(spec)) { const fs = spec.map(V.truth); return (env) => fs.every((f) => f(env)); }
    const s = String(spec);
    if (/\s+or\s+/i.test(s)) { const fs = s.split(/\s+or\s+/i).map(V.truth); return (env) => fs.some((f) => f(env)); }
    if (/\s+and\s+/i.test(s)) { const fs = s.split(/\s+and\s+/i).map(V.truth); return (env) => fs.every((f) => f(env)); }
    const rs = V.rel(s);
    return (env) => rs.every((r) => holds(r, env));
  };
  // does the point / assignment satisfy every equation in the list?
  V.satisfies = (eqs, env) => [].concat(eqs).every((e) => V.truth(e)(env));

  // ---------- numeric root finding ----------
  // Every real root of lhs = rhs (a string like "x^2-4 = 3x" or {lhs, rhs}) on [lo, hi].
  // Returns a sorted array, or 'all' when the equation holds everywhere it is defined.
  // Finds sign changes (rejecting poles), zeros where the domain ends (√, log), and touching roots (x - 3)^2.
  // settings: the exam builder lowers the sample count (it only needs a safety net; the tests use the full count)
  V.opts = { n: 20000 };
  // nearest simple fraction p/q (q ≤ 1000) within tol of x, or null
  function snap(x, tol) {
    if (Number.isInteger(x)) return x;
    for (let q = 1; q <= 1000; q++) { const p = Math.round(x * q); if (Math.abs(p / q - x) <= tol * Math.max(1, Math.abs(x))) return p / q; }
    return null;
  }
  V.roots = function (eq, o = {}) {
    const v = o.v || 'x', lo = o.lo != null ? o.lo : -200, hi = o.hi != null ? o.hi : 200, n = o.n || V.opts.n;
    const r = typeof eq === 'string' ? V.rel(eq)[0] : eq;
    const env = Object.assign({}, o.env);
    const side = (x) => { env[v] = x; return [MX.evalAST(r.lhs, env), MX.evalAST(r.rhs, env)]; };
    const f = (x) => { const [L, R] = side(x); return L - R; };
    const tolAt = (x, t) => { const [L, R] = side(x); return t * Math.max(1, Math.abs(L), Math.abs(R)); };
    const isRoot = (x, t = 1e-7) => { const d = f(x); return isFinite(d) && Math.abs(d) <= tolAt(x, t); };
    const xs = new Float64Array(n + 1), ds = new Float64Array(n + 1), fin = new Array(n + 1);
    let nf = 0, nz = 0;
    for (let k = 0; k <= n; k++) {
      const x = lo + ((hi - lo) * k) / n, [L, R] = side(x), d = L - R;
      xs[k] = x; ds[k] = d; fin[k] = isFinite(d);
      if (fin[k]) { nf++; if (Math.abs(d) <= 1e-9 * Math.max(1, Math.abs(L), Math.abs(R))) nz++; }
    }
    if (nf > 50 && nz >= 0.98 * nf) return 'all';
    const out = [];
    // a candidate root found numerically: if it sits on a simple fraction, judge that exact value instead,
    // so a hole like x = 1 in (x^2 - 1)/(x - 1) = 2 is rejected rather than approached
    const add = (x, t) => {
      const s = snap(x, t);
      if (s !== null && s !== x) {
        const d = f(s);
        if (!isFinite(d)) return;
        if (Math.abs(d) <= tolAt(s, 1e-9)) x = s;
      }
      if (!isRoot(x, 1e-6)) return;
      if (!out.some((y) => V.close(x, y, 1e-6))) out.push(x);
    };
    const bisect = (a, b, g) => { let ga = g(a); for (let i = 0; i < 200 && b - a > 1e-15 * Math.max(1, Math.abs(a)); i++) { const m = (a + b) / 2, gm = g(m); if ((gm < 0) === (ga < 0)) { a = m; ga = gm; } else b = m; } return (a + b) / 2; };
    const gr = (Math.sqrt(5) - 1) / 2;
    for (let k = 0; k <= n; k++) {
      if (fin[k] && ds[k] === 0) add(xs[k], 1e-9);
      if (k === n) break;
      const a = xs[k], b = xs[k + 1];
      if (fin[k] && fin[k + 1] && ds[k] * ds[k + 1] < 0) add(bisect(a, b, f), 1e-9);
      else if (fin[k] !== fin[k + 1]) {
        // the domain starts or ends between a and b: find where, then test the edge from the defined side
        const g = (x) => (isFinite(f(x)) ? (fin[k] ? -1 : 1) : (fin[k] ? 1 : -1));
        const e = bisect(a, b, g);
        for (const x of [e, e - 1e-12, e + 1e-12]) if (isFinite(f(x))) { add(x, 1e-9); break; }
      }
      // touching root, like (x - 3)^2 = 0: |f| dips toward 0 between samples without changing sign.
      // A parabola through the three samples estimates the dip; only a deep dip is refined.
      if (k > 0 && fin[k - 1] && fin[k + 1] && ds[k - 1] * ds[k] > 0 && ds[k] * ds[k + 1] > 0) {
        const g0 = Math.abs(ds[k - 1]), g1 = Math.abs(ds[k]), g2 = Math.abs(ds[k + 1]), c2 = g2 - 2 * g1 + g0;
        if (g1 < g0 && g1 < g2 && c2 > 0 && g1 - ((g2 - g0) * (g2 - g0)) / (8 * c2) <= 0.5 * g1) {
          let p = xs[k - 1], q = xs[k + 1];
          for (let i = 0; i < 120; i++) {
            const m1 = q - gr * (q - p), m2 = p + gr * (q - p);
            if (Math.abs(f(m1)) < Math.abs(f(m2))) q = m2; else p = m1;
          }
          add((p + q) / 2, 1e-7);
        }
      }
    }
    return out.sort((x, y) => x - y);
  };

  // ---------- decoding stored answers ----------
  const decodeNum = (s) => (MX.isNoSolution(s) || s === 'nosol' ? { nosol: true } : MX.isAllReal(s) || s === 'allreal' ? { allreal: true } : V.num(s));
  const decodePoint = (s) => MX.parsePoint(MX.normalizeInput(String(s))).map((n) => MX.evalAST(n, {}));
  V.decode = function (part) {
    switch (part.kind) {
      case 'num': return decodeNum(String(part.answer));
      case 'sci': return V.num(String(part.answer).replace(/\s*[xX×*·]\s*10\s*\^\s*/g, '*10^'));
      case 'nums': case 'radpm': return part.answers.map((s) => V.num(s));
      case 'set': return part.answers.map((s) => { try { const x = V.num(s); return isFinite(x) ? x : String(s); } catch (e) { return String(s); } });
      case 'expr': case 'factor': return MX.isPrimeWord(part.answer) ? { prime: true } : parse(String(part.answer));
      case 'eq': case 'eqform': return V.rel(part.answer)[0];
      case 'point': return decodePoint(part.answer);
      case 'points': return part.answers.map(decodePoint);
      case 'interval': case 'ineq': return MX.readRegion(String(part.answer));
      case 'system': return part.answers.map((s) => V.rel(Array.isArray(s) ? s[0] : s)[0]);
      case 'choice': return part.answer;
    }
    throw new Error('verify: unknown kind ' + part.kind);
  };
  // a deliberately wrong version of a decoded answer (the tests require verifiers to reject it)
  const bump = (x) => (typeof x === 'number' ? x + 1 : x);
  V.mutate = function (part, a) {
    switch (part.kind) {
      case 'num': return typeof a === 'number' ? a + 1 : a.nosol ? 3.25 : { nosol: true };
      case 'sci': return a * 10;
      case 'nums': case 'radpm': return a.length ? [bump(a[0]) + 0.5, ...a.slice(1)] : [3.25];
      case 'set': return a.length ? [typeof a[0] === 'number' ? a[0] + 0.5 : a[0] + '_x', ...a.slice(1)] : [3.25];
      case 'expr': case 'factor': return a.prime ? parse('x+1') : { t: 'add', a, b: { t: 'num', v: 1 } };
      case 'eq': case 'eqform': return { lhs: a.lhs, op: a.op, rhs: { t: 'add', a: a.rhs, b: { t: 'num', v: 1 } } };
      case 'point': return [a[0] + 1, a[1]];
      case 'points': return a.length ? [[a[0][0] + 1, a[0][1]], ...a.slice(1)] : [[3.25, 0]];
      case 'interval': case 'ineq': {
        if (!a.length) return [{ lo: 0, hi: 1, lc: true, hc: true }];
        const r0 = a[0], sh = (e) => (isFinite(e) ? e + 1 : e);
        if (isFinite(r0.lo) || isFinite(r0.hi)) return [{ lo: sh(r0.lo), hi: sh(r0.hi), lc: r0.lc, hc: r0.hc }, ...a.slice(1)];
        return [];
      }
      case 'system': return [{ lhs: a[0].lhs, op: a[0].op, rhs: { t: 'add', a: a[0].rhs, b: { t: 'num', v: 1 } } }, ...a.slice(1)];
      case 'choice': return (a + 1) % part.options.length;
    }
    return a;
  };

  // ---------- verifiers ----------
  const result = (ok, why) => (ok ? true : why);
  const asSet = (a) => (typeof a === 'number' ? [a] : Array.isArray(a) ? a : a && a.nosol ? [] : null);
  // the answer is the full real solution set of the equation (num, nums, set, radpm).
  // o: {v, lo, hi, n, env, keep: x => bool to drop roots the question rules out (e.g. negative lengths)}
  V.solves = (eq, o = {}) => {
    let cache = null;
    return (a) => {
      let rs = cache || (cache = V.roots(eq, o));
      if (rs === 'all') return result(a && a.allreal, 'the equation is an identity, so every real number is a solution');
      if (a && a.allreal) return 'the equation is not an identity';
      if (o.keep) rs = rs.filter(o.keep);
      const got = asSet(a);
      if (!got) return 'unreadable answer';
      return result(V.sameSet(got, rs), 'the solutions are ' + (rs.length ? rs.map((x) => MX.num(x, 6)).join(', ') : 'none') + ', not ' + (got.length ? got.map((x) => MX.num(+x, 6)).join(', ') : 'none'));
    };
  };
  // a formula answer v = a(others) solves the literal equation: substituting it makes both sides equal
  V.solvesFor = (eq, v) => (a) => {
    const r = typeof eq === 'string' ? V.rel(eq)[0] : eq;
    const others = [...new Set([...A().vars(r.lhs), ...A().vars(r.rhs), ...A().vars(a)])].filter((x) => x !== v);
    if (A().vars(a).has(v)) return 'the answer still contains ' + v;
    let ok = 0;
    for (let k = 0; k < 40 && ok < 8; k++) {
      const env = MX.envAt(others, k);
      if (k >= 10) for (const x in env) env[x] += (k % 7) - 3;
      const val = MX.evalAST(a, env);
      if (!isFinite(val)) continue;
      env[v] = val;
      const L = MX.evalAST(r.lhs, env), R = MX.evalAST(r.rhs, env);
      if (!isFinite(L) || !isFinite(R)) continue;
      if (!V.close(L, R, 1e-7)) return 'substituting the answer does not balance the equation';
      ok++;
    }
    return result(ok >= 3, 'could not test the answer at enough points');
  };
  // the answer equals a value computed from the problem (an expression string in parser syntax, a number, or a function)
  V.value = (spec, tol) => (a) => {
    const want = typeof spec === 'function' ? spec() : V.num(spec);
    if (typeof a !== 'number') return 'expected a number';
    return result(V.close(a, want, tol), 'the value is ' + MX.num(want, 6) + ', not ' + MX.num(a, 6));
  };
  // the answer expression is equal to the given expression for every value of its variables
  V.equiv = (s) => (a) => {
    if (a && a.prime) return 'the answer says prime';
    return result(MX.equivalent(a, parse(s)), 'the answer is not equal to ' + s);
  };
  // the region answer is exactly the set of x where spec holds (interval, ineq). o: {v, lo, hi, n, env}
  V.region = (spec, o = {}) => (a) => {
    const v = o.v || 'x', t = V.truth(spec);
    const truth = (x) => t(Object.assign({}, o.env, { [v]: x }));
    const inside = (x) => a.some((r) => (x > r.lo || (x === r.lo && r.lc)) && (x < r.hi || (x === r.hi && r.hc)));
    const lo = o.lo != null ? o.lo : -200, hi = o.hi != null ? o.hi : 200, n = o.n || 20000;
    const gap = (e) => 1e-5 * Math.max(1, Math.abs(e));
    const probes = [];
    let prev = null;
    for (let k = 0; k <= n; k++) {
      const x = lo + ((hi - lo) * k) / n, tx = truth(x);
      probes.push(x);
      if (prev && prev.t !== tx) {
        let p = prev.x, q = x;
        for (let i = 0; i < 80; i++) { const m = (p + q) / 2; if (truth(m) === prev.t) p = m; else q = m; }
        probes.push(p - gap(p), q + gap(q));
      }
      prev = { x, t: tx };
    }
    const ends = [];
    a.forEach((r) => [r.lo, r.hi].forEach((e) => { if (isFinite(e)) { ends.push(e); probes.push(e - gap(e), e + gap(e)); } }));
    probes.push(-1e6, 1e6, lo - 50, hi + 50);
    // an endpoint itself is judged exactly (is it included?); points a hair away from it are skipped, because
    // there floating point can't tell "at the endpoint" from "next to it" and the two checks would disagree
    const nearEnd = (x) => ends.some((e) => x !== e && Math.abs(x - e) < 1e-6 * Math.max(1, Math.abs(e)));
    for (const x of [...ends, ...probes]) {
      if (nearEnd(x)) continue;
      if (inside(x) !== truth(x)) return 'at ' + v + ' = ' + MX.num(x, 6) + ' the answer says ' + (inside(x) ? 'yes' : 'no') + ' but the problem says ' + (truth(x) ? 'yes' : 'no');
    }
    return true;
  };
  // exactly one option passes test(i), and it is the marked answer (choice)
  V.choice = (test) => (a, part) => {
    const good = part.options.map((_, i) => i).filter((i) => test(i));
    if (good.length !== 1) return good.length ? 'options ' + good.join(', ') + ' are all correct' : 'no option is correct';
    return result(good[0] === a, 'option ' + good[0] + ' is correct, not option ' + a);
  };
  // choice whose options carry `data` (what each option shows): exactly one option's data passes test(data)
  V.choiceData = (test) => (a, part) => {
    if (!part.data || part.data.length !== part.options.length) return 'the options carry no data to check';
    return V.choice((i) => { const r = test(part.data[i], i); return r === true; })(a, part);
  };
  // choice between region pictures (number lines): exactly one shows the solution set of spec
  V.choiceRegion = (spec, o) => V.choiceData((reg) => V.region(spec, o)(reg));
  // a point answer: test(x, y) → true | reason
  V.point = (test) => (a) => { const r = test(a[0], a[1]); return r === true ? true : r || 'the point is wrong'; };
  // a list of points equals exactly the given list (order ignored)
  V.pointSet = (want) => (a) => {
    const w = typeof want === 'function' ? want() : want;
    const same = (p, q) => V.close(p[0], q[0]) && V.close(p[1], q[1]);
    return result(a.length === w.length && a.every((p) => w.some((q) => same(p, q))) && w.every((q) => a.some((p) => same(p, q))), 'the points should be ' + w.map((p) => '(' + p.map((z) => MX.num(z, 6)).join(', ') + ')').join(', '));
  };
  // an equation answer written as v = expr (like y = 3x - 2) describes the same relation as spec:
  // for many values of `over`, the point (over, expr) satisfies spec. spec is a string like "5x - 4y = 3" or a
  // function env → bool. o: {v:'y', over:'x', xs:[sample values]} (keep samples inside the domain for √, log…)
  V.explicit = (spec, o = {}) => (a) => {
    const v = o.v || 'y', over = o.over || 'x', t = V.truth(spec);
    let rhs = null;
    if (a.lhs.t === 'var' && a.lhs.n === v) rhs = a.rhs;
    else if (a.rhs.t === 'var' && a.rhs.n === v) rhs = a.lhs;
    if (!rhs || a.op !== '=') return 'expected an equation ' + v + ' = …';
    if (A().vars(rhs).has(v)) return v + ' appears on both sides';
    const xs = o.xs || [-3.7, -2, -1.3, -0.5, 0, 0.6, 1, 1.9, 2.5, 3.3, 5.1, 7.2];
    let tested = 0;
    for (const x of xs) {
      const env = Object.assign({}, o.env, { [over]: x }), y = MX.evalAST(rhs, env);
      if (!isFinite(y)) continue;
      env[v] = y;
      if (!t(env)) return 'the point (' + MX.num(x, 4) + ', ' + MX.num(y, 4) + ') is not on the graph';
      tested++;
    }
    return result(tested >= 4, 'could not test enough points');
  };
  // "write a system that models the story" (system): every equation holds at the story's true values
  // `truth` (an env like {x: 4000, y: 7000}, built from what the story states), the system pins down
  // exactly one solution, and each equation uses only the listed variables.
  V.model = (truth, o = {}) => (a) => {
    const vars = Object.keys(truth);
    for (const r of a) {
      for (const x of [...A().vars(r.lhs), ...A().vars(r.rhs)]) if (!vars.includes(x)) return 'unexpected variable ' + x;
      if (!holds(r, truth, 1e-7)) return 'an equation does not hold at the true values';
    }
    if (a.length !== vars.length) return 'expected ' + vars.length + ' equations';
    // the Jacobian of the residuals at the truth must be invertible (independent equations)
    const res = (r, env) => MX.evalAST(r.lhs, env) - MX.evalAST(r.rhs, env);
    const J = a.map((r) => vars.map((x) => {
      const h = 1e-4 * Math.max(1, Math.abs(truth[x]));
      const up = Object.assign({}, truth, { [x]: truth[x] + h }), dn = Object.assign({}, truth, { [x]: truth[x] - h });
      return (res(r, up) - res(r, dn)) / (2 * h);
    }));
    const det = J.length === 1 ? J[0][0] : J.length === 2 ? J[0][0] * J[1][1] - J[0][1] * J[1][0]
      : J[0][0] * (J[1][1] * J[2][2] - J[1][2] * J[2][1]) - J[0][1] * (J[1][0] * J[2][2] - J[1][2] * J[2][0]) + J[0][2] * (J[1][0] * J[2][1] - J[1][1] * J[2][0]);
    const scale = J.flat().reduce((m, x) => Math.max(m, Math.abs(x)), 0) || 1;
    return result(Math.abs(det) > 1e-9 * Math.pow(scale, J.length), 'the equations do not determine a single solution');
  };
  // several verifiers must all pass
  V.all = (...vs) => (a, part) => { for (const f of vs) { const r = f(a, part); if (r !== true) return r; } return true; };
  // hand-written check: fn(a, part) → true | reason
  V.custom = (fn) => (a, part) => { const r = fn(a, part); return r === true ? true : r || 'custom check failed'; };

  // run a part's verifier on its stored answer (or on a replacement decoded answer)
  V.run = function (part, a) {
    if (typeof part.verify !== 'function') return 'no verifier';
    try {
      return part.verify(a === undefined ? V.decode(part) : a, part);
    } catch (e) {
      return 'verifier threw: ' + (e && e.message);
    }
  };
  // a question is sound when the grader accepts every stored answer and every verifier agrees
  MX.sound = function (q) {
    if (!q || !q.parts || !q.parts.length) return 'no parts';
    for (let i = 0; i < q.parts.length; i++) {
      const p = q.parts[i];
      let g;
      try { g = MX.check(p, MX.answerInput(p)); } catch (e) { return 'part ' + (i + 1) + ': grader threw'; }
      if (!g || !g.ok) return 'part ' + (i + 1) + ': the grader rejects its own answer key';
      const r = V.run(p);
      if (r !== true) return 'part ' + (i + 1) + ': ' + r;
    }
    return true;
  };
  MX.V = V;
})(typeof window !== 'undefined' ? window : globalThis);

/* check.js: grades one answer part. Every checker returns
   { ok: true }                      correct
   { ok: false, msg }                incorrect (locks on the exam)
   { nudge: msg }                    right value, wrong form: fix and re-check, no penalty
   { error: msg }                    could not read the input: no penalty                */
(function (G) {
  'use strict';
  const MX = G.MX;
  const { P } = MX;
  const A = MX.ast;
  const unwrap = MX.unwrap;

  const close = (a, b, tol) => a === b || Math.abs(a - b) <= (tol != null ? tol : 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)));

  function safe(fn) {
    try { return fn(); }
    catch (e) {
      if (e instanceof MX.ParseError) return { error: e.message };
      throw e;
    }
  }

  // map a mis-cased variable (X for x) to the expected one
  function fixCase(ast, allowed) {
    if (!allowed || !allowed.length) return ast;
    const table = {};
    for (const v of A.vars(ast)) {
      if (allowed.includes(v)) continue;
      const alt = v === v.toLowerCase() ? v.toUpperCase() : v.toLowerCase();
      if (allowed.includes(alt)) table[v] = alt;
    }
    return Object.keys(table).length ? A.renameVars(ast, table) : ast;
  }
  function strayVars(ast, allowed) {
    return [...A.vars(ast)].filter((v) => !allowed.includes(v));
  }

  // strip "x =" / "A =" when the student wrote one
  function stripLhs(str, want) {
    const s = MX.normalizeInput(str);
    if (!/[=]/.test(s) || /[<>]/.test(s)) return { s: str };
    const r = MX.parseRel(s);
    const L = unwrap(r.lhs), R = unwrap(r.rhs);
    if (L.t === 'var' && (!want || L.n === want || L.n.toLowerCase() === want.toLowerCase())) return { ast: r.rhs };
    if (R.t === 'var' && (!want || R.n === want || R.n.toLowerCase() === want.toLowerCase())) return { ast: r.lhs };
    throw new MX.ParseError('Write it as ' + (want || 'x') + ' = …');
  }

  const cleanNum = (s) => String(s).replace(/(\d),(?=\d{3}(\D|$))/g, '$1').replace(/[$%]/g, '').replace(/\b(dollars?|cents?|feet|ft|foot|inches|inch|in\.|meters?|m|miles?|mph|hours?|hrs?|days?|weeks?|grams?|g|liters?|L|pounds?|lbs?|percent)\b\.?$/i, '');

  // ---------- structural helpers ----------
  function isMonomial(n) {
    n = unwrap(n);
    switch (n.t) {
      case 'num': case 'var': return true;
      case 'neg': return isMonomial(n.a);
      case 'pow': {
        const b = unwrap(n.a), e = unwrap(n.b);
        const eNum = e.t === 'num' || (e.t === 'neg' && unwrap(e.a).t === 'num');
        return eNum && (b.t === 'var' || b.t === 'num' || isMonomial(b));
      }
      case 'mul': case 'div': return isMonomial(n.a) && isMonomial(n.b);
    }
    return false;
  }
  function sumTerms(n, out = []) {
    const u = unwrap(n);
    if (u.t === 'add' || u.t === 'sub') { sumTerms(u.a, out); sumTerms(u.b, out); return out; }
    out.push(u);
    return out;
  }
  // issues with a single monomial written as a product/quotient
  function monomialIssues(n) {
    const issues = [];
    let negExp = false, zeroExp = false, powOfNonAtom = false;
    const varCount = {};
    const numsTop = [], numsBot = [];
    (function visit(x, inDen) {
      x = unwrap(x);
      if (x.t === 'num') { (inDen ? numsBot : numsTop).push(x.v); return; }
      if (x.t === 'var') { varCount[x.n] = (varCount[x.n] || 0) + 1; return; }
      if (x.t === 'neg') { visit(x.a, inDen); return; }
      if (x.t === 'mul') { visit(x.a, inDen); visit(x.b, inDen); return; }
      if (x.t === 'div') { visit(x.a, inDen); visit(x.b, !inDen); return; }
      if (x.t === 'pow') {
        const e = MX.evalAST(x.b, {});
        if (e < 0) negExp = true;
        if (e === 0) zeroExp = true;
        const b = unwrap(x.a);
        if (b.t === 'var') varCount[b.n] = (varCount[b.n] || 0) + 1;
        else if (b.t === 'num') (inDen ? numsBot : numsTop).push(Math.pow(b.v, e));
        else powOfNonAtom = true;
      }
    })(n, false);
    if (negExp) issues.push('Use positive exponents only.');
    if (zeroExp) issues.push('Anything to the 0 power is 1, so simplify it away.');
    if (powOfNonAtom) issues.push('Simplify the power of a product: apply the exponent to each factor.');
    const rep = Object.keys(varCount).filter((v) => varCount[v] > 1);
    if (rep.length) issues.push('Combine the powers of ' + rep.join(', ') + ' so each variable appears once.');
    if (numsTop.length > 1 || numsBot.length > 1) issues.push('Multiply the numbers together.');
    else if (numsTop.length === 1 && numsBot.length === 1 && Number.isInteger(numsTop[0]) && Number.isInteger(numsBot[0]) && MX.gcd(numsTop[0], numsBot[0]) > 1) issues.push('Reduce the numerical fraction.');
    return issues;
  }
  function sqrtNodes(n) { const s = []; A.walk(n, (x) => { if (x.t === 'sqrt') s.push(x); }); return s; }
  function radicalIssue(n) {
    for (const s of sqrtNodes(n)) {
      const p = MX.toPoly(s.a);
      if (!p) continue;
      if (p.size !== 1) continue; // e.g. √(x+1): nothing to pull out
      const [[k, c]] = [...p];
      if (!Number.isInteger(c)) continue;
      if (!MX.isSquarefree(c)) return 'The radical can be simplified further: pull the perfect-square factor of ' + Math.abs(c) + ' out.';
      const o = P.parseKey(k);
      for (const v in o) if (o[v] >= 2) return 'The radical can be simplified further: pull the even powers of ' + v + ' out of the √.';
    }
    return null;
  }
  // (a ± b√r)/d with gcd(a, b, d) > 1 ?
  function intCoefsOfTerm(t) {
    t = unwrap(t);
    if (t.t === 'neg') return intCoefsOfTerm(t.a);
    if (t.t === 'num') return [t.v];
    if (t.t === 'sqrt') return [1];
    if (t.t === 'mul') {
      const a = unwrap(t.a), b = unwrap(t.b);
      if (a.t === 'num' && b.t === 'sqrt') return [a.v];
      if (b.t === 'num' && a.t === 'sqrt') return [b.v];
    }
    return null;
  }
  function unreducedRadicalFraction(n) {
    let bad = false;
    A.walk(n, (x) => {
      if (x.t !== 'div' || bad) return;
      const d = unwrap(x.b);
      if (d.t !== 'num' || !Number.isInteger(d.v)) return;
      const terms = [];
      (function split(y) {
        y = unwrap(y);
        if (y.t === 'add' || y.t === 'sub' || y.t === 'pm') { split(y.a); split(y.b); return; }
        terms.push(y);
      })(x.a);
      const cs = [];
      for (const t of terms) {
        if (t.t === 'num' && t.v === 0) continue;
        const c = intCoefsOfTerm(t);
        if (!c) return;
        cs.push(...c);
      }
      if (cs.length && cs.every(Number.isInteger) && MX.gcdAll([...cs, d.v]) > 1) bad = true;
    });
    return bad;
  }
  function varDenDivs(n) {
    let c = 0;
    A.walk(n, (x) => { if (x.t === 'div' && A.vars(x.b).size) c++; });
    return c;
  }
  function isSingleFraction(n) {
    let u = unwrap(n);
    while (u.t === 'neg') u = unwrap(u.a);
    if (varDenDivs(n) === 0) return true;
    if (varDenDivs(n) > 1) {
      // allow c * (P/Q) style with only one fraction
      return false;
    }
    // exactly one fraction: it must not be added to anything
    let ok = true;
    A.walk(n, (x) => {
      if ((x.t === 'add' || x.t === 'sub') && (hasVarDiv(x.a) || hasVarDiv(x.b))) ok = false;
    });
    return ok;
  }
  function hasVarDiv(n) { let f = false; A.walk(n, (x) => { if (x.t === 'div' && A.vars(x.b).size) f = true; }); return f; }

  // ---------- form checks for expressions ----------
  function formIssue(form, user, expected, raw) {
    switch (form) {
      case 'expanded': {
        const terms = sumTerms(user);
        if (!terms.every(isMonomial)) return 'Multiply everything out so there are no parentheses left.';
        const p = MX.toPoly(user);
        if (p && terms.length > p.size) return 'Combine like terms.';
        if (A.count(user, 'pow') && terms.some((t) => monomialIssues(t).length)) return monomialIssues(terms.find((t) => monomialIssues(t).length))[0];
        return null;
      }
      case 'terms': {
        const terms = sumTerms(user);
        if (!terms.every(isMonomial)) return 'Split it into separate simplified terms (divide each term by the monomial).';
        for (const t of terms) { const iss = monomialIssues(t); if (iss.length) return iss[0]; }
        const p = MX.toPoly(user);
        if (p && terms.length > p.size) return 'Combine like terms.';
        return null;
      }
      case 'posexp': {
        if (!isMonomial(user)) return 'Simplify to a single term.';
        const iss = monomialIssues(user);
        return iss.length ? iss[0] : null;
      }
      case 'radical': {
        const r = radicalIssue(user);
        if (r) return r;
        const ns = sqrtNodes(user).length, ne = sqrtNodes(expected).length;
        if (ns > ne) return ne === 0 ? 'This simplifies to an expression with no radical.' : 'Combine the radicals into a single simplified term.';
        if (unreducedRadicalFraction(user)) return 'Reduce the fraction: divide every term by the common factor.';
        return null;
      }
      case 'noradical': {
        if (sqrtNodes(user).length) return 'Write it with a fractional exponent instead of a radical.';
        let unreduced = false;
        A.walk(user, (x) => {
          if (x.t !== 'pow') return;
          const e = unwrap(x.b);
          if (e.t === 'div' && unwrap(e.a).t === 'num' && unwrap(e.b).t === 'num' && MX.gcd(unwrap(e.a).v, unwrap(e.b).v) > 1) unreduced = true;
        });
        return unreduced ? 'Reduce the fraction in the exponent.' : null;
      }
      case 'logexpand': {
        let issue = null;
        A.walk(user, (x) => {
          if (issue || x.t !== 'log') return;
          const a = unwrap(x.a);
          if (a.t === 'mul' || a.t === 'div' || a.t === 'pow' || a.t === 'sqrt' || a.t === 'neg') { issue = 'Keep expanding: a log of a product, quotient, power or root can be split up.'; return; }
          if (a.t === 'num' || a.t === 'e') {
            const b = x.k === 'ln' ? Math.E : x.k === 'c' || !x.b ? 10 : MX.evalAST(x.b, {});
            const k = Math.log(MX.evalAST(a, {})) / Math.log(b);
            if (isFinite(k) && Math.abs(k - Math.round(k)) < 1e-9) issue = 'Evaluate the numerical log (it comes out to a whole number).';
          }
        });
        return issue;
      }
      case 'logcondense': {
        const n = A.count(user, 'log');
        if (n > 1) return 'Combine everything into a single logarithm.';
        let u = unwrap(user);
        if (u.t !== 'log') return 'Move every coefficient inside the log as an exponent, so the answer is one log.';
        return null;
      }
      case 'cob': {
        const logs = [];
        A.walk(user, (x) => { if (x.t === 'log') logs.push(x); });
        const u = unwrap(user);
        const baseKey = (x) => (x.k === 'ln' ? 'e' : x.k === 'c' || !x.b ? '10' : String(MX.evalAST(x.b, {})));
        if (logs.length !== 2 || u.t !== 'div' || baseKey(logs[0]) !== baseKey(logs[1])) return 'Write it as a quotient of two logs with the same base, like ln(20)/ln(3).';
        return null;
      }
      case 'exactlog':
        if (raw != null && usedDecimal(raw)) return 'Give the exact answer using logs, not a rounded decimal.';
        if (!A.count(user, 'log')) return 'Leave the exact answer in terms of logs, like ln(12)/ln(5).';
        return null;
      case 'vertex': {
        const terms = sumTerms(user);
        let squares = 0;
        for (const t of terms) {
          if (!A.vars(t).size) continue;
          let u = unwrap(t);
          if (u.t === 'neg') u = unwrap(u.a);
          if (u.t === 'mul' || u.t === 'div') {
            const a = unwrap(u.a), b = unwrap(u.b);
            if (!A.vars(a).size) u = b; else if (!A.vars(b).size && u.t === 'mul') u = a; else return 'Write it in vertex form, a(x − h)² + k.';
            u = unwrap(u);
          }
          const lin = u.t === 'pow' && MX.evalAST(u.b, {}) === 2 && MX.toPoly(u.a);
          if (lin && P.degree(lin) === 1) squares++;
          else return 'Write it in vertex form, a(x − h)² + k.';
        }
        return squares === 1 ? null : 'Write it in vertex form, a(x − h)² + k.';
      }
      case 'rational': {
        if (!isSingleFraction(user)) return 'Combine everything into a single fraction.';
        const ru = MX.toRat(user), re = MX.toRat(expected);
        if (ru && re) {
          const du = P.degree(ru.n) + P.degree(ru.d), de = P.degree(re.n) + P.degree(re.d);
          if (du > de) return 'Simplify: cancel the common factor from the top and bottom.';
          const cn = P.content(ru.n), cd = P.content(ru.d);
          if (cn && cd && MX.gcd(cn, cd) > 1) return 'Reduce the numbers: the top and bottom share a common factor.';
        }
        return null;
      }
    }
    return null;
  }

  // numeric value of an input box (no variables); handles "x = 5", "$8.33", "80%"
  function readNumber(str, want) {
    const st = stripLhs(cleanNum(str), want);
    const ast = st.ast || MX.parse(cleanNum(st.s));
    if (A.vars(ast).size) throw new MX.ParseError('The answer should be a number (no variables).');
    const vals = A.expandPM(ast).map((b) => MX.evalAST(b, {}));
    if (vals.some((v) => !isFinite(v))) throw new MX.ParseError('That value isn’t defined (dividing by zero, or a √ of a negative).');
    return { ast, vals, raw: String(str) };
  }
  const usedDecimal = (s) => /\d*\.\d/.test(String(s));

  const CHECK = {};

  // single number: {answer, tol, frac, nosol, units}
  CHECK.num = function (part, input) {
    return safe(() => {
      const str = input.value;
      const expNoSol = part.answer === 'nosol', expAll = part.answer === 'allreal';
      if (MX.isNoSolution(str)) return expNoSol ? { ok: true } : { ok: false, msg: expAll ? '' : 'There is a solution here.' };
      if (MX.isAllReal(str)) return expAll ? { ok: true } : { ok: false, msg: expNoSol ? '' : 'Only one number works here.' };
      if (expAll && !String(str).trim()) throw new MX.ParseError('Type an answer first.');
      if (expAll) { readNumber(str, part.var); return { ok: false, msg: 'Check it: does more than one value work?' }; }
      if (expNoSol && !String(str).trim()) throw new MX.ParseError('Type an answer first.');
      const r = readNumber(str, part.var);
      if (r.vals.length !== 1) return { error: 'Just one value here.' };
      if (expNoSol) return { ok: false, msg: 'Check your solution in the original equation: it doesn’t work, so there is no solution.' };
      const v = r.vals[0], e = part.value != null ? part.value : MX.evalAST(MX.parse(part.answer), {});
      const good = close(v, e, part.tol);
      if (!good) {
        if (usedDecimal(str) && close(v, e, Math.max(0.011, Math.abs(e) * 0.002)) && part.tol == null) return { nudge: 'Close, but give the exact value (use a fraction, not a rounded decimal).' };
        if (part.tol != null && close(v, e, part.tol * 3 + 0.01)) return { ok: false, msg: 'Close, but check your rounding.' };
        return { ok: false };
      }
      if (part.nolog && A.count(r.ast, 'log')) return { nudge: 'Right value. Now evaluate it: the answer should be a number, not a log.' };
      if (part.frac) {
        const u = unwrap(r.ast);
        if (usedDecimal(str) && !Number.isInteger(e)) return { nudge: 'Right value. Write it as a simplified fraction instead of a decimal.' };
        let uu = u; if (uu.t === 'neg') uu = unwrap(uu.a);
        if (uu.t === 'div') {
          const a = unwrap(uu.a), b = unwrap(uu.b);
          const aa = a.t === 'neg' ? unwrap(a.a) : a;
          if (aa.t === 'num' && b.t === 'num' && MX.gcd(aa.v, b.v) > 1) return { nudge: 'Right value. Now reduce the fraction.' };
        }
      }
      if (part.units) {
        const uv = input.unit || '';
        if (!uv) return { nudge: 'Right number. Now pick the units.' };
        if (uv !== part.units.answer) return { ok: false, msg: 'The number is right, but the units aren’t.' };
      }
      return { ok: true };
    });
  };

  // several numbers in any order: {answers:[...], tol, exact, radical}
  CHECK.nums = function (part, input) {
    return safe(() => {
      const boxes = input.values.map((s) => String(s || '').trim());
      if (boxes.every((s) => !s)) throw new MX.ParseError('Type your answers first.');
      const got = [];
      const asts = [];
      for (const s of boxes) {
        if (!s) continue;
        const r = readNumber(s, part.var);
        asts.push(r.ast);
        got.push(...r.vals);
      }
      const exp = part.answers.map((a) => MX.evalAST(MX.parse(a), {}));
      const tol = part.tol;
      // dedupe equal values the student repeated (e.g. ±0)
      const pool = exp.slice();
      const unmatched = [];
      for (const v of got) {
        const k = pool.findIndex((e) => close(v, e, tol));
        if (k >= 0) pool.splice(k, 1);
        else unmatched.push(v);
      }
      if (unmatched.length || pool.length) {
        if (!unmatched.length && pool.length) return { ok: false, msg: pool.length === 1 && exp.length > 1 ? 'One solution is missing.' : 'Some solutions are missing.' };
        if (tol == null && unmatched.every((v) => exp.some((e) => close(v, e, Math.max(0.011, Math.abs(e) * 0.002)))) && boxes.some(usedDecimal)) return { nudge: 'Close, but give exact values, not rounded decimals.' };
        if (tol != null && unmatched.every((v) => exp.some((e) => close(v, e, tol * 3 + 0.01)))) return { ok: false, msg: 'Close, but check your rounding.' };
        return { ok: false };
      }
      if (part.exact && boxes.some(usedDecimal) && exp.some((e) => !Number.isInteger(e * 1000))) return { nudge: 'Right values, but leave them exact (simplified radical form).' };
      if (part.frac && boxes.some(usedDecimal) && exp.some((e) => !Number.isInteger(e))) return { nudge: 'Right values. Write them as fractions instead of decimals.' };
      if (part.radical) for (const a of asts) { const r = radicalIssue(a); if (r) return { nudge: r }; }
      return { ok: true };
    });
  };

  // expression equivalent to answer, with an optional required form
  CHECK.expr = function (part, input) {
    return safe(() => {
      const str = input.value;
      const expected = MX.parse(part.answer);
      const allowed = part.vars || [...A.vars(expected)];
      let ast;
      if (part.lhs) { const st = stripLhs(str, part.lhs); ast = st.ast || MX.parse(st.s); }
      else ast = MX.parse(str);
      ast = fixCase(ast, allowed);
      const stray = strayVars(ast, allowed);
      if (stray.length) return { ok: false, msg: 'Your answer uses ' + stray.join(', ') + ', but this problem is in terms of ' + allowed.join(', ') + '.' };
      if (A.count(ast, 'pm')) return { error: 'Just one expression here (no ±).' };
      const vl = allowed;
      if (!MX.equivalent(ast, expected, vl)) {
        // maybe they meant 1/2x as 1/(2x)
        try {
          const tight = fixCase(part.lhs ? MX.parse(String(str).split('=').pop()) : MX.parse(str, { tight: true }), allowed);
          if (MX.equivalent(tight, expected, vl)) return { nudge: 'Add parentheses so it reads the way you mean: for example 1/(2x) instead of 1/2x.' };
        } catch (e) { /* ignore */ }
        if (part.form === 'exactlog' && !A.vars(ast).size) {
          const v = MX.evalAST(ast, {}), e = MX.evalAST(expected, {});
          if (Math.abs(v - e) < 0.01 * Math.max(1, Math.abs(e))) return { nudge: 'Close, but give the exact answer using logs, like ln(12)/ln(5).' };
        }
        return { ok: false };
      }
      const issue = part.form ? formIssue(part.form, ast, expected, str) : null;
      if (issue) return { nudge: 'That’s equivalent, but not finished. ' + issue };
      return { ok: true };
    });
  };

  // factor completely: {answer, factors:[...]} (factors as strings, constants allowed)
  function flattenProduct(n, out, mult = 1) {
    n = unwrap(n);
    if (n.t === 'mul') { flattenProduct(n.a, out, mult); flattenProduct(n.b, out, mult); return out; }
    if (n.t === 'neg') { out.push({ ast: { t: 'num', v: -1 }, m: 1 }); flattenProduct(n.a, out, mult); return out; }
    if (n.t === 'pow') {
      const e = MX.evalAST(n.b, {});
      if (Number.isInteger(e) && e > 0) { flattenProduct(n.a, out, mult * e); return out; }
    }
    out.push({ ast: n, m: mult });
    return out;
  }
  const PRIME = /^\s*(prime|not\s*factorable|does\s*n[o']?t\s*factor|cannot\s*be\s*factored|can'?t\s*be\s*factored|irreducible)\s*\.?\s*$/i;
  MX.isPrimeWord = (s) => PRIME.test(String(s || ''));
  CHECK.factor = function (part, input) {
    return safe(() => {
      if (part.answer === 'prime') {
        if (PRIME.test(input.value)) return { ok: true };
        if (!String(input.value || '').trim()) throw new MX.ParseError('Type your answer first (or “prime”).');
        try {
          const orig = MX.parse(part.poly);
          const ast = MX.parse(input.value);
          if (MX.equivalent(ast, orig)) return { ok: false, msg: 'That is just the original polynomial. It has no factors, so it is prime.' };
        } catch (e) { /* fall through */ }
        return { ok: false, msg: 'That doesn’t multiply back to the original polynomial.' };
      }
      if (PRIME.test(input.value)) return { ok: false, msg: 'This one does factor.' };
      const expected = MX.parse(part.answer);
      const allowed = [...A.vars(expected)];
      let ast = fixCase(MX.parse(input.value), allowed);
      const stray = strayVars(ast, allowed);
      if (stray.length) return { ok: false, msg: 'Your answer uses ' + stray.join(', ') + ', but the problem is in terms of ' + allowed.join(', ') + '.' };
      if (!MX.equivalent(ast, expected, allowed)) return { ok: false, msg: 'That doesn’t multiply back to the original. Multiply it out to check.' };
      const uf = flattenProduct(ast, []).filter((f) => A.vars(f.ast).size);
      const ef = [];
      for (const s of part.factors) {
        const a = MX.parse(s);
        if (A.vars(a).size) ef.push(MX.toPoly(a));
      }
      const pool = ef.slice();
      for (const f of uf) {
        const p = MX.toPoly(f.ast);
        if (!p) return { nudge: 'Write it as a product of polynomial factors.' };
        for (let r = 0; r < f.m; r++) {
          let hit = -1, scaled = false;
          pool.forEach((q, k) => {
            if (hit >= 0) return;
            const rat = P.ratio(p, q);
            if (rat === null) return;
            if (Math.abs(Math.abs(rat) - 1) < 1e-9) hit = k;
            else scaled = true;
          });
          if (hit < 0) {
            if (scaled) return { nudge: 'Almost. One factor still has a common factor you can pull out.' };
            return { nudge: 'That’s equivalent, but it isn’t factored completely yet.' };
          }
          pool.splice(hit, 1);
        }
      }
      if (pool.length) return { nudge: 'That’s equivalent, but it isn’t factored completely yet.' };
      return { ok: true };
    });
  };

  // linear equation (lhs - rhs as polynomial)
  function eqPoly(str, allowed) {
    const r = MX.parseRel(str);
    if (r.op !== '=') throw new MX.ParseError('This needs an “=” sign.');
    const L = fixCase(r.lhs, allowed), R = fixCase(r.rhs, allowed);
    const f = MX.toPoly({ t: 'sub', a: L, b: R });
    return { r: { lhs: L, rhs: R }, f };
  }
  function sameLinear(f, g) {
    if (!f || !g) return false;
    if (P.degree(f) > 1 || P.hasNegExp(f)) return false;
    const rat = P.ratio(f, g);
    return rat !== null && Math.abs(rat) > 1e-12;
  }
  // {answer:'y=3x+13', form:'slope'|'linear', dep:'y', ind:'x'}
  CHECK.eq = function (part, input) {
    return safe(() => {
      const exp = MX.parseRel(part.answer);
      const allowed = [...new Set([...A.vars(exp.lhs), ...A.vars(exp.rhs), ...(part.vars || [])])];
      const { r, f } = eqPoly(input.value, allowed);
      const stray = strayVars({ t: 'sub', a: r.lhs, b: r.rhs }, allowed);
      if (stray.length) return { ok: false, msg: 'Use the variables ' + allowed.join(' and ') + ' (you used ' + stray.join(', ') + ').' };
      const g = MX.toPoly({ t: 'sub', a: exp.lhs, b: exp.rhs });
      if (!f) return { ok: false };
      if (!sameLinear(f, g)) return { ok: false };
      if (part.form === 'slope') {
        const dep = part.dep || 'y';
        const L = unwrap(r.lhs);
        if (!(L.t === 'var' && L.n === dep)) return { nudge: 'Equivalent, but write it in slope-intercept form: ' + dep + ' = mx + b.' };
        const terms = sumTerms(r.rhs);
        if (!terms.every(isMonomial) || varDenDivs(r.rhs)) return { nudge: 'Equivalent, but simplify the right side to the form mx + b.' };
        const p = MX.toPoly(r.rhs);
        if (p && terms.length > p.size) return { nudge: 'Equivalent, but combine like terms so it reads mx + b.' };
      }
      return { ok: true };
    });
  };

  // two linear equations in any order: {answers:[eq1, eq2]}
  CHECK.system = function (part, input) {
    return safe(() => {
      // each expected equation may list acceptable alternatives
      const exps = part.answers.map((a) => (Array.isArray(a) ? a : [a]).map((s) => { const e = MX.parseRel(s); return MX.toPoly({ t: 'sub', a: e.lhs, b: e.rhs }); }));
      const sameAny = (f, alts) => alts.some((g) => sameLinear(f, g));
      const allowed = part.vars;
      const got = input.values.map((s, k) => {
        if (!String(s || '').trim()) throw new MX.ParseError('Fill in equation ' + (k + 1) + '.');
        const { r, f } = eqPoly(s, allowed);
        const stray = strayVars({ t: 'sub', a: r.lhs, b: r.rhs }, allowed);
        if (stray.length) throw new MX.ParseError('Use the variables ' + allowed.join(' and ') + ' (equation ' + (k + 1) + ' uses ' + stray.join(', ') + ').');
        return f;
      });
      const m00 = sameAny(got[0], exps[0]) && sameAny(got[1], exps[1]);
      const m01 = sameAny(got[0], exps[1]) && sameAny(got[1], exps[0]);
      if (m00 || m01) return { ok: true };
      const one = exps.some((e) => sameAny(got[0], e)) || exps.some((e) => sameAny(got[1], e));
      return { ok: false, msg: one ? 'One of the two equations is right; the other isn’t.' : '' };
    });
  };

  // inequality with a single variable: {answer:'x>=-3', var:'x'}
  const FLIP = { '<': '>', '>': '<', '<=': '>=', '>=': '<=' };
  function readIneq(str, v) {
    const r = MX.parseRel(str);
    if (r.op === '=') throw new MX.ParseError('Use an inequality sign: <, >, ≤ (<=) or ≥ (>=).');
    let L = unwrap(r.lhs), R = unwrap(r.rhs), op = r.op;
    const isV = (n) => n.t === 'var' && n.n.toLowerCase() === v.toLowerCase();
    if (isV(R) && !isV(L)) { [L, R] = [R, L]; op = FLIP[op]; }
    if (!isV(L)) throw new MX.ParseError('Get ' + v + ' by itself on one side, like ' + v + ' ≥ 3.');
    if (A.vars(R).size) throw new MX.ParseError('The other side should be a number.');
    return { op, val: MX.evalAST(R, {}) };
  }
  CHECK.ineq = function (part, input) {
    return safe(() => {
      const exp = readIneq(part.answer, part.var || 'x');
      const got = readIneq(input.value, part.var || 'x');
      if (!close(got.val, exp.val, part.tol)) return { ok: false, msg: close(got.val, -exp.val) ? 'Check the sign of the boundary number.' : '' };
      if (got.op !== exp.op) {
        const incl = (o) => o.includes('=');
        const dir = (o) => o[0];
        if (dir(got.op) !== dir(exp.op)) return { ok: false, msg: 'The inequality points the wrong way. (Did you divide by a negative? That flips the sign.)' };
        return { ok: false, msg: incl(exp.op) ? 'The boundary value is included here, so use ≤ or ≥.' : 'The boundary value is not included, so use < or >.' };
      }
      return { ok: true };
    });
  };

  // ordered pair
  function readPoint(str) {
    const [a, b] = MX.parsePoint(str);
    if (A.vars(a).size || A.vars(b).size) throw new MX.ParseError('Coordinates should be numbers.');
    return { x: MX.evalAST(a, {}), y: MX.evalAST(b, {}), raw: str };
  }
  CHECK.point = function (part, input) {
    return safe(() => {
      const e = readPoint(part.answer), g = readPoint(input.value);
      if (close(g.x, e.x, part.tol) && close(g.y, e.y, part.tol)) return { ok: true };
      if (close(g.x, e.y, part.tol) && close(g.y, e.x, part.tol) && !close(e.x, e.y)) return { ok: false, msg: 'The coordinates are swapped: it’s (x, y).' };
      if (usedDecimal(input.value) && close(g.x, e.x, 0.011) && close(g.y, e.y, 0.011)) return { nudge: 'Close, but use exact values (fractions), not rounded decimals.' };
      return { ok: false };
    });
  };
  // two points in either order
  CHECK.points = function (part, input) {
    return safe(() => {
      const e = part.answers.map(readPoint);
      const g = input.values.map((s, k) => {
        if (!String(s || '').trim()) throw new MX.ParseError('Fill in both points.');
        return readPoint(s);
      });
      const same = (p, q) => close(p.x, q.x, part.tol) && close(p.y, q.y, part.tol);
      if ((same(g[0], e[0]) && same(g[1], e[1])) || (same(g[0], e[1]) && same(g[1], e[0]))) return { ok: true };
      const any = g.some((p) => e.some((q) => same(p, q)));
      return { ok: false, msg: any ? 'One of the two points is right.' : '' };
    });
  };

  CHECK.choice = function (part, input) {
    if (input.choice == null || input.choice === '') return { error: 'Pick one of the options first.' };
    return +input.choice === part.answer ? { ok: true } : { ok: false };
  };

  // scientific notation: {value}
  function readSci(str) {
    let s = MX.normalizeInput(cleanNum(str)).replace(/\s*[xX×*·]\s*10\s*\^\s*/g, '*10^').replace(/(\d)\s*[eE]\s*([+-]?\d+)/, '$1*10^$2');
    const ast = MX.parse(s);
    if (A.vars(ast).size) throw new MX.ParseError('Write it as a number times a power of 10, like 3.2 × 10^5 (type 3.2 x 10^5).');
    const v = MX.evalAST(ast, {});
    // structure: [neg] a * 10^n
    let u = unwrap(ast), neg = false;
    if (u.t === 'neg') { neg = true; u = unwrap(u.a); }
    let coef = null, exp = null;
    if (u.t === 'mul') {
      const a = unwrap(u.a), b = unwrap(u.b);
      if (a.t === 'num' && b.t === 'pow' && unwrap(b.a).t === 'num' && unwrap(b.a).v === 10) { coef = a.v; exp = MX.evalAST(b.b, {}); }
    } else if (u.t === 'pow' && unwrap(u.a).t === 'num' && unwrap(u.a).v === 10) { coef = 1; exp = MX.evalAST(u.b, {}); }
    return { v, coef: coef === null ? null : neg ? -coef : coef, exp };
  }
  CHECK.sci = function (part, input) {
    return safe(() => {
      const g = readSci(input.value);
      const e = part.value;
      const rel = Math.abs(g.v - e) / Math.abs(e);
      if (rel > 1e-9) {
        if (rel < 0.01) return { ok: false, msg: 'Very close. Keep all the digits instead of rounding.' };
        return { ok: false };
      }
      if (g.coef === null) return { nudge: 'Right value. Now write it in scientific notation: a × 10^n (type it like 3.2 x 10^5).' };
      if (!(Math.abs(g.coef) >= 1 && Math.abs(g.coef) < 10)) return { nudge: 'Right value, but the first number must be at least 1 and less than 10. Move the decimal point and adjust the exponent.' };
      return { ok: true };
    });
  };

  // one expression containing ± (two values): {answers:[..two..], form radical}
  CHECK.radpm = function (part, input) {
    return safe(() => {
      const ast = MX.parse(input.value);
      if (A.vars(ast).size) return { error: 'This should be a number with a radical, no variables.' };
      const branches = A.expandPM(ast).map((b) => MX.evalAST(b, {}));
      const exp = part.answers.map((a) => MX.evalAST(MX.parse(a), {}));
      if (branches.length !== 2) return { nudge: 'Keep the ± sign: the answer stands for two numbers.' };
      const ok = (close(branches[0], exp[0]) && close(branches[1], exp[1])) || (close(branches[0], exp[1]) && close(branches[1], exp[0]));
      if (!ok) return { ok: false };
      const r = radicalIssue(ast);
      if (r) return { nudge: r };
      if (unreducedRadicalFraction(ast)) return { nudge: 'Right value, but reduce: every term and the denominator share a common factor.' };
      return { ok: true };
    });
  };

  // ---------- exponential <-> logarithmic form ----------
  // part: {shape:'exp'|'log', base, exp, val} meaning base^exp = val  <=>  log_base(val) = exp
  CHECK.eqform = function (part, input) {
    return safe(() => {
      const r = MX.parseRel(input.value);
      if (r.op !== '=') throw new MX.ParseError('This needs an “=” sign.');
      const L = unwrap(r.lhs), R = unwrap(r.rhs);
      let form = null, Pn, Qn;
      if (L.t === 'pow') { form = 'exp'; Pn = L; Qn = R; }
      else if (R.t === 'pow') { form = 'exp'; Pn = R; Qn = L; }
      else if (L.t === 'log') { form = 'log'; Pn = L; Qn = R; }
      else if (R.t === 'log') { form = 'log'; Pn = R; Qn = L; }
      const eb = MX.parse(part.base), ee = MX.parse(part.exp), evv = MX.parse(part.val);
      const vl = [...new Set([...A.vars(eb), ...A.vars(ee), ...A.vars(evv)])];
      const eqv = (x, y) => MX.equivalent(x, y, vl);
      let comps = false;
      if (form === 'exp') comps = eqv(Pn.a, eb) && eqv(Pn.b, ee) && eqv(Qn, evv);
      else if (form === 'log') {
        const base = Pn.k === 'ln' ? { t: 'e' } : Pn.k === 'c' || !Pn.b ? { t: 'num', v: 10 } : Pn.b;
        comps = eqv(base, eb) && eqv(Pn.a, evv) && eqv(Qn, ee);
      }
      if (!form) return { ok: false, msg: part.shape === 'exp' ? 'The answer should look like base^exponent = value.' : 'The answer should look like log_base(value) = exponent.' };
      if (!comps) return { ok: false };
      if (form !== part.shape) return { nudge: part.shape === 'exp' ? 'That’s the same statement. Now write it in exponential form: base^exponent = value.' : 'That’s the same statement. Now write it in logarithmic form: log_base(value) = exponent.' };
      return { ok: true };
    });
  };

  // ---------- sets {a, b, c} ----------
  function splitTop(s, sep) {
    const out = [];
    let depth = 0, cur = '';
    for (const ch of s) {
      if ('([{'.includes(ch)) depth++;
      if (')]}'.includes(ch)) depth--;
      if (ch === sep && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
    }
    out.push(cur);
    return out.map((x) => x.trim());
  }
  function readSet(str) {
    const s = String(str || '').trim().replace(/^\{\s*/, '').replace(/\s*\}$/, '').replace(/\s+(or|and)\s+/gi, ', ');
    if (!s) throw new MX.ParseError('Type the values, like {-2, 0, 3}.');
    const out = [];
    splitTop(s, ',').forEach((p) => {
      if (!p) throw new MX.ParseError('There’s an empty spot between commas.');
      const a = MX.parse(p.replace(/^\s*[a-zA-Z]\s*=\s*/, ''));
      if (A.vars(a).size) throw new MX.ParseError('List numbers only, like {-2, 0, 3}.');
      A.expandPM(a).forEach((b) => {
        const v = MX.evalAST(b, {});
        if (!isFinite(v)) throw new MX.ParseError('One of the values isn’t a real number.');
        out.push(v);
      });
    });
    return out;
  }
  CHECK.set = function (part, input) {
    return safe(() => {
      if (MX.isNoSolution(input.value)) return part.answers.length ? { ok: false, msg: 'There is at least one solution.' } : { ok: true };
      if (!part.answers.length) { readSet(input.value); return { ok: false }; }
      const got = readSet(input.value);
      const exp = part.answers.map((a) => MX.evalAST(MX.parse(a), {}));
      const uniq = [];
      got.forEach((v) => { if (!uniq.some((u) => close(u, v))) uniq.push(v); });
      const missing = exp.filter((e) => !uniq.some((v) => close(v, e)));
      const extra = uniq.filter((v) => !exp.some((e) => close(v, e)));
      if (missing.length || extra.length) {
        if (!extra.length) return { ok: false, msg: missing.length === 1 ? 'One value is missing.' : 'Some values are missing.' };
        if (!missing.length) return { ok: false, msg: 'There’s at least one value that doesn’t belong.' };
        return { ok: false };
      }
      if (uniq.length < got.length) return { nudge: 'Right values. In a set, list each value only once.' };
      return { ok: true };
    });
  };

  // ---------- intervals / domain and range ----------
  const INF = Infinity;
  function endpoint(t) {
    const s = t.replace(/\s+/g, '');
    if (/^\+?(∞|inf(inity)?)$/i.test(s)) return INF;
    if (/^-(∞|inf(inity)?)$/i.test(s)) return -INF;
    if (!s) throw new MX.ParseError('An endpoint is missing.');
    const a = MX.parse(s);
    if (A.vars(a).size) throw new MX.ParseError('Endpoints should be numbers or ∞.');
    const v = MX.evalAST(a, {});
    if (!isFinite(v)) throw new MX.ParseError('An endpoint isn’t a number.');
    return v;
  }
  function mergeRegion(iv) {
    iv.sort((a, b) => a.lo - b.lo || (b.lc ? 1 : 0) - (a.lc ? 1 : 0));
    const out = [];
    for (const x of iv) {
      const last = out[out.length - 1];
      if (last && (x.lo < last.hi || (x.lo === last.hi && (x.lc || last.hc)))) {
        if (x.hi > last.hi || (x.hi === last.hi && x.hc)) { last.hi = x.hi; last.hc = x.hc; }
      } else out.push(Object.assign({}, x));
    }
    return out;
  }
  function readRegion(str) {
    if (MX.isNoSolution(str)) return [];
    let s = String(str || '').trim()
      .replace(/[−–—]/g, '-').replace(/≤|=</g, '<=').replace(/≥|=>/g, '>=').replace(/≠|!=|<>/g, '!=')
      .replace(/infinity|inf/gi, '∞');
    if (!s) throw new MX.ParseError('Type an answer first.');
    if (/^(all\s*real(s|\s*numbers?)?|real\s*numbers|ℝ|r)\.?$/i.test(s)) return [{ lo: -INF, hi: INF, lc: false, hc: false }];
    if (/[<>=!]/.test(s)) {
      const out = [];
      for (const piece of s.split(/\s+or\s+|∪/i)) {
        const toks = piece.split(/(<=|>=|!=|<|>)/).map((x) => x.trim()).filter((x) => x !== '');
        const isVar = (x) => /^[a-zA-Z]$/.test(x);
        if (toks.length === 3) {
          let [a, op, b] = toks;
          if (isVar(b) && !isVar(a)) { [a, b] = [b, a]; op = { '<': '>', '>': '<', '<=': '>=', '>=': '<=', '!=': '!=' }[op]; }
          if (!isVar(a)) throw new MX.ParseError('Write it like x ≥ -3 or -3 ≤ x < 5.');
          const v = endpoint(b);
          if (op === '<') out.push({ lo: -INF, hi: v, lc: false, hc: false });
          else if (op === '<=') out.push({ lo: -INF, hi: v, lc: false, hc: true });
          else if (op === '>') out.push({ lo: v, hi: INF, lc: false, hc: false });
          else if (op === '>=') out.push({ lo: v, hi: INF, lc: true, hc: false });
          else { out.push({ lo: -INF, hi: v, lc: false, hc: false }); out.push({ lo: v, hi: INF, lc: false, hc: false }); }
        } else if (toks.length === 5 && isVar(toks[2]) && /^<=?$/.test(toks[1]) && /^<=?$/.test(toks[3])) {
          const lo = endpoint(toks[0]), hi = endpoint(toks[4]);
          if (!(lo < hi)) throw new MX.ParseError('The smaller number goes on the left.');
          out.push({ lo, hi, lc: toks[1] === '<=', hc: toks[3] === '<=' });
        } else throw new MX.ParseError('Write it like x ≥ -3, -3 ≤ x < 5, or in interval notation like [-3, 5).');
      }
      return mergeRegion(out);
    }
    const pieces = s.replace(/([)\]])\s*(∪|u|U)\s*([([])/g, '$1∪$3').split('∪').map((x) => x.trim());
    const out = [];
    for (const piece of pieces) {
      const m = piece.match(/^([([])(.*)([)\]])$/);
      if (!m) throw new MX.ParseError('Use interval notation like [-3, 5) or (-∞, 2) ∪ (2, ∞).');
      const parts = splitTop(m[2], ',');
      if (parts.length !== 2) throw new MX.ParseError('Each interval needs exactly two endpoints separated by a comma.');
      const lo = endpoint(parts[0]), hi = endpoint(parts[1]);
      if ((lo === -INF && m[1] === '[') || (hi === INF && m[3] === ']')) throw new MX.ParseError('Infinity always takes a parenthesis, never a bracket.');
      if (!(lo < hi)) throw new MX.ParseError('Write the smaller endpoint first.');
      out.push({ lo, hi, lc: m[1] === '[', hc: m[3] === ']' });
    }
    return mergeRegion(out);
  }
  MX.readRegion = readRegion;
  CHECK.interval = function (part, input) {
    return safe(() => {
      const got = readRegion(input.value), exp = readRegion(part.answer);
      const sameEnds = got.length === exp.length && got.every((g, k) => close(g.lo, exp[k].lo) && close(g.hi, exp[k].hi));
      if (sameEnds && got.every((g, k) => (g.lo === -INF || g.lc === exp[k].lc) && (g.hi === INF || g.hc === exp[k].hc))) return { ok: true };
      if (sameEnds) return { ok: false, msg: 'Check the brackets: [ ] means the endpoint is included, ( ) means it isn’t.' };
      return { ok: false };
    });
  };

  MX.check = function (part, input) {
    const fn = CHECK[part.kind];
    if (!fn) return { error: 'Unknown answer type ' + part.kind };
    return fn(part, input);
  };
  // the correct answer as a filled-in input (for self-tests)
  MX.answerInput = function (part) {
    switch (part.kind) {
      case 'nums': return { values: part.answers.slice() };
      case 'system': return { values: part.answers.map((a) => (Array.isArray(a) ? a[0] : a)) };
      case 'points': return { values: part.answers.slice() };
      case 'choice': return { choice: part.answer };
      case 'sci': return { value: part.answer };
      case 'set': return { value: part.answers.length ? part.answer : 'no solution' };
      case 'interval': case 'eqform': return { value: part.answer };
      case 'num': return { value: part.answer === 'nosol' ? 'no solution' : part.answer === 'allreal' ? 'all real numbers' : part.answer, unit: part.units ? part.units.answer : undefined };
      default: return { value: part.answer };
    }
  };
  // plain-text interval / set answers -> TeX for display
  function regionTex(s) {
    return String(s)
      .replace(/infinity|inf/gi, '∞')
      .replace(/([)\]])\s*[uU]\s*([([])/g, '$1∪$2')
      .split(/(∞|∪|<=|>=|!=|≤|≥|≠|\{|\}|[a-zA-Z]+)/)
      .map((tok) => {
        if (tok === '∞') return '\\infty ';
        if (tok === '∪') return '\\cup ';
        if (tok === '<=' || tok === '≤') return '\\le ';
        if (tok === '>=' || tok === '≥') return '\\ge ';
        if (tok === '!=' || tok === '≠') return '\\ne ';
        if (tok === '{') return '\\{';
        if (tok === '}') return '\\}';
        if (/^[a-zA-Z]{2,}$/.test(tok)) return '\\text{' + tok + '}';
        return tok.replace(/</g, '\\lt ').replace(/>/g, '\\gt ');
      }).join('');
  }
  MX.regionTex = regionTex;
  // live preview TeX for an input string (null when unreadable)
  MX.previewTex = function (kind, str) {
    const s = String(str || '').trim();
    if (!s) return null;
    try {
      if (MX.isNoSolution(s)) return '\\text{no solution}';
      if (MX.isAllReal(s) && kind !== 'interval') return '\\text{all real numbers}';
      if (MX.isPrimeWord(s)) return '\\text{prime}';
      if (kind === 'set' || kind === 'interval') return regionTex(s);
      if (kind === 'point') {
        const [a, b] = MX.parsePoint(s);
        return '\\left(' + MX.astTex(a) + ', ' + MX.astTex(b) + '\\right)';
      }
      if (kind === 'sci') {
        const t = MX.normalizeInput(cleanNum(s)).replace(/\s*[xX×*·]\s*10\s*\^\s*/g, '*10^');
        const ast = MX.parse(t);
        return MX.astTex(ast).replace(/\\cdot 10\^/g, '\\times 10^');
      }
      const n = MX.normalizeInput(s);
      if (/[=<>]/.test(n)) {
        const r = MX.parseRel(n);
        const op = { '=': '=', '<': '\\lt', '>': '\\gt', '<=': '\\le', '>=': '\\ge' }[r.op];
        return MX.astTex(r.lhs) + ' ' + op + ' ' + MX.astTex(r.rhs);
      }
      return MX.astTex(MX.parse(kind === 'num' || kind === 'nums' ? cleanNum(n) : n));
    } catch (e) {
      return null;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);

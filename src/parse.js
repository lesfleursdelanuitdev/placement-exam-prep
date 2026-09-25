/* parse.js: parses what a student types (3x^2-4x, √(2t), (x+2)/(x-3), 4/3x+1, ±) into an AST,
   evaluates it, renders it back to TeX for the live preview, and converts it to polynomials. */
(function (G) {
  'use strict';
  const MX = G.MX;

  class ParseError extends Error {}
  MX.ParseError = ParseError;

  const NOSOL = /^\s*(no\s*(real\s*)?solutions?|none|no\s*answer|∅|ø|\{\s*\}|dne|empty\s*set)\s*\.?\s*$/i;
  MX.isNoSolution = (s) => NOSOL.test(String(s || ''));

  function normalize(s) {
    return String(s)
      .replace(/[−–—]/g, '-')
      .replace(/[×✕✖]/g, '*')
      .replace(/[·⋅•]/g, '*')
      .replace(/÷/g, '/')
      .replace(/≤|=</g, '<=')
      .replace(/≥/g, '>=')
      .replace(/\*\*/g, '^')
      .replace(/\+\/-|\+-/g, '±')
      .replace(/sqrt/gi, '√')
      .replace(/²/g, '^2').replace(/³/g, '^3').replace(/⁴/g, '^4')
      .replace(/[[{]/g, '(').replace(/[\]}]/g, ')')
      .trim();
  }
  MX.normalizeInput = normalize;

  function tokenize(s) {
    const toks = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/[0-9.]/.test(c)) {
        let j = i;
        while (j < s.length && /[0-9.]/.test(s[j])) j++;
        const txt = s.slice(i, j);
        if ((txt.match(/\./g) || []).length > 1 || txt === '.') throw new ParseError('“' + txt + '” isn’t a number.');
        toks.push({ t: 'num', v: parseFloat(txt), s: txt });
        i = j;
        continue;
      }
      if (/[a-zA-Z]/.test(c)) { toks.push({ t: 'id', v: c }); i++; continue; }
      if (c === '<' || c === '>') {
        if (s[i + 1] === '=') { toks.push({ t: 'rel', v: c + '=' }); i += 2; }
        else { toks.push({ t: 'rel', v: c }); i++; }
        continue;
      }
      if (c === '=') { toks.push({ t: 'rel', v: '=' }); i++; continue; }
      if ('+-*/^(),±√|'.includes(c)) { toks.push({ t: c }); i++; continue; }
      if (c === '$' || c === '%') { i++; continue; } // ignore units symbols
      throw new ParseError('I can’t read the character “' + c + '”.');
    }
    return toks;
  }

  const unwrap = (n) => { while (n && n.t === 'grp') n = n.a; return n; };
  MX.unwrap = unwrap;

  function parseTokens(toks, opts) {
    const tight = !!(opts && opts.tight);
    let p = 0;
    const peek = () => toks[p];
    const next = () => toks[p++];
    const isAtomStart = (t) => t && (t.t === 'num' || t.t === 'id' || t.t === '(' || t.t === '√');

    function expr() {
      let a = term();
      while (peek() && (peek().t === '+' || peek().t === '-' || peek().t === '±')) {
        const op = next().t;
        const b = term();
        a = { t: op === '+' ? 'add' : op === '-' ? 'sub' : 'pm', a, b };
      }
      return a;
    }
    function term() {
      let a = tight ? chain() : unary();
      for (;;) {
        const t = peek();
        if (t && (t.t === '*' || t.t === '/')) {
          next();
          const b = tight ? chain() : unary();
          a = { t: t.t === '*' ? 'mul' : 'div', a, b };
          continue;
        }
        if (!tight && isAtomStart(t)) { a = { t: 'mul', a, b: power(), imp: true }; continue; }
        break;
      }
      return a;
    }
    function chain() {
      let a = unary();
      while (isAtomStart(peek())) a = { t: 'mul', a, b: power(), imp: true };
      return a;
    }
    function unary() {
      const t = peek();
      if (t && t.t === '-') { next(); return { t: 'neg', a: unary() }; }
      if (t && t.t === '+') { next(); return unary(); }
      if (t && t.t === '±') { next(); return { t: 'pm', a: { t: 'num', v: 0 }, b: unary() }; }
      return power();
    }
    function power() {
      const base = atom();
      if (peek() && peek().t === '^') {
        next();
        return { t: 'pow', a: base, b: expUnary() };
      }
      return base;
    }
    function expUnary() {
      const t = peek();
      if (t && (t.t === '-' || t.t === '+')) {
        next();
        const e = expUnary();
        return t.t === '-' ? { t: 'neg', a: e } : e;
      }
      return power();
    }
    function radicand() {
      const t = peek();
      if (!t) throw new ParseError('Put something after the √.');
      if (t.t === '(') return unwrap(atom());
      if (t.t === '√') { next(); return { t: 'sqrt', a: radicand() }; }
      if (t.t !== 'num' && t.t !== 'id') throw new ParseError('Put what’s under the √ right after it, like √(2x).');
      let a = power();
      while (peek() && (peek().t === 'num' || peek().t === 'id')) a = { t: 'mul', a, b: power(), imp: true };
      return a;
    }
    function atom() {
      const t = next();
      if (!t) throw new ParseError('The answer ends too early.');
      if (t.t === 'num') return { t: 'num', v: t.v };
      if (t.t === 'id') return { t: 'var', n: t.v };
      if (t.t === '(') {
        if (peek() && peek().t === ')') throw new ParseError('Empty parentheses.');
        const e = expr();
        if (!peek() || peek().t !== ')') throw new ParseError('A “)” is missing.');
        next();
        return { t: 'grp', a: e };
      }
      if (t.t === '|') {
        const e = expr();
        if (!peek() || peek().t !== '|') throw new ParseError('A closing “|” is missing.');
        next();
        return { t: 'abs', a: e };
      }
      if (t.t === '√') return { t: 'sqrt', a: radicand() };
      if (t.t === ')') throw new ParseError('There’s an extra “)”.');
      if (t.t === 'rel') throw new ParseError('Unexpected “' + t.v + '”.');
      throw new ParseError('Unexpected “' + t.t + '”.');
    }
    const e = expr();
    if (p < toks.length) {
      const t = toks[p];
      if (t.t === ')') throw new ParseError('There’s an extra “)”.');
      if (t.t === ',') throw new ParseError('Unexpected comma.');
      throw new ParseError('Unexpected “' + (t.v != null ? t.v : t.t) + '”.');
    }
    return e;
  }

  // parse an expression (no relation signs)
  function parse(str, opts) {
    const s = normalize(str);
    if (!s) throw new ParseError('Type an answer first.');
    const toks = tokenize(s);
    if (!toks.length) throw new ParseError('Type an answer first.');
    if (toks.some((t) => t.t === 'rel')) throw new ParseError('Just the expression, please: no “=” or inequality sign here.');
    if (toks.some((t) => t.t === ',')) throw new ParseError('Just one value here (no commas).');
    return parseTokens(toks, opts);
  }
  // parse "lhs REL rhs" (exactly one relation)
  function parseRel(str, opts) {
    const s = normalize(str);
    if (!s) throw new ParseError('Type an answer first.');
    const toks = tokenize(s);
    const idx = toks.map((t, k) => (t.t === 'rel' ? k : -1)).filter((k) => k >= 0);
    if (idx.length === 0) throw new ParseError('Include the sign: =, <, >, ≤ or ≥.');
    if (idx.length > 1) throw new ParseError('Use just one =, < or > sign.');
    const k = idx[0];
    const L = toks.slice(0, k), R = toks.slice(k + 1);
    if (!L.length || !R.length) throw new ParseError('Something is missing on one side of “' + toks[k].v + '”.');
    return { lhs: parseTokens(L, opts), op: toks[k].v, rhs: parseTokens(R, opts) };
  }
  // parse "(a, b)" or "a, b"
  function parsePoint(str) {
    let s = normalize(str);
    if (!s) throw new ParseError('Type a point like (3, -2).');
    s = s.replace(/^\(\s*/, '').replace(/\s*\)$/, '');
    const toks = tokenize(s);
    let depth = 0, cut = -1;
    toks.forEach((t, k) => {
      if (t.t === '(') depth++;
      else if (t.t === ')') depth--;
      else if (t.t === ',' && depth === 0 && cut < 0) cut = k;
    });
    if (cut < 0) throw new ParseError('Write the point as (x, y) with a comma.');
    const A = toks.slice(0, cut), B = toks.slice(cut + 1);
    if (!A.length || !B.length) throw new ParseError('Both coordinates are needed.');
    if (B.some((t) => t.t === ',')) throw new ParseError('A point has just two coordinates.');
    return [parseTokens(A), parseTokens(B)];
  }
  MX.parse = parse; MX.parseRel = parseRel; MX.parsePoint = parsePoint;

  // ---------- AST utilities ----------
  function map(n, f) {
    const r = f(n);
    if (r !== undefined) return r;
    const o = Object.assign({}, n);
    if (n.a) o.a = map(n.a, f);
    if (n.b) o.b = map(n.b, f);
    return o;
  }
  function walk(n, f) { if (!n) return; f(n); walk(n.a, f); walk(n.b, f); }
  function vars(n) { const s = new Set(); walk(n, (x) => { if (x.t === 'var') s.add(x.n); }); return s; }
  function count(n, t) { let c = 0; walk(n, (x) => { if (x.t === t) c++; }); return c; }
  // expand ± into its two branches
  function expandPM(n) {
    let found = null;
    walk(n, (x) => { if (!found && x.t === 'pm') found = x; });
    if (!found) return [n];
    const mk = (t) => map(n, (x) => (x === found ? { t, a: x.a, b: x.b } : undefined));
    return [...expandPM(mk('add')), ...expandPM(mk('sub'))];
  }
  function renameVars(n, table) {
    return map(n, (x) => (x.t === 'var' && table[x.n] ? { t: 'var', n: table[x.n] } : undefined));
  }
  MX.ast = { map, walk, vars, count, expandPM, renameVars };

  function ev(n, env) {
    switch (n.t) {
      case 'num': return n.v;
      case 'var': return n.n in env ? env[n.n] : NaN;
      case 'grp': return ev(n.a, env);
      case 'neg': return -ev(n.a, env);
      case 'add': return ev(n.a, env) + ev(n.b, env);
      case 'sub': return ev(n.a, env) - ev(n.b, env);
      case 'pm': return NaN;
      case 'mul': return ev(n.a, env) * ev(n.b, env);
      case 'div': return ev(n.a, env) / ev(n.b, env);
      case 'pow': {
        const b = ev(n.a, env), e = ev(n.b, env);
        if (b < 0 && !Number.isInteger(e)) {
          // allow odd roots of negatives, e.g. (-8)^(1/3)
          const r = Math.round(1 / e);
          if (Math.abs(1 / e - r) < 1e-9 && r % 2 !== 0) return -Math.pow(-b, e);
          return NaN;
        }
        return Math.pow(b, e);
      }
      case 'sqrt': { const v = ev(n.a, env); return v < -1e-12 ? NaN : Math.sqrt(Math.max(0, v)); }
      case 'abs': return Math.abs(ev(n.a, env));
    }
    return NaN;
  }
  MX.evalAST = ev;

  // sample points for identity testing (kept away from small integers)
  const SAMPLES = [1.37, 0.73, 2.21, 1.93, 0.41, 2.67, 1.11, 3.29, 0.59, 1.71];
  function envAt(varList, k) {
    const env = {};
    varList.forEach((v, j) => { env[v] = SAMPLES[(k + 3 * j) % SAMPLES.length] + 0.137 * j; });
    return env;
  }
  // true when a and b agree at many sample points
  function equivalent(a, b, varList) {
    const vl = varList || [...new Set([...vars(a), ...vars(b)])];
    let compared = 0;
    for (let k = 0; k < SAMPLES.length; k++) {
      const env = envAt(vl, k);
      const x = ev(a, env), y = ev(b, env);
      if (!isFinite(x) && !isFinite(y)) continue;
      if (!isFinite(x) || !isFinite(y)) return false;
      if (Math.abs(x - y) > 1e-7 * Math.max(1, Math.abs(x), Math.abs(y))) return false;
      compared++;
    }
    return compared >= 3;
  }
  MX.equivalent = equivalent;
  MX.envAt = envAt;

  // ---------- AST -> TeX (live preview) ----------
  function numTex(v) { return MX.num(v, 8); }
  function toTex(n) {
    switch (n.t) {
      case 'num': return numTex(n.v);
      case 'var': return n.n;
      case 'grp': return '\\left(' + toTex(n.a) + '\\right)';
      case 'neg': {
        const a = n.a;
        const inner = a.t === 'add' || a.t === 'sub' || a.t === 'pm' ? '\\left(' + toTex(a) + '\\right)' : toTex(a);
        return '-' + inner;
      }
      case 'add': return toTex(n.a) + ' + ' + toTex(n.b);
      case 'sub': return toTex(n.a) + ' - ' + toTex(n.b);
      case 'pm': return (n.a.t === 'num' && n.a.v === 0 ? '' : toTex(n.a)) + ' \\pm ' + toTex(n.b);
      case 'mul': {
        const a = n.a, b = n.b;
        const wrap = (x) => (x.t === 'add' || x.t === 'sub' || x.t === 'pm' ? '\\left(' + toTex(x) + '\\right)' : toTex(x));
        const bu = unwrap(b);
        const needDot = !n.imp || (b.t === 'num') || (bu.t === 'num' && b.t !== 'grp') || b.t === 'neg';
        return wrap(a) + (needDot ? ' \\cdot ' : '') + wrap(b);
      }
      case 'div': {
        const a = unwrap(n.a);
        if (a.t === 'neg') return '-\\frac{' + toTex(unwrap(a.a)) + '}{' + toTex(unwrap(n.b)) + '}';
        return '\\frac{' + toTex(a) + '}{' + toTex(unwrap(n.b)) + '}';
      }
      case 'pow': {
        const a = n.a;
        const base = a.t === 'num' || a.t === 'var' || a.t === 'grp' || a.t === 'sqrt' ? toTex(a) : '\\left(' + toTex(a) + '\\right)';
        return base + '^{' + toTex(unwrap(n.b)) + '}';
      }
      case 'sqrt': return '\\sqrt{' + toTex(n.a) + '}';
      case 'abs': return '|' + toTex(n.a) + '|';
    }
    return '?';
  }
  MX.astTex = toTex;

  // ---------- multivariate (Laurent) polynomials ----------
  // Poly = Map(key -> coef); key like "x^2*y^1" (sorted), "" for the constant term
  const keyOf = (o) => Object.keys(o).filter((k) => o[k] !== 0).sort().map((k) => k + '^' + o[k]).join('*');
  const parseKey = (key) => {
    const o = {};
    if (!key) return o;
    for (const part of key.split('*')) { const [k, e] = part.split('^'); o[k] = +e; }
    return o;
  };
  const P = {
    c(v) { const m = new Map(); if (v !== 0) m.set('', v); return m; },
    v(name) { return new Map([[name + '^1', 1]]); },
    clean(p) {
      const m = new Map();
      for (const [k, c] of p) {
        let v = c;
        const r = Math.round(v);
        if (Math.abs(v - r) < 1e-9) v = r;
        if (Math.abs(v) > 1e-10) m.set(k, v);
      }
      return m;
    },
    add(p, q, s = 1) {
      const m = new Map(p);
      for (const [k, c] of q) m.set(k, (m.get(k) || 0) + s * c);
      return P.clean(m);
    },
    scale(p, s) { const m = new Map(); for (const [k, c] of p) m.set(k, c * s); return P.clean(m); },
    mulMono(k1, k2) {
      const a = parseKey(k1), b = parseKey(k2);
      for (const k in b) a[k] = (a[k] || 0) + b[k];
      return keyOf(a);
    },
    mul(p, q) {
      const m = new Map();
      for (const [k1, c1] of p) for (const [k2, c2] of q) {
        const k = P.mulMono(k1, k2);
        m.set(k, (m.get(k) || 0) + c1 * c2);
      }
      return P.clean(m);
    },
    pow(p, e) { let r = P.c(1); for (let i = 0; i < e; i++) r = P.mul(r, p); return r; },
    isZero(p) { return p.size === 0; },
    isConst(p) { return p.size === 0 || (p.size === 1 && p.has('')); },
    constVal(p) { return p.get('') || 0; },
    eq(p, q) {
      const d = P.add(p, q, -1);
      for (const c of d.values()) if (Math.abs(c) > 1e-8) return false;
      return true;
    },
    degree(p) {
      let d = 0;
      for (const k of p.keys()) { const o = parseKey(k); let s = 0; for (const v in o) s += o[v]; d = Math.max(d, s); }
      return d;
    },
    degreeIn(p, v) {
      let d = 0;
      for (const k of p.keys()) { const o = parseKey(k); d = Math.max(d, o[v] || 0); }
      return d;
    },
    hasNegExp(p) {
      for (const k of p.keys()) { const o = parseKey(k); for (const v in o) if (o[v] < 0) return true; }
      return false;
    },
    // p = r * q for a constant r ?  returns r or null
    ratio(p, q) {
      if (p.size !== q.size || p.size === 0) return null;
      let r = null;
      for (const [k, c] of p) {
        if (!q.has(k)) return null;
        const t = c / q.get(k);
        if (r === null) r = t;
        else if (Math.abs(t - r) > 1e-9 * Math.max(1, Math.abs(r))) return null;
      }
      return r;
    },
    content(p) {
      const cs = [...p.values()];
      if (!cs.every((c) => Number.isInteger(c))) return null;
      return MX.gcdAll(cs);
    },
    keyOf, parseKey,
  };
  MX.P = P;

  // AST -> polynomial (allows division by a monomial -> negative exponents). null if not polynomial.
  function toPoly(n) {
    switch (n.t) {
      case 'num': return P.c(n.v);
      case 'var': return P.v(n.n);
      case 'grp': return toPoly(n.a);
      case 'neg': { const a = toPoly(n.a); return a && P.scale(a, -1); }
      case 'add': case 'sub': {
        const a = toPoly(n.a), b = toPoly(n.b);
        return a && b && P.add(a, b, n.t === 'add' ? 1 : -1);
      }
      case 'mul': { const a = toPoly(n.a), b = toPoly(n.b); return a && b && P.mul(a, b); }
      case 'div': {
        const a = toPoly(n.a), b = toPoly(n.b);
        if (!a || !b || b.size !== 1) return null;
        const [[k, c]] = [...b];
        const o = parseKey(k);
        for (const v in o) o[v] = -o[v];
        return P.mul(a, new Map([[keyOf(o), 1 / c]]));
      }
      case 'pow': {
        const e = toPoly(n.b);
        if (!e || !P.isConst(e)) return null;
        const ev2 = P.constVal(e);
        if (!Number.isInteger(ev2) || Math.abs(ev2) > 200) return null;
        const a = toPoly(n.a);
        if (!a) return null;
        if (a.size > 1 && Math.abs(ev2) > 12) return null;
        if (ev2 >= 0 && a.size !== 1) return P.pow(a, ev2);
        if (a.size === 0) return ev2 > 0 ? a : null;
        if (a.size !== 1) return null;
        const [[k, c]] = [...a];
        const o = parseKey(k);
        for (const v in o) o[v] = o[v] * ev2;
        return new Map([[keyOf(o), Math.pow(c, ev2)]]);
      }
    }
    return null;
  }
  MX.toPoly = (n) => { const p = toPoly(n); return p && P.clean(p); };

  // AST -> {n, d} polynomials (proper, no negative exponents). null if not rational.
  function toRat(n) {
    switch (n.t) {
      case 'num': return { n: P.c(n.v), d: P.c(1) };
      case 'var': return { n: P.v(n.n), d: P.c(1) };
      case 'grp': return toRat(n.a);
      case 'neg': { const a = toRat(n.a); return a && { n: P.scale(a.n, -1), d: a.d }; }
      case 'add': case 'sub': {
        const a = toRat(n.a), b = toRat(n.b);
        if (!a || !b) return null;
        const s = n.t === 'add' ? 1 : -1;
        if (P.eq(a.d, b.d)) return { n: P.add(a.n, b.n, s), d: a.d };
        return { n: P.add(P.mul(a.n, b.d), P.mul(b.n, a.d), s), d: P.mul(a.d, b.d) };
      }
      case 'mul': { const a = toRat(n.a), b = toRat(n.b); return a && b && { n: P.mul(a.n, b.n), d: P.mul(a.d, b.d) }; }
      case 'div': { const a = toRat(n.a), b = toRat(n.b); return a && b && { n: P.mul(a.n, b.d), d: P.mul(a.d, b.n) }; }
      case 'pow': {
        const e = MX.toPoly(n.b);
        if (!e || !P.isConst(e)) return null;
        const k = P.constVal(e);
        if (!Number.isInteger(k) || Math.abs(k) > 200) return null;
        const a = toRat(n.a);
        if (!a) return null;
        return k >= 0 ? { n: P.pow(a.n, k), d: P.pow(a.d, k) } : { n: P.pow(a.d, -k), d: P.pow(a.n, -k) };
      }
    }
    return null;
  }
  MX.toRat = toRat;
})(typeof window !== 'undefined' ? window : globalThis);

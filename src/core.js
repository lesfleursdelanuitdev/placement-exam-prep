/* core.js: namespace, seeded RNG, exact fractions, formatting helpers */
(function (G) {
  'use strict';
  const MX = (G.MX = G.MX || {});

  // ---------- seeded random numbers ----------
  function hashStr(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  class RNG {
    constructor(seed) {
      this.r = mulberry32(typeof seed === 'number' ? seed : hashStr(String(seed)));
    }
    next() { return this.r(); }
    int(a, b) { return a + Math.floor(this.r() * (b - a + 1)); }
    nz(a, b) { let v; do { v = this.int(a, b); } while (v === 0); return v; }
    pick(arr) { return arr[Math.floor(this.r() * arr.length)]; }
    sign() { return this.r() < 0.5 ? -1 : 1; }
    chance(p) { return this.r() < p; }
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(this.r() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }
    sample(arr, k) { return this.shuffle(arr).slice(0, k); }
  }
  MX.RNG = RNG;
  MX.hashStr = hashStr;
  MX.rngFor = (seed, key) => new RNG(hashStr(String(seed) + '|' + key));

  // ---------- integers ----------
  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { [a, b] = [b, a % b]; }
    return a;
  }
  const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
  const gcdAll = (arr) => arr.reduce((g, v) => gcd(g, v), 0);
  // largest k with k^2 | n  ->  sqrt(n) = out * sqrt(in)
  function sqrtParts(n) {
    let out = 1, inn = n;
    for (let k = 2; k * k <= inn; k++) {
      while (inn % (k * k) === 0) { inn /= k * k; out *= k; }
    }
    return { out, in: inn };
  }
  const isSquarefree = (n) => sqrtParts(Math.abs(n)).out === 1;
  const isPerfectSquare = (n) => n >= 0 && Number.isInteger(Math.sqrt(n));
  MX.gcd = gcd; MX.lcm = lcm; MX.gcdAll = gcdAll;
  MX.sqrtParts = sqrtParts; MX.isSquarefree = isSquarefree; MX.isPerfectSquare = isPerfectSquare;

  // ---------- exact fractions ----------
  class Q {
    constructor(n, d = 1) {
      if (d === 0) throw new Error('zero denominator');
      if (d < 0) { n = -n; d = -d; }
      const g = gcd(n, d) || 1;
      this.n = n / g; this.d = d / g;
      if (Object.is(this.n, -0)) this.n = 0;
    }
    static of(x) { return x instanceof Q ? x : Q.fromNum(x); }
    static fromNum(x) {
      if (Number.isInteger(x)) return new Q(x, 1);
      let d = 1;
      while (Math.abs(Math.round(x * d) - x * d) > 1e-9 && d < 1e9) d *= 10;
      return new Q(Math.round(x * d), d);
    }
    add(o) { o = Q.of(o); return new Q(this.n * o.d + o.n * this.d, this.d * o.d); }
    sub(o) { o = Q.of(o); return new Q(this.n * o.d - o.n * this.d, this.d * o.d); }
    mul(o) { o = Q.of(o); return new Q(this.n * o.n, this.d * o.d); }
    div(o) { o = Q.of(o); return new Q(this.n * o.d, this.d * o.n); }
    neg() { return new Q(-this.n, this.d); }
    abs() { return new Q(Math.abs(this.n), this.d); }
    inv() { return new Q(this.d, this.n); }
    eq(o) { o = Q.of(o); return this.n === o.n && this.d === o.d; }
    isInt() { return this.d === 1; }
    sgn() { return Math.sign(this.n); }
    val() { return this.n / this.d; }
    str() { return this.d === 1 ? String(this.n) : this.n + '/' + this.d; }
    tex() {
      if (this.d === 1) return String(this.n);
      return (this.n < 0 ? '-' : '') + '\\frac{' + Math.abs(this.n) + '}{' + this.d + '}';
    }
  }
  MX.Q = Q;

  // ---------- number formatting ----------
  function num(x, maxDec = 6) {
    if (!isFinite(x)) return String(x);
    let s = (+x.toFixed(maxDec)).toString();
    if (s === '-0') s = '0';
    return s;
  }
  const money = (x) => (Math.round(x * 100) / 100).toFixed(2);
  const commas = (x) => Number(x).toLocaleString('en-US', { maximumFractionDigits: 10 });
  const texNum = (x) => (x < 0 ? '-' : '') + num(Math.abs(x));
  // "(−3)" for negatives, used inside substitutions
  const par = (x) => {
    const s = x instanceof Q ? x.tex() : texNum(x);
    return (x instanceof Q ? x.n < 0 : x < 0) ? '\\left(' + s + '\\right)' : s;
  };
  // "+ 3" / "- 3" for appending a signed constant
  const sgnTerm = (x) => {
    if (x instanceof Q) return (x.n < 0 ? '- ' : '+ ') + x.abs().tex();
    return (x < 0 ? '- ' : '+ ') + num(Math.abs(x));
  };
  MX.num = num; MX.money = money; MX.commas = commas; MX.texNum = texNum;
  MX.par = par; MX.sgnTerm = sgnTerm;

  // ---------- polynomial / monomial formatting ----------
  // monomial vars object {x:2, y:1}; order = preferred variable order
  function mono(v, order) {
    const names = order ? order.filter((k) => k in v) : Object.keys(v).sort();
    let tex = '', asc = '';
    for (const k of names) {
      const e = v[k];
      if (!e) continue;
      tex += k + (e === 1 ? '' : '^{' + e + '}');
      asc += k + (e === 1 ? '' : '^' + (e < 0 ? '(' + e + ')' : e));
    }
    return { tex, asc };
  }
  // terms: [[coef, {x:2}], ...]  coef may be number or Q
  function poly(terms, order) {
    let tex = '', asc = '', first = true;
    for (let t of terms) {
      if (Array.isArray(t)) t = { c: t[0], v: t[1] || {} };
      const c = Q.of(t.c);
      if (c.n === 0) continue;
      const m = mono(t.v || {}, order);
      const neg = c.n < 0, a = c.abs();
      let ct, ca;
      if (m.tex && a.eq(1)) { ct = ''; ca = ''; }
      else {
        ct = a.tex();
        ca = a.d === 1 ? String(a.n) : m.tex ? '(' + a.str() + ')' : a.str();
      }
      if (first) { tex += (neg ? '-' : '') + ct + m.tex; asc += (neg ? '-' : '') + ca + m.asc; }
      else { tex += (neg ? ' - ' : ' + ') + ct + m.tex; asc += (neg ? '-' : '+') + ca + m.asc; }
      first = false;
    }
    if (first) { tex = '0'; asc = '0'; }
    return { tex, asc };
  }
  // linear a*x + b in variable v
  const lin = (a, b, v = 'x') => poly([[a, { [v]: 1 }], [b, {}]]);
  // quadratic a x^2 + b x + c
  const quad = (a, b, c, v = 'x') => poly([[a, { [v]: 2 }], [b, { [v]: 1 }], [c, {}]]);
  MX.mono = mono; MX.poly = poly; MX.lin = lin; MX.quad = quad;

  // coefficient in front of a variable: 1 -> '', -1 -> '-', 5 -> '5'
  MX.coef = (c) => (c === 1 ? '' : c === -1 ? '-' : String(c));

  // registry
  MX.topics = [];
  MX.byId = {};
  MX.register = function (t) {
    MX.topics.push(t);
    MX.byId[t.id] = t;
  };
  MX.T = String.raw;
})(typeof window !== 'undefined' ? window : globalThis);

/* texmath.js: a small TeX-subset renderer that outputs HTML (no fonts or libraries needed).
   Supports \frac, \sqrt, \sqrt[n], ^, _, \left( \right), \text, \boxed and common symbols.
   In prose, inline math is written \( ... \) and display math \[ ... \]. */
(function (G) {
  'use strict';
  const MX = G.MX;

  const SYM = {
    pm: ['±', 'b'], mp: ['∓', 'b'], cdot: ['·', 'b'], times: ['×', 'b'], div: ['÷', 'b'],
    le: ['≤', 'r'], leq: ['≤', 'r'], ge: ['≥', 'r'], geq: ['≥', 'r'], lt: ['<', 'r'], gt: ['>', 'r'],
    ne: ['≠', 'r'], neq: ['≠', 'r'], approx: ['≈', 'r'], to: ['→', 'r'], Rightarrow: ['⇒', 'r'],
    implies: ['⇒', 'r'], infty: ['∞', 'a'], circ: ['°', 'a'], degree: ['°', 'a'], pi: ['π', 'i'],
    theta: ['θ', 'i'], Delta: ['Δ', 'a'], emptyset: ['∅', 'a'], varnothing: ['∅', 'a'],
    ldots: ['…', 'a'], cdots: ['⋯', 'a'], checkmark: ['✓', 'a'], '%': ['%', 'a'], $: ['$', 'a'],
    '{': ['{', 'o'], '}': ['}', 'a'], '|': ['|', 'a'],
  };
  const SPACE = { quad: ' ', qquad: '  ', ',': ' ', ';': ' ', ' ': ' ', '!': '' };

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function render(src) {
    let i = 0;
    const n = src.length;

    function skipWs() { while (i < n && /\s/.test(src[i])) i++; }
    function readCmdName() {
      // at backslash
      i++;
      if (i < n && /[a-zA-Z]/.test(src[i])) {
        let j = i;
        while (j < n && /[a-zA-Z]/.test(src[j])) j++;
        const name = src.slice(i, j);
        i = j;
        return name;
      }
      return src[i++]; // single-char command like \, \{ \%
    }
    function readRawBraced() {
      skipWs();
      if (src[i] !== '{') return '';
      let depth = 0, j = i;
      for (; j < n; j++) {
        if (src[j] === '{') depth++;
        else if (src[j] === '}') { depth--; if (depth === 0) break; }
      }
      const raw = src.slice(i + 1, j);
      i = j + 1;
      return raw;
    }
    // one argument: {group} or a single token
    function readArg() {
      skipWs();
      if (src[i] === '{') {
        i++;
        const h = seq('}');
        i++; // consume }
        return h;
      }
      if (src[i] === '\\') {
        const st = { prev: 'start' };
        return one(st);
      }
      const st = { prev: 'start' };
      return one(st);
    }

    // parse one token; st.prev tracks unary/binary context
    function one(st) {
      const c = src[i];
      if (/[0-9.]/.test(c)) {
        // digits, with optional thousands groups (396,710) and decimals
        const m = /^(?:\d{1,3}(?:,\d{3})+(?!\d)|\d*)(?:\.\d+)?/.exec(src.slice(i));
        const txt = (m && m[0]) || c;
        i += txt.length;
        st.prev = 'atom';
        return '<span class="mn">' + txt + '</span>';
      }
      if (/[a-zA-Z]/.test(c)) {
        i++;
        st.prev = 'atom';
        return '<i class="mi">' + c + '</i>';
      }
      if (c === '+' || c === '-') {
        i++;
        const ch = c === '-' ? '−' : '+';
        const unary = st.prev === 'start' || st.prev === 'op' || st.prev === 'open';
        st.prev = 'op';
        return '<span class="mo ' + (unary ? 'u' : 'b') + '">' + ch + '</span>';
      }
      if (c === '=' || c === '<' || c === '>') {
        i++;
        st.prev = 'op';
        return '<span class="mo r">' + esc(c) + '</span>';
      }
      if (c === '(' || c === '[') { i++; st.prev = 'open'; return '<span class="mp">' + c + '</span>'; }
      if (c === ')' || c === ']') { i++; st.prev = 'atom'; return '<span class="mp">' + c + '</span>'; }
      if (c === ',') { i++; st.prev = 'open'; return '<span class="mp cm">,</span>'; }
      if (c === '|') { i++; st.prev = st.prev === 'atom' ? 'atom' : 'open'; return '<span class="mp">|</span>'; }
      if (c === "'") { i++; return '′'; }
      if (c === '^') { i++; const a = readArg(); st.prev = 'atom'; return '<sup>' + a + '</sup>'; }
      if (c === '_') { i++; const a = readArg(); st.prev = 'atom'; return '<sub>' + a + '</sub>'; }
      if (c === '{') {
        i++;
        const h = seq('}');
        i++;
        st.prev = 'atom';
        return h;
      }
      if (c === '\\') {
        const name = readCmdName();
        if (name === 'frac' || name === 'dfrac' || name === 'tfrac') {
          const a = readArg(), b = readArg();
          st.prev = 'atom';
          return '<span class="fr"><span class="fn">' + a + '</span><span class="fd">' + b + '</span></span>';
        }
        if (name === 'sqrt') {
          skipWs();
          let idx = '';
          if (src[i] === '[') {
            const j = src.indexOf(']', i);
            idx = src.slice(i + 1, j);
            i = j + 1;
          }
          const a = readArg();
          st.prev = 'atom';
          return '<span class="sq">' + (idx ? '<span class="sqi">' + esc(idx) + '</span>' : '') +
            '<span class="sqs">√</span><span class="sqa">' + a + '</span></span>';
        }
        if (name === 'left') {
          skipWs();
          let d = src[i++];
          if (d === '\\') d = src[i++];
          const inner = seq('\\right');
          // consume \right and its delimiter
          i += 6;
          skipWs();
          let e = src[i++];
          if (e === '\\') e = src[i++];
          st.prev = 'atom';
          const tall = inner.indexOf('class="fr"') >= 0 ? ' tall' : '';
          const L = d === '.' ? '' : '<span class="dl' + tall + '">' + esc(d) + '</span>';
          const R = e === '.' ? '' : '<span class="dl' + tall + '">' + esc(e) + '</span>';
          return '<span class="lr">' + L + inner + R + '</span>';
        }
        if (name === 'text' || name === 'mathrm' || name === 'textrm') {
          const raw = readRawBraced();
          st.prev = 'atom';
          return '<span class="mt">' + esc(raw) + '</span>';
        }
        if (name === 'boxed') {
          const a = readArg();
          st.prev = 'atom';
          return '<span class="bx">' + a + '</span>';
        }
        if (name === 'overline') {
          const a = readArg();
          st.prev = 'atom';
          return '<span class="ol">' + a + '</span>';
        }
        if (name === 'color') { readRawBraced(); return ''; }
        if (name === 'hl') {
          const a = readArg();
          st.prev = 'atom';
          return '<span class="mhl">' + a + '</span>';
        }
        if (name === 'strike') {
          const a = readArg();
          st.prev = 'atom';
          return '<span class="mst">' + a + '</span>';
        }
        if (['log', 'ln', 'exp', 'sin', 'cos', 'tan'].includes(name)) { st.prev = 'open'; return '<span class="mfn">' + name + '</span>'; }
        if (name === 'cup') { st.prev = 'op'; return '<span class="mo b">∪</span>'; }
        if (name === 'in') { st.prev = 'op'; return '<span class="mo r">∈</span>'; }
        if (name === 'mathbb') { const raw = readRawBraced(); st.prev = 'atom'; return '<span class="mn">' + (raw === 'R' ? 'ℝ' : esc(raw)) + '</span>'; }
        if (name in SPACE) return SPACE[name];
        if (name in SYM) {
          const [ch, kind] = SYM[name];
          if (kind === 'b' || kind === 'r') {
            const unary = kind === 'b' && (st.prev === 'start' || st.prev === 'op' || st.prev === 'open');
            st.prev = 'op';
            return '<span class="mo ' + (kind === 'r' ? 'r' : unary ? 'u' : 'b') + '">' + ch + '</span>';
          }
          if (kind === 'o') { st.prev = 'open'; return '<span class="mp">' + ch + '</span>'; }
          st.prev = 'atom';
          return kind === 'i' ? '<i class="mi">' + ch + '</i>' : '<span class="mn">' + ch + '</span>';
        }
        // unknown command: show its name
        st.prev = 'atom';
        return '<span class="mt">' + esc(name) + '</span>';
      }
      if (/\s/.test(c)) { i++; return ''; }
      i++;
      st.prev = 'atom';
      return esc(c);
    }

    function seq(stop) {
      const st = { prev: 'start' };
      let out = '';
      while (i < n) {
        if (stop === '}' && src[i] === '}') break;
        if (stop === '\\right' && src.startsWith('\\right', i)) break;
        out += one(st);
      }
      return out;
    }
    return seq(null);
  }

  MX.texHTML = (src) => '<span class="m">' + render(String(src)) + '</span>';
  MX.texBlock = (src) => '<div class="md">' + render(String(src)) + '</div>';
  // prose with \( inline \) and \[ display \] math
  MX.rich = function (s) {
    if (s == null) return '';
    return String(s).replace(/\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)/g, (m, d, inl) =>
      d != null ? MX.texBlock(d) : MX.texHTML(inl)
    );
  };
})(typeof window !== 'undefined' ? window : globalThis);

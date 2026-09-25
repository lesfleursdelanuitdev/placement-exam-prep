/* editor.js: a what-you-see-is-what-you-get math answer box.
   Typing ^ opens an exponent, / stacks a fraction (the term before it becomes the numerator),
   √ draws a radical with a bar, and the arrow keys move in and out of each piece.
   The box's value is plain text that the answer checker reads, for example ((x+1)/(x-2)) or 2^(x+1). */
(function (G) {
  'use strict';
  const MX = G.MX;
  const d = G.document;

  // ---------------- model ----------------
  // A row is an array of items. An item is a one-character string or one of:
  //   {k:'fn', f:'log'|'ln'}   {k:'word', w:'no solution'}
  //   {k:'frac', n:row, d:row}  {k:'sup', e:row}  {k:'sqrt', r:row}  {k:'logb', b:row}
  const rowsOf = (it) => (!it || typeof it !== 'object' ? [] : it.k === 'frac' ? [it.n, it.d] : it.k === 'sup' ? [it.e] : it.k === 'sqrt' ? [it.r] : it.k === 'logb' ? [it.b] : []);
  const isStruct = (it) => rowsOf(it).length > 0;
  const isCh = (it, re) => typeof it === 'string' && re.test(it);

  // ---------------- text <-> model ----------------
  const SER = { '≤': '<=', '≥': '>=', '≠': '!=', '−': '-', '·': '*' };
  const SIMPLE_EXP = /^-?(\d+(\.\d+)?|[a-zA-Z])$/;
  function ser(row) {
    let s = '';
    row.forEach((it, i) => {
      if (typeof it === 'string') s += SER[it] || it;
      else if (it.k === 'fn') s += it.f;
      else if (it.k === 'word') s += it.w;
      else if (it.k === 'frac') s += '((' + ser(it.n) + ')/(' + ser(it.d) + '))';
      else if (it.k === 'sqrt') s += '√(' + ser(it.r) + ')';
      else if (it.k === 'logb') s += 'log_(' + ser(it.b) + ')';
      else if (it.k === 'sup') {
        const e = ser(it.e), nx = row[i + 1];
        const simple = SIMPLE_EXP.test(e) && !isCh(nx, /[0-9.]/) && !(nx && nx.k === 'sup');
        s += simple ? '^' + e : '^(' + e + ')';
      }
    });
    return s;
  }
  const WORDS = [[/^no\s*solutions?$/i, 'no solution'], [/^prime$/i, 'prime'], [/^all\s*real\s*numbers$/i, 'all real numbers']];
  function fromText(text) {
    const s = String(text == null ? '' : text);
    const t = s.trim();
    for (const [re, w] of WORDS) if (re.test(t)) return [{ k: 'word', w }];
    const match = (j) => {
      let depth = 0;
      for (let k = j; k < s.length; k++) {
        if (s[k] === '(') depth++;
        else if (s[k] === ')') { depth--; if (depth === 0) return k; }
      }
      return -1;
    };
    function row(from, to) {
      const out = [];
      let j = from;
      while (j < to) {
        const c = s[j];
        if (c === '(' && s[j + 1] === '(') {
          const end = match(j), e1 = match(j + 1);
          if (end > 0 && end < to && e1 > 0 && s[e1 + 1] === '/' && s[e1 + 2] === '(' && match(e1 + 2) === end - 1) {
            out.push({ k: 'frac', n: row(j + 2, e1), d: row(e1 + 3, end - 1) });
            j = end + 1;
            continue;
          }
        }
        if (c === '^') {
          if (s[j + 1] === '(') {
            const end = match(j + 1);
            if (end > 0 && end < to) { out.push({ k: 'sup', e: row(j + 2, end) }); j = end + 1; continue; }
          }
          const m = /^\s*(-?(\d+(\.\d+)?|[a-zA-Z]))/.exec(s.slice(j + 1, to));
          if (m) { out.push({ k: 'sup', e: row(j + 1 + m[0].length - m[1].length, j + 1 + m[0].length) }); j += 1 + m[0].length; continue; }
        }
        if (c === '√' && s[j + 1] === '(') {
          const end = match(j + 1);
          if (end > 0 && end < to) { out.push({ k: 'sqrt', r: row(j + 2, end) }); j = end + 1; continue; }
        }
        if (s.startsWith('sqrt(', j)) {
          const end = match(j + 4);
          if (end > 0 && end < to) { out.push({ k: 'sqrt', r: row(j + 5, end) }); j = end + 1; continue; }
        }
        if (s.startsWith('log_(', j)) {
          const end = match(j + 4);
          if (end > 0 && end < to) { out.push({ k: 'logb', b: row(j + 5, end) }); j = end + 1; continue; }
        }
        if (/^log/i.test(s.slice(j, j + 3))) { out.push({ k: 'fn', f: 'log' }); j += 3; continue; }
        if (/^ln/i.test(s.slice(j, j + 2))) { out.push({ k: 'fn', f: 'ln' }); j += 2; continue; }
        if (/^infinity/i.test(s.slice(j, j + 8))) { out.push('∞'); j += 8; continue; }
        if (/^inf/i.test(s.slice(j, j + 3))) { out.push('∞'); j += 3; continue; }
        const two = s.slice(j, j + 2);
        if (two === '<=') { out.push('≤'); j += 2; continue; }
        if (two === '>=') { out.push('≥'); j += 2; continue; }
        if (two === '!=') { out.push('≠'); j += 2; continue; }
        if (s.startsWith('+/-', j)) { out.push('±'); j += 3; continue; }
        if (two === '+-') { out.push('±'); j += 2; continue; }
        if (c === '−' || c === '–') { out.push('-'); j++; continue; }
        if (c === '\n' || c === '\r' || c === '\t') { j++; continue; }
        out.push(c);
        j++;
      }
      return out;
    }
    return row(0, s.length);
  }

  // ---------------- editor state ----------------
  const BREAK_SUP = new Set(['+', '-', '=', '<', '>', '±', '≤', '≥', '≠', ',', ')', ']', '}', '∪']);
  const OPERATOR = /[+\-±·*×=<>≤≥≠∪,\s]/;

  class Ed {
    constructor(el) {
      this.el = el;
      this.kind = (el && el.dataset && el.dataset.kind) || '';
      this.root = fromText(el && el.dataset ? el.dataset.v || '' : '');
      this.row = this.root;
      this.i = this.root.length;
      this.index();
    }
    index() {
      const par = (this.par = new Map());
      const walk = (row) => row.forEach((it, i) => rowsOf(it).forEach((r) => { par.set(r, { row, i, item: it }); walk(r); }));
      walk(this.root);
    }
    value() { return ser(this.root); }
    setText(t) { this.root = fromText(t); this.row = this.root; this.i = this.root.length; this.index(); }
    prev() { return this.row[this.i - 1]; }
    // put items at the cursor
    put(...items) { this.row.splice(this.i, 0, ...items); this.i += items.length; }
    enter(row, atEnd) { this.row = row; this.i = atEnd ? row.length : 0; }
    clearWord() {
      if (this.root.length === 1 && this.root[0].k === 'word') { this.root.length = 0; this.row = this.root; this.i = 0; }
    }
    insertStruct(st, rowKey, atEnd) {
      this.clearWord();
      this.put(st);
      this.index();
      this.enter(st[rowKey], atEnd);
    }
    setWord(w) {
      this.root.length = 0;
      this.root.push({ k: 'word', w });
      this.row = this.root;
      this.i = 1;
      this.index();
    }
    // the fraction command: the term just before the cursor becomes the numerator
    frac() {
      this.clearWord();
      const row = this.row, j = this.i;
      let k = j, depth = 0;
      while (k > 0) {
        const it = row[k - 1];
        if (typeof it === 'string') {
          if (it === ')' || it === ']') { depth++; k--; continue; }
          if (it === '(' || it === '[') { if (depth === 0) break; depth--; k--; continue; }
          if (depth > 0) { k--; continue; }
          if (/[0-9.a-zA-Zπ∞]/.test(it)) { k--; continue; }
          break;
        }
        if (it.k === 'word') break;
        k--;
      }
      if (depth !== 0) k = j;
      let n = row.slice(k, j);
      if (n.length >= 2 && n[0] === '(' && n[n.length - 1] === ')') {
        let dd = 0, whole = true;
        for (let q = 0; q < n.length; q++) {
          if (n[q] === '(') dd++;
          else if (n[q] === ')') { dd--; if (dd === 0 && q < n.length - 1) { whole = false; break; } }
        }
        if (whole) n = n.slice(1, -1);
      }
      const st = { k: 'frac', n, d: [] };
      row.splice(k, j - k, st);
      this.i = k + 1;
      this.index();
      this.enter(j > k ? st.d : st.n, false);
    }
    inSupRow() { const p = this.par.get(this.row); return p && p.item.k === 'sup' ? p : null; }
    typeChar(c) {
      if (c === '−' || c === '–') c = '-';
      if (c === '÷') c = '/';
      if (c === '​' || c === '\r' || c === '\n' || c === '\t') return;
      if (c === '²' || c === '³') { this.insertStruct({ k: 'sup', e: [c === '²' ? '2' : '3'] }, 'e', true); this.exitRight(); return; }
      this.clearWord();
      if (c === '/') return this.frac();
      if (c === '^') return this.insertStruct({ k: 'sup', e: [] }, 'e');
      if (c === '√') return this.insertStruct({ k: 'sqrt', r: [] }, 'r');
      const pv = this.prev();
      if (c === '_' && pv && pv.k === 'fn' && pv.f === 'log') {
        this.row.splice(this.i - 1, 1);
        this.i--;
        return this.insertStruct({ k: 'logb', b: [] }, 'b');
      }
      // leave an exponent when an operator is typed (x^2+1), unless a ( is still open inside it
      const sp = this.inSupRow();
      if (sp && BREAK_SUP.has(c) && this.row.length && this.i === this.row.length) {
        let open = 0;
        this.row.forEach((it) => { if (it === '(' || it === '[') open++; else if (it === ')' || it === ']') open--; });
        if (open <= 0) { this.row = sp.row; this.i = sp.i + 1; }
      }
      const p = this.prev();
      if (c === '=' && (p === '<' || p === '>' || p === '!')) { this.row[this.i - 1] = p === '<' ? '≤' : p === '>' ? '≥' : '≠'; return; }
      if (c === '-' && p === '+') { this.row[this.i - 1] = '±'; return; }
      if ((c === 'u' || c === 'U') && this.kind === 'interval') {
        let q = this.i - 1;
        while (q >= 0 && this.row[q] === ' ') q--;
        if (this.row[q] === ')' || this.row[q] === ']') { this.put('∪'); return; }
      }
      this.put(c);
      this.autoWords();
    }
    // typed words become symbols: sqrt -> √ box, log, ln, inf -> ∞
    autoWords() {
      const row = this.row, i = this.i;
      const tail = (n) => { if (i < n) return ''; let s = ''; for (let q = i - n; q < i; q++) { if (typeof row[q] !== 'string') return ''; s += row[q]; } return s; };
      const cut = (n) => { row.splice(i - n, n); this.i = i - n; };
      if (tail(4).toLowerCase() === 'sqrt') { cut(4); return this.insertStruct({ k: 'sqrt', r: [] }, 'r'); }
      if (tail(3).toLowerCase() === 'log') { cut(3); this.put({ k: 'fn', f: 'log' }); return; }
      if (tail(2).toLowerCase() === 'ln') { cut(2); this.put({ k: 'fn', f: 'ln' }); return; }
      if (tail(3).toLowerCase() === 'inf') { cut(3); this.put('∞'); return; }
      if (tail(6).toLowerCase() === '∞inity') { cut(5); }
    }
    insertText(t) {
      const items = fromText(t);
      if (items.length === 1 && items[0].k === 'word') return this.setWord(items[0].w);
      this.clearWord();
      this.put(...items);
      this.index();
    }
    exitRight() {
      const p = this.par.get(this.row);
      if (p) { this.row = p.row; this.i = p.i + 1; }
    }
    left() {
      if (this.i > 0) {
        const it = this.row[this.i - 1];
        if (isStruct(it)) { const rs = rowsOf(it); this.enter(rs[rs.length - 1], true); } else this.i--;
        return;
      }
      const p = this.par.get(this.row);
      if (!p) return;
      const rs = rowsOf(p.item), k = rs.indexOf(this.row);
      if (k > 0) this.enter(rs[k - 1], true);
      else { this.row = p.row; this.i = p.i; }
    }
    right() {
      if (this.i < this.row.length) {
        const it = this.row[this.i];
        if (isStruct(it)) this.enter(rowsOf(it)[0], false); else this.i++;
        return;
      }
      const p = this.par.get(this.row);
      if (!p) return;
      const rs = rowsOf(p.item), k = rs.indexOf(this.row);
      if (k < rs.length - 1) this.enter(rs[k + 1], false);
      else { this.row = p.row; this.i = p.i + 1; }
    }
    vert(up) {
      let r = this.row;
      for (let p = this.par.get(r); p; r = p.row, p = this.par.get(r)) {
        if (p.item.k === 'frac' && ((up && r === p.item.d) || (!up && r === p.item.n))) {
          const t = up ? p.item.n : p.item.d;
          this.i = r === this.row ? Math.min(this.i, t.length) : t.length;
          this.row = t;
          return;
        }
      }
      // next to a fraction: step into its top or bottom
      const a = this.row[this.i - 1], b = this.row[this.i];
      const f = a && a.k === 'frac' ? a : b && b.k === 'frac' ? b : null;
      if (f) this.enter(up ? f.n : f.d, f === a);
    }
    home() { this.row = this.root; this.i = 0; }
    end() { this.row = this.root; this.i = this.root.length; }
    backspace() {
      const row = this.row, i = this.i;
      if (i > 0) {
        const it = row[i - 1];
        if (!isStruct(it)) { row.splice(i - 1, 1); this.i--; return; }
        const rs = rowsOf(it);
        if (rs.every((r) => !r.length)) { row.splice(i - 1, 1); this.i--; this.index(); return; }
        this.enter(rs[rs.length - 1], true);
        return;
      }
      const p = this.par.get(row);
      if (!p) return;
      const st = p.item;
      if (st.k === 'frac' && row === st.d && st.n.length) { this.enter(st.n, true); return; }
      const contents = st.k === 'frac' ? [...st.n, ...st.d] : st.k === 'logb' ? [{ k: 'fn', f: 'log' }, ...st.b] : rowsOf(st)[0].slice();
      p.row.splice(p.i, 1, ...contents);
      this.row = p.row;
      this.i = p.i + (st.k === 'logb' ? 1 : 0);
      this.index();
    }
    del() {
      const row = this.row, i = this.i;
      if (i < row.length) {
        const it = row[i];
        if (!isStruct(it)) { row.splice(i, 1); return; }
        if (rowsOf(it).every((r) => !r.length)) { row.splice(i, 1); this.index(); return; }
        this.enter(rowsOf(it)[0], false);
        return;
      }
      this.right();
    }
  }

  // ---------------- rendering ----------------
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const CARET = '<span class="caret" aria-hidden="true"></span>';
  const BIN = new Set(['+', '-', '±', '·', '*', '×', '∪']);
  const RELS = new Set(['=', '<', '>', '≤', '≥', '≠']);
  function renderModel(root, opts) {
    opts = opts || {};
    const rows = [];
    const cur = opts.cursor;
    function rowHTML(row, isRoot) {
      const r = rows.push(row) - 1;
      const at = cur && cur.row === row ? cur.i : -1;
      let h = '', prev = 'start';
      row.forEach((it, i) => {
        if (i === at) h += CARET;
        const a = ` data-r="${r}" data-i="${i}"`;
        if (typeof it === 'string') {
          if (/[0-9.]/.test(it)) { h += `<span class="mn"${a}>${it}</span>`; prev = 'atom'; }
          else if (/[a-zA-Z]/.test(it)) { h += `<i class="mi"${a}>${it}</i>`; prev = 'atom'; }
          else if (BIN.has(it)) {
            const unary = (it === '-' || it === '+' || it === '±') && (prev === 'start' || prev === 'op' || prev === 'open');
            const ch = it === '-' ? '−' : it === '*' ? '·' : it;
            h += `<span class="mo ${unary ? 'u' : 'b'}"${a}>${ch}</span>`;
            prev = 'op';
          } else if (RELS.has(it)) { h += `<span class="mo r"${a}>${esc(it)}</span>`; prev = 'op'; }
          else if ('([{'.includes(it)) { h += `<span class="mp"${a}>${it}</span>`; prev = 'open'; }
          else if (')]}|'.includes(it)) { h += `<span class="mp"${a}>${it}</span>`; prev = 'atom'; }
          else if (it === ',') { h += `<span class="mp cm"${a}>,</span>`; prev = 'open'; }
          else if (it === ' ') { h += `<span class="esp"${a}> </span>`; }
          else { h += `<span class="mn"${a}>${esc(it)}</span>`; prev = 'atom'; }
          return;
        }
        prev = 'atom';
        if (it.k === 'fn') { h += `<span class="mfn"${a}>${it.f}</span>`; prev = 'open'; }
        else if (it.k === 'word') h += `<span class="mt mw"${a}>${esc(it.w)}</span>`;
        else if (it.k === 'frac') h += `<span class="fr"${a}><span class="fn">${rowHTML(it.n)}</span><span class="fd">${rowHTML(it.d)}</span></span>`;
        else if (it.k === 'sup') h += `<sup${a}>${rowHTML(it.e)}</sup>`;
        else if (it.k === 'sqrt') h += `<span class="sq"${a}><span class="sqs">√</span><span class="sqa">${rowHTML(it.r)}</span></span>`;
        else if (it.k === 'logb') { h += `<span class="lgb"${a}><span class="mfn">log</span><sub>${rowHTML(it.b)}</sub></span>`; prev = 'open'; }
      });
      if (at === row.length) h += CARET;
      return `<span class="er${row.length ? '' : ' e0'}${isRoot ? ' root' : ''}" data-r="${r}"${isRoot && opts.ph ? ` data-ph="${esc(opts.ph)}"` : ''}>${h}</span>`;
    }
    const html = rowHTML(root, true);
    return { html, rows };
  }

  // ---------------- DOM wiring ----------------
  const STATE = new WeakMap();
  const SENT = '​';
  let ta = null, bar = null, active = null, lastVal = SENT, composing = false, blurTimer = 0;

  const PH = { num: 'answer', nums: 'value', expr: 'expression', factor: 'e.g. 3(x+2)(x−1)', eq: 'e.g. y = 2x + 5', ineq: 'e.g. x ≥ −3', point: '(x, y)', points: '(x, y)', sci: 'e.g. 3.2 × 10⁵', radpm: 'e.g. (−2 ± √10)/3', system: 'e.g. x + y = 40', eqform: 'equation', set: 'e.g. {−2, 0, 3}', interval: 'e.g. [−3, 5)' };

  function edOf(el) {
    let ed = STATE.get(el);
    if (!ed) { ed = new Ed(el); STATE.set(el, ed); }
    return ed;
  }
  function draw(ed) {
    const inner = ed.el.querySelector('.mq-in');
    const on = active === ed;
    const out = renderModel(ed.root, { cursor: on ? ed : null, ph: ed.el.dataset.ph || '' });
    ed.rows = out.rows;
    inner.innerHTML = out.html;
    if (on) {
      const c = inner.querySelector('.caret');
      if (c && ed.el.scrollWidth > ed.el.clientWidth + 2) {
        const cr = c.getBoundingClientRect(), er = ed.el.getBoundingClientRect();
        if (cr.right > er.right - 8) ed.el.scrollLeft += cr.right - er.right + 24;
        else if (cr.left < er.left + 8) ed.el.scrollLeft -= er.left - cr.left + 24;
      }
    }
  }
  function changed(ed) {
    const v = ed.value();
    const was = ed.el.dataset.v || '';
    ed.el.dataset.v = v;
    ed.el.classList.toggle('filled', !!v);
    draw(ed);
    if (v !== was) ed.el.dispatchEvent(new CustomEvent('mq-change', { bubbles: true }));
  }
  function resetTA() {
    if (!ta) return;
    ta.value = SENT;
    lastVal = SENT;
    try { ta.setSelectionRange(SENT.length, SENT.length); } catch (e) { /* ignore */ }
  }
  function ensureTA() {
    if (ta) return;
    ta = d.createElement('textarea');
    ta.className = 'mq-ta';
    ['autocomplete', 'autocorrect', 'autocapitalize', 'spellcheck'].forEach((k, n) => ta.setAttribute(k, n === 2 ? 'none' : n === 3 ? 'false' : 'off'));
    ta.setAttribute('rows', '1');
    ta.tabIndex = -1; // the box itself is the tab stop
    ta.setAttribute('aria-label', 'Answer box. Type math: ^ for an exponent, / for a fraction; arrow keys move in and out.');
    ta.addEventListener('keydown', onKeyDown);
    ta.addEventListener('input', onInput);
    ta.addEventListener('paste', onPaste);
    ta.addEventListener('compositionstart', () => { composing = true; });
    ta.addEventListener('compositionend', () => {
      composing = false;
      setTimeout(() => { if (!composing && active) { if (ta.value !== lastVal) applyDiff(active); resetTA(); } }, 0);
    });
    ta.addEventListener('blur', () => {
      if (active) active.el.setAttribute('tabindex', '0');
      clearTimeout(blurTimer);
      blurTimer = setTimeout(() => { if (d.activeElement !== ta) deactivate(); }, 160);
    });
    ta.addEventListener('focus', () => { clearTimeout(blurTimer); if (active) active.el.setAttribute('tabindex', '-1'); });
  }
  function activate(el) {
    ensureTA();
    const ed = edOf(el);
    if (active && active !== ed) deactivate();
    clearTimeout(blurTimer);
    active = ed;
    el.classList.add('act');
    el.setAttribute('tabindex', '-1');
    if (ta.parentNode !== el) el.appendChild(ta);
    composing = false;
    resetTA();
    try { ta.focus({ preventScroll: true }); } catch (e) { ta.focus(); }
    resetTA();
    showBar(ed);
    draw(ed);
    return ed;
  }
  function deactivate() {
    const ed = active;
    if (!ed) return;
    active = null;
    ed.el.classList.remove('act');
    ed.el.setAttribute('tabindex', '0');
    draw(ed);
    if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
  }
  function applyDiff(ed) {
    const v = ta.value;
    let p = 0;
    while (p < v.length && p < lastVal.length && v[p] === lastVal[p]) p++;
    const del = lastVal.length - p, ins = v.slice(p);
    for (let k = 0; k < del; k++) ed.backspace();
    let enter = false;
    for (const ch of ins) { if (ch === '\n') enter = true; else if (ch !== SENT) ed.typeChar(ch); }
    lastVal = v;
    changed(ed);
    if (enter) fireEnter(ed);
  }
  function onInput() {
    const ed = active;
    if (!ed) { resetTA(); return; }
    applyDiff(ed);
    if (!composing) resetTA();
  }
  function onPaste(e) {
    const ed = active;
    if (!ed) return;
    e.preventDefault();
    const t = (e.clipboardData || G.clipboardData).getData('text');
    ed.insertText(String(t || '').replace(/\s*\n\s*/g, ' '));
    changed(ed);
  }
  function fireEnter(ed) { ed.el.dispatchEvent(new CustomEvent('mq-enter', { bubbles: true })); }
  function onKeyDown(e) {
    const ed = active;
    if (!ed || e.isComposing || composing) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    switch (e.key) {
      case 'ArrowLeft': ed.left(); break;
      case 'ArrowRight': ed.right(); break;
      case 'ArrowUp': ed.vert(true); break;
      case 'ArrowDown': ed.vert(false); break;
      case 'Home': ed.home(); break;
      case 'End': ed.end(); break;
      case 'Backspace': ed.backspace(); break;
      case 'Delete': ed.del(); break;
      case 'Enter': e.preventDefault(); fireEnter(ed); return;
      case 'Escape': ta.blur(); return;
      default:
        if (e.key && e.key.length === 1) { ed.typeChar(e.key); break; }
        return;
    }
    e.preventDefault();
    resetTA();
    changed(ed);
  }
  // click: place the cursor where the student tapped
  function onClick(e) {
    const el = e.target.closest && e.target.closest('.mq');
    if (!el || el.classList.contains('locked') || el.getAttribute('aria-disabled') === 'true') return;
    if (e.target === ta) return;
    const ed = active && active.el === el ? active : activate(el);
    if (!ed.rows) draw(ed);
    const t = e.target.closest('[data-i]');
    if (t && el.contains(t)) {
      const row = ed.rows[+t.dataset.r], i = +t.dataset.i;
      const rc = t.getBoundingClientRect();
      if (row) { ed.row = row; ed.i = e.clientX > rc.left + rc.width / 2 ? i + 1 : i; }
    } else {
      const rr = e.target.closest('[data-r]');
      const row = rr && el.contains(rr) ? ed.rows[+rr.dataset.r] : null;
      if (row && row !== ed.root) { const rc = rr.getBoundingClientRect(); ed.row = row; ed.i = e.clientX > rc.left + rc.width / 2 ? row.length : 0; }
      else ed.end();
    }
    composing = false;
    resetTA();
    try { ta.focus({ preventScroll: true }); } catch (e2) { ta.focus(); }
    draw(ed);
  }

  // ---------------- toolbar ----------------
  const box = '<span class="kbx"></span>';
  const KEYS = {
    frac: { l: `<span class="kfr"><span>${box}</span><span>${box}</span></span>`, t: 'Fraction (or type /)', run: (ed) => ed.frac() },
    pow: { l: `<i>x</i><sup>${box}</sup>`, t: 'Exponent (or type ^)', run: (ed) => ed.typeChar('^') },
    sqrt: { l: `√<span class="ksq">${box}</span>`, t: 'Square root', run: (ed) => ed.insertStruct({ k: 'sqrt', r: [] }, 'r') },
    paren: { l: '( )', t: 'Parentheses', run: (ed) => { ed.clearWord(); ed.put('(', ')'); ed.i--; } },
    pm: { l: '±', t: 'Plus or minus', run: (ed) => ed.typeChar('±') },
    le: { l: '≤', t: 'Less than or equal to', run: (ed) => ed.typeChar('≤') },
    ge: { l: '≥', t: 'Greater than or equal to', run: (ed) => ed.typeChar('≥') },
    point: { l: '( , )', t: 'A point (x, y)', run: (ed) => { ed.clearWord(); ed.put('(', ',', ' ', ')'); ed.i -= 3; } },
    sci: { l: '×10<sup>n</sup>', t: 'Times 10 to a power', run: (ed) => { ed.clearWord(); ed.put('×', '1', '0'); ed.insertStruct({ k: 'sup', e: [] }, 'e'); } },
    logb: { l: `log<sub>${box}</sub>`, t: 'Logarithm with a base', run: (ed) => ed.insertStruct({ k: 'logb', b: [] }, 'b') },
    log: { l: 'log', t: 'Common log (base 10)', run: (ed) => { ed.clearWord(); ed.put({ k: 'fn', f: 'log' }); } },
    ln: { l: 'ln', t: 'Natural log (base e)', run: (ed) => { ed.clearWord(); ed.put({ k: 'fn', f: 'ln' }); } },
    e: { l: '<i>e</i>', t: 'The number e', run: (ed) => ed.typeChar('e') },
    inf: { l: '∞', t: 'Infinity', run: (ed) => ed.typeChar('∞') },
    cup: { l: '∪', t: 'Union', run: (ed) => { ed.clearWord(); ed.put('∪'); } },
    lb: { l: '[', t: 'Bracket: endpoint included', run: (ed) => ed.typeChar('[') },
    rb: { l: ']', t: 'Bracket: endpoint included', run: (ed) => ed.typeChar(']') },
    lp: { l: '(', t: 'Parenthesis: endpoint not included', run: (ed) => ed.typeChar('(') },
    rp: { l: ')', t: 'Parenthesis: endpoint not included', run: (ed) => ed.typeChar(')') },
    set: { l: '{ }', t: 'Set braces', run: (ed) => { ed.clearWord(); ed.put('{', '}'); ed.i--; } },
    reals: { l: 'all reals', t: 'All real numbers', w: 1, run: (ed) => ed.setWord('all real numbers') },
    nosol: { l: 'no solution', t: 'No solution', w: 1, run: (ed) => ed.setWord('no solution') },
    prime: { l: 'prime', t: 'The polynomial is prime (it doesn’t factor)', w: 1, run: (ed) => ed.setWord('prime') },
    left: { l: '←', t: 'Move left', nav: 1, run: (ed) => ed.left() },
    right: { l: '→', t: 'Move right (out of a fraction or exponent)', nav: 1, run: (ed) => ed.right() },
    bksp: { l: '⌫', t: 'Delete', nav: 1, run: (ed) => ed.backspace() },
  };
  const BASE = ['frac', 'pow', 'sqrt', 'paren', 'pm', 'le', 'ge'];
  function keysFor(kind, o) {
    o = o || {};
    let k = BASE.slice();
    if (kind === 'point' || kind === 'points') k.push('point');
    if (kind === 'sci') k.push('sci');
    if (kind === 'interval') k = ['frac', 'sqrt', 'lb', 'lp', 'rp', 'rb', 'inf', 'cup', 'le', 'ge', 'reals', 'nosol'];
    if (kind === 'set') k = ['frac', 'sqrt', 'set', 'pm', 'nosol'];
    if (o.logs || kind === 'eqform') k.push('logb', 'log', 'ln', 'e');
    if (kind === 'factor') k.push('prime');
    if (kind === 'num' || kind === 'nums') k.push('nosol', 'reals');
    return k.concat(['left', 'right', 'bksp']);
  }
  function showBar(ed) {
    if (!bar) {
      bar = d.createElement('div');
      bar.className = 'mq-bar';
      bar.setAttribute('role', 'toolbar');
      bar.setAttribute('aria-label', 'Math symbols');
      bar.addEventListener('mousedown', (e) => e.preventDefault());
      bar.addEventListener('click', (e) => {
        const b = e.target.closest('[data-k]');
        const ed2 = active;
        if (!b || !ed2) return;
        e.preventDefault();
        clearTimeout(blurTimer);
        const k = KEYS[b.dataset.k];
        k.run(ed2);
        ed2.index();
        resetTA();
        try { ta.focus({ preventScroll: true }); } catch (e2) { ta.focus(); }
        changed(ed2);
      });
    }
    const keys = (ed.el.dataset.keys || keysFor(ed.kind).join(' ')).split(/\s+/).filter((k) => KEYS[k]);
    bar.innerHTML = keys.map((k) => `<button type="button" tabindex="-1" class="mk${KEYS[k].w ? ' mk-w' : ''}${KEYS[k].nav ? ' mk-nav' : ''}" data-k="${k}" title="${esc(KEYS[k].t)}" aria-label="${esc(KEYS[k].t)}">${KEYS[k].l}</button>`).join('');
    const host = ed.el.closest('[data-mq-bar]');
    if (host) host.appendChild(bar);
    else ed.el.insertAdjacentElement('afterend', bar);
  }

  // ---------------- public API ----------------
  // markup for an answer box; the value is the checker text
  function html(o) {
    const v = o.value || '';
    if (o.disabled) return staticHTML(v, o.cls);
    const ph = o.ph != null ? o.ph : PH[o.kind] || 'answer';
    const out = renderModel(fromText(v), { ph });
    return `<span class="mq m${o.cls ? ' ' + o.cls : ''}${v ? ' filled' : ''}" id="${esc(o.id)}" data-kind="${esc(o.kind)}" data-keys="${esc(o.keys || keysFor(o.kind, o).join(' '))}" data-ph="${esc(ph)}" data-v="${esc(v)}" tabindex="0" role="group" aria-label="answer box"><span class="mq-in">${out.html}</span></span>`;
  }
  function staticHTML(text, cls) {
    return `<span class="mq m locked${cls ? ' ' + cls : ''}" aria-disabled="true"><span class="mq-in">${renderModel(fromText(text || '')).html}</span></span>`;
  }
  // formatted display of a checker-text answer (for "you answered")
  const display = (text) => `<span class="m mq-show">${renderModel(fromText(text || '')).html}</span>`;
  function value(id) {
    const el = typeof id === 'string' ? d.getElementById(id) : id;
    if (!el) return '';
    return el.dataset.v || '';
  }
  function set(id, text) {
    const el = typeof id === 'string' ? d.getElementById(id) : id;
    if (!el) return;
    const ed = edOf(el);
    ed.setText(text);
    changed(ed);
  }
  let wired = false;
  function wire() {
    if (wired || !d) return;
    wired = true;
    d.addEventListener('mousedown', (e) => {
      const el = e.target.closest && e.target.closest('.mq');
      if (el && !el.classList.contains('locked')) e.preventDefault();
    });
    d.addEventListener('click', onClick);
    // keyboard users reach a box with Tab
    d.addEventListener('focusin', (e) => {
      const el = e.target;
      if (!el || !el.classList || !el.classList.contains('mq') || el.classList.contains('locked')) return;
      if (active && active.el === el) { try { ta.focus({ preventScroll: true }); } catch (e2) { ta.focus(); } } else activate(el);
    });
  }
  if (d) { if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', wire); else wire(); }

  MX.ED = { html, staticHTML, display, value, set, keysFor, fromText, ser, Ed, renderModel, KEYS, PH, focus: (el) => activate(el) };
})(typeof window !== 'undefined' ? window : globalThis);

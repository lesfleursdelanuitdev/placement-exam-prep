/* grapher.js: the Grapher tab.
   Graph mode: type functions (or equations like circles), each in its own color, and read values by hovering.
   Draw mode: draw a graph on the grid with a pen, points, or two-point lines, parabolas and circles, type what it is
   supposed to show, and check it. The math is in plot.js; this file is the page. */
(function (G) {
  'use strict';
  const MX = G.MX, P = MX.Plot, d = G.document;
  if (!d) return;
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const Store = () => MX.Store;
  const MAX_FNS = 8;

  const TOOLS = [
    { id: 'pen', name: 'Pen', hint: 'Drag to draw. Lift and draw again for another piece.' },
    { id: 'point', name: 'Point', hint: 'Tap to plot a point. Points snap to the grid.' },
    { id: 'line', name: 'Line', hint: 'Tap two points. The line goes through both.' },
    { id: 'parabola', name: 'Parabola', hint: 'Tap the vertex first, then any other point on the parabola.' },
    { id: 'circle', name: 'Circle', hint: 'Tap the center first, then any point on the circle.' },
  ];
  const PRESETS = [
    { id: 'std', name: '−10 to 10', win: { xmin: -10, xmax: 10, ymin: -10, ymax: 10, xstep: 1, ystep: 1 } },
    { id: 'small', name: '−5 to 5', win: { xmin: -5, xmax: 5, ymin: -5, ymax: 5, xstep: 1, ystep: 1 } },
    { id: 'wide', name: '−50 to 50', win: { xmin: -50, xmax: 50, ymin: -50, ymax: 50, xstep: 5, ystep: 5 } },
    { id: 'big', name: '−100 to 100', win: { xmin: -100, xmax: 100, ymin: -100, ymax: 100, xstep: 10, ystep: 10 } },
    { id: 'trig', name: 'Trig', win: { xmin: -2 * Math.PI, xmax: 2 * Math.PI, ymin: -4, ymax: 4, xstep: Math.PI / 2, ystep: 1 } },
  ];

  // ---------- state ----------
  const S = {
    mode: 'graph', win: Object.assign({}, P.DEFAULT_WIN),
    fns: [{ src: 'x^2 - 4', color: 'blue', show: true }, { src: '2x + 1', color: 'orange', show: true }],
    parsed: [], tool: 'pen', items: [], pending: null, hover: null, target: '', result: null, showAnswer: false, drawing: null,
    root: null, built: false, colorFor: -1,
  };
  function load() {
    const g = Store() && Store().state && Store().state.grapher;
    if (!g) return;
    if (Array.isArray(g.fns)) S.fns = g.fns.map((f) => Object.assign({}, f));
    if (g.win) S.win = P.cleanWin(Object.assign({}, P.DEFAULT_WIN, g.win));
    if (g.mode) S.mode = g.mode;
  }
  let saveTimer = 0;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (!Store() || !Store().state) return;
      Store().state.grapher = { fns: S.fns.map((f) => ({ src: f.src, color: f.color, show: f.show })), win: Object.assign({}, S.win), mode: S.mode };
      Store().save();
    }, 400);
  }
  function parseAll() {
    S.parsed = S.fns.map((f) => {
      if (!f.src.trim()) return { empty: true };
      try { return { g: P.read(f.src) }; } catch (e) { return { err: e instanceof MX.ParseError ? e.message : 'That can’t be graphed.' }; }
    });
  }
  const colorClass = (c) => (P.PALETTE.some((p) => p.id === c) ? 'gc-' + c : '');
  const colorStyle = (c) => (P.PALETTE.some((p) => p.id === c) ? '' : '--c:' + (/^#[0-9a-f]{6}$/i.test(c) ? c : '#2a78d6'));
  const colorName = (c) => { const p = P.PALETTE.find((x) => x.id === c); return p ? p.name : 'Custom ' + c; };
  const nextColor = () => { const used = new Set(S.fns.map((f) => f.color)); const p = P.PALETTE.find((x) => !used.has(x.id)); return p ? p.id : P.PALETTE[S.fns.length % P.PALETTE.length].id; };

  // ---------- page skeleton ----------
  function build(root) {
    S.root = root;
    root.innerHTML = `<header class="page-h"><h1>Grapher</h1><p>Graph functions and equations, or draw a graph yourself and check it.</p></header>
      <div class="gr-modes" role="tablist" aria-label="Grapher mode">
        <button type="button" role="tab" data-gr="mode" data-mode="graph" id="gr-tab-graph">Graph functions</button>
        <button type="button" role="tab" data-gr="mode" data-mode="draw" id="gr-tab-draw">Draw a graph</button>
      </div>
      <div class="gr-body">
        <div class="gr-plotwrap">
          <div class="gr-plot" id="gr-plot"><svg id="gr-svg" role="img" aria-label="Coordinate plane"></svg><div class="gr-tip" id="gr-tip" hidden></div></div>
          <div class="gr-zoom"><button type="button" class="btn ghost sm" data-gr="zoom" data-z="0.5" aria-label="Zoom in">＋ Zoom in</button><button type="button" class="btn ghost sm" data-gr="zoom" data-z="2" aria-label="Zoom out">− Zoom out</button><button type="button" class="btn ghost sm" data-gr="preset" data-p="std">Reset</button></div>
        </div>
        <div class="gr-side">
          <div id="gr-graph-panel"></div>
          <div id="gr-draw-panel"></div>
          <details class="gr-win" id="gr-win"><summary>Window and grid</summary><div id="gr-win-body"></div></details>
        </div>
      </div>
      <div class="gr-pop" id="gr-pop" hidden role="dialog" aria-label="Choose a color"></div>`;
    S.built = true;
    wire(root);
    if (G.ResizeObserver) new G.ResizeObserver(() => drawPlot()).observe(d.getElementById('gr-plot'));
  }

  // ---------- panels ----------
  function renderGraphPanel() {
    const el = d.getElementById('gr-graph-panel');
    el.hidden = S.mode !== 'graph';
    if (el.hidden) return;
    const rows = S.fns.map((f, i) => {
      const p = S.parsed[i] || {};
      const prev = p.err ? `<div class="gr-msg bad">${esc(p.err)}</div>` : p.g ? `<div class="gr-prev">${MX.texHTML((p.g.kind === 'fn' && !p.g.piecewise ? 'y = ' : '') + p.g.tex)}</div>` : '';
      return `<div class="gr-row${f.show ? '' : ' off'}" data-i="${i}">
        <button type="button" class="gr-sw ${colorClass(f.color)}" style="${colorStyle(f.color)}" data-gr="color" data-i="${i}" aria-label="Color for graph ${i + 1}: ${esc(colorName(f.color))}. Change it" aria-haspopup="dialog"></button>
        <label class="sr" for="gr-in-${i}">Graph ${i + 1}</label>
        <input id="gr-in-${i}" class="gr-in" type="text" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" data-gr="src" data-i="${i}" value="${esc(f.src)}" placeholder="for example 2x - 3" aria-describedby="gr-prev-${i}">
        <button type="button" class="gr-ic" data-gr="show" data-i="${i}" aria-pressed="${f.show}" aria-label="${f.show ? 'Hide' : 'Show'} graph ${i + 1}">${f.show ? EYE : EYE_OFF}</button>
        <button type="button" class="gr-ic" data-gr="del" data-i="${i}" aria-label="Remove graph ${i + 1}">${XS}</button>
        <div class="gr-prevwrap" id="gr-prev-${i}">${prev}</div>
      </div>`;
    }).join('');
    el.innerHTML = `<div class="gr-list">${rows}</div>
      ${S.fns.length < MAX_FNS ? '<button type="button" class="btn ghost gr-add" data-gr="add">+ Add a graph</button>' : '<p class="gr-note">That’s the most graphs at once (8).</p>'}
      <details class="gr-help"><summary>What can I type?</summary><table>
        <tr><td><code>2x - 3</code>, <code>y = x^2</code></td><td>functions of x</td></tr>
        <tr><td><code>sqrt(x+4)</code>, <code>|x - 1|</code></td><td>square roots, absolute value</td></tr>
        <tr><td><code>2^x</code>, <code>ln(x)</code>, <code>log_2(x)</code></td><td>exponentials and logs</td></tr>
        <tr><td><code>sin(x)</code>, <code>3cos(2x)</code>, <code>pi</code></td><td>trig (x in radians)</td></tr>
        <tr><td><code>x+1 if x&lt;0; x^2 if x&gt;=0</code></td><td>piecewise: pieces separated by ;</td></tr>
        <tr><td><code>x^2 + y^2 = 9</code>, <code>x = 3</code></td><td>equations in x and y (circles, vertical lines)</td></tr>
      </table></details>`;
  }
  function renderDrawPanel() {
    const el = d.getElementById('gr-draw-panel');
    el.hidden = S.mode !== 'draw';
    if (el.hidden) return;
    const tool = TOOLS.find((t) => t.id === S.tool);
    let target = '';
    try { if (S.target.trim()) target = MX.texHTML(P.read(S.target).tex); } catch (e) { target = `<span class="bad">${esc(e.message)}</span>`; }
    const r = S.result;
    el.innerHTML = `<div class="gr-tools" role="radiogroup" aria-label="Drawing tool">${TOOLS.map((t) => `<button type="button" role="radio" aria-checked="${t.id === S.tool}" data-gr="tool" data-t="${t.id}">${TOOL_ICON[t.id]}<span>${t.name}</span></button>`).join('')}</div>
      <p class="gr-hint">${esc(tool.hint)}${S.pending ? ' <b>Now tap the second point.</b>' : ''}</p>
      <div class="gr-actions"><button type="button" class="btn ghost sm" data-gr="undo"${S.items.length || S.pending ? '' : ' disabled'}>Undo</button><button type="button" class="btn ghost sm" data-gr="clear"${S.items.length ? '' : ' disabled'}>Clear</button></div>
      <label class="gr-tlbl" for="gr-target">My drawing is the graph of</label>
      <input id="gr-target" class="gr-in wide" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" data-gr="target" value="${esc(S.target)}" placeholder="for example y = 2x - 3">
      <div class="gr-prevwrap">${target ? `<div class="gr-prev">${target}</div>` : ''}</div>
      <button type="button" class="btn primary" data-gr="check">Check my graph</button>
      <div class="gr-result" aria-live="polite">${r ? `<div class="gr-res ${r.ok ? 'ok' : 'no'}"><b>${r.ok ? '✓ Correct' : '✗ Not yet'}</b><ul>${r.msgs.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
        ${r.target ? `<label class="gr-chk"><input type="checkbox" data-gr="answer"${S.showAnswer ? ' checked' : ''}> Show the correct graph</label>` : ''}</div>` : ''}</div>`;
  }
  function renderWin() {
    const w = S.win, f = (v) => String(Math.round(v * 1e6) / 1e6);
    const cur = PRESETS.find((p) => ['xmin', 'xmax', 'ymin', 'ymax', 'xstep', 'ystep'].every((k) => Math.abs(p.win[k] - w[k]) < 1e-9));
    d.getElementById('gr-win-body').innerHTML = `<div class="gr-presets">${PRESETS.map((p) => `<button type="button" class="chipb${cur === p ? ' on' : ''}" data-gr="preset" data-p="${p.id}">${p.name}</button>`).join('')}</div>
      <div class="gr-wgrid">
        ${[['xmin', 'x from'], ['xmax', 'x to'], ['xstep', 'x tick every'], ['ymin', 'y from'], ['ymax', 'y to'], ['ystep', 'y tick every']].map(([k, l]) => `<label>${l}<input type="text" inputmode="decimal" data-gr="win" data-k="${k}" value="${f(w[k])}"></label>`).join('')}
      </div><p class="gr-note">Ticks can be any spacing: 1, 2, 5, 10, 0.5… Points you plot snap to the ticks${w.xstep >= 5 || w.ystep >= 5 ? ' (to a fifth of a tick when ticks are 5 or more apart)' : ''}.</p>`;
  }
  function renderModes() {
    ['graph', 'draw'].forEach((m) => { const b = d.getElementById('gr-tab-' + m); b.setAttribute('aria-selected', String(S.mode === m)); b.tabIndex = S.mode === m ? 0 : -1; });
    const svg = d.getElementById('gr-svg');
    svg.classList.toggle('drawing', S.mode === 'draw');
    svg.setAttribute('aria-label', S.mode === 'draw' ? 'Drawing area: a coordinate plane' : 'Graphs on a coordinate plane');
  }

  // ---------- the plot ----------
  let dims = { W: 600, H: 600 };
  function plane() { return P.plane(S.win, dims.W, dims.H); }
  function drawPlot() {
    const box = d.getElementById('gr-plot');
    if (!box || !box.clientWidth) return;
    const W = Math.round(box.clientWidth), H = Math.round(Math.min(Math.max(W * 0.9, 300), 640));
    dims = { W, H };
    const svg = d.getElementById('gr-svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    const pl = plane();
    let b = `<defs><clipPath id="gr-clip"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath></defs>` + pl.body;
    b += '<g clip-path="url(#gr-clip)">';
    if (S.mode === 'graph') {
      S.fns.forEach((f, i) => {
        const p = S.parsed[i];
        if (!f.show || !p || !p.g) return;
        const segs = P.curves(p.g, S.win, Math.min(900, W));
        b += `<path class="gr-curve ${colorClass(f.color)}" style="${colorStyle(f.color)}" d="${P.path(segs, pl)}"/>`;
        (p.g.dots || []).forEach((q) => { if (q.x >= S.win.xmin && q.x <= S.win.xmax && q.y >= S.win.ymin && q.y <= S.win.ymax) b += `<circle class="gr-dot ${q.closed ? 'closed' : 'open'} ${colorClass(f.color)}" style="${colorStyle(f.color)}" cx="${pl.X(q.x).toFixed(1)}" cy="${pl.Y(q.y).toFixed(1)}" r="4.5"/>`; });
      });
      if (S.hover) b += hoverLayer(pl);
    } else {
      if (S.result && S.showAnswer && S.result.target) b += `<path class="gr-answer" d="${P.path(S.result.target, pl)}"/>`;
      b += drawnLayer(pl);
      if (S.result && !S.result.ok && S.result.off) b += S.result.off.map((p) => `<circle class="gr-off" cx="${pl.X(p[0]).toFixed(1)}" cy="${pl.Y(p[1]).toFixed(1)}" r="2.6"/>`).join('');
    }
    b += '</g>' + pl.labels;
    svg.innerHTML = b;
  }
  function hoverLayer(pl) {
    const x = S.hover.x;
    let b = `<line class="gr-cross" x1="${pl.X(x).toFixed(1)}" y1="0" x2="${pl.X(x).toFixed(1)}" y2="${dims.H}"/>`;
    const rows = [];
    S.fns.forEach((f, i) => {
      const p = S.parsed[i];
      if (!f.show || !p || !p.g || p.g.kind !== 'fn') return;
      const y = p.g.f(x);
      if (!isFinite(y)) return;
      rows.push({ f, i, y });
      if (y >= S.win.ymin && y <= S.win.ymax) b += `<circle class="gr-hdot ${colorClass(f.color)}" style="${colorStyle(f.color)}" cx="${pl.X(x).toFixed(1)}" cy="${pl.Y(y).toFixed(1)}" r="5"/>`;
    });
    const tip = d.getElementById('gr-tip');
    const n = (v) => P.fmt(Math.round(v * 1000) / 1000);
    tip.innerHTML = `<div class="gr-tx">x = ${n(x)}</div>` + rows.map((r) => `<div><span class="gr-key ${colorClass(r.f.color)}" style="${colorStyle(r.f.color)}"></span>y = ${n(r.y)}</div>`).join('');
    tip.hidden = false;
    const left = pl.X(x) + 14, w = 140;
    tip.style.left = (left + w > dims.W ? pl.X(x) - w - 14 : left) + 'px';
    tip.style.top = Math.max(4, Math.min(dims.H - 90, S.hover.py - 40)) + 'px';
    return b;
  }
  const drawnLayer = (pl) => drawnItems(S, pl);

  // ---------- events ----------
  function svgPoint(ev) {
    const svg = d.getElementById('gr-svg'), r = svg.getBoundingClientRect();
    const px = ((ev.clientX - r.left) / r.width) * dims.W, py = ((ev.clientY - r.top) / r.height) * dims.H;
    return { px, py, m: plane().inv(px, py) };
  }
  function wire(root) {
    root.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-gr]');
      if (!b) { if (!ev.target.closest('#gr-pop')) closePop(); return; }
      const a = b.dataset.gr, i = +b.dataset.i;
      if (a === 'mode') { S.mode = b.dataset.mode; S.hover = null; d.getElementById('gr-tip').hidden = true; save(); refresh(); if (MX.onGrapherMode) MX.onGrapherMode(); }
      else if (a === 'add') { S.fns.push({ src: '', color: nextColor(), show: true }); parseAll(); refresh(); const inp = d.getElementById('gr-in-' + (S.fns.length - 1)); if (inp) inp.focus(); save(); }
      else if (a === 'del') { S.fns.splice(i, 1); parseAll(); refresh(); save(); }
      else if (a === 'show') { S.fns[i].show = !S.fns[i].show; refresh(); save(); }
      else if (a === 'color') openPop(i, b);
      else if (a === 'pick') { if (S.colorFor >= 0) { S.fns[S.colorFor].color = b.dataset.c; closePop(); refresh(); save(); } }
      else if (a === 'preset') { const p = PRESETS.find((x) => x.id === b.dataset.p); if (p) { S.win = P.cleanWin(Object.assign({}, p.win)); S.result = null; renderWin(); drawPlot(); save(); } }
      else if (a === 'zoom') zoom(+b.dataset.z);
      else if (a === 'tool') { S.tool = b.dataset.t; S.pending = null; renderDrawPanel(); drawPlot(); }
      else if (a === 'undo') { if (S.pending) S.pending = null; else S.items.pop(); S.result = null; renderDrawPanel(); drawPlot(); }
      else if (a === 'clear') { S.items = []; S.pending = null; S.result = null; renderDrawPanel(); drawPlot(); }
      else if (a === 'check') check();
      else if (a === 'answer') { S.showAnswer = b.checked; drawPlot(); }
    });
    root.addEventListener('input', (ev) => {
      const t = ev.target, a = t.dataset && t.dataset.gr;
      if (a === 'src') {
        const i = +t.dataset.i;
        S.fns[i].src = t.value;
        parseAll();
        const p = S.parsed[i], box = d.getElementById('gr-prev-' + i);
        box.innerHTML = p.err ? `<div class="gr-msg bad">${esc(p.err)}</div>` : p.g ? `<div class="gr-prev">${MX.texHTML((p.g.kind === 'fn' && !p.g.piecewise ? 'y = ' : '') + p.g.tex)}</div>` : '';
        drawPlot(); save();
      } else if (a === 'target') {
        S.target = t.value; S.result = null;
        const box = t.nextElementSibling;
        let html = '';
        try { if (t.value.trim()) html = `<div class="gr-prev">${MX.texHTML(P.read(t.value).tex)}</div>`; } catch (e) { html = `<div class="gr-msg bad">${esc(e.message)}</div>`; }
        box.innerHTML = html;
        const res = root.querySelector('.gr-result'); if (res) res.innerHTML = '';
        drawPlot();
      } else if (a === 'win') {
        const v = MX.evalAST ? safeNum(t.value) : +t.value;
        if (isFinite(v)) {
          const w = Object.assign({}, S.win, { [t.dataset.k]: v });
          if (w.xmax > w.xmin && w.ymax > w.ymin && w.xstep > 0 && w.ystep > 0) { S.win = P.cleanWin(w); t.classList.remove('bad'); S.result = null; drawPlot(); save(); } else t.classList.add('bad');
        } else t.classList.add('bad');
      }
    });
    root.addEventListener('change', (ev) => { if (ev.target.dataset && ev.target.dataset.gr === 'win') renderWin(); if (ev.target.id === 'gr-custom' && S.colorFor >= 0) { S.fns[S.colorFor].color = ev.target.value.toLowerCase(); closePop(); refresh(); save(); } });
    root.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') closePop();
      if (ev.key === 'Enter' && ev.target.id === 'gr-target') check();
      const tab = ev.target.closest && ev.target.closest('[role="tab"]');
      if (tab && (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft')) { S.mode = S.mode === 'graph' ? 'draw' : 'graph'; refresh(); d.getElementById('gr-tab-' + S.mode).focus(); save(); if (MX.onGrapherMode) MX.onGrapherMode(); }
    });
    const svg = d.getElementById('gr-svg');
    svg.addEventListener('pointermove', (ev) => {
      const q = svgPoint(ev);
      if (S.mode === 'graph') { S.hover = { x: q.m[0], py: q.py }; drawPlot(); return; }
      if (S.drawing) { const last = S.drawing[S.drawing.length - 1]; const pl = plane(); if (!last || Math.hypot(pl.X(last[0]) - q.px, pl.Y(last[1]) - q.py) > 2) S.drawing.push(q.m); drawPlot(); }
      else if (S.pending) { S.pending.b = P.snap(q.m, S.win); drawPlot(); }
    });
    svg.addEventListener('pointerleave', () => { if (S.mode === 'graph') { S.hover = null; d.getElementById('gr-tip').hidden = true; drawPlot(); } });
    svg.addEventListener('pointerdown', (ev) => {
      if (S.mode !== 'draw') return;
      ev.preventDefault();
      const q = svgPoint(ev);
      if (S.tool === 'pen') { S.drawing = [q.m]; svg.setPointerCapture(ev.pointerId); S.result = null; }
    });
    svg.addEventListener('pointerup', (ev) => {
      if (S.mode !== 'draw') return;
      const q = svgPoint(ev), sp = P.snap(q.m, S.win);
      if (S.tool === 'pen') {
        if (S.drawing && S.drawing.length > 1) S.items.push({ t: 'stroke', pts: S.drawing });
        S.drawing = null;
      } else if (S.tool === 'point') S.items.push({ t: 'point', p: sp });
      else if (!S.pending) S.pending = { t: S.tool, a: sp };
      else if (sp[0] !== S.pending.a[0] || sp[1] !== S.pending.a[1]) {
        if (P.shape(S.tool, S.pending.a, sp, S.win)) { S.items.push({ t: S.tool, a: S.pending.a, b: sp }); S.pending = null; }
      }
      S.result = null;
      renderDrawPanel(); drawPlot();
    });
  }
  function safeNum(s) {
    try { const n = MX.parse(MX.normalizeInput(String(s))); if (MX.ast.vars(n).size) return NaN; return MX.evalAST(n, {}); } catch (e) { return NaN; }
  }
  function zoom(k) {
    const w = S.win, cx = (w.xmin + w.xmax) / 2, cy = (w.ymin + w.ymax) / 2, hx = ((w.xmax - w.xmin) / 2) * k, hy = ((w.ymax - w.ymin) / 2) * k;
    const nice = (v) => { const p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; };
    S.win = P.cleanWin({ xmin: cx - hx, xmax: cx + hx, ymin: cy - hy, ymax: cy + hy, xstep: nice((2 * hx) / 20), ystep: nice((2 * hy) / 20) });
    S.result = null; renderWin(); drawPlot(); save();
  }
  function check() {
    if (!S.target.trim()) { S.result = { ok: false, msgs: ['Type what your drawing is the graph of, like y = 2x - 3.'] }; renderDrawPanel(); return; }
    let g;
    try { g = P.read(S.target); } catch (e) { S.result = { ok: false, msgs: [e.message] }; renderDrawPanel(); return; }
    S.result = P.checkDrawing(g, S.items, S.win);
    S.showAnswer = false;
    renderDrawPanel(); drawPlot();
    const btn = d.querySelector('#gr-draw-panel [data-gr="check"]'); if (btn) btn.focus();
  }
  function openPop(i, anchor) {
    S.colorFor = i;
    const pop = d.getElementById('gr-pop'), cur = S.fns[i].color;
    pop.innerHTML = `<div class="gr-pop-h">Color for graph ${i + 1}</div><div class="gr-sws">${P.PALETTE.map((p) => `<button type="button" class="gr-sw big gc-${p.id}${cur === p.id ? ' on' : ''}" data-gr="pick" data-c="${p.id}" aria-label="${p.name}" aria-pressed="${cur === p.id}"></button>`).join('')}</div>
      <label class="gr-custom">Custom color <input type="color" id="gr-custom" value="${/^#/.test(cur) ? cur : P.colorOf(cur, false)}"></label>`;
    pop.hidden = false;
    const r = anchor.getBoundingClientRect(), pr = S.root.getBoundingClientRect();
    pop.style.left = Math.max(0, Math.min(r.left - pr.left, pr.width - 230)) + 'px';
    pop.style.top = (r.bottom - pr.top + 6) + 'px';
    const first = pop.querySelector('.on') || pop.querySelector('button'); if (first) first.focus();
  }
  function closePop() { const pop = d.getElementById('gr-pop'); if (pop && !pop.hidden) { pop.hidden = true; S.colorFor = -1; } }
  function refresh() { renderModes(); renderGraphPanel(); renderDrawPanel(); drawPlot(); }

  // ---------- icons ----------
  const EYE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  const EYE_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><path d="M4 4l16 16"/></svg>';
  const XS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  const TOOL_ICON = {
    pen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 19c4-1 5-8 9-8s4 5 9 3"/></svg>',
    point: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" class="f"/></svg>',
    line: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20 21 4"/><circle cx="8" cy="15.5" r="2" class="f"/><circle cx="16" cy="8.4" r="2" class="f"/></svg>',
    parabola: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3c2 12 4 15 8 15s6-3 8-15"/><circle cx="12" cy="18" r="2" class="f"/></svg>',
    circle: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="1.8" class="f"/></svg>',
  };

  // ---------- the drawing widget used by "graph it" practice questions ----------
  // Rendered as HTML by the problem card; its state lives here, keyed by element id. The answer value is the
  // encoded drawing (P.encode), kept in data-v; every change fires 'mq-change' so drafts are saved.
  const DQ = new Map();
  const DQ_SIZE = 340;
  function dqState(el) {
    let st = DQ.get(el.id);
    if (!st || st.el !== el) {
      let win = P.DEFAULT_WIN;
      try { win = P.cleanWin(JSON.parse(el.dataset.win || '{}')); } catch (e) { /* default window */ }
      const tools = (el.dataset.tools || 'pen,point,line,parabola').split(',');
      st = { el, win, tools, tool: tools[0], items: P.decode(el.dataset.v || ''), pending: null, drawing: null, dis: el.hasAttribute('data-dis'), ans: el.dataset.ans || '' };
      DQ.set(el.id, st);
    }
    return st;
  }
  function dqSvg(st) {
    const pl = P.plane(st.win, DQ_SIZE, DQ_SIZE);
    let b = pl.body + '<g>';
    if (st.ans) { try { b += `<path class="gr-answer" d="${P.path(P.curves(P.read(st.ans), st.win, 400), pl)}"/>`; } catch (e) { /* nothing to overlay */ } }
    b += drawnItems(st, pl) + '</g>' + pl.labels;
    return b;
  }
  function drawnItems(st, pl) {
    let b = '';
    const pt = (p, cls = 'gr-pt') => `<circle class="${cls}" cx="${pl.X(p[0]).toFixed(1)}" cy="${pl.Y(p[1]).toFixed(1)}" r="5"/>`;
    st.items.forEach((it) => {
      if (it.t === 'point') b += pt(it.p);
      else if (it.t === 'stroke') b += `<path class="gr-ink" d="${P.path([it.pts], pl)}"/>`;
      else {
        const sh = P.shape(it.t, it.a, it.b, st.win);
        if (sh) b += `<path class="gr-ink" d="${P.path(sh.segs, pl)}"/>`;
        b += pt(it.a, 'gr-pt anchor') + pt(it.b, 'gr-pt anchor');
      }
    });
    if (st.drawing) b += `<path class="gr-ink" d="${P.path([st.drawing], pl)}"/>`;
    if (st.pending) {
      b += pt(st.pending.a, 'gr-pt anchor');
      if (st.pending.b) { const sh = P.shape(st.pending.t, st.pending.a, st.pending.b, st.win); if (sh) b += `<path class="gr-ink ghost" d="${P.path(sh.segs, pl)}"/>`; }
    }
    return b;
  }
  function dqToolbar(st) {
    return st.tools.map((t) => { const T = TOOLS.find((x) => x.id === t); return T ? `<button type="button" role="radio" aria-checked="${t === st.tool}" data-dq="tool" data-t="${t}" title="${esc(T.hint)}">${TOOL_ICON[t]}<span>${T.name}</span></button>` : ''; }).join('');
  }
  function dqRender(st) {
    const el = st.el;
    el.querySelector('.dq-svg').innerHTML = dqSvg(st);
    const tb = el.querySelector('.dq-tools');
    if (tb) tb.innerHTML = dqToolbar(st);
    const hint = el.querySelector('.dq-hint');
    if (hint) { const T = TOOLS.find((x) => x.id === st.tool); hint.textContent = (T ? T.hint : '') + (st.pending ? ' Now tap the second point.' : ''); }
  }
  function dqChanged(st) {
    st.el.dataset.v = P.encode(st.items, st.win);
    st.el.dispatchEvent(new CustomEvent('mq-change', { bubbles: true }));
  }
  function dqPoint(st, ev) {
    const svg = st.el.querySelector('.dq-svg'), r = svg.getBoundingClientRect();
    const pl = P.plane(st.win, DQ_SIZE, DQ_SIZE);
    return pl.inv(((ev.clientX - r.left) / r.width) * DQ_SIZE, ((ev.clientY - r.top) / r.height) * DQ_SIZE);
  }
  const dqOf = (t) => { const el = t && t.closest && t.closest('.drawq'); return el && !el.hasAttribute('data-dis') ? dqState(el) : null; };
  d.addEventListener('pointerdown', (ev) => {
    if (!ev.target.closest || !ev.target.closest('.dq-svg')) return;
    const st = dqOf(ev.target); if (!st) return;
    ev.preventDefault();
    if (st.tool === 'pen') { st.drawing = [dqPoint(st, ev)]; try { ev.target.closest('.dq-svg').setPointerCapture(ev.pointerId); } catch (e) { /* capture is optional */ } }
  });
  d.addEventListener('pointermove', (ev) => {
    if (!ev.target.closest || !ev.target.closest('.dq-svg')) return;
    const st = dqOf(ev.target); if (!st) return;
    const m = dqPoint(st, ev);
    if (st.drawing) { st.drawing.push(m); dqRender(st); } else if (st.pending) { st.pending.b = P.snap(m, st.win); dqRender(st); }
  });
  d.addEventListener('pointerup', (ev) => {
    if (!ev.target.closest || !ev.target.closest('.dq-svg')) return;
    const st = dqOf(ev.target); if (!st) return;
    const sp = P.snap(dqPoint(st, ev), st.win);
    if (st.tool === 'pen') { if (st.drawing && st.drawing.length > 1) st.items.push({ t: 'stroke', pts: st.drawing }); st.drawing = null; }
    else if (st.tool === 'point') st.items.push({ t: 'point', p: sp });
    else if (!st.pending) st.pending = { t: st.tool, a: sp };
    else if ((sp[0] !== st.pending.a[0] || sp[1] !== st.pending.a[1]) && P.shape(st.tool, st.pending.a, sp, st.win)) { st.items.push({ t: st.tool, a: st.pending.a, b: sp }); st.pending = null; }
    dqRender(st); dqChanged(st);
  });
  d.addEventListener('click', (ev) => {
    const b = ev.target.closest && ev.target.closest('[data-dq]');
    if (!b) return;
    const st = dqOf(b); if (!st) return;
    const a = b.dataset.dq;
    if (a === 'tool') { st.tool = b.dataset.t; st.pending = null; }
    else if (a === 'undo') { if (st.pending) st.pending = null; else st.items.pop(); dqChanged(st); }
    else if (a === 'clear') { st.items = []; st.pending = null; dqChanged(st); }
    dqRender(st);
  });

  MX.Grapher = {
    render(root, o) {
      if (!S.built || S.root !== root) { load(); build(root); renderWin(); }
      if (o && (o.mode === 'graph' || o.mode === 'draw')) S.mode = o.mode;
      parseAll();
      refresh();
    },
    state: S,
    // o = {id, win, tools:[…], value (encoded drawing), disabled, answer (function to overlay when locked)}
    drawHTML(o) {
      DQ.delete(o.id);
      const win = P.cleanWin(o.win || P.DEFAULT_WIN), tools = (o.tools || ['pen', 'point', 'line', 'parabola']).filter((t) => TOOLS.some((x) => x.id === t));
      const st = { win, tools, tool: tools[0], items: P.decode(o.value || ''), pending: null, drawing: null, ans: o.disabled && o.answer ? o.answer : '' };
      const T = TOOLS.find((x) => x.id === st.tool);
      return `<div class="drawq" id="${esc(o.id)}" data-win="${esc(JSON.stringify(win))}" data-tools="${esc(tools.join(','))}" data-v="${esc(o.value || '')}"${o.disabled ? ' data-dis' : ''}${st.ans ? ` data-ans="${esc(st.ans)}"` : ''}>
        ${o.disabled ? '' : `<div class="dq-tools gr-tools" role="radiogroup" aria-label="Drawing tool">${dqToolbar(st)}</div><p class="dq-hint">${esc(T ? T.hint : '')}</p>`}
        <svg class="dq-svg${o.disabled ? '' : ' drawing'}" viewBox="0 0 ${DQ_SIZE} ${DQ_SIZE}" role="img" aria-label="${o.disabled ? 'Your graph' : 'Drawing area: a coordinate plane'}">${dqSvg(st)}</svg>
        ${o.disabled ? (st.ans ? '<p class="dq-key"><span class="dq-sw"></span> the correct graph</p>' : '') : '<div class="gr-actions"><button type="button" class="btn ghost sm" data-dq="undo">Undo</button><button type="button" class="btn ghost sm" data-dq="clear">Clear</button></div>'}
      </div>`;
    },
    drawValue(id) { const el = d.getElementById(id); return el ? el.dataset.v || '' : ''; },
  };
})(typeof window !== 'undefined' ? window : globalThis);

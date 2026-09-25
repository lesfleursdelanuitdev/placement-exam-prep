/* app.js: exam, tutorials and progress views */
(function (G) {
  'use strict';
  const MX = G.MX;
  const Store = MX.Store;
  const GEN_VERSION = 1;
  const d = G.document;

  const SECTION_ORDER = ['Polynomials & exponents', 'Factoring', 'Rational expressions', 'Radicals', 'Equations & inequalities', 'Graphs, lines & systems', 'Word problems'];
  const WORD_ORDER = ['w-proportion', 'w-percent', 'w-sci', 'w-ineq', 'w-perimeter', 'w-pyth', 'w-triangles', 'w-linear', 'w-motion', 'w-mixture', 'w-systems'];
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const R = MX.rich;
  const byId = (id) => d.getElementById(id);

  function orderedTopics() {
    const skills = MX.topics.filter((t) => t.kind !== 'word').slice().sort((a, b) => SECTION_ORDER.indexOf(a.section) - SECTION_ORDER.indexOf(b.section));
    const words = WORD_ORDER.map((id) => MX.byId[id]).filter(Boolean);
    return [...skills, ...words];
  }
  const slotsOf = (t) => t.slots || [{ pool: Object.keys(t.variants) }];
  const allVariants = (t) => Object.keys(t.variants);

  // ================= exam model =================
  function buildExam(seed) {
    const items = [];
    for (const t of orderedTopics()) {
      const used = new Set(), usedCtx = new Set();
      slotsOf(t).forEach((slot, si) => {
        const rng = MX.rngFor(seed, t.id + '#' + si);
        let pool = slot.pool.filter((v) => !used.has(v));
        if (!pool.length) pool = slot.pool;
        const vk = rng.pick(pool);
        used.add(vk);
        let q, tries = 0;
        do {
          q = t.variants[vk].gen(MX.rngFor(seed, t.id + '#' + si + '|' + vk + '|' + tries));
          tries++;
        } while (t.distinctContexts && q.ctx && usedCtx.has(q.ctx) && tries < 20);
        if (q.ctx) usedCtx.add(q.ctx);
        items.push({ key: t.id + '#' + si, topic: t, slot, variant: vk, q, n: items.length + 1 });
      });
    }
    return items;
  }
  const newSeed = () => {
    try { const a = new Uint32Array(1); G.crypto.getRandomValues(a); return 'e' + a[0].toString(36); } catch (e) { return 'e' + Math.floor(Math.random() * 1e9).toString(36); }
  };

  const App = { items: [], view: 'exam', tutId: null, returnItem: -1, returnView: 'tutorials', lastFocus: null };
  G.MX.App = App;

  function examState() { return Store.state.exam; }
  function startNewExam() {
    const prev = Store.state.exam;
    Store.state.exam = { no: prev ? prev.no + 1 : 1, seed: newSeed(), gv: GEN_VERSION, started: Date.now(), finished: null, res: {} };
    App.items = buildExam(Store.state.exam.seed);
    Store.save();
  }
  function ensureExam() {
    const ex = Store.state.exam;
    if (!ex || ex.gv !== GEN_VERSION) startNewExam();
    else App.items = buildExam(ex.seed);
  }
  function scoreOf(items, res) {
    let earned = 0, total = 0, parts = 0, done = 0;
    const byTopic = {};
    items.forEach((it) => {
      const rr = res[it.key] || {};
      it.q.parts.forEach((p, pi) => {
        total += p.points; parts++;
        const bt = (byTopic[it.topic.id] = byTopic[it.topic.id] || [0, 0]);
        bt[1] += p.points;
        const r = rr[pi];
        if (r && r.ok !== undefined) { done++; if (r.ok) { earned += p.points; bt[0] += p.points; } }
      });
    });
    return { earned, total, parts, done, byTopic, pct: total ? Math.round((100 * earned) / total) : 0 };
  }
  function itemStatus(it, res) {
    const rr = res[it.key] || {};
    let locked = 0, ok = 0;
    it.q.parts.forEach((p, pi) => { const r = rr[pi]; if (r && r.ok !== undefined) { locked++; if (r.ok) ok++; } });
    if (!locked) return '';
    if (locked < it.q.parts.length) return 'part';
    return ok === locked ? 'ok' : ok === 0 ? 'bad' : 'mix';
  }

  // ================= problem rendering =================
  // REG maps a card id to { q, mode, getRes(pi), setRes(pi, r), after() }
  const REG = new Map();
  const PH = { num: 'answer', nums: 'value', expr: 'expression', factor: 'e.g. 3(x+2)(x-1)', eq: 'e.g. y = 2x + 5', ineq: 'e.g. x >= -3', point: '(x, y)', points: '(x, y)', sci: 'e.g. 3.2 x 10^5', radpm: 'e.g. (-2+-√10)/3', system: 'e.g. x + y = 40' };
  const showOf = (p) => {
    if (p.show) return p.show;
    if (p.kind === 'choice') return '';
    try { return MX.astTex(MX.parse(p.answer)); } catch (e) { return esc(p.answer); }
  };
  function textInput(id, kind, val, dis, extraCls) {
    return `<span class="blank${extraCls ? ' ' + extraCls : ''}"><input id="${id}" class="ans" data-kind="${kind}" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="${esc(PH[kind] || 'answer')}" value="${esc(val || '')}"${dis ? ' disabled' : ''} aria-label="answer"></span>`;
  }
  function inputsHTML(p, base, val, dis) {
    val = val || {};
    const pre = p.pre ? `<span class="pre">${esc(p.pre)}</span>` : '';
    const post = p.post && !p.units ? `<span class="post">${esc(p.post)}</span>` : '';
    const pv = (k) => `<span class="pv" id="pv-${base}-${k}" aria-hidden="true"></span>`;
    switch (p.kind) {
      case 'choice': {
        const cls = p.graph ? 'opts graphs' : p.inline ? 'opts inline' : 'opts list';
        return `<div class="${cls}" role="radiogroup">` + p.options.map((o, k) =>
          `<label class="opt${val.choice != null && +val.choice === k ? ' sel' : ''}${dis && k === p.answer ? ' right' : ''}"><input type="radio" name="${base}" id="${base}-o${k}" value="${k}"${val.choice != null && +val.choice === k ? ' checked' : ''}${dis ? ' disabled' : ''}><span class="optl">${p.graph ? '<span class="ok-letter">' + 'ABCD'[k] + '</span>' : ''}${p.graph ? o : R(o)}</span></label>`).join('') + '</div>';
      }
      case 'nums': {
        const n = p.count || p.answers.length;
        const vs = val.values || [];
        return '<div class="multi">' + pre + Array.from({ length: n }, (_, k) => (k ? `<span class="join">${esc(p.joiner || 'or')}${p.pre ? ' ' + esc(p.pre) : ''}</span>` : '') + `<span class="cell">${textInput(base + '-' + k, 'nums', vs[k], dis, 'short')}${pv(k)}</span>`).join('') + post + '</div>';
      }
      case 'points': {
        const vs = val.values || [];
        return '<div class="multi">' + [0, 1].map((k) => (k ? `<span class="join">${esc(p.joiner || 'and')}</span>` : '') + `<span class="cell">${textInput(base + '-' + k, 'point', vs[k], dis, 'short')}${pv(k)}</span>`).join('') + '</div>';
      }
      case 'system': {
        const vs = val.values || [];
        const labs = p.inputs || ['Equation 1', 'Equation 2'];
        return '<div class="sysin">' + [0, 1].map((k) => `<div class="cell"><span class="pre">${esc(labs[k])}</span>${textInput(base + '-' + k, 'system', vs[k], dis, 'wide')}${pv(k)}</div>`).join('') + '</div>';
      }
      default: {
        let units = '';
        if (p.units) {
          units = `<select id="${base}-u" class="units"${dis ? ' disabled' : ''} aria-label="units"><option value="">units…</option>` +
            p.units.options.map((u) => `<option${val.unit === u ? ' selected' : ''}>${esc(u)}</option>`).join('') + '</select>';
        }
        const wide = ['expr', 'factor', 'eq', 'radpm', 'sci'].includes(p.kind) ? 'wide' : '';
        return `<div class="single">${pre}<span class="cell">${textInput(base + '-0', p.kind === 'point' ? 'point' : p.kind, val.value, dis, wide)}${pv(0)}</span>${units}${post}</div>`;
      }
    }
  }
  function readInput(base, p) {
    if (p.kind === 'choice') {
      const c = d.querySelector(`input[name="${base}"]:checked`);
      return { choice: c ? c.value : null };
    }
    if (p.kind === 'nums' || p.kind === 'points' || p.kind === 'system') {
      const n = p.kind === 'nums' ? p.count || p.answers.length : 2;
      return { values: Array.from({ length: n }, (_, k) => (byId(base + '-' + k) || {}).value || '') };
    }
    const u = byId(base + '-u');
    return { value: (byId(base + '-0') || {}).value || '', unit: u ? u.value : undefined };
  }

  function feedbackHTML(p, r, mode) {
    if (!r) return '';
    if (r.ok === true) return `<span class="mark ok">✓</span> Correct${mode === 'exam' ? ` <b>+${p.points}</b>` : r.tries > 1 ? ' (after ' + r.tries + ' tries)' : ''}`;
    if (r.revealed) return `<span class="mark rv">→</span> Answer: ${p.kind === 'choice' ? 'option ' + (p.graph ? 'ABCD'[p.answer] : '') + (p.graph ? '' : R(p.options[p.answer])) : R('\\(' + showOf(p) + '\\)')}`;
    if (r.ok === false && mode === 'exam') {
      const ans = p.kind === 'choice' ? (p.graph ? 'graph ' + 'ABCD'[p.answer] : R(p.options[p.answer])) : R('\\(' + showOf(p) + '\\)');
      return `<span class="mark bad">✗</span> ${r.skipped ? 'Not answered' : 'Not quite'}${r.msg ? ': ' + esc(r.msg) : '.'} <span class="corr">Answer: ${ans}</span>`;
    }
    if (r.ok === false) return `<span class="mark bad">✗</span> Not quite${r.msg ? ': ' + esc(r.msg) : '.'} Try again, or show the answer.`;
    return '';
  }

  function partHTML(cardId, p, pi, r, mode, forceLock) {
    const base = cardId + '-' + pi;
    const locked = forceLock || (r && (mode === 'exam' ? r.ok !== undefined : r.ok === true || r.revealed));
    const val = r && r.val;
    const label = p.label ? `<span class="plabel">${esc(p.label)})</span>` : '';
    const ask = p.ask ? `<div class="ask">${label}${R(p.ask)}</div>` : label ? `<div class="ask">${label}</div>` : '';
    let btns = '';
    if (!locked) {
      btns = `<button type="button" class="btn chk" data-act="check" data-card="${cardId}" data-p="${pi}">Check</button>`;
      if (mode === 'tut' && r && r.ok === false) btns += `<button type="button" class="btn ghost" data-act="reveal" data-card="${cardId}" data-p="${pi}">Show answer</button>`;
    }
    const st = r ? (r.ok === true ? ' is-ok' : r.revealed ? ' is-rv' : r.ok === false ? ' is-bad' : '') : '';
    const fbCls = r ? (r.ok === true ? 'ok' : r.revealed ? 'rv' : r.ok === false ? 'bad' : '') : '';
    return `<div class="part${st}${locked ? ' locked' : ''}" id="pt-${base}">
      ${ask}
      <div class="line">${inputsHTML(p, base, val, locked)}<span class="acts">${btns}</span>${mode === 'exam' ? `<span class="pts">(${p.points})</span>` : ''}</div>
      <div class="fb ${fbCls}" id="fb-${base}" role="status" aria-live="polite">${feedbackHTML(p, r, mode)}</div>
    </div>`;
  }
  function solutionHTML(cardId, q, available, open) {
    if (!available) return `<div class="sol-wait" id="sol-${cardId}">Answer every part to unlock the worked solution.</div>`;
    return `<details class="sol" id="sol-${cardId}"${open ? ' open' : ''}><summary>Worked solution</summary><ol>${q.solution.map((s) => `<li>${R(s)}</li>`).join('')}</ol></details>`;
  }
  function allLocked(q, res, mode) {
    return q.parts.every((p, pi) => { const r = res[pi]; return r && (mode === 'exam' ? r.ok !== undefined : r.ok === true || r.revealed); });
  }

  // one problem card; o = {cardId, mode, num, res, head, forceLock}
  function cardHTML(q, o) {
    const res = o.res || {};
    const unlocked = o.forceLock || allLocked(q, res, o.mode);
    const vis = q.visual ? `<figure class="vis">${q.visual}</figure>` : '';
    return `<article class="card${q.visual ? ' has-vis' : ''}" id="card-${o.cardId}" data-card="${o.cardId}">
      ${o.head || ''}
      <div class="qbody">
        ${o.num ? `<div class="qnum">${esc(o.num)}</div>` : ''}
        <div class="qmain">
          <div class="prompt">${R(q.prompt)}</div>
          ${vis}
          <div class="parts">${q.parts.map((p, pi) => partHTML(o.cardId, p, pi, res[pi], o.mode, o.forceLock)).join('')}</div>
          ${solutionHTML(o.cardId, q, unlocked, false)}
        </div>
      </div>
    </article>`;
  }
  function workedHTML(q, k) {
    const vis = q.visual ? `<figure class="vis">${q.visual}</figure>` : '';
    const ans = q.parts.map((p) => `<li>${p.ask ? R(p.ask) + ': ' : ''}${p.kind === 'choice' ? (p.graph ? `<span class="mini-graph">${p.options[p.answer]}</span>` : R(p.options[p.answer])) : R('\\(' + showOf(p) + '\\)')}</li>`).join('');
    return `<article class="card worked${q.visual ? ' has-vis' : ''}">
      <div class="eyebrow">Example ${k + 1}</div>
      <div class="prompt">${R(q.prompt)}</div>${vis}
      <ol class="steps">${q.solution.map((s) => `<li>${R(s)}</li>`).join('')}</ol>
      <div class="wans"><span class="eyebrow">Answer${q.parts.length > 1 ? 's' : ''}</span><ul>${ans}</ul></div>
    </article>`;
  }

  // ================= exam view =================
  function examItemHead(it, i) {
    const t = it.topic;
    const vname = t.variants[it.variant].name;
    const kind = t.kind === 'word' ? `${esc(t.title)} · ${esc(vname)}` : esc(t.title);
    return `<header class="qhead"><span class="topic">${kind}</span><span class="src">${esc(it.slot.source ? 'Like ' + it.slot.source : 'Seen on ' + t.sources.join(', '))}</span>
      <button type="button" class="btn tut" data-act="tutorial" data-topic="${t.id}" data-item="${i}">Tutorial<span aria-hidden="true"> →</span></button></header>`;
  }
  function renderExam() {
    const ex = examState();
    const res = ex.res;
    const sc = scoreOf(App.items, res);
    const finished = !!ex.finished;
    let html = '', lastSec = null, inWords = false;
    App.items.forEach((it, i) => {
      if (it.topic.kind === 'word') {
        if (!inWords) { inWords = true; html += `<h2 class="part-h"><span>Part II</span> Word problems</h2>`; }
      } else {
        if (i === 0) html += `<h2 class="part-h"><span>Part I</span> Skills</h2>`;
        if (it.topic.section !== lastSec) { lastSec = it.topic.section; html += `<h3 class="sec-h">${esc(lastSec)}</h3>`; }
      }
      const cardId = 'x' + ex.no + '-' + i;
      REG.set(cardId, {
        q: it.q, mode: 'exam', item: i,
        getRes: (pi) => (ex.res[it.key] || {})[pi],
        setRes: (pi, r) => { (ex.res[it.key] = ex.res[it.key] || {})[pi] = r; },
      });
      html += cardHTML(it.q, { cardId, mode: 'exam', num: it.n + '.', res: res[it.key], head: examItemHead(it, i), forceLock: finished });
    });
    byId('exam-list').innerHTML = html;
    renderExamHeader();
    renderNav();
  }
  function renderExamHeader() {
    const ex = examState();
    const sc = scoreOf(App.items, ex.res);
    const started = new Date(ex.started);
    byId('exam-title').textContent = 'Practice Final No. ' + ex.no;
    byId('exam-meta').textContent = `Generated ${started.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · ${App.items.length} questions · ${sc.total} points`;
    byId('sum-earned').textContent = sc.earned;
    byId('sum-total').textContent = sc.total;
    byId('sum-done').textContent = sc.done + ' / ' + sc.parts;
    byId('sum-pct').textContent = sc.done ? Math.round((100 * sc.earned) / Math.max(1, answeredPoints())) + '%' : '–';
    byId('sum-bar').style.width = (100 * sc.done) / sc.parts + '%';
    byId('sum-bar-ok').style.width = (100 * sc.earned) / sc.total + '%';
    const chip = byId('score-chip');
    chip.innerHTML = `<span class="chip-l">Final No. ${ex.no}</span><b>${sc.earned}</b><span>/ ${sc.total}</span>`;
    const fin = byId('exam-finish');
    const done = !!ex.finished;
    fin.hidden = false;
    byId('end-row').hidden = done;
    const rb = byId('results');
    if (done) {
      const weak = Object.entries(sc.byTopic).filter(([, v]) => v[0] < v[1]).map(([k, v]) => [k, v[0] / v[1]]).sort((a, b) => a[1] - b[1]).slice(0, 4);
      rb.hidden = false;
      rb.innerHTML = `<div class="res-score"><span class="big">${sc.earned}</span><span class="of">/ ${sc.total}</span><span class="pc">${sc.pct}%</span></div>
        <div class="res-body"><h2>Exam complete</h2>
        <p>${sc.pct >= 90 ? 'Excellent work.' : sc.pct >= 75 ? 'Solid. A little review will push this higher.' : sc.pct >= 60 ? 'You passed the bar for many courses; review the topics below.' : 'Keep going: work through the tutorials below, then try a fresh exam.'} Your score is saved in Progress.</p>
        ${weak.length ? `<p class="weak-h">Review first:</p><div class="weak">${weak.map(([k]) => `<button type="button" class="btn tut" data-act="tutorial" data-topic="${k}">${esc(MX.byId[k].title)} →</button>`).join('')}</div>` : ''}
        <div class="res-acts"><button type="button" class="btn primary" data-act="new-exam">Generate a new exam</button></div></div>`;
    } else rb.hidden = true;
  }
  function answeredPoints() {
    const ex = examState();
    let t = 0;
    App.items.forEach((it) => it.q.parts.forEach((p, pi) => { const r = (ex.res[it.key] || {})[pi]; if (r && r.ok !== undefined) t += p.points; }));
    return t;
  }
  function renderNav() {
    const ex = examState();
    let html = '';
    App.items.forEach((it, i) => {
      if (i === 0) html += '<div class="nav-sec">Skills</div>';
      if (it.topic.kind === 'word' && (i === 0 || App.items[i - 1].topic.kind !== 'word')) html += '<div class="nav-sec">Word problems</div>';
      const st = itemStatus(it, ex.res);
      html += `<button type="button" class="bub ${st}" data-act="goto" data-item="${i}" title="${esc(it.n + '. ' + it.topic.title)}">${it.n}</button>`;
    });
    byId('nav-bubbles').innerHTML = html;
  }
  function refreshCard(cardId) {
    const reg = REG.get(cardId);
    if (!reg) return;
    const q = reg.q;
    const res = {};
    q.parts.forEach((p, pi) => { res[pi] = reg.getRes(pi); });
    q.parts.forEach((p, pi) => {
      const el = byId('pt-' + cardId + '-' + pi);
      if (!el) return;
      const locked = el.classList.contains('locked');
      const r = res[pi];
      const nowLocked = r && (reg.mode === 'exam' ? r.ok !== undefined : r.ok === true || r.revealed);
      if (nowLocked && !locked) el.outerHTML = partHTML(cardId, p, pi, r, reg.mode);
      else if (!nowLocked) {
        // keep typed values, update buttons and feedback only
        const acts = el.querySelector('.acts');
        if (acts && reg.mode === 'tut' && r && r.ok === false && !acts.querySelector('[data-act="reveal"]')) acts.insertAdjacentHTML('beforeend', `<button type="button" class="btn ghost" data-act="reveal" data-card="${cardId}" data-p="${pi}">Show answer</button>`);
        const fb = byId('fb-' + cardId + '-' + pi);
        fb.className = 'fb ' + (r && r.ok === false ? 'bad' : '');
        fb.innerHTML = feedbackHTML(p, r, reg.mode);
        el.classList.toggle('is-bad', !!(r && r.ok === false));
      }
    });
    const sol = byId('sol-' + cardId);
    const avail = allLocked(q, res, reg.mode);
    if (sol && avail && sol.tagName !== 'DETAILS') sol.outerHTML = solutionHTML(cardId, q, true, reg.mode === 'tut');
  }

  // ================= checking =================
  function showFeedback(cardId, pi, cls, html) {
    const fb = byId('fb-' + cardId + '-' + pi);
    if (!fb) return;
    fb.className = 'fb ' + cls;
    fb.innerHTML = html;
  }
  function doCheck(cardId, pi) {
    const reg = REG.get(cardId);
    if (!reg) return;
    const p = reg.q.parts[pi];
    const base = cardId + '-' + pi;
    const input = readInput(base, p);
    let r;
    try { r = MX.check(p, input); } catch (e) { r = { error: 'Something went wrong reading that answer. Try writing it another way.' }; }
    if (r.error) return showFeedback(cardId, pi, 'err', `<span class="mark">?</span> ${esc(r.error)}`);
    if (r.nudge) return showFeedback(cardId, pi, 'nudge', `<span class="mark">!</span> ${esc(r.nudge)}`);
    const prev = reg.getRes(pi) || {};
    if (reg.mode === 'exam') {
      if (examState().finished) return;
      reg.setRes(pi, { ok: !!r.ok, msg: r.msg || '', val: input });
      Store.save();
      refreshCard(cardId);
      renderExamHeader();
      renderNav();
      maybeFinish();
    } else {
      const tries = (prev.tries || 0) + 1;
      reg.setRes(pi, r.ok ? { ok: true, tries, val: input } : { ok: false, tries, msg: r.msg || '', val: input });
      Store.save();
      refreshCard(cardId);
      renderTutStats();
    }
  }
  function doReveal(cardId, pi) {
    const reg = REG.get(cardId);
    if (!reg) return;
    const prev = reg.getRes(pi) || {};
    reg.setRes(pi, { revealed: true, tries: prev.tries || 0, val: prev.val });
    Store.save();
    refreshCard(cardId);
    renderTutStats();
  }
  function maybeFinish() {
    const ex = examState();
    const sc = scoreOf(App.items, ex.res);
    if (!ex.finished && sc.done === sc.parts) finishExam();
  }
  function finishExam() {
    const ex = examState();
    const sc = scoreOf(App.items, ex.res);
    ex.finished = Date.now();
    // unanswered parts count as 0
    App.items.forEach((it) => it.q.parts.forEach((p, pi) => {
      const rr = (ex.res[it.key] = ex.res[it.key] || {});
      if (!rr[pi] || rr[pi].ok === undefined) rr[pi] = { ok: false, skipped: true };
    }));
    Store.state.history = (Store.state.history || []).filter((h) => h.no !== ex.no);
    Store.state.history.push({ no: ex.no, earned: sc.earned, total: sc.total, started: ex.started, finished: ex.finished, byTopic: sc.byTopic });
    if (Store.state.history.length > 60) Store.state.history = Store.state.history.slice(-60);
    Store.save();
    renderExam();
    byId('results').scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' });
  }
  const prefersReduced = () => G.matchMedia && G.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ================= tutorials =================
  function tutState(id) {
    const all = (Store.state.tut = Store.state.tut || {});
    return (all[id] = all[id] || { batches: [], res: {} });
  }
  function tutProblems(t) {
    const slots = slotsOf(t), vs = allVariants(t);
    const worked = [];
    if (slots.length > 1) slots.slice(0, 3).forEach((s, k) => worked.push(s.pool[0]));
    else { worked.push(vs[0]); worked.push(vs[1 % vs.length]); }
    const wq = worked.map((vk, k) => t.variants[vk].gen(MX.rngFor('tutorial-worked', t.id + '|' + vk + '|' + k)));
    const st = tutState(t.id);
    const ex = [];
    const start = worked.length % vs.length;
    for (let k = 0; k < 3; k++) {
      const vk = vs[(start + k) % vs.length];
      ex.push({ key: 'e' + k, vk, q: t.variants[vk].gen(MX.rngFor('tutorial-ex', t.id + '|' + k)) });
    }
    st.batches.forEach((choice, b) => {
      for (let k = 0; k < 3; k++) {
        const vk = choice && t.variants[choice] ? choice : vs[(b * 3 + k + start) % vs.length];
        ex.push({ key: 'b' + b + '-' + k, vk, q: t.variants[vk].gen(MX.rngFor('tutorial-more', t.id + '|' + b + '|' + k + '|' + vk)) });
      }
    });
    return { wq, ex };
  }
  function tutCounts(id) {
    const st = tutState(id);
    let solved = 0, attempted = 0;
    Object.values(st.res).forEach((rr) => {
      const vals = Object.values(rr);
      if (!vals.length) return;
      attempted++;
      if (vals.every((r) => r.ok === true)) solved++;
    });
    return { solved, attempted };
  }
  function renderTutorial() {
    const t = MX.byId[App.tutId];
    if (!t) return;
    const st = tutState(t.id);
    const { wq, ex } = tutProblems(t);
    const rv = App.returnView || 'tutorials';
    const backText = rv === 'exam' ? (App.returnItem >= 0 && App.items[App.returnItem] ? `← Back to the exam (question ${App.items[App.returnItem].n})` : '← Back to the exam') : rv === 'progress' ? '← Back to progress' : '← All tutorials';
    const back = `<button type="button" class="btn back" data-act="back">${backText}</button>`;
    const vnames = allVariants(t).map((k) => `<span class="vchip">${esc(t.variants[k].name)}</span>`).join('');
    let html = `<div class="tut-top">${back}${rv !== 'tutorials' ? `<button type="button" class="btn ghost" data-act="view" data-view="tutorials">All tutorials</button>` : ''}</div>
      <header class="tut-head"><div class="eyebrow">${esc(t.kind === 'word' ? 'Word problems' : t.section)}</div><h1>${esc(t.title)}</h1>
      <p class="tut-src">On the sample finals: ${esc(t.sources.join(' · '))}</p>
      <div class="vchips" aria-label="Problem types covered">${vnames}</div></header>
      <section class="lesson">${R(t.lesson)}</section>
      <h2 class="sub-h">Worked examples</h2>
      <div class="worked-list">${wq.map((q, k) => workedHTML(q, k)).join('')}</div>
      <h2 class="sub-h">Practice <span id="tut-stats" class="tut-stats"></span></h2>
      <p class="hint">Check as many times as you like. "Show answer" reveals the answer and the worked solution.</p>
      <div class="ex-list">`;
    ex.forEach((e, k) => {
      const cardId = 't-' + t.id + '-' + e.key;
      REG.set(cardId, {
        q: e.q, mode: 'tut',
        getRes: (pi) => (st.res[e.key] || {})[pi],
        setRes: (pi, r) => { (st.res[e.key] = st.res[e.key] || {})[pi] = r; },
      });
      html += cardHTML(e.q, { cardId, mode: 'tut', num: 'Exercise ' + (k + 1), res: st.res[e.key], head: t.kind === 'word' || allVariants(t).length > 1 ? `<header class="qhead"><span class="topic">${esc(t.variants[e.vk].name)}</span></header>` : '' });
    });
    html += `</div><div class="more">
      <label for="more-kind" class="more-l">Generate more exercises</label>
      <select id="more-kind" class="units">${allVariants(t).length > 1 ? '<option value="">Mixed types</option>' : ''}${allVariants(t).map((k) => `<option value="${k}">${esc(t.variants[k].name)}</option>`).join('')}</select>
      <button type="button" class="btn primary" data-act="more">Add 3 exercises</button></div>`;
    byId('tut-page').innerHTML = html;
    renderTutStats();
  }
  function renderTutStats() {
    const el = byId('tut-stats');
    if (!el || !App.tutId) return;
    const t = MX.byId[App.tutId];
    const total = 3 + tutState(t.id).batches.length * 3;
    const c = tutCounts(t.id);
    el.textContent = `${c.solved} of ${total} solved`;
  }
  function moreExercises() {
    const t = MX.byId[App.tutId];
    const sel = byId('more-kind');
    const st = tutState(t.id);
    st.batches.push(sel ? sel.value : '');
    Store.save();
    const n = 3 + (st.batches.length - 1) * 3;
    renderTutorial();
    const cards = d.querySelectorAll('#tut-page .ex-list .card');
    if (cards[n]) cards[n].scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' });
  }
  function renderTutIndex() {
    const groups = {};
    orderedTopics().forEach((t) => { const s = t.kind === 'word' ? 'Word problems' : t.section; (groups[s] = groups[s] || []).push(t); });
    const ex = examState();
    const sc = scoreOf(App.items, ex.res);
    let html = `<header class="page-h"><h1>Tutorials</h1><p>Each topic has a short lesson, worked examples and unlimited practice. Your practice record is saved.</p></header>`;
    SECTION_ORDER.forEach((s) => {
      if (!groups[s]) return;
      html += `<h2 class="sec-h">${esc(s)}</h2><div class="tiles">`;
      groups[s].forEach((t) => {
        const c = tutCounts(t.id);
        const bt = sc.byTopic[t.id];
        const got = bt && Object.values(ex.res).length ? examTopicState(t.id) : '';
        html += `<button type="button" class="tile" data-act="tutorial" data-topic="${t.id}">
          <span class="tile-t">${esc(t.title)}</span>
          <span class="tile-s">${esc(t.sources.join(' · '))}</span>
          <span class="tile-m">${t.kind === 'word' ? Object.keys(t.variants).length + ' problem types · ' : ''}${c.solved ? c.solved + ' solved' : 'not started'}${got}</span></button>`;
      });
      html += '</div>';
    });
    byId('tut-index').innerHTML = html;
  }
  function examTopicState(id) {
    const ex = examState();
    let e = 0, t = 0, any = false;
    App.items.filter((it) => it.topic.id === id).forEach((it) => it.q.parts.forEach((p, pi) => {
      const r = (ex.res[it.key] || {})[pi];
      if (r && r.ok !== undefined) { any = true; t += p.points; if (r.ok) e += p.points; }
    }));
    return any ? ` · exam ${e}/${t}` : '';
  }

  // ================= progress =================
  function renderProgress() {
    const hist = Store.state.history || [];
    const ex = examState();
    const sc = scoreOf(App.items, ex.res);
    const agg = {};
    hist.forEach((h) => Object.entries(h.byTopic || {}).forEach(([k, v]) => { const a = (agg[k] = agg[k] || [0, 0]); a[0] += v[0]; a[1] += v[1]; }));
    if (!ex.finished) App.items.forEach((it) => it.q.parts.forEach((p, pi) => { const r = (ex.res[it.key] || {})[pi]; if (r && r.ok !== undefined) { const a = (agg[it.topic.id] = agg[it.topic.id] || [0, 0]); a[1] += p.points; if (r.ok) a[0] += p.points; } }));
    const best = hist.reduce((m, h) => Math.max(m, Math.round((100 * h.earned) / h.total)), 0);
    const bars = hist.slice(-20);
    const W = 360, Hh = 120, bw = Math.min(28, (W - 40) / Math.max(1, bars.length) - 6);
    let chart = '';
    if (bars.length) {
      let b = '';
      [50, 75, 100].forEach((y) => { const yy = Hh - 20 - (y / 100) * (Hh - 34); b += `<line class="grid" x1="30" x2="${W}" y1="${yy}" y2="${yy}"/><text class="tx tick" x="24" y="${yy + 4}" text-anchor="end">${y}%</text>`; });
      bars.forEach((h, k) => {
        const p = Math.round((100 * h.earned) / h.total), x = 38 + k * (bw + 6), hh = (p / 100) * (Hh - 34);
        b += `<rect class="${k === bars.length - 1 ? 'accf' : 'soft2'}" x="${x}" y="${Hh - 20 - hh}" width="${bw}" height="${hh}" rx="3"/><text class="tx tick" x="${x + bw / 2}" y="${Hh - 6}" text-anchor="middle">${h.no}</text>`;
        if (k === bars.length - 1) b += `<text class="tx small" x="${x + bw / 2}" y="${Hh - 24 - hh}" text-anchor="middle" font-weight="700">${p}%</text>`;
      });
      chart = `<svg class="sv chart" viewBox="0 0 ${W} ${Hh}" width="${W}" height="${Hh}" role="img" aria-label="Exam scores over time">${b}</svg>`;
    }
    const rows = orderedTopics().map((t) => {
      const a = agg[t.id], c = tutCounts(t.id);
      const pct = a && a[1] ? Math.round((100 * a[0]) / a[1]) : null;
      return { t, pct, pts: a, c };
    });
    rows.sort((x, y) => (x.pct == null ? 101 : x.pct) - (y.pct == null ? 101 : y.pct));
    const status = Store.remoteStatus === 'synced' ? 'Saved to your account, so it follows you to other devices.' : 'Saved in this browser.';
    let html = `<header class="page-h"><h1>Progress</h1><p>${esc(status)}</p></header>
      <div class="stats">
        <div class="stat"><span class="stat-n">${hist.length}</span><span class="stat-l">exams finished</span></div>
        <div class="stat"><span class="stat-n">${hist.length ? best + '%' : '–'}</span><span class="stat-l">best score</span></div>
        <div class="stat"><span class="stat-n">${sc.earned}<small>/${sc.total}</small></span><span class="stat-l">current exam (No. ${ex.no})</span></div>
      </div>
      ${chart ? `<h2 class="sub-h">Exam scores</h2><div class="chart-wrap">${chart}</div>` : ''}
      <h2 class="sub-h">History</h2>`;
    html += hist.length
      ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Exam</th><th>Finished</th><th class="num">Score</th><th class="num">%</th></tr></thead><tbody>${hist.slice().reverse().map((h) => `<tr><td>No. ${h.no}</td><td>${new Date(h.finished).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td><td class="num">${h.earned} / ${h.total}</td><td class="num">${Math.round((100 * h.earned) / h.total)}%</td></tr>`).join('')}</tbody></table></div>`
      : `<p class="empty">No finished exams yet. Your first score appears here when you finish Practice Final No. ${ex.no}.</p>`;
    html += `<h2 class="sub-h">By topic <span class="tut-stats">weakest first · all exams</span></h2><div class="tbl-wrap"><table class="tbl topics"><thead><tr><th>Topic</th><th class="num">Exam points</th><th>Accuracy</th><th class="num">Practice solved</th><th></th></tr></thead><tbody>` +
      rows.map((r) => `<tr><td>${esc(r.t.title)}</td><td class="num">${r.pts ? r.pts[0] + ' / ' + r.pts[1] : '–'}</td><td>${r.pct == null ? '<span class="muted">no data</span>' : `<span class="meter"><span style="width:${r.pct}%" class="${r.pct >= 80 ? 'good' : r.pct >= 50 ? 'mid' : 'low'}"></span></span> ${r.pct}%`}</td><td class="num">${r.c.solved}</td><td><button type="button" class="btn tut sm" data-act="tutorial" data-topic="${r.t.id}">Tutorial →</button></td></tr>`).join('') +
      `</tbody></table></div>
      <div class="danger"><button type="button" class="btn ghost" data-act="reset-ask">Reset all progress…</button>
      <span id="reset-confirm" hidden>This erases every exam score and practice record. <button type="button" class="btn danger-btn" data-act="reset-do">Erase everything</button> <button type="button" class="btn ghost" data-act="reset-cancel">Cancel</button></span></div>`;
    byId('prog-page').innerHTML = html;
  }

  // ================= navigation =================
  function setView(v, opts = {}) {
    App.view = v;
    ['exam', 'tutorials', 'tutorial', 'progress'].forEach((k) => { byId('v-' + k).hidden = k !== v; });
    d.querySelectorAll('.tabs [data-view]').forEach((b) => b.setAttribute('aria-current', b.dataset.view === v || (v === 'tutorial' && b.dataset.view === 'tutorials') ? 'page' : 'false'));
    if (v === 'tutorials') renderTutIndex();
    if (v === 'progress') renderProgress();
    if (v === 'tutorial') renderTutorial();
    if (!opts.keepScroll) G.scrollTo(0, 0);
  }
  function gotoItem(i) {
    const it = App.items[i];
    if (!it) return;
    const el = byId('card-x' + examState().no + '-' + i);
    if (el) {
      el.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' });
      el.classList.add('flash');
      setTimeout(() => el.classList.remove('flash'), 1200);
    }
  }

  // ================= keypad =================
  const KEYS = [['√(', '√'], ['^', 'xⁿ'], ['/', '÷'], ['(', '('], [')', ')'], ['±', '±'], ['<=', '≤'], ['>=', '≥'], [' x 10^', '×10ⁿ']];
  function setupKeypad() {
    const kp = byId('keypad');
    kp.innerHTML = KEYS.map(([ins, lab]) => `<button type="button" class="key" data-ins="${esc(ins)}" tabindex="-1">${esc(lab)}</button>`).join('') + `<button type="button" class="key wide" data-ins="no solution" tabindex="-1">no solution</button>`;
    kp.addEventListener('mousedown', (e) => e.preventDefault());
    kp.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ins]');
      const inp = App.lastFocus;
      if (!b || !inp || inp.disabled) return;
      const ins = b.dataset.ins;
      if (ins === 'no solution') inp.value = 'no solution';
      else {
        const s = inp.selectionStart != null ? inp.selectionStart : inp.value.length, en = inp.selectionEnd != null ? inp.selectionEnd : s;
        inp.value = inp.value.slice(0, s) + ins + inp.value.slice(en);
        const c = s + ins.length;
        try { inp.setSelectionRange(c, c); } catch (e2) { /* ignore */ }
      }
      inp.focus();
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    });
    d.addEventListener('focusin', (e) => {
      if (e.target.matches && e.target.matches('input.ans')) { App.lastFocus = e.target; kp.hidden = false; }
    });
    d.addEventListener('focusout', () => {
      setTimeout(() => { const a = d.activeElement; if (!a || !a.matches || !a.matches('input.ans')) kp.hidden = true; }, 150);
    });
  }

  // ================= events =================
  function onClick(e) {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'check') doCheck(b.dataset.card, +b.dataset.p);
    else if (act === 'reveal') doReveal(b.dataset.card, +b.dataset.p);
    else if (act === 'tutorial') {
      App.tutId = b.dataset.topic;
      if (App.view !== 'tutorial') { App.returnView = App.view; App.returnItem = App.view === 'exam' && b.dataset.item != null ? +b.dataset.item : -1; }
      setView('tutorial');
    } else if (act === 'back') {
      const v = App.returnView || 'tutorials', i = App.returnItem;
      if (v === 'exam') { setView('exam', { keepScroll: true }); if (i != null && i >= 0) setTimeout(() => gotoItem(i), 30); else if (examState().finished) byId('results').scrollIntoView({ block: 'start' }); }
      else setView(v);
    }
    else if (act === 'view') setView(b.dataset.view);
    else if (act === 'goto') gotoItem(+b.dataset.item);
    else if (act === 'more') moreExercises();
    else if (act === 'new-exam') { startNewExam(); renderExam(); setView('exam'); }
    else if (act === 'end-ask') { byId('end-confirm').hidden = false; b.hidden = true; }
    else if (act === 'end-cancel') { byId('end-confirm').hidden = true; d.querySelector('[data-act="end-ask"]').hidden = false; }
    else if (act === 'end-do') { byId('end-confirm').hidden = true; d.querySelector('[data-act="end-ask"]').hidden = false; finishExam(); }
    else if (act === 'reset-ask') { byId('reset-confirm').hidden = false; }
    else if (act === 'reset-cancel') { byId('reset-confirm').hidden = true; }
    else if (act === 'reset-do') { Store.reset(); startNewExam(); renderExam(); setView('progress'); }
  }
  function onInput(e) {
    const inp = e.target;
    if (!inp.matches || !inp.matches('input.ans')) return;
    const pvEl = byId('pv-' + inp.id);
    const tex = MX.previewTex(inp.dataset.kind, inp.value);
    if (pvEl) pvEl.innerHTML = inp.value.trim() ? (tex ? MX.texHTML(tex) : '<span class="pv-bad">…</span>') : '';
    // clear a stale "can't read that" or "not simplified" message while the student edits
    const m = inp.id.match(/^(.*)-(\d+)-(\d+)$/);
    if (m) { const fb = byId('fb-' + m[1] + '-' + m[2]); if (fb && (fb.classList.contains('err') || fb.classList.contains('nudge'))) { fb.className = 'fb'; fb.innerHTML = ''; } }
  }
  function onKey(e) {
    if (e.key !== 'Enter') return;
    const inp = e.target;
    if (!inp.matches || !inp.matches('input.ans')) return;
    const m = inp.id.match(/^(.*)-(\d+)-(\d+)$/);
    if (!m) return;
    e.preventDefault();
    doCheck(m[1], +m[2]);
  }
  function onChange(e) {
    const r = e.target;
    if (r.type === 'radio') {
      r.closest('.opts').querySelectorAll('.opt').forEach((o) => o.classList.toggle('sel', o.contains(r) && r.checked));
    }
  }

  function renderAll() {
    renderExam();
    if (App.view !== 'exam') setView(App.view, { keepScroll: true });
  }
  function boot() {
    Store.init();
    ensureExam();
    setupKeypad();
    d.addEventListener('click', onClick);
    d.addEventListener('input', onInput);
    d.addEventListener('keydown', onKey);
    d.addEventListener('change', onChange);
    Store.on((what) => {
      if (what === 'remote') { ensureExam(); renderAll(); }
      if (what === 'status' && App.view === 'progress') renderProgress();
    });
    renderExam();
    setView('exam', { keepScroll: true });
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);

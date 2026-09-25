/* app.js: home, exam, tutorials, flashcards and progress views */
(function (G) {
  'use strict';
  const MX = G.MX;
  const Store = MX.Store;
  const GEN_VERSION = 3;
  const d = G.document;

  const PART3_SEC = 'Linear equations & inequalities';
  const SECTION_ORDER = ['Polynomials & exponents', 'Factoring', 'Rational expressions', 'Radicals', 'Equations & inequalities', 'Absolute value', 'Quadratic equations & functions', 'Logarithms', 'Graphs, lines & systems', 'Relations & functions', 'Word problems', PART3_SEC];
  const WORD_ORDER = ['w-proportion', 'w-percent', 'w-sci', 'w-ineq', 'w-perimeter', 'w-pyth', 'w-triangles', 'w-linear', 'w-motion', 'w-mixture', 'w-systems', 'w-quadratic', 'w-logs'];
  const PART3_ORDER = ['lq-strategy', 'lq-problems', 'lq-formulas', 'lq-applications', 'lq-linear-ineq', 'lq-compound', 'lq-absineq'];
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const R = MX.rich;
  const byId = (id) => d.getElementById(id);
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many || one + 's');

  function orderedTopics() {
    const skills = MX.topics.filter((t) => t.kind !== 'word' && t.part !== 3).slice().sort((a, b) => SECTION_ORDER.indexOf(a.section) - SECTION_ORDER.indexOf(b.section));
    const words = WORD_ORDER.map((id) => MX.byId[id]).filter(Boolean);
    const p3 = MX.topics.filter((t) => t.part === 3).slice().sort((a, b) => PART3_ORDER.indexOf(a.id) - PART3_ORDER.indexOf(b.id));
    return [...skills, ...words, ...p3];
  }
  const examPartOf = (t) => (t.part === 3 ? 3 : t.kind === 'word' ? 2 : 1);
  const sectionOf = (t) => (t.part === 3 ? PART3_SEC : t.kind === 'word' ? 'Word problems' : t.section);
  function bySection() {
    const groups = {};
    orderedTopics().forEach((t) => { const s = sectionOf(t); (groups[s] = groups[s] || []).push(t); });
    return SECTION_ORDER.filter((s) => groups[s]).map((s) => [s, groups[s]]);
  }
  const slotsOf = (t) => t.slots || [{ pool: Object.keys(t.variants) }];
  const allVariants = (t) => Object.keys(t.variants);
  const isLogTopic = (t) => !!t && (t.section === 'Logarithms' || t.id === 'w-logs');
  // where a topic came from: the sample exams, or added to round out the course
  function sourceText(t) {
    const real = (t.sources || []).filter((s) => !/^added/i.test(s));
    const added = (t.sources || []).some((s) => /^added/i.test(s));
    if (!real.length) return 'Added topic (not on the sample exams)';
    return real.join(' · ') + (added ? ' · plus added problem types' : '');
  }

  // ================= exam model =================
  // Generate a question and make sure its answer key checks out: the grader accepts the key and the
  // independent verifier (src/verify.js) agrees with it. A question that fails is replaced by one from the
  // next seed (and then by another variant of the same topic), so a generator bug never reaches a student.
  // A sound question keeps its original seed, so saved exams and practice rebuild exactly the same questions.
  Object.assign(MX.V.opts, { fine: 0.05, coarse: 1 }); // a lighter grid than the tests use: this is the safety net, not the audit
  MX.unsound = [];
  function soundGen(t, vk, seed, key) {
    const tryGen = (v, k) => {
      let q = null, why;
      try { q = t.variants[v].gen(MX.rngFor(seed, key + (k ? '|fix' + k : '') + (v !== vk ? '|' + v : ''))); why = MX.sound(q); } catch (e) { why = 'generator threw: ' + (e && e.message); }
      if (why === true) return q;
      MX.unsound.push({ topic: t.id, variant: v, seed, key, why });
      if (G.console) G.console.warn('Replaced a question whose answer key failed its check:', t.id + '/' + v, why);
      return null;
    };
    for (let k = 0; k < 6; k++) { const q = tryGen(vk, k); if (q) return q; }
    for (const v of allVariants(t)) if (v !== vk) { const q = tryGen(v, 0); if (q) return q; }
    return t.variants[vk].gen(MX.rngFor(seed, key)); // nothing passed: fall back rather than break the page
  }
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
          q = soundGen(t, vk, seed, t.id + '#' + si + '|' + vk + '|' + tries);
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

  const App = { items: [], view: 'home', tutId: null, returnItem: -1, returnView: 'tutorials', deck: null, deckReturn: 'flashcards', examScroll: null };
  G.MX.App = App;

  function examState() { return Store.state.exam; }
  function drafts() { return (Store.state.drafts = Store.state.drafts || {}); }
  function flashState() { return (Store.state.flash = Store.state.flash || {}); }
  function startNewExam() {
    const prev = Store.state.exam;
    const dr = drafts();
    Object.keys(dr).forEach((k) => { if (k[0] === 'x') delete dr[k]; });
    Store.state.exam = { no: prev ? prev.no + 1 : (Store.state.history || []).reduce((m, h) => Math.max(m, h.no), 0) + 1, seed: newSeed(), gv: GEN_VERSION, started: Date.now(), finished: null, res: {} };
    App.items = buildExam(Store.state.exam.seed);
    App.examScroll = null;
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
  function firstOpenItem() {
    const ex = examState();
    const i = App.items.findIndex((it) => { const s = itemStatus(it, ex.res); return s === '' || s === 'part'; });
    return i < 0 ? 0 : i;
  }

  // ================= problem rendering =================
  // REG maps a card id to { q, mode, ctx, getRes(pi), setRes(pi, r) }
  const REG = new Map();
  const showOf = (p) => {
    if (p.show) return p.show;
    if (p.kind === 'choice') return '';
    try { return MX.astTex(MX.parse(p.answer)); } catch (e) { return esc(p.answer); }
  };
  function answerBox(id, kind, val, dis, cls, ctx) {
    return `<span class="blank">${MX.ED.html({ id, kind, value: val || '', disabled: dis, cls, logs: !!(ctx && ctx.logs) })}</span>`;
  }
  function inputsHTML(p, base, val, dis, ctx) {
    val = val || {};
    const pre = p.pre ? `<span class="pre">${esc(p.pre)}</span>` : '';
    const post = p.post && !p.units ? `<span class="post">${esc(p.post)}</span>` : '';
    switch (p.kind) {
      case 'choice': {
        // long, short pictures (number lines) get two wide columns instead of four small ones
        const strip = p.graph && p.options.every((o) => { const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(o); return m && m[1] / m[2] > 2.5; });
        const cls = p.graph ? 'opts graphs' + (strip ? ' strips' : '') : p.inline ? 'opts inline' : 'opts list';
        return `<div class="${cls}" role="radiogroup">` + p.options.map((o, k) =>
          `<label class="opt${val.choice != null && +val.choice === k ? ' sel' : ''}${dis && k === p.answer ? ' right' : ''}"><input type="radio" name="${base}" id="${base}-o${k}" value="${k}"${val.choice != null && +val.choice === k ? ' checked' : ''}${dis ? ' disabled' : ''}><span class="optl">${p.graph ? '<span class="ok-letter">' + 'ABCD'[k] + '</span>' : ''}${p.graph ? o : R(o)}</span></label>`).join('') + '</div>';
      }
      case 'nums': {
        const n = p.count || p.answers.length;
        const vs = val.values || [];
        return '<div class="multi">' + pre + Array.from({ length: n }, (_, k) => (k ? `<span class="join">${esc(p.joiner || 'or')}${p.pre ? ' ' + esc(p.pre) : ''}</span>` : '') + `<span class="cell">${answerBox(base + '-' + k, 'nums', vs[k], dis, 'short', ctx)}</span>`).join('') + post + '</div>';
      }
      case 'points': {
        const vs = val.values || [];
        return '<div class="multi">' + [0, 1].map((k) => (k ? `<span class="join">${esc(p.joiner || 'and')}</span>` : '') + `<span class="cell">${answerBox(base + '-' + k, 'point', vs[k], dis, 'short', ctx)}</span>`).join('') + '</div>';
      }
      case 'system': {
        const vs = val.values || [];
        const labs = p.inputs || ['Equation 1', 'Equation 2'];
        return '<div class="sysin">' + [0, 1].map((k) => `<div class="cell"><span class="pre">${esc(labs[k])}</span>${answerBox(base + '-' + k, 'system', vs[k], dis, 'wide', ctx)}</div>`).join('') + '</div>';
      }
      default: {
        let units = '';
        if (p.units) {
          units = `<select id="${base}-u" class="units"${dis ? ' disabled' : ''} aria-label="units"><option value="">units…</option>` +
            p.units.options.map((u) => `<option${val.unit === u ? ' selected' : ''}>${esc(u)}</option>`).join('') + '</select>';
        }
        const wide = ['expr', 'factor', 'eq', 'radpm', 'sci', 'eqform', 'interval'].includes(p.kind) ? 'wide' : '';
        return `<div class="single">${pre}<span class="cell">${answerBox(base + '-0', p.kind === 'point' ? 'point' : p.kind, val.value, dis, wide, ctx)}</span>${units}${post}</div>`;
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
      return { values: Array.from({ length: n }, (_, k) => MX.ED.value(base + '-' + k)) };
    }
    const u = byId(base + '-u');
    return { value: MX.ED.value(base + '-0'), unit: u ? u.value : undefined };
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
  const isLocked = (r, mode) => !!(r && (mode === 'exam' ? r.ok !== undefined : r.ok === true || r.revealed));
  function partHTML(cardId, p, pi, r, mode, forceLock, ctx) {
    const base = cardId + '-' + pi;
    const locked = forceLock || isLocked(r, mode);
    const val = locked ? r && r.val : drafts()[base] || (r && r.val);
    const label = p.label ? `<span class="plabel">${esc(p.label)})</span>` : '';
    const ask = p.ask ? `<div class="ask">${label}${R(p.ask)}</div>` : label ? `<div class="ask">${label}</div>` : '';
    let btns = '';
    if (!locked) {
      btns = `<button type="button" class="btn chk" data-act="check" data-card="${cardId}" data-p="${pi}">Check</button>`;
      if (mode === 'tut' && r && r.ok === false) btns += `<button type="button" class="btn ghost" data-act="reveal" data-card="${cardId}" data-p="${pi}">Show answer</button>`;
    }
    const st = r ? (r.ok === true ? ' is-ok' : r.revealed ? ' is-rv' : r.ok === false ? ' is-bad' : '') : '';
    const fbCls = r ? (r.ok === true ? 'ok' : r.revealed ? 'rv' : r.ok === false ? 'bad' : '') : '';
    return `<div class="part${st}${locked ? ' locked' : ''}" id="pt-${base}" data-mq-bar>
      ${ask}
      <div class="line">${inputsHTML(p, base, val, locked, ctx)}<span class="acts">${btns}</span>${mode === 'exam' ? `<span class="pts">(${p.points})</span>` : ''}</div>
      <div class="fb ${fbCls}" id="fb-${base}" role="status" aria-live="polite">${feedbackHTML(p, r, mode)}</div>
    </div>`;
  }
  function solutionHTML(cardId, q, available, open) {
    if (!available) return `<div class="sol-wait" id="sol-${cardId}">Answer every part to unlock the worked solution.</div>`;
    return `<details class="sol" id="sol-${cardId}"${open ? ' open' : ''}><summary>Worked solution</summary><ol>${q.solution.map((s) => `<li>${R(s)}</li>`).join('')}</ol></details>`;
  }
  function allLocked(q, res, mode) {
    return q.parts.every((p, pi) => isLocked(res[pi], mode));
  }

  // one problem card; o = {cardId, mode, num, res, head, forceLock, ctx}
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
          <div class="parts">${q.parts.map((p, pi) => partHTML(o.cardId, p, pi, res[pi], o.mode, o.forceLock, o.ctx)).join('')}</div>
          ${solutionHTML(o.cardId, q, unlocked, false)}
        </div>
      </div>
    </article>`;
  }
  function workedHTML(q, k, typeName) {
    const vis = q.visual ? `<figure class="vis">${q.visual}</figure>` : '';
    const ans = q.parts.map((p) => `<li>${p.ask ? R(p.ask) + ': ' : ''}${p.kind === 'choice' ? (p.graph ? `<span class="mini-graph">${p.options[p.answer]}</span>` : R(p.options[p.answer])) : R('\\(' + showOf(p) + '\\)')}</li>`).join('');
    return `<article class="card worked${q.visual ? ' has-vis' : ''}">
      <div class="eyebrow">Example ${k + 1}${typeName ? `<span class="wtype">${esc(typeName)}</span>` : ''}</div>
      <div class="prompt">${R(q.prompt)}</div>${vis}
      <ol class="steps">${q.solution.map((s) => `<li>${R(s)}</li>`).join('')}</ol>
      <div class="wans"><span class="eyebrow">Answer${q.parts.length > 1 ? 's' : ''}</span><ul>${ans}</ul></div>
    </article>`;
  }

  // ================= exam view =================
  function examItemHead(it, i) {
    const t = it.topic;
    const vname = t.variants[it.variant].name;
    const kind = t.kind === 'word' ? `${esc(t.title)} · ${esc(vname)}` : t.part === 3 ? esc(it.slot.label || t.title) : esc(t.title);
    const st = sourceText(t);
    const src = it.slot.source ? (/^added/i.test(it.slot.source) ? 'Added topic' : 'Like ' + it.slot.source) : /^Added/.test(st) ? 'Added topic' : 'Seen on ' + st;
    return `<header class="qhead"><span class="topic">${kind}</span><span class="src">${esc(src)}</span>
      <button type="button" class="btn tut" data-act="tutorial" data-topic="${t.id}" data-item="${i}">Tutorial<span aria-hidden="true"> →</span></button></header>`;
  }
  const PART_NUM = { 1: 'I', 2: 'II', 3: 'III' };
  const PART_NAME = { 1: 'Skills', 2: 'Word problems', 3: PART3_SEC };
  const NAV_NAME = { 1: 'Skills', 2: 'Word problems', 3: 'Linear equations & inequalities' };
  const PART3_NOTE = 'One question for each skill in a full chapter on linear equations and inequalities: solving strategies, problem solving, formulas, applications, interval notation, compound and absolute value inequalities.';
  function renderExam() {
    const ex = examState();
    const res = ex.res;
    const finished = !!ex.finished;
    let html = '', lastSec = null, lastPart = 0;
    [...REG.keys()].forEach((k) => { if (k[0] === 'x') REG.delete(k); });
    App.items.forEach((it, i) => {
      const part = examPartOf(it.topic);
      if (part !== lastPart) {
        lastPart = part;
        lastSec = null;
        html += `<h2 class="part-h" id="exam-part-${part}"><span>Part ${PART_NUM[part]}</span> ${esc(PART_NAME[part])}</h2>`;
        if (part === 3) html += `<p class="part-note">${PART3_NOTE}</p>`;
      }
      const sub = part === 1 ? it.topic.section : part === 3 ? it.topic.title : null;
      if (sub && sub !== lastSec) { lastSec = sub; html += `<h3 class="sec-h">${esc(sub)}</h3>`; }
      const cardId = 'x' + ex.no + '-' + i;
      const ctx = { logs: isLogTopic(it.topic) };
      REG.set(cardId, {
        q: it.q, mode: 'exam', item: i, ctx,
        getRes: (pi) => (ex.res[it.key] || {})[pi],
        setRes: (pi, r) => { (ex.res[it.key] = ex.res[it.key] || {})[pi] = r; },
      });
      html += cardHTML(it.q, { cardId, mode: 'exam', num: it.n + '.', res: res[it.key], head: examItemHead(it, i), forceLock: finished, ctx });
    });
    byId('exam-list').innerHTML = html;
    renderExamHeader();
    renderNav();
  }
  function renderChip() {
    const ex = examState();
    const sc = scoreOf(App.items, ex.res);
    byId('score-chip').innerHTML = `<button type="button" class="chip-b" data-act="view" data-view="exam" title="Go to the exam"><span class="chip-l">Exam No. ${esc(ex.no)}</span><b>${sc.earned}</b><span>/ ${sc.total}</span></button>`;
  }
  function renderExamHeader() {
    const ex = examState();
    const sc = scoreOf(App.items, ex.res);
    const started = new Date(ex.started);
    byId('exam-title').textContent = 'Practice Exam No. ' + ex.no;
    byId('exam-meta').textContent = `Generated ${started.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · ${App.items.length} questions · ${sc.total} points`;
    byId('sum-earned').textContent = sc.earned;
    byId('sum-total').textContent = sc.total;
    byId('sum-done').textContent = sc.done + ' / ' + sc.parts;
    byId('sum-pct').textContent = sc.done ? Math.round((100 * sc.earned) / Math.max(1, answeredPoints())) + '%' : '–';
    byId('sum-bar').style.width = (100 * sc.done) / sc.parts + '%';
    byId('sum-bar-ok').style.width = (100 * sc.earned) / sc.total + '%';
    renderChip();
    const done = !!ex.finished;
    byId('exam-finish').hidden = false;
    byId('end-row').hidden = done;
    const rb = byId('results');
    if (done) {
      const weak = Object.entries(sc.byTopic).filter(([, v]) => v[0] < v[1]).map(([k, v]) => [k, v[0] / v[1]]).sort((a, b) => a[1] - b[1]).slice(0, 5);
      rb.hidden = false;
      rb.innerHTML = `<div class="res-score"><span class="big">${sc.earned}</span><span class="of">/ ${sc.total}</span><span class="pc">${sc.pct}%</span></div>
        <div class="res-body"><h2>Exam complete</h2>
        <p>${sc.pct >= 90 ? 'Excellent work.' : sc.pct >= 75 ? 'Solid. A little review will push this higher.' : sc.pct >= 60 ? 'You passed the bar for many courses; review the topics below.' : 'Keep going: work through the tutorials below, then try a fresh exam.'} Your score is saved in Progress.</p>
        ${weak.length ? `<p class="weak-h">Review first:</p><div class="weak">${weak.map(([k]) => `<button type="button" class="btn tut" data-act="tutorial" data-topic="${k}">${esc(MX.byId[k].title)} →</button>`).join('')}</div>` : ''}
        <div class="res-acts"><button type="button" class="btn primary" data-act="new-exam">Generate a new exam</button><button type="button" class="btn ghost" data-act="view" data-view="home">Home</button></div></div>`;
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
      const part = examPartOf(it.topic);
      if (i === 0 || examPartOf(App.items[i - 1].topic) !== part) html += `<div class="nav-sec">${esc(NAV_NAME[part])}</div>`;
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
      const nowLocked = isLocked(r, reg.mode);
      if (nowLocked && !locked) el.outerHTML = partHTML(cardId, p, pi, r, reg.mode, false, reg.ctx);
      else if (!nowLocked) {
        // keep what is typed; update buttons and feedback only
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
      delete drafts()[base];
      Store.save();
      refreshCard(cardId);
      renderExamHeader();
      renderNav();
      maybeFinish();
    } else {
      const tries = (prev.tries || 0) + 1;
      reg.setRes(pi, r.ok ? { ok: true, tries, val: input } : { ok: false, tries, msg: r.msg || '', val: input });
      if (r.ok) delete drafts()[base];
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
    delete drafts()[cardId + '-' + pi];
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
      if (!rr[pi] || rr[pi].ok === undefined) rr[pi] = { ok: false, skipped: true, val: drafts()['x' + ex.no + '-' + App.items.indexOf(it) + '-' + pi] };
    }));
    const dr = drafts();
    Object.keys(dr).forEach((k) => { if (k[0] === 'x') delete dr[k]; });
    Store.state.history = (Store.state.history || []).filter((h) => h.no !== ex.no);
    Store.state.history.push({ no: ex.no, earned: sc.earned, total: sc.total, started: ex.started, finished: ex.finished, byTopic: sc.byTopic });
    if (Store.state.history.length > 60) Store.state.history = Store.state.history.slice(-60);
    Store.save();
    renderExam();
    byId('results').scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' });
  }
  const prefersReduced = () => G.matchMedia && G.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // drafts: what is typed but not yet checked, saved as the student types
  let draftTimer = 0;
  function saveDraftFor(el) {
    const id = el.id || el.name || '';
    const m = id.match(/^(.*)-(\d+)-(?:\d+|u|o\d+)$/) || (el.type === 'radio' ? el.name.match(/^(.*)-(\d+)$/) : null);
    if (!m) return;
    const cardId = m[1], pi = +m[2];
    const reg = REG.get(cardId);
    if (!reg) return;
    const p = reg.q.parts[pi];
    const base = cardId + '-' + pi;
    if (isLocked(reg.getRes(pi), reg.mode)) return;
    drafts()[base] = readInput(base, p);
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => Store.save(), 400);
  }

  // ================= tutorials =================
  function tutState(id) {
    const all = (Store.state.tut = Store.state.tut || {});
    return (all[id] = all[id] || { batches: [], res: {} });
  }
  // Six worked examples per tutorial. Problem types are taken round-robin across the exam slots
  // (first type of every slot, then the second, ...), so the examples cover as many kinds as possible;
  // a type shown more than once gets different numbers each time, and repeats sit next to each other.
  const WORKED_N = 6;
  function workedPlan(t) {
    const pools = slotsOf(t).map((sl) => sl.pool);
    const order = [], seen = new Set();
    const add = (vk) => { if (t.variants[vk] && !seen.has(vk)) { seen.add(vk); order.push(vk); } };
    const longest = Math.max(...pools.map((p) => p.length));
    for (let r = 0; r < longest; r++) pools.forEach((p) => add(p[r]));
    allVariants(t).forEach(add);
    const plan = [];
    for (let k = 0; k < WORKED_N; k++) plan.push(order[k % order.length]);
    return plan.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }
  function workedExamples(t) {
    const seenQ = new Set(), seenCtx = new Set();
    return workedPlan(t).map((vk, k) => {
      let q, sig, tries = 0;
      do {
        q = soundGen(t, vk, 'tutorial-worked', t.id + '|' + vk + '|' + k + (tries ? '|' + tries : ''));
        sig = q.prompt + '|' + q.parts.map((p) => p.answer + (p.answers || []).join(',')).join('|');
        tries++;
      } while (tries < 12 && (seenQ.has(sig) || (t.distinctContexts && q.ctx && seenCtx.has(q.ctx) && tries < 6)));
      seenQ.add(sig);
      if (q.ctx) seenCtx.add(q.ctx);
      return { vk, q };
    });
  }
  function tutProblems(t) {
    const slots = slotsOf(t), vs = allVariants(t);
    const wq = workedExamples(t);
    const st = tutState(t.id);
    const ex = [];
    // exercise types are laid out exactly as before worked examples went to six, so saved practice still matches its questions
    const legacyWorked = slots.length > 1 ? Math.min(3, slots.length) : 2;
    const start = legacyWorked % vs.length;
    for (let k = 0; k < 3; k++) {
      const vk = vs[(start + k) % vs.length];
      ex.push({ key: 'e' + k, vk, q: soundGen(t, vk, 'tutorial-ex', t.id + '|' + k) });
    }
    st.batches.forEach((choice, b) => {
      for (let k = 0; k < 3; k++) {
        const vk = choice && t.variants[choice] ? choice : vs[(b * 3 + k + start) % vs.length];
        ex.push({ key: 'b' + b + '-' + k, vk, q: soundGen(t, vk, 'tutorial-more', t.id + '|' + b + '|' + k + '|' + vk) });
      }
    });
    return { wq, ex };
  }
  function tutCounts(id) {
    const st = (Store.state.tut || {})[id] || { res: {} };
    let solved = 0, attempted = 0;
    Object.values(st.res).forEach((rr) => {
      const vals = Object.values(rr);
      if (!vals.length) return;
      attempted++;
      if (vals.every((r) => r.ok === true)) solved++;
    });
    return { solved, attempted };
  }
  const BACK_TEXT = { tutorials: '← All tutorials', progress: '← Back to progress', home: '← Home', flashcards: '← All flashcards', deck: '← Back to the flashcards' };
  function renderTutorial() {
    const t = MX.byId[App.tutId];
    if (!t) return;
    const st = tutState(t.id);
    const { wq, ex } = tutProblems(t);
    const rv = App.returnView || 'tutorials';
    const backText = rv === 'exam' ? (App.returnItem >= 0 && App.items[App.returnItem] ? `← Back to the exam (question ${App.items[App.returnItem].n})` : '← Back to the exam') : BACK_TEXT[rv] || '← All tutorials';
    const back = `<button type="button" class="btn back" data-act="back">${backText}</button>`;
    const vnames = allVariants(t).map((k) => `<span class="vchip">${esc(t.variants[k].name)}</span>`).join('');
    const nCards = (MX.FLASH[t.id] || []).length;
    const ctx = { logs: isLogTopic(t) };
    let html = `<div class="tut-top">${back}${rv !== 'tutorials' ? `<button type="button" class="btn ghost" data-act="view" data-view="tutorials">All tutorials</button>` : ''}
        ${nCards ? `<button type="button" class="btn tut deck-link" data-act="deck" data-topic="${t.id}" data-from="tutorial">Flashcards for this topic (${nCards}) →</button>` : ''}</div>
      <header class="tut-head"><div class="eyebrow">${esc(sectionOf(t))}</div><h1>${esc(t.title)}</h1>
      <p class="tut-src">${/^Added/.test(sourceText(t)) ? esc(sourceText(t)) : 'On the sample exams: ' + esc(sourceText(t))}</p>
      <div class="vchips" aria-label="Problem types covered">${vnames}</div></header>
      <section class="lesson">${R(t.lesson)}</section>
      <h2 class="sub-h">Worked examples <span class="tut-stats">${wq.length} examples</span><button type="button" class="btn ghost skip" data-act="to-practice">Skip to practice ↓</button></h2>
      <div class="worked-list">${wq.map((w, k) => workedHTML(w.q, k, allVariants(t).length > 1 ? t.variants[w.vk].name : '')).join('')}</div>
      <h2 class="sub-h" id="tut-practice">Practice <span id="tut-stats" class="tut-stats"></span></h2>
      <p class="hint">Check as many times as you like. "Show answer" reveals the answer and the worked solution.</p>
      <div class="ex-list">`;
    [...REG.keys()].forEach((k) => { if (k[0] === 't') REG.delete(k); });
    ex.forEach((e, k) => {
      const cardId = 't-' + t.id + '-' + e.key;
      REG.set(cardId, {
        q: e.q, mode: 'tut', ctx,
        getRes: (pi) => (st.res[e.key] || {})[pi],
        setRes: (pi, r) => { (st.res[e.key] = st.res[e.key] || {})[pi] = r; },
      });
      html += cardHTML(e.q, { cardId, mode: 'tut', num: 'Exercise ' + (k + 1), res: st.res[e.key], ctx, head: t.kind === 'word' || allVariants(t).length > 1 ? `<header class="qhead"><span class="topic">${esc(t.variants[e.vk].name)}</span></header>` : '' });
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
    const ex = examState();
    const total = orderedTopics().length;
    const practiced = orderedTopics().filter((t) => tutCounts(t.id).attempted).length;
    let html = `<header class="page-h"><h1>Tutorials</h1><p>${total} topics, each with a short lesson, worked examples and unlimited practice. You've practiced ${practiced} of them; your record is saved.</p></header>`;
    bySection().forEach(([s, list]) => {
      html += `<h2 class="sec-h">${esc(s)}</h2><div class="tiles">`;
      list.forEach((t) => {
        const c = tutCounts(t.id);
        const got = Object.values(ex.res).length ? examTopicState(t.id) : '';
        html += `<button type="button" class="tile" data-act="tutorial" data-topic="${t.id}">
          <span class="tile-t">${esc(t.title)}</span>
          <span class="tile-s">${esc(sourceText(t))}</span>
          <span class="tile-m">${t.kind === 'word' ? plural(Object.keys(t.variants).length, 'problem type') + ' · ' : ''}${c.solved ? c.solved + ' solved' : 'not started'}${got}</span></button>`;
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

  // ================= flashcards =================
  function cardsOf(id) { return MX.FLASH[id] || []; }
  function flashCounts(ids) {
    const fs = flashState();
    let total = 0, got = 0, learning = 0;
    ids.forEach((id) => {
      const m = fs[id] || {};
      cardsOf(id).forEach((c, i) => { total++; if (m[i] === 1) got++; else if (m[i] === 0) learning++; });
    });
    return { total, got, learning };
  }
  const allTopicIds = () => orderedTopics().map((t) => t.id);
  function meter(frac, cls) {
    return `<span class="meter${cls ? ' ' + cls : ''}" aria-hidden="true"><span class="good" style="width:${Math.round(100 * frac)}%"></span></span>`;
  }
  function renderFlashIndex() {
    const all = flashCounts(allTopicIds());
    let html = `<header class="page-h"><h1>Flashcards</h1><p>One deck for each topic: the rules, formulas and quick examples. Flip a card, then mark it <b>Got it</b> or <b>Still learning</b>. Your marks are saved.</p></header>
      <div class="fc-total">${meter(all.total ? all.got / all.total : 0, 'wide')}<span><b>${all.got}</b> of ${all.total} cards learned${all.learning ? ` · ${all.learning} still learning` : ''}</span>
      ${all.learning ? `<button type="button" class="btn ghost" data-act="deck" data-all="1" data-mode="learning">Review all still learning (${all.learning})</button>` : ''}</div>`;
    bySection().forEach(([s, list]) => {
      const ids = list.map((t) => t.id).filter((id) => cardsOf(id).length);
      if (!ids.length) return;
      const c = flashCounts(ids);
      html += `<div class="sec-row"><h2 class="sec-h">${esc(s)}</h2><button type="button" class="btn tut sm" data-act="deck" data-section="${esc(s)}">Study the whole section (${c.total})</button></div><div class="tiles">`;
      ids.forEach((id) => {
        const t = MX.byId[id], k = flashCounts([id]);
        html += `<button type="button" class="tile" data-act="deck" data-topic="${id}">
          <span class="tile-t">${esc(t.title)}</span>
          <span class="tile-m">${plural(k.total, 'card')} · ${k.got ? k.got + ' learned' : 'not started'}${k.learning ? ' · ' + k.learning + ' still learning' : ''}</span>
          ${meter(k.total ? k.got / k.total : 0)}</button>`;
      });
      html += '</div>';
    });
    byId('flash-index').innerHTML = html;
  }
  // a study session: spec = {topic} | {section} | {all}
  function openDeck(spec, mode, from) {
    let ids, title, eyebrow;
    if (spec.topic) { ids = [spec.topic]; title = MX.byId[spec.topic].title; eyebrow = sectionOf(MX.byId[spec.topic]); }
    else if (spec.section) { ids = bySection().find(([s]) => s === spec.section)[1].map((t) => t.id); title = spec.section; eyebrow = 'Whole section'; }
    else { ids = allTopicIds(); title = 'All topics'; eyebrow = 'Every deck'; }
    ids = ids.filter((id) => cardsOf(id).length);
    if (from) App.deckReturn = from;
    App.deck = { spec, ids, title, eyebrow, mode: mode || 'all', shuffle: App.deck ? App.deck.shuffle : false, order: [], pos: 0, flipped: false, seen: {} };
    buildOrder();
    setView('deck');
  }
  function buildOrder() {
    const dk = App.deck, fs = flashState();
    let cards = [];
    dk.ids.forEach((id) => cardsOf(id).forEach((c, i) => cards.push([id, i])));
    if (dk.mode === 'learning') cards = cards.filter(([id, i]) => (fs[id] || {})[i] === 0);
    if (dk.shuffle) {
      for (let k = cards.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [cards[k], cards[j]] = [cards[j], cards[k]]; }
    }
    dk.order = cards;
    dk.pos = 0;
    dk.flipped = false;
    dk.seen = {};
  }
  function markCard(v) {
    const dk = App.deck;
    const c = dk.order[dk.pos];
    if (!c) return;
    const fs = flashState();
    (fs[c[0]] = fs[c[0]] || {})[c[1]] = v;
    dk.seen[c[0] + ':' + c[1]] = v;
    Store.save();
    dk.pos++;
    dk.flipped = false;
    dk.enter = 'next';
    renderDeck();
  }
  // turn the current card over in place, so the CSS flip animates (a re-render would jump straight to the other side)
  function flipCard() {
    const dk = App.deck, el = byId('fc');
    if (!dk || !el) return;
    dk.flipped = !dk.flipped;
    el.classList.toggle('flipped', dk.flipped);
    el.setAttribute('aria-label', dk.flipped ? 'Answer side. Press to flip back.' : 'Question side. Press to see the answer.');
    el.querySelector('.fc-front').setAttribute('aria-hidden', String(dk.flipped));
    el.querySelector('.fc-back').setAttribute('aria-hidden', String(!dk.flipped));
    // restart the lift that goes with each turn (and drop the slide-in, which would outrank it)
    const w = el.closest('.fc-wrap');
    if (w) w.classList.remove('enter-next', 'enter-prev');
    el.classList.remove('lift');
    void el.offsetWidth;
    el.classList.add('lift');
    el.focus({ preventScroll: true });
  }
  function stepCard(delta) {
    const dk = App.deck;
    const pos = Math.max(0, dk.pos + delta);
    if (pos === dk.pos) return;
    dk.pos = pos;
    dk.flipped = false;
    dk.enter = delta > 0 ? 'next' : 'prev';
    renderDeck();
  }
  function renderDeck() {
    const dk = App.deck;
    if (!dk) return setView('flashcards');
    const cnt = flashCounts(dk.ids);
    const single = dk.spec.topic;
    const enter = dk.enter;
    dk.enter = null;
    const backTo = App.deckReturn === 'tutorial' ? '← Back to the tutorial' : App.deckReturn === 'home' ? '← Home' : '← All flashcards';
    let html = `<div class="tut-top"><button type="button" class="btn back" data-act="deck-back">${backTo}</button>
        ${single ? `<button type="button" class="btn tut" data-act="tutorial" data-topic="${single}">Open the tutorial →</button>` : ''}</div>
      <header class="tut-head"><div class="eyebrow">${esc(dk.eyebrow)}</div><h1>${esc(dk.title)}</h1>
      <div class="fc-total">${meter(cnt.total ? cnt.got / cnt.total : 0, 'wide')}<span><b>${cnt.got}</b> of ${cnt.total} learned${cnt.learning ? ` · ${cnt.learning} still learning` : ''}</span></div></header>
      <div class="deck-ctl">
        <div class="seg" role="group" aria-label="Which cards">
          <button type="button" data-act="deck-mode" data-mode="all" aria-pressed="${dk.mode === 'all'}">All cards (${cnt.total})</button>
          <button type="button" data-act="deck-mode" data-mode="learning" aria-pressed="${dk.mode === 'learning'}"${cnt.learning || dk.mode === 'learning' ? '' : ' disabled'}>Still learning (${cnt.learning})</button>
        </div>
        <button type="button" class="btn ghost" data-act="deck-shuffle" aria-pressed="${dk.shuffle}">${dk.shuffle ? '⤮ Shuffled' : '⤮ Shuffle'}</button>
      </div>`;
    if (!dk.order.length) {
      html += `<div class="fc-done"><h2>Nothing to review</h2><p>No cards are marked “Still learning” right now.</p><div class="res-acts"><button type="button" class="btn primary" data-act="deck-mode" data-mode="all">Study all cards</button></div></div>`;
    } else if (dk.pos >= dk.order.length) {
      const vals = Object.values(dk.seen);
      const got = vals.filter((v) => v === 1).length, lrn = vals.filter((v) => v === 0).length;
      html += `<div class="fc-done"><h2>Round complete</h2><p>You went through ${plural(dk.order.length, 'card')}: <b>${got}</b> got it${lrn ? `, <b>${lrn}</b> still learning` : ''}.</p>
        <div class="res-acts">${cnt.learning ? `<button type="button" class="btn primary" data-act="deck-mode" data-mode="learning">Review the ${plural(cnt.learning, 'card')} still learning</button>` : ''}
        <button type="button" class="btn${cnt.learning ? '' : ' primary'}" data-act="deck-mode" data-mode="all">Study all again</button>
        ${single ? `<button type="button" class="btn tut" data-act="tutorial" data-topic="${single}">Open the tutorial →</button>` : ''}
        <button type="button" class="btn ghost" data-act="deck-back">${backTo.replace('← ', '')}</button></div></div>`;
    } else {
      const [id, i] = dk.order[dk.pos];
      const [front, back] = cardsOf(id)[i];
      const mark = (flashState()[id] || {})[i];
      const tag = mark === 1 ? '<span class="fc-tag ok">Got it</span>' : mark === 0 ? '<span class="fc-tag lrn">Still learning</span>' : '';
      const topicLine = dk.ids.length > 1 ? `<span class="fc-topic">${esc(MX.byId[id].title)}</span>` : '';
      html += `<div class="fc-wrap${enter ? ' enter-' + enter : ''}">
        <div class="fc${dk.flipped ? ' flipped' : ''}" id="fc" role="button" tabindex="0" data-act="flip" aria-label="${dk.flipped ? 'Answer side. Press to flip back.' : 'Question side. Press to see the answer.'}">
          <div class="fc-inner">
            <div class="fc-face fc-front" aria-hidden="${dk.flipped}"><div class="fc-meta"><span>Card ${dk.pos + 1} of ${dk.order.length}</span>${topicLine}${tag}</div><div class="fc-body"><div class="fc-text">${R(front)}</div></div><div class="fc-hint">Tap to flip</div></div>
            <div class="fc-face fc-back" aria-hidden="${!dk.flipped}"><div class="fc-meta"><span>Answer</span>${topicLine}</div><div class="fc-body"><div class="fc-text">${R(back)}</div></div><div class="fc-hint">Tap to flip back</div></div>
          </div>
        </div>
        <div class="fc-acts">
          <button type="button" class="btn ghost" data-act="deck-prev"${dk.pos ? '' : ' disabled'} aria-label="Previous card">←</button>
          <button type="button" class="btn fc-lrn" data-act="deck-mark" data-v="0">Still learning</button>
          <button type="button" class="btn fc-got" data-act="deck-mark" data-v="1">Got it</button>
          <button type="button" class="btn ghost" data-act="deck-next" aria-label="Skip to the next card">→</button>
        </div>
        <p class="hint fc-keys">Keys: Space flips · 1 still learning · 2 got it · ← → move</p>
      </div>`;
    }
    byId('deck-page').innerHTML = html;
  }

  // ================= home =================
  const ICONS = {
    exam: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="9" y="5" width="30" height="38" rx="3" class="ic-p"/><path d="M15 14h18M15 21h18M15 28h10" class="ic-l"/><circle cx="31" cy="33" r="6" class="ic-a"/><path d="M28.5 33l2 2 3.5-4" class="ic-w"/></svg>',
    tut: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 11c6-3 12-3 18 1 6-4 12-4 18-1v27c-6-3-12-3-18 1-6-4-12-4-18-1z" class="ic-p"/><path d="M24 12v27" class="ic-l"/><path d="M11 18c3-1 6-1 9 1M11 24c3-1 6-1 9 1M28 19c3-2 6-2 9-1" class="ic-l"/></svg>',
    flash: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="12" y="8" width="28" height="20" rx="3" class="ic-p" transform="rotate(8 26 18)"/><rect x="7" y="16" width="30" height="22" rx="3" class="ic-p"/><path d="M14 27h16" class="ic-l"/><text x="22" y="25" class="ic-t">a²</text></svg>',
  };
  function renderHome() {
    const ex = examState();
    const sc = scoreOf(App.items, ex.res);
    const hist = Store.state.history || [];
    const last = hist[hist.length - 1];
    let examBody, examBtns;
    if (ex.finished) {
      examBody = `Practice Exam No. ${ex.no} is finished: <b>${sc.earned} / ${sc.total}</b> (${sc.pct}%). A new exam uses fresh numbers and situations; your tutorials stay the same.`;
      examBtns = `<button type="button" class="btn primary" data-act="new-exam">Start Practice Exam No. ${ex.no + 1}</button><button type="button" class="btn ghost" data-act="view" data-view="exam">Review No. ${ex.no}</button>`;
    } else if (!sc.done && !Object.keys(drafts()).some((k) => k[0] === 'x')) {
      examBody = `Practice Exam No. ${ex.no} is ready: ${App.items.length} questions worth ${sc.total} points, in three parts: skills, word problems, and linear equations and inequalities. Your work saves as you go, so you can stop and come back.`;
      examBtns = `<button type="button" class="btn primary" data-act="resume">Start the exam</button>`;
    } else {
      const nxt = App.items[firstOpenItem()];
      examBody = `Practice Exam No. ${ex.no} is in progress: ${sc.done} of ${sc.parts} parts answered, <b>${sc.earned}</b> points so far.`;
      examBtns = `<button type="button" class="btn primary" data-act="resume">Continue at question ${nxt ? nxt.n : 1}</button>`;
    }
    const fc = flashCounts(allTopicIds());
    const topics = orderedTopics();
    const practiced = topics.filter((t) => tutCounts(t.id).attempted).length;
    const html = `<header class="home-h"><div class="exam-course">Algebra placement exam</div><h1>Placement Exam Prep</h1>
        <p>Take full-length practice exams, study any topic step by step, and drill the rules with flashcards. Everything you do is saved.</p></header>
      <div class="choices">
        <article class="choice"><div class="ch-ic">${ICONS.exam}</div><div class="ch-b"><h2>Practice exam</h2><p>${examBody}</p>
          ${ex.finished ? '' : `<div class="ch-meter">${meter(sc.parts ? sc.done / sc.parts : 0)}<span>${Math.round((100 * sc.done) / Math.max(1, sc.parts))}% answered</span></div>`}
          <div class="ch-acts">${examBtns}</div></div></article>
        <article class="choice"><div class="ch-ic">${ICONS.tut}</div><div class="ch-b"><h2>Tutorials</h2><p>${topics.length} topics, grouped by section. Each has a lesson, worked examples and as many practice problems as you want.</p>
          <div class="ch-acts"><button type="button" class="btn primary" data-act="view" data-view="tutorials">Browse tutorials</button></div></div></article>
        <article class="choice"><div class="ch-ic">${ICONS.flash}</div><div class="ch-b"><h2>Flashcards</h2><p>${fc.total} cards: one deck for every topic, or study a whole section at once.</p>
          <div class="ch-acts"><button type="button" class="btn primary" data-act="view" data-view="flashcards">Study flashcards</button>${fc.learning ? `<button type="button" class="btn ghost" data-act="deck" data-all="1" data-mode="learning" data-from="home">Review ${fc.learning} still learning</button>` : ''}</div></div></article>
      </div>
      <h2 class="sub-h">Your progress</h2>
      <div class="stats">
        <div class="stat"><span class="stat-n">${last ? Math.round((100 * last.earned) / last.total) + '%' : '–'}</span><span class="stat-l">${last ? `last exam (No. ${esc(last.no)}: ${esc(last.earned)} / ${esc(last.total)})` : 'last exam score (none finished yet)'}</span></div>
        <div class="stat"><span class="stat-n">${practiced}<small> / ${topics.length}</small></span><span class="stat-l">tutorials practiced</span></div>
        <div class="stat"><span class="stat-n">${fc.got}<small> / ${fc.total}</small></span><span class="stat-l">flashcards learned</span></div>
      </div>
      <p class="home-more"><button type="button" class="btn ghost" data-act="view" data-view="progress">See all progress →</button></p>`;
    byId('home-page').innerHTML = html;
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
        b += `<rect class="${k === bars.length - 1 ? 'accf' : 'soft2'}" x="${x}" y="${Hh - 20 - hh}" width="${bw}" height="${hh}" rx="3"/><text class="tx tick" x="${x + bw / 2}" y="${Hh - 6}" text-anchor="middle">${esc(h.no)}</text>`;
        if (k === bars.length - 1) b += `<text class="tx small" x="${x + bw / 2}" y="${Hh - 24 - hh}" text-anchor="middle" font-weight="700">${p}%</text>`;
      });
      chart = `<svg class="sv chart" viewBox="0 0 ${W} ${Hh}" width="${W}" height="${Hh}" role="img" aria-label="Exam scores over time">${b}</svg>`;
    }
    const rows = orderedTopics().map((t) => {
      const a = agg[t.id], c = tutCounts(t.id), f = flashCounts([t.id]);
      const pct = a && a[1] ? Math.round((100 * a[0]) / a[1]) : null;
      return { t, pct, pts: a, c, f };
    });
    rows.sort((x, y) => (x.pct == null ? 101 : x.pct) - (y.pct == null ? 101 : y.pct));
    const fc = flashCounts(allTopicIds());
    const status = Store.remoteStatus === 'synced' ? 'Saved to your account, so it follows you to other devices.' : 'Saved in this browser.';
    let html = `<header class="page-h"><h1>Progress</h1><p>${esc(status)}</p></header>
      <div class="stats">
        <div class="stat"><span class="stat-n">${hist.length}</span><span class="stat-l">exams finished</span></div>
        <div class="stat"><span class="stat-n">${hist.length ? best + '%' : '–'}</span><span class="stat-l">best score</span></div>
        <div class="stat"><span class="stat-n">${sc.earned}<small>/${sc.total}</small></span><span class="stat-l">current exam (No. ${ex.no})</span></div>
        <div class="stat"><span class="stat-n">${fc.got}<small>/${fc.total}</small></span><span class="stat-l">flashcards learned</span></div>
      </div>
      ${chart ? `<h2 class="sub-h">Exam scores</h2><div class="chart-wrap">${chart}</div>` : ''}
      <h2 class="sub-h">History</h2>`;
    html += hist.length
      ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Exam</th><th>Finished</th><th class="num">Score</th><th class="num">%</th></tr></thead><tbody>${hist.slice().reverse().map((h) => `<tr><td>No. ${esc(h.no)}</td><td>${new Date(h.finished).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td><td class="num">${esc(h.earned)} / ${esc(h.total)}</td><td class="num">${Math.round((100 * h.earned) / h.total)}%</td></tr>`).join('')}</tbody></table></div>`
      : `<p class="empty">No finished exams yet. Your first score appears here when you finish Practice Exam No. ${ex.no}.</p>`;
    html += `<h2 class="sub-h">By topic <span class="tut-stats">weakest first · all exams</span></h2><div class="tbl-wrap"><table class="tbl topics"><thead><tr><th>Topic</th><th class="num">Exam points</th><th>Accuracy</th><th class="num">Practice solved</th><th class="num">Cards learned</th><th></th></tr></thead><tbody>` +
      rows.map((r) => `<tr><td>${esc(r.t.title)}</td><td class="num" data-l="Exam points">${r.pts ? r.pts[0] + ' / ' + r.pts[1] : '–'}</td><td data-l="Accuracy">${r.pct == null ? '<span class="muted">no data</span>' : `<span class="meter"><span style="width:${r.pct}%" class="${r.pct >= 80 ? 'good' : r.pct >= 50 ? 'mid' : 'low'}"></span></span> ${r.pct}%`}</td><td class="num" data-l="Practice">${r.c.solved}</td><td class="num" data-l="Cards">${r.f.total ? r.f.got + ' / ' + r.f.total : '–'}</td><td><button type="button" class="btn tut sm" data-act="tutorial" data-topic="${r.t.id}">Tutorial →</button></td></tr>`).join('') +
      `</tbody></table></div>
      <div class="danger"><button type="button" class="btn ghost" data-act="reset-ask">Reset all progress…</button>
      <span id="reset-confirm" hidden>This erases every exam score, practice record and flashcard mark. <button type="button" class="btn danger-btn" data-act="reset-do">Erase everything</button> <button type="button" class="btn ghost" data-act="reset-cancel">Cancel</button></span></div>`;
    byId('prog-page').innerHTML = html;
  }

  // ================= navigation =================
  const VIEWS = ['home', 'exam', 'tutorials', 'tutorial', 'flashcards', 'deck', 'grapher', 'progress'];
  const TAB_OF = { tutorial: 'tutorials', deck: 'flashcards' };
  function setView(v, opts = {}) {
    if (App.view === 'exam' && v !== 'exam') App.examScroll = G.scrollY;
    App.view = v;
    VIEWS.forEach((k) => { byId('v-' + k).hidden = k !== v; });
    d.querySelectorAll('.tabs [data-view], .dnav [data-view]').forEach((b) => b.setAttribute('aria-current', b.dataset.view === (TAB_OF[v] || v) ? 'page' : 'false'));
    if (v === 'home') renderHome();
    if (v === 'tutorials') renderTutIndex();
    if (v === 'progress') renderProgress();
    if (v === 'tutorial') renderTutorial();
    if (v === 'flashcards') renderFlashIndex();
    if (v === 'deck') renderDeck();
    if (v === 'grapher' && MX.Grapher) MX.Grapher.render(byId('gr-page'));
    if (opts.scrollTo != null) G.scrollTo(0, opts.scrollTo);
    else if (!opts.keepScroll) G.scrollTo(0, 0);
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
  let toastTimer = 0;
  function toast(msg) {
    const t = byId('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 4000);
  }

  // ================= events =================
  // ================= mobile slide-out menu =================
  const menu = { open: false, touch: null };
  const MENU_MQ = G.matchMedia ? G.matchMedia('(max-width: 900px)') : null;
  const setInert = (el, on) => { if (!el) return; if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert'); };
  function renderDrawer() {
    const ex = examState(), sc = scoreOf(App.items, ex.res);
    const fresh = !sc.done && !Object.keys(drafts()).some((k) => k[0] === 'x');
    const nxt = App.items[firstOpenItem()];
    const jumps = [1, 2, 3].map((p) => {
      const its = App.items.filter((it) => examPartOf(it.topic) === p);
      if (!its.length) return '';
      return `<button type="button" class="dj" data-act="goto-part" data-part="${p}"><span class="dj-p">Part ${PART_NUM[p]}</span><span class="dj-t">${esc(NAV_NAME[p])}</span><span class="dj-n">${its[0].n}–${its[its.length - 1].n}</span></button>`;
    }).join('');
    byId('drawer-exam').innerHTML = `<div class="de-h">Practice Exam No. ${esc(ex.no)}${ex.finished ? ' · finished' : ''}</div>
      <div class="de-score"><b>${sc.earned}</b> / ${sc.total} points<span>${sc.done} of ${sc.parts} parts answered</span></div>
      ${meter(sc.parts ? sc.done / sc.parts : 0, 'wide')}
      <div class="de-acts">${ex.finished
        ? '<button type="button" class="btn" data-act="view" data-view="exam">Review the exam</button><button type="button" class="btn primary" data-act="new-exam">New exam</button>'
        : `<button type="button" class="btn primary" data-act="resume">${fresh ? 'Start the exam' : 'Continue at question ' + (nxt ? nxt.n : 1)}</button>`}</div>
      <div class="de-sub">Jump to</div><div class="djs">${jumps}</div>`;
  }
  function openMenu() {
    if (menu.open) return;
    menu.open = true;
    renderDrawer();
    const dr = byId('drawer');
    setInert(dr, false);
    setInert(d.querySelector('header.bar'), true);
    setInert(d.querySelector('main'), true);
    d.documentElement.classList.add('menu-open');
    byId('menu-btn').setAttribute('aria-expanded', 'true');
    const first = dr.querySelector('.dnav [aria-current="page"]') || dr.querySelector('.drawer-x');
    G.requestAnimationFrame(() => first.focus({ preventScroll: true }));
  }
  function closeMenu(returnFocus = true) {
    if (!menu.open) return;
    menu.open = false;
    const dr = byId('drawer');
    dr.style.transform = '';
    dr.style.transition = '';
    d.documentElement.classList.remove('menu-open');
    setInert(d.querySelector('header.bar'), false);
    setInert(d.querySelector('main'), false);
    setInert(dr, true);
    byId('menu-btn').setAttribute('aria-expanded', 'false');
    if (returnFocus) byId('menu-btn').focus({ preventScroll: true });
  }
  function menuKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
    if (e.key !== 'Tab') return;
    const f = [...byId('drawer').querySelectorAll('button:not([disabled])')].filter((el) => el.offsetParent);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (d.activeElement === first || !byId('drawer').contains(d.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (d.activeElement === last || !byId('drawer').contains(d.activeElement))) { e.preventDefault(); first.focus(); }
  }
  // drag the drawer to the left to close it
  function menuTouchStart(e) {
    if (!menu.open || e.touches.length !== 1) return;
    menu.touch = { x: e.touches[0].clientX, y: e.touches[0].clientY, dx: 0, drag: null };
  }
  function menuTouchMove(e) {
    const t = menu.touch;
    if (!t) return;
    t.dx = e.touches[0].clientX - t.x;
    const dy = e.touches[0].clientY - t.y;
    if (t.drag == null && (Math.abs(t.dx) > 8 || Math.abs(dy) > 8)) t.drag = Math.abs(t.dx) > Math.abs(dy);
    if (!t.drag) return;
    const dr = byId('drawer');
    dr.style.transition = 'none';
    dr.style.transform = `translateX(${Math.min(0, t.dx)}px)`;
  }
  function menuTouchEnd() {
    const t = menu.touch;
    menu.touch = null;
    if (!t || !t.drag) return;
    const dr = byId('drawer');
    dr.style.transition = '';
    if (t.dx < -Math.min(90, dr.offsetWidth * 0.3)) closeMenu();
    else dr.style.transform = '';
  }
  function onClick(e) {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const act = b.dataset.act;
    if (act === 'menu-open') { openMenu(); return; }
    if (act === 'menu-close') { closeMenu(); return; }
    // any other choice in the menu closes it first, so the page can scroll to its target
    if (menu.open && b.closest('#drawer')) { closeMenu(false); G.setTimeout(() => byId('menu-btn').focus({ preventScroll: true }), 0); }
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
    else if (act === 'view') {
      const v = b.dataset.view;
      if (v === 'exam' && App.view !== 'exam' && App.examScroll != null) setView('exam', { scrollTo: App.examScroll });
      else setView(v);
    }
    else if (act === 'resume') { setView('exam'); const i = firstOpenItem(); if (i > 0) setTimeout(() => gotoItem(i), 30); }
    else if (act === 'goto') gotoItem(+b.dataset.item);
    else if (act === 'to-practice') { const h = byId('tut-practice'); if (h) h.scrollIntoView({ block: 'start', behavior: prefersReduced() ? 'auto' : 'smooth' }); }
    else if (act === 'goto-part') {
      if (App.view !== 'exam') setView('exam', { keepScroll: true });
      const h = byId('exam-part-' + b.dataset.part);
      if (h) G.setTimeout(() => h.scrollIntoView({ block: 'start', behavior: prefersReduced() ? 'auto' : 'smooth' }), 30);
    }
    else if (act === 'more') moreExercises();
    else if (act === 'new-exam') { startNewExam(); renderExam(); setView('exam'); }
    else if (act === 'save-later') {
      Store.save();
      Store.flushRemote && Store.flushRemote();
      const i = firstOpenItem();
      App.examScroll = null;
      setView('home');
      toast(`Saved. Your exam will open at question ${App.items[i] ? App.items[i].n : 1} when you come back.`);
    }
    else if (act === 'end-ask') { byId('end-confirm').hidden = false; b.hidden = true; }
    else if (act === 'end-cancel') { byId('end-confirm').hidden = true; d.querySelector('[data-act="end-ask"]').hidden = false; }
    else if (act === 'end-do') { byId('end-confirm').hidden = true; d.querySelector('[data-act="end-ask"]').hidden = false; finishExam(); }
    else if (act === 'reset-ask') { byId('reset-confirm').hidden = false; }
    else if (act === 'reset-cancel') { byId('reset-confirm').hidden = true; }
    else if (act === 'reset-do') { Store.reset(); App.deck = null; startNewExam(); renderExam(); setView('progress'); }
    // flashcards
    else if (act === 'deck') {
      const from = b.dataset.from || (App.view === 'tutorial' ? 'tutorial' : App.view === 'home' ? 'home' : 'flashcards');
      openDeck(b.dataset.topic ? { topic: b.dataset.topic } : b.dataset.section ? { section: b.dataset.section } : { all: 1 }, b.dataset.mode || 'all', from);
    }
    else if (act === 'deck-back') setView(App.deckReturn === 'tutorial' && App.tutId ? 'tutorial' : App.deckReturn === 'home' ? 'home' : 'flashcards');
    else if (act === 'flip') flipCard();
    else if (act === 'deck-mark') markCard(+b.dataset.v);
    else if (act === 'deck-next') stepCard(1);
    else if (act === 'deck-prev') stepCard(-1);
    else if (act === 'deck-mode') { App.deck.mode = b.dataset.mode; buildOrder(); renderDeck(); }
    else if (act === 'deck-shuffle') { App.deck.shuffle = !App.deck.shuffle; buildOrder(); renderDeck(); }
  }
  function partOf(el) {
    const m = (el.id || '').match(/^(.*)-(\d+)-(\d+)$/);
    return m ? { cardId: m[1], pi: +m[2] } : null;
  }
  // the student is editing: drop a stale "can't read that" message and save the draft
  function onMathChange(e) {
    const el = e.target;
    const p = partOf(el);
    if (!p) return;
    const fb = byId('fb-' + p.cardId + '-' + p.pi);
    if (fb && (fb.classList.contains('err') || fb.classList.contains('nudge'))) { fb.className = 'fb'; fb.innerHTML = ''; }
    saveDraftFor(el);
  }
  function onMathEnter(e) {
    const p = partOf(e.target);
    if (p) doCheck(p.cardId, p.pi);
  }
  function onKey(e) {
    if (menu.open) { menuKey(e); return; }
    if (App.view !== 'deck' || !App.deck) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.ctrlKey || e.metaKey || e.altKey) return;
    const onCard = e.target.id === 'fc';
    if ((e.key === ' ' || e.key === 'Enter') && (onCard || e.target === d.body)) { e.preventDefault(); flipCard(); }
    else if (e.key === '1' && byId('fc')) markCard(0);
    else if (e.key === '2' && byId('fc')) markCard(1);
    else if (e.key === 'ArrowRight' && byId('fc')) stepCard(1);
    else if (e.key === 'ArrowLeft' && byId('fc') && App.deck.pos > 0) stepCard(-1);
  }
  function onChange(e) {
    const r = e.target;
    if (r.type === 'radio') {
      r.closest('.opts').querySelectorAll('.opt').forEach((o) => o.classList.toggle('sel', o.contains(r) && r.checked));
      saveDraftFor(r);
    } else if (r.matches && r.matches('select.units')) saveDraftFor(r);
  }

  function renderAll() {
    renderExam();
    setView(App.view, { keepScroll: true });
  }
  function boot() {
    Store.init();
    ensureExam();
    d.addEventListener('click', onClick);
    d.addEventListener('mq-change', onMathChange);
    d.addEventListener('mq-enter', onMathEnter);
    d.addEventListener('keydown', onKey);
    d.addEventListener('change', onChange);
    const dr = byId('drawer');
    dr.addEventListener('touchstart', menuTouchStart, { passive: true });
    dr.addEventListener('touchmove', menuTouchMove, { passive: true });
    dr.addEventListener('touchend', menuTouchEnd);
    dr.addEventListener('touchcancel', menuTouchEnd);
    // leaving phone width (rotating, resizing) closes the menu
    if (MENU_MQ) { const f = (ev) => { if (!ev.matches) closeMenu(false); }; if (MENU_MQ.addEventListener) MENU_MQ.addEventListener('change', f); else if (MENU_MQ.addListener) MENU_MQ.addListener(f); }
    Store.on((what) => {
      if (what === 'remote') { ensureExam(); renderAll(); }
      if (what === 'status' && App.view === 'progress') renderProgress();
    });
    renderExam();
    setView('home', { keepScroll: true });
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);

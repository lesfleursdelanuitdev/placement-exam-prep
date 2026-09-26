// src/app.js, carried over to real pages (NEXTJS-PLAN.md, step 2). The same views, in the same
// order and with the same markup and classes (styles.css styles them as it did), with two changes:
//   - every page has a real address: navigation is links (<a href>), and the page on screen is the
//     Next.js page at that address, not one of ten hidden <section>s;
//   - the HTML-making part runs on the server too (no Store there: progress is only in the
//     browser, so the server makes each page as it looks before the browser's progress is read).
// createApp({ MX, model }) on the server gives the `html` makers; in the browser,
// createApp({ MX, model, Store, win }) also drives the page (checking, drafts, decks, the menu), as
// app.js did. Changes to src/app.js upstream are carried over here by hand (PORTED.md).
import { GEN_VERSION, PART3_SEC, WORKED_N, slotsOf, allVariants, examPartOf, sectionOf } from '../../engine/model.mjs';

export function createApp({ MX, model, Store = null, win = null }) {
  const d = win ? win.document : null;
  const { orderedTopics, bySection } = model;

  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const R = (s) => MX.rich(s);
  const byId = (id) => (d ? d.getElementById(id) : null);
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many || one + 's');
  const isLogTopic = (t) => !!t && (t.section === 'Logarithms' || t.id === 'w-logs');
  // where a topic came from: the sample exams, or added to round out the course
  function sourceText(t) {
    const real = (t.sources || []).filter((s) => !/^added/i.test(s));
    const added = (t.sources || []).some((s) => /^added/i.test(s));
    if (!real.length) return 'Added topic (not on the sample exams)';
    return real.join(' · ') + (added ? ' · plus added problem types' : '');
  }

  // ================= state =================
  // On the server there is no Store: `known` is false and pages leave out what depends on progress.
  const known = () => !!(Store && Store.state);
  const st = () => (known() ? Store.state : { v: 1, exam: null, history: [], tut: {}, flash: {}, drafts: {}, updated: 0 });
  const App = { items: [], view: 'home', part: 1, tutId: null, tutTab: 'lesson', returnItem: -1, returnView: 'tutorials', deck: null, deckReturn: 'flashcards', booted: false, pendingItem: null, pendingScroll: null, restoring: false, freshDeck: false };

  const newSeed = () => {
    try { const a = new Uint32Array(1); win.crypto.getRandomValues(a); return 'e' + a[0].toString(36); } catch (e) { return 'e' + Math.floor(Math.random() * 1e9).toString(36); }
  };
  function examState() { return st().exam; }
  function drafts() { const s = st(); return (s.drafts = s.drafts || {}); }
  function flashState() { const s = st(); return (s.flash = s.flash || {}); }
  function startNewExam() {
    const S = Store.state;
    const prev = S.exam;
    const dr = drafts();
    Object.keys(dr).forEach((k) => { if (k[0] === 'x') delete dr[k]; });
    S.exam = { no: prev ? prev.no + 1 : (S.history || []).reduce((m, h) => Math.max(m, h.no), 0) + 1, seed: newSeed(), gv: GEN_VERSION, started: Date.now(), finished: null, res: {} };
    App.items = model.buildExam(S.exam.seed);
    Store.save();
  }
  function ensureExam() {
    const ex = Store.state.exam;
    if (!ex || ex.gv !== GEN_VERSION) startNewExam();
    else App.items = model.buildExam(ex.seed);
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
  const examFresh = () => { const sc = scoreOf(App.items, examState().res); return !sc.done && !Object.keys(drafts()).some((k) => k[0] === 'x'); };

  // ================= addresses =================
  //   /  /exam  /exam/part-1  /exam/results  /tutorials  /tutorials/<topic>[/examples|/practice]
  //   /flashcards  /flashcards/<topic> | /section/<name> | /all | /review  /grapher[/draw]  /progress
  const slug = (x) => String(x).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const enc = encodeURIComponent;
  const partPath = (p) => '/exam/part-' + p;
  const tutPath = (id, tab) => '/tutorials/' + enc(id) + (tab && tab !== 'lesson' ? '/' + tab : '');
  function deckPath(spec, mode) {
    if (!spec) return '/flashcards';
    if (spec.topic) return '/flashcards/' + enc(spec.topic);
    if (spec.section) return '/flashcards/section/' + slug(spec.section);
    return mode === 'learning' ? '/flashcards/review' : '/flashcards/all';
  }
  function pathOf(v) {
    switch (v) {
      case 'exam': return '/exam';
      case 'part': return partPath(App.part);
      case 'results': return '/exam/results';
      case 'tutorials': return '/tutorials';
      case 'tutorial': return App.tutId ? tutPath(App.tutId, App.tutTab) : '/tutorials';
      case 'flashcards': return '/flashcards';
      case 'deck': return App.deck ? deckPath(App.deck.spec, App.deck.mode) : '/flashcards';
      case 'grapher': return MX.Grapher && MX.Grapher.state.mode === 'draw' ? '/grapher/draw' : '/grapher';
      case 'progress': return '/progress';
      default: return '/';
    }
  }
  const sectionBySlug = (s) => { const sec = bySection().find(([x]) => slug(x) === s); return sec ? sec[0] : null; };
  const deckSpecTitle = (spec) => (spec.topic ? MX.byId[spec.topic].title : spec.section ? spec.section : 'All topics');
  const PART_NUM = { 1: 'I', 2: 'II', 3: 'III' };
  const PART_NAME = { 1: 'Skills', 2: 'Word problems', 3: PART3_SEC };
  const NAV_NAME = { 1: 'Skills', 2: 'Word problems', 3: 'Linear equations & inequalities' };
  const TUT_TABS = [['lesson', 'Lesson'], ['examples', 'Examples'], ['practice', 'Practice']];
  const tabName = (tab) => (TUT_TABS.find(([k]) => k === tab) || ['', 'Lesson'])[1];
  // the page's title, without the site's name (the layout adds " · Placement Exam Prep");
  // on the server the exam's number isn't known yet
  function titleOf(v) {
    const ex = known() ? examState() : null;
    const t = App.tutId && MX.byId[App.tutId];
    const examName = ex ? 'Exam No. ' + ex.no : 'Practice exam';
    const map = {
      home: '', exam: ex ? 'Practice Exam No. ' + ex.no : 'Practice exam', part: 'Part ' + PART_NUM[App.part] + ': ' + PART_NAME[App.part] + ' · ' + examName,
      results: 'Results · ' + examName, tutorials: 'Tutorials', tutorial: t ? t.title + ' · ' + tabName(App.tutTab) : 'Tutorial',
      flashcards: 'Flashcards', deck: App.deck ? App.deck.title + ' · Flashcards' : 'Flashcards', grapher: MX.Grapher && MX.Grapher.state.mode === 'draw' ? 'Draw a graph · Grapher' : 'Grapher', progress: 'Progress',
    };
    return map[v] || '';
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
      case 'draw': return MX.Grapher ? MX.Grapher.drawHTML({ id: base + '-0', win: p.win, tools: p.tools, value: val.value, disabled: dis, answer: dis ? p.answer : '' }) : '';
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
    if (p.kind === 'draw') return { value: MX.Grapher ? MX.Grapher.drawValue(base + '-0') : '' };
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
    const stc = r ? (r.ok === true ? ' is-ok' : r.revealed ? ' is-rv' : r.ok === false ? ' is-bad' : '') : '';
    const fbCls = r ? (r.ok === true ? 'ok' : r.revealed ? 'rv' : r.ok === false ? 'bad' : '') : '';
    return `<div class="part${stc}${locked ? ' locked' : ''}" id="pt-${base}" data-mq-bar>
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
    const stx = sourceText(t);
    const src = it.slot.source ? (/^added/i.test(it.slot.source) ? 'Added topic' : 'Like ' + it.slot.source) : /^Added/.test(stx) ? 'Added topic' : 'Seen on ' + stx;
    return `<header class="qhead"><span class="topic">${kind}</span><span class="src">${esc(src)}</span>
      <a class="btn tut" href="${tutPath(t.id)}" data-act="tutorial" data-topic="${t.id}" data-item="${i}">Tutorial<span aria-hidden="true"> →</span></a></header>`;
  }
  const PART3_NOTE = 'One question for each skill in a full chapter on linear equations and inequalities: solving strategies, problem solving, formulas, applications, interval notation, compound and absolute value inequalities.';
  // the part page's frame (src/shell.html's #v-part): the exam fills it in the browser
  function partFrameHTML(part) {
    return `<aside class="sheet" aria-label="Answer sheet">
      <div class="sheet-h">Answer sheet</div>
      <div id="nav-bubbles" class="bubbles"></div>
      <div class="legend"><span><i class="l-ok"></i>correct</span><span><i class="l-bad"></i>missed</span><span><i class="l-part"></i>in progress</span></div>
    </aside>
    <div class="paper">
      <header class="exam-h">
        <div class="exam-course">Algebra placement exam</div>
        <h1 id="exam-title" tabindex="-1">Part ${PART_NUM[part]}: ${esc(PART_NAME[part])}</h1>
        <div id="exam-meta" class="exam-meta">Building your exam…</div>
        <div class="summary">
          <div class="sum-b"><span class="sum-l">Score</span><span class="sum-n"><span id="sum-earned">0</span><small> / <span id="sum-total">0</span></small></span></div>
          <div class="sum-b"><span class="sum-l">Parts answered</span><span class="sum-n" id="sum-done">0</span></div>
          <div class="sum-b"><span class="sum-l">Accuracy so far</span><span class="sum-n" id="sum-pct">–</span></div>
          <div class="progress" aria-hidden="true"><span id="sum-bar"></span><span id="sum-bar-ok"></span></div>
        </div>
        <p class="instr"><strong>Show all work</strong> on scratch paper. Type each answer in its box and press <b>Check</b> (or Enter). Each part is graded once; point values are in parentheses. Use <b>Tutorial</b> to study a topic; your score stays put while you're away. Everything saves as you type, so you can stop and finish later.</p>
        <div class="exam-tools">
          <details class="howto"><summary>How to type answers</summary>
            <p>Each answer box shows your math the way it will be graded. The symbol buttons appear under the box you're typing in.</p>
            <table>
              <tr><td>Exponents</td><td>Type <kbd>^</kbd> and the exponent: <code>x^2</code> shows as <span class="m"><i class="mi">x</i><sup><span class="mn">2</span></sup></span>. Typing <kbd>+</kbd>, <kbd>−</kbd> or <kbd>=</kbd> brings you back down, or press <kbd>→</kbd>.</td></tr>
              <tr><td>Fractions</td><td>Type <kbd>/</kbd> and the term before it moves on top: <code>(x+2)/</code> then <code>x−3</code>. Press <kbd>→</kbd> to leave the bottom. Or tap the fraction button.</td></tr>
              <tr><td>Radicals</td><td>Tap <b>√</b> or type <code>sqrt</code>. The bar stretches over what you type; press <kbd>→</kbd> to leave it.</td></tr>
              <tr><td>±, ≤, ≥</td><td>Tap the buttons, or type <code>+-</code>, <code>&lt;=</code>, <code>&gt;=</code>.</td></tr>
              <tr><td>Points</td><td><code>(3, -2)</code></td></tr>
              <tr><td>Scientific notation</td><td><code>3.9671</code> then the <b>×10ⁿ</b> button and <code>5</code></td></tr>
              <tr><td>Logs</td><td>Type <code>log</code>, <code>ln</code>, or <code>log_2</code> for a base (or tap <b>log□</b>).</td></tr>
              <tr><td>Intervals</td><td><code>[-3, 5)</code>, <code>(-inf, 2) U (2, inf)</code>; <code>inf</code> becomes ∞.</td></tr>
              <tr><td>Special answers</td><td>The <b>no solution</b>, <b>prime</b> and <b>all reals</b> buttons.</td></tr>
            </table>
            Use <kbd>←</kbd> <kbd>→</kbd> (also on the button bar) to move between the top and bottom of a fraction, and <kbd>Enter</kbd> to check.
          </details>
          <div id="exam-finish" hidden><span id="end-row"><button type="button" class="btn" data-act="save-later">Save and finish later</button><button type="button" class="btn ghost" data-act="end-ask">End exam now…</button><span id="end-confirm" hidden>Unanswered parts will score 0. <button type="button" class="btn danger-btn" data-act="end-do">End exam</button> <button type="button" class="btn ghost" data-act="end-cancel">Keep working</button></span></span></div>
        </div>
      </header>
      <div id="exam-list"></div>
      <nav id="part-nav" class="part-nav" aria-label="Exam parts"></nav>
    </div>`;
  }
  function renderExam() {
    if (!byId('exam-list')) return;
    const ex = examState();
    const res = ex.res;
    const finished = !!ex.finished;
    let html = '', lastSec = null, lastPart = 0;
    [...REG.keys()].forEach((k) => { if (k[0] === 'x') REG.delete(k); });
    App.items.forEach((it, i) => {
      const part = examPartOf(it.topic);
      if (part !== App.part) return; // one part per page
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
    const parts = [1, 2, 3].filter((p) => App.items.some((it) => examPartOf(it.topic) === p));
    const k = parts.indexOf(App.part), prev = parts[k - 1], next = parts[k + 1];
    byId('part-nav').innerHTML = (prev ? `<a class="btn" href="${partPath(prev)}" data-act="goto-part" data-part="${prev}">← Part ${PART_NUM[prev]}: ${esc(PART_NAME[prev])}</a>` : '<span></span>') +
      (next ? `<a class="btn primary" href="${partPath(next)}" data-act="goto-part" data-part="${next}">Part ${PART_NUM[next]}: ${esc(PART_NAME[next])} →</a>`
        : finished ? '<a class="btn primary" href="/exam/results">See your results →</a>' : '<a class="btn primary" href="/exam">Exam overview →</a>');
    renderExamHeader();
    renderNav();
  }
  // the exam's first page: where you start, continue, and see each part's progress
  function partItems(p) { return App.items.map((it, i) => ({ it, i })).filter((x) => examPartOf(x.it.topic) === p); }
  const resumePath = () => { const it = App.items[firstOpenItem()]; return partPath(it ? examPartOf(it.topic) : 1); };
  const examHead = (title, meta) => `<header class="exam-h"><div class="exam-course">Algebra placement exam</div><h1 tabindex="-1">${title}</h1><div class="exam-meta">${meta}</div></header>`;
  function examHomeHTML() {
    if (!known()) {
      return examHead('Practice exam', 'Building your exam…') +
        '<p class="instr">The exam has three parts, each on its own page. <strong>Show all work</strong> on scratch paper, type each answer and press <b>Check</b>. Each part of a question is graded once. Everything saves as you type, so you can stop and finish later.</p>';
    }
    const ex = examState(), sc = scoreOf(App.items, ex.res);
    const started = new Date(ex.started);
    const fresh = examFresh();
    const nxt = App.items[firstOpenItem()];
    const main = ex.finished
      ? `<a class="btn primary" href="/exam/results">See your results</a><button type="button" class="btn" data-act="new-exam">Start Practice Exam No. ${ex.no + 1}</button>`
      : `<a class="btn primary" href="${resumePath()}" data-act="resume">${fresh ? 'Start the exam' : 'Continue at question ' + (nxt ? nxt.n : 1)}</a>`;
    const cards = [1, 2, 3].map((p) => {
      const list = partItems(p);
      if (!list.length) return '';
      let pts = 0, earned = 0, parts = 0, done = 0;
      list.forEach(({ it }) => it.q.parts.forEach((q, pi) => { const r = (ex.res[it.key] || {})[pi]; parts++; pts += q.points; if (r && r.ok !== undefined) { done++; if (r.ok) earned += q.points; } }));
      return `<article class="pcard"><div class="pc-h"><span class="pc-n">Part ${PART_NUM[p]}</span><h2>${esc(PART_NAME[p])}</h2></div>
        <p class="pc-m">Questions ${list[0].it.n}–${list[list.length - 1].it.n} · ${list.length} questions · ${pts} points</p>
        ${meter(parts ? done / parts : 0, 'wide')}
        <p class="pc-s">${done ? `${done} of ${parts} answer parts checked · <b>${earned}</b> of ${pts} points` : 'Not started'}</p>
        <a class="btn${done && done < parts && !ex.finished ? ' primary' : ''}" href="${partPath(p)}" data-act="goto-part" data-part="${p}">${ex.finished ? 'Review' : done ? 'Open' : 'Start'} Part ${PART_NUM[p]}</a></article>`;
    }).join('');
    return examHead(`Practice Exam No. ${esc(ex.no)}`, `Generated ${esc(started.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }))} · ${App.items.length} questions · ${sc.total} points${ex.finished ? ' · finished' : ''}`) +
      `<div class="eh-score"><div class="sum-b"><span class="sum-l">Score</span><span class="sum-n">${sc.earned}<small> / ${sc.total}</small></span></div>
        <div class="sum-b"><span class="sum-l">Parts answered</span><span class="sum-n">${sc.done} / ${sc.parts}</span></div>
        <div class="sum-b"><span class="sum-l">Accuracy so far</span><span class="sum-n">${sc.done ? Math.round((100 * sc.earned) / Math.max(1, answeredPoints())) + '%' : '–'}</span></div></div>
      <div class="res-acts eh-acts">${main}</div>
      <p class="instr">The exam has three parts, each on its own page. <strong>Show all work</strong> on scratch paper, type each answer and press <b>Check</b>. Each part of a question is graded once. Everything saves as you type, so you can stop and finish later.</p>
      <div class="pcards">${cards}</div>`;
  }
  function resultsHTML() {
    if (!known()) return examHead('Results', 'Reading your exam…');
    const ex = examState();
    if (!ex.finished) return '<header class="page-h"><h1 tabindex="-1">Results</h1></header><p>This exam isn’t finished yet.</p><a class="btn primary" href="/exam">Exam overview</a>';
    const sc = scoreOf(App.items, ex.res);
    const weak = Object.entries(sc.byTopic).filter(([, v]) => v[0] < v[1]).map(([k, v]) => [k, v[0] / v[1]]).sort((a, b) => a[1] - b[1]).slice(0, 5);
    const byPart = [1, 2, 3].map((p) => {
      const list = partItems(p);
      if (!list.length) return '';
      let pts = 0, earned = 0;
      list.forEach(({ it }) => it.q.parts.forEach((q, pi) => { pts += q.points; const r = (ex.res[it.key] || {})[pi]; if (r && r.ok) earned += q.points; }));
      return `<tr><td>Part ${PART_NUM[p]}: ${esc(PART_NAME[p])}</td><td><b>${earned}</b> / ${pts}</td><td><a class="btn ghost" href="${partPath(p)}" data-act="goto-part" data-part="${p}">Review</a></td></tr>`;
    }).join('');
    return `<section class="results" aria-live="polite"><div class="res-score"><span class="big">${sc.earned}</span><span class="of">/ ${sc.total}</span><span class="pc">${sc.pct}%</span></div>
        <div class="res-body"><div class="exam-course">Practice Exam No. ${esc(ex.no)}</div><h1 tabindex="-1">Exam complete</h1>
        <p>${sc.pct >= 90 ? 'Excellent work.' : sc.pct >= 75 ? 'Solid. A little review will push this higher.' : sc.pct >= 60 ? 'You passed the bar for many courses; review the topics below.' : 'Keep going: work through the tutorials below, then try a fresh exam.'} Your score is saved in Progress.</p>
        ${weak.length ? `<p class="weak-h">Review first:</p><div class="weak">${weak.map(([k]) => `<a class="btn tut" href="${tutPath(k)}" data-act="tutorial" data-topic="${k}">${esc(MX.byId[k].title)} →</a>`).join('')}</div>` : ''}
        <table class="tbl res-parts">${byPart}</table>
        <div class="res-acts"><button type="button" class="btn primary" data-act="new-exam">Generate a new exam</button><a class="btn ghost" href="/">Home</a></div></div></section>`;
  }
  function renderExamHome() { const el = byId('exam-home'); if (el) el.innerHTML = examHomeHTML(); }
  function renderResults() { const el = byId('results-page'); if (el) el.innerHTML = resultsHTML(); }
  function renderChip() {
    const el = byId('score-chip');
    if (!el || !known()) return;
    const ex = examState();
    const sc = scoreOf(App.items, ex.res);
    el.innerHTML = `<a class="chip-b" href="/exam" title="Go to the exam"><span class="chip-l">Exam No. ${esc(ex.no)}</span><b>${sc.earned}</b><span>/ ${sc.total}</span></a>`;
  }
  function renderExamHeader() {
    if (!byId('exam-title')) return;
    const ex = examState();
    const sc = scoreOf(App.items, ex.res);
    const started = new Date(ex.started);
    byId('exam-title').textContent = 'Part ' + PART_NUM[App.part] + ': ' + PART_NAME[App.part];
    byId('exam-meta').textContent = `Practice Exam No. ${ex.no} · generated ${started.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · ${App.items.length} questions · ${sc.total} points`;
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
  }
  function answeredPoints() {
    const ex = examState();
    let t = 0;
    App.items.forEach((it) => it.q.parts.forEach((p, pi) => { const r = (ex.res[it.key] || {})[pi]; if (r && r.ok !== undefined) t += p.points; }));
    return t;
  }
  function renderNav() {
    const el = byId('nav-bubbles');
    if (!el) return;
    const ex = examState();
    let html = '';
    App.items.forEach((it, i) => {
      const part = examPartOf(it.topic);
      if (i === 0 || examPartOf(App.items[i - 1].topic) !== part) html += `<div class="nav-sec">${esc(NAV_NAME[part])}</div>`;
      const s = itemStatus(it, ex.res);
      html += `<button type="button" class="bub ${s}" data-act="goto" data-item="${i}" title="${esc(it.n + '. ' + it.topic.title)}">${it.n}</button>`;
    });
    el.innerHTML = html;
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
    const S = Store.state;
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
    S.history = (S.history || []).filter((h) => h.no !== ex.no);
    S.history.push({ no: ex.no, earned: sc.earned, total: sc.total, started: ex.started, finished: ex.finished, byTopic: sc.byTopic });
    if (S.history.length > 60) S.history = S.history.slice(-60);
    Store.save();
    renderExam();
    go('/exam/results');
  }
  const prefersReduced = () => win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    const all = (st().tut = st().tut || {});
    return (all[id] = all[id] || { batches: [], res: {} });
  }
  function tutCounts(id) {
    const s = (st().tut || {})[id] || { res: {} };
    let solved = 0, attempted = 0;
    Object.values(s.res).forEach((rr) => {
      const vals = Object.values(rr);
      if (!vals.length) return;
      attempted++;
      if (vals.every((r) => r.ok === true)) solved++;
    });
    return { solved, attempted };
  }
  const BACK_TEXT = { tutorials: '← All tutorials', progress: '← Back to progress', home: '← Home', flashcards: '← All flashcards', deck: '← Back to the flashcards' };
  // the tutorial's top row: back to where the student came from (known only in the browser)
  function tutTopHTML(t) {
    const rv = App.returnView || 'tutorials';
    const backText = rv === 'part' || rv === 'exam' ? (App.returnItem >= 0 && App.items[App.returnItem] ? `← Back to the exam (question ${App.items[App.returnItem].n})` : '← Back to the exam') : BACK_TEXT[rv] || '← All tutorials';
    const back = `<a class="btn back" href="${pathOf(rv)}" data-act="back">${backText}</a>`;
    const nCards = (MX.FLASH[t.id] || []).length;
    return `${back}${rv !== 'tutorials' ? `<a class="btn ghost" href="/tutorials">All tutorials</a>` : ''}
        ${nCards ? `<a class="btn tut deck-link" href="${deckPath({ topic: t.id })}" data-act="deck" data-topic="${t.id}" data-from="tutorial">Flashcards for this topic (${nCards}) →</a>` : ''}`;
  }
  // the tutorial page (tab: lesson | examples | practice). Lessons and examples are the same for
  // everyone and made on the server (`wq`: the worked examples, made once); practice needs the
  // student's record and is made in the browser.
  function tutorialHTML(t, tab, wq) {
    const vnames = allVariants(t).map((k) => `<span class="vchip">${esc(t.variants[k].name)}</span>`).join('');
    let html = `<div class="tut-top">${tutTopHTML(t)}</div>
      <header class="tut-head"><div class="eyebrow">${esc(sectionOf(t))}</div><h1 tabindex="-1">${esc(t.title)}</h1>
      <p class="tut-src">${/^Added/.test(sourceText(t)) ? esc(sourceText(t)) : 'On the sample exams: ' + esc(sourceText(t))}</p>
      <div class="vchips" aria-label="Problem types covered">${vnames}</div></header>
      <nav class="tut-tabs" aria-label="Tutorial pages">${TUT_TABS.map(([k, name], n) => `<a href="${tutPath(t.id, k)}" data-act="tut-tab" data-tab="${k}"${tab === k ? ' aria-current="page"' : ''}><span class="tt-n">${n + 1}</span>${name}${k === 'examples' ? ` <span class="tt-c">${WORKED_N}</span>` : ''}</a>`).join('')}</nav>`;
    const nextTab = (k, label) => `<div class="tut-next"><a class="btn primary" href="${tutPath(t.id, k)}" data-act="tut-tab" data-tab="${k}">${label} →</a></div>`;
    if (tab === 'lesson') return html + `<section class="lesson">${R(t.lesson)}</section>` + nextTab('examples', 'Next: worked examples');
    if (tab === 'examples') {
      wq = wq || model.workedExamples(t);
      return html + `<h2 class="sub-h">Worked examples <span class="tut-stats">${wq.length} examples</span></h2>
        <div class="worked-list">${wq.map((w, k) => workedHTML(w.q, k, allVariants(t).length > 1 ? t.variants[w.vk].name : '')).join('')}</div>` + nextTab('practice', 'Next: practice');
    }
    html += `<h2 class="sub-h" id="tut-practice">Practice <span id="tut-stats" class="tut-stats"></span></h2>
      <p class="hint">Check as many times as you like. "Show answer" reveals the answer and the worked solution.</p>`;
    if (!known()) return html + '<div class="ex-list"><p class="empty">Making your exercises…</p></div>';
    const s = tutState(t.id);
    const ctx = { logs: isLogTopic(t) };
    [...REG.keys()].forEach((k) => { if (k[0] === 't') REG.delete(k); });
    html += '<div class="ex-list">';
    model.practice(t, s.batches).forEach((e, k) => {
      const cardId = 't-' + t.id + '-' + e.key;
      REG.set(cardId, {
        q: e.q, mode: 'tut', ctx,
        getRes: (pi) => (s.res[e.key] || {})[pi],
        setRes: (pi, r) => { (s.res[e.key] = s.res[e.key] || {})[pi] = r; },
      });
      html += cardHTML(e.q, { cardId, mode: 'tut', num: 'Exercise ' + (k + 1), res: s.res[e.key], ctx, head: t.kind === 'word' || allVariants(t).length > 1 ? `<header class="qhead"><span class="topic">${esc(t.variants[e.vk].name)}</span></header>` : '' });
    });
    html += `</div><div class="more">
      <label for="more-kind" class="more-l">Generate more exercises</label>
      <select id="more-kind" class="units">${allVariants(t).length > 1 ? '<option value="">Mixed types</option>' : ''}${allVariants(t).map((k) => `<option value="${k}">${esc(t.variants[k].name)}</option>`).join('')}</select>
      <button type="button" class="btn primary" data-act="more">Add 3 exercises</button></div>`;
    return html;
  }
  function renderTutorial() {
    const t = MX.byId[App.tutId];
    const el = byId('tut-page');
    if (!t || !el) return;
    if (App.tutTab === 'practice') { el.innerHTML = tutorialHTML(t, 'practice'); renderTutStats(); return; }
    // lesson and examples came from the server: only the way back depends on this browser
    const top = el.querySelector('.tut-top');
    if (top) top.innerHTML = tutTopHTML(t);
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
    const s = tutState(t.id);
    s.batches.push(sel ? sel.value : '');
    Store.save();
    const n = 3 + (s.batches.length - 1) * 3;
    renderTutorial();
    const cards = d.querySelectorAll('#tut-page .ex-list .card');
    if (cards[n]) cards[n].scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' });
  }
  function tutIndexHTML() {
    const topics = orderedTopics();
    const total = topics.length;
    const k = known();
    const practiced = k ? topics.filter((t) => tutCounts(t.id).attempted).length : 0;
    const ex = k ? examState() : null;
    let html = `<header class="page-h"><h1>Tutorials</h1><p>${total} topics, each with a short lesson, worked examples and unlimited practice.${k ? ` You've practiced ${practiced} of them; your record is saved.` : ''}</p></header>`;
    bySection().forEach(([s, list]) => {
      html += `<h2 class="sec-h">${esc(s)}</h2><div class="tiles">`;
      list.forEach((t) => {
        const c = k ? tutCounts(t.id) : null;
        const got = ex && Object.values(ex.res).length ? examTopicState(t.id) : '';
        html += `<a class="tile" href="${tutPath(t.id)}" data-act="tutorial" data-topic="${t.id}">
          <span class="tile-t">${esc(t.title)}</span>
          <span class="tile-s">${esc(sourceText(t))}</span>
          <span class="tile-m">${t.kind === 'word' ? plural(Object.keys(t.variants).length, 'problem type') + (c ? ' · ' : '') : ''}${c ? (c.solved ? c.solved + ' solved' : 'not started') : ''}${got}</span></a>`;
      });
      html += '</div>';
    });
    return html;
  }
  function renderTutIndex() { const el = byId('tut-index'); if (el) el.innerHTML = tutIndexHTML(); }
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
  const cardsOf = (id) => MX.FLASH[id] || [];
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
  function flashIndexHTML() {
    const k = known();
    const all = flashCounts(allTopicIds());
    let html = `<header class="page-h"><h1>Flashcards</h1><p>One deck for each topic: the rules, formulas and quick examples. Flip a card, then mark it <b>Got it</b> or <b>Still learning</b>. Your marks are saved.</p></header>
      <div class="fc-total">${meter(all.total ? all.got / all.total : 0, 'wide')}<span>${k ? `<b>${all.got}</b> of ${all.total} cards learned` : `${all.total} cards`}${all.learning ? ` · ${all.learning} still learning` : ''}</span>
      ${all.learning ? `<a class="btn ghost" href="/flashcards/review" data-act="deck" data-all="1" data-mode="learning">Review all still learning (${all.learning})</a>` : ''}</div>`;
    bySection().forEach(([s, list]) => {
      const ids = list.map((t) => t.id).filter((id) => cardsOf(id).length);
      if (!ids.length) return;
      const c = flashCounts(ids);
      html += `<div class="sec-row"><h2 class="sec-h">${esc(s)}</h2><a class="btn tut sm" href="${deckPath({ section: s })}" data-act="deck" data-section="${esc(s)}">Study the whole section (${c.total})</a></div><div class="tiles">`;
      ids.forEach((id) => {
        const t = MX.byId[id], n = flashCounts([id]);
        html += `<a class="tile" href="${deckPath({ topic: id })}" data-act="deck" data-topic="${id}">
          <span class="tile-t">${esc(t.title)}</span>
          <span class="tile-m">${plural(n.total, 'card')}${k ? ` · ${n.got ? n.got + ' learned' : 'not started'}${n.learning ? ' · ' + n.learning + ' still learning' : ''}` : ''}</span>
          ${meter(n.total ? n.got / n.total : 0)}</a>`;
      });
      html += '</div>';
    });
    return html;
  }
  function renderFlashIndex() { const el = byId('flash-index'); if (el) el.innerHTML = flashIndexHTML(); }
  // a study session: spec = {topic} | {section} | {all}
  function newDeck(spec, mode) {
    let ids, eyebrow;
    if (spec.topic) { ids = [spec.topic]; eyebrow = sectionOf(MX.byId[spec.topic]); }
    else if (spec.section) { ids = bySection().find(([s]) => s === spec.section)[1].map((t) => t.id); eyebrow = 'Whole section'; }
    else { ids = allTopicIds(); eyebrow = 'Every deck'; }
    ids = ids.filter((id) => cardsOf(id).length);
    return { spec, ids, title: deckSpecTitle(spec), eyebrow, mode: mode || 'all', shuffle: false, order: [], pos: 0, flipped: false, seen: {} };
  }
  function openDeck(spec, mode) {
    const shuffle = App.deck ? App.deck.shuffle : false;
    App.deck = newDeck(spec, mode);
    App.deck.shuffle = shuffle;
    buildOrder();
  }
  function buildOrder(dk = App.deck) {
    const fs = flashState();
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
  const deckBackPath = () => (App.deckReturn === 'tutorial' && App.tutId ? pathOf('tutorial') : App.deckReturn === 'home' ? '/' : '/flashcards');
  // dk: the deck; on the server a fresh one (no marks known: the first card, and no counts)
  function deckHTML(dk) {
    const k = known();
    const cnt = flashCounts(dk.ids);
    const single = dk.spec.topic;
    const enter = dk.enter;
    dk.enter = null;
    const backTo = App.deckReturn === 'tutorial' ? '← Back to the tutorial' : App.deckReturn === 'home' ? '← Home' : '← All flashcards';
    let html = `<div class="tut-top"><a class="btn back" href="${deckBackPath()}" data-act="deck-back">${backTo}</a>
        ${single ? `<a class="btn tut" href="${tutPath(single)}" data-act="tutorial" data-topic="${single}">Open the tutorial →</a>` : ''}</div>
      <header class="tut-head"><div class="eyebrow">${esc(dk.eyebrow)}</div><h1 tabindex="-1">${esc(dk.title)}</h1>
      <div class="fc-total">${meter(cnt.total ? cnt.got / cnt.total : 0, 'wide')}<span>${k ? `<b>${cnt.got}</b> of ${cnt.total} learned${cnt.learning ? ` · ${cnt.learning} still learning` : ''}` : plural(cnt.total, 'card')}</span></div></header>`;
    if (!k && dk.mode === 'learning') return html + '<p class="empty">Finding the cards you marked “Still learning”…</p>';
    html += `<div class="deck-ctl">
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
        ${single ? `<a class="btn tut" href="${tutPath(single)}" data-act="tutorial" data-topic="${single}">Open the tutorial →</a>` : ''}
        <a class="btn ghost" href="${deckBackPath()}" data-act="deck-back">${backTo.replace('← ', '')}</a></div></div>`;
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
    return html;
  }
  function renderDeck() {
    const el = byId('deck-page');
    if (!el || !App.deck) return;
    el.innerHTML = deckHTML(App.deck);
  }
  // on the server: the deck as it opens for someone with no marks
  function serverDeckHTML(spec, mode) {
    const dk = newDeck(spec, mode);
    buildOrder(dk);
    return deckHTML(dk);
  }

  // ================= home =================
  const ICONS = {
    exam: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="9" y="5" width="30" height="38" rx="3" class="ic-p"/><path d="M15 14h18M15 21h18M15 28h10" class="ic-l"/><circle cx="31" cy="33" r="6" class="ic-a"/><path d="M28.5 33l2 2 3.5-4" class="ic-w"/></svg>',
    tut: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 11c6-3 12-3 18 1 6-4 12-4 18-1v27c-6-3-12-3-18 1-6-4-12-4-18-1z" class="ic-p"/><path d="M24 12v27" class="ic-l"/><path d="M11 18c3-1 6-1 9 1M11 24c3-1 6-1 9 1M28 19c3-2 6-2 9-1" class="ic-l"/></svg>',
    flash: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="12" y="8" width="28" height="20" rx="3" class="ic-p" transform="rotate(8 26 18)"/><rect x="7" y="16" width="30" height="22" rx="3" class="ic-p"/><path d="M14 27h16" class="ic-l"/><text x="22" y="25" class="ic-t">a²</text></svg>',
  };
  function homeHTML() {
    const k = known();
    let examBody, examBtns, examMeter = '';
    if (!k) {
      examBody = 'A full-length practice exam in three parts: skills, word problems, and linear equations and inequalities. Your work saves as you go, so you can stop and come back.';
      examBtns = '<a class="btn primary" href="/exam">Open the exam</a>';
    } else {
      const ex = examState();
      const sc = scoreOf(App.items, ex.res);
      if (ex.finished) {
        examBody = `Practice Exam No. ${ex.no} is finished: <b>${sc.earned} / ${sc.total}</b> (${sc.pct}%). A new exam uses fresh numbers and situations; your tutorials stay the same.`;
        examBtns = `<button type="button" class="btn primary" data-act="new-exam">Start Practice Exam No. ${ex.no + 1}</button><a class="btn ghost" href="/exam">Review No. ${ex.no}</a>`;
      } else if (examFresh()) {
        examBody = `Practice Exam No. ${ex.no} is ready: ${App.items.length} questions worth ${sc.total} points, in three parts: skills, word problems, and linear equations and inequalities. Your work saves as you go, so you can stop and come back.`;
        examBtns = `<a class="btn primary" href="${resumePath()}" data-act="resume">Start the exam</a>`;
      } else {
        const nxt = App.items[firstOpenItem()];
        examBody = `Practice Exam No. ${ex.no} is in progress: ${sc.done} of ${sc.parts} parts answered, <b>${sc.earned}</b> points so far.`;
        examBtns = `<a class="btn primary" href="${resumePath()}" data-act="resume">Continue at question ${nxt ? nxt.n : 1}</a>`;
      }
      if (!ex.finished) examMeter = `<div class="ch-meter">${meter(sc.parts ? sc.done / sc.parts : 0)}<span>${Math.round((100 * sc.done) / Math.max(1, sc.parts))}% answered</span></div>`;
    }
    const fc = flashCounts(allTopicIds());
    const topics = orderedTopics();
    const practiced = k ? topics.filter((t) => tutCounts(t.id).attempted).length : 0;
    const hist = st().history || [];
    const last = hist[hist.length - 1];
    const dash = '–';
    return `<header class="home-h"><div class="exam-course">Algebra placement exam</div><h1>Placement Exam Prep</h1>
        <p>Take full-length practice exams, study any topic step by step, and drill the rules with flashcards. Everything you do is saved.</p></header>
      <div class="choices">
        <article class="choice"><div class="ch-ic">${ICONS.exam}</div><div class="ch-b"><h2>Practice exam</h2><p>${examBody}</p>
          ${examMeter}
          <div class="ch-acts">${examBtns}</div></div></article>
        <article class="choice"><div class="ch-ic">${ICONS.tut}</div><div class="ch-b"><h2>Tutorials</h2><p>${topics.length} topics, grouped by section. Each has a lesson, worked examples and as many practice problems as you want.</p>
          <div class="ch-acts"><a class="btn primary" href="/tutorials">Browse tutorials</a></div></div></article>
        <article class="choice"><div class="ch-ic">${ICONS.flash}</div><div class="ch-b"><h2>Flashcards</h2><p>${fc.total} cards: one deck for every topic, or study a whole section at once.</p>
          <div class="ch-acts"><a class="btn primary" href="/flashcards">Study flashcards</a>${fc.learning ? `<a class="btn ghost" href="/flashcards/review" data-act="deck" data-all="1" data-mode="learning" data-from="home">Review ${fc.learning} still learning</a>` : ''}</div></div></article>
      </div>
      <h2 class="sub-h">Your progress</h2>
      <div class="stats">
        <div class="stat"><span class="stat-n">${last ? Math.round((100 * last.earned) / last.total) + '%' : dash}</span><span class="stat-l">${last ? `last exam (No. ${esc(last.no)}: ${esc(last.earned)} / ${esc(last.total)})` : k ? 'last exam score (none finished yet)' : 'last exam score'}</span></div>
        <div class="stat"><span class="stat-n">${k ? practiced : dash}<small> / ${topics.length}</small></span><span class="stat-l">tutorials practiced</span></div>
        <div class="stat"><span class="stat-n">${k ? fc.got : dash}<small> / ${fc.total}</small></span><span class="stat-l">flashcards learned</span></div>
      </div>
      <p class="home-more"><a class="btn ghost" href="/progress">See all progress →</a></p>`;
  }
  function renderHome() { const el = byId('home-page'); if (el) el.innerHTML = homeHTML(); }

  // ================= progress =================
  function progressHTML() {
    if (!known()) return '<header class="page-h"><h1>Progress</h1><p>Saved in this browser.</p></header><p class="empty">Reading your progress…</p>';
    const hist = st().history || [];
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
    // guest-only for now (NEXTJS-PLAN.md): progress lives in this browser
    const status = 'Saved in this browser.';
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
      rows.map((r) => `<tr><td>${esc(r.t.title)}</td><td class="num" data-l="Exam points">${r.pts ? r.pts[0] + ' / ' + r.pts[1] : '–'}</td><td data-l="Accuracy">${r.pct == null ? '<span class="muted">no data</span>' : `<span class="meter"><span style="width:${r.pct}%" class="${r.pct >= 80 ? 'good' : r.pct >= 50 ? 'mid' : 'low'}"></span></span> ${r.pct}%`}</td><td class="num" data-l="Practice">${r.c.solved}</td><td class="num" data-l="Cards">${r.f.total ? r.f.got + ' / ' + r.f.total : '–'}</td><td><a class="btn tut sm" href="${tutPath(r.t.id)}" data-act="tutorial" data-topic="${r.t.id}">Tutorial →</a></td></tr>`).join('') +
      `</tbody></table></div>
      <div class="danger"><button type="button" class="btn ghost" data-act="reset-ask">Reset all progress…</button>
      <span id="reset-confirm" hidden>This erases every exam score, practice record and flashcard mark. <button type="button" class="btn danger-btn" data-act="reset-do">Erase everything</button> <button type="button" class="btn ghost" data-act="reset-cancel">Cancel</button></span></div>`;
    return html;
  }
  function renderProgress() { const el = byId('prog-page'); if (el) el.innerHTML = progressHTML(); }

  // the grapher's page before the grapher is built (it builds its own heading, the same)
  const grapherHTML = () => '<header class="page-h"><h1>Grapher</h1><p>Graph functions and equations, or draw a graph yourself and check it.</p></header><p class="empty">Setting up the grapher…</p>';

  // Everything a page is made of, as HTML. On the server these show the page before the browser
  // has read the student's progress; in the browser, the same with it.
  const html = { home: homeHTML, examHome: examHomeHTML, results: resultsHTML, partFrame: partFrameHTML, tutIndex: tutIndexHTML, tutorial: tutorialHTML, flashIndex: flashIndexHTML, deck: serverDeckHTML, progress: progressHTML, grapher: grapherHTML };
  const paths = { part: partPath, tutorial: tutPath, deck: deckPath, sectionBySlug, slug };
  const shared = { App, html, paths, titleOf, deckSpecTitle, PART_NUM, PART_NAME, tabName, workedHTML };
  if (!win) return shared;

  // =============================================================================================
  // In the browser: the page on screen, links, the menu, keys. (app.js's setView and its
  // hash router are gone: Next.js shows the page for each address, and mount() fills it in.)
  // =============================================================================================
  MX.App = App; // as app.js: the page's state on the engine (the tests read the exam from it)
  let router = null; // { push(href), replace(href) } from the layout (Next.js's router)
  const scrollMem = {};
  const here = () => win.location.pathname;
  function go(path) {
    if (path === here()) { remount(); return; }
    if (router) router.push(path); else win.location.assign(path);
  }
  // the same page, another address (the deck's "still learning", the grapher's mode): no new page
  function readdress(path) {
    if (path === here()) return;
    try { win.history.replaceState(null, '', path); } catch (e) { /* the address stays */ }
  }
  let current = null; // { view, params }
  function remount() { if (current) mount(current.view, current.params); }

  // A page's content is on screen (from the server): fill in what depends on this browser.
  // view: home exam part results tutorials tutorial flashcards deck grapher progress
  function mount(view, params = {}) {
    current = { view, params };
    const first = !App.booted;
    App.view = view;
    if (view === 'home') renderHome();
    else if (view === 'exam') renderExamHome();
    else if (view === 'part') { App.part = params.part; renderExam(); }
    else if (view === 'results') renderResults();
    else if (view === 'tutorials') renderTutIndex();
    else if (view === 'tutorial') {
      if (App.tutId !== params.id) { App.returnView = 'tutorials'; App.returnItem = -1; }
      App.tutId = params.id;
      App.tutTab = params.tab || 'lesson';
      renderTutorial();
    } else if (view === 'flashcards') renderFlashIndex();
    else if (view === 'deck') {
      const same = App.deck && JSON.stringify(App.deck.spec) === JSON.stringify(params.spec);
      // a deck link starts the deck over (as app.js's buttons did); back/forward and reloads keep it
      if (!same || App.freshDeck) openDeck(params.spec, params.mode);
      else if (params.mode === 'learning' && App.deck.mode !== 'learning') { App.deck.mode = 'learning'; buildOrder(); }
      App.freshDeck = false;
      renderDeck();
    } else if (view === 'grapher' && MX.Grapher) {
      MX.Grapher.state.mode = params.mode === 'draw' ? 'draw' : 'graph';
      MX.Grapher.render(byId('gr-page'), { mode: MX.Grapher.state.mode });
    } else if (view === 'progress') renderProgress();
    renderChip();
    setTitle(titleOf(view));
    // where to scroll: back/forward and the "back" links return to where the page was left
    const y = App.restoring ? scrollMem[here()] || 0 : App.pendingScroll;
    App.restoring = false;
    App.pendingScroll = null;
    if (y != null) win.scrollTo(0, y);
    if (view === 'part' && App.pendingItem != null) { const i = App.pendingItem; setTimeout(() => gotoItem(i), 30); }
    App.pendingItem = null;
    // a new page: move keyboard focus to its heading, as a page load would
    if (!first) {
      const h1 = d.querySelector('main h1');
      if (h1) { if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    }
    App.booted = true;
    return () => { if (current && current.view === view && current.params === params) current = null; };
  }
  // The page's title can say more in the browser (the exam's number). Next.js may set the server's
  // title after the app has set its own (metadata is streamed), so the app's title is kept for as
  // long as its page is on screen.
  let wantTitle = null;
  function setTitle(title) {
    wantTitle = { path: here(), title: (title ? title + ' · ' : '') + 'Placement Exam Prep' };
    d.title = wantTitle.title;
  }
  function keepTitle() {
    if (wantTitle && wantTitle.path === here() && d.title !== wantTitle.title) d.title = wantTitle.title;
  }
  // the grapher switched between graph and draw mode: that's a new address
  MX.onGrapherMode = () => {
    if (App.view !== 'grapher') return;
    readdress(pathOf('grapher'));
    setTitle(titleOf('grapher'));
  };
  function closeStaleFocus() { const a = d.activeElement; if (a && a.blur && a !== d.body && !byId('drawer').contains(a)) a.blur(); }
  function gotoItem(i) {
    const it = App.items[i];
    if (!it) return;
    const p = examPartOf(it.topic);
    if (App.view !== 'part' || App.part !== p) { App.pendingItem = i; go(partPath(p)); return; }
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
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 4000);
  }

  // ================= mobile slide-out menu =================
  const menu = { open: false, touch: null };
  const MENU_MQ = win.matchMedia ? win.matchMedia('(max-width: 900px)') : null;
  const setInert = (el, on) => { if (!el) return; if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert'); };
  function renderDrawer() {
    const ex = examState(), sc = scoreOf(App.items, ex.res);
    const fresh = examFresh();
    const nxt = App.items[firstOpenItem()];
    const jumps = [1, 2, 3].map((p) => {
      const its = App.items.filter((it) => examPartOf(it.topic) === p);
      if (!its.length) return '';
      return `<a class="dj" href="${partPath(p)}" data-act="goto-part" data-part="${p}"><span class="dj-p">Part ${PART_NUM[p]}</span><span class="dj-t">${esc(NAV_NAME[p])}</span><span class="dj-n">${its[0].n}–${its[its.length - 1].n}</span></a>`;
    }).join('');
    byId('drawer-exam').innerHTML = `<div class="de-h">Practice Exam No. ${esc(ex.no)}${ex.finished ? ' · finished' : ''}</div>
      <div class="de-score"><b>${sc.earned}</b> / ${sc.total} points<span>${sc.done} of ${sc.parts} parts answered</span></div>
      ${meter(sc.parts ? sc.done / sc.parts : 0, 'wide')}
      <div class="de-acts">${ex.finished
        ? '<a class="btn" href="/exam">Review the exam</a><button type="button" class="btn primary" data-act="new-exam">New exam</button>'
        : `<a class="btn primary" href="${resumePath()}" data-act="resume">${fresh ? 'Start the exam' : 'Continue at question ' + (nxt ? nxt.n : 1)}</a>`}</div>
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
    const firstEl = dr.querySelector('.dnav [aria-current="page"]') || dr.querySelector('.drawer-x');
    win.requestAnimationFrame(() => firstEl.focus({ preventScroll: true }));
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
    const f = [...byId('drawer').querySelectorAll('button:not([disabled]), a[href]')].filter((el) => el.offsetParent);
    if (!f.length) return;
    const firstEl = f[0], last = f[f.length - 1];
    if (e.shiftKey && (d.activeElement === firstEl || !byId('drawer').contains(d.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (d.activeElement === last || !byId('drawer').contains(d.activeElement))) { e.preventDefault(); firstEl.focus(); }
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

  // ================= events =================
  // A link to another page of this site: Next.js shows it without reloading. What the link
  // carries (data-act) is noted first, as app.js's buttons did: where "back" goes, which question
  // to scroll to, where a deck returns to.
  const sameSite = (a) => a.origin === win.location.origin && !a.target && !a.hasAttribute('download');
  function followLink(a, e) {
    const act = a.dataset.act;
    let path = a.pathname;
    if (act === 'tutorial') {
      if (App.view !== 'tutorial') { App.returnView = App.view; App.returnItem = App.view === 'part' && a.dataset.item != null ? +a.dataset.item : -1; }
      App.tutId = a.dataset.topic;
      App.tutTab = 'lesson';
    } else if (act === 'back') {
      const v = App.returnView || 'tutorials', i = App.returnItem;
      App.pendingScroll = scrollMem[pathOf(v)] || 0;
      if (v === 'part' && i != null && i >= 0) App.pendingItem = i;
    } else if (act === 'resume') {
      const i = firstOpenItem();
      App.part = App.items[i] ? examPartOf(App.items[i].topic) : 1;
      if (i > 0) App.pendingItem = i;
      path = partPath(App.part);
    } else if (act === 'tut-tab') App.tutTab = a.dataset.tab;
    else if (act === 'deck') {
      App.deckReturn = a.dataset.from || (App.view === 'tutorial' ? 'tutorial' : App.view === 'home' ? 'home' : 'flashcards');
      if (a.dataset.mode === 'learning' && a.dataset.all) App.deck = null;
      App.freshDeck = true;
    } else if (act === 'deck-back') App.pendingScroll = scrollMem[a.pathname] || 0;
    e.preventDefault();
    go(path);
  }
  function onClick(e) {
    const a = e.target.closest && e.target.closest('a[href]');
    const b = e.target.closest && e.target.closest('[data-act]');
    if (a) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !sameSite(a)) return;
      // any choice in the menu closes it first, so the page can scroll to its target
      if (menu.open && a.closest('#drawer')) { closeMenu(false); win.setTimeout(() => byId('menu-btn').focus({ preventScroll: true }), 0); }
      closeStaleFocus();
      followLink(a, e);
      return;
    }
    if (!b || b.disabled) return;
    const act = b.dataset.act;
    if (act === 'menu-open') { openMenu(); return; }
    if (act === 'menu-close') { closeMenu(); return; }
    if (menu.open && b.closest('#drawer')) { closeMenu(false); win.setTimeout(() => byId('menu-btn').focus({ preventScroll: true }), 0); }
    if (act === 'check') doCheck(b.dataset.card, +b.dataset.p);
    else if (act === 'reveal') doReveal(b.dataset.card, +b.dataset.p);
    else if (act === 'goto') gotoItem(+b.dataset.item);
    else if (act === 'more') moreExercises();
    else if (act === 'new-exam') { startNewExam(); App.part = 1; renderChip(); go('/exam'); }
    else if (act === 'save-later') {
      Store.save();
      Store.flushRemote && Store.flushRemote();
      const i = firstOpenItem();
      go('/');
      toast(`Saved. Your exam will open at question ${App.items[i] ? App.items[i].n : 1} when you come back.`);
    }
    else if (act === 'end-ask') { byId('end-confirm').hidden = false; b.hidden = true; }
    else if (act === 'end-cancel') { byId('end-confirm').hidden = true; d.querySelector('[data-act="end-ask"]').hidden = false; }
    else if (act === 'end-do') { byId('end-confirm').hidden = true; d.querySelector('[data-act="end-ask"]').hidden = false; finishExam(); }
    else if (act === 'reset-ask') { byId('reset-confirm').hidden = false; }
    else if (act === 'reset-cancel') { byId('reset-confirm').hidden = true; }
    else if (act === 'reset-do') { Store.reset(); App.deck = null; startNewExam(); go('/progress'); }
    // flashcards
    else if (act === 'flip') flipCard();
    else if (act === 'deck-mark') markCard(+b.dataset.v);
    else if (act === 'deck-next') stepCard(1);
    else if (act === 'deck-prev') stepCard(-1);
    else if (act === 'deck-mode') { App.deck.mode = b.dataset.mode; buildOrder(); renderDeck(); readdress(pathOf('deck')); }
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

  // once per page load: read the progress, build the exam, listen
  function boot() {
    Store.init();
    ensureExam();
    d.addEventListener('click', onClick);
    d.addEventListener('mq-change', onMathChange);
    d.addEventListener('mq-enter', onMathEnter);
    d.addEventListener('keydown', onKey);
    d.addEventListener('change', onChange);
    const dr = byId('drawer');
    if (dr) {
      dr.addEventListener('touchstart', menuTouchStart, { passive: true });
      dr.addEventListener('touchmove', menuTouchMove, { passive: true });
      dr.addEventListener('touchend', menuTouchEnd);
      dr.addEventListener('touchcancel', menuTouchEnd);
    }
    // leaving phone width (rotating, resizing) closes the menu
    if (MENU_MQ) { const f = (ev) => { if (!ev.matches) closeMenu(false); }; if (MENU_MQ.addEventListener) MENU_MQ.addEventListener('change', f); else if (MENU_MQ.addListener) MENU_MQ.addListener(f); }
    Store.on((what) => { if (what === 'remote') { ensureExam(); remount(); } });
    if (win.history && 'scrollRestoration' in win.history) win.history.scrollRestoration = 'manual';
    let t = 0;
    win.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(() => { scrollMem[here()] = win.scrollY; }, 80); }, { passive: true });
    win.addEventListener('popstate', () => { closeMenu(false); App.restoring = true; });
    if (win.MutationObserver) new win.MutationObserver(keepTitle).observe(d.head, { subtree: true, childList: true, characterData: true });
    renderChip();
  }
  // the plain page's addresses were after "#": #/tutorials/x is /tutorials/x now
  function oldAddress() {
    const h = win.location.hash || '';
    if (here() !== '/' || !/^#\/./.test(h)) return null;
    const path = '/' + h.replace(/^#\/+/, '').split('/').filter(Boolean).map((x) => { try { return encodeURIComponent(decodeURIComponent(x)); } catch (e) { return encodeURIComponent(x); } }).join('/');
    return path === '/' ? null : path;
  }
  function attach(r) {
    const first = !router;
    router = r;
    const old = first ? oldAddress() : null;
    if (old) router.replace(old);
  }

  return Object.assign(shared, { boot, mount, attach, toast, Store, MX, model, renderChip, closeMenu });
}

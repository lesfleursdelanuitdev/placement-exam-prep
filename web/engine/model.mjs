// The exam model, carried over from src/app.js (the parts that need no page): the topic order, the
// exam's questions for a seed, and each tutorial's worked examples and practice. Same seed, same
// questions as the plain page, so saved exams and practice rebuild exactly. test/model-parity.test.mjs
// runs app.js's own functions beside these and fails when app.js changes them: carry the change
// over here (and note it in PORTED.md).
// createModel(MX) takes an engine copy (web/engine/mx.mjs) and sets its verifier to the lighter
// grid app.js uses; the engine's own tests use the full grid, so give them a separate copy.

export const GEN_VERSION = 3;
export const WORKED_N = 6;
export const PART3_SEC = 'Linear equations & inequalities';
export const SECTION_ORDER = ['Polynomials & exponents', 'Factoring', 'Rational expressions', 'Radicals', 'Equations & inequalities', 'Absolute value', 'Quadratic equations & functions', 'Logarithms', 'Graphs, lines & systems', 'Relations & functions', 'Word problems', PART3_SEC];
export const WORD_ORDER = ['w-proportion', 'w-percent', 'w-sci', 'w-ineq', 'w-perimeter', 'w-pyth', 'w-triangles', 'w-linear', 'w-motion', 'w-mixture', 'w-systems', 'w-quadratic', 'w-logs'];
export const PART3_ORDER = ['lq-strategy', 'lq-problems', 'lq-formulas', 'lq-applications', 'lq-linear-ineq', 'lq-compound', 'lq-absineq'];

export const slotsOf = (t) => t.slots || [{ pool: Object.keys(t.variants) }];
export const allVariants = (t) => Object.keys(t.variants);
export const examPartOf = (t) => (t.part === 3 ? 3 : t.kind === 'word' ? 2 : 1);
export const sectionOf = (t) => (t.part === 3 ? PART3_SEC : t.kind === 'word' ? 'Word problems' : t.section);

export function createModel(MX, { warn = (...a) => console.warn(...a) } = {}) {
  // a lighter grid than the tests use: this is the safety net, not the audit
  Object.assign(MX.V.opts, { fine: 0.05, coarse: 1 });
  const unsound = [];

  function orderedTopics() {
    const skills = MX.topics.filter((t) => t.kind !== 'word' && t.part !== 3).slice().sort((a, b) => SECTION_ORDER.indexOf(a.section) - SECTION_ORDER.indexOf(b.section));
    const words = WORD_ORDER.map((id) => MX.byId[id]).filter(Boolean);
    const p3 = MX.topics.filter((t) => t.part === 3).slice().sort((a, b) => PART3_ORDER.indexOf(a.id) - PART3_ORDER.indexOf(b.id));
    return [...skills, ...words, ...p3];
  }
  function bySection() {
    const groups = {};
    orderedTopics().forEach((t) => { const s = sectionOf(t); (groups[s] = groups[s] || []).push(t); });
    return SECTION_ORDER.filter((s) => groups[s]).map((s) => [s, groups[s]]);
  }

  // A question whose answer key fails its check is replaced by one from the next seed (then by
  // another variant of the topic); a sound question keeps its original seed.
  function soundGen(t, vk, seed, key) {
    const tryGen = (v, k) => {
      let q = null, why;
      try { q = t.variants[v].gen(MX.rngFor(seed, key + (k ? '|fix' + k : '') + (v !== vk ? '|' + v : ''))); why = MX.sound(q); } catch (e) { why = 'generator threw: ' + (e && e.message); }
      if (why === true) return q;
      unsound.push({ topic: t.id, variant: v, seed, key, why });
      warn('Replaced a question whose answer key failed its check:', t.id + '/' + v, why);
      return null;
    };
    for (let k = 0; k < 6; k++) { const q = tryGen(vk, k); if (q) return q; }
    for (const v of allVariants(t)) if (v !== vk) { const q = tryGen(v, 0); if (q) return q; }
    return t.variants[vk].gen(MX.rngFor(seed, key)); // nothing passed: fall back rather than break the page
  }

  function buildExam(seed) {
    const items = [];
    for (const t of orderedTopics()) {
      if (t.practiceOnly) continue; // tutorial practice only (drawing a graph needs a pointer), not on the exam
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

  // Six worked examples per tutorial: problem types round-robin across the exam slots, repeats
  // with different numbers, next to each other.
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
  // The practice exercises: three to start, then three per batch the student asked for
  // (`batches` as saved: '' for "mixed", or a variant key).
  function practice(t, batches = []) {
    const slots = slotsOf(t), vs = allVariants(t);
    const ex = [];
    // exercise types are laid out exactly as before worked examples went to six, so saved practice still matches its questions
    const legacyWorked = slots.length > 1 ? Math.min(3, slots.length) : 2;
    const start = legacyWorked % vs.length;
    for (let k = 0; k < 3; k++) {
      const vk = vs[(start + k) % vs.length];
      ex.push({ key: 'e' + k, vk, q: soundGen(t, vk, 'tutorial-ex', t.id + '|' + k) });
    }
    batches.forEach((choice, b) => {
      for (let k = 0; k < 3; k++) {
        const vk = choice && t.variants[choice] ? choice : vs[(b * 3 + k + start) % vs.length];
        ex.push({ key: 'b' + b + '-' + k, vk, q: soundGen(t, vk, 'tutorial-more', t.id + '|' + b + '|' + k + '|' + vk) });
      }
    });
    return ex;
  }
  const cardsOf = (id) => MX.FLASH[id] || [];

  return { MX, unsound, orderedTopics, bySection, soundGen, buildExam, workedPlan, workedExamples, practice, cardsOf };
}

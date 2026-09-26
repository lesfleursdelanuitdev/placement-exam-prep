// web/engine/model.mjs must make exactly the questions src/app.js makes (same seed, same exam), so
// progress saved by the plain page rebuilds the same questions in the Next.js app. This runs
// app.js's own functions (pulled out of its source) on one engine copy and the model on another,
// and compares. A failure here after merging the plain page's branch means app.js changed its exam
// model: carry the change into model.mjs and PORTED.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMX } from '../mx.mjs';
import * as M from '../model.mjs';
import { fnSource, constSource, lineStarting } from './app-source.mjs';

const quiet = { warn() {}, log() {}, error() {} };

function appModel() {
  const MX = createMX();
  const consts = ['GEN_VERSION', 'PART3_SEC', 'SECTION_ORDER', 'WORD_ORDER', 'PART3_ORDER', 'slotsOf', 'allVariants', 'examPartOf', 'sectionOf', 'WORKED_N'].map((n) => constSource(n));
  const fns = ['orderedTopics', 'bySection', 'soundGen', 'buildExam', 'workedPlan', 'workedExamples', 'tutProblems'].map((n) => fnSource(n));
  const body = [...consts, lineStarting('Object.assign(MX.V.opts'), lineStarting('MX.unsound = []'), ...fns,
    'return { GEN_VERSION, PART3_SEC, SECTION_ORDER, WORD_ORDER, PART3_ORDER, WORKED_N, examPartOf, sectionOf, orderedTopics, bySection, buildExam, workedPlan, workedExamples, tutProblems };'].join('\n');
  const batches = { current: [] };
  // eslint-disable-next-line no-new-func
  const app = new Function('MX', 'G', 'tutState', body)(MX, { console: quiet }, () => ({ batches: batches.current, res: {} }));
  return { MX, app, batches };
}

const sig = (q) => JSON.stringify({
  prompt: q.prompt, visual: q.visual, solution: q.solution, ctx: q.ctx,
  parts: q.parts.map((p) => ({ kind: p.kind, label: p.label, ask: p.ask, show: p.show, pre: p.pre, post: p.post, points: p.points, answer: p.answer, answers: p.answers, value: p.value, options: p.options, units: p.units })),
});

const A = appModel();
const B = createMX();
const model = M.createModel(B, { warn() {} });

test('the constants match app.js', () => {
  for (const k of ['GEN_VERSION', 'PART3_SEC', 'SECTION_ORDER', 'WORD_ORDER', 'PART3_ORDER', 'WORKED_N']) assert.deepEqual(M[k], A.app[k], k);
  assert.deepEqual(B.V.opts, A.MX.V.opts, 'the verifier grid');
});

test('the topic order and sections match app.js', () => {
  assert.deepEqual(model.orderedTopics().map((t) => t.id), A.app.orderedTopics().map((t) => t.id));
  assert.deepEqual(model.bySection().map(([s, l]) => [s, l.map((t) => t.id)]), A.app.bySection().map(([s, l]) => [s, l.map((t) => t.id)]));
  for (const t of model.orderedTopics()) {
    assert.equal(M.examPartOf(t), A.app.examPartOf(A.MX.byId[t.id]), t.id);
    assert.equal(M.sectionOf(t), A.app.sectionOf(A.MX.byId[t.id]), t.id);
  }
});

for (const seed of ['e0', 'e1x9', 'eparity2', 'ezz91', 'e3kq0']) {
  test(`exam ${seed}: the same questions as app.js`, () => {
    const a = A.app.buildExam(seed), b = model.buildExam(seed);
    assert.equal(b.length, a.length);
    b.forEach((it, i) => {
      assert.deepEqual([it.key, it.variant, it.n, it.topic.id], [a[i].key, a[i].variant, a[i].n, a[i].topic.id]);
      assert.equal(sig(it.q), sig(a[i].q), it.key);
    });
  });
}

test('every tutorial: the same worked examples and practice as app.js', () => {
  for (const t of model.orderedTopics()) {
    const ta = A.MX.byId[t.id];
    assert.deepEqual(model.workedPlan(t), A.app.workedPlan(ta), t.id + ' plan');
    const wa = A.app.workedExamples(ta), wb = model.workedExamples(t);
    wb.forEach((w, i) => assert.equal(w.vk + sig(w.q), wa[i].vk + sig(wa[i].q), `${t.id} example ${i}`));
    // a mixed batch and a batch of the first type, on top of the three to start with
    A.batches.current = ['', Object.keys(t.variants)[0]];
    const pa = A.app.tutProblems(ta).ex, pb = model.practice(t, A.batches.current);
    assert.equal(pb.length, pa.length, t.id + ' practice count');
    pb.forEach((p, i) => assert.equal(p.key + p.vk + sig(p.q), pa[i].key + pa[i].vk + sig(pa[i].q), `${t.id} practice ${p.key}`));
  }
});

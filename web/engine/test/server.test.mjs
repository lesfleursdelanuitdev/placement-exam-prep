// On the server (plain Node, no page): a whole exam, every lesson with its worked examples and
// first practice problems, and every flashcard, made and rendered to HTML by web/engine/mx.mjs and
// web/engine/model.mjs, as the Next.js pages will make them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import MXshared, { createMX, FILES } from '../mx.mjs';
import { createModel, examPartOf, slotsOf, GEN_VERSION } from '../model.mjs';

const bad = /undefined|NaN|\[object|Infinity/;
const MX = createMX();
const model = createModel(MX, { warn() {} });

// the text of a question as the page shows it, rendered
function rendered(q) {
  return [q.prompt, ...(q.solution || []), ...q.parts.flatMap((p) => [p.ask, p.show, p.pre, p.post, ...(p.options || [])])]
    .filter((s) => s != null && s !== '').map((s) => MX.rich(String(s)));
}
function checkQuestion(q, where) {
  assert.ok(q.parts && q.parts.length, where + ': no parts');
  for (const html of rendered(q)) assert.doesNotMatch(html, bad, where);
  if (q.visual) { assert.match(q.visual, /^<svg/, where + ': visual'); assert.doesNotMatch(q.visual, bad, where); }
  assert.equal(MX.sound(q), true, where + ': answer key fails its check');
  for (const [i, p] of q.parts.entries()) {
    assert.ok(p.points > 0, `${where} part ${i}: points`);
    assert.equal(MX.check(p, MX.answerInput(p)).ok, true, `${where} part ${i}: the key is not accepted`);
  }
}

test('the engine is a module: nothing on the global object, separate copies', () => {
  assert.equal(globalThis.MX, undefined);
  assert.notEqual(MX, MXshared);
  assert.equal(MX.topics.length, MXshared.topics.length);
  assert.ok(FILES.includes('core.js') && FILES.includes('flashcards.js') && !FILES.includes('app.js') && !FILES.includes('store.js'));
  assert.ok(MX.topics.length >= 70, 'topics: ' + MX.topics.length);
});

test('a whole exam, made on the server', () => {
  const seed = process.env.EXAM_SEED || 'eserver1'; // EXAM_SEED=... to try another
  const items = model.buildExam(seed);
  const expected = model.orderedTopics().filter((t) => !t.practiceOnly).reduce((n, t) => n + slotsOf(t).length, 0);
  assert.equal(items.length, expected, 'one question per slot');
  assert.deepEqual([...new Set(items.map((it) => examPartOf(it.topic)))], [1, 2, 3], 'parts I, II and III, in order');
  assert.equal(new Set(items.map((it) => it.key)).size, items.length, 'keys are unique');
  for (const it of items) checkQuestion(it.q, `${seed} ${it.key} (${it.variant})`);
  assert.deepEqual(model.unsound, [], 'no question needed replacing');
  const points = items.reduce((n, it) => n + it.q.parts.reduce((m, p) => m + p.points, 0), 0);
  assert.ok(points > 100, 'total points ' + points);
  // the same seed makes the same exam, in another copy of the engine too (saved exams rebuild)
  const again = createModel(createMX(), { warn() {} }).buildExam(seed);
  assert.deepEqual(again.map((it) => it.key + '|' + it.q.prompt), items.map((it) => it.key + '|' + it.q.prompt));
  assert.equal(GEN_VERSION, 3);
});

test('every lesson, its six worked examples and its first practice problems', () => {
  for (const t of model.orderedTopics()) {
    const lesson = MX.rich(t.lesson);
    assert.ok(lesson.length > 200, t.id + ': lesson');
    assert.doesNotMatch(lesson, bad, t.id + ': lesson');
    const worked = model.workedExamples(t);
    assert.equal(worked.length, 6, t.id + ': six examples');
    worked.forEach((w, i) => checkQuestion(w.q, `${t.id} example ${i} (${w.vk})`));
    const ex = model.practice(t, ['']);
    assert.equal(ex.length, 6, t.id + ': three to start and one batch');
    ex.forEach((e) => checkQuestion(e.q, `${t.id} practice ${e.key} (${e.vk})`));
  }
});

test('every flashcard', () => {
  let n = 0;
  for (const [id, deck] of Object.entries(MX.FLASH)) {
    assert.ok(MX.byId[id], 'deck for an unknown topic: ' + id);
    assert.ok(deck.length > 0, id + ': empty deck');
    deck.forEach(([front, back], i) => {
      for (const side of [front, back]) {
        const html = MX.rich(side);
        assert.ok(html.trim().length > 0, `${id} card ${i}: empty side`);
        assert.doesNotMatch(html, bad, `${id} card ${i}`);
      }
      n++;
    });
  }
  assert.ok(n > 400, n + ' cards');
});

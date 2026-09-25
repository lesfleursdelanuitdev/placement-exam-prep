// Security test: saved progress is untrusted input. Store.sanitize must turn anything
// tampered with into safe, correctly typed values (or drop it) before the page uses it.
// Run: node test/security.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ctx = { console };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['src/core.js', 'src/store.js']) vm.runInContext(readFileSync(join(root, f), 'utf8'), ctx, { filename: f });
const clean = ctx.MX.Store.sanitize;
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } };
const X = '<img src=x onerror=alert(1)>';
const canon = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort()) : x));

// a normal save survives unchanged
const good = {
  v: 1, updated: 5,
  exam: { no: 3, seed: 'e1x9', gv: 2, started: 1, finished: null, res: { 'poly-addsub#0': { 0: { ok: true, msg: '', val: { value: '3x^2' } } } } },
  history: [{ no: 2, earned: 200, total: 245, started: 1, finished: 2, byTopic: { 'poly-addsub': [3, 3] } }],
  tut: { 'log-cob': { batches: ['', 'basic'], res: { e0: { 0: { ok: false, tries: 2, msg: 'x', val: { value: 'log_(3)7' } } } } } },
  flash: { 'log-cob': { 0: 1, 1: 0 } },
  drafts: { 'x3-4-0': { value: '((1)/(2))' }, 'x3-5-1': { choice: '2' } },
};
ok(canon(clean(good)) === canon(good), 'a valid save must survive unchanged:\n' + JSON.stringify(clean(good)));

// every numeric field rejects strings
const bad = clean({
  v: 1, updated: X,
  exam: { no: X, seed: 'e1', gv: X, started: X, finished: X, res: { [X]: { 0: { ok: X, msg: X, tries: X, val: { value: X, choice: X, values: [X, 7] } } } } },
  history: [{ no: X, earned: 1, total: 2 }, { no: 1, earned: X, total: 2 }, { no: 1, earned: 1, total: X }, { no: 4, earned: 1, total: 2, byTopic: { [X]: [1, 2], ok: [X, 2] } }],
  tut: { [X]: {}, 'w-logs': { batches: [X, 'ok'], res: { [X]: {}, e1: { 0: { tries: X } } } } },
  flash: { [X]: { 0: 1 }, 'log-cob': { [X]: 1, 0: X, 1: 1 } },
  drafts: { [X]: { value: 'a' }, 'x1-0-0': { value: 5, unit: X } },
});
const nums = [bad.updated, bad.exam.no, bad.exam.gv, bad.exam.started, ...bad.history.flatMap((h) => [h.no, h.earned, h.total, ...Object.values(h.byTopic).flat()])];
ok(nums.every((n) => typeof n === 'number' && isFinite(n)), 'numeric fields must come back as numbers: ' + JSON.stringify(nums));
ok(bad.exam.finished === null, 'bad finished time is dropped');
ok(bad.history.length === 1 && bad.history[0].no === 4 && !(X in bad.history[0].byTopic), 'history entries with bad numbers are dropped');
ok(Object.keys(bad.exam.res).length === 0, 'result keys with markup are dropped');
ok(!(X in bad.tut) && !(X in bad.flash) && !(X in bad.drafts), 'ids with markup are dropped');
ok(bad.tut['w-logs'].batches[0] === '' && bad.tut['w-logs'].res.e1[0].tries === 0, 'tutorial fields are typed');
ok(JSON.stringify(bad.flash['log-cob']) === '{"1":1}', 'flashcard marks are only 0 or 1');
ok(bad.drafts['x1-0-0'].value === '' && typeof bad.drafts['x1-0-0'].unit === 'string', 'draft values are strings');
ok(clean({ v: 2 }) === null && clean('x') === null && clean(null) === null, 'unknown formats are rejected');

console.log(fails ? fails + ' security checks failed' : 'security checks passed');
process.exit(fails ? 1 : 0);

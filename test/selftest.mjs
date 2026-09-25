// Self-test: generate every variant of every topic with many seeds and make sure
//  - the stored correct answer passes its own checker,
//  - nothing renders as undefined / NaN,
//  - word problems always carry an SVG visual,
//  - obvious wrong answers are rejected.
// Run: node test/selftest.mjs [seedsPerVariant]
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const ENGINE_FILES = ['core.js', 'texmath.js', 'parse.js', 'check.js', 'svg.js', 'helpers.js'];
const topicFiles = readdirSync(join(root, 'src/topics')).filter((f) => f.endsWith('.js')).sort();

const ctx = { console };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of [...ENGINE_FILES.map((f) => 'src/' + f), ...topicFiles.map((f) => 'src/topics/' + f)]) {
  vm.runInContext(readFileSync(join(root, f), 'utf8'), ctx, { filename: f });
}
const MX = ctx.MX;
const N = +(process.argv[2] || 60);
const only = process.argv[3];
let fails = 0, total = 0;
const bad = (s) => /undefined|NaN|\[object|Infinity/.test(s);
const fail = (msg) => { fails++; if (fails < 60) console.log('FAIL', msg); };

function wrongInput(part) {
  // a deliberately wrong answer for rejection tests
  switch (part.kind) {
    case 'num': return part.answer === 'nosol' ? { value: '7' } : { value: String(MX.evalAST(MX.parse(part.answer), {}) + 1.7), unit: part.units && part.units.answer };
    case 'expr': return { value: '(' + part.answer + ')+1' };
    case 'factor': return { value: '(' + part.answer + ')+1' };
    case 'choice': return { choice: (part.answer + 1) % part.options.length };
    case 'sci': return { value: '9.99 x 10^99' };
    default: return null;
  }
}

for (const t of MX.topics) {
  if (only && t.id !== only) continue;
  if (!t.lesson || bad(MX.rich(t.lesson))) fail(t.id + ': lesson missing or bad');
  const slots = t.slots || [{ pool: Object.keys(t.variants) }];
  for (const s of slots) for (const k of s.pool) if (!t.variants[k]) fail(t.id + ': slot refers to missing variant ' + k);
  for (const [vk, v] of Object.entries(t.variants)) {
    for (let i = 0; i < N; i++) {
      total++;
      const rng = MX.rngFor('selftest-' + i, t.id + '/' + vk);
      let q;
      try { q = v.gen(rng); } catch (e) { fail(`${t.id}/${vk} seed ${i}: gen threw ${e.stack}`); continue; }
      const where = `${t.id}/${vk} seed ${i}`;
      if (!q.parts || !q.parts.length) { fail(where + ': no parts'); continue; }
      const texts = [q.prompt, ...(q.solution || []), ...q.parts.map((p) => (p.ask || '') + ' ' + (p.show || '') + ' ' + (p.pre || '') + ' ' + (p.post || ''))];
      for (const s of texts) {
        if (bad(String(s))) { fail(where + ': bad text: ' + String(s).slice(0, 160)); break; }
        try { MX.rich(s); } catch (e) { fail(where + ': render threw on ' + s); }
      }
      if (!q.solution || q.solution.length < 1) fail(where + ': no solution steps');
      if (t.kind === 'word' && !(q.visual && q.visual.startsWith('<svg'))) fail(where + ': word problem without SVG visual');
      if (q.visual && bad(q.visual)) fail(where + ': bad svg ' + q.visual.slice(0, 200));
      for (const p of q.parts) {
        if (!p.points) fail(where + ': part without points');
        if (p.kind === 'choice') {
          if (!(p.options && p.options.length > 1 && p.answer >= 0 && p.answer < p.options.length)) fail(where + ': bad choice part');
          if (p.options.some((o) => bad(String(o)))) fail(where + ': bad option text');
        }
        let r;
        try { r = MX.check(p, MX.answerInput(p)); } catch (e) { fail(where + ': checker threw ' + e.stack); continue; }
        if (!r.ok) fail(`${where}: correct answer rejected (${p.kind} ${JSON.stringify(p.answer || p.answers || p.value)}) -> ${JSON.stringify(r)}\n   prompt: ${q.prompt}`);
        const w = wrongInput(p);
        if (w) {
          const rw = MX.check(p, w);
          if (rw.ok) fail(`${where}: wrong answer accepted (${p.kind} ${JSON.stringify(w)})`);
        }
      }
    }
  }
}
console.log(`${MX.topics.length} topics, ${total} generated problems, ${fails} failures`);
process.exit(fails ? 1 : 0);

// Wide test: every variant of every topic with fresh random seeds (the kind real exams get), checked by
// MX.sound: the grader accepts the answer key and the independent verifier agrees with it.
// Prints each failing case with the command that reproduces it.
// Run: node test/fuzz.mjs [seedsPerVariant=500] [topicId]
//      node test/fuzz.mjs --repro <topicId> <variant> <seed>
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = ['core.js', 'texmath.js', 'parse.js', 'check.js', 'svg.js', 'helpers.js', 'verify.js', 'plot.js'].map((f) => 'src/' + f)
  .concat(readdirSync(join(root, 'src/topics')).filter((f) => f.endsWith('.js')).sort().map((f) => 'src/topics/' + f));
const ctx = { console };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of files) vm.runInContext(readFileSync(join(root, f), 'utf8'), ctx, { filename: f });
const MX = ctx.MX;
const bad = (s) => /undefined|NaN|\[object|Infinity/.test(s);

function check(t, vk, seed) {
  let q;
  try { q = t.variants[vk].gen(MX.rngFor(seed, t.id + '/' + vk)); } catch (e) { return 'generator threw: ' + e.message; }
  const texts = [q.prompt, ...(q.solution || []), ...q.parts.map((p) => (p.ask || '') + ' ' + (p.show || ''))];
  if (texts.some((s) => bad(String(s)))) return 'undefined/NaN in the text';
  const r = MX.sound(q);
  return r === true ? null : r + '\n    prompt: ' + String(q.prompt).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 200);
}

const args = process.argv.slice(2);
if (args[0] === '--repro') {
  const [, id, vk, seed] = args;
  const r = check(MX.byId[id], vk, seed);
  console.log(r ? 'FAIL ' + r : 'ok');
  process.exit(r ? 1 : 0);
}
const N = +(args[0] || 500), only = args[1];
let fails = 0, total = 0;
const t0 = Date.now();
for (const t of MX.topics) {
  if (only && t.id !== only) continue;
  for (const vk of Object.keys(t.variants)) {
    for (let i = 0; i < N; i++) {
      const seed = 'f' + randomBytes(5).toString('hex');
      total++;
      const r = check(t, vk, seed);
      if (r) {
        fails++;
        if (fails <= 40) console.log(`FAIL ${t.id}/${vk} seed ${seed}: ${r}\n    reproduce: node test/fuzz.mjs --repro ${t.id} ${vk} ${seed}`);
      }
    }
  }
}
console.log(`${total} random problems in ${((Date.now() - t0) / 1000).toFixed(0)} s, ${fails} failures`);
process.exit(fails ? 1 : 0);

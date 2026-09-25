// Print one generated problem per variant (raw text) for review: node test/dump.mjs [topicId] [seed]
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = ['core.js','texmath.js','parse.js','check.js','svg.js','helpers.js','verify.js'].map(f=>'src/'+f).concat(readdirSync(join(root,'src/topics')).filter(f=>f.endsWith('.js')).sort().map(f=>'src/topics/'+f));
const ctx = { console }; ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of files) vm.runInContext(readFileSync(join(root, f), 'utf8'), ctx, { filename: f });
const MX = ctx.MX; const only = process.argv[2]; const seed = process.argv[3] || 'dump';
const strip = (s) => String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
for (const t of MX.topics) {
  if (only && !t.id.startsWith(only)) continue;
  for (const [k, v] of Object.entries(t.variants)) {
    const q = v.gen(MX.rngFor(seed, t.id + k));
    console.log(`\n=== ${t.id} / ${k}\nQ: ${strip(q.prompt)}`);
    q.parts.forEach(p => console.log(`  [${p.label||'-'}] ${strip(p.ask||'')} (${p.kind}) ans=${JSON.stringify(p.answer ?? p.answers ?? p.value)} show=${p.show||''}`));
    q.solution.forEach(s => console.log('   · ' + strip(s)));
  }
}

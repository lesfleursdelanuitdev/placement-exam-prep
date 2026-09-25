// Prints the topic catalog as Markdown (used for the README): node test/catalog.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = ['core.js', 'texmath.js', 'parse.js', 'check.js', 'svg.js', 'helpers.js'].map((f) => 'src/' + f)
  .concat(readdirSync(join(root, 'src/topics')).filter((f) => f.endsWith('.js')).sort().map((f) => 'src/topics/' + f));
const ctx = { console }; ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of files) vm.runInContext(readFileSync(join(root, f), 'utf8'), ctx, { filename: f });
const MX = ctx.MX;
const skills = MX.topics.filter((t) => t.kind !== 'word');
const words = MX.topics.filter((t) => t.kind === 'word');
let out = '### Skill topics (' + skills.length + ')\n\n| Section | Topic | On the sample finals | Variations |\n|---|---|---|---|\n';
for (const t of skills) out += `| ${t.section} | ${t.title} | ${t.sources.join(', ')} | ${Object.values(t.variants).map((v) => v.name).join('; ')} |\n`;
const slots = words.reduce((n, t) => n + t.slots.length, 0);
out += `\n### Word-problem groups (${words.length} groups, ${slots} slots per exam)\n\n| Group | Slots (source question) | Variations |\n|---|---|---|\n`;
for (const t of words) out += `| ${t.title} | ${t.slots.map((s) => s.label + ' (' + s.source + ')').join('<br>')} | ${Object.values(t.variants).map((v) => v.name).join('; ')} |\n`;
console.log(out);

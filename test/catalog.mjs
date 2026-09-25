// Prints the topic catalog as Markdown (used for the README): node test/catalog.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = ['core.js', 'texmath.js', 'parse.js', 'check.js', 'svg.js', 'helpers.js', 'verify.js', 'plot.js'].map((f) => 'src/' + f)
  .concat(readdirSync(join(root, 'src/topics')).filter((f) => f.endsWith('.js')).sort().map((f) => 'src/topics/' + f))
  .concat(['src/flashcards.js']);
const ctx = { console }; ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of files) vm.runInContext(readFileSync(join(root, f), 'utf8'), ctx, { filename: f });
const MX = ctx.MX;
const ORDER = ['Polynomials & exponents', 'Factoring', 'Rational expressions', 'Radicals', 'Equations & inequalities', 'Absolute value', 'Quadratic equations & functions', 'Logarithms', 'Graphs, lines & systems', 'Relations & functions'];
const WORD_ORDER = ['w-proportion', 'w-percent', 'w-sci', 'w-ineq', 'w-perimeter', 'w-pyth', 'w-triangles', 'w-linear', 'w-motion', 'w-mixture', 'w-systems', 'w-quadratic', 'w-logs'];
const skills = MX.topics.filter((t) => t.kind !== 'word' && t.part !== 3).sort((a, b) => ORDER.indexOf(a.section) - ORDER.indexOf(b.section));
const words = WORD_ORDER.map((id) => MX.byId[id]).filter(Boolean);
const part3 = MX.topics.filter((t) => t.part === 3);
const src = (t) => { const real = (t.sources || []).filter((x) => !/^added/i.test(x)); const add = (t.sources || []).some((x) => /^added/i.test(x)); return real.length ? real.join(', ') + (add ? ' (+ added types)' : '') : '*added*'; };
const cards = (t) => (MX.FLASH[t.id] || []).length;
const per = (t) => (t.slots ? t.slots.length : 1);
let out = `### Skill topics (${skills.length}; ${skills.reduce((n, t) => n + per(t), 0)} questions per exam)\n\n| Section | Topic | On the sample finals | Per exam | Variations | Cards |\n|---|---|---|---|---|---|\n`;
for (const t of skills) out += `| ${t.section} | ${t.title} | ${src(t)} | ${per(t)} | ${Object.values(t.variants).map((v) => v.name).join('; ')} | ${cards(t)} |\n`;
const slots = words.reduce((n, t) => n + t.slots.length, 0);
out += `\n### Word-problem groups (${words.length} groups, ${slots} slots per exam)\n\n| Group | Slots (source question) | Variations | Cards |\n|---|---|---|---|\n`;
for (const t of words) out += `| ${t.title} | ${t.slots.map((s) => s.label + ' (' + (/^added/i.test(s.source) ? 'added' : s.source) + ')').join('<br>')} | ${Object.values(t.variants).map((v) => v.name).join('; ')} | ${cards(t)} |\n`;
const p3slots = part3.reduce((n, t) => n + t.slots.length, 0);
out += `\n### Part III: linear equations & inequalities (${part3.length} topics, ${p3slots} questions per exam)\n\n| Topic | Skills (one question each) | Variations | Cards |\n|---|---|---|---|\n`;
for (const t of part3) out += `| ${t.title} | ${t.slots.map((s) => s.label).join('<br>')} | ${Object.values(t.variants).map((v) => v.name).join('; ')} | ${cards(t)} |\n`;
out += `\nFlashcards: ${Object.values(MX.FLASH).reduce((n, d) => n + d.length, 0)} cards in ${Object.keys(MX.FLASH).length} decks.\n`;
console.log(out);

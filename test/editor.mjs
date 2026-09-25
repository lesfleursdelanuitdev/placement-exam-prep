// Editor test: builds every answer key the way a student would see it in the math box
// (fractions stacked, exponents raised, radicals with a bar), serializes it and checks that
// the grader still accepts it. Also replays keystroke sequences.
// Run: node test/editor.mjs [seedsPerVariant]
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = ['core.js', 'texmath.js', 'parse.js', 'check.js', 'svg.js', 'helpers.js'].map((f) => 'src/' + f)
  .concat(readdirSync(join(root, 'src/topics')).filter((f) => f.endsWith('.js')).sort().map((f) => 'src/topics/' + f))
  .concat(['src/flashcards.js', 'src/editor.js']);
const ctx = { console };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of files) vm.runInContext(readFileSync(join(root, f), 'utf8'), ctx, { filename: f });
const MX = ctx.MX;
const ED = MX.ED;
const N = +(process.argv[2] || 12);
let fails = 0, total = 0;
const fail = (m) => { fails++; if (fails < 40) console.log('FAIL', m); };

// ---- AST -> editor model (what the student builds with / and ^) ----
const strip = (n) => { while (n && n.t === 'grp') n = n.a; return n; };
function M(n) {
  switch (n.t) {
    case 'num': return String(n.v).split('');
    case 'var': return [n.n];
    case 'e': return ['e'];
    case 'grp': return ['(', ...M(n.a), ')'];
    case 'add': return [...M(n.a), '+', ...M(n.b)];
    case 'sub': return [...M(n.a), '-', ...M(n.b)];
    case 'pm': return n.a.t === 'num' && n.a.v === 0 ? ['±', ...M(n.b)] : [...M(n.a), '±', ...M(n.b)];
    case 'neg': return ['-', ...M(n.a)];
    case 'mul': return n.imp ? [...M(n.a), ...M(n.b)] : [...M(n.a), '·', ...M(n.b)];
    case 'div': return [{ k: 'frac', n: M(strip(n.a)), d: M(strip(n.b)) }];
    case 'pow': return [...M(n.a), { k: 'sup', e: M(strip(n.b)) }];
    case 'sqrt': return [{ k: 'sqrt', r: M(strip(n.a)) }];
    case 'abs': return ['|', ...M(n.a), '|'];
    case 'log': {
      const a = n.a.t === 'num' || n.a.t === 'var' ? M(n.a) : ['(', ...M(strip(n.a)), ')'];
      if (n.k === 'ln') return [{ k: 'fn', f: 'ln' }, ...a];
      if (n.k === 'c') return [{ k: 'fn', f: 'log' }, ...a];
      return [{ k: 'logb', b: M(strip(n.b)) }, ...a];
    }
    default: throw new Error('no model for ' + n.t);
  }
}
const REL = { '=': '=', '<': '<', '>': '>', '<=': '≤', '>=': '≥' };
function structured(text, kind) {
  if (kind === 'set' || kind === 'interval' || kind === 'sci') return ED.ser(ED.fromText(text));
  if (MX.isNoSolution(text) || MX.isPrimeWord(text)) return ED.ser(ED.fromText(text));
  try {
    if (kind === 'point') { const [a, b] = MX.parsePoint(text); return ED.ser(['(', ...M(a), ',', ' ', ...M(b), ')']); }
    if (/[=<>]/.test(MX.normalizeInput(text))) {
      const r = MX.parseRel(MX.normalizeInput(text));
      return ED.ser([...M(r.lhs), REL[r.op], ...M(r.rhs)]);
    }
    return ED.ser(M(MX.parse(text)));
  } catch (e) {
    return ED.ser(ED.fromText(text));
  }
}
function inputFor(part) {
  const a = MX.answerInput(part);
  const kind = part.kind === 'points' ? 'point' : part.kind;
  if (a.values) return { values: a.values.map((v) => structured(v, kind)) };
  if (a.value != null) return { value: structured(a.value, kind), unit: a.unit };
  return a;
}

for (const t of MX.topics) {
  for (const [vk, v] of Object.entries(t.variants)) {
    for (let i = 0; i < N; i++) {
      const q = v.gen(MX.rngFor('edtest-' + i, t.id + '/' + vk));
      q.parts.forEach((p, pi) => {
        if (p.kind === 'choice') return;
        total++;
        const inp = inputFor(p);
        let r;
        try { r = MX.check(p, inp); } catch (e) { r = { error: e.message }; }
        if (!r.ok) fail(`${t.id}/${vk} #${i} part ${pi} (${p.kind}): ${JSON.stringify(inp)} -> ${JSON.stringify(r)}  [key ${JSON.stringify(p.answer || p.answers)}]`);
        // text -> model -> text is stable
        for (const s of inp.values || [inp.value]) {
          const again = ED.ser(ED.fromText(s));
          if (again !== s) fail(`${t.id}/${vk}: round trip ${JSON.stringify(s)} -> ${JSON.stringify(again)}`);
          const html = ED.renderModel(ED.fromText(s)).html;
          if (/undefined|NaN/.test(html)) fail(`${t.id}/${vk}: render ${html.slice(0, 120)}`);
        }
      });
    }
  }
}

// ---- keystrokes ----
function type(seq, kind) {
  const ed = new ED.Ed({ dataset: { kind: kind || 'expr', v: '' } });
  for (const tok of seq) {
    if (tok.length > 1 && tok[0] === '{') {
      const k = tok.slice(1, -1);
      if (k === 'L') ed.left(); else if (k === 'R') ed.right(); else if (k === 'U') ed.vert(true); else if (k === 'D') ed.vert(false);
      else if (k === 'BS') ed.backspace(); else if (k === 'DEL') ed.del(); else if (k === 'HOME') ed.home(); else if (k === 'END') ed.end();
      else ED.KEYS[k].run(ed), ed.index();
    } else for (const ch of tok) ed.typeChar(ch);
  }
  return ed.value();
}
const split = (s) => s.match(/\{[A-Za-z]+\}|[^{]+/g) || [];
const cases = [
  ['x^2+3x-4', 'x^2+3x-4'],
  ['(x+1)/x-2', '((x+1)/(x-2))'],
  ['3/4{R}x', '((3)/(4))x'],
  ['-3/4{R}x+2', '-((3)/(4))x+2'],
  ['2^(x+1)', '2^((x+1))'],
  ['2^x-1=7', '2^x-1=7'],
  ['e^-0.05t', 'e^(-0.05t)'],
  ['sqrt50', '√(50)'],
  ['5t^6{R}sqrt2t', '5t^6√(2t)'],
  ['log_2{R}8', 'log_(2)8'],
  ['log(x)/log(3)', '((log(x))/(log(3)))'],
  ['ln(x)', 'ln(x)'],
  ['x<=5', 'x<=5'],
  ['x>=-3', 'x>=-3'],
  ['(-2+-sqrt10{R})/3', '((-2±√(10))/(3))'],
  ['{frac}1{R}2', '((1)/(2))'],
  ['{frac}1{D}2', '((1)/(2))'],
  ['x^3/y^2', 'x^(((3)/(y^2)))'],
  ['x^3{R}/y^2', '((x^3)/(y^2))'],
  ['(x^2{R})', '(x^2)'],
  ['x^2)', 'x^2)'],
  ['12{BS}3', '13'],
  ['1/2{BS}{BS}', '((1)/())'],
  ['1/2{BS}{BS}{BS}', '(()/())'],
  ['1/2{BS}{BS}{BS}{BS}', ''],
  ['x^2{BS}', 'x^()'],
  ['x^2{BS}{BS}', 'x'],
  ['x^{BS}', 'x'],
  ['sqrt{BS}', ''],
  ['{nosol}', 'no solution'],
  ['{nosol}7', '7'],
  ['{prime}', 'prime'],
  ['3.2{sci}5', '3.2×10^5'],
  ['[-3, 5)', '[-3, 5)'],
  ['(-inf, 2)U(2, inf)', '(-∞, 2)∪(2, ∞)'],
  ['(-infinity, 2]', '(-∞, 2]'],
  ['{set}-2, 0, 3', '{-2, 0, 3}'],
  ['{point}3{R}{R}-2', '(3, -2)'],
  ['x{HOME}2', '2x'],
  ['1/2{U}3', '((13)/(2))'],
  ['ab{L}{L}c', 'cab'],
  ['a/b{L}{L}c', '((ac)/(b))'],
  ['{logb}3{R}(x+1)', 'log_(3)(x+1)'],
  ['log_{BS}', 'log'],
  ['2(x+1)/3', '((2(x+1))/(3))'],
  ['(x+1)(x-2)/4', '(((x+1)(x-2))/(4))'],
];
for (const [seq, want] of cases) {
  total++;
  const got = type(split(seq), seq.includes('U(') || seq.includes('inf') ? 'interval' : 'expr');
  if (got !== want) fail(`typing ${JSON.stringify(seq)} gave ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
}
console.log(`${total} editor checks, ${fails} failures`);
process.exit(fails ? 1 : 0);

// Grapher tests: reading inputs, sampling (asymptotes, domain edges, jumps), contours, and the drawing checker.
// Run: node test/grapher.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ctx = { console };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['core.js', 'texmath.js', 'parse.js', 'check.js', 'svg.js', 'helpers.js', 'verify.js', 'plot.js']) vm.runInContext(readFileSync(join(root, 'src', f), 'utf8'), ctx, { filename: f });
const MX = ctx.MX, P = MX.Plot;
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log('FAIL', m); } };
const W = P.DEFAULT_WIN;

// ---- reading ----
for (const [s, kind] of [['2x-3', 'fn'], ['y = x^2', 'fn'], ['f(x)=sin(x)', 'fn'], ['x^2+y^2=9', 'rel'], ['(x-1)^2+(y+2)^2=4', 'rel'], ['x=3', 'rel'], ['y=|x|', 'fn'],
  ['x+1 if x<0; x^2 if x>=0', 'fn'], ['{2x, x<=1; 3, x>1}', 'fn'], ['sqrt(x-4)', 'fn'], ['ln(x)', 'fn'], ['2^x', 'fn'], ['tan(x)', 'fn'], ['3cos(pi x)', 'fn']]) {
  try { ok(P.read(s).kind === kind, 'read ' + s + ' as ' + kind); } catch (e) { ok(false, 'read ' + s + ' threw ' + e.message); }
}
for (const s of ['', 'x+', 'y<2x', '2z+1', 'x=1=2', 'x+1 if x<0']) { let threw = false; try { P.read(s); } catch (e) { threw = e instanceof MX.ParseError; } ok(threw, 'rejects ' + JSON.stringify(s)); }
const pw = P.read('x+1 if x<0; x^2 if x>=0');
ok(pw.f(-2) === -1 && pw.f(0) === 0 && pw.f(3) === 9, 'piecewise values');
ok(pw.dots.some((d) => d.x === 0 && d.y === 1 && !d.closed) && pw.dots.some((d) => d.x === 0 && d.y === 0 && d.closed), 'piecewise dots: open (0,1), closed (0,0)');

// ---- sampling ----
const inv = P.sample(P.read('1/(x-2)').f, W);
ok(inv.length >= 2, '1/(x-2) splits at the asymptote (' + inv.length + ' pieces)');
ok(!inv.some((s) => s.some((p, i) => i && p[0] > 2 && s[i - 1][0] < 2)), '1/(x-2) never connects across x = 2');
const rt = P.sample(P.read('sqrt(x-4)').f, W);
ok(rt.length === 1 && Math.abs(rt[0][0][0] - 4) < 1e-6 && Math.abs(rt[0][0][1]) < 1e-3, 'sqrt(x-4) starts at (4, 0): ' + JSON.stringify(rt[0][0]));
const tn = P.sample(P.read('tan(x)').f, W);
ok(tn.length >= 6, 'tan(x) breaks at each asymptote (' + tn.length + ' pieces)');
const pws = P.sample(pw.f, W);
ok(pws.length === 2, 'piecewise with a jump is two pieces (' + pws.length + ')');
const line = P.sample(P.read('2x-3').f, W);
ok(line.length === 1, 'a line is one piece');
const steep = P.sample(P.read('100x').f, W);
ok(steep.length === 1, 'a steep line is not mistaken for a jump');
const lg = P.sample(P.read('ln(x)').f, W);
ok(lg.length === 1 && lg[0][0][0] > 0 && lg[0][0][0] < 1e-3, 'ln(x) runs from just right of 0');
// ---- contours ----
const circ = P.contour(P.read('x^2+y^2=9').F, W);
ok(circ.length > 50 && circ.every((s) => s.every((p) => Math.abs(Math.hypot(p[0], p[1]) - 3) < 0.05)), 'circle contour lies on radius 3');
ok(P.contour(P.read('x*y=1').F, W).every((s) => s.every((p) => Math.abs(p[0] * p[1] - 1) < 0.2)), 'xy = 1 has no false segments across the axes');

// ---- shapes ----
const par = P.shape('parabola', [1, -2], [3, 6], W);
ok(par && Math.abs(par.a - 2) < 1e-12 && par.f(1) === -2, 'parabola from vertex (1,-2) through (3,6) has a = 2');
const cir = P.shape('circle', [1, 1], [4, 5], W);
ok(cir && Math.abs(cir.r - 5) < 1e-12, 'circle radius 5');

// ---- checking drawings ----
const jitter = (f, a, b, amp, seed = 1) => { let s = seed; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647 - 0.5); const pts = []; for (let x = a; x <= b; x += 0.05) pts.push([x, f(x) + amp * r()]); return pts; };
const g1 = P.read('2x-3');
ok(P.checkDrawing(g1, [{ t: 'line', a: [0, -3], b: [2, 1] }], W).ok, 'line tool through (0,-3),(2,1) matches 2x-3');
ok(!P.checkDrawing(g1, [{ t: 'line', a: [0, -2], b: [2, 2] }], W).ok, 'line shifted up 1 does not match 2x-3');
ok(!P.checkDrawing(P.read('5x-3'), [{ t: 'line', a: [0, -2], b: [1, 3] }], W).ok, 'a steep line shifted up 1 does not match');
ok(!P.checkDrawing(g1, [{ t: 'stroke', pts: jitter((x) => 2 * x - 2, -3.5, 6, 0.1) }], W).ok, 'a freehand line through the wrong intercept fails');
ok(P.checkDrawing(g1, [{ t: 'stroke', pts: jitter(g1.f, -3.5, 6.5, 0.5) }], W).ok, 'a wobbly freehand line passes');
ok(!P.checkDrawing(g1, [{ t: 'stroke', pts: jitter(g1.f, -3.5, 1, 0.3) }], W).ok, 'half a line fails (coverage)');
ok(!P.checkDrawing(g1, [{ t: 'stroke', pts: jitter((x) => 2.5 * x - 3, -3, 5.2, 0.2) }], W).ok, 'wrong slope fails');
const g2 = P.read('(x-1)^2-2');
ok(P.checkDrawing(g2, [{ t: 'parabola', a: [1, -2], b: [3, 2] }], W).ok, 'parabola tool matches (x-1)^2-2');
ok(!P.checkDrawing(g2, [{ t: 'parabola', a: [1, -1], b: [3, 3] }], W).ok, 'parabola with the wrong vertex fails');
ok(P.checkDrawing(g2, [{ t: 'stroke', pts: jitter(g2.f, -2.3, 4.3, 0.4, 7) }], W).ok, 'a wobbly freehand parabola passes');
const g3 = P.read('(x-1)^2+(y+2)^2=9');
ok(P.checkDrawing(g3, [{ t: 'circle', a: [1, -2], b: [4, -2] }], W).ok, 'circle tool matches the circle equation');
ok(!P.checkDrawing(g3, [{ t: 'circle', a: [1, -2], b: [3, -2] }], W).ok, 'a circle of the wrong radius fails');
ok(P.checkDrawing(g1, [{ t: 'point', p: [0, -3] }, { t: 'point', p: [2, 1] }], W).ok, 'two points on a line are enough');
ok(!P.checkDrawing(g2, [{ t: 'point', p: [1, -2] }, { t: 'point', p: [3, 2] }], W).ok, 'two points are not enough for a parabola');
ok(!P.checkDrawing(g1, [{ t: 'point', p: [0, -3] }, { t: 'point', p: [2, 2] }], W).ok, 'a point off the line fails');
const g4 = P.read('1/x');
const hyp = [{ t: 'stroke', pts: jitter(g4.f, -10, -0.1, 0.1) }, { t: 'stroke', pts: jitter(g4.f, 0.1, 10, 0.1) }];
ok(P.checkDrawing(g4, hyp, W).ok, '1/x drawn as two strokes passes');
ok(!P.checkDrawing(g4, hyp.slice(0, 1), W).ok, '1/x with one branch missing fails');
const big = { xmin: -50, xmax: 50, ymin: -50, ymax: 50, xstep: 5, ystep: 5 };
ok(P.checkDrawing(P.read('0.5x+10'), [{ t: 'stroke', pts: jitter((x) => 0.5 * x + 10, -50, 50, 2) }], big).ok, 'tolerance scales with the tick spacing');
// ---- windows ----
const cw = P.cleanWin({ xmin: 5, xmax: -5, ystep: -1, xstep: 0.001 });
ok(cw.xmin === -10 && cw.ystep === 1 && (cw.xmax - cw.xmin) / cw.xstep <= 200, 'cleanWin repairs a bad window');
console.log(`${n} grapher checks, ${fails} failures`);
process.exit(fails ? 1 : 0);

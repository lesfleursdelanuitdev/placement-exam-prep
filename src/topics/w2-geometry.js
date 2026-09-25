/* Word problems: Pythagorean theorem, triangles & similar triangles, perimeter & dimensions */
(function (G) {
  'use strict';
  const MX = G.MX;
  const { Q, T, H, S } = MX;
  const I = S.I;
  const SEC = 'Word problems';
  const r1 = (x) => Math.round(x * 10) / 10;
  // ---------- verifiers (built from the numbers stated in the prompt) ----------
  const MV = MX.V;
  // the one positive solution of an equation for a length (keep adds conditions such as "the other side is positive")
  const pos = (eq, keep) => MV.solves(eq, { lo: 0, hi: 2000, keep: (x) => x > 0 && (!keep || keep(x)) });
  // "round to the nearest tenth if necessary": find the exact positive root of eq numerically and check that the
  // key is that root rounded half-up to a tenth (and exactly the root when the root is a whole number)
  const tenthRoot = (eq) => {
    let root = null;
    return MV.custom((a) => {
      if (root === null) {
        const rs = MV.roots(eq, { lo: 0, hi: 2000 });
        root = rs === 'all' ? [] : rs.filter((x) => x > 0);
      }
      if (root.length !== 1) return 'expected exactly one positive solution, found ' + root.length;
      const x = root[0], want = Math.floor(x * 10 + 0.5 + 1e-9) / 10;
      if (typeof a !== 'number') return 'expected a number';
      return (MV.close(a, want, 1e-9) && Math.abs(a - x) <= 0.05 + 1e-9) || 'the exact value is ' + MX.num(x, 6) + ', which rounds to ' + want;
    });
  };
  const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]];
  // a right triangle drawing with the right angle at bottom-left
  function rightTri(x0, y0, w, h, labels, o = {}) {
    let b = S.poly([[x0, y0], [x0 + w, y0], [x0, y0 - h]], 'ln ' + (o.fill || 'soft')) + S.rightAngle(x0, y0, 10, 1, -1);
    b += S.label(x0 - 10, y0 - h / 2 + 4, labels[0], { cls: 'lbl', a: 'end' });
    b += S.label(x0 + w / 2, y0 + 18, labels[1], { cls: 'lbl' });
    b += S.label(x0 + w / 2 + 12, y0 - h / 2 - 6, labels[2], { cls: 'lbl', a: 'start' });
    return b;
  }
  const pyStep = (a, b, c) => T`\(a^{2} + b^{2} = c^{2}\), where \(c\) is the hypotenuse (the side across from the right angle).`;

  // ================= PYTHAGOREAN =================
  const pyth = {
    ladder: {
      name: 'Ladder against a wall',
      gen(rng) {
        const findLadder = rng.chance(0.55);
        let h, d, L;
        if (findLadder) { h = rng.int(8, 24); d = rng.int(3, Math.min(12, h - 2)); L = Math.sqrt(h * h + d * d); }
        else { [d, h, L] = rng.pick([[5, 12, 13], [6, 8, 10], [9, 12, 15], [7, 24, 25], [8, 15, 17], [10, 24, 26], [12, 16, 20]]); if (rng.chance(0.5)) { L = L + rng.int(1, 3); h = Math.sqrt(L * L - d * d); } }
        const W = 300, Hh = 170;
        let b = I.house(40, 150, 110, 90) + I.ground(10, 290, 150);
        b += S.line(150, 150, 150, 60, 'ln thick') + S.rightAngle(150, 150, 9, 1, -1);
        { // ladder: two rails and rungs
          const x1 = 222, y1 = 150, x2 = 154, y2 = 62, len = Math.hypot(x2 - x1, y2 - y1), nx = ((y2 - y1) / len) * 4, ny = (-(x2 - x1) / len) * 4;
          b += S.line(x1 + nx, y1 + ny, x2 + nx, y2 + ny, 'acc thick') + S.line(x1 - nx, y1 - ny, x2 - nx, y2 - ny, 'acc thick');
          for (let k = 1; k < 7; k++) { const t = k / 7, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t; b += S.line(x + nx, y + ny, x - nx, y - ny, 'acc'); }
        }
        b += S.label(142, 108, findLadder ? h + ' ft' : '?', { cls: findLadder ? 'lbl' : 'qm', a: 'end' });
        b += S.label(186, 168, d + ' ft', { cls: 'lbl' });
        b += S.label(200, 96, findLadder ? '?' : L + ' ft', { cls: findLadder ? 'qm' : 'lbl', a: 'start' });
        const exact = Number.isInteger(findLadder ? L : h);
        const ans = r1(findLadder ? L : h);
        return {
          prompt: findLadder
            ? T`A ladder leans against the side of a house. The top of the ladder is ${h} feet from the ground. The bottom of the ladder is ${d} feet from the side of the house. Find the length of the ladder. If necessary, round your answer to the nearest tenth.`
            : T`A ${L}-foot ladder leans against a wall with its base ${d} feet from the wall. How high up the wall does the ladder reach? If necessary, round to the nearest tenth.`,
          visual: S.svg(W, Hh, b, 'A ladder leaning against a house forming a right triangle'),
          parts: [{ kind: 'num', answer: String(ans), tol: exact ? undefined : 0.051, show: ans + '\\text{ feet}', post: 'feet', points: 4, verify: tenthRoot(findLadder ? `${h}^2+${d}^2=x^2` : `x^2+${d}^2=${L}^2`) }],
          solution: findLadder
            ? [pyStep(), T`The wall and the ground are the legs: \(${h}^{2} + ${d}^{2} = c^{2}\)`, T`\(${h * h} + ${d * d} = ${h * h + d * d} = c^{2}\), so \(c = \sqrt{${h * h + d * d}}${exact ? '' : ' \\approx ' + MX.num(L, 3)}\)`, T`\(${H.box(ans + '\\text{ ft}')}\)`]
            : [pyStep(), T`The ladder is the hypotenuse: \(h^{2} + ${d}^{2} = ${L}^{2}\)`, T`\(h^{2} = ${L * L} - ${d * d} = ${L * L - d * d}\), so \(h = \sqrt{${L * L - d * d}}${exact ? '' : ' \\approx ' + MX.num(h, 3)}\)`, T`\(${H.box(ans + '\\text{ ft}')}\)`],
        };
      },
    },
    wire: {
      name: 'Guy wire',
      gen(rng) {
        const h = rng.int(12, 40), d = rng.int(5, 20), L = Math.sqrt(h * h + d * d), ans = r1(L), exact = Number.isInteger(L);
        const W = 300, Hh = 180;
        let b = I.ground(10, 290, 160) + S.rect(96, 30, 8, 130, 'wood nostroke') + S.line(100, 34, 230, 160, 'acc thick') + S.circle(230, 160, 3, 'fillink nostroke');
        b += S.rightAngle(104, 160, 9, 1, -1) + S.label(88, 100, h + ' ft', { cls: 'lbl', a: 'end' }) + S.label(167, 176, d + ' ft', { cls: 'lbl' }) + S.label(176, 88, '?', { cls: 'qm', a: 'start' });
        return {
          prompt: T`A guy wire runs from the top of a ${h}-foot pole to a stake in the ground ${d} feet from the base of the pole. How long is the wire? Round to the nearest tenth if necessary.`,
          visual: S.svg(W, Hh, b, 'A wire from the top of a pole to the ground'),
          parts: [{ kind: 'num', answer: String(ans), tol: exact ? undefined : 0.051, show: ans + '\\text{ feet}', post: 'feet', points: 4, verify: tenthRoot(`${h}^2+${d}^2=x^2`) }],
          solution: [pyStep(), T`\(${h}^{2} + ${d}^{2} = c^{2}\), so \(c^{2} = ${h * h + d * d}\)`, T`\(c = \sqrt{${h * h + d * d}}${exact ? '' : ' \\approx ' + MX.num(L, 3)}\)`, T`\(${H.box(ans + '\\text{ ft}')}\)`],
        };
      },
    },
    kite: {
      name: 'Kite string',
      gen(rng) {
        let L, d, h;
        do { L = rng.int(6, 20) * 10; d = rng.int(3, L / 10 - 1) * 10; h = Math.sqrt(L * L - d * d); } while (h < 20);
        const ans = r1(h), exact = Number.isInteger(h);
        const W = 300, Hh = 180;
        let b = I.ground(10, 290, 160) + I.person(40, 160, 34) + S.line(52, 132, 250, 40, 'acc') + S.line(250, 40, 250, 160, 'ln dash');
        b += S.poly([[250, 20], [262, 40], [250, 60], [238, 40]], 'accf ln') + S.rightAngle(250, 160, 9, -1, -1);
        b += S.label(140, 72, L + ' ft of string', { cls: 'lbl', rot: -25 }) + S.label(150, 176, d + ' ft', { cls: 'lbl' }) + S.label(260, 110, '?', { cls: 'qm', a: 'start' });
        return {
          prompt: T`Maya lets out ${L} feet of kite string. The kite is directly above a spot on the ground ${d} feet away from her. Ignoring her height, how high is the kite? Round to the nearest tenth if necessary.`,
          visual: S.svg(W, Hh, b, 'A kite on a string forming a right triangle with the ground'),
          parts: [{ kind: 'num', answer: String(ans), tol: exact ? undefined : 0.051, show: ans + '\\text{ feet}', post: 'feet', points: 4, verify: tenthRoot(`x^2+${d}^2=${L}^2`) }],
          solution: [pyStep(), T`The string is the hypotenuse: \(h^{2} + ${d}^{2} = ${L}^{2}\)`, T`\(h^{2} = ${L * L} - ${d * d} = ${L * L - d * d}\)`, T`\(h = \sqrt{${L * L - d * d}}${exact ? '' : ' \\approx ' + MX.num(h, 3)}\). \(${H.box(ans + '\\text{ ft}')}\)`],
        };
      },
    },
    walk: {
      name: 'Walking at right angles',
      gen(rng) {
        const [dir1, dir2] = rng.pick([['north', 'east'], ['south', 'west'], ['east', 'north'], ['west', 'south']]);
        const a = rng.int(2, 12), b2 = rng.int(2, 12), c = Math.sqrt(a * a + b2 * b2), ans = r1(c), exact = Number.isInteger(c);
        const V = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
        const W = 320, Hh = 180, HL = 120, VL = 90;
        const leg = (v) => [v[0] * HL, v[1] * VL];
        const v1 = V[dir1], v2 = V[dir2], d1 = leg(v1), d2 = leg(v2);
        const raw = [[0, 0], d1, [d1[0] + d2[0], d1[1] + d2[1]]];
        const minx = Math.min(...raw.map((p) => p[0])), miny = Math.min(...raw.map((p) => p[1]));
        const ox = (W - HL) / 2 - minx, oy = 45 - miny;
        const [A0, A1, A2] = raw.map((p) => [p[0] + ox, p[1] + oy]);
        const C = [(A0[0] + A1[0] + A2[0]) / 3, (A0[1] + A1[1] + A2[1]) / 3];
        const legLabel = (P, Q, txt) => {
          const M = [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2];
          if (P[0] === Q[0]) { const out = M[0] >= C[0] ? 1 : -1; return S.label(M[0] + out * 10, M[1] + 4, txt, { cls: 'lbl', a: out > 0 ? 'start' : 'end' }); }
          const out = M[1] >= C[1] ? 1 : -1; return S.label(M[0], M[1] + (out > 0 ? 18 : -8), txt, { cls: 'lbl' });
        };
        let b = S.arrow(A0[0], A0[1], A1[0], A1[1], 'acc thick', 9) + S.arrow(A1[0], A1[1], A2[0], A2[1], 'acc thick', 9) + S.line(A0[0], A0[1], A2[0], A2[1], 'ln dash');
        b += S.circle(A0[0], A0[1], 4, 'fillink nostroke') + S.text(A0[0] + (A0[0] > C[0] ? 14 : -14), A0[1] + (A0[1] > C[1] ? 16 : -8), 'start', { cls: 'tx small', a: A0[0] > C[0] ? 'start' : 'end' });
        b += S.rightAngle(A1[0], A1[1], 10, v1[0] ? -v1[0] : v2[0], v1[1] ? -v1[1] : v2[1]);
        b += legLabel(A0, A1, a + ' mi ' + dir1) + legLabel(A1, A2, b2 + ' mi ' + dir2);
        const M3 = [(A0[0] + A2[0]) / 2, (A0[1] + A2[1]) / 2];
        b += S.label(M3[0] + (C[0] - M3[0]) * 0.5, M3[1] + (C[1] - M3[1]) * 0.5 + 5, '?', { cls: 'qm' });
        b += S.text(306, 18, 'N', { cls: 'tx small', w: 700 }) + S.arrow(306, 48, 306, 24, 'ln', 6);
        return {
          prompt: T`A hiker walks ${a} miles ${dir1}, then turns and walks ${b2} miles ${dir2}. How far is she from her starting point, in a straight line? Round to the nearest tenth if necessary.`,
          visual: S.svg(W, Hh, b, 'Two legs of a walk at right angles with the straight-line distance'),
          parts: [{ kind: 'num', answer: String(ans), tol: exact ? undefined : 0.051, show: ans + '\\text{ miles}', post: 'miles', points: 4, verify: tenthRoot(`${a}^2+${b2}^2=x^2`) }],
          solution: [T`The two directions are perpendicular, so the path forms a right triangle.`, T`\(${a}^{2} + ${b2}^{2} = c^{2} = ${a * a + b2 * b2}\)`, T`\(c = \sqrt{${a * a + b2 * b2}}${exact ? '' : ' \\approx ' + MX.num(c, 3)}\). \(${H.box(ans + '\\text{ mi}')}\)`],
        };
      },
    },
    rect: {
      name: 'Diagonal of a rectangle',
      gen(rng) {
        const ctx = rng.pick([['A rectangular field', 'meters', 'm'], ['A rectangular garden', 'feet', 'ft'], ['A rectangular park', 'yards', 'yd'], ['A rectangle', 'meters', 'm']]);
        let w, l;
        if (rng.chance(0.6)) { const [p, q] = rng.pick(TRIPLES.slice(0, 3)); const k = rng.int(2, 14); w = p * k; l = q * k; } else { w = rng.int(10, 60); l = rng.int(w + 5, 90); }
        const c = Math.sqrt(w * w + l * l), ans = r1(c), exact = Number.isInteger(c);
        const W = 300, Hh = 150;
        let b = S.rect(50, 30, 200, 90, 'ln soft') + S.line(50, 30, 250, 120, 'acc thick') + S.rightAngle(250, 120, 9, -1, -1);
        b += S.label(150, 140, l + ' ' + ctx[2], { cls: 'lbl' }) + S.label(262, 80, w + ' ' + ctx[2], { cls: 'lbl', a: 'start' }) + S.label(140, 66, '?', { cls: 'qm' });
        return {
          prompt: T`${ctx[0]} is ${w} ${ctx[1]} wide and ${l} ${ctx[1]} long. What is the length of the diagonal? Round to the nearest tenth if necessary.`,
          visual: S.svg(W, Hh, b, 'A rectangle with its diagonal drawn'),
          parts: [{ kind: 'num', answer: String(ans), tol: exact ? undefined : 0.051, show: ans + '\\text{ ' + ctx[1] + '}', post: ctx[1], points: 4, verify: tenthRoot(`${w}^2+${l}^2=x^2`) }],
          solution: [T`The diagonal splits the rectangle into two right triangles; the sides are the legs.`, T`\(${w}^{2} + ${l}^{2} = c^{2} = ${w * w} + ${l * l} = ${w * w + l * l}\)`, T`\(c = \sqrt{${w * w + l * l}}${exact ? ' = ' + c : ' \\approx ' + MX.num(c, 3)}\). \(${H.box(ans + '\\text{ ' + ctx[2] + '}')}\)`],
        };
      },
    },
    tv: {
      name: 'Side from the diagonal',
      gen(rng) {
        const [p, q, r] = rng.pick([[3, 4, 5], [3, 4, 5], [5, 12, 13], [8, 15, 17]]);
        const k = r === 5 ? rng.int(4, 16) : rng.int(2, 5);
        const diag = r * k, h = p * k, w = q * k;
        const W = 300, Hh = 160;
        let b = S.rect(50, 24, 200, 110, 'ln soft', 4) + S.rect(56, 30, 188, 98, 'paperf nostroke') + S.line(56, 128, 244, 30, 'acc thick') + S.rect(130, 134, 40, 8, 'fillink nostroke');
        b += S.label(150, 156, '? in', { cls: 'qm' }) + S.label(262, 82, h + ' in', { cls: 'lbl', a: 'start' }) + S.label(170, 70, diag + ' in', { cls: 'lbl' });
        return {
          prompt: T`A screen is advertised as ${diag} inches, which is the length of its diagonal. The screen is ${h} inches tall. How wide is it?`,
          visual: S.svg(W, Hh, b, 'A screen with its diagonal and height labeled'),
          parts: [{ kind: 'num', answer: String(w), show: w + '\\text{ inches}', post: 'inches', points: 4, verify: pos(`${h}^2+x^2=${diag}^2`) }],
          solution: [T`The diagonal is the hypotenuse; the height and width are the legs.`, T`\(${h}^{2} + w^{2} = ${diag}^{2}\), so \(w^{2} = ${diag * diag} - ${h * h} = ${w * w}\)`, T`\(w = \sqrt{${w * w}} = ${w}\). \(${H.box(w + '\\text{ in}')}\)`],
        };
      },
    },
    xd: {
      name: 'Legs x and x + d',
      gen(rng) {
        const [a, b, c] = rng.pick(TRIPLES.concat([[6, 8, 10], [9, 12, 15], [12, 16, 20], [10, 24, 26], [12, 35, 37], [15, 20, 25]]));
        const d = b - a;
        const W = 300, Hh = 160;
        const v = rightTri(70, 130, 170, 100, ['x', 'x + ' + d, String(c)]);
        return {
          prompt: T`Find the value of \(x\). The legs of the right triangle are \(x\) and \(x + ${d}\), and the hypotenuse is ${c}.`,
          visual: S.svg(W, Hh, v, 'A right triangle with legs x and x plus ' + d),
          parts: [{ kind: 'num', var: 'x', answer: String(a), show: 'x = ' + a, points: 4, verify: pos(`x^2+(x+${d})^2=${c}^2`) }],
          solution: [
            T`\(x^{2} + \left(x + ${d}\right)^{2} = ${c}^{2}\)`,
            T`\(x^{2} + x^{2} + ${2 * d}x + ${d * d} = ${c * c}\), so \(2x^{2} + ${2 * d}x - ${c * c - d * d} = 0\)`,
            T`Divide by 2: \(x^{2} + ${d}x - ${(c * c - d * d) / 2} = 0\), which factors as \(\left(x - ${a}\right)\left(x + ${b}\right) = 0\)`,
            T`A length can't be negative, so \(${H.box('x = ' + a)}\). (Check: \(${a}^{2} + ${b}^{2} = ${c}^{2}\).)`,
          ],
        };
      },
    },
    consec: {
      name: 'Consecutive integer sides',
      gen(rng) {
        const even = rng.chance(0.5);
        const [a, s] = even ? [6, 2] : [3, 1];
        const W = 300, Hh = 160;
        const v = rightTri(70, 130, 160, 120, ['x', 'x + ' + s, 'x + ' + 2 * s]);
        return {
          prompt: T`The side lengths of a right triangle are consecutive ${even ? 'even ' : ''}integers. Find the length of the shortest side, then the hypotenuse.`,
          visual: S.svg(W, Hh, v, 'A right triangle with consecutive side lengths'),
          parts: [
            { label: 'a', ask: 'Shortest side', kind: 'num', var: 'x', answer: String(a), show: 'x = ' + a, points: 3, verify: MV.all(pos(`x^2+(x+${s})^2=(x+${2 * s})^2`), (x) => x % s === 0 || 'the side must be a consecutive ' + (even ? 'even ' : '') + 'integer') },
            { label: 'b', ask: 'Hypotenuse', kind: 'num', answer: String(a + 2 * s), show: String(a + 2 * s), points: 1, verify: pos(`(x-${2 * s})^2+(x-${s})^2=x^2`, (x) => x - 2 * s > 0) },
          ],
          solution: [
            T`Let the sides be \(x\), \(x + ${s}\), \(x + ${2 * s}\); the longest is the hypotenuse.`,
            T`\(x^{2} + \left(x + ${s}\right)^{2} = \left(x + ${2 * s}\right)^{2}\) gives \(x^{2} - ${2 * s}x - ${3 * s * s} = 0\)`,
            T`\(\left(x - ${3 * s}\right)\left(x + ${s}\right) = 0\), so \(x = ${3 * s}\) (the negative answer is impossible).`,
            T`Sides ${a}, ${a + s}, ${a + 2 * s}: \(${H.box(T`${a}\text{ and }${a + 2 * s}`)}\)`,
          ],
        };
      },
    },
    twox: {
      name: 'Legs x and 2x + b',
      gen(rng) {
        const [a, b, c, k] = rng.pick([[5, 12, 13, 2], [8, 15, 17, -1], [7, 24, 25, 10], [3, 4, 5, -2], [6, 8, 10, -4], [9, 40, 41, 22], [12, 35, 37, 11], [20, 21, 29, -19]].filter((t) => Math.abs(t[3]) < 15));
        const W = 300, Hh = 160;
        const v = rightTri(70, 130, 170, 100, ['x', '2x ' + (k < 0 ? '− ' + -k : '+ ' + k), String(c)]);
        const qa = 5, qb = 4 * k, qc = k * k - c * c;
        return {
          prompt: T`One leg of a right triangle is \(x\). The other leg is ${Math.abs(k)} ${k < 0 ? 'less' : 'more'} than twice the first leg. The hypotenuse is ${c}. Find both legs.`,
          visual: S.svg(W, Hh, v, 'A right triangle with legs x and 2x plus a constant'),
          parts: [
            { label: 'a', ask: 'Shorter leg', kind: 'num', var: 'x', answer: String(a), show: 'x = ' + a, points: 3, verify: pos(`x^2+(2x+(${k}))^2=${c}^2`, (x) => 2 * x + k > 0 && x < 2 * x + k) },
            { label: 'b', ask: 'Longer leg', kind: 'num', answer: String(b), show: String(b), points: 1, verify: pos(`((x-(${k}))/2)^2+x^2=${c}^2`, (x) => x - k > 0 && x > (x - k) / 2) },
          ],
          solution: [
            T`\(x^{2} + \left(2x ${MX.sgnTerm(k)}\right)^{2} = ${c}^{2}\)`,
            T`\(x^{2} + 4x^{2} ${MX.sgnTerm(4 * k)}x + ${k * k} = ${c * c}\), so \(${MX.quad(qa, qb, qc).tex} = 0\)`,
            T`Factor or use the quadratic formula: \(x = ${a}\) (the other solution is negative or makes a side negative).`,
            T`Other leg: \(2\cdot${a} ${MX.sgnTerm(k)} = ${b}\). \(${H.box(T`${a}\text{ and }${b}`)}\)`,
          ],
        };
      },
    },
  };
  MX.register({
    id: 'w-pyth', kind: 'word', section: SEC, title: 'Pythagorean theorem', sources: ['Exam 1 #27', 'Exam 2 #21', 'Exam 3 #21'],
    slots: [
      { label: 'Find a side', source: 'Exam 1 #27', pool: ['ladder', 'wire', 'kite', 'walk'] },
      { label: 'Rectangles and diagonals', source: 'Exam 2 #21', pool: ['rect', 'tv'] },
      { label: 'Algebraic side lengths', source: 'Exam 3 #21', pool: ['xd', 'consec', 'twox'] },
    ],
    lesson: T`<p>A right triangle has one square corner, a \(90^{\circ}\) angle. Its three sides are tied together by one equation, the Pythagorean theorem. If you know two sides, the theorem gives you the third.</p>
<div class="box def"><h4>Definition <b>Legs and hypotenuse</b></h4><p>In a right triangle, the two sides that form the right angle are the <strong>legs</strong>. The side across from the right angle is the <strong>hypotenuse</strong>. It is always the longest side.</p></div>
<div class="box rule"><h4>Rule <b>Pythagorean theorem</b></h4><p>If \(a\) and \(b\) are the legs and \(c\) is the hypotenuse, then \(a^{2} + b^{2} = c^{2}\).</p></div>
<h3>Find the right triangle in the story</h3>
<p>Look for a square corner: a wall and the ground (ladders, poles, guy wires), a kite straight above a spot on the ground, a walk north and then east, or a rectangle cut by its diagonal. A TV's size is its diagonal. The slanted side (ladder, wire, string, diagonal) is the hypotenuse.</p>
<h3>Find the hypotenuse</h3>
<p>Square the two legs, add, then take the square root.</p>
<div class="ex"><h4>Example</h4><p>A hiker walks 3 miles north, then 5 miles east. How far is she from where she started? Round to the nearest tenth.</p><table class="st">
<tr><td>North and east make a right angle. The path back is the hypotenuse.</td><td>\(3^{2} + 5^{2} = c^{2}\)</td></tr>
<tr><td>Square and add.</td><td>\(9 + 25 = 34 = c^{2}\)</td></tr>
<tr><td>Take the square root and round.</td><td>\(c = \sqrt{34} \approx 5.8\text{ miles}\)</td></tr></table></div>
<h3>Find a leg</h3>
<p>Subtract instead: \(b^{2} = c^{2} - a^{2}\). A 10-foot ladder with its base 6 feet from a wall reaches \(\sqrt{100 - 36} = \sqrt{64} = 8\) feet up the wall.</p>
<h3>Sides written with \(x\)</h3>
<p>Sometimes the sides are expressions like \(x\) and \(x + 7\). Put them into the theorem, expand, and solve the quadratic equation. "Consecutive integers" means \(x\), \(x + 1\), \(x + 2\); consecutive even integers are \(x\), \(x + 2\), \(x + 4\). The largest one is the hypotenuse.</p>
<div class="ex"><h4>Example</h4><p>The legs of a right triangle are \(x\) and \(x + 7\). The hypotenuse is 13. Find \(x\).</p><table class="st">
<tr><td>Write the theorem.</td><td>\(x^{2} + \left(x + 7\right)^{2} = 13^{2}\)</td></tr>
<tr><td>Expand the square.</td><td>\(x^{2} + x^{2} + 14x + 49 = 169\)</td></tr>
<tr><td>Set it equal to 0 and divide by 2.</td><td>\(x^{2} + 7x - 60 = 0\)</td></tr>
<tr><td>Factor.</td><td>\(\left(x + 12\right)\left(x - 5\right) = 0\)</td></tr>
<tr><td>A length can't be negative, so drop \(-12\).</td><td>\(x = 5\)</td></tr>
<tr><td>Check: the sides are 5, 12 and 13.</td><td>\(25 + 144 = 169\) ✓</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>\(\left(x + 7\right)^{2}\) is not \(x^{2} + 49\). Multiply it out: \(\left(x + 7\right)\left(x + 7\right) = x^{2} + 14x + 49\).</p></div>`,
    variants: pyth,
  });

  // ================= TRIANGLES & SIMILAR TRIANGLES =================
  const SHADOW = [
    ['tree', 'lamp post', (x, y, h) => I.tree(x, y, h), (x, y, h) => I.lamp(x, y, h)],
    ['person', 'flagpole', (x, y, h) => I.person(x, y, h), (x, y, h) => I.flag(x, y, h)],
    ['fence post', 'building', (x, y, h) => S.rect(x - 3, y - h, 6, h, 'wood nostroke'), (x, y, h) => I.building(x - h * 0.3, y, h * 0.6, h)],
    ['person', 'tree', (x, y, h) => I.person(x, y, h), (x, y, h) => I.tree(x, y, h)],
  ];
  const tri = {
    shadow: {
      name: 'Shadows',
      gen(rng) {
        const [n1, n2, d1, d2] = rng.pick(SHADOW);
        let h1, s1, s2, h2;
        do { h1 = n1 === 'person' ? rng.int(5, 6) : rng.int(4, 12); s1 = rng.int(2, 12); s2 = s1 * rng.int(2, 9); h2 = (h1 * s2) / s1; } while (h1 === s1 || !Number.isInteger(h2 * 2) || h2 > 120);
        const W = 380, Hh = 170, gy = 150;
        const ratio = s1 / h1, hh2 = Math.min(110, 165 / ratio), hh1 = Math.max(18, (hh2 * h1) / h2), sw1 = hh1 * ratio, sw2 = hh2 * ratio;
        let b = I.sun(24, 24, 10) + I.ground(8, 372, gy);
        b += d1(50, gy, hh1) + S.line(50, gy, 50 + sw1, gy, 'shadow') + S.line(50, gy - hh1, 50 + sw1, gy, 'ln dash');
        const x2 = 190;
        b += d2(x2, gy, hh2) + S.line(x2, gy, x2 + sw2, gy, 'shadow') + S.line(x2, gy - hh2, x2 + sw2, gy, 'ln dash');
        b += S.label(42, gy - hh1 / 2, h1 + ' ft', { cls: 'lbl', a: 'end' }) + S.label(50 + sw1 / 2, gy + 16, s1 + ' ft', { cls: 'lbl' });
        b += S.label(x2 - 10, gy - hh2 / 2, '?', { cls: 'qm', a: 'end' }) + S.label(x2 + sw2 / 2, gy + 16, s2 + ' ft', { cls: 'lbl' });
        return {
          prompt: T`A ${h1}-foot ${n1} casts a ${s1}-foot shadow. At the same time, a ${n2} casts a ${s2}-foot shadow. What is the height of the ${n2}?`,
          visual: S.svg(W, Math.max(Hh, 170), b, 'Two objects and their shadows forming similar triangles'),
          parts: [{ kind: 'num', answer: String(h2), show: h2 + '\\text{ feet}', post: 'feet', points: 3, verify: pos(`${h1}/${s1}=x/${s2}`) }],
          solution: [
            T`The sun's rays hit both objects at the same angle, so the triangles (object, shadow, ray) are similar: their sides are proportional.`,
            T`\(\dfrac{\text{height}}{\text{shadow}}:\ \dfrac{${h1}}{${s1}} = \dfrac{h}{${s2}}\)`,
            T`Cross-multiply: \(${s1}h = ${h1 * s2}\), so \(h = ${h2}\)`,
            T`\(${H.box(h2 + '\\text{ ft}')}\)`,
          ],
        };
      },
    },
    mirror: {
      name: 'Mirror on the ground',
      gen(rng) {
        let e, d1, d2, h;
        do { e = rng.int(10, 13) / 2; d1 = rng.int(3, 8); d2 = rng.int(10, 60); h = (e * d2) / d1; } while (!Number.isInteger(h * 2) || h > 80);
        const W = 380, Hh = 170, gy = 150;
        let b = I.ground(8, 372, gy) + I.person(40, gy, 44) + I.tree(330, gy, 120);
        const mx = 110;
        b += S.rect(mx - 10, gy - 3, 20, 4, 'water ln thin') + S.line(40, gy - 40, mx, gy - 1, 'acc') + S.line(mx, gy - 1, 330, gy - 120, 'acc');
        b += S.dim(40, gy + 12, mx, gy + 12, d1 + ' ft') + S.dim(mx, gy + 12, 330, gy + 12, d2 + ' ft');
        b += S.label(30, gy - 20, e + ' ft', { cls: 'lbl', a: 'end' }) + S.label(348, gy - 60, '?', { cls: 'qm', a: 'start' }) + S.text(mx, gy - 10, 'mirror', { cls: 'tx small' });
        return {
          prompt: T`To measure a tree, Sam places a mirror flat on the ground ${d2} feet from the base of the tree. He stands ${d1} feet from the mirror, on the other side, and sees the top of the tree in it. His eyes are ${e} feet above the ground. How tall is the tree?`,
          visual: S.svg(W, 180, b, 'Using a mirror on the ground to measure a tree'),
          parts: [{ kind: 'num', answer: String(h), show: h + '\\text{ feet}', post: 'feet', points: 3, verify: pos(`${e}/${d1}=x/${d2}`) }],
          solution: [
            T`Light reflects at equal angles, so the triangle (Sam, mirror) and the triangle (tree, mirror) are similar.`,
            T`\(\dfrac{${e}}{${d1}} = \dfrac{h}{${d2}}\)`,
            T`\(h = \dfrac{${e}\cdot${d2}}{${d1}} = ${h}\)`,
            T`\(${H.box(h + '\\text{ ft}')}\)`,
          ],
        };
      },
    },
    nested: {
      name: 'Nested triangles (ramp)',
      gen(rng) {
        let a, b2, h1, H2;
        do { a = rng.int(2, 10); b2 = rng.int(3, 16); h1 = rng.int(1, 6); H2 = (h1 * (a + b2)) / a; } while (!Number.isInteger(H2 * 2) || H2 > 15);
        const W = 340, Hh = 170, gy = 140;
        const X0 = 30, X1 = 310, Y1 = gy - 110, xb = X0 + ((X1 - X0) * a) / (a + b2), yb = gy - (110 * a) / (a + b2);
        let v = S.poly([[X0, gy], [X1, gy], [X1, Y1]], 'ln soft') + S.line(xb, gy, xb, yb, 'acc thick') + S.rightAngle(X1, gy, 9, -1, -1) + S.rightAngle(xb, gy, 8, -1, -1);
        v += S.dim(X0, gy + 14, xb, gy + 14, a + ' ft') + S.dim(xb, gy + 14, X1, gy + 14, b2 + ' ft');
        v += S.label(xb + 6, (gy + yb) / 2 + 4, h1 + ' ft', { cls: 'lbl', a: 'start' }) + S.label(X1 + 8, (gy + Y1) / 2, '?', { cls: 'qm', a: 'start' });
        return {
          prompt: T`A wheelchair ramp rises steadily from the ground. A support post ${a} feet from the bottom of the ramp is ${h1} feet tall. The top of the ramp is ${b2} feet farther along. How high is the top of the ramp?`,
          visual: S.svg(W, Hh, v, 'A ramp with a shorter support post forming nested similar triangles'),
          parts: [{ kind: 'num', answer: String(H2), show: H2 + '\\text{ feet}', post: 'feet', points: 3, verify: pos(`${h1}/${a}=x/(${a}+${b2})`) }],
          solution: [
            T`The small triangle (post) and the whole ramp share the same angle at the bottom, so they're similar.`,
            T`The whole ramp's base is \(${a} + ${b2} = ${a + b2}\) ft: \(\dfrac{${h1}}{${a}} = \dfrac{h}{${a + b2}}\)`,
            T`\(h = \dfrac{${h1}\cdot${a + b2}}{${a}} = ${H2}\)`,
            T`\(${H.box(H2 + '\\text{ ft}')}\)`,
          ],
        };
      },
    },
    angles: {
      name: 'Angle sum',
      gen(rng) {
        let c, x;
        do {
          c = [[1, rng.int(-20, 30)], [rng.int(2, 3), rng.int(-20, 20)], [1, rng.int(-10, 40)]];
          const s = c[0][0] + c[1][0] + c[2][0], k = c[0][1] + c[1][1] + c[2][1];
          x = (180 - k) / s;
        } while (!Number.isInteger(x) || c.some(([m, k]) => m * x + k <= 5));
        const vals = c.map(([m, k]) => m * x + k), big = Math.max(...vals);
        const lab = c.map(([m, k]) => MX.poly([[m, { x: 1 }], [k, {}]]));
        // the angle sum equation as displayed; the largest angle comes from evaluating the displayed expressions at its root
        const angleEq = `(${lab[0].asc})+(${lab[1].asc})+(${lab[2].asc})=180`;
        const angleX = MV.all(MV.solves(angleEq), MV.custom((xv) => lab.every((l) => MV.fn(l.asc, 'x')(xv) > 0) || 'an angle is not positive'));
        let angleRoots = null;
        const angleBig = MV.custom((a) => {
          const rs = angleRoots || (angleRoots = MV.roots(angleEq));
          if (!Array.isArray(rs) || rs.length !== 1) return 'the angle equation should have one solution';
          const ang = lab.map((l) => MV.fn(l.asc, 'x')(rs[0]));
          if (ang.some((t) => !(t > 0))) return 'an angle is not positive';
          return MV.value(Math.max(...ang))(a);
        });
        const W = 320, Hh = 170;
        let v = S.poly([[40, 140], [290, 140], [120, 30]], 'ln soft');
        v += S.label(70, 132, lab[0].asc.replace(/-/g, ' − ').replace(/\+/g, ' + ') + '°', { cls: 'lbl', a: 'start' }) + S.label(258, 132, lab[1].asc.replace(/-/g, ' − ').replace(/\+/g, ' + ') + '°', { cls: 'lbl', a: 'end' }) + S.label(122, 56, lab[2].asc.replace(/-/g, ' − ').replace(/\+/g, ' + ') + '°', { cls: 'lbl' });
        return {
          prompt: T`The angles of a triangle measure \((${lab[0].tex})^{\circ}\), \((${lab[1].tex})^{\circ}\) and \((${lab[2].tex})^{\circ}\). Find \(x\) and the measure of the largest angle.`,
          visual: S.svg(W, Hh, v, 'A triangle with its angles written in terms of x'),
          parts: [
            { label: 'a', ask: 'Value of x', kind: 'num', var: 'x', answer: String(x), show: 'x = ' + x, points: 2, verify: angleX },
            { label: 'b', ask: 'Largest angle', kind: 'num', answer: String(big), show: big + '^{\\circ}', post: 'degrees', points: 2, verify: angleBig },
          ],
          solution: [
            T`The angles of any triangle add to \(180^{\circ}\).`,
            T`\(\left(${lab[0].tex}\right) + \left(${lab[1].tex}\right) + \left(${lab[2].tex}\right) = 180\)`,
            T`\(${MX.poly([[c[0][0] + c[1][0] + c[2][0], { x: 1 }], [c[0][1] + c[1][1] + c[2][1], {}]]).tex} = 180\), so \(x = ${x}\)`,
            T`The angles are ${vals.join('°, ')}°. \(${H.box(T`x = ${x},\ ${big}^{\circ}`)}\)`,
          ],
        };
      },
    },
    perimeter: {
      name: 'Triangle perimeter',
      gen(rng) {
        let leg, k, base, P;
        do { leg = rng.int(5, 30); k = rng.int(1, 9); base = leg - k; P = 2 * leg + base; } while (base < 3);
        const unit = rng.pick(['inches', 'centimeters', 'feet']);
        const W = 320, Hh = 170;
        let v = S.poly([[60, 140], [260, 140], [160, 30]], 'ln soft') + S.label(160, 158, 'x − ' + k, { cls: 'lbl' }) + S.label(98, 80, 'x', { cls: 'lbl', a: 'end' }) + S.label(222, 80, 'x', { cls: 'lbl', a: 'start' });
        v += S.line(106, 86, 114, 80, 'ln') + S.line(206, 80, 214, 86, 'ln') + S.text(160, 96, 'P = ' + P, { cls: 'tx small' });
        return {
          prompt: T`An isosceles triangle has two equal sides. The third side (the base) is ${k} ${unit} shorter than each of the equal sides. The perimeter is ${P} ${unit}. Find the length of the equal sides and of the base.`,
          visual: S.svg(W, Hh, v, 'An isosceles triangle with sides x, x and x minus ' + k),
          parts: [
            { label: 'a', ask: 'Each equal side', kind: 'num', answer: String(leg), show: leg + '\\text{ ' + unit + '}', post: unit, points: 2, verify: pos(`x+x+(x-${k})=${P}`, (x) => x - k > 0) },
            { label: 'b', ask: 'Base', kind: 'num', answer: String(base), show: base + '\\text{ ' + unit + '}', post: unit, points: 2, verify: pos(`2(x+${k})+x=${P}`) },
          ],
          solution: [T`Let \(x\) be an equal side; the base is \(x - ${k}\).`, T`Perimeter: \(x + x + \left(x - ${k}\right) = ${P}\), so \(3x - ${k} = ${P}\)`, T`\(3x = ${P + k}\), \(x = ${leg}\); base \(= ${leg} - ${k} = ${base}\)`, T`\(${H.box(T`${leg},\ ${leg},\ ${base}`)}\)`],
        };
      },
    },
    area: {
      name: 'Triangle area (quadratic)',
      gen(rng) {
        let h, k, A;
        do { h = rng.int(3, 14); k = rng.int(1, 8); A = (h * (h + k)) / 2; } while (!Number.isInteger(A));
        const unit = rng.pick(['cm', 'in', 'ft']);
        const W = 320, Hh = 170;
        let v = S.poly([[50, 140], [270, 140], [200, 36]], 'ln soft') + S.line(200, 36, 200, 140, 'ln dash') + S.rightAngle(200, 140, 8, -1, -1);
        v += S.label(160, 158, 'h + ' + k, { cls: 'lbl' }) + S.label(208, 96, 'h', { cls: 'lbl', a: 'start' }) + S.text(130, 116, 'Area = ' + A + ' ' + unit + '²', { cls: 'tx small' });
        return {
          prompt: T`The base of a triangle is ${k} ${unit} longer than its height. The area is ${A} square ${unit}. Find the height and the base.`,
          visual: S.svg(W, Hh, v, 'A triangle with height h and base h plus ' + k),
          parts: [
            { label: 'a', ask: 'Height', kind: 'num', answer: String(h), show: h + '\\text{ ' + unit + '}', post: unit, points: 2, verify: pos(`(1/2)(x+${k})x=${A}`) },
            { label: 'b', ask: 'Base', kind: 'num', answer: String(h + k), show: h + k + '\\text{ ' + unit + '}', post: unit, points: 2, verify: pos(`(1/2)x(x-${k})=${A}`, (x) => x - k > 0) },
          ],
          solution: [
            T`Area of a triangle: \(A = \frac{1}{2}bh\), so \(\frac{1}{2}\left(h + ${k}\right)h = ${A}\)`,
            T`Multiply by 2: \(h^{2} + ${k}h = ${2 * A}\), so \(h^{2} + ${k}h - ${2 * A} = 0\)`,
            T`Factor: \(\left(h - ${h}\right)\left(h + ${h + k}\right) = 0\), so \(h = ${h}\) (a height can't be negative).`,
            T`Base \(= ${h} + ${k} = ${h + k}\). \(${H.box(T`h = ${h},\ b = ${h + k}`)}\)`,
          ],
        };
      },
    },
  };
  MX.register({
    id: 'w-triangles', kind: 'word', section: SEC, title: 'Similar triangles & triangles', sources: ['Exam 3 #22'],
    slots: [{ label: 'Triangles', source: 'Exam 3 #22', pool: ['shadow', 'mirror', 'nested', 'angles', 'perimeter', 'area'] }],
    lesson: T`<p>Two triangles can have the same shape but different sizes, like a photo and its enlargement. Such triangles let you measure things you can't reach, such as the height of a tree. This topic also uses a few basic facts about any triangle.</p>
<div class="box def"><h4>Definition <b>Similar triangles</b></h4><p>Two triangles are <strong>similar</strong> when their three angles match. Then their matching sides are <strong>proportional</strong>: each side of the big triangle is the same multiple of the matching side of the small one.</p></div>
<h3>Where similar triangles show up</h3>
<ul><li><strong>Shadows:</strong> at the same moment, the sun hits every object at the same angle. Each object, its shadow and the sun's ray form similar triangles.</li>
<li><strong>A mirror on the ground:</strong> light bounces off at the same angle it arrives. The triangle from your eyes to the mirror is similar to the triangle from the treetop to the mirror.</li>
<li><strong>A triangle inside a triangle:</strong> a post under a ramp makes a small triangle that shares the bottom angle with the whole ramp.</li></ul>
<div class="box how"><h4>How to <b>use similar triangles</b></h4><ol>
<li>Sketch both triangles and label the lengths you know.</li>
<li>Write a proportion with the same kind of side in the same place. For example, height over base for the small triangle equals height over base for the big one.</li>
<li>Cross-multiply and solve.</li></ol></div>
<div class="ex"><h4>Example</h4><p>A 6-foot man casts a 4-foot shadow. At the same time, a tree casts a 30-foot shadow. How tall is the tree?</p><table class="st">
<tr><td>Height over shadow, for each.</td><td>\(\dfrac{6}{4} = \dfrac{h}{30}\)</td></tr>
<tr><td>Cross-multiply.</td><td>\(4h = 6 \cdot 30 = 180\)</td></tr>
<tr><td>Divide by 4.</td><td>\(h = 45\text{ feet}\)</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>In a ramp problem, the big triangle's base is the <em>whole</em> distance from the bottom. If the post is 4 feet from the bottom and the top is 6 feet farther along, the big base is \(4 + 6 = 10\) feet, not 6.</p></div>
<h3>Facts about any triangle</h3>
<div class="box rule"><h4>Rule <b>Angles, perimeter and area</b></h4><p>The three angles add to \(180^{\circ}\). The perimeter is the sum of the three sides. An isosceles triangle has two equal sides. The area is \(A = \frac{1}{2}bh\), where \(b\) is the base and \(h\) is the height.</p></div>
<div class="ex"><h4>Example</h4><p>The angles of a triangle are \(x^{\circ}\), \(2x^{\circ}\) and \(\left(x + 20\right)^{\circ}\). Find \(x\) and the largest angle.</p><table class="st">
<tr><td>The angles add to 180.</td><td>\(x + 2x + \left(x + 20\right) = 180\)</td></tr>
<tr><td>Combine like terms.</td><td>\(4x + 20 = 180\)</td></tr>
<tr><td>Solve.</td><td>\(4x = 160,\quad x = 40\)</td></tr>
<tr><td>The angles are 40°, 80° and 60°.</td><td>\(\text{largest} = 80^{\circ}\)</td></tr></table></div>
<p>An area problem can lead to a quadratic. If the base is 4 more than the height and the area is 30, then \(\frac{1}{2}h\left(h + 4\right) = 30\). Multiply by 2 to get \(h^{2} + 4h - 60 = 0\), which factors as \(\left(h + 10\right)\left(h - 6\right) = 0\). A height can't be negative, so \(h = 6\) and the base is 10.</p>`,
    variants: tri,
  });

  // ================= PERIMETER & DIMENSIONS =================
  const RCTX = [['A rectangular picture frame', 'inches', 'square inches'], ['A rectangular garden', 'feet', 'square feet'], ['A rectangular soccer field', 'yards', 'square yards'], ['A rectangular rug', 'feet', 'square feet'], ['A rectangular poster', 'centimeters', 'square centimeters']];
  const unitOpts = (u, u2) => ({ answer: u, options: [u, u2, u === 'feet' ? 'inches' : 'feet'] });
  const perim = {
    rect: {
      name: 'Rectangle perimeter',
      gen(rng) {
        const [ctx, u, u2] = rng.pick(RCTX);
        let a, k, w, l;
        do { a = rng.int(2, 4); k = rng.nz(-9, 9); w = rng.int(3, 40); l = a * w + k; } while (l <= w);
        const P = 2 * (l + w);
        const phr = `The length is ${Math.abs(k)} ${u} ${k < 0 ? 'less' : 'more'} than ${a === 2 ? 'twice' : a === 3 ? 'three times' : a + ' times'} the width.`;
        const W = 320, Hh = 150;
        let v = S.rect(60, 30, 200, 90, 'ln soft') + S.label(160, 140, a + 'w ' + (k < 0 ? '− ' + -k : '+ ' + k), { cls: 'lbl' }) + S.label(270, 80, 'w', { cls: 'lbl', a: 'start' }) + S.text(160, 80, 'P = ' + P + ' ' + u, { cls: 'tx small' });
        return {
          prompt: T`${ctx} has a perimeter of ${P} ${u}. ${phr} Find the length and the width. Include units in your answers.`,
          visual: S.svg(W, Hh, v, 'A rectangle with width w and length in terms of w'),
          parts: [
            { label: 'a', ask: 'Length', kind: 'num', answer: String(l), units: unitOpts(u, u2), show: l + '\\text{ ' + u + '}', points: 2, verify: pos(`2x+2(x-(${k}))/${a}=${P}`, (x) => x - k > 0) },
            { label: 'b', ask: 'Width', kind: 'num', answer: String(w), units: unitOpts(u, u2), show: w + '\\text{ ' + u + '}', points: 2, verify: pos(`2(${a}x+(${k}))+2x=${P}`, (x) => a * x + k > 0) },
          ],
          solution: [T`Let \(w\) be the width; the length is \(${a}w ${MX.sgnTerm(k)}\).`, T`\(P = 2l + 2w\): \(2\left(${a}w ${MX.sgnTerm(k)}\right) + 2w = ${P}\)`, T`\(${2 * a + 2}w ${MX.sgnTerm(2 * k)} = ${P}\), so \(w = ${w}\) and \(l = ${a}\cdot${w} ${MX.sgnTerm(k)} = ${l}\)`, T`\(${H.box(T`l = ${l}\text{ ${u}},\ w = ${w}\text{ ${u}}`)}\)`],
        };
      },
    },
    fence: {
      name: 'Three-sided fence',
      gen(rng) {
        let w, k, l, F;
        do { w = rng.int(5, 40); k = rng.int(-10, 20); l = 2 * w + k; F = 2 * w + l; } while (l <= 0 || l === w);
        const W = 340, Hh = 170;
        let v = S.rect(40, 20, 260, 34, 'wood ln', 2) + S.text(170, 42, 'barn', { cls: 'tx small', w: 700 }) + S.pline([[70, 54], [70, 140], [270, 140], [270, 54]], 'acc thick');
        v += S.line(70, 54, 270, 54, 'ln dash') + S.label(170, 158, 'l = 2w ' + (k < 0 ? '− ' + -k : '+ ' + k), { cls: 'lbl' }) + S.label(62, 100, 'w', { cls: 'lbl', a: 'end' }) + S.label(278, 100, 'w', { cls: 'lbl', a: 'start' });
        return {
          prompt: T`A farmer has ${F} feet of fencing to make a rectangular pen along the side of a barn. The barn wall forms one side, so only three sides need fencing. The side parallel to the barn is ${k === 0 ? 'twice' : Math.abs(k) + ' feet ' + (k < 0 ? 'less' : 'more') + ' than twice'} the width. Find the width and the length of the pen.`,
          visual: S.svg(W, Hh, v, 'A pen fenced on three sides against a barn'),
          parts: [
            { label: 'a', ask: 'Width (each side touching the barn)', kind: 'num', answer: String(w), show: w + '\\text{ ft}', post: 'feet', points: 2, verify: pos(`x+x+(2x+(${k}))=${F}`, (x) => 2 * x + k > 0) },
            { label: 'b', ask: 'Length (side parallel to the barn)', kind: 'num', answer: String(l), show: l + '\\text{ ft}', post: 'feet', points: 2, verify: pos(`2(x-(${k}))/2+x=${F}`, (x) => x - k > 0) },
          ],
          solution: [T`Fencing covers two widths and one length: \(w + w + l = ${F}\), with \(l = 2w ${MX.sgnTerm(k)}\).`, T`\(2w + 2w ${MX.sgnTerm(k)} = ${F}\), so \(4w = ${F - k}\) and \(w = ${w}\)`, T`\(l = 2\cdot${w} ${MX.sgnTerm(k)} = ${l}\). \(${H.box(T`w = ${w}\text{ ft},\ l = ${l}\text{ ft}`)}\)`],
        };
      },
    },
    area: {
      name: 'Rectangle area (quadratic)',
      gen(rng) {
        const [ctx, u, u2] = rng.pick(RCTX);
        const w = rng.int(3, 15), k = rng.int(1, 9), A = w * (w + k);
        const W = 320, Hh = 150;
        let v = S.rect(60, 30, 200, 90, 'ln soft') + S.label(160, 140, 'w + ' + k, { cls: 'lbl' }) + S.label(270, 80, 'w', { cls: 'lbl', a: 'start' }) + S.text(160, 80, 'Area = ' + A + ' ' + u2, { cls: 'tx small' });
        return {
          prompt: T`${ctx} is ${k} ${u} longer than it is wide. Its area is ${A} ${u2}. Find its width and length.`,
          visual: S.svg(W, Hh, v, 'A rectangle with width w and length w plus ' + k),
          parts: [
            { label: 'a', ask: 'Width', kind: 'num', answer: String(w), units: unitOpts(u, u2), show: w + '\\text{ ' + u + '}', points: 2, verify: pos(`x(x+${k})=${A}`) },
            { label: 'b', ask: 'Length', kind: 'num', answer: String(w + k), units: unitOpts(u, u2), show: w + k + '\\text{ ' + u + '}', points: 2, verify: pos(`x(x-${k})=${A}`, (x) => x - k > 0) },
          ],
          solution: [T`Area = length × width: \(w\left(w + ${k}\right) = ${A}\)`, T`\(w^{2} + ${k}w - ${A} = 0\), which factors as \(\left(w - ${w}\right)\left(w + ${w + k}\right) = 0\)`, T`A width can't be negative, so \(w = ${w}\) and the length is ${w + k}.`, T`\(${H.box(T`${w}\text{ ${u}} \times ${w + k}\text{ ${u}}`)}\)`],
        };
      },
    },
  };
  MX.register({
    id: 'w-perimeter', kind: 'word', section: SEC, title: 'Perimeter & dimensions', sources: ['Exam 2 #20'],
    slots: [{ label: 'Perimeter & dimensions', source: 'Exam 2 #20', pool: ['rect', 'fence', 'area'] }],
    lesson: T`<p>The <strong>perimeter</strong> of a shape is the distance around it, like the length of a fence. The <strong>area</strong> is the space inside, like the amount of carpet for a floor. In these problems you know the perimeter or the area and must find the length and width.</p>
<div class="box rule"><h4>Formula <b>Rectangle</b></h4><p>For a rectangle with length \(l\) and width \(w\): the perimeter is \(P = 2l + 2w\), and the area is \(A = lw\).</p></div>
<div class="box how"><h4>How to <b>find the dimensions of a rectangle</b></h4><ol>
<li>Draw the rectangle and label it.</li>
<li>Let \(w\) be the width. Write the length in terms of \(w\). "5 less than three times the width" is \(3w - 5\).</li>
<li>Put both into the formula for perimeter or area.</li>
<li>Solve for \(w\), then use it to find the length.</li>
<li>Check in the story, and answer with units.</li></ol></div>
<div class="ex"><h4>Example</h4><p>A garden has a perimeter of 62 feet. Its length is 5 feet less than three times its width. Find its length and width.</p><table class="st">
<tr><td>Name the width, and write the length with it.</td><td>\(l = 3w - 5\)</td></tr>
<tr><td>Use the perimeter formula.</td><td>\(2\left(3w - 5\right) + 2w = 62\)</td></tr>
<tr><td>Distribute and combine like terms.</td><td>\(8w - 10 = 62\)</td></tr>
<tr><td>Solve for \(w\).</td><td>\(8w = 72,\quad w = 9\)</td></tr>
<tr><td>Find the length.</td><td>\(l = 3\cdot9 - 5 = 22\)</td></tr>
<tr><td>Check: \(2\cdot22 + 2\cdot9 = 62\). ✓</td><td>\(22\text{ ft by }9\text{ ft}\)</td></tr></table></div>
<h3>Fencing only some sides</h3>
<p>When a wall or barn forms one side, you fence only the other three: two widths and one length. With 100 feet of fence and a length (along the barn) twice the width, \(w + w + 2w = 100\), so \(w = 25\) feet and \(l = 50\) feet.</p>
<h3>Area problems lead to quadratics</h3>
<p>Area multiplies length by width, so you get \(w^{2}\). Set the equation equal to 0, factor, and keep the positive answer.</p>
<div class="ex"><h4>Example</h4><p>A rug is 3 feet longer than it is wide. Its area is 40 square feet. Find its width and length.</p><table class="st">
<tr><td>Area = length × width.</td><td>\(w\left(w + 3\right) = 40\)</td></tr>
<tr><td>Set it equal to 0.</td><td>\(w^{2} + 3w - 40 = 0\)</td></tr>
<tr><td>Factor.</td><td>\(\left(w + 8\right)\left(w - 5\right) = 0\)</td></tr>
<tr><td>A width can't be negative.</td><td>\(w = 5,\quad l = 8\)</td></tr></table></div>
<div class="box warn"><h4>Watch out</h4><p>Use the right units. Perimeter is a length, so it is in feet or inches. Area is in <em>square</em> units, such as square feet.</p></div>`,
    variants: perim,
  });
})(typeof window !== 'undefined' ? window : globalThis);

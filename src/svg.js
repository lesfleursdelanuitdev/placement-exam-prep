/* svg.js: small SVG drawing kit. Everything is styled through CSS classes so
   visuals follow the light/dark theme. No markers or ids (safe to repeat). */
(function (G) {
  'use strict';
  const MX = G.MX;
  const r1 = (v) => Math.round(v * 10) / 10;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const S = {};
  S.esc = esc;
  S.svg = (w, h, body, label) =>
    '<svg class="sv" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="' + esc(label || 'diagram') + '">' + body + '</svg>';
  S.line = (x1, y1, x2, y2, cls = 'ln') => '<line class="' + cls + '" x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(x2) + '" y2="' + r1(y2) + '"/>';
  S.rect = (x, y, w, h, cls = 'ln', rx = 0) => '<rect class="' + cls + '" x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(w) + '" height="' + r1(h) + '"' + (rx ? ' rx="' + rx + '"' : '') + '/>';
  S.circle = (cx, cy, r, cls = 'ln') => '<circle class="' + cls + '" cx="' + r1(cx) + '" cy="' + r1(cy) + '" r="' + r1(r) + '"/>';
  S.ellipse = (cx, cy, rx, ry, cls = 'ln') => '<ellipse class="' + cls + '" cx="' + r1(cx) + '" cy="' + r1(cy) + '" rx="' + r1(rx) + '" ry="' + r1(ry) + '"/>';
  S.poly = (pts, cls = 'ln') => '<polygon class="' + cls + '" points="' + pts.map((p) => r1(p[0]) + ',' + r1(p[1])).join(' ') + '"/>';
  S.pline = (pts, cls = 'ln') => '<polyline class="' + cls + '" points="' + pts.map((p) => r1(p[0]) + ',' + r1(p[1])).join(' ') + '"/>';
  S.path = (d, cls = 'ln') => '<path class="' + cls + '" d="' + d + '"/>';
  // text: opts {a: 'start'|'middle'|'end', cls, size, w (weight), rot}
  S.text = (x, y, str, o = {}) => {
    const a = o.a || 'middle';
    const tr = o.rot ? ' transform="rotate(' + o.rot + ' ' + r1(x) + ' ' + r1(y) + ')"' : '';
    return '<text class="' + (o.cls || 'tx') + '" x="' + r1(x) + '" y="' + r1(y) + '" text-anchor="' + a + '"' +
      (o.size ? ' font-size="' + o.size + '"' : '') + (o.w ? ' font-weight="' + o.w + '"' : '') + tr + '>' + esc(str) + '</text>';
  };
  // label with a paper-colored halo so it reads over lines
  S.label = (x, y, str, o = {}) => S.text(x, y, str, Object.assign({}, o, { cls: 'tx halo' + (o.cls ? ' ' + o.cls : '') })) + S.text(x, y, str, o);
  S.g = (body, tf) => '<g' + (tf ? ' transform="' + tf + '"' : '') + '>' + body + '</g>';

  // arrow with a drawn head
  S.arrow = (x1, y1, x2, y2, cls = 'ln', head = 7) => {
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const a1 = ang + Math.PI * 0.85, a2 = ang - Math.PI * 0.85;
    const hp = [[x2, y2], [x2 + head * Math.cos(a1), y2 + head * Math.sin(a1)], [x2 + head * Math.cos(a2), y2 + head * Math.sin(a2)]];
    const fillCls = cls.replace(/\bln\b/, 'fillink').replace(/\bacc\b/, 'accf').replace(/\bmut\b/, 'mutf');
    return S.line(x1, y1, x2 - 0.6 * head * Math.cos(ang), y2 - 0.6 * head * Math.sin(ang), cls) + S.poly(hp, fillCls + ' nostroke');
  };
  // double-headed dimension line with a centered label
  S.dim = (x1, y1, x2, y2, label, o = {}) => {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const cls = o.cls || 'dimln';
    return S.arrow(mx, my, x1, y1, cls, 6) + S.arrow(mx, my, x2, y2, cls, 6) +
      (label != null ? S.label(mx + (o.dx || 0), my + (o.dy || 4), label, { cls: o.lcls || 'lbl' }) : '');
  };
  S.rightAngle = (x, y, s, dx, dy) =>
    S.pline([[x + dx * s, y], [x + dx * s, y + dy * s], [x, y + dy * s]], 'ln thin');
  S.q = (x, y, str = '?') => S.label(x, y, str, { cls: 'qm', w: 700, size: 15 });

  // ---------- coordinate plane ----------
  // o: {xmin,xmax,ymin,ymax,w,h,step,ystep,labelEvery,xlabel,ylabel,pad}
  S.plane = function (o) {
    const pad = o.pad != null ? o.pad : 22;
    const W = o.w || 260, H = o.h || 260;
    const sx = (W - 2 * pad) / (o.xmax - o.xmin), sy = (H - 2 * pad) / (o.ymax - o.ymin);
    const X = (x) => pad + (x - o.xmin) * sx;
    const Y = (y) => H - pad - (y - o.ymin) * sy;
    const step = o.step || 1, ystep = o.ystep || step;
    const le = o.labelEvery || 5 * step, yle = o.ylabelEvery || le;
    let b = '';
    for (let x = Math.ceil(o.xmin / step) * step; x <= o.xmax + 1e-9; x += step) b += S.line(X(x), Y(o.ymin), X(x), Y(o.ymax), 'grid');
    for (let y = Math.ceil(o.ymin / ystep) * ystep; y <= o.ymax + 1e-9; y += ystep) b += S.line(X(o.xmin), Y(y), X(o.xmax), Y(y), 'grid');
    const x0 = o.xmin <= 0 && o.xmax >= 0 ? X(0) : X(o.xmin);
    const y0 = o.ymin <= 0 && o.ymax >= 0 ? Y(0) : Y(o.ymin);
    b += S.arrow(X(o.xmin), y0, X(o.xmax) + 8, y0, 'ln axis', 6) + S.arrow(x0, Y(o.ymin), x0, Y(o.ymax) - 8, 'ln axis', 6);
    for (let x = Math.ceil(o.xmin / le) * le; x <= o.xmax + 1e-9; x += le) {
      if (Math.abs(x) < 1e-9 && o.xmin < 0) continue;
      b += S.line(X(x), y0 - 3, X(x), y0 + 3, 'ln thin') + S.text(X(x), y0 + 14, MX.num(x), { cls: 'tx tick' });
    }
    for (let y = Math.ceil(o.ymin / yle) * yle; y <= o.ymax + 1e-9; y += yle) {
      if (Math.abs(y) < 1e-9 && o.ymin < 0) continue;
      b += S.line(x0 - 3, Y(y), x0 + 3, Y(y), 'ln thin') + S.text(x0 - 6, Y(y) + 4, MX.num(y), { cls: 'tx tick', a: 'end' });
    }
    if (o.xlabel) b += S.text(X(o.xmax) + 2, y0 - 7, o.xlabel, { cls: 'tx axl', a: 'end' });
    if (o.ylabel) b += S.text(x0 + 6, Y(o.ymax) - 2, o.ylabel, { cls: 'tx axl', a: 'start' });
    const clip = (pts) => pts.filter((p) => p[1] >= o.ymin - 1e-9 && p[1] <= o.ymax + 1e-9 && p[0] >= o.xmin - 1e-9 && p[0] <= o.xmax + 1e-9);
    return {
      X, Y, W, H, body: b,
      // plot y = f(x) as a polyline (split where it leaves the window)
      curve(f, cls = 'acc thick', n = 160) {
        let out = '', seg = [];
        for (let k = 0; k <= n; k++) {
          const x = o.xmin + ((o.xmax - o.xmin) * k) / n, y = f(x);
          if (isFinite(y) && y >= o.ymin - 0.001 && y <= o.ymax + 0.001) seg.push([X(x), Y(y)]);
          else { if (seg.length > 1) out += S.pline(seg, cls); seg = []; }
        }
        if (seg.length > 1) out += S.pline(seg, cls);
        return out;
      },
      dot(x, y, cls = 'accf', r = 3.6) { return S.circle(X(x), Y(y), r, cls + ' nostroke'); },
      seg(x1, y1, x2, y2, cls = 'acc thick') { return S.line(X(x1), Y(y1), X(x2), Y(y2), cls); },
      clip,
    };
  };

  // number line for inequality graphs: {min,max,val,closed,dir:'right'|'left', w, labelEvery}
  S.numberLine = function (o) {
    const W = o.w || 300, H = o.h || 54, pad = 18;
    const X = (x) => pad + ((x - o.min) * (W - 2 * pad)) / (o.max - o.min);
    const y = 22;
    let b = S.arrow(X(o.min) - 6, y, 4, y, 'ln', 6) + S.arrow(X(o.max) + 6 - 12, y, W - 4, y, 'ln', 6);
    b += S.line(X(o.min) - 6, y, X(o.max) + 6, y, 'ln');
    const step = o.step || 1, le = o.labelEvery || step;
    for (let v = o.min; v <= o.max + 1e-9; v += step) {
      const major = Math.abs((v - o.min) % le) < 1e-9 || Math.abs(((v - o.min) % le) - le) < 1e-9;
      b += S.line(X(v), y - (major ? 6 : 4), X(v), y + (major ? 6 : 4), 'ln thin');
      if (major) b += S.text(X(v), y + 22, MX.num(v), { cls: 'tx tick' });
    }
    if (o.val != null) {
      const x = X(o.val);
      const end = o.dir === 'right' ? W - 4 : 4;
      b += S.line(x, y, end + (o.dir === 'right' ? -8 : 8), y, 'acc ray') + S.arrow(x, y, end, y, 'acc ray', 9);
      b += S.circle(x, y, 5.5, o.closed ? 'accf acc' : 'paperf acc');
    }
    return S.svg(W, H, b, o.label || 'number line');
  };

  // ---------- little illustrations ----------
  const I = {};
  I.house = (x, y, w, h) => // x,y = bottom-left
    S.rect(x, y - h, w, h, 'ln soft') + S.poly([[x - 8, y - h], [x + w / 2, y - h - h * 0.55], [x + w + 8, y - h]], 'ln soft2') +
    S.rect(x + w * 0.38, y - h * 0.5, w * 0.24, h * 0.5, 'ln paperf') + S.rect(x + w * 0.1, y - h * 0.8, w * 0.2, h * 0.2, 'ln paperf');
  I.ground = (x1, x2, y) => S.line(x1, y, x2, y, 'ln ground');
  I.tree = (x, y, h) => // base center
    S.rect(x - h * 0.05, y - h * 0.32, h * 0.1, h * 0.32, 'wood nostroke') +
    S.poly([[x, y - h], [x - h * 0.28, y - h * 0.3], [x + h * 0.28, y - h * 0.3]], 'leaf nostroke') +
    S.poly([[x, y - h * 1.0], [x - h * 0.2, y - h * 0.55], [x + h * 0.2, y - h * 0.55]], 'leaf2 nostroke');
  I.lamp = (x, y, h) =>
    S.rect(x - 2, y - h, 4, h, 'fillink nostroke') + S.rect(x - 7, y - h - 12, 14, 12, 'sun ln', 2) + S.rect(x - 6, y - 5, 12, 5, 'fillink nostroke');
  I.person = (x, y, h) => {
    const hr = h * 0.11;
    return S.circle(x, y - h + hr, hr, 'fillink nostroke') + S.line(x, y - h + 2 * hr, x, y - h * 0.4, 'ln thick') +
      S.line(x, y - h * 0.4, x - h * 0.12, y, 'ln thick') + S.line(x, y - h * 0.4, x + h * 0.12, y, 'ln thick') +
      S.line(x - h * 0.16, y - h * 0.62, x + h * 0.16, y - h * 0.62, 'ln thick');
  };
  I.flag = (x, y, h) => S.line(x, y, x, y - h, 'ln thick') + S.poly([[x, y - h], [x + h * 0.35, y - h * 0.9], [x, y - h * 0.8]], 'accf nostroke');
  I.building = (x, y, w, h) => {
    let b = S.rect(x, y - h, w, h, 'ln soft');
    for (let r = y - h + 8; r < y - 12; r += 14) for (let c = x + 6; c < x + w - 8; c += 12) b += S.rect(c, r, 6, 8, 'paperf ln thin');
    return b;
  };
  I.car = (x, y, flip, cls = 'accf') => { // x,y = center bottom; ~46 wide
    const s = flip ? -1 : 1;
    const body = [[-23, -6], [-23, -14], [-12, -15], [-6, -23], [8, -23], [15, -15], [23, -13], [23, -6]].map((p) => [x + s * p[0], y + p[1]]);
    return S.poly(body, cls + ' ln') + S.poly([[-4, -21], [6, -21], [11, -15], [-9, -15]].map((p) => [x + s * p[0], y + p[1]]), 'paperf nostroke') +
      S.circle(x - 13, y - 5, 5, 'fillink nostroke') + S.circle(x + 13, y - 5, 5, 'fillink nostroke');
  };
  I.bag = (x, y, label, cls = 'soft') => // bottom center, 34x40
    S.path('M' + (x - 16) + ' ' + y + ' L' + (x - 17) + ' ' + (y - 34) + ' Q' + x + ' ' + (y - 44) + ' ' + (x + 17) + ' ' + (y - 34) + ' L' + (x + 16) + ' ' + y + ' Z', 'ln ' + cls) +
    (label ? S.text(x, y - 14, label, { cls: 'tx small', w: 700 }) : '');
  I.beaker = (x, y, w, h, frac, label) => { // bottom-left
    const lvl = y - h * frac;
    return S.rect(x, lvl, w, y - lvl, 'water nostroke') + S.pline([[x, y - h - 4], [x, y], [x + w, y], [x + w, y - h - 4]], 'ln thick') +
      S.line(x + w, y - h - 4, x + w + 5, y - h - 8, 'ln') + (label ? S.label(x + w / 2, lvl + (y - lvl) / 2 + 4, label, { cls: 'lbl' }) : '');
  };
  I.ticket = (x, y, w, h, label, cls = 'soft') =>
    S.path('M' + x + ' ' + y + ' h' + w + ' v' + (h / 2 - 5) + ' a5 5 0 0 0 0 10 v' + (h / 2 - 5) + ' h' + -w + ' v' + -(h / 2 - 5) + ' a5 5 0 0 0 0 -10 Z', 'ln ' + cls) +
    S.line(x + w * 0.76, y + 4, x + w * 0.76, y + h - 4, 'ln dash') + S.text(x + w * 0.4, y + h / 2 + 5, label, { cls: 'tx small', w: 700 });
  I.coin = (x, y, r, label, cls = 'sun') => S.circle(x, y, r, 'ln ' + cls) + S.circle(x, y, r - 3, 'ln thin nofill') + S.text(x, y + 4, label, { cls: 'tx small', w: 700 });
  I.cupcake = (x, y, s) => // bottom center
    S.poly([[x - s * 0.4, y - s * 0.5], [x + s * 0.4, y - s * 0.5], [x + s * 0.3, y], [x - s * 0.3, y]], 'ln wood') +
    S.path('M' + (x - s * 0.45) + ' ' + (y - s * 0.5) + ' Q' + x + ' ' + (y - s * 1.25) + ' ' + (x + s * 0.45) + ' ' + (y - s * 0.5) + ' Z', 'ln soft2') +
    S.circle(x, y - s * 0.95, s * 0.09, 'accf nostroke');
  I.tag = (x, y, label, cls = 'soft') => // left point at x,y
    S.poly([[x, y], [x + 12, y - 13], [x + 12 + label.length * 7.4 + 8, y - 13], [x + 12 + label.length * 7.4 + 8, y + 13], [x + 12, y + 13]], 'ln ' + cls) +
    S.circle(x + 9, y, 2.4, 'paperf ln thin') + S.text(x + 16, y + 4.5, label, { cls: 'tx', a: 'start', w: 700 });
  I.sun = (x, y, r) => {
    let b = S.circle(x, y, r, 'sun nostroke');
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      b += S.line(x + (r + 3) * Math.cos(a), y + (r + 3) * Math.sin(a), x + (r + 8) * Math.cos(a), y + (r + 8) * Math.sin(a), 'sunln');
    }
    return b;
  };
  I.piggy = (x, y, s) => // center
    S.ellipse(x, y, s, s * 0.72, 'ln soft2') + S.circle(x + s * 0.95, y - s * 0.05, s * 0.28, 'ln soft2') +
    S.rect(x - s * 0.55, y + s * 0.55, s * 0.2, s * 0.35, 'ln soft2') + S.rect(x + s * 0.35, y + s * 0.55, s * 0.2, s * 0.35, 'ln soft2') +
    S.rect(x - s * 0.2, y - s * 0.78, s * 0.4, s * 0.08, 'fillink nostroke') + S.circle(x + s * 0.45, y - s * 0.25, s * 0.06, 'fillink nostroke');
  I.thermo = (x, y, h, frac) => // bottom center of bulb
    S.rect(x - 4, y - h, 8, h - 8, 'ln paperf', 4) + S.rect(x - 2, y - 8 - (h - 12) * frac, 4, (h - 12) * frac, 'hot nostroke') + S.circle(x, y - 4, 7, 'hot ln');
  I.clock = (x, y, r) => S.circle(x, y, r, 'ln paperf') + S.line(x, y, x, y - r * 0.65, 'ln') + S.line(x, y, x + r * 0.5, y, 'ln');
  I.can = (x, y, w, h, label) => S.rect(x, y - h, w, h, 'ln soft2', 3) + S.ellipse(x + w / 2, y - h, w / 2, 4, 'ln soft') + (label ? S.text(x + w / 2, y - h / 2 + 4, label, { cls: 'tx small', w: 700 }) : '');
  I.pump = (x, y) => S.rect(x, y - 44, 26, 44, 'ln soft2', 3) + S.rect(x + 5, y - 38, 16, 12, 'paperf ln thin') + S.path('M' + (x + 26) + ' ' + (y - 30) + ' q12 0 12 12 v10', 'ln');
  I.box = (x, y, w, h, cls = 'soft') => S.rect(x, y - h, w, h, 'ln ' + cls, 2);
  I.boat = (x, y, flip) => {
    const s = flip ? -1 : 1;
    return S.poly([[-20, -8], [20, -8], [14, 0], [-14, 0]].map((p) => [x + s * p[0], y + p[1]]), 'ln wood') +
      S.line(x, y - 8, x, y - 30, 'ln') + S.poly([[0, -30], [0, -11], [s * 14, -11]].map((p) => [x + p[0], y + p[1]]), 'ln paperf');
  };
  I.plane = (x, y, flip) => {
    const s = flip ? -1 : 1;
    return S.poly([[-22, 0], [18, -2], [24, 2], [18, 5], [-22, 4]].map((p) => [x + s * p[0], y + p[1]]), 'ln soft2') +
      S.poly([[-2, 1], [-12, 16], [-6, 16], [8, 2]].map((p) => [x + s * p[0], y + p[1]]), 'ln soft') +
      S.poly([[-20, 0], [-26, -10], [-20, -10], [-14, 0]].map((p) => [x + s * p[0], y + p[1]]), 'ln soft');
  };
  S.I = I;
  MX.S = S;
})(typeof window !== 'undefined' ? window : globalThis);

/* stopwatch.js: a floating stopwatch in the lower right corner.
   Closed, it is a round button with a timer icon (a dot shows while it is running or paused). Open, a panel
   slides out to the left of the button as one pill shape, with the elapsed time and the controls:
   Start · Pause / Resume · Restart · Stop. The time is kept as timestamps, so it stays right across views,
   while the tab is in the background, and after a reload (saved in this browser only). Icons: Lucide (ISC). */
(function (G) {
  'use strict';
  const MX = G.MX, d = G.document;
  if (!d) return;
  const KEY = 'm098-stopwatch-v1';
  const ICON = {
    timer: '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="6 3 20 12 6 21 6 3"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/></svg>',
    stop: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="14" height="14" x="5" y="5" rx="2"/></svg>',
    restart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  };

  // state: idle (never started or stopped) · running · paused. `acc` is time banked before `since`.
  const W = { state: 'idle', acc: 0, since: 0, last: null, open: false };
  const now = () => Date.now();
  const elapsed = () => W.acc + (W.state === 'running' ? now() - W.since : 0);
  function load() {
    try {
      const s = JSON.parse(G.localStorage.getItem(KEY) || 'null');
      if (!s || typeof s !== 'object') return;
      const n = (v) => (typeof v === 'number' && isFinite(v) && v >= 0 ? v : 0);
      if (s.state === 'running' || s.state === 'paused') { W.state = s.state; W.acc = n(s.acc); W.since = n(s.since) || now(); }
      if (typeof s.last === 'number' && isFinite(s.last) && s.last >= 0) W.last = s.last;
    } catch (e) { /* storage unavailable: start fresh */ }
  }
  function save() {
    try { G.localStorage.setItem(KEY, JSON.stringify({ state: W.state, acc: W.acc, since: W.since, last: W.last })); } catch (e) { /* not saved */ }
  }
  // 0:07 · 12:34 · 1:02:03
  function fmt(ms) {
    const t = Math.floor(ms / 1000), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    const two = (v) => String(v).padStart(2, '0');
    return h ? h + ':' + two(m) + ':' + two(s) : m + ':' + two(s);
  }
  function spoken(ms) {
    const t = Math.floor(ms / 1000), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    const part = (v, w) => (v ? v + ' ' + w + (v === 1 ? '' : 's') : '');
    return [part(h, 'hour'), part(m, 'minute'), part(s, 'second')].filter(Boolean).join(' ') || '0 seconds';
  }

  // ---------- actions ----------
  function start() { W.state = 'running'; W.acc = 0; W.since = now(); }
  function pause() { if (W.state === 'running') { W.acc += now() - W.since; W.state = 'paused'; } }
  function resume() { if (W.state === 'paused') { W.since = now(); W.state = 'running'; } }
  function restart() { start(); }
  function stop() { if (W.state !== 'idle') { W.last = elapsed(); W.state = 'idle'; W.acc = 0; } }

  // ---------- page ----------
  let root, tick = 0;
  function build() {
    root = d.createElement('div');
    root.className = 'sw';
    root.id = 'stopwatch';
    root.innerHTML = `<div class="sw-panel" id="sw-panel" role="group" aria-label="Stopwatch" hidden>
        <div class="sw-read"><span class="sw-time" id="sw-time" role="timer" aria-live="off"></span><span class="sw-sub" id="sw-sub"></span></div>
        <div class="sw-btns" id="sw-btns"></div>
      </div>
      <button type="button" class="sw-fab" id="sw-fab" aria-expanded="false" aria-controls="sw-panel">${ICON.timer}<span class="sw-dot" aria-hidden="true"></span></button>`;
    d.body.appendChild(root);
    root.addEventListener('click', (ev) => {
      const b = ev.target.closest('button');
      if (!b) return;
      if (b.id === 'sw-fab') { setOpen(!W.open); return; }
      const a = b.dataset.sw;
      const before = W.state;
      if (a === 'start') start();
      else if (a === 'pause') pause();
      else if (a === 'resume') resume();
      else if (a === 'restart') restart();
      else if (a === 'stop') stop();
      save();
      render(before !== W.state || a === 'restart');
    });
    d.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && W.open) { setOpen(false); d.getElementById('sw-fab').focus(); } });
    d.addEventListener('visibilitychange', () => render(false));
  }
  function setOpen(o) {
    W.open = o;
    const panel = d.getElementById('sw-panel');
    root.classList.toggle('open', o);
    d.getElementById('sw-fab').setAttribute('aria-expanded', String(o));
    if (o) {
      panel.hidden = false;
      render(true);
      const first = panel.querySelector('button');
      if (first) G.requestAnimationFrame(() => first.focus({ preventScroll: true }));
    } else G.setTimeout(() => { if (!W.open) panel.hidden = true; }, 260);
    render(false);
  }
  const btn = (act, icon, label, cls = '') => `<button type="button" class="sw-b ${cls}" data-sw="${act}" aria-label="${label}" title="${label}">${ICON[icon]}<span>${label}</span></button>`;
  function render(rebuildButtons) {
    if (!root) return;
    const ms = elapsed(), st = W.state;
    root.dataset.state = st;
    const fab = d.getElementById('sw-fab');
    fab.setAttribute('aria-label', W.open ? 'Close the stopwatch' : 'Stopwatch' + (st === 'running' ? ', running: ' + spoken(ms) : st === 'paused' ? ', paused at ' + spoken(ms) : ''));
    fab.innerHTML = (W.open ? ICON.close : ICON.timer) + '<span class="sw-dot" aria-hidden="true"></span>';
    const time = d.getElementById('sw-time'), sub = d.getElementById('sw-sub');
    // the elapsed time shows once the stopwatch has been started; before that, only Start
    if (st === 'idle') {
      time.textContent = W.last != null ? fmt(W.last) : '';
      sub.textContent = W.last != null ? 'last time' : 'Stopwatch';
      root.classList.toggle('has-time', W.last != null);
    } else {
      time.textContent = fmt(ms);
      sub.textContent = st === 'paused' ? 'paused' : 'running';
      root.classList.add('has-time');
    }
    if (rebuildButtons) {
      const b = st === 'idle' ? btn('start', 'play', 'Start', 'go')
        : (st === 'running' ? btn('pause', 'pause', 'Pause') : btn('resume', 'play', 'Resume', 'go')) + btn('restart', 'restart', 'Restart') + btn('stop', 'stop', 'Stop', 'halt');
      const box = d.getElementById('sw-btns'), had = box.contains(d.activeElement);
      box.innerHTML = b;
      if (had) { const f = box.querySelector('button'); if (f) f.focus({ preventScroll: true }); }
    }
    clearTimeout(tick);
    if (st === 'running' && !d.hidden) tick = G.setTimeout(() => render(false), 1000 - (ms % 1000) + 5);
  }

  function boot() { load(); build(); render(true); }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot); else boot();
  MX.Stopwatch = { state: W, fmt, elapsed };
})(typeof window !== 'undefined' ? window : globalThis);

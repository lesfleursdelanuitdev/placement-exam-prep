/* store.js: keeps progress across sessions.
   - Always mirrors to localStorage (works anywhere, per browser).
   - When the page runs as a Claude artifact with the db + user capabilities, it also saves a private
     per-user document at data/users/<id>/state, so progress follows the person across devices. */
(function (G) {
  'use strict';
  const MX = G.MX;
  const KEY = 'm098-prep-state-v1';

  // Saved progress comes from storage we don't fully control (browser storage, the account copy),
  // so clean it on every load: numbers must be finite numbers, maps must be plain objects,
  // and anything unexpected is dropped. The page never has to trust a saved value's type.
  const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
  const num = (v, dflt) => (typeof v === 'number' && isFinite(v) ? v : dflt);
  const int = (v, dflt) => { const n = num(v, NaN); return Number.isInteger(n) && n >= 0 ? n : dflt; };
  const str = (v) => (typeof v === 'string' ? v.slice(0, 2000) : '');
  const key = (k) => /^[\w#|:.-]{1,80}$/.test(k);
  function cleanInput(v) {
    if (!isObj(v)) return undefined;
    const o = {};
    if ('value' in v) o.value = str(v.value);
    if ('unit' in v && v.unit != null) o.unit = str(v.unit);
    if ('choice' in v && v.choice != null) o.choice = String(int(+v.choice, 0));
    if (Array.isArray(v.values)) o.values = v.values.slice(0, 6).map(str);
    return o;
  }
  function cleanRes(r) {
    if (!isObj(r)) return null;
    const o = {};
    if (typeof r.ok === 'boolean') o.ok = r.ok;
    if (r.revealed === true) o.revealed = true;
    if (r.skipped === true) o.skipped = true;
    if ('msg' in r) o.msg = str(r.msg);
    if ('tries' in r) o.tries = int(r.tries, 0);
    const val = cleanInput(r.val);
    if (val) o.val = val;
    return o;
  }
  function cleanParts(rr) {
    const o = {};
    if (isObj(rr)) for (const [pi, r] of Object.entries(rr)) { const c = /^\d{1,2}$/.test(pi) && cleanRes(r); if (c) o[pi] = c; }
    return o;
  }
  function sanitize(s) {
    if (!isObj(s) || s.v !== 1) return null;
    const out = { v: 1, exam: null, history: [], tut: {}, flash: {}, drafts: {}, updated: num(s.updated, 0) };
    const e = s.exam;
    if (isObj(e) && typeof e.seed === 'string' && /^[\w-]{1,40}$/.test(e.seed)) {
      out.exam = { no: Math.max(1, int(e.no, 1)), seed: e.seed, gv: int(e.gv, 0), started: num(e.started, Date.now()), finished: e.finished == null ? null : num(e.finished, null), res: {} };
      if (isObj(e.res)) for (const [k, rr] of Object.entries(e.res)) if (key(k)) out.exam.res[k] = cleanParts(rr);
    }
    if (Array.isArray(s.history)) {
      s.history.slice(-60).forEach((h) => {
        if (!isObj(h)) return;
        const earned = num(h.earned, NaN), total = num(h.total, NaN), no = int(h.no, NaN);
        if (!(total > 0) || !(earned >= 0) || !(no >= 1)) return;
        const byTopic = {};
        if (isObj(h.byTopic)) for (const [k, v] of Object.entries(h.byTopic)) if (key(k) && Array.isArray(v)) byTopic[k] = [num(v[0], 0), num(v[1], 0)];
        out.history.push({ no, earned, total, started: num(h.started, 0), finished: num(h.finished, 0), byTopic });
      });
    }
    if (isObj(s.tut)) for (const [id, t] of Object.entries(s.tut)) {
      if (!key(id) || !isObj(t)) continue;
      const res = {};
      if (isObj(t.res)) for (const [k, rr] of Object.entries(t.res)) if (key(k)) res[k] = cleanParts(rr);
      out.tut[id] = { batches: Array.isArray(t.batches) ? t.batches.slice(0, 200).map((b) => (typeof b === 'string' && key(b) ? b : '')) : [], res };
    }
    if (isObj(s.flash)) for (const [id, m] of Object.entries(s.flash)) {
      if (!key(id) || !isObj(m)) continue;
      const o = {};
      for (const [i, v] of Object.entries(m)) if (/^\d{1,3}$/.test(i) && (v === 0 || v === 1)) o[i] = v;
      out.flash[id] = o;
    }
    if (isObj(s.drafts)) for (const [k, v] of Object.entries(s.drafts)) { const c = key(k) && cleanInput(v); if (c) out.drafts[k] = c; }
    // the grapher: up to 8 functions (text, a preset color name or #rrggbb, shown or hidden) and a window
    if (isObj(s.grapher)) {
      const g = s.grapher, o = { fns: [], win: {} };
      if (Array.isArray(g.fns)) g.fns.slice(0, 8).forEach((f) => {
        if (!isObj(f)) return;
        const color = typeof f.color === 'string' && /^([a-z]{3,10}|#[0-9a-fA-F]{6})$/.test(f.color) ? f.color : 'blue';
        o.fns.push({ src: str(f.src).slice(0, 300), color, show: f.show !== false });
      });
      if (isObj(g.win)) for (const k of ['xmin', 'xmax', 'ymin', 'ymax', 'xstep', 'ystep']) { const v = num(g.win[k], NaN); if (isFinite(v) && Math.abs(v) < 1e7) o.win[k] = v; }
      if (g.mode === 'draw' || g.mode === 'graph') o.mode = g.mode;
      out.grapher = o;
    }
    return out;
  }

  const Store = {
    state: null,
    ref: null,
    remoteStatus: 'local', // 'local' | 'synced' | 'error'
    listeners: [],
    fresh() {
      return { v: 1, exam: null, history: [], tut: {}, flash: {}, drafts: {}, updated: 0 };
    },
    loadLocal() {
      try {
        const raw = G.localStorage && G.localStorage.getItem(KEY);
        if (raw) {
          const s = sanitize(JSON.parse(raw));
          if (s) return s;
        }
      } catch (e) { /* storage blocked */ }
      return null;
    },
    init() {
      this.state = this.loadLocal() || this.fresh();
      this.connect();
      return this.state;
    },
    async connect() {
      try {
        const c = G.claude;
        if (!c || typeof c.use !== 'function') return;
        const [db, user] = await Promise.all([c.use('db'), c.use('user')]);
        if (!db || !user) return;
        const uid = await user.id();
        if (!uid) return;
        this.ref = db.doc('data/users/' + uid + '/state');
        const snap = await this.ref.get();
        const remote = snap.exists ? sanitize(snap.data()) : null;
        if (remote && remote.v === 1 && (remote.updated || 0) > (this.state.updated || 0)) {
          this.state = remote;
          this.writeLocal();
          this.remoteStatus = 'synced';
          this.listeners.forEach((f) => f('remote'));
        } else {
          this.remoteStatus = 'synced';
          if ((this.state.updated || 0) > ((remote && remote.updated) || 0)) this.flushRemote();
          this.listeners.forEach((f) => f('status'));
        }
      } catch (e) {
        this.remoteStatus = 'error';
        this.ref = null;
        this.listeners.forEach((f) => f('status'));
      }
    },
    on(fn) { this.listeners.push(fn); },
    writeLocal() {
      try { G.localStorage && G.localStorage.setItem(KEY, JSON.stringify(this.state)); } catch (e) { /* ignore */ }
    },
    _timer: null, _writing: false, _again: false,
    save() {
      this.state.updated = Date.now();
      this.writeLocal();
      clearTimeout(this._timer);
      this._timer = setTimeout(() => this.flushRemote(), 900);
    },
    async flushRemote() {
      if (!this.ref) return;
      if (this._writing) { this._again = true; return; }
      this._writing = true;
      try {
        await this.ref.set(JSON.parse(JSON.stringify(this.state)));
        this.remoteStatus = 'synced';
      } catch (e) {
        this.remoteStatus = e && (e.code === 'invalid_argument' || e.code === 'revoked' || e.code === 'not_granted') ? 'local' : 'error';
        if (this.remoteStatus === 'local') this.ref = null;
      }
      this._writing = false;
      this.listeners.forEach((f) => f('status'));
      if (this._again) { this._again = false; this.flushRemote(); }
    },
    reset() {
      this.state = this.fresh();
      this.save();
    },
  };
  Store.sanitize = sanitize;
  MX.Store = Store;
})(typeof window !== 'undefined' ? window : globalThis);

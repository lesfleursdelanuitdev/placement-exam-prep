/* store.js: keeps progress across sessions.
   - Always mirrors to localStorage (works anywhere, per browser).
   - When the page runs as a Claude artifact with the db + user capabilities, it also saves a private
     per-user document at data/users/<id>/state, so progress follows the person across devices. */
(function (G) {
  'use strict';
  const MX = G.MX;
  const KEY = 'm098-prep-state-v1';
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
          const s = JSON.parse(raw);
          if (s && s.v === 1) return s;
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
        const remote = snap.exists ? snap.data() : null;
        if (remote && remote.v === 1 && (remote.updated || 0) > (this.state.updated || 0)) {
          this.state = JSON.parse(JSON.stringify(remote));
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
  MX.Store = Store;
})(typeof window !== 'undefined' ? window : globalThis);

// A signed-in person's progress in the browser (NEXTJS-PLAN.md step 4, S4-1..S4-5). store.js stays
// the plain page's: this only decides whose progress the browser holds before it reads it
// (settleOwner), then plugs /api/progress into store.js's old account hooks (Store.ref.set, called
// by flushRemote after every save; the 'remote' event, on which the app reads everything again).
// A guest (who = null) gets the plain page's behaviour, plus sign-in links when the site's gate is
// in front (the layout says so; /_pammy/accounts says whether registering is on).
export const STATE_KEY = 'm098-prep-state-v1';
export const STOPWATCH_KEY = 'm098-stopwatch-v1';
// whose progress the browser holds: { a: account id, base: the server's `updated` it was last in step with }
// missing: a guest's
export const OWNER_KEY = 'm098-prep-owner';

const RETRY = [5000, 15000, 60000, 300000];

function storage(win) {
  try { return win.localStorage || null; } catch { return null; }
}
function readOwner(win) {
  try {
    const o = JSON.parse(storage(win)?.getItem(OWNER_KEY) || 'null');
    return o && Number.isSafeInteger(o.a) ? { a: o.a, base: Number.isFinite(o.base) ? o.base : null } : null;
  } catch { return null; }
}
function writeOwner(win, a, base) {
  try { storage(win)?.setItem(OWNER_KEY, JSON.stringify({ a, base })); } catch { /* storage blocked */ }
}
function clearBrowser(win) {
  try { for (const k of [STATE_KEY, STOPWATCH_KEY, OWNER_KEY]) storage(win)?.removeItem(k); } catch { /* storage blocked */ }
}

/**
 * Before store.js and the stopwatch read the browser (S4-2): an account's progress is cleared for a
 * guest (signing out clears, Q2) and for a different account.
 */
export function settleOwner(win, who) {
  const o = readOwner(win);
  if (o && (!who || o.a !== who.account)) clearBrowser(win);
}

/** Anything worth keeping: an answer, a finished exam, practice, a card mark, a draft. */
export function hasWork(s) {
  if (!s) return false;
  if (s.exam && (s.exam.finished || Object.keys(s.exam.res || {}).length)) return true;
  if ((s.history || []).length || Object.keys(s.drafts || {}).length) return true;
  if (Object.values(s.tut || {}).some((t) => (t.batches || []).length || Object.keys(t.res || {}).length)) return true;
  return Object.values(s.flash || {}).some((m) => Object.keys(m || {}).length);
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/**
 * who: { account, username, del } from the layout (the gate's headers), or null for a guest;
 * gatePresent: the site's gate is in front (only then does a guest get sign-in links).
 * The app gets it as `account` (status and reset words); start(app) runs after app.boot().
 */
export function createAccount(win, who, gatePresent = false) {
  const d = win.document;
  const listeners = new Set();
  let Store = null, app = null;
  // guest | loading | asking | synced | pending | local
  let state = who ? 'loading' : 'guest';
  let gate = null; // what /_pammy/accounts says (a guest's links); null: no gate here
  let importNext = false, tries = 0, retryTimer = null;

  const here = () => win.location.pathname + win.location.search;
  const signInHref = () => `/_pammy/login?${new URLSearchParams({ next: here() })}`;
  const registerHref = () => `/_pammy/register?${new URLSearchParams({ next: here() })}`;

  // what the page says (S4-5): plain data for the chrome, HTML for the Progress page
  function snapshot() {
    if (!who) {
      const links = gate ? [{ href: signInHref(), text: 'Sign in' }, ...(gate.register ? [{ href: registerHref(), text: 'Make an account' }] : [])] : [];
      return { state, text: gate ? 'Saved in this browser. Sign in to keep your progress on every device.' : 'Saved in this browser.', links, signOut: false, username: null };
    }
    const text = {
      loading: 'Opening your account’s progress…',
      asking: 'Saved in this browser until you choose.',
      synced: 'Saved to your account.',
      pending: 'Saved in this browser. Not sent to your account yet: it will be.',
      local: 'Saved in this browser only. Your account didn’t take it: sign in again.',
    }[state];
    return { state, text, links: [{ href: '/_pammy/account', text: 'Your account' }], signOut: true, username: who.username };
  }
  function statusHtml() {
    const s = snapshot();
    const who_ = s.username ? `<span class="acct-who">Signed in as <b>${esc(s.username)}</b>.</span> ` : '';
    const links = s.links.map((l) => `<a href="${esc(l.href)}">${esc(l.text)}</a>`);
    if (s.signOut) links.push('<button type="button" class="linkish" data-act="sign-out">Sign out</button>');
    return `${who_}<span class="acct-text">${esc(s.text)}</span>${links.length ? ` <span class="acct-links">${links.join(' · ')}</span>` : ''}`;
  }
  function changed() {
    const el = d.getElementById('save-status');
    if (el) el.innerHTML = statusHtml();
    const s = snapshot();
    listeners.forEach((f) => f(s));
  }
  function set(next) { if (state !== next) { state = next; changed(); } }

  // ------------------------------------------------------------ the server
  async function call(method, body) {
    const r = await win.fetch('/api/progress', {
      method, credentials: 'same-origin', cache: 'no-store',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try { data = await r.json(); } catch { /* no body */ }
    return { status: r.status, data };
  }
  const revoked = () => Object.assign(new Error('revoked'), { code: 'revoked' });

  function retryLater(f) {
    win.clearTimeout(retryTimer);
    retryTimer = win.setTimeout(f, RETRY[Math.min(tries, RETRY.length - 1)]);
    tries++;
  }

  // the server's copy becomes the page's
  function take(doc) {
    const s = (doc && Store.sanitize(doc)) || Store.fresh();
    Store.state = s;
    Store.writeLocal();
    writeOwner(win, who.account, s.updated || 0);
    Store.listeners.forEach((f) => f('remote'));
  }

  // store.js's account copy (flushRemote calls ref.set after every save)
  const ref = {
    async set(doc) {
      // newer than the account's copy this browser last saw, whatever this device's clock says:
      // otherwise a device whose clock is behind has every save refused as older (409)
      const o = readOwner(win);
      if (o && o.a === who.account && o.base !== null && !((doc.updated || 0) > o.base)) {
        doc.updated = o.base + 1;
        if (Store.state) { Store.state.updated = doc.updated; Store.writeLocal(); }
      }
      let r;
      try {
        r = await call('PUT', { progress: doc, ...(importNext ? { import: true } : {}) });
      } catch {
        r = { status: 0 };
      }
      if (r.status === 200) {
        importNext = false;
        tries = 0;
        win.clearTimeout(retryTimer);
        writeOwner(win, who.account, r.data?.progress?.updated ?? doc.updated ?? 0);
        set('synced');
        return;
      }
      if (r.status === 409) { // another device saved something newer: that one it is
        tries = 0;
        take(r.data?.progress ?? null);
        set('synced');
        return;
      }
      if (r.status === 401 || r.status === 403) { set('local'); throw revoked(); }
      if (r.status === 400 || r.status === 413 || r.status === 415) { set('local'); throw Object.assign(new Error('refused'), { code: 'invalid_argument' }); }
      set('pending');
      retryLater(() => Store.flushRemote());
      throw new Error(`progress: ${r.status || 'unreachable'}`);
    },
  };

  // saving from now on goes to the account too
  function connect() {
    Store.ref = ref;
    Store.remoteStatus = 'synced';
  }
  // the page's progress goes up now (flushRemote sends Store.state)
  // bump: the account's `updated`, which this must be newer than (another device's clock may be ahead)
  function push({ bump = null, asImport = false } = {}) {
    connect();
    if (asImport) importNext = true;
    if (bump !== null) Store.state.updated = Math.max(Date.now(), bump + 1); // or the server refuses it as older
    Store.writeLocal();
    return Store.flushRemote();
  }

  // ------------------------------------------------------------ opening (S4-2, S4-3)
  async function open() {
    let r;
    try { r = await call('GET'); } catch { r = { status: 0 }; }
    if (r.status === 401 || r.status === 403) { set('local'); return; }
    if (r.status !== 200 || !r.data) { set('pending'); retryLater(open); return; }
    tries = 0;
    const kept = r.data; // { progress, importedAt }
    const server = kept.progress;
    const serverUpdated = server ? server.updated || 0 : 0;
    const local = Store.state;
    const owner = readOwner(win);

    if (owner && owner.a === who.account) {
      // the browser holds this account's: work saved here while the server couldn't be reached
      // goes up, but only if nothing changed there since (S4-2)
      if (owner.base === serverUpdated && (local.updated || 0) > serverUpdated) { set('synced'); await push(); return; }
      connect();
      if (!server) { take(null); set('synced'); return; } // reset or deleted elsewhere
      if ((local.updated || 0) !== serverUpdated) take(server);
      else writeOwner(win, who.account, serverUpdated);
      set('synced');
      return;
    }
    // a guest's copy (or nothing) in this browser
    if (!hasWork(local)) {
      if (server) { connect(); take(server); set('synced'); }
      else { set('synced'); await push({ asImport: true }); }
      return;
    }
    set('asking');
    const first = !kept.importedAt && !hasWork(server);
    const choice = await ask(first);
    if (choice === null) { set('asking'); return; } // closed: asked again on the next page load
    if (choice === 'browser') { set('synced'); await push({ bump: serverUpdated, asImport: true }); return; }
    // the account's (or, the first time, a fresh start)
    connect();
    if (first) {
      take(null); // a fresh start: the app starts a new exam on it
      await push({ asImport: true }); // and the account is marked imported
    } else {
      take(server);
    }
    set('synced');
  }

  // ------------------------------------------------------------ the question (S4-3)
  function ask(first) {
    return new Promise((resolve) => {
      const dlg = d.createElement('dialog');
      dlg.className = 'acct-dialog';
      dlg.setAttribute('aria-labelledby', 'acct-dialog-h');
      const h = d.createElement('h2');
      h.id = 'acct-dialog-h';
      const p = d.createElement('p');
      const row = d.createElement('div');
      row.className = 'acct-dialog-buttons';
      const button = (text, cls, value) => {
        const b = d.createElement('button');
        b.type = 'button';
        b.className = cls;
        b.textContent = text;
        b.addEventListener('click', () => { done = value; dlg.close(); });
        row.appendChild(b);
        return b;
      };
      let done = null;
      if (first) {
        h.textContent = 'Bring your progress into your account?';
        p.textContent = 'This browser has progress from before you signed in. Bring it into your account and it follows you to every device, or start fresh.';
        button('Bring it in', 'btn', 'browser');
        button('Start fresh', 'btn ghost', 'account');
      } else {
        h.textContent = 'Your account already has progress';
        p.textContent = 'This browser also has some from before you signed in. Keep your account’s, and the browser’s is dropped, or use this browser’s instead, and it replaces your account’s.';
        button('Keep my account’s', 'btn', 'account');
        button('Use this browser’s instead', 'btn ghost', 'browser');
      }
      dlg.append(h, p, row);
      dlg.addEventListener('close', () => { dlg.remove(); resolve(done); });
      d.body.appendChild(dlg);
      if (typeof dlg.showModal === 'function') dlg.showModal();
      else dlg.setAttribute('open', '');
      row.firstChild.focus();
    });
  }

  // ------------------------------------------------------------ signing out (S4-5)
  async function signOut() {
    try { if (Store.ref) await Store.flushRemote(); } catch { /* it stays for the next sign-in */ }
    let ok = false;
    try {
      const r = await win.fetch('/_pammy/logout', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page: win.location.pathname }),
      });
      ok = r.ok;
    } catch { /* offline */ }
    if (!ok) { app?.toast('Couldn’t sign out just now. Try again.'); return; }
    clearBrowser(win);
    win.location.reload();
  }

  async function probeGate() {
    try {
      const r = await win.fetch('/_pammy/accounts', { credentials: 'same-origin' });
      const a = r.ok && /json/.test(r.headers.get('content-type') || '') ? await r.json() : null;
      if (a && typeof a === 'object') { gate = { register: a.register === true }; changed(); }
    } catch { /* no gate: guest-only as the plain page */ }
  }

  return {
    who,
    statusHtml,
    snapshot,
    // Reset's warning, signed in (S4-5)
    resetNote: who ? ' It goes from your account too, on every device.' : '',
    subscribe(f) { listeners.add(f); f(snapshot()); return () => listeners.delete(f); },
    start(theApp) {
      app = theApp;
      Store = theApp.Store;
      d.addEventListener('click', (e) => {
        const b = e.target.closest && e.target.closest('[data-act="sign-out"]');
        if (b) { e.preventDefault(); signOut(); }
      });
      if (!who) { if (gatePresent) probeGate(); return; }
      win.addEventListener('online', () => { if (Store.ref) Store.flushRemote(); else if (state === 'pending') open(); });
      changed();
      open();
    },
  };
}

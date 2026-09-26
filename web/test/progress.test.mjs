// Signed-in progress (NEXTJS-PLAN.md S3-1 to S3-7): the built server against a real Postgres made
// the way lfdln-appdb makes exam prep's (test/pg.mjs). The headers here are what nginx would set;
// that a client's own never get through is test/nginx-headers (the real nginx in front).
//   node --test test/progress.test.mjs     (after build.sh; EXAMPREP_RELEASE=dir to test another)
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { startPg } from './pg.mjs';
import { migrate, migrationFiles, MigrationRefused } from '../db/migrate.mjs';
import { sanitize } from '../engine/store.mjs';

const release = process.env.EXAMPREP_RELEASE || fileURLToPath(new URL('../release', import.meta.url));
const STUDENT = 'pages.read questions.read attempts.create:own attempts.read:own attempts.update:own attempts.submit:own progress.read:own progress.update:own progress.delete:own';
const GUEST = 'pages.read questions.read attempts.create:own attempts.read:own attempts.update:own attempts.submit:own';
let pg, server, base, host;

const freePort = () => new Promise((res, rej) => {
  const s = createServer().listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => res(port)); }).on('error', rej);
});

before(async () => {
  assert.ok(existsSync(join(release, 'server.js')), `no build in ${release}: run build.sh first`);
  pg = await startPg();
  const port = await freePort();
  host = `127.0.0.1:${port}`;
  base = `http://${host}`;
  server = spawn(process.execPath, ['server.js'], {
    cwd: release,
    env: { ...process.env, ...pg.env, PORT: String(port), HOSTNAME: '127.0.0.1', NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  server.stdout.on('data', (d) => { log += d; });
  server.stderr.on('data', (d) => { log += d; });
  for (let i = 0; i < 100; i++) {
    try { await fetch(base + '/api/health'); return; } catch { await new Promise((r) => setTimeout(r, 100)); }
    if (server.exitCode !== null) break;
  }
  throw new Error('the server did not start:\n' + log);
});
after(async () => {
  server?.kill();
  await pg?.stop();
});

// a request as nginx passes it on: who (or nobody), and a page of this site
function call(method, { account = '7', username = 'jo', privileges = STUDENT, origin = base, body, type = 'application/json' } = {}) {
  const headers = { 'x-lfdln-account': account, 'x-lfdln-username': username, 'x-lfdln-privileges': privileges, 'x-lfdln-role': 'Student' };
  if (origin) headers.origin = origin;
  if (body !== undefined) headers['content-type'] = type;
  return fetch(base + '/api/progress', { method, headers, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body) })
    .then(async (r) => ({ status: r.status, headers: r.headers, json: await r.json().catch(() => null) }));
}

// a document the way the page makes one: an exam under way, history, tutorials, cards, drafts, the grapher
function doc(updated = Date.now()) {
  return {
    v: 1, updated,
    exam: { no: 3, seed: 'abc-123', gv: 4, started: 1790000000000, finished: null, res: {
      'lin-eq#0': { 0: { ok: true, tries: 1, val: { value: '3x+2' } }, 1: { ok: false, msg: 'Check the sign.', tries: 2, val: { value: '-1', unit: 'cm' } } },
      'frac#1': { 0: { revealed: true, val: { choice: '2' } } },
      'skip#2': { 0: { skipped: true } },
    } },
    history: [
      { no: 1, earned: 18.5, total: 30, started: 1789000000000, finished: 1789000900000, byTopic: { 'lin-eq': [3, 4], frac: [1.5, 2] } },
      { no: 2, earned: 25, total: 30, started: 1789500000000, finished: 1789500600000, byTopic: {} },
    ],
    tut: {
      'w-motion': { batches: ['b1', 'b2', ''], res: { 'q#0': { 0: { ok: true, val: { values: ['1', '2'] } } } } },
      'factor': { batches: [], res: {} },
    },
    flash: { 'w-motion': { 0: 1, 3: 0 }, all: { 12: 1 } },
    drafts: { 'exam|lin-eq#0|1': { value: '-(1' }, 'tut|q#1|0': { value: '', unit: 'm' } },
    grapher: { fns: [{ src: 'x^2', color: 'red', show: true }, { src: 'sin(x)', color: '#12ab34', show: false }], win: { xmin: -10, xmax: 10 }, mode: 'draw' },
  };
}
// what the page would have after store.js cleaned it, less what reads as missing (rows.ts canonical)
function expected(d) {
  const p = sanitize(d);
  const drop = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => Object.keys(v).length));
  if (p.exam) p.exam.res = drop(p.exam.res);
  for (const t of Object.values(p.tut)) t.res = drop(t.res);
  p.flash = drop(p.flash);
  return p;
}

describe('the database', () => {
  test('the migrations ran once, as examprep_owner, and running them again does nothing', async () => {
    const owner = pg.as('owner', 1);
    assert.deepEqual(await migrate(owner), []);
    await owner.end();
    const files = migrationFiles().map((f) => f.name);
    const rows = await pg.super`SELECT name FROM public.schema_migrations ORDER BY name`;
    assert.deepEqual(rows.map((r) => r.name), files);
  });

  test('a migration changed after it ran is refused', async () => {
    const owner = pg.as('owner', 1);
    await pg.super`UPDATE public.schema_migrations SET checksum = 'x' WHERE name = '0001-progress.sql'`;
    try {
      await assert.rejects(migrate(owner), (e) => e instanceof MigrationRefused && /was changed after it ran/.test(e.message));
    } finally {
      await pg.super`UPDATE public.schema_migrations SET checksum = ${migrationFiles()[0].checksum} WHERE name = '0001-progress.sql'`;
      await owner.end();
    }
  });

  test('the app role reads and writes rows, and makes or drops nothing', async () => {
    const app = pg.as('app', 1);
    try {
      await app`SELECT count(*) FROM prep.accounts`;
      for (const q of ['CREATE TABLE prep.x (a int)', 'CREATE TABLE public.x (a int)', 'DROP TABLE prep.answers', 'ALTER TABLE prep.accounts ADD COLUMN x int',
        'TRUNCATE prep.accounts', 'DELETE FROM public.schema_migrations', 'CREATE SCHEMA x']) {
        await assert.rejects(app.unsafe(q), /permission denied|must be owner/, q);
      }
      const [{ statement_timeout: t }] = await app`SHOW statement_timeout`;
      assert.equal(t, '5s');
    } finally {
      await app.end();
    }
  });

  test('the health answer says the database is there, with this release\'s schema', async () => {
    const h = await (await fetch(base + '/api/health')).json();
    assert.equal(h.ok, true);
    assert.equal(h.db, 'ok');
    assert.equal(h.schema, migrationFiles().at(-1).name);
  });
});

describe('/api/progress', () => {
  test('a guest gets nothing and can save nothing: 401', async () => {
    for (const m of ['GET', 'PUT', 'DELETE']) {
      const r = await call(m, { account: '', username: '', privileges: GUEST, body: m === 'PUT' ? { progress: doc() } : undefined });
      assert.equal(r.status, 401, m);
      assert.equal(r.headers.get('cache-control'), 'no-store');
    }
  });

  test('signed in without the privilege: 403 (the app checks privileges, not the role)', async () => {
    assert.equal((await call('GET', { privileges: GUEST })).status, 403);
    assert.equal((await call('PUT', { privileges: 'progress.read:own', body: { progress: doc() } })).status, 403);
    assert.equal((await call('DELETE', { privileges: 'progress.read:own progress.update:own' })).status, 403);
    assert.equal((await call('GET', { account: 'abc' })).status, 401, 'an account id that is not one');
  });

  test('nothing kept yet: progress null', async () => {
    const r = await call('GET', { account: '101' });
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { progress: null, importedAt: null });
  });

  test('saved whole and given back as store.js cleaned it, the empty parts left out', async () => {
    const d = doc(1790000001000);
    const put = await call('PUT', { account: '102', body: { progress: d } });
    assert.equal(put.status, 200, JSON.stringify(put.json));
    assert.deepEqual(put.json.progress, expected(d));
    const got = await call('GET', { account: '102' });
    assert.deepEqual(got.json, { progress: expected(d), importedAt: null });
    // in the tables: a question, per topic, is a query
    const rows = await pg.super`SELECT h.no, t.topic, t.earned, t.total FROM prep.exam_topic_results t JOIN prep.exam_history h USING (account_id, pos) WHERE account_id = 102 ORDER BY h.no, t.topic`;
    assert.deepEqual(rows.map((r) => [r.no, r.topic, r.earned, r.total]), [[1, 'frac', 1.5, 2], [1, 'lin-eq', 3, 4]]);
    const [acc] = await pg.super`SELECT username FROM prep.accounts WHERE id = 102`;
    assert.equal(acc.username, 'jo');
  });

  test('replaced whole: what is gone from the document is gone from the tables', async () => {
    const d = doc(1790000002000);
    await call('PUT', { account: '103', body: { progress: d } });
    const smaller = { v: 1, updated: 1790000003000, exam: null, history: [], tut: {}, flash: {}, drafts: {} };
    const r = await call('PUT', { account: '103', body: { progress: smaller } });
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.progress, expected(smaller));
    const [{ n }] = await pg.super`SELECT (SELECT count(*) FROM prep.answers WHERE account_id = 103) + (SELECT count(*) FROM prep.exam_history WHERE account_id = 103)
      + (SELECT count(*) FROM prep.flashcard_marks WHERE account_id = 103) + (SELECT count(*) FROM prep.settings WHERE account_id = 103) AS n`;
    assert.equal(Number(n), 0);
  });

  test('anything store.js would drop is dropped here too', async () => {
    const d = doc(1790000004000);
    d.exam.res['bad key with spaces'] = { 0: { ok: true } };
    d.exam.res['lin-eq#0'][0].tries = -3;
    d.flash.all[12] = 7;
    d.history.push({ no: 0, earned: 1, total: 2 });
    d.grapher.fns[0].color = 'url(javascript:alert(1))';
    d.evil = '<script>';
    const r = await call('PUT', { account: '104', body: { progress: d } });
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.progress, expected(d));
    assert.equal(r.json.progress.exam.res['bad key with spaces'], undefined);
    assert.equal(r.json.progress.exam.res['lin-eq#0'][0].tries, 0);
    assert.equal(r.json.progress.grapher.fns[0].color, 'blue');
    assert.equal(r.json.progress.evil, undefined);
  });

  test('an older document than the one kept is refused with the kept one (another device saved since)', async () => {
    await call('PUT', { account: '105', body: { progress: doc(1790000010000) } });
    const r = await call('PUT', { account: '105', body: { progress: { ...doc(1790000005000), exam: null } } });
    assert.equal(r.status, 409);
    assert.equal(r.json.progress.updated, 1790000010000);
    assert.ok(r.json.progress.exam, 'the kept one, unchanged');
    assert.equal((await call('PUT', { account: '105', body: { progress: doc(1790000010000) } })).status, 200, 'the same time again is fine');
  });

  test('import: recorded once, at the first import', async () => {
    const a = await call('PUT', { account: '106', body: { progress: doc(1790000020000), import: true } });
    assert.match(a.json.importedAt, /^\d{4}-\d\d-\d\dT/);
    const b = await call('PUT', { account: '106', body: { progress: doc(1790000021000), import: true } });
    assert.equal(b.json.importedAt, a.json.importedAt);
    const c = await call('PUT', { account: '106', body: { progress: doc(1790000022000) } });
    assert.equal(c.json.importedAt, a.json.importedAt);
  });

  test('one account never sees another\'s', async () => {
    await call('PUT', { account: '107', username: 'al', body: { progress: doc(1790000030000) } });
    assert.deepEqual((await call('GET', { account: '108' })).json, { progress: null, importedAt: null });
    // an account id in the body means nothing
    await call('PUT', { account: '108', body: { progress: { ...doc(1790000031000), account: 107 }, account: 107 } });
    assert.equal((await call('GET', { account: '107' })).json.progress.updated, 1790000030000);
  });

  test('delete: everything kept for the account, and only it', async () => {
    await call('PUT', { account: '109', body: { progress: doc(1790000040000) } });
    await call('PUT', { account: '110', body: { progress: doc(1790000040000) } });
    const r = await call('DELETE', { account: '109' });
    assert.deepEqual(r.json, { deleted: true });
    assert.deepEqual((await call('GET', { account: '109' })).json, { progress: null, importedAt: null });
    const [{ n }] = await pg.super`SELECT count(*) AS n FROM prep.answers WHERE account_id = 109`;
    assert.equal(Number(n), 0);
    assert.ok((await call('GET', { account: '110' })).json.progress);
    assert.deepEqual((await call('DELETE', { account: '109' })).json, { deleted: false });
  });

  test('writes need this site\'s Origin and JSON', async () => {
    assert.equal((await call('PUT', { origin: 'https://evil.example', body: { progress: doc() } })).status, 403);
    assert.equal((await call('PUT', { origin: null, body: { progress: doc() } })).status, 403);
    assert.equal((await call('DELETE', { origin: 'https://evil.example' })).status, 403);
    assert.equal((await call('PUT', { body: JSON.stringify({ progress: doc() }), type: 'text/plain' })).status, 415);
  });

  test('not a progress document, not JSON, too big: refused, nothing kept', async () => {
    assert.equal((await call('PUT', { account: '111', body: { progress: { v: 2 } } })).status, 400);
    assert.equal((await call('PUT', { account: '111', body: '{"progress":' })).status, 400);
    const big = doc();
    big.drafts = Object.fromEntries(Array.from({ length: 700 }, (_, i) => [`k${i}`, { value: 'x'.repeat(1990) }]));
    assert.equal((await call('PUT', { account: '111', body: { progress: big } })).status, 413);
    assert.deepEqual((await call('GET', { account: '111' })).json, { progress: null, importedAt: null });
  });

  test('a large document goes in (more rows than one statement may carry)', async () => {
    const d = doc(1790000050000);
    for (let i = 0; i < 8000; i++) d.exam.res[`q${i}`] = { 0: { ok: i % 2 === 0 } };
    const r = await call('PUT', { account: '112', body: { progress: d } });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.deepEqual(r.json.progress, expected(d));
  });

  test('two saves at once for one account: one after the other, the newer one kept', async () => {
    const [a, b] = await Promise.all([
      call('PUT', { account: '113', body: { progress: doc(1790000060000) } }),
      call('PUT', { account: '113', body: { progress: { ...doc(1790000061000), history: [] } } }),
    ]);
    assert.ok([a.status, b.status].includes(200));
    const got = await call('GET', { account: '113' });
    assert.equal(got.json.progress.updated, 1790000061000);
    assert.deepEqual(got.json.progress.history, []);
  });
});

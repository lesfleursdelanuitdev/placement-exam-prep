// Exam prep's migrations (NEXTJS-PLAN.md S3-5), the panel's runner (panel/packages/core/src/
// pg-migrate.ts) for one folder: each file runs once, in its own transaction, recorded in
// public.schema_migrations with its checksum; files are appended, never edited or slotted in
// before the last one run. Only the installer runs them, as examprep_owner, inside the new image
// before it starts; the app only reads the list (lib/progress/db.ts).
//   node db/migrate.mjs            run what hasn't run (EXAMPREP_DB_* as the app, user
//                                  examprep_owner, password file /run/secrets/examprep-db-owner)
//   node db/migrate.mjs --status   say what has run and what would
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

export const MIGRATIONS_DIR = fileURLToPath(new URL('../migrations', import.meta.url));
const TABLE = 'public.schema_migrations';
const NAME_RE = /^\d{4}-[a-z0-9-]+\.sql$/;

export class MigrationRefused extends Error {}

export function migrationFiles(dir = MIGRATIONS_DIR) {
  const names = readdirSync(dir).filter((n) => n.endsWith('.sql')).sort();
  const bad = names.filter((n) => !NAME_RE.test(n));
  if (bad.length) throw new Error(`migration files must be named NNNN-name.sql: ${bad.join(', ')}`);
  return names.map((name) => {
    const sql = readFileSync(join(dir, name), 'utf8');
    return { name, checksum: createHash('sha256').update(sql).digest('hex'), sql };
  });
}

// one migrator at a time, whatever else is connected
const lock = (q) => q`SELECT pg_advisory_xact_lock(hashtext('examprep-migrate'))`;

function check(files, applied) {
  const byName = new Map(files.map((f) => [f.name, f]));
  for (const a of applied) {
    const f = byName.get(a.name);
    if (!f) throw new MigrationRefused(`the database has ${a.name}, which these files don't: they are older than the database`);
    if (f.checksum !== a.checksum) throw new MigrationRefused(`${a.name} was changed after it ran`);
  }
  const last = applied.reduce((m, a) => (a.name > m ? a.name : m), '');
  const done = new Set(applied.map((a) => a.name));
  const slotted = files.filter((f) => !done.has(f.name) && f.name < last);
  if (slotted.length) throw new MigrationRefused(`${slotted.map((f) => f.name).join(', ')} sort before ${last}, which already ran: add new migrations at the end`);
}

/** Runs what hasn't run; returns the names it ran. appRole: who may read the list. */
export async function migrate(sql, { dir = MIGRATIONS_DIR, appRole = 'examprep_app', log = () => {} } = {}) {
  const files = migrationFiles(dir);
  await sql.begin(async (q) => {
    await lock(q);
    await q.unsafe(`
      CREATE TABLE IF NOT EXISTS ${TABLE} (
        name       text PRIMARY KEY,
        checksum   text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      );
      REVOKE ALL ON ${TABLE} FROM PUBLIC;
      GRANT SELECT ON ${TABLE} TO ${appRole};
    `).simple();
  });
  check(files, await sql`SELECT name, checksum FROM ${sql(TABLE)} ORDER BY name`);
  const ran = [];
  for (const f of files) {
    const done = await sql.begin(async (q) => {
      await lock(q);
      const [row] = await q`SELECT checksum FROM ${q(TABLE)} WHERE name = ${f.name}`;
      if (row) {
        if (row.checksum !== f.checksum) throw new MigrationRefused(`${f.name} was changed after it ran`);
        return false;
      }
      await q`SET LOCAL lock_timeout = '10s'`;
      await q.unsafe(f.sql).simple();
      await q`INSERT INTO ${q(TABLE)} (name, checksum) VALUES (${f.name}, ${f.checksum})`;
      return true;
    });
    if (done) { ran.push(f.name); log(`ran ${f.name}`); }
  }
  return ran;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const env = process.env;
  const sql = postgres({
    host: env.EXAMPREP_DB_HOST ?? '10.0.2.2', port: Number(env.EXAMPREP_DB_PORT ?? 5436),
    database: env.EXAMPREP_DB_NAME ?? 'examprep', username: 'examprep_owner',
    password: readFileSync(env.EXAMPREP_DB_OWNER_PASSWORD_FILE ?? '/run/secrets/examprep-db-owner', 'utf8').trim(),
    max: 1, connect_timeout: 10, onnotice: () => {}, connection: { application_name: 'examprep-migrate' },
  });
  try {
    if (process.argv.includes('--status')) {
      const files = migrationFiles();
      const have = await sql`SELECT name FROM ${sql(TABLE)} ORDER BY name`.catch(() => []);
      const done = new Set(have.map((r) => r.name));
      for (const f of files) console.log(`${done.has(f.name) ? 'ran    ' : 'waiting'} ${f.name}`);
    } else {
      const ran = await migrate(sql, { log: (s) => console.log(s) });
      console.log(ran.length ? `ok: ${ran.length} migration(s) ran` : 'ok: already up to date');
    }
  } catch (e) {
    console.error(`FAIL ${e.message}`);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 2 });
  }
}

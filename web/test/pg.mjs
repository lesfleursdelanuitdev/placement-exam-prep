// A throwaway Postgres 17 for the progress tests (NEXTJS-PLAN.md S3-7), as the panel's
// test/pg-harness.ts: exam prep's roles and database made by the same SQL as lfdln-appdb
// (appdb-examprep.sql), then its migrations as examprep_owner.
//   EXAMPREP_TEST_PG=postgres://postgres:pw@127.0.0.1:5432/postgres   use that server (CI's service)
//   otherwise a podman container "examprep-pg-test-<pid>", removed by name at the end (never a prune)
import { execFileSync, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import postgres from 'postgres';
import { migrate } from '../db/migrate.mjs';

const IMAGE = 'docker.io/library/postgres:17';
const SETUP = new URL('./appdb-examprep.sql', import.meta.url);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function removeOrphans() {
  const r = spawnSync('podman', ['ps', '-a', '--format', '{{.Names}}', '--filter', 'name=^examprep-pg-test-[0-9]+$'], { encoding: 'utf8' });
  for (const n of (r.stdout || '').split('\n').filter(Boolean)) {
    const pid = Number(n.slice('examprep-pg-test-'.length));
    let alive = true;
    try { process.kill(pid, 0); } catch (e) { alive = e.code === 'EPERM'; }
    if (!alive) spawnSync('podman', ['rm', '-f', '-t', '1', '--ignore', n]);
  }
}

/**
 * Starts (or uses) the server, makes the roles and database, runs the migrations.
 * Returns { host, port, passwords: {owner, app}, dir (password files), as(role), super(), stop() }.
 */
export async function startPg() {
  let url = process.env.EXAMPREP_TEST_PG, name = null;
  if (!url) {
    removeOrphans();
    name = `examprep-pg-test-${process.pid}`;
    const pw = randomBytes(12).toString('hex');
    execFileSync('podman', ['run', '-d', '--rm', '--name', name, '-e', `POSTGRES_PASSWORD=${pw}`, '-p', '127.0.0.1::5432',
      '--tmpfs', '/var/lib/postgresql/data', IMAGE], { stdio: 'ignore' });
    const port = execFileSync('podman', ['port', name, '5432'], { encoding: 'utf8' }).trim().split(':').pop();
    url = `postgres://postgres:${pw}@127.0.0.1:${port}/postgres`;
  }
  const u = new URL(url);
  const env = { ...process.env, PGPASSWORD: decodeURIComponent(u.password), PGCONNECT_TIMEOUT: '3' };
  const psqlArgs = ['-X', '-v', 'ON_ERROR_STOP=1', '-qtA', '-h', u.hostname, '-p', u.port || '5432', '-U', decodeURIComponent(u.username), '-d', u.pathname.slice(1) || 'postgres'];
  // the image restarts once while it initialises: wait for a real answer, twice
  for (let i = 0, good = 0; ; i++) {
    const r = spawnSync('psql', [...psqlArgs, '-c', 'SELECT 1'], { env, encoding: 'utf8' });
    if (r.status === 0 && ++good === 2) break;
    if (i > 120) throw new Error(`Postgres didn't start: ${r.stderr}`);
    await sleep(500);
  }
  const passwords = { owner: randomBytes(12).toString('hex'), app: randomBytes(12).toString('hex') };
  const setup = `\\set examprep_owner_pw ${passwords.owner}\n\\set examprep_app_pw ${passwords.app}\n` + readFileSync(SETUP, 'utf8');
  execFileSync('psql', psqlArgs, { env, input: setup, stdio: ['pipe', 'ignore', 'inherit'] });

  const dir = mkdtempSync(join(tmpdir(), 'examprep-pg-'));
  writeFileSync(join(dir, 'owner'), passwords.owner);
  writeFileSync(join(dir, 'app'), passwords.app);
  const host = u.hostname, port = Number(u.port || 5432);
  const as = (role, max = 2) => postgres({ host, port, database: 'examprep', username: `examprep_${role}`, password: passwords[role], max, onnotice: () => {} });
  const owner = as('owner', 1);
  await migrate(owner);
  await owner.end();
  const superSql = postgres({ host, port, database: 'examprep', username: decodeURIComponent(u.username), password: decodeURIComponent(u.password), max: 1, onnotice: () => {} });
  return {
    host, port, passwords, dir, as, super: superSql,
    // for the app's server: where it is and its password file
    env: { EXAMPREP_DB_HOST: host, EXAMPREP_DB_PORT: String(port), EXAMPREP_DB_PASSWORD_FILE: join(dir, 'app') },
    async stop() {
      await superSql.end({ timeout: 1 }).catch(() => {});
      rmSync(dir, { recursive: true, force: true });
      if (name) spawnSync('podman', ['rm', '-f', '-t', '1', '--ignore', name]);
    },
  };
}

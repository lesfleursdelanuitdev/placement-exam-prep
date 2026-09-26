// Signed-in progress in a browser (NEXTJS-PLAN.md step 4, S4-6): one throwaway Postgres (test/pg.mjs,
// or CI's service via EXAMPREP_TEST_PG) and one built server using it, for the whole run. The gate
// isn't here: the tests set its headers themselves (context.setExtraHTTPHeaders), as nginx does.
// Global setup, so every worker shares them; E2E_ACCOUNTS_URL tells the tests where it is.
import { spawn, type ChildProcess } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { startPg } from '../pg.mjs';

const PORT = Number(process.env.E2E_ACCOUNTS_PORT || 4198);

export default async function setup() {
  // against a running server (E2E_BASE_URL) there is no database to give it: those tests skip
  if (process.env.E2E_BASE_URL) return async () => {};
  const release = process.env.EXAMPREP_RELEASE || fileURLToPath(new URL('../../release', import.meta.url));
  const pg = await startPg();
  const server: ChildProcess = spawn('node', ['server.js'], {
    cwd: release,
    env: { ...process.env, ...pg.env, PORT: String(PORT), HOSTNAME: '127.0.0.1', NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1' },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  const url = `http://127.0.0.1:${PORT}`;
  for (let i = 0; ; i++) {
    try { if ((await fetch(`${url}/api/health`)).ok) break; } catch { /* not yet */ }
    if (i > 150 || server.exitCode !== null) { server.kill(); await pg.stop(); throw new Error('the accounts test server did not start'); }
    await new Promise((r) => setTimeout(r, 200));
  }
  process.env.E2E_ACCOUNTS_URL = url;
  return async () => {
    server.kill();
    await pg.stop();
  };
}

// Runs the plain page's tests against the generated module (the same commands as `npm test` at the
// top of the repo, each with use-module.mjs preloaded). Extra arguments go to the seed counts:
//   node web/engine/test/run-existing.mjs            selftest 60, editor 20, security, grapher
//   node web/engine/test/run-existing.mjs --quick    selftest 8, editor 4 (for a fast check)
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const quick = process.argv.includes('--quick');
const runs = [
  ['test/selftest.mjs', quick ? '8' : '60'],
  ['test/editor.mjs', quick ? '4' : '20'],
  ['test/security.mjs'],
  ['test/grapher.mjs'],
];
for (const [file, ...args] of runs) {
  console.log(`--- ${file} ${args.join(' ')} (against web/engine/mx.mjs)`);
  const r = spawnSync(process.execPath, ['--import', join(here, 'use-module.mjs'), file, ...args], { cwd: root, stdio: 'inherit' });
  if (r.status !== 0) { console.error(`${file} failed (exit ${r.status})`); process.exit(1); }
}

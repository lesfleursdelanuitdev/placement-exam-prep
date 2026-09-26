// Preload for the plain page's tests (test/*.mjs): `node --import ./web/engine/test/use-module.mjs test/selftest.mjs`.
// Those tests read src/*.js and run each file in a vm context. With this loaded, the first engine
// file puts the whole generated module (web/engine/mx.mjs) into the context instead, and the other
// engine files are skipped, so the tests check the module the Next.js app ships. Files outside the
// module (editor.js, store.js) still run from src/ on top of it, as in the browser.
// A file whose text differs from what the module was built from stops the run: rebuild the module.
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { FILES, SOURCE_SHA256, installMX } from '../mx.mjs';

const inModule = new Set(FILES);
const realRun = vm.runInContext;
const loaded = new WeakSet();
let served = 0;

vm.runInContext = function (code, ctx, opts) {
  const name = String((opts && opts.filename) || '').replace(/^(.*\/)?src\//, '');
  if (!inModule.has(name)) return realRun.call(this, code, ctx, opts);
  if (createHash('sha256').update(String(code)).digest('hex') !== SOURCE_SHA256[name]) {
    console.error(`src/${name} changed since web/engine/mx.mjs was built: run node web/engine/build.mjs`);
    process.exit(2);
  }
  served++;
  if (!loaded.has(ctx)) { loaded.add(ctx); installMX(ctx); }
  return undefined;
};

process.on('exit', (code) => {
  if (!code && !served) { console.error('use-module.mjs: the test loaded no engine file through vm.runInContext'); process.exitCode = 3; }
  else if (!code) console.log(`  (engine from web/engine/mx.mjs: ${served} src/ files replaced)`);
});

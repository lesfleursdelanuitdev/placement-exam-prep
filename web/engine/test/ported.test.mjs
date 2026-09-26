// src/app.js and src/shell.html are carried over to the pages by hand (web/lib/app/app.mjs,
// web/components/chrome.tsx; NEXTJS-PLAN.md, B10). This fails when either changes upstream: carry
// the change over, add a line to PORTED.md, and record the file's new hash here.
// (src/styles.css needs none of this: engine/build.mjs makes the pages' stylesheet from it.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const CARRIED_OVER = {
  'src/app.js': '709bb4a495d894f48152362fda27e39ee1200ef36fda2f3ddad97abe01546184',
  'src/shell.html': '0b5bf6b1339d4fc692313d40fe4246811b3bc672c7a2f34ccc2f65fd95247782',
};

for (const [file, want] of Object.entries(CARRIED_OVER)) {
  test(`${file} is carried over as it is now`, () => {
    const text = readFileSync(fileURLToPath(new URL('../../../' + file, import.meta.url)));
    const have = createHash('sha256').update(text).digest('hex');
    assert.equal(have, want, `${file} changed since it was carried over to the pages: carry the change over, note it in PORTED.md, and record ${have} in web/engine/test/ported.test.mjs`);
  });
}

#!/usr/bin/env bash
# Build a release of the Next.js exam prep, as momolig (no sudo) (NEXTJS-PLAN.md, Hosting):
# the engine module and its tests, typecheck, the unit tests, `next build`, then release/ (the
# standalone server with its static files), the tests of the built server, and the pages in a
# real browser (Playwright). release/BUILD ends with the 16-hex release id (a hash of release/'s
# files).
#   web/build.sh            refuses uncommitted changes
#   web/build.sh --dirty    builds them anyway, and says so in BUILD
#   web/build.sh --quick    fewer seeds in the engine tests (and says so in BUILD); not for a release
# Later steps add the container image (step 5) and, later, the database tests (step 3).
set -euo pipefail
cd "$(dirname "$(readlink -f "$0")")"
[[ $EUID -ne 0 ]] || { echo "run build.sh as yourself, without sudo" >&2; exit 1; }
node -e 'const [a,b]=process.versions.node.split(".").map(Number); if (a<22||(a===22&&b<18)) {console.error("needs node >= 22.18"); process.exit(1)}'
dirty=0 quick=0
for a in "$@"; do case $a in --dirty) dirty=1 ;; --quick) quick=1 ;; *) echo "unknown option $a" >&2; exit 1 ;; esac; done

# BUILD leads back to its source: the commit, checked before the tests, not after
commit=$(git rev-parse --short=12 HEAD)
if [[ -n $(git status --porcelain -- ..) ]]; then
  (( dirty )) || { git status --short -- .. >&2; echo "uncommitted changes (above): commit them first, or build with --dirty" >&2; exit 1; }
  commit="$commit+dirty"
fi
[[ -d node_modules ]] || npm ci --no-audit --no-fund
export NEXT_TELEMETRY_DISABLED=1

echo "--- engine module (../src -> engine/mx.mjs, browser.mjs, styles.css)"; node engine/build.mjs
echo "--- the plain page's tests, against the module"; node engine/test/run-existing.mjs $( (( quick )) && echo --quick )
echo "--- engine unit tests (the model matches app.js; an exam, lessons and cards on the server; app.js carried over)"
node --test --test-reporter=dot engine/test/*.test.mjs
echo "--- typecheck"; npx tsc --noEmit
echo "--- next build"; rm -rf .next; npx next build

echo "--- release"
rm -rf release && mkdir release
cp -a .next/standalone/. release/
cp -a .next/static release/.next/static
[[ ! -d public ]] || cp -a public release/public
echo "--- the built server (CSP, nonces, fonts from this site, headers)"
EXAMPREP_RELEASE="$PWD/release" node --test --test-reporter=dot test/*.test.mjs
echo "--- the pages in a browser (Playwright: desktop and 320 px)"
EXAMPREP_RELEASE="$PWD/release" npx playwright test

note="from commit $commit"; (( quick )) && note="$note, QUICK engine tests"
{ echo "built $(date -u +%FT%TZ) by $(id -un) $note (next $(node -p 'require("next/package.json").version'))"
  (cd release && find . -type f ! -name BUILD -print0 | sort -z | xargs -0 sha256sum | sha256sum | cut -c1-16); } > release/BUILD
echo "ok: release/ ($(du -sh release | cut -f1), $(tail -1 release/BUILD))"

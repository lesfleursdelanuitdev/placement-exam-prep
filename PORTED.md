# Carried over from the plain page

The Next.js app (`web/`, branch `nextjs`) follows the plain page's branch
(`claude/modest-gates-7cgiii`) until the switch (NEXTJS-PLAN.md, B10). `src/` and `test/` merge
as they are, and the engine module is rebuilt from them. What does not carry over by itself is
listed here, one line per upstream commit: changes to `src/app.js` (the pages, and the exam model
in `web/engine/model.mjs`), `src/styles.css` and `src/shell.html`.

`web/engine/test/model-parity.test.mjs` fails when app.js's exam model changes;
`web/engine/test/ported.test.mjs` fails when `src/app.js` or `src/shell.html` change at all (the
pages: `web/lib/app/app.mjs`, `web/components/chrome.tsx`), until the change is carried over and
the new hash recorded there; `web/engine/build.mjs` stops when `build.mjs` loads a file it hasn't
been told about. `src/styles.css` carries over by itself (`web/engine/styles.css` is made from it).

| Upstream commit | What | Carried over |
|---|---|---|
| 2c28f8e (branch point) | everything up to here | model: yes (step 1); pages, shell and styles: yes (step 2) |

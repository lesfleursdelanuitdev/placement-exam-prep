# Placement Exam Prep on Next.js and Postgres

Status: **decided 2026-09-25** by momolig: B1-B10, and every suggestion taken (Q1-Q8).
**Guest-only for now** (decided 2026-09-26, below). **Steps 1 and 2 built 2026-09-26** (see "Step 1:
as built" and "Step 2: as built" below). **Step 5 built 2026-09-26, not yet on the server** (see
"Step 5: as built": it waits for momolig's sudo and a small lfdln panel change). Steps 3-4 later. Follows the standards of the lesfleursdelanuit.com control panel
(repo `pammy-setup`, `panel/`), and, later, its accounts feature: `panel/docs/accounts-plan.md`.

What this is for: today the app is one 1.1 MB page (`node build.mjs` → `docs/index.html`) whose
"pages" are addresses after `#`, and progress lives only in the visitor's browser. It should be
**real pages** (each address its own page, served as HTML by the server), and people with an
account should have **their progress saved in a database** and follow them across devices.

## Decided (2026-09-25)

| # | Decision | By |
|---|---|---|
| B1 | **Next.js** (App Router), each part of the app its own page and address. | momolig |
| B2 | **Postgres**: a database `examprep` on lfdln's app database, `lfdln-appdb` (:5436). | momolig |
| B3 | **The panel's standards**: postgres.js with plain SQL (no ORM), numbered SQL migrations run by the installer, an owner role and an app role, secrets never in env files, Tailwind 4 + shadcn/ui, pinned versions, a strict CSP, `build.sh` → release id → installer → verify. | momolig |
| B4 | **Accounts are the panel's** (`accounts-plan.md`): the app never sees a password. nginx tells it who is signed in (`X-Lfdln-Account`). | momolig |
| B5 | **Guests can use everything**, saved in their browser as today. **Signed-in people also have their progress in Postgres.** | momolig |
| B6 | On first sign-in, the progress already in the browser is **brought into the account**. | momolig |
| B7 | **The browser grades, the server stores** (self-study: no server re-check of answers). | momolig |
| B8 | A deleted account's data is deleted here too (accounts-plan A9/Q1). | momolig |
| B9 | **Hosting: the first G9 project, set up by hand**, laid out the way platform plan G9 says so phase 8b can take it over. | momolig |
| B10 | **Ported alongside** the other session's work on the plain page; its commits are merged in as they come. | momolig |

## Guest-only for now (decided 2026-09-26)

momolig: the lesfleursdelanuit.com panel is still being developed, so exam prep goes live
**guest-only**: progress is kept in the browser only, as today. No sign-in, no Postgres, no
identity headers. The signed-in half of B5, and B2, B4, B6 and B8, wait until the panel's
accounts (`accounts-plan.md`) are live; steps 3 and 4 are **later**, not dropped. Step 5 deploys a
guest-only container (no database, no open area), and step 6 switches the host with no open area.
Until then the pages say nothing about accounts ("Saved in this browser.").

## What there is today (checked 2026-09-25, commit 2c28f8e)

- `src/`: ~7,600 lines of plain JavaScript in IIFEs sharing one namespace (`G.MX`), plus
  `src/topics/` (17 files, 744 KB): the generators. `build.mjs` joins them in a fixed order into one
  page. No npm packages.
- **What needs a browser**: `app.js` (1,282 lines: every page, the router, the menu), `editor.js`
  (the math answer box), `grapher.js`, `stopwatch.js`, `store.js` (localStorage), and a little of
  `plot.js`. **Everything else runs in Node as it is**: the RNG, fractions, texmath, parse, check,
  verify, svg, helpers, every topic, the flashcards. So lessons, worked examples, questions and
  cards can be made on the server.
- `store.js` keeps one document `{exam, history, tut, flash, drafts, grapher}` (plus the stopwatch)
  and **cleans it on every load** (`sanitize`): the same cleaning is wanted on the server.
- Tests: `test/selftest.mjs`, `editor.mjs`, `security.mjs`, `grapher.mjs`, `fuzz.mjs`; CI in
  `.github/workflows/test.yml`.
- Live: `examprep.lesfleursdelanuit.com` is an lfdln **site folder**
  (`/var/www/lesfleursdelanuit-sub/examprep`), updated by `~/lesfleursdelanuit-setup/deploy-examprep.sh`.
- Another Claude session is still adding features to the plain page (a commit every few minutes on
  `claude/modest-gates-7cgiii`).

## Proposal

### Layout of the repo (branch `nextjs`)

- **`src/` and `test/` stay as they are.** The engine keeps its IIFE shape, line for line, so the
  other session's commits merge in without conflicts (B10). A small step (`web/engine/build.mjs`)
  joins the browser-free files, in `build.mjs`'s order, into one module that exports `MX`, for the
  server and the client alike. `build.mjs` and `docs/index.html` stay until the switch (the way
  back).
- **`web/`**: the Next.js app (TypeScript strict, as the panel). `web/app/` the pages,
  `web/components/` (shadcn), `web/lib/` (db, account, progress), `web/migrations/`, `web/test/`.
- **What is rewritten**: `app.js` (the pages and router become Next.js pages and React
  components), `styles.css` (Tailwind, keeping the look), `store.js` (browser + server).
  **What is wrapped, not rewritten**: `editor.js`, `grapher.js`, `stopwatch.js` become client
  components that mount the existing code into a `ref` (their logic is the other session's
  most active area; wrapping keeps merges cheap).

### Pages (every one a real address, served as HTML)

| Address | Made on | What |
|---|---|---|
| `/` | server | home: the three choices, progress snapshot (from the browser; signed in, later: from the database) |
| `/exam` | server + client | overview: score, Start/Continue, each part |
| `/exam/part-1` … `/part-3` | client (questions from the server-made exam) | one part per page |
| `/exam/results` | server + client | after finishing |
| `/tutorials` | server | the list by section |
| `/tutorials/[topic]` | server | the lesson |
| `/tutorials/[topic]/examples` | server | the six worked examples |
| `/tutorials/[topic]/practice` | client | exercises with the answer box |
| `/flashcards`, `/flashcards/[topic]`, `/section/[name]`, `/all`, `/review` | server + client | decks; flipping and marks are client |
| `/grapher`, `/grapher/draw` | client | the grapher |
| `/progress` | server + client | history and per-topic accuracy |
| `/account` | → the panel's `/_pammy/account` | **later** (with accounts): sign in, register and account are the panel's pages (`?next=` back) |

- Lessons, examples and cards are the same for everyone (tutorials are fixed), so those pages are
  **built once and cached**. A page that needs the person reads `X-Lfdln-Account` on the server
  (later: while guest-only, the person's progress is only in the browser).
- **Old `#/…` links keep working**: a tiny script on `/` sends `#/tutorials/x` to `/tutorials/x`.
- Titles, focus on the heading and scroll memory per page, as the plain page has them now.

### Data (Postgres, `examprep` on :5436)

- Roles as the panel's and as G8/M4: **`examprep_owner`** owns the database and schema `prep` and
  runs migrations (only the installer uses it); **`examprep_app`** has SELECT/INSERT/UPDATE/DELETE on
  `prep` only, `statement_timeout` 5 s. PUBLIC gets no CONNECT; `pg_hba` names the database and both
  roles and ends in `reject`. ICU `de-DE`, Europe/Berlin, the appdb's nightly dumps. Passwords made
  by the install, root-only in `/etc/lfdln-appdb/`, given to the container as a podman secret file
  (not an env variable).
- **Tables** (Q1):
  - `accounts` (the gate's account id, username as last seen, first/last seen, `imported_at`)
  - `exams` (account, number, seed, generator version, started, finished)
  - `answers` (exam, question key, part, value, result, tries, revealed, skipped, updated)
  - `drafts` (account, key, value: unchecked answers as typed)
  - `exam_history` (account, exam number, earned, total, per-topic results as rows in
    `exam_topic_results`)
  - `tutorial_practice` (account, topic, batches, results)
  - `flashcard_marks` (account, deck, card, got-it or still-learning)
  - `settings` (account, grapher and stopwatch as `jsonb`, cleaned like `store.js` does)
- **Migrations**: `web/migrations/NNNN-name.sql`, appended, never edited; the runner is a copy of
  the panel's `pg-migrate.ts` (checksums, `schema_migrations`, advisory lock, one transaction each).
  Only the installer migrates; the app checks the version when it starts and refuses a schema it
  doesn't expect.
- **Access**: postgres.js, plain SQL, one pool; every query takes the account id from the header,
  never from the request body.

### Saving progress (B5, B6)

- **Guests**: `store.js` as now (browser only).
- **Signed in**: every save goes to the browser first (the page never waits), then to the server
  (`/api/progress/...`, same host, `Origin` checked, small JSON, cleaned on the server with the same
  rules as `sanitize`). If the server can't be reached, it's sent again later.
- **First sign-in** (the account has no `imported_at`): the browser's progress is offered for
  import ("Bring your progress into your account?"). After that **the database wins**: the page
  loads from it and the browser copy is only a cache.
- **Signing out** clears the browser's copy of that account's progress (Q2).
- **Account deleted** (accounts-plan Q1): `POST /_lfdln/account-deleted`, checked with the
  service's secret, deletes every row for that account.

### Security (the panel's rules)

- CSP `default-src 'none'`, scripts only from this site with a per-request nonce (Next.js
  `proxy.ts`), no inline scripts, `frame-ancestors 'none'`, HSTS, `no-referrer`. Fonts **served
  from this site** (next/font), so no Google Fonts request (Q5).
- Later, with accounts: the identity headers are trusted only because the server listens on 127.0.0.1 and nginx clears
  them from the client's request (accounts-plan). A test sends a forged header through the real
  nginx and must be ignored.
- Writes (later, step 3) need `Origin` of the site and a signed-in account; a guest's writes never
  reach the server. Guest-only, nothing is written on the server at all.

### Hosting (B9: the first G9 project, by hand)

- System user **`svc-lfdln-apps`** (lingering, rootless podman), the one G9 names for all projects.
- `/srv/lfdln-projects/examprep/` with `releases/<id>/` (the last 3 kept) and `logs/`.
- A **Quadlet container** `examprep.container`: `node:22` slim, the Next.js **standalone** build,
  published on **127.0.0.1:4101** (Q4), 512 MB, one CPU, health at `/api/health`. Guest-only: no
  database, so no `allow_host_loopback`; later, with step 3, it reaches :5436 at 10.0.2.2 (as
  TutorStar) and the health check covers the database and the schema version.
- **Build**: `build.sh` (as momolig, never sudo; refuses uncommitted changes): the engine tests,
  typecheck, unit tests, Playwright, `next build`, the image, `BUILD` with a 16-hex release id.
- **Install**: `deploy/install.sh` (sudo): the image to `svc-lfdln-apps`, migrations as
  `examprep_owner`, restart, health check, **verify**; a failed verify goes back to the previous
  release.
- The panel **adopts it as a service** (docs/adopt-plan.md: start, stop, restart, health), and the
  host `examprep.lesfleursdelanuit.com` switches **from the site folder to a route to 127.0.0.1:4101**
  (guest-only: no open area; the **"Open with accounts"** area comes with accounts).
- **The way back**: the site folder stays for 14 days; switching the route back to it brings the
  plain page back (guests' progress is still in their browsers).

### Keeping up with the other session (B10)

- `nextjs` merges `claude/modest-gates-7cgiii` often. `src/` and `test/` merge as they are;
  changes to `app.js` or `styles.css` are carried into the React pages by hand, and
  **`PORTED.md`** lists each upstream commit and whether it's carried over.
- **The switch** (step B6) is when the plain page stops getting features: from then on new work
  goes to `nextjs` (which becomes the main branch, Q7).

## Steps

| Step | What | Risk |
|---|---|---|
| 1 | **Engine as a module**: `web/engine/build.mjs`, the existing tests run against it too; a Node test makes a whole exam, every lesson and every card on the server. Next.js skeleton, Tailwind/shadcn, CSP, `build.sh`. | low |
| 2 | **Pages**: every address in the table, server-made where it says; editor, grapher, stopwatch wrapped. Playwright: each page opens directly (not only by clicking), has its title, works at 320 px; the old `#/` links forward. Guests only, browser storage. | medium: the biggest step |
| 3 | **Later** (after the panel's accounts are live). **Database**: the migrations, roles and grants on a local Postgres 17; `/api/progress/*`; the server-side cleaning; unit tests with a real Postgres (as `test/pg-harness.ts`). Signed-in tested with the header set by a test nginx. | medium |
| 4 | **Later**, with step 3. **Import and sync**: first sign-in import, database wins, offline retry, sign-out clears; the deletion hook. | medium |
| 5 | **On the server**, guest-only: `svc-lfdln-apps`, the container (no database), adopted as a service, a verify script. Tried on a test host (e.g. `examprep-next.lesfleursdelanuit.com`) first. The `examprep` database and roles on lfdln-appdb (`setup.sql`, `pg_hba`) come with step 3, later. | medium |
| 6 | **The switch**: the host's route to the service (no open area while guest-only); verify; the plain page stops getting features (Q7); the site folder kept 14 days. | medium: a live site |

### Step 1: as built (2026-09-26)

- `web/engine/build.mjs` reads the file order from `build.mjs` itself and writes `web/engine/mx.mjs`
  (generated, not committed): the engine files, the topics and the flashcards inside one function
  that takes the global as `window`, so each copy of the engine (`createMX()`) has its own namespace
  and nothing is put on the real global. A file `build.mjs` starts loading that isn't listed as
  engine or browser stops the build. `store.js` stays out for now (the plan lists it with the
  browser files); step 3 needs its `sanitize` on the server and can add it (it loads without a page).
- **The exam model was in `app.js`**, not in the browser-free files: the topic order, `soundGen`,
  `buildExam`, the worked examples and the practice problems. It is carried over as
  `web/engine/model.mjs`, and `web/engine/test/model-parity.test.mjs` runs app.js's own functions
  (pulled out of its source) beside it: same seed, same questions, so saved exams rebuild.
- **The existing tests run against the module**: `web/engine/test/run-existing.mjs` runs the
  `npm test` commands with a preload that hands them the generated module instead of `src/`
  (and stops if `src/` changed since the module was built). `test/` is untouched. (The selftest's
  filter by topic *file name* doesn't work that way, since the module is one file; by topic id does.)
- `web/engine/test/server.test.mjs`: a whole exam (102 questions), every lesson with its six worked
  examples and first practice problems, and all 424 flashcards, made and rendered in plain Node.
- Next.js 16.3.6, React 19.3.0, TypeScript 7.0.2 (as the panel; Next.js set `allowJs`),
  Tailwind 4.3.3, shadcn (new-york, `components/ui/button.tsx`), all pinned exactly.
- CSP in `web/proxy.ts`: a nonce per request with `'strict-dynamic'`, `default-src 'none'`,
  `style-src-attr 'unsafe-inline'` (the engine's HTML has a few style attributes), `font-src 'self'`,
  `frame-ancestors 'none'`; HSTS, `no-referrer`, `nosniff` on every response (`next.config.ts`).
  `web/test/server.test.mjs` starts the built server and checks them, the nonce on every script,
  and that nothing (fonts included) comes from another site.
- **A nonce means every page is made per request.** "Built once and cached" (Pages, above) can't
  be the HTML; in step 2 it is the engine's output (lessons, examples, cards) that is made once
  and kept, and the page around it is made per request.
- Fonts: `next/font/google` fetches IBM Plex and STIX Two **when the app is built**, and the site
  serves them; visitors never contact Google. The build machine needs to reach Google Fonts.
- `web/build.sh` (not at the top, where `build.mjs` is): engine tests, typecheck, `next build`,
  `web/release/` (standalone server + static files), the server tests, `BUILD` with a 16-hex id.
  Playwright comes with step 2, the database tests with step 3, the image with step 5.
- CI: `.github/workflows/web.yml` (its own file, so `test.yml` merges untouched).

### Step 2: as built (2026-09-26)

- **app.js is carried over as `web/lib/app/app.mjs`**: the same views, markup and classes, close to
  app.js line for line so upstream changes carry over by diff (B10), typed by `app.d.mts`.
  `createApp({ MX, model })` gives the HTML makers on the server; in the browser
  (`createApp({ ..., Store, win })`) it also drives the page (checking, drafts, decks, the menu), as
  app.js did. React owns the frame (`app/layout.tsx`, `components/chrome.tsx`: the bar, the phone
  menu, the stopwatch's place) and each page's container (`components/view.tsx`); inside, the HTML
  is the app's. The plan said "rewritten as React pages and components": the pages are Next.js
  pages, but the views stay HTML-making functions shared by the server and the browser, since the
  cards, answer boxes and grapher are DOM code that is wrapped anyway.
- **styles.css is kept as it is**, not rewritten in Tailwind: `engine/build.mjs` makes
  `web/engine/styles.css` from it (generated; the menus' `button` rules also match the links that
  replace them), and Tailwind's theme and utilities come after it without its reset, so the look
  is the plain page's and upstream style changes carry over by themselves. The fonts are pointed at
  next/font's. One fix of our own (`app/globals.css`): at 320 px the part links wrap (with the Plex
  font, "Part III: Linear equations & inequalities →" is wider than the screen on the plain page too).
- **Navigation is links.** The app follows links to this site through Next.js's router (no reload);
  what a link carries (`data-act`) is noted first, as app.js's buttons did: where "back" goes,
  which question to scroll to, where a deck returns to. Scroll memory and focus on the heading as
  before. The grapher's two modes and the "still learning" deck of all cards change the address
  without a new page (`history.replaceState`, which Next.js follows).
- **Made on the server**: every page's HTML, without the student's progress (it is in their
  browser, guest-only): lessons and worked examples in full (made once and kept,
  `lib/app/server.ts`), the tutorial and flashcard lists without counts, home without the exam's
  numbers, a deck with its first card. The browser fills in the rest. The exam pages come from the
  server as their frame; **the browser makes the questions from the exam's seed, as today**, since
  the seed is only in the browser ("questions from the server-made exam" waits for step 3).
- **The browser files are wrapped, unchanged**: `engine/build.mjs` also writes `web/engine/browser.mjs`
  (editor, store, grapher, stopwatch, generated), run on the window by `installBrowser(window)` once
  the engine is `window.MX`. `lib/app/runtime.mjs` loads all of it after the page is on screen
  (about 1 MB of script), once per page load. `MX.App` is kept, as app.js had it.
- **Guest progress**: `store.js` as it is, the same keys (`m098-prep-state-v1`, `m098-stopwatch-v1`)
  and format, so the switch keeps every student's progress (same host, same browser storage).
- **Addresses**: as the table (not `/account`: later). An unknown topic, deck, part or grapher mode
  goes to its list, as the plain page did; any other unknown address is a 404 page (the plain page
  went home). Old `#/…` links are forwarded from `/`. Each page's title comes from the server; the
  browser adds the exam's number ("Practice Exam No. 3").
- **Tests**: Playwright (`web/test/e2e`, `playwright.config.ts`), against the built release, at
  1280 px and 320 px: every address opens directly with its title and heading, without errors (a
  CSP refusal is one) or sideways scrolling; every topic's lesson, examples and practice and every
  deck from the server; the old `#/` links; moving by links without reloads, back to the question,
  the browser's back and forward, the phone menu, decks, the grapher's addresses; guest progress
  (answers, drafts, practice, marks, finishing, save and finish later, the stopwatch, reset) and
  **progress saved by the plain page opening here and the other way round**, with the same exam
  from the same seed. `engine/test/ported.test.mjs` fails when `src/app.js` or `src/shell.html`
  change upstream, until the change is carried over (PORTED.md). `build.sh` and CI run Playwright
  last.

### Step 5: as built (2026-09-26, not yet on the server)

- **What's built, all in `web/deploy/`**:
  - `Containerfile`: node 22 slim, pinned by digest, from `release/`. The code is owned by root, and the server runs as `node`.
  - `examprep.container`: the Quadlet unit, on 127.0.0.1:4101. The root filesystem is read-only, with Next.js's cache and `/tmp` in memory. It drops all capabilities, sets no-new-privileges, and limits memory to 512 MB, one CPU and 256 processes. The health check is `node /app/healthcheck.mjs`, which asks `/api/health` and kills the container on failure. `Restart=always`.
  - `install.sh` (sudo), described below.
  - `verify-examprep-next.sh` and `check-browser.mjs`: the checks listed below.
  - `README.md`: the runbook.
- **`/api/health`** is new. It returns `{ok, release}`, with the release read from `BUILD` in the image, and is never cached. `build.sh` now ends by building `localhost/examprep:<release id>`; `--no-image` skips that.
- **What `install.sh` does** (sudo, from the account that ran `build.sh`):
  - The first time only, it makes `svc-lfdln-apps`: a system user with no login and lingering, and the next free subuid/subgid range after every existing one. It also makes `/srv/lfdln-projects/examprep/{releases,logs}`.
  - It loads the image into that user's podman, tags it `prod`, and tags the one before `previous`.
  - It installs the unit, restarts it, and waits for `/api/health` to name this release. Then it runs verify.
  - Any failure puts `previous` back. It keeps the last 3 releases' `BUILD` files and images.
  - It touches no nginx, no panel and no other service.
- **What verify checks:**
  - As root: the unit is active and default.target wants it; the user lingers; the server runs as `svc-lfdln-apps`, not root; and it **restarts on its own** (the server process is killed, and it must answer again with a new start time).
  - Port 4101 listens only on 127.0.0.1, and `/api/health` names the expected release.
  - All 18 pages return 200 with a nonce CSP and `default-src 'none'`, HSTS, nosniff and no-referrer, and no X-Powered-By. No `src`/`href` goes to another site, and nothing mentions Google Fonts.
  - Every font the home page names comes from this site as `font/woff2`, and `/no-such-page` is the 404 page.
  - In Chromium: the old `#/` links forward, six pages send no request to other sites, and there are no console or CSP errors.
  - `--host <name>` runs the page checks again through nginx over https, plus the http→https redirect.
  - Playwright takes `E2E_BASE_URL=` to run the whole suite against a running server.
- **Tried here, as momolig:**
  - The image under the unit's own podman options: healthy, running as uid 1000.
  - Verify against it: 6/6, the browser checks included. Playwright against it: 62 passed.
  - The same unit under momolig's own systemd: the killed server was back in 3 s (NRestarts 1), default.target wants it, and it listened on 127.0.0.1 only. The test unit and container were removed afterwards.
- **Waiting on the lfdln panel (not done here; `pammy-setup` is being revised).**
  - A service route can only point at a service the panel has **adopted**. Adopting reads `KNOWN` in `panel/packages/services/src/known.ts`, a code change. It needs an entry `examprep` with user `svc-lfdln-apps` and one part `web` (unit `examprep`, port 4101, health `/api/health`, controls on, requires nothing), then an lfdln panel install (its step 6b adopts it).
  - That install must not carry the unfinished accounts work, so it should be built from what lfdln runs now plus that one change.
  - Then, on the panel's Hosts page: host `examprep-next`, with a route at `/` to the service examprep/web.
  - `examprep.lesfleursdelanuit.com` stays on its site folder until step 6.
- **Interpreted:**
  - The deploy files live in `web/deploy/` rather than a top-level `deploy/`, so the other session's part of the repo stays untouched.
  - The releases kept are images tagged by release id in `svc-lfdln-apps`'s podman, plus `releases/<id>/BUILD`, rather than copies of `release/`.

## Questions

- **Q1. Tables, not one JSON document per person.** Tables make "how is this student doing on
  factoring" a query later (e.g. for TutorStar tutors). One document would be quicker to build.
  Suggested: tables, as listed. **Decided: as suggested.**
- **Q2. Signing out clears the browser's copy** (a shared computer shows nothing of the last
  person). Suggested: yes; the guest starts fresh. **Decided: as suggested.**
- **Q3. Guests' progress on a new device**: none (browser only), and the page says "Sign in to keep
  your progress on every device". Suggested: yes. **Decided: as suggested.** (Guest-only for now:
  that line waits for accounts; until then the page says "Saved in this browser.")
- **Q4. Port 4101** (G9's range 4100-4999, the first project). Suggested: yes. **Decided: as suggested.**
- **Q5. Fonts served from this site** instead of Google Fonts (CSP, and no visitor data to Google).
  Suggested: yes. **Decided: as suggested.**
- **Q6. Next.js version**: the latest 16.x stable when step 1 starts, pinned exactly (platform plan:
  "always the latest stable"). Suggested: yes. **Decided: as suggested.**
- **Q7. After the switch, `nextjs` becomes the main branch** and the other session works there.
  Suggested: yes; momolig tells that session at the switch. **Decided: as suggested.**
- **Q8. Does TutorStar want to see a student's exam prep progress?** Not in this plan; the tables
  (Q1) leave the door open. Suggested: later, its own plan. **Decided: as suggested.**

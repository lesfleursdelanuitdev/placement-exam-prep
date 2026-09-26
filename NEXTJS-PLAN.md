# Placement Exam Prep on Next.js and Postgres

Status: **decided 2026-09-25** by momolig: B1-B10, and every suggestion taken (Q1-Q8).
**Guest-only for now** (decided 2026-09-26, below). **Step 1 built 2026-09-26** (see "Step 1: as
built" below); next: step 2. Follows the standards of the lesfleursdelanuit.com control panel
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

-- Progress for signed-in people (NEXTJS-PLAN.md, Data and S3-2): store.js's one document,
-- split into tables so it can be asked about later. Run by db/migrate.mjs as examprep_owner,
-- who owns the database and this schema; the app (examprep_app) only reads and writes rows.
-- Times are the page's own (milliseconds since 1970, as Date.now()), kept as the page sent
-- them: double precision, because store.js accepts any finite number.

CREATE SCHEMA prep;
REVOKE ALL ON SCHEMA prep FROM PUBLIC;
GRANT USAGE ON SCHEMA prep TO examprep_app;

-- one row per account the gate has sent (its id), made on the first save
CREATE TABLE prep.accounts (
  id           bigint PRIMARY KEY CHECK (id > 0),
  username     text NOT NULL,                    -- as last seen (X-Lfdln-Username)
  first_seen   timestamptz NOT NULL DEFAULT now(),
  last_seen    timestamptz NOT NULL DEFAULT now(),
  imported_at  timestamptz,                      -- the browser's progress brought in (step 4)
  updated      double precision NOT NULL DEFAULT 0  -- the document's own `updated`
);

-- the exam being taken (store.js keeps one)
CREATE TABLE prep.exams (
  account_id  bigint PRIMARY KEY REFERENCES prep.accounts ON DELETE CASCADE,
  no          integer NOT NULL CHECK (no >= 1),
  seed        text NOT NULL,
  gv          integer NOT NULL,                  -- the generator's version
  started     double precision NOT NULL,
  finished    double precision
);

-- every answer part: the exam's (topic '') and each tutorial's practice (topic = its id)
CREATE TABLE prep.answers (
  account_id  bigint NOT NULL REFERENCES prep.accounts ON DELETE CASCADE,
  topic       text NOT NULL,
  question    text NOT NULL,
  part        smallint NOT NULL,
  ok          boolean,
  revealed    boolean NOT NULL DEFAULT false,
  skipped     boolean NOT NULL DEFAULT false,
  msg         text,
  tries       integer,
  val         jsonb,                             -- the answer as typed (store.js cleanInput)
  PRIMARY KEY (account_id, topic, question, part)
);

-- the tutorials' practice batches, in order
CREATE TABLE prep.tutorial_practice (
  account_id  bigint NOT NULL REFERENCES prep.accounts ON DELETE CASCADE,
  topic       text NOT NULL,
  batches     text[] NOT NULL,
  PRIMARY KEY (account_id, topic)
);

-- answers typed and not yet checked
CREATE TABLE prep.drafts (
  account_id  bigint NOT NULL REFERENCES prep.accounts ON DELETE CASCADE,
  key         text NOT NULL,
  value       jsonb NOT NULL,
  PRIMARY KEY (account_id, key)
);

-- finished exams, oldest first (store.js keeps the last 60)
CREATE TABLE prep.exam_history (
  account_id  bigint NOT NULL REFERENCES prep.accounts ON DELETE CASCADE,
  pos         integer NOT NULL,
  no          integer NOT NULL,
  earned      double precision NOT NULL,
  total       double precision NOT NULL,
  started     double precision NOT NULL,
  finished    double precision NOT NULL,
  PRIMARY KEY (account_id, pos)
);
CREATE TABLE prep.exam_topic_results (
  account_id  bigint NOT NULL,
  pos         integer NOT NULL,
  topic       text NOT NULL,
  earned      double precision NOT NULL,
  total       double precision NOT NULL,
  PRIMARY KEY (account_id, pos, topic),
  FOREIGN KEY (account_id, pos) REFERENCES prep.exam_history ON DELETE CASCADE
);

-- flashcards: 1 got it, 0 still learning
CREATE TABLE prep.flashcard_marks (
  account_id  bigint NOT NULL REFERENCES prep.accounts ON DELETE CASCADE,
  deck        text NOT NULL,
  card        integer NOT NULL,
  mark        smallint NOT NULL CHECK (mark IN (0, 1)),
  PRIMARY KEY (account_id, deck, card)
);

-- the rest of the document (today the grapher), as store.js cleans it
CREATE TABLE prep.settings (
  account_id  bigint PRIMARY KEY REFERENCES prep.accounts ON DELETE CASCADE,
  grapher     jsonb
);

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA prep TO examprep_app;

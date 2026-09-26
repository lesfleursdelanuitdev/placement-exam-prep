// An account's progress in the tables (NEXTJS-PLAN.md S3-2, S3-4): read whole, replaced whole in
// one transaction. The account id always comes from nginx's header (who.ts), never the body.
import type postgres from 'postgres';
import type { Progress } from '@/engine/store.mjs';
import { fromRows, toRows, type Rows } from './rows';
import type { Sql } from './db';

type TxSql = postgres.TransactionSql;
// progress null: nothing kept for this account (it has never saved)
export type Kept = { progress: Progress | null; importedAt: string | null };

export async function load(sql: Sql | TxSql, account: number): Promise<Kept> {
  const [acc] = await sql<{ updated: number; imported_at: Date | null }[]>`SELECT updated, imported_at FROM prep.accounts WHERE id = ${account}`;
  if (!acc) return { progress: null, importedAt: null };
  const importedAt = acc.imported_at ? acc.imported_at.toISOString() : null;
  const [exam] = await sql<NonNullable<Rows["exam"]>[]>`SELECT no, seed, gv, started, finished FROM prep.exams WHERE account_id = ${account}`;
  const rows: Rows = {
    updated: acc.updated,
    exam: exam ?? null,
    answers: await sql<Rows['answers']>`SELECT topic, question, part, ok, revealed, skipped, msg, tries, val FROM prep.answers WHERE account_id = ${account}`,
    tutorials: await sql<Rows['tutorials']>`SELECT topic, batches FROM prep.tutorial_practice WHERE account_id = ${account}`,
    drafts: await sql<Rows['drafts']>`SELECT key, value FROM prep.drafts WHERE account_id = ${account}`,
    history: await sql<Rows['history']>`SELECT pos, no, earned, total, started, finished FROM prep.exam_history WHERE account_id = ${account} ORDER BY pos`,
    topicResults: await sql<Rows['topicResults']>`SELECT pos, topic, earned, total FROM prep.exam_topic_results WHERE account_id = ${account}`,
    marks: await sql<Rows['marks']>`SELECT deck, card, mark FROM prep.flashcard_marks WHERE account_id = ${account}`,
    grapher: (await sql<{ grapher: unknown }[]>`SELECT grapher FROM prep.settings WHERE account_id = ${account}`)[0]?.grapher ?? null,
  };
  return { progress: fromRows(rows), importedAt };
}

export type SaveAnswer = { ok: true; kept: Kept } | { ok: false; stale: Kept };

// postgres.js sends at most 65,534 parameters a statement: rows go in in slices
const SLICE = 2000;
async function insert(q: TxSql, table: string, rows: Record<string, unknown>[]) {
  for (let i = 0; i < rows.length; i += SLICE) {
    await q`INSERT INTO ${q(table)} ${q(rows.slice(i, i + SLICE) as Record<string, postgres.ParameterOrJSON<never>>[])}`;
  }
}

/**
 * Replaces the account's progress with `p` (canonical). Refused when what is kept is newer
 * (another device saved since): the caller gets that instead. `imported`: step 4's first-sign-in
 * import, which is recorded once.
 */
export async function save(sql: Sql, account: number, username: string, p: Progress, imported = false): Promise<SaveAnswer> {
  return sql.begin(async (q) => {
    await q`INSERT INTO prep.accounts (id, username) VALUES (${account}, ${username}) ON CONFLICT (id) DO NOTHING`;
    // one save per account at a time: the row lock orders them
    const [acc] = await q<{ updated: number }[]>`SELECT updated FROM prep.accounts WHERE id = ${account} FOR UPDATE`;
    if (p.updated < acc!.updated) return { ok: false as const, stale: await load(q, account) };
    await q`UPDATE prep.accounts SET username = ${username}, last_seen = now(), updated = ${p.updated},
              imported_at = CASE WHEN ${imported} THEN coalesce(imported_at, now()) ELSE imported_at END
            WHERE id = ${account}`;
    for (const t of ['prep.exams', 'prep.answers', 'prep.tutorial_practice', 'prep.drafts', 'prep.exam_history', 'prep.flashcard_marks', 'prep.settings']) {
      await q`DELETE FROM ${q(t)} WHERE account_id = ${account}`;
    }
    const r = toRows(p);
    const withAccount = <T extends object>(rows: T[]) => rows.map((x) => ({ account_id: account, ...x }));
    if (r.exam) await insert(q, 'prep.exams', withAccount([r.exam]));
    await insert(q, 'prep.answers', withAccount(r.answers).map((a) => ({ ...a, val: a.val === null ? null : q.json(a.val as postgres.JSONValue) })));
    await insert(q, 'prep.tutorial_practice', withAccount(r.tutorials));
    await insert(q, 'prep.drafts', withAccount(r.drafts).map((d) => ({ ...d, value: q.json(d.value as postgres.JSONValue) })));
    await insert(q, 'prep.exam_history', withAccount(r.history));
    await insert(q, 'prep.exam_topic_results', withAccount(r.topicResults));
    await insert(q, 'prep.flashcard_marks', withAccount(r.marks));
    if (r.grapher !== null) await insert(q, 'prep.settings', withAccount([{ grapher: q.json(r.grapher as postgres.JSONValue) }]));
    return { ok: true as const, kept: await load(q, account) };
  }) as Promise<SaveAnswer>;
}

/** Everything kept for the account, the account row too. */
export async function forget(sql: Sql, account: number): Promise<boolean> {
  const gone = await sql`DELETE FROM prep.accounts WHERE id = ${account}`;
  return gone.count > 0;
}

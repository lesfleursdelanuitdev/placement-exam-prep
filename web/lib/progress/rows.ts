// One progress document <-> the tables (NEXTJS-PLAN.md S3-2). The document is store.js's, cleaned
// by its own sanitize (S3-3). Kept as it is except for what means nothing to the page: a flashcard
// deck with no marks and a question with no answer parts read as missing (flashState()[id] || {}),
// so canonical() drops them and the tables never hold them.
import { sanitize, type Parts, type Progress, type Result } from '@/engine/store.mjs';

export type AnswerRow = { topic: string; question: string; part: number; ok: boolean | null; revealed: boolean; skipped: boolean; msg: string | null; tries: number | null; val: unknown };
export type Rows = {
  updated: number;
  exam: { no: number; seed: string; gv: number; started: number; finished: number | null } | null;
  answers: AnswerRow[];
  tutorials: { topic: string; batches: string[] }[];
  drafts: { key: string; value: unknown }[];
  history: { pos: number; no: number; earned: number; total: number; started: number; finished: number }[];
  topicResults: { pos: number; topic: string; earned: number; total: number }[];
  marks: { deck: string; card: number; mark: 0 | 1 }[];
  grapher: unknown | null;
};

const nonEmpty = <T>(o: Record<string, T>, keep: (v: T) => boolean) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => keep(v)));
const hasParts = (p: Parts) => Object.keys(p).length > 0;

/** sanitize(), then without what reads as missing anyway. null: not a progress document. */
export function canonical(doc: unknown): Progress | null {
  const p = sanitize(doc);
  if (!p) return null;
  if (p.exam) p.exam.res = nonEmpty(p.exam.res, hasParts);
  for (const t of Object.values(p.tut)) t.res = nonEmpty(t.res, hasParts);
  p.flash = nonEmpty(p.flash, (m) => Object.keys(m).length > 0);
  return p;
}

function answers(topic: string, res: Record<string, Parts>): AnswerRow[] {
  const out: AnswerRow[] = [];
  for (const [question, parts] of Object.entries(res)) {
    for (const [part, r] of Object.entries(parts)) {
      out.push({
        topic, question, part: Number(part), ok: r.ok ?? null, revealed: r.revealed === true, skipped: r.skipped === true,
        msg: 'msg' in r ? r.msg! : null, tries: 'tries' in r ? r.tries! : null, val: r.val ?? null,
      });
    }
  }
  return out;
}

/** A canonical document as rows. */
export function toRows(p: Progress): Rows {
  return {
    updated: p.updated,
    exam: p.exam && { no: p.exam.no, seed: p.exam.seed, gv: p.exam.gv, started: p.exam.started, finished: p.exam.finished },
    answers: [
      ...(p.exam ? answers('', p.exam.res) : []),
      ...Object.entries(p.tut).flatMap(([topic, t]) => answers(topic, t.res)),
    ],
    tutorials: Object.entries(p.tut).map(([topic, t]) => ({ topic, batches: t.batches })),
    drafts: Object.entries(p.drafts).map(([key, value]) => ({ key, value })),
    history: p.history.map((h, pos) => ({ pos, no: h.no, earned: h.earned, total: h.total, started: h.started, finished: h.finished })),
    topicResults: p.history.flatMap((h, pos) => Object.entries(h.byTopic).map(([topic, [earned, total]]) => ({ pos, topic, earned, total }))),
    marks: Object.entries(p.flash).flatMap(([deck, m]) => Object.entries(m).map(([card, mark]) => ({ deck, card: Number(card), mark }))),
    grapher: p.grapher ?? null,
  };
}

function result(a: AnswerRow): Result {
  const r: Result = {};
  if (a.ok !== null) r.ok = a.ok;
  if (a.revealed) r.revealed = true;
  if (a.skipped) r.skipped = true;
  if (a.msg !== null) r.msg = a.msg;
  if (a.tries !== null) r.tries = a.tries;
  if (a.val !== null) r.val = a.val as Result['val'];
  return r;
}

/** Rows back into the document they came from (canonical, so toRows(fromRows(x)) is x). */
export function fromRows(r: Rows): Progress {
  const res = (topic: string) => {
    const out: Record<string, Parts> = {};
    for (const a of r.answers) if (a.topic === topic) (out[a.question] ??= {})[String(a.part)] = result(a);
    return out;
  };
  const p: Progress = {
    v: 1,
    exam: r.exam && { ...r.exam, res: res('') },
    history: [...r.history].sort((a, b) => a.pos - b.pos).map((h) => ({
      no: h.no, earned: h.earned, total: h.total, started: h.started, finished: h.finished,
      byTopic: Object.fromEntries(r.topicResults.filter((t) => t.pos === h.pos).map((t) => [t.topic, [t.earned, t.total] as [number, number]])),
    })),
    tut: Object.fromEntries(r.tutorials.map((t) => [t.topic, { batches: t.batches, res: res(t.topic) }])),
    flash: {},
    drafts: Object.fromEntries(r.drafts.map((d) => [d.key, d.value as Progress['drafts'][string]])),
    updated: r.updated,
  };
  for (const m of r.marks) (p.flash[m.deck] ??= {})[String(m.card)] = m.mark;
  if (r.grapher !== null) p.grapher = r.grapher as Progress['grapher'];
  return p;
}

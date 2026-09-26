// Types for the generated store.mjs (src/store.js's sanitize, for the server): the progress
// document exactly as sanitize() gives it back.
export type Input = { value?: string; unit?: string; choice?: string; values?: string[] };
export type Result = { ok?: boolean; revealed?: true; skipped?: true; msg?: string; tries?: number; val?: Input };
export type Parts = Record<string, Result>;
export type Exam = { no: number; seed: string; gv: number; started: number; finished: number | null; res: Record<string, Parts> };
export type HistoryEntry = { no: number; earned: number; total: number; started: number; finished: number; byTopic: Record<string, [number, number]> };
export type Tutorial = { batches: string[]; res: Record<string, Parts> };
export type Grapher = { fns: { src: string; color: string; show: boolean }[]; win: Record<string, number>; mode?: 'draw' | 'graph' };
export type Progress = {
  v: 1;
  exam: Exam | null;
  history: HistoryEntry[];
  tut: Record<string, Tutorial>;
  flash: Record<string, Record<string, 0 | 1>>;
  drafts: Record<string, Input>;
  grapher?: Grapher;
  updated: number;
};

export const SOURCE_SHA256: string;
export function sanitize(s: unknown): Progress | null;
export function fresh(): Progress;

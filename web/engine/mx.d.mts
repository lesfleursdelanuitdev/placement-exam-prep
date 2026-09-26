// Types for the generated engine module (mx.mjs, made by build.mjs from ../src). Only what the
// Next.js app uses is typed; the rest is reachable as `unknown`.

export interface Part {
  kind: string;
  label?: string;
  ask?: string;
  show?: string;
  pre?: string;
  post?: string;
  points: number;
  answer?: unknown;
  answers?: unknown[];
  options?: string[];
  [key: string]: unknown;
}

export interface Question {
  prompt: string;
  parts: Part[];
  solution: string[];
  visual?: string;
  ctx?: string;
  [key: string]: unknown;
}

export interface RNG {
  next(): number;
  int(a: number, b: number): number;
  pick<T>(list: readonly T[]): T;
}

export interface Variant {
  name: string;
  gen(rng: RNG): Question;
}

export interface Slot {
  pool: string[];
  label?: string;
  source?: string;
}

export interface Topic {
  id: string;
  title: string;
  section: string;
  kind?: string;
  part?: number;
  lesson: string;
  sources?: string[];
  variants: Record<string, Variant>;
  slots?: Slot[];
  practiceOnly?: boolean;
  distinctContexts?: boolean;
  [key: string]: unknown;
}

/** A flashcard: [front, back], both engine text (render with MX.rich). */
export type Card = [string, string];

export interface CheckResult {
  ok: boolean;
  msg?: string;
  [key: string]: unknown;
}

export interface Engine {
  topics: Topic[];
  byId: Record<string, Topic>;
  FLASH: Record<string, Card[]>;
  /** Engine text (prose with \( math \)) to HTML. */
  rich(text: string): string;
  rngFor(seed: string, key: string): RNG;
  /** true, or why the answer key fails its check */
  sound(q: Question): true | string;
  check(part: Part, input: unknown): CheckResult;
  answerInput(part: Part): unknown;
  V: { opts: Record<string, number>; [key: string]: unknown };
  [key: string]: unknown;
}

export const FILES: string[];
export const SOURCE_SHA256: Record<string, string>;
export function installMX(G: object): Engine;
export function createMX(): Engine;
export const MX: Engine;
export default MX;

import type { Engine, Question, Slot, Topic } from './mx.mjs';

export const GEN_VERSION: number;
export const WORKED_N: number;
export const PART3_SEC: string;
export const SECTION_ORDER: string[];
export const WORD_ORDER: string[];
export const PART3_ORDER: string[];

export function slotsOf(t: Topic): Slot[];
export function allVariants(t: Topic): string[];
export function examPartOf(t: Topic): 1 | 2 | 3;
export function sectionOf(t: Topic): string;

export interface ExamItem {
  key: string;
  topic: Topic;
  slot: Slot;
  variant: string;
  q: Question;
  n: number;
}

export interface Model {
  MX: Engine;
  unsound: { topic: string; variant: string; seed: string; key: string; why: unknown }[];
  orderedTopics(): Topic[];
  bySection(): [string, Topic[]][];
  soundGen(t: Topic, vk: string, seed: string, key: string): Question;
  buildExam(seed: string): ExamItem[];
  workedPlan(t: Topic): string[];
  workedExamples(t: Topic): { vk: string; q: Question }[];
  practice(t: Topic, batches?: string[]): { key: string; vk: string; q: Question }[];
  cardsOf(id: string): [string, string][];
}

export function createModel(MX: Engine, opts?: { warn?: (...args: unknown[]) => void }): Model;

import type { Engine, Topic, Question } from '../../engine/mx.mjs';
import type { Model } from '../../engine/model.mjs';

export type DeckSpec = { topic: string } | { section: string } | { all: 1 };
export type DeckMode = 'all' | 'learning';
export type ViewName = 'home' | 'exam' | 'part' | 'results' | 'tutorials' | 'tutorial' | 'flashcards' | 'deck' | 'grapher' | 'progress';
export type TutTab = 'lesson' | 'examples' | 'practice';

export interface Html {
  home(): string;
  examHome(): string;
  results(): string;
  partFrame(part: 1 | 2 | 3): string;
  tutIndex(): string;
  tutorial(t: Topic, tab: TutTab, worked?: { vk: string; q: Question }[]): string;
  flashIndex(): string;
  deck(spec: DeckSpec, mode: DeckMode): string;
  progress(): string;
  grapher(): string;
}

export interface SharedApp {
  App: Record<string, unknown>;
  html: Html;
  paths: {
    part(p: number): string;
    tutorial(id: string, tab?: TutTab): string;
    deck(spec: DeckSpec | null, mode?: DeckMode): string;
    sectionBySlug(slug: string): string | null;
    slug(s: string): string;
  };
  titleOf(view: ViewName): string;
  deckSpecTitle(spec: DeckSpec): string;
  PART_NUM: Record<1 | 2 | 3, string>;
  PART_NAME: Record<1 | 2 | 3, string>;
  tabName(tab: TutTab): string;
  workedHTML(q: Question, k: number, typeName: string): string;
}

export interface Router {
  push(href: string): void;
  replace(href: string): void;
}

export interface BrowserApp extends SharedApp {
  boot(): void;
  /** fills in the page on screen; returns what to call when it goes */
  mount(view: ViewName, params?: Record<string, unknown>): () => void;
  attach(router: Router): void;
  toast(msg: string): void;
  renderChip(): void;
  closeMenu(returnFocus?: boolean): void;
}

export function createApp(env: { MX: Engine; model: Model }): SharedApp;
export function createApp(env: { MX: Engine; model: Model; Store: unknown; win: Window }): BrowserApp;

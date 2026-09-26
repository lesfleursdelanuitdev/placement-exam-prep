// The pages on the server (NEXTJS-PLAN.md, Pages): made from the one shared engine copy, without
// the student's progress (it is in their browser; the page fills it in there). Lessons, worked
// examples and the other pages that are the same for everyone are made once and kept.
import { MX, model } from '@/lib/engine';
import { createApp, type DeckMode, type DeckSpec, type TutTab } from './app.mjs';

export const app = createApp({ MX, model });
export const topicById = (id: string) => MX.byId[id];

const kept = new Map<string, string>();
function keep(key: string, make: () => string): string {
  let v = kept.get(key);
  if (v === undefined) { v = make(); kept.set(key, v); }
  return v;
}
const page = (id: string, cls: string, inner: string) => `<div id="${id}" class="page${cls ? ' ' + cls : ''}">${inner}</div>`;

export const pages = {
  home: () => keep('home', () => page('home-page', 'home', app.html.home())),
  examHome: () => keep('exam', () => page('exam-home', 'exam-home', app.html.examHome())),
  results: () => keep('results', () => page('results-page', '', app.html.results())),
  part: (p: 1 | 2 | 3) => keep('part-' + p, () => app.html.partFrame(p)),
  tutIndex: () => keep('tutorials', () => page('tut-index', '', app.html.tutIndex())),
  tutorial: (id: string, tab: TutTab) => keep(`tutorial:${id}:${tab}`, () => page('tut-page', '', app.html.tutorial(MX.byId[id]!, tab))),
  flashIndex: () => keep('flashcards', () => page('flash-index', '', app.html.flashIndex())),
  deck: (spec: DeckSpec, mode: DeckMode) => keep(`deck:${JSON.stringify(spec)}:${mode}`, () => page('deck-page', 'deck', app.html.deck(spec, mode))),
  progress: () => keep('progress', () => page('prog-page', '', app.html.progress())),
  grapher: () => keep('grapher', () => page('gr-page', 'grapher', app.html.grapher())),
};

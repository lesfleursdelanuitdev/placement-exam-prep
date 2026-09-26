// Every address opens directly (typed in, bookmarked, reloaded), not only by clicking: with its
// title and heading from the server, then filled in by the browser, at desktop width and at 320 px.
import { expect, test } from '@playwright/test';

import { MX } from '../../engine/mx.mjs';
import { SITE, appReady, escapeHtml, noSideScroll, watch } from './helpers';

const t = (s: string) => `${s} · ${SITE}`;
const PAGES: { path: string; server: string; title: string | RegExp; h1: string | RegExp }[] = [
  { path: '/', server: SITE, title: SITE, h1: SITE },
  { path: '/exam', server: t('Practice exam'), title: /^Practice Exam No\. 1 · /, h1: 'Practice Exam No. 1' },
  { path: '/exam/part-1', server: t('Part I: Skills · Practice exam'), title: t('Part I: Skills · Exam No. 1'), h1: 'Part I: Skills' },
  { path: '/exam/part-2', server: t('Part II: Word problems · Practice exam'), title: t('Part II: Word problems · Exam No. 1'), h1: 'Part II: Word problems' },
  { path: '/exam/part-3', server: t('Part III: Linear equations & inequalities · Practice exam'), title: t('Part III: Linear equations & inequalities · Exam No. 1'), h1: 'Part III: Linear equations & inequalities' },
  { path: '/exam/results', server: t('Results · Practice exam'), title: t('Results · Exam No. 1'), h1: 'Results' },
  { path: '/tutorials', server: t('Tutorials'), title: t('Tutorials'), h1: 'Tutorials' },
  { path: '/tutorials/w-motion', server: t('Distance, rate & time · Lesson'), title: t('Distance, rate & time · Lesson'), h1: 'Distance, rate & time' },
  { path: '/tutorials/w-motion/examples', server: t('Distance, rate & time · Examples'), title: t('Distance, rate & time · Examples'), h1: 'Distance, rate & time' },
  { path: '/tutorials/poly-addsub/practice', server: t('Adding & subtracting polynomials · Practice'), title: t('Adding & subtracting polynomials · Practice'), h1: 'Adding & subtracting polynomials' },
  { path: '/flashcards', server: t('Flashcards'), title: t('Flashcards'), h1: 'Flashcards' },
  { path: '/flashcards/poly-addsub', server: t('Adding & subtracting polynomials · Flashcards'), title: t('Adding & subtracting polynomials · Flashcards'), h1: 'Adding & subtracting polynomials' },
  { path: '/flashcards/section/factoring', server: t('Factoring · Flashcards'), title: t('Factoring · Flashcards'), h1: 'Factoring' },
  { path: '/flashcards/all', server: t('All topics · Flashcards'), title: t('All topics · Flashcards'), h1: 'All topics' },
  { path: '/flashcards/review', server: t('All topics · Flashcards'), title: t('All topics · Flashcards'), h1: 'All topics' },
  { path: '/grapher', server: t('Grapher'), title: t('Grapher'), h1: 'Grapher' },
  { path: '/grapher/draw', server: t('Draw a graph · Grapher'), title: t('Draw a graph · Grapher'), h1: 'Grapher' },
  { path: '/progress', server: t('Progress'), title: t('Progress'), h1: 'Progress' },
];

for (const p of PAGES) {
  test(`${p.path} opens directly`, async ({ page }) => {
    const problems = watch(page);
    const res = await page.goto(p.path);
    expect(res?.status()).toBe(200);
    // the server's page: its title, and its heading before any script ran
    const html = await res!.text();
    expect(html).toContain(`<title>${escapeHtml(p.server)}</title>`);
    expect(html).toMatch(/<h1[^>]*>/);
    await appReady(page);
    await expect(page).toHaveTitle(p.title);
    await expect(page.locator('main h1').first()).toHaveText(p.h1);
    await noSideScroll(page);
    expect(problems).toEqual([]);
  });
}

test('an unknown address is a 404 page; unknown topics, decks and parts go to their list', async ({ page }) => {
  const res = await page.goto('/no-such-page');
  expect(res?.status()).toBe(404);
  await expect(page).toHaveTitle(t('Page not found'));
  await expect(page.locator('main h1')).toHaveText('Page not found');
  for (const [from, to] of [['/tutorials/no-such-topic', '/tutorials'], ['/tutorials/no-such-topic/practice', '/tutorials'], ['/flashcards/no-such-topic', '/flashcards'], ['/flashcards/section/no-such-section', '/flashcards'], ['/exam/part-4', '/exam'], ['/grapher/nope', '/grapher']]) {
    await page.goto(from!);
    await expect(page).toHaveURL(to!);
  }
});

test('the lessons, worked examples and decks are made on the server, for every topic', async ({ request }, info) => {
  test.skip(info.project.name !== 'desktop', 'server pages: once is enough');
  test.setTimeout(180_000);
  for (const topic of MX.topics) {
    for (const tab of ['', '/examples', '/practice']) {
      const r = await request.get(`/tutorials/${encodeURIComponent(topic.id)}${tab}`, { maxRedirects: 0 });
      expect(r.status(), topic.id + tab).toBe(200);
      const html = await r.text();
      expect(html, topic.id + tab).toContain(`<h1 tabindex="-1">${escapeHtml(topic.title)}</h1>`);
      if (tab === '') expect(html, topic.id).toContain('<section class="lesson">');
      if (tab === '/examples') expect(html.match(/<article class="card worked/g)?.length, topic.id).toBe(6);
    }
    if ((MX.FLASH[topic.id] || []).length) {
      const r = await request.get(`/flashcards/${encodeURIComponent(topic.id)}`, { maxRedirects: 0 });
      expect(r.status(), 'deck ' + topic.id).toBe(200);
      expect(await r.text(), 'deck ' + topic.id).toContain('id="fc"');
    }
  }
});

test('the old #/ addresses go to the new ones', async ({ page }) => {
  for (const [hash, path, h1] of [
    ['#/tutorials/w-motion/examples', '/tutorials/w-motion/examples', 'Distance, rate & time'],
    ['#/exam/part-2', '/exam/part-2', 'Part II: Word problems'],
    ['#/flashcards/section/factoring', '/flashcards/section/factoring', 'Factoring'],
    ['#/flashcards/review', '/flashcards/review', 'All topics'],
    ['#/grapher/draw', '/grapher/draw', 'Grapher'],
    ['#/progress', '/progress', 'Progress'],
  ]) {
    await page.goto('/' + hash);
    await expect(page).toHaveURL(path!);
    await expect(page.locator('main h1').first()).toHaveText(h1!);
  }
  await page.goto('/#/');
  await appReady(page);
  await expect(page).toHaveURL(/\/#\/$/);
  await expect(page.locator('main h1')).toHaveText(SITE);
});

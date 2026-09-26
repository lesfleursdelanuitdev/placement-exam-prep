// Guest progress lives in the browser exactly as on the plain page: the same key and format
// (store.js is the plain page's own), so what a student saved there opens here and the other way
// round; answers, drafts, practice, marks, finished exams and the stopwatch survive reloads.
import { expect, test, type Page } from '@playwright/test';

import { STOPWATCH_KEY, STORE_KEY, appReady, plainPage, saved, watch } from './helpers';

type W = { MX: any };

// Answer exam question `i` (0-based) the way a student would: type into its box, press Check.
// `right`: the engine's own answer key (MX.answerInput); otherwise something wrong.
async function answerExam(page: Page, i: number, right: boolean) {
  const box = await page.evaluate(({ i, right }) => {
    const MX = (window as unknown as W).MX;
    const no = JSON.parse(localStorage.getItem('m098-prep-state-v1')!).exam.no;
    const id = `x${no}-${i}-0-0`;
    MX.ED.set(id, right ? MX.answerInput(MX.App.items[i].q.parts[0]).value : 'x+1234');
    return id;
  }, { i, right });
  await page.locator(`#pt-${box.replace(/-0$/, '')} [data-act="check"]`).click();
}
const cardOf = (page: Page, i: number) => page.locator(`#exam-list .card`).nth(i);

test('a checked answer is saved and still there after a reload', async ({ page }) => {
  const problems = watch(page);
  await page.goto('/exam/part-1');
  await appReady(page);
  await answerExam(page, 0, true);
  await expect(cardOf(page, 0).locator('.fb').first()).toContainText('Correct');
  await answerExam(page, 1, false);
  await expect(cardOf(page, 1).locator('.fb').first()).toContainText('Not quite');
  const s = await saved(page);
  expect(s.v).toBe(1);
  expect(Object.values(s.exam.res).map((r: any) => r['0'].ok)).toEqual([true, false]);
  const chip = await page.locator('#score-chip').textContent();
  expect(chip).not.toMatch(/Exam No\. 1\s*0\s*\//);
  await page.reload();
  await appReady(page);
  await expect(cardOf(page, 0).locator('.part').first()).toHaveClass(/locked/);
  await expect(cardOf(page, 0).locator('.fb').first()).toContainText('Correct');
  await expect(cardOf(page, 1).locator('.fb').first()).toContainText('Not quite');
  await expect(page.locator('#score-chip')).toHaveText(chip!);
  await expect(page.locator('#nav-bubbles .bub.ok')).toHaveCount(1);
  await expect(page.locator('#nav-bubbles .bub.bad')).toHaveCount(1);
  // the home page and the overview read the same
  await page.locator('.tabs a, .dnav a').filter({ hasText: 'Home' }).first().dispatchEvent('click');
  await expect(page).toHaveURL('/');
  await expect(page.locator('.choice').first()).toContainText(/2 of \d+ parts answered/);
  await expect(page.locator('.choice').first().getByRole('link', { name: 'Continue at question 3' })).toBeVisible();
  expect(problems).toEqual([]);
});

test('save and finish later; Continue opens the next open question', async ({ page }) => {
  await page.goto('/exam/part-1');
  await appReady(page);
  await answerExam(page, 0, false);
  await answerExam(page, 1, false);
  await page.getByRole('button', { name: 'Save and finish later' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.locator('#toast')).toHaveText('Saved. Your exam will open at question 3 when you come back.');
  await page.getByRole('link', { name: 'Continue at question 3' }).click();
  await expect(page).toHaveURL('/exam/part-1');
  await expect(cardOf(page, 2)).toBeInViewport();
});

test('what is typed but not checked is kept as a draft', async ({ page }) => {
  await page.goto('/exam/part-1');
  await appReady(page);
  const box = page.locator('#exam-list .card').first().locator('.mq').first();
  await box.click();
  await page.keyboard.type('3y+4');
  await expect.poll(async () => (await saved(page)).drafts).toEqual({ 'x1-0-0': { value: '3y+4' } });
  await page.reload();
  await appReady(page);
  expect(await page.evaluate(() => (window as unknown as W).MX.ED.value('x1-0-0-0'))).toBe('3y+4');
});

test('practice, more exercises and flashcard marks are saved', async ({ page }) => {
  await page.goto('/tutorials/poly-addsub/practice');
  await appReady(page);
  await expect(page.locator('.ex-list .card')).toHaveCount(3);
  await page.evaluate(() => (window as unknown as W).MX.ED.set('t-poly-addsub-e0-0-0', 'x+1234'));
  await page.locator('#pt-t-poly-addsub-e0-0 [data-act="check"]').click();
  await expect(page.locator('#fb-t-poly-addsub-e0-0')).toContainText('Not quite');
  await expect(page.locator('#pt-t-poly-addsub-e0-0 [data-act="reveal"]')).toBeVisible();
  await page.getByRole('button', { name: 'Add 3 exercises' }).click();
  await expect(page.locator('.ex-list .card')).toHaveCount(6);
  await expect(page.locator('#tut-stats')).toHaveText('0 of 6 solved');
  await page.goto('/flashcards/poly-addsub');
  await appReady(page);
  await page.locator('.fc-acts').getByRole('button', { name: 'Got it' }).click();
  await page.reload();
  await appReady(page);
  await expect(page.locator('.fc-total')).toContainText('1 of');
  await page.goto('/tutorials/poly-addsub/practice');
  await appReady(page);
  await expect(page.locator('.ex-list .card')).toHaveCount(6);
  await expect(page.locator('#fb-t-poly-addsub-e0-0')).toContainText('Not quite');
  await page.goto('/tutorials');
  await appReady(page);
  await expect(page.locator('.page-h p')).toContainText("You've practiced 1 of them");
  const s = await saved(page);
  expect(s.tut['poly-addsub'].batches).toEqual(['']);
  expect(s.flash['poly-addsub']).toEqual({ 0: 1 });
});

test('ending the exam: results, history, a new exam', async ({ page }) => {
  await page.goto('/exam/part-3');
  await appReady(page);
  await page.getByRole('button', { name: 'End exam now…' }).click();
  await page.getByRole('button', { name: 'End exam', exact: true }).click();
  await expect(page).toHaveURL('/exam/results');
  await expect(page.locator('main h1')).toHaveText('Exam complete');
  await expect(page).toHaveTitle('Results · Exam No. 1 · Placement Exam Prep');
  expect((await saved(page)).history).toHaveLength(1);
  await page.locator('.res-parts a', { hasText: 'Review' }).first().click();
  await expect(page).toHaveURL('/exam/part-1');
  await expect(cardOf(page, 0).locator('.fb').first()).toContainText('Not answered');
  await page.goto('/progress');
  await appReady(page);
  await expect(page.locator('.stat').first()).toContainText('1exams finished');
  await page.goto('/');
  await appReady(page);
  await page.getByRole('button', { name: 'Start Practice Exam No. 2' }).click();
  await expect(page).toHaveURL('/exam');
  await expect(page.locator('main h1')).toHaveText('Practice Exam No. 2');
  expect((await saved(page)).exam.no).toBe(2);
});

test('the stopwatch keeps running across pages and reloads', async ({ page }) => {
  await page.goto('/');
  await appReady(page);
  await page.locator('#sw-fab').click();
  await page.locator('[data-sw="start"]').click();
  await page.locator('.tabs a, .dnav a').filter({ hasText: 'Tutorials' }).first().dispatchEvent('click');
  await expect(page).toHaveURL('/tutorials');
  await expect(page.locator('#stopwatch')).toHaveAttribute('data-state', 'running');
  await page.reload();
  await appReady(page);
  await expect(page.locator('#stopwatch')).toHaveAttribute('data-state', 'running');
  await expect(page.locator('#stopwatch')).toHaveCount(1);
  expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).state, STOPWATCH_KEY)).toBe('running');
});

test('reset all progress', async ({ page }) => {
  await page.goto('/flashcards/poly-addsub');
  await appReady(page);
  await page.locator('.fc-acts').getByRole('button', { name: 'Got it' }).click();
  await page.goto('/progress');
  await appReady(page);
  await page.getByRole('button', { name: 'Reset all progress…' }).click();
  await page.getByRole('button', { name: 'Erase everything' }).click();
  await expect(page.locator('main h1')).toHaveText('Progress');
  const s = await saved(page);
  expect(s.flash).toEqual({});
  expect(s.exam.no).toBe(1);
});

test('progress saved by the plain page opens here, and the other way round', async ({ browser }, info) => {
  test.skip(info.project.name !== 'desktop', 'once is enough');
  test.setTimeout(90_000);
  // 1. the plain page (src/ as build.mjs joins it): answer, draft, mark, practice
  const plainCtx = await browser.newContext();
  await plainCtx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const plain = await plainCtx.newPage();
  const url = plainPage();
  await plain.goto(url + '#/exam/part-1', { waitUntil: 'domcontentloaded' });
  await expect(plain.locator('#exam-list .card').first()).toBeVisible();
  await answerExam(plain, 0, true);
  await expect(plain.locator('#exam-list .card').first().locator('.fb').first()).toContainText('Correct');
  await plain.evaluate(() => { (window as unknown as W).MX.ED.set('x1-1-0-0', '5y'); });
  await plain.goto(url + '#/flashcards/poly-addsub');
  await plain.locator('.fc-acts').getByRole('button', { name: 'Still learning' }).click();
  await plain.goto(url + '#/tutorials/poly-addsub/practice');
  await plain.getByRole('button', { name: 'Add 3 exercises' }).click();
  await expect(plain.locator('.ex-list .card')).toHaveCount(6);
  const plainPrompts = await (async () => { await plain.goto(url + '#/exam/part-2'); await expect(plain.locator('#exam-list .card').first()).toBeVisible(); return plain.locator('#exam-list .card .prompt').allTextContents(); })();
  const plainChip = (await plain.locator('#score-chip').textContent())!.replace(/\s+/g, '');
  const state = await plain.evaluate((k) => localStorage.getItem(k)!, STORE_KEY);
  await plainCtx.close();

  // 2. the same saved progress, in the new pages
  const ctx = await browser.newContext();
  await ctx.addInitScript(([k, v]) => { if (!localStorage.getItem(k!)) localStorage.setItem(k!, v!); }, [STORE_KEY, state]);
  const page = await ctx.newPage();
  const problems = watch(page);
  await page.goto('/exam/part-2');
  await appReady(page);
  expect((await page.locator('#score-chip').textContent())!.replace(/\s+/g, '')).toBe(plainChip);
  expect(await page.locator('#exam-list .card .prompt').allTextContents(), 'the same exam from the same seed').toEqual(plainPrompts);
  await page.goto('/exam/part-1');
  await appReady(page);
  await expect(cardOf(page, 0).locator('.fb').first()).toContainText('Correct');
  expect(await page.evaluate(() => (window as unknown as W).MX.ED.value('x1-1-0-0'))).toBe('5y');
  await page.goto('/flashcards');
  await appReady(page);
  await expect(page.locator('.fc-total')).toContainText('1 still learning');
  await page.goto('/tutorials/poly-addsub/practice');
  await appReady(page);
  await expect(page.locator('.ex-list .card')).toHaveCount(6);
  // 3. a new answer here, then back to the plain page with it
  await page.goto('/exam/part-1');
  await appReady(page);
  await answerExam(page, 2, true);
  await expect(cardOf(page, 2).locator('.fb').first()).toContainText('Correct');
  const back = await page.evaluate((k) => localStorage.getItem(k)!, STORE_KEY);
  const chipHere = (await page.locator('#score-chip').textContent())!.replace(/\s+/g, '');
  expect(problems).toEqual([]);
  await ctx.close();
  const plainCtx2 = await browser.newContext();
  await plainCtx2.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await plainCtx2.addInitScript(([k, v]) => { if (!localStorage.getItem(k!)) localStorage.setItem(k!, v!); }, [STORE_KEY, back]);
  const plain2 = await plainCtx2.newPage();
  await plain2.goto(url + '#/exam/part-1', { waitUntil: 'domcontentloaded' });
  await expect(plain2.locator('#exam-list .card').nth(2).locator('.fb').first()).toContainText('Correct');
  expect((await plain2.locator('#score-chip').textContent())!.replace(/\s+/g, '')).toBe(chipHere);
  await plainCtx2.close();
});

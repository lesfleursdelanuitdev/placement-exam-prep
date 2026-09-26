// Moving around: links go from page to page without reloading, "back" returns to the question
// the student came from, the menu works on a phone, and a page that changes mode changes its address.
import { expect, test } from '@playwright/test';

import { appReady, watch } from './helpers';

test('links move between pages without reloading, and back returns to the question', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'the answer sheet is a desktop layout');
  const problems = watch(page);
  let loads = 0;
  page.on('load', () => loads++);
  await page.goto('/');
  await appReady(page);
  await page.getByRole('link', { name: 'Start the exam' }).click();
  await expect(page).toHaveURL('/exam/part-1');
  await expect(page.locator('#exam-list .card').first()).toBeVisible();
  // the answer sheet: question 70 is in part II
  await page.locator('#nav-bubbles .bub', { hasText: /^70$/ }).click();
  await expect(page).toHaveURL('/exam/part-2');
  const q70 = page.locator('#exam-list .card', { has: page.locator('.qnum', { hasText: /^70\.$/ }) });
  await expect(q70).toBeInViewport();
  // a question's tutorial, and back to that question
  await q70.getByRole('link', { name: /Tutorial/ }).click();
  await expect(page).toHaveURL(/\/tutorials\/w-/);
  const back = page.locator('.tut-top .btn.back');
  await expect(back).toHaveText('← Back to the exam (question 70)');
  await page.locator('.tut-tabs a', { hasText: 'Examples' }).click();
  await expect(page).toHaveURL(/\/examples$/);
  await expect(page.locator('.tut-tabs a[aria-current="page"]')).toContainText('Examples');
  await back.click();
  await expect(page).toHaveURL('/exam/part-2');
  await expect(q70).toBeInViewport();
  // the browser's back and forward buttons
  await page.goBack();
  await expect(page).toHaveURL(/\/examples$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/tutorials\/w-[^/]+$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/examples$/);
  await expect(page.locator('.worked-list')).toBeVisible();
  // the bar's tabs, and the current section marked
  await page.locator('.tabs a', { hasText: 'Flashcards' }).click();
  await expect(page).toHaveURL('/flashcards');
  await expect(page.locator('.tabs a[aria-current="page"]')).toHaveText('Flashcards');
  expect(loads, 'one page load: every move after it happened in the page').toBe(1);
  expect(problems).toEqual([]);
});

test('the menu on a phone', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone-320', 'the menu is for narrow screens');
  await page.goto('/tutorials');
  await appReady(page);
  await expect(page.locator('.tabs')).toBeHidden();
  await page.locator('#menu-btn').click();
  const drawer = page.locator('#drawer');
  await expect(drawer).toBeVisible();
  await expect(page.locator('#menu-btn')).toHaveAttribute('aria-expanded', 'true');
  await expect(drawer.locator('.de-h')).toHaveText('Practice Exam No. 1');
  await expect(drawer.locator('.dnav a[aria-current="page"]')).toContainText('Tutorials');
  await drawer.locator('.dnav a', { hasText: 'Progress' }).click();
  await expect(page).toHaveURL('/progress');
  await expect(drawer).toBeHidden();
  await expect(page.locator('main')).not.toHaveAttribute('inert');
  // Escape closes it too; a part from the menu's "Jump to"
  await page.locator('#menu-btn').click();
  await expect(drawer).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await page.locator('#menu-btn').click();
  await drawer.locator('.dj', { hasText: 'Word problems' }).click();
  await expect(page).toHaveURL('/exam/part-2');
  await expect(page.locator('main h1')).toHaveText('Part II: Word problems');
});

test('flashcards: flip and mark; "still learning" on all decks is its own address', async ({ page }) => {
  await page.goto('/flashcards/all');
  await appReady(page);
  const card = page.locator('#fc');
  await card.click();
  await expect(card).toHaveClass(/flipped/);
  await page.locator('.fc-acts').getByRole('button', { name: 'Still learning' }).click();
  await expect(page.locator('.fc-meta').first()).toContainText('Card 2 of');
  await page.locator('.fc-acts').getByRole('button', { name: 'Got it' }).click();
  await page.getByRole('button', { name: /^Still learning \(1\)$/ }).click();
  await expect(page).toHaveURL('/flashcards/review');
  await expect(page.locator('.fc-meta').first()).toContainText('Card 1 of 1');
  await page.getByRole('button', { name: /^All cards/ }).click();
  await expect(page).toHaveURL('/flashcards/all');
  // opened directly, the review deck has the one card too
  await page.goto('/flashcards/review');
  await expect(page.locator('.fc-meta').first()).toContainText('Card 1 of 1');
  // a tutorial's deck goes back to the tutorial
  await page.goto('/tutorials/poly-addsub');
  await appReady(page);
  await page.locator('.deck-link').click();
  await expect(page).toHaveURL('/flashcards/poly-addsub');
  await page.locator('.tut-top .btn.back', { hasText: 'Back to the tutorial' }).click();
  await expect(page).toHaveURL('/tutorials/poly-addsub');
});

test('the grapher: its two modes are two addresses on one page', async ({ page }) => {
  await page.goto('/grapher');
  await appReady(page);
  await page.locator('#gr-tab-draw').click();
  await expect(page).toHaveURL('/grapher/draw');
  await expect(page).toHaveTitle('Draw a graph · Grapher · Placement Exam Prep');
  await page.reload();
  await expect(page.locator('#gr-tab-draw')).toHaveAttribute('aria-selected', 'true');
  await page.locator('#gr-tab-graph').click();
  await expect(page).toHaveURL('/grapher');
  await expect(page).toHaveTitle('Grapher · Placement Exam Prep');
});

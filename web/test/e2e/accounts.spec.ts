// Signed-in progress (NEXTJS-PLAN.md step 4, S4-6), against the server accounts-server.ts starts on a
// throwaway Postgres. The gate's headers are set by the test, as nginx sets them: a guest on a
// gated route is "Not signed in"; a signed-in Student may keep progress. What the server kept is
// read back through the API with the same headers.
import { expect, test, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test';

import { STOPWATCH_KEY, STORE_KEY, appReady, watch } from './helpers';

const OWNER_KEY = 'm098-prep-owner';
const BASE = process.env.E2E_ACCOUNTS_URL;
test.skip(!BASE, 'needs the accounts test server (not against E2E_BASE_URL)');
test.use({ baseURL: BASE });

const PRIVILEGES = 'pages.read progress.delete:own progress.read:own progress.update:own';
let next = 0;
// an account nobody else in this run uses
const newAccount = () => 1_000_000 + test.info().workerIndex * 100_000 + (next++ * 97 + Math.floor(Math.random() * 90)) % 100_000;
const signedIn = (id: number, username = `student${id}`) => ({
  'x-lfdln-account': String(id), 'x-lfdln-username': username, 'x-lfdln-role': 'Student', 'x-lfdln-privileges': PRIVILEGES,
});
const GUEST = { 'x-lfdln-role': 'Not signed in', 'x-lfdln-privileges': 'pages.read' };

// the gate's own addresses, as it answers them
async function gate(ctx: BrowserContext) {
  await ctx.route('**/_pammy/accounts', (r) => r.fulfill({ json: { register: true, emailedLinks: true, changePassword: true, deleteAccount: true } }));
  await ctx.route('**/_pammy/logout', async (r) => {
    await ctx.setExtraHTTPHeaders(GUEST); // the cookie is gone: nginx says guest from now on
    await r.fulfill({ json: { ok: true } });
  });
}

type Doc = { v: 1; exam: unknown; history: unknown[]; tut: object; flash: Record<string, Record<string, 0 | 1>>; drafts: object; updated: number };
const doc = (flash: Doc['flash'], updated = Date.now()): Doc => ({ v: 1, exam: null, history: [], tut: {}, flash, drafts: {}, updated });

// what the server keeps for an account
async function kept(request: APIRequestContext, id: number) {
  const r = await request.get('/api/progress', { headers: signedIn(id) });
  expect(r.status()).toBe(200);
  return (await r.json()) as { progress: Doc | null; importedAt: string | null };
}
async function keep(request: APIRequestContext, id: number, progress: Doc, asImport = true) {
  const r = await request.put('/api/progress', { headers: { ...signedIn(id), origin: BASE!, 'content-type': 'application/json' }, data: { progress, import: asImport } });
  expect(r.status()).toBe(200);
}
const flashKept = async (request: APIRequestContext, id: number) => (await kept(request, id)).progress?.flash ?? null;

const browserCopy = (page: Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), STORE_KEY);
const owner = (page: Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), OWNER_KEY);
const status = (page: Page) => page.locator('#save-status');

// a guest practised here: card marks in the browser (then the page is loaded again)
async function guestWork(page: Page, flash: Doc['flash']) {
  await page.context().setExtraHTTPHeaders(GUEST);
  await page.goto('/progress');
  await appReady(page);
  await page.evaluate(([k, f]) => {
    const s = JSON.parse(localStorage.getItem(k as string)!);
    s.flash = f;
    s.updated = Date.now();
    localStorage.setItem(k as string, JSON.stringify(s));
  }, [STORE_KEY, flash] as const);
}
async function openSignedIn(page: Page, id: number, path = '/progress') {
  await page.context().setExtraHTTPHeaders(signedIn(id));
  await page.goto(path);
  await appReady(page);
}
// a save, as the app makes one (store.js sends it to the account 900 ms later)
const saveInPage = (page: Page, flash: Doc['flash']) =>
  page.evaluate((f) => { const S = (window as any).MX.Store; S.state.flash = f; S.save(); }, flash);

test.beforeEach(async ({ context }) => { await gate(context); });

test('a guest behind the gate is offered Sign in and Make an account, back to this page', async ({ page, context }) => {
  const problems = watch(page);
  await context.setExtraHTTPHeaders(GUEST);
  await page.goto('/progress');
  await appReady(page);
  await expect(status(page)).toContainText('Saved in this browser. Sign in to keep your progress on every device.');
  await expect(status(page).getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/_pammy/login?next=%2Fprogress');
  await expect(status(page).getByRole('link', { name: 'Make an account' })).toHaveAttribute('href', '/_pammy/register?next=%2Fprogress');
  expect(problems).toEqual([]);
});

test('without the gate in front a guest sees no sign-in links, and the gate is never asked', async ({ page, context }) => {
  await context.unrouteAll();
  const asked: string[] = [];
  page.on('request', (r) => { if (r.url().includes('/_pammy/')) asked.push(r.url()); });
  await page.goto('/progress');
  await appReady(page);
  await expect(status(page)).toHaveText('Saved in this browser.');
  await expect(page.locator('.acct-link')).toHaveCount(0);
  expect(asked).toEqual([]);
});

test('first sign-in: the browser\'s progress brought into the account', async ({ page, request }) => {
  const problems = watch(page);
  const id = newAccount();
  await guestWork(page, { 'lin-eq': { '0': 1, '2': 0 } });
  await openSignedIn(page, id);
  const dlg = page.getByRole('dialog', { name: 'Bring your progress into your account?' });
  await expect(dlg).toBeVisible();
  await dlg.getByRole('button', { name: 'Bring it in' }).click();
  await expect(dlg).toBeHidden();
  await expect.poll(() => flashKept(request, id)).toEqual({ 'lin-eq': { '0': 1, '2': 0 } });
  expect((await kept(request, id)).importedAt).not.toBeNull();
  await expect(status(page)).toContainText(`Signed in as student${id}.`);
  await expect(status(page)).toContainText('Saved to your account.');
  expect((await owner(page)).a).toBe(id);
  // and next time, no question: it is the account's
  await page.reload();
  await appReady(page);
  await expect(status(page)).toContainText('Saved to your account.');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(problems).toEqual([]);
});

test('first sign-in: Start fresh leaves the browser\'s progress behind', async ({ page, request }) => {
  const id = newAccount();
  await guestWork(page, { 'lin-eq': { '0': 1 } });
  await openSignedIn(page, id);
  await page.getByRole('dialog', { name: 'Bring your progress into your account?' }).getByRole('button', { name: 'Start fresh' }).click();
  await expect.poll(async () => (await kept(request, id)).importedAt).not.toBeNull();
  expect(await flashKept(request, id)).toEqual({});
  expect((await browserCopy(page)).flash).toEqual({});
  await expect(status(page)).toContainText('Saved to your account.');
});

test('another device: the account\'s progress kept, the browser\'s dropped', async ({ page, request }) => {
  const id = newAccount();
  await keep(request, id, doc({ 'quad': { '5': 1 } }));
  await guestWork(page, { 'lin-eq': { '0': 1 } });
  await openSignedIn(page, id);
  const dlg = page.getByRole('dialog', { name: 'Your account already has progress' });
  await expect(dlg.getByRole('button', { name: 'Keep my account’s' })).toBeFocused();
  await dlg.getByRole('button', { name: 'Keep my account’s' }).click();
  await expect.poll(async () => (await browserCopy(page)).flash).toEqual({ 'quad': { '5': 1 } });
  // the app starts an exam on it: the account gets that, and still only its own marks
  await expect.poll(() => flashKept(request, id)).toEqual({ 'quad': { '5': 1 } });
});

test('another device: this browser\'s progress used instead', async ({ page, request }) => {
  const id = newAccount();
  await keep(request, id, doc({ 'quad': { '5': 1 } }, Date.now() + 60_000)); // newer than the browser's
  await guestWork(page, { 'lin-eq': { '0': 1 } });
  await openSignedIn(page, id);
  await page.getByRole('dialog', { name: 'Your account already has progress' }).getByRole('button', { name: 'Use this browser’s instead' }).click();
  await expect.poll(() => flashKept(request, id)).toEqual({ 'lin-eq': { '0': 1 } });
  await expect(status(page)).toContainText('Saved to your account.');
});

test('closing the question changes nothing, and it is asked again next time', async ({ page, request }) => {
  const id = newAccount();
  await keep(request, id, doc({ 'quad': { '5': 1 } }));
  await guestWork(page, { 'lin-eq': { '0': 1 } });
  await openSignedIn(page, id);
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(status(page)).toContainText('Saved in this browser until you choose.');
  expect(await flashKept(request, id)).toEqual({ 'quad': { '5': 1 } });
  expect((await browserCopy(page)).flash).toEqual({ 'lin-eq': { '0': 1 } });
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Your account already has progress' })).toBeVisible();
});

test('nothing done here as a guest: the account\'s progress opens, no question', async ({ page, request }) => {
  const id = newAccount();
  await keep(request, id, doc({ 'quad': { '1': 1 } }));
  await openSignedIn(page, id);
  await expect.poll(async () => (await browserCopy(page)).flash).toEqual({ 'quad': { '1': 1 } });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(status(page)).toContainText('Saved to your account.');
});

test('a new account with nothing anywhere: marked imported, no question', async ({ page, request }) => {
  const id = newAccount();
  await openSignedIn(page, id);
  await expect.poll(async () => (await kept(request, id)).importedAt).not.toBeNull();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('another account\'s progress in this browser is cleared before anything shows', async ({ page, request }) => {
  const a = newAccount(), b = newAccount();
  await keep(request, a, doc({ 'quad': { '1': 1 } }));
  await openSignedIn(page, a);
  await expect.poll(async () => (await browserCopy(page)).flash).toEqual({ 'quad': { '1': 1 } });
  await openSignedIn(page, b);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect((await browserCopy(page)).flash).toEqual({});
  await expect.poll(async () => (await owner(page))?.a).toBe(b);
  expect(await flashKept(request, b)).toEqual({});
  expect(await flashKept(request, a)).toEqual({ 'quad': { '1': 1 } });
});

test('Sign out clears this browser\'s copy and the page comes back as a guest\'s', async ({ page, request, context }) => {
  const id = newAccount();
  await keep(request, id, doc({ 'quad': { '1': 1 } }));
  await openSignedIn(page, id);
  await expect.poll(async () => (await browserCopy(page)).flash).toEqual({ 'quad': { '1': 1 } });
  await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ on: true, t: 5 })), STOPWATCH_KEY);
  await status(page).getByRole('button', { name: 'Sign out' }).click();
  await expect(status(page)).toContainText('Sign in to keep your progress on every device.');
  expect((await browserCopy(page)).flash).toEqual({});
  expect(await owner(page)).toBeNull();
  expect(await page.evaluate((k) => localStorage.getItem(k), STOPWATCH_KEY)).toBeNull();
  // the account keeps it
  expect(await flashKept(request, id)).toEqual({ 'quad': { '1': 1 } });
  void context;
});

test('signed out elsewhere: a guest here sees nothing of the account', async ({ page, request, context }) => {
  const id = newAccount();
  await keep(request, id, doc({ 'quad': { '1': 1 } }));
  await openSignedIn(page, id);
  await expect.poll(async () => (await browserCopy(page)).flash).toEqual({ 'quad': { '1': 1 } });
  await context.setExtraHTTPHeaders(GUEST);
  await page.reload();
  await appReady(page);
  expect((await browserCopy(page)).flash).toEqual({});
  expect(await owner(page)).toBeNull();
});

test('the server away: saved here, sent when it is back', async ({ page, request, context }) => {
  const id = newAccount();
  await openSignedIn(page, id);
  await expect(status(page)).toContainText('Saved to your account.');
  await context.route('**/api/progress', (r) => (r.request().method() === 'PUT' ? r.abort('connectionrefused') : r.fallback()));
  await saveInPage(page, { 'lin-eq': { '3': 1 } });
  await expect(status(page)).toContainText('Not sent to your account yet: it will be.');
  await context.unroute('**/api/progress');
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect.poll(() => flashKept(request, id)).toEqual({ 'lin-eq': { '3': 1 } });
  await expect(status(page)).toContainText('Saved to your account.');
});

test('saved here while the server was away: sent on the next visit', async ({ page, request, context }) => {
  const id = newAccount();
  await openSignedIn(page, id);
  await expect(status(page)).toContainText('Saved to your account.');
  await context.route('**/api/progress', (r) => (r.request().method() === 'PUT' ? r.abort('connectionrefused') : r.fallback()));
  await saveInPage(page, { 'lin-eq': { '4': 0 } });
  await expect(status(page)).toContainText('Not sent to your account yet');
  await context.unroute('**/api/progress');
  await page.reload();
  await appReady(page);
  await expect.poll(() => flashKept(request, id)).toEqual({ 'lin-eq': { '4': 0 } });
});

test('another device saved something newer: the page takes it', async ({ page, request, context }) => {
  const id = newAccount();
  await openSignedIn(page, id);
  await expect(status(page)).toContainText('Saved to your account.');
  const newer = doc({ 'quad': { '7': 1 } }, Date.now() + 60_000);
  await context.route('**/api/progress', (r) => (r.request().method() === 'PUT'
    ? r.fulfill({ status: 409, json: { error: 'Newer progress was saved from somewhere else.', progress: newer, importedAt: new Date().toISOString() } })
    : r.fallback()), { times: 1 });
  await saveInPage(page, { 'lin-eq': { '1': 1 } });
  await expect.poll(async () => (await browserCopy(page)).flash).toEqual({ 'quad': { '7': 1 } });
  // the app starts an exam on it (it had none) and that save goes up, after the newer one
  await expect.poll(() => flashKept(request, id)).toEqual({ 'quad': { '7': 1 } });
  expect((await owner(page)).base).toBeGreaterThan(newer.updated);
  await expect(status(page)).toContainText('Saved to your account.');
});

test('a device whose clock is behind still saves (not refused as older)', async ({ page, request }) => {
  const id = newAccount();
  const ahead = Date.now() + 10 * 60_000; // another device, ten minutes ahead
  await keep(request, id, doc({ 'quad': { '1': 1 } }, ahead));
  await openSignedIn(page, id);
  await expect.poll(async () => (await browserCopy(page)).flash).toEqual({ 'quad': { '1': 1 } });
  await saveInPage(page, { 'quad': { '1': 1, '2': 0 } });
  await expect.poll(() => flashKept(request, id)).toEqual({ 'quad': { '1': 1, '2': 0 } });
  expect((await kept(request, id)).progress!.updated).toBeGreaterThan(ahead);
  await expect(status(page)).toContainText('Saved to your account.');
});

test('Reset, signed in, says it goes from the account too, and it does', async ({ page, request }) => {
  const id = newAccount();
  await keep(request, id, doc({ 'quad': { '1': 1 } }));
  await openSignedIn(page, id);
  await expect.poll(async () => (await browserCopy(page)).flash).toEqual({ 'quad': { '1': 1 } });
  await page.getByRole('button', { name: 'Reset all progress…' }).click();
  await expect(page.locator('#reset-confirm')).toContainText('It goes from your account too, on every device.');
  await page.getByRole('button', { name: 'Erase everything' }).click();
  await expect.poll(() => flashKept(request, id)).toEqual({});
});

test('the menu says who is signed in, with Your account and Sign out', async ({ page }) => {
  test.skip(test.info().project.name !== 'phone-320', 'the menu is the phone\'s');
  const id = newAccount();
  await openSignedIn(page, id, '/');
  await page.locator('#menu-btn').click();
  const foot = page.locator('#drawer .drawer-foot');
  await expect(foot).toContainText(`Signed in as student${id}`);
  await expect(foot.getByRole('link', { name: 'Your account' })).toHaveAttribute('href', '/_pammy/account');
  await expect(foot.getByRole('button', { name: 'Sign out' })).toBeVisible();
});

test('the bar shows who is signed in, on a wide screen', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop', 'hidden at phone width');
  const id = newAccount();
  await openSignedIn(page, id, '/');
  await expect(page.locator('.acct-link')).toHaveText(`student${id}`);
});

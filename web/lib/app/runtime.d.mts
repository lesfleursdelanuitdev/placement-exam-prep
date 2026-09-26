import type { Account, Who } from './account.mjs';
import type { BrowserApp } from './app.mjs';

/** Who is signed in, as the layout put it on <body>; null: a guest. */
export function whoOnPage(body: HTMLElement | null): Who;
/** The site's gate is in front (sign-in links make sense). */
export function gateOnPage(body: HTMLElement | null): boolean;
/** The app in the browser, loaded and booted once per page load. */
export function loadApp(): Promise<BrowserApp & { account: Account }>;

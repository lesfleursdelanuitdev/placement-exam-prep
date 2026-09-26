import type { BrowserApp } from './app.mjs';

/** The app in the browser, loaded and booted once per page load. */
export function loadApp(): Promise<BrowserApp>;

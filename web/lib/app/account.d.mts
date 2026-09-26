import type { BrowserApp } from './app.mjs';

export const STATE_KEY: string;
export const STOPWATCH_KEY: string;
export const OWNER_KEY: string;

/** Who is signed in (the gate's headers, via the layout); null: a guest. */
export type Who = { account: number; username: string; del: boolean } | null;
export type AccountState = 'guest' | 'loading' | 'asking' | 'synced' | 'pending' | 'local';
/** What the page says about saving (NEXTJS-PLAN.md S4-5). */
export type AccountSnapshot = {
  state: AccountState;
  text: string;
  links: { href: string; text: string }[];
  signOut: boolean;
  username: string | null;
};
export interface Account {
  who: Who;
  statusHtml(): string;
  snapshot(): AccountSnapshot;
  resetNote: string;
  subscribe(f: (s: AccountSnapshot) => void): () => void;
  start(app: BrowserApp): void;
}

export function settleOwner(win: Window, who: Who): void;
export function hasWork(state: unknown): boolean;
export function createAccount(win: Window, who: Who, gate?: boolean): Account;

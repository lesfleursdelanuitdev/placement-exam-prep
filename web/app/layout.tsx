import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';

import { Chrome } from '@/components/chrome';
import { mayOwn, whoOf } from '@/lib/progress/who';
import { fontVariables } from './fonts';
// the plain page's look, as it is (generated from src/styles.css by engine/build.mjs), then Tailwind
import '@/engine/styles.css';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Placement Exam Prep', template: '%s · Placement Exam Prep' },
  description: 'Generated algebra placement practice exams, with tutorials and flashcards.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // reading the request makes every page per-request, so each carries its own CSP nonce (proxy.ts)
  const h = await headers();
  // who is signed in (the gate's headers, NEXTJS-PLAN.md S4-1): someone who may keep progress here
  const w = whoOf(h);
  const signedIn = w.account !== null && mayOwn(w, 'progress.read') && mayOwn(w, 'progress.update');
  // the gate is in front when it says who (a guest's role is "Not signed in"): only then are there
  // sign-in links (the test server and the plain page have none)
  const gate = w.account !== null || (h.get('x-lfdln-role') ?? '').trim() !== '';
  const who = {
    ...(gate ? { 'data-gate': '1' } : {}),
    ...(signedIn ? { 'data-account': String(w.account), 'data-username': w.username, 'data-del': mayOwn(w, 'progress.delete') ? '1' : '0' } : {}),
  };
  return (
    <html lang="en" className={fontVariables}>
      <body {...who}>
        <Chrome />
        <main>{children}</main>
        <div id="toast" className="toast" role="status" aria-live="polite" hidden />
      </body>
    </html>
  );
}

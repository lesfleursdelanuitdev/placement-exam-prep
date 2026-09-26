import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';

import { Chrome } from '@/components/chrome';
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
  await headers();
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <Chrome />
        <main>{children}</main>
        <div id="toast" className="toast" role="status" aria-live="polite" hidden />
      </body>
    </html>
  );
}

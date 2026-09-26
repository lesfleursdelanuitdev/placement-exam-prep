import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';

import { fontVariables } from './fonts';
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
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}

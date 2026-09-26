import { NextResponse, type NextRequest } from 'next/server';

// A strict Content-Security-Policy with a fresh nonce for every page (NEXTJS-PLAN.md, Security):
// scripts only from this site and only with the nonce, no inline scripts, fonts from this site.
// Next.js reads the nonce from the request's policy and puts it on its own scripts; server
// components get it from the `x-nonce` header. Inline style *attributes* are allowed: the engine's
// HTML uses a few (bar widths, SVG).
export function policy(nonce: string, dev = process.env.NODE_ENV !== 'production'): string {
  return [
    "default-src 'none'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data:",
    `connect-src 'self'${dev ? ' ws:' : ''}`,
    "manifest-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "object-src 'none'",
  ].join('; ');
}

export function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = policy(nonce);
  const headers = new Headers(request.headers);
  headers.set('x-nonce', nonce);
  headers.set('Content-Security-Policy', csp);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: [
    {
      // pages only: not the static files, and not prefetches (their HTML is not used as a page)
      source: '/((?!_next/static|_next/image|favicon.ico|api/).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};

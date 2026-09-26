import type { NextConfig } from 'next';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));

// The Content-Security-Policy is set per request in proxy.ts (it carries a nonce); these go on
// every response, the static files included.
const SECURITY_HEADERS = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
];

const nextConfig: NextConfig = {
  output: 'standalone', // the container runs .next/standalone/server.js (plan: Hosting)
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: { root: here },
  outputFileTracingRoot: here,
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;

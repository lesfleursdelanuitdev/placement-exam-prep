// The panel telling exam prep an account was deleted (NEXTJS-PLAN.md step 4b; the panel's
// docs/accounts-plan.md Q1). The panel POSTs straight to 127.0.0.1:4101 (nginx answers 404 for
// /_lfdln/ from outside), signed with a key only the two of them have: HMAC-SHA256 over
// "<timestamp>.<body>", sent as X-Lfdln-Timestamp (ms) and X-Lfdln-Signature ("v1=<hex>").
// A timestamp more than five minutes off is refused. Deleting twice is harmless.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const MAX_SKEW_MS = 5 * 60 * 1000;
const MAX_BODY = 1024;

export class NoKey extends Error {}

// read on every call, so a replaced secret needs no restart
function key(): Buffer {
  const file = process.env.EXAMPREP_HOOK_KEY_FILE ?? '/run/secrets/examprep-hook';
  let k: string;
  try {
    k = readFileSync(/* turbopackIgnore: true */ file, 'utf8').trim();
  } catch {
    throw new NoKey(`no hook key at ${file}`);
  }
  if (k.length < 32) throw new NoKey(`the hook key at ${file} is too short`);
  return Buffer.from(k);
}

export const sign = (k: Buffer | string, timestamp: string, body: string) =>
  'v1=' + createHmac('sha256', k).update(`${timestamp}.${body}`).digest('hex');

export type Checked = { ok: true; account: number } | { ok: false; status: number; error: string };

/** Is this the panel, and which account? */
export function checkDeletion(headers: Headers, body: string, now = Date.now()): Checked {
  if (body.length > MAX_BODY) return { ok: false, status: 413, error: 'too big' };
  const ts = headers.get('x-lfdln-timestamp') ?? '';
  const sig = headers.get('x-lfdln-signature') ?? '';
  if (!/^\d{13}$/.test(ts) || Math.abs(now - Number(ts)) > MAX_SKEW_MS) return { ok: false, status: 401, error: 'stale or missing timestamp' };
  const want = Buffer.from(sign(key(), ts, body));
  const got = Buffer.from(sig);
  if (got.length !== want.length || !timingSafeEqual(got, want)) return { ok: false, status: 401, error: 'bad signature' };
  let b: unknown;
  try { b = JSON.parse(body); } catch { return { ok: false, status: 400, error: 'not JSON' }; }
  const account = (b as { account?: unknown })?.account;
  if (!Number.isSafeInteger(account) || (account as number) < 1) return { ok: false, status: 400, error: 'no account' };
  return { ok: true, account: account as number };
}

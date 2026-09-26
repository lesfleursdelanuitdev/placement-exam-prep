// A signed-in person's progress (NEXTJS-PLAN.md S3-4): GET it, PUT it whole, DELETE it. Guests
// have no privileges here and get 401; the pages keep theirs in the browser (step 4 decides when
// the pages call this). Every answer is no-store: it is one person's.
import { canonical } from '@/lib/progress/rows';
import { db, NotReady } from '@/lib/progress/db';
import { forget, load, save } from '@/lib/progress/store';
import { isJson, mayOwn, sameSite, whoOf, type Who } from '@/lib/progress/who';

export const dynamic = 'force-dynamic';

const MAX_BODY = 1024 * 1024;
const NO_STORE = { 'Cache-Control': 'no-store' };
const answer = (status: number, body: unknown) => Response.json(body, { status, headers: NO_STORE });
const refuse = (status: number, error: string) => answer(status, { error });

// who, and whether they may; a Response when not
function allowed(req: Request, privilege: string, write: boolean): Who | Response {
  const w = whoOf(req.headers);
  if (w.account === null) return refuse(401, 'Sign in to keep your progress.');
  if (!mayOwn(w, privilege)) return refuse(403, "Your account can't do that here.");
  if (write && !sameSite(req.headers)) return refuse(403, 'That came from another site.');
  return w;
}

async function withDb<T>(f: (sql: Awaited<ReturnType<typeof db>>) => Promise<T>): Promise<T | Response> {
  try {
    return await f(await db());
  } catch (e) {
    if (e instanceof NotReady) {
      console.error(`progress: ${e.message}`);
      return refuse(503, "Progress can't be reached just now. It's still saved in this browser.");
    }
    console.error('progress:', e);
    return refuse(503, "Progress can't be reached just now. It's still saved in this browser.");
  }
}

export async function GET(req: Request) {
  const w = allowed(req, 'progress.read', false);
  if (w instanceof Response) return w;
  const r = await withDb((sql) => load(sql, w.account!));
  return r instanceof Response ? r : answer(200, r);
}

export async function PUT(req: Request) {
  const w = allowed(req, 'progress.update', true);
  if (w instanceof Response) return w;
  if (!isJson(req.headers)) return refuse(415, 'Send JSON.');
  const size = Number(req.headers.get('content-length') ?? NaN);
  if (size > MAX_BODY) return refuse(413, 'That is more progress than can be kept.');
  const text = await req.text();
  if (text.length > MAX_BODY) return refuse(413, 'That is more progress than can be kept.');
  let body: unknown;
  try { body = JSON.parse(text); } catch { return refuse(400, "That isn't JSON."); }
  const b = (body && typeof body === 'object' ? body : {}) as { progress?: unknown; import?: unknown };
  const p = canonical(b.progress);
  if (!p) return refuse(400, "That isn't saved progress.");
  const r = await withDb((sql) => save(sql, w.account!, w.username, p, b.import === true));
  if (r instanceof Response) return r;
  // another device saved something newer: the page gets that instead
  return r.ok ? answer(200, r.kept) : answer(409, { error: 'Newer progress was saved from somewhere else.', ...r.stale });
}

export async function DELETE(req: Request) {
  const w = allowed(req, 'progress.delete', true);
  if (w instanceof Response) return w;
  const r = await withDb((sql) => forget(sql, w.account!));
  return r instanceof Response ? r : answer(200, { deleted: r });
}

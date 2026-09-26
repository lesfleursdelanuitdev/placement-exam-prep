// POST /_lfdln/account-deleted (NEXTJS-PLAN.md step 4b): the panel says an account is gone, and
// everything kept for it here goes too. The folder is %5Flfdln because Next.js keeps folders
// starting with _ out of the routes.
import { db, NotReady } from '@/lib/progress/db';
import { checkDeletion, NoKey } from '@/lib/progress/hook';
import { forget } from '@/lib/progress/store';

export const dynamic = 'force-dynamic';

const answer = (status: number, body: unknown) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(req: Request) {
  const text = await req.text();
  let c;
  try {
    c = checkDeletion(req.headers, text);
  } catch (e) {
    if (e instanceof NoKey) { console.error(`account-deleted: ${e.message}`); return answer(503, { error: 'not set up' }); }
    throw e;
  }
  if (!c.ok) return answer(c.status, { error: c.error });
  try {
    const deleted = await forget(await db(), c.account);
    console.log(`account-deleted: account ${c.account}, progress ${deleted ? 'deleted' : 'none kept'}`);
    return answer(200, { ok: true, deleted });
  } catch (e) {
    console.error('account-deleted:', e instanceof NotReady ? e.message : e);
    return answer(503, { error: 'the database is away' });
  }
}

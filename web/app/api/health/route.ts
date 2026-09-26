import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { db } from '@/lib/progress/db';
import { SCHEMA } from '@/lib/progress/schema';

// The container's health check and the panel's (NEXTJS-PLAN.md, Hosting): the server answers,
// and which release it is (the last line of release/BUILD; "unbuilt" when run from a checkout).
// `db` says whether signed-in progress can be reached (S3-6): the database answers with the
// schema this release expects. It never makes `ok` false: guests' pages don't need it, and a
// database down must not restart the container. verify-examprep-next.sh checks it.
export const dynamic = 'force-dynamic';

async function database(): Promise<string> {
  try {
    const sql = await Promise.race([db(), new Promise<never>((_, no) => setTimeout(() => no(new Error('no answer in 3 s')), 3000))]);
    await sql`SELECT 1`;
    return 'ok';
  } catch (e) {
    return (e as Error).message.slice(0, 300);
  }
}

export async function GET() {
  let release = 'unbuilt';
  try {
    release = (await readFile(join(process.cwd(), 'BUILD'), 'utf8')).trim().split('\n').pop() || release;
  } catch {}
  return Response.json({ ok: true, release, db: await database(), schema: SCHEMA.at(-1) }, { headers: { 'Cache-Control': 'no-store' } });
}

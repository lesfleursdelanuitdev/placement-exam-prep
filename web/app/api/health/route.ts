import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// The container's health check and the panel's (NEXTJS-PLAN.md, Hosting): the server answers,
// and which release it is (the last line of release/BUILD; "unbuilt" when run from a checkout).
// Guest-only, so there is no database to ask; step 3 adds it and the schema version.
export const dynamic = 'force-dynamic';

export async function GET() {
  let release = 'unbuilt';
  try {
    release = (await readFile(join(process.cwd(), 'BUILD'), 'utf8')).trim().split('\n').pop() || release;
  } catch {}
  return Response.json({ ok: true, release }, { headers: { 'Cache-Control': 'no-store' } });
}

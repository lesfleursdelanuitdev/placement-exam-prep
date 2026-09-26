// Who is asking (NEXTJS-PLAN.md S3-1). nginx sets these from the panel's gate and clears
// whatever the client sent; the server listens on 127.0.0.1 only, so nothing else reaches it.
// A guest has an empty account and no progress privileges. The app checks privileges (atoms),
// never the role, and `:any` covers `:own` (roles plan R6).
export type Who = { account: number | null; username: string; privileges: Set<string> };

export function whoOf(headers: Headers): Who {
  const raw = (headers.get('x-lfdln-account') ?? '').trim();
  const account = /^[1-9]\d{0,15}$/.test(raw) ? Number(raw) : null;
  const privileges = new Set((headers.get('x-lfdln-privileges') ?? '').split(/[\s,]+/).filter(Boolean));
  return { account, username: (headers.get('x-lfdln-username') ?? '').trim().slice(0, 200), privileges };
}

/** May they do `resource.action` to their own? (`:any` covers `:own`) */
export const mayOwn = (w: Who, privilege: string) =>
  w.privileges.has(`${privilege}:own`) || w.privileges.has(`${privilege}:any`);

/**
 * A write must come from a page of this site: its Origin is this Host over https (http for a
 * test server on 127.0.0.1), and the body is JSON (a form can't send that without a preflight).
 */
export function sameSite(headers: Headers): boolean {
  const origin = headers.get('origin');
  const host = headers.get('host');
  if (!origin || !host) return false;
  const local = /^127\.0\.0\.1(:\d+)?$/.test(host) || /^localhost(:\d+)?$/.test(host);
  return origin === `https://${host}` || (local && origin === `http://${host}`);
}
export const isJson = (headers: Headers) => /^application\/json(;|$)/i.test(headers.get('content-type') ?? '');

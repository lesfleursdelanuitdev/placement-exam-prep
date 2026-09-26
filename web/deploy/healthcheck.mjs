// The container's health check (examprep.container's HealthCmd): the server answers /api/health.
// build.sh copies it into release/, so it is part of the release (and its id).
const r = await fetch(`http://127.0.0.1:${process.env.PORT || 4101}/api/health`, { signal: AbortSignal.timeout(4000) }).catch(() => null);
process.exit(r && r.ok ? 0 : 1);

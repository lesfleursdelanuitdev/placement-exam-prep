// The migrations this release expects the database to have, in order (NEXTJS-PLAN.md S3-5):
// the files in web/migrations/ (test/migrate.test.mjs checks the two agree). The app refuses to
// serve progress on any other list.
export const SCHEMA = ['0001-progress.sql'];

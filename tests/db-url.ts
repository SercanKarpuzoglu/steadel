/** Test database URL: appends `_test` to the configured database name. */
export function testDatabaseUrl(): string {
  const base =
    process.env.DATABASE_URL ??
    "postgres://steadel:steadel@localhost:55432/steadel";
  const url = new URL(base);
  if (!url.pathname.endsWith("_test")) {
    url.pathname = `${url.pathname}_test`;
  }
  return url.toString();
}

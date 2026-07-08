import "dotenv/config";

// Deterministic test-only secrets; integration tests use DATABASE_URL from env.
process.env.APP_ENCRYPTION_KEY ??=
  "0000000000000000000000000000000000000000000000000000000000000000";
process.env.AUTH_SECRET ??= "test-only-secret";
process.env.APP_URL ??= "http://localhost:3000";

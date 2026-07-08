import "dotenv/config";
import { testDatabaseUrl } from "./db-url";

// Point the app's db client at the test database (created in global-setup).
process.env.DATABASE_URL = testDatabaseUrl();

// Deterministic test-only secrets.
process.env.APP_ENCRYPTION_KEY ??=
  "0000000000000000000000000000000000000000000000000000000000000000";
process.env.AUTH_SECRET ??= "test-only-secret";
process.env.APP_URL ??= "http://localhost:3000";

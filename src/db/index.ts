import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  dbClient?: ReturnType<typeof postgres>;
};

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://steadel:steadel@localhost:55432/steadel";

// Reuse the connection across Next.js hot reloads in dev.
const client =
  globalForDb.dbClient ?? postgres(connectionString, { max: 10 });
if (process.env.NODE_ENV !== "production") globalForDb.dbClient = client;

export const db = drizzle(client, { schema });
export { schema };

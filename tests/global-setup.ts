import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { testDatabaseUrl } from "./db-url";

export default async function setup() {
  const base =
    process.env.DATABASE_URL ??
    "postgres://steadel:steadel@localhost:55432/steadel";
  const testUrl = testDatabaseUrl();

  if (testUrl !== base) {
    const dbName = new URL(testUrl).pathname.slice(1);
    const admin = postgres(base, { max: 1 });
    try {
      await admin.unsafe(`CREATE DATABASE "${dbName}"`);
    } catch {
      // already exists
    }
    await admin.end();
  }

  const client = postgres(testUrl, { max: 1 });
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  await client.end();
}

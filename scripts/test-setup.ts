import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

import { databaseEnv } from "./database-env";

export default async function setup(): Promise<void> {
  const client = new pg.Client({
    connectionString: databaseEnv.TEST_DATABASE_URL,
  });
  await client.connect();
  try {
    await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  } finally {
    await client.end();
  }
}

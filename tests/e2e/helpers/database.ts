import pg from "pg";

import { databaseEnv } from "../../../scripts/database-env";

export async function withLocalDatabase<T>(
  run: (client: pg.Client) => Promise<T>,
): Promise<T> {
  const url = new URL(databaseEnv.DATABASE_URL);
  if (!["localhost", "127.0.0.1"].includes(url.hostname))
    throw new Error(
      "Browser test fixtures require the local development database.",
    );
  const client = new pg.Client({ connectionString: databaseEnv.DATABASE_URL });
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import { databaseError } from "./database-error";
import * as schema from "./schema";

function createDatabase(client: pg.Client) {
  return drizzle(client, { schema });
}
export type Database = Omit<ReturnType<typeof createDatabase>, "$client">;

export async function withDatabase<T>(
  binding: Hyperdrive,
  run: (db: Database) => Promise<T>,
): Promise<T> {
  const client = new pg.Client({ connectionString: binding.connectionString });
  await client.connect();
  try {
    return await run(createDatabase(client));
  } catch (error) {
    // Preserve unknown driver failures; translate only known constraints into domain errors.
    const translated = databaseError(error);
    if (translated instanceof Error) throw translated;
    throw new Error("The database request failed.", { cause: error });
  } finally {
    await closeClient(client);
  }
}

async function closeClient(client: pg.Client): Promise<void> {
  // pg-cloudflare 1.4.1 can emit this error while closing an idle, completed client.
  // Capture teardown events; all errors except that exact close event still fail the request.
  let teardownError: Error | undefined;
  client.on("error", (error: Error) => {
    if (error.message !== "This socket has been closed.") teardownError = error;
  });
  await client.end();
  if (teardownError) throw teardownError;
}

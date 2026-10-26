import { desc } from "drizzle-orm";

import { withDatabase } from "./db";
import { validateEnv } from "./env";
import { DomainError } from "./errors";
import { devOutbox } from "./schema/crm";

export function getDevMail(env: Env) {
  if (validateEnv(env).APP_ENV !== "development")
    throw new DomainError("not_found", "That page could not be found.");
  // Development-only inspection of system/auth mail, including mail with no tenant yet.
  return withDatabase(env.DB, (db) =>
    db.select().from(devOutbox).orderBy(desc(devOutbox.createdAt)).limit(100),
  );
}

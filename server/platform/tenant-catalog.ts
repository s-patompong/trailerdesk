import { eq } from "drizzle-orm";

import { withDatabase } from "./db";
import { DomainError } from "./errors";
import { organization } from "./schema/auth";
import { dealershipId } from "./tenant";

import type { Database } from "./db";
import type { DealershipId } from "./tenant";

/** System scheduler directory lookup. Business reads still use a separate tenant context. */
export function dealershipIds(env: Env) {
  return withDatabase(env.DB, (db) =>
    db.select({ id: organization.id }).from(organization),
  );
}

export function withDealership<T>(
  env: Env,
  slug: string,
  cached: boolean,
  run: (db: Database, id: DealershipId, name: string) => Promise<T>,
): Promise<T> {
  return withDatabase(cached ? env.DB_CACHED : env.DB, async (db) => {
    const rows = await db
      .select({ id: organization.id, name: organization.name })
      .from(organization)
      .where(eq(organization.slug, slug))
      .limit(1);
    const store = rows[0];
    if (!store)
      throw new DomainError("not_found", "That dealership could not be found.");
    return run(db, dealershipId(store.id), store.name);
  });
}

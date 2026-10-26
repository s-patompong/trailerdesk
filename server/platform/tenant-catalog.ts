import { and, eq } from "drizzle-orm";

import { withDatabase } from "./db";
import { DomainError } from "./errors";
import { organization } from "./schema/auth";
import { publicForms } from "./schema/forms";
import { dealership } from "./schema/inventory";
import { dealershipId, tenantJoin } from "./tenant";

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

export function withPublicForm<T>(
  env: Env,
  publicKey: string,
  cached: boolean,
  run: (form: PublicFormDirectoryEntry | undefined) => Promise<T> | T,
): Promise<T> {
  return withDatabase(cached ? env.DB_CACHED : env.DB, async (db) => {
    const rows = await db
      .select({
        id: publicForms.id,
        dealershipId: publicForms.dealershipId,
        publicKey: publicForms.publicKey,
        name: publicForms.name,
        heading: publicForms.heading,
        description: publicForms.description,
        submitLabel: publicForms.submitLabel,
        successMessage: publicForms.successMessage,
        allowedOrigins: publicForms.allowedOrigins,
        enabled: publicForms.enabled,
        dealershipName: organization.name,
        phone: dealership.phone,
      })
      .from(publicForms)
      .innerJoin(organization, eq(organization.id, publicForms.dealershipId))
      .innerJoin(
        dealership,
        and(
          tenantJoin(dealership.dealershipId, publicForms.dealershipId),
          eq(dealership.publicSite, true),
        ),
      )
      .where(eq(publicForms.publicKey, publicKey))
      .limit(1);
    return run(rows[0]);
  });
}

interface PublicFormDirectoryEntry {
  id: string;
  dealershipId: string;
  publicKey: string;
  name: string;
  heading: string;
  description: string;
  submitLabel: string;
  successMessage: string;
  allowedOrigins: string[];
  enabled: boolean;
  dealershipName: string;
  phone: string;
}

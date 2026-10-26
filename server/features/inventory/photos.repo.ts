import { asc, desc, eq } from "drizzle-orm";

import { photos } from "../../platform/schema/inventory";
import { tenantWhere } from "../../platform/tenant";

import type { StaffContext } from "../../platform/context";

export async function trailerPhotos(context: StaffContext, id: string) {
  return context.db
    .select()
    .from(photos)
    .where(
      tenantWhere(
        photos.dealershipId,
        context.dealershipId,
        eq(photos.trailerId, id),
      ),
    )
    .orderBy(desc(photos.cover), asc(photos.createdAt));
}
export async function insertPhoto(
  context: StaffContext,
  trailerId: string,
  key: string,
) {
  const existing = await trailerPhotos(context, trailerId);
  await context.db.insert(photos).values({
    id: crypto.randomUUID(),
    dealershipId: context.dealershipId,
    trailerId,
    key,
    cover: existing.length === 0,
  });
}

export async function findPhoto(context: StaffContext, id: string) {
  const rows = await context.db
    .select()
    .from(photos)
    .where(
      tenantWhere(photos.dealershipId, context.dealershipId, eq(photos.id, id)),
    )
    .limit(1);
  return rows[0];
}

export async function coverPhoto(
  context: StaffContext,
  trailerId: string,
  id: string,
) {
  await context.db
    .update(photos)
    .set({ cover: false })
    .where(
      tenantWhere(
        photos.dealershipId,
        context.dealershipId,
        eq(photos.trailerId, trailerId),
      ),
    );
  await context.db
    .update(photos)
    .set({ cover: true })
    .where(
      tenantWhere(
        photos.dealershipId,
        context.dealershipId,
        eq(photos.trailerId, trailerId),
        eq(photos.id, id),
      ),
    );
}

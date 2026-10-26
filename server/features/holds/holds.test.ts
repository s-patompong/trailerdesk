import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { expect, it } from "vitest";

import { withDatabase } from "../../platform/db";
import { organization, user } from "../../platform/schema/auth";
import { customers, devOutbox } from "../../platform/schema/crm";
import { trailers } from "../../platform/schema/inventory";
import { holds } from "../../platform/schema/sales";

import { finishHold } from "./holds.service";

it("replaying an old release does not clear a newer customer hold", async () => {
  const store = crypto.randomUUID();
  const person = crypto.randomUUID();
  const customer = crypto.randomUUID();
  const trailer = crypto.randomUUID();
  const previous = crypto.randomUUID();
  const current = crypto.randomUUID();
  await setupHoldFixture({
    store,
    person,
    customer,
    trailer,
    previous,
    current,
  });
  try {
    const command = {
      dealershipId: store,
      trailerId: trailer,
      holdId: previous,
      reason: "expired",
    };
    await finishHold(env, command);
    await finishHold(env, command);
    await withDatabase(env.DB, async (db) => {
      const rows = await db
        .select()
        .from(trailers)
        .where(eq(trailers.id, trailer));
      expect(rows[0]?.status).toBe("on_hold");
      const active = await db.select().from(holds).where(eq(holds.id, current));
      expect(active[0]?.releasedAt).toBeNull();
      const mail = await db
        .select()
        .from(devOutbox)
        .where(eq(devOutbox.idempotencyKey, `hold-release:${previous}`));
      expect(mail).toHaveLength(1);
    });
  } finally {
    await withDatabase(env.DB, async (db) => {
      await db.delete(devOutbox).where(eq(devOutbox.dealershipId, store));
      await db.delete(holds).where(eq(holds.trailerId, trailer));
      await db.delete(trailers).where(eq(trailers.id, trailer));
      await db.delete(customers).where(eq(customers.id, customer));
      await db.delete(user).where(eq(user.id, person));
      await db.delete(organization).where(eq(organization.id, store));
    });
  }
});

async function setupHoldFixture({
  store,
  person,
  customer,
  trailer,
  previous,
  current,
}: {
  store: string;
  person: string;
  customer: string;
  trailer: string;
  previous: string;
  current: string;
}) {
  await withDatabase(env.DB, async (db) => {
    await db
      .insert(organization)
      .values({ id: store, name: "Hold test dealer", slug: store });
    await db.insert(user).values({
      id: person,
      name: "Hold salesperson",
      email: `${person}@example.test`,
    });
    await db.insert(customers).values({
      id: customer,
      dealershipId: store,
      name: "Hold customer",
      email: `${customer}@example.test`,
    });
    await db.insert(trailers).values({
      id: trailer,
      dealershipId: store,
      vin: "16V1U1110T1100001",
      stockNumber: "HOLD-TEST",
      year: 2026,
      make: "Test",
      model: "Utility",
      type: "utility",
      size: "7x14",
      gvwr: 7000,
      axles: 2,
      hitchType: "bumper_pull",
      doorType: "ramp",
      color: "Black",
      condition: "new",
      lotLocation: "Test",
      askingPriceCents: 500000,
      dealerCostCents: 300000,
      status: "on_hold",
    });
    await db.insert(holds).values([
      {
        id: previous,
        dealershipId: store,
        trailerId: trailer,
        customerId: customer,
        salespersonId: person,
        expiresAt: new Date(Date.now() - 60000),
        releasedAt: new Date(Date.now() - 30000),
      },
      {
        id: current,
        dealershipId: store,
        trailerId: trailer,
        customerId: customer,
        salespersonId: person,
        expiresAt: new Date(Date.now() + 60000),
      },
    ]);
  });
}

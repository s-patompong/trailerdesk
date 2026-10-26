import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { withDatabase } from "../../platform/db";
import { organization } from "../../platform/schema/auth";
import { trailers } from "../../platform/schema/inventory";
import { dealershipId } from "../../platform/tenant";

import { changeTrailer, findTrailer, insertTrailer } from "./inventory.repo";
import { trailerInput } from "./inventory.schemas";

import type { StaffContext } from "../../platform/context";

describe("inventory tenant boundary against Postgres", () => {
  it("cannot read or update another dealership trailer, and never selects cost for Sales", async () => {
    await withDatabase(env.DB, async (db) => {
      const first = crypto.randomUUID();
      const second = crypto.randomUUID();
      await db.insert(organization).values([
        { id: first, name: "First Store", slug: first },
        { id: second, name: "Second Store", slug: second },
      ]);
      const context: StaffContext = {
        db,
        env,
        dealershipId: dealershipId(first),
        userId: "test",
        role: "owner",
      };
      let id: string | undefined;
      try {
        id = await insertTrailer(
          context,
          trailerInput.parse({
            vin: "16V1U1110T1100001",
            stockNumber: "TEST",
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
            lotLocation: "A",
            askingPriceCents: 500000,
            dealerCostCents: 300000,
          }),
        );
        const foreign = { ...context, dealershipId: dealershipId(second) };
        expect(await findTrailer(foreign, id)).toBeUndefined();
        expect(
          await changeTrailer(foreign, id, 1, { askingPriceCents: 1 }),
        ).toEqual([]);
        expect((await findTrailer(context, id))?.askingPriceCents).toBe(500000);
        expect(
          await findTrailer({ ...context, role: "sales" }, id),
        ).not.toHaveProperty("dealerCostCents");
        expect(await findTrailer(context, id)).toHaveProperty(
          "dealerCostCents",
          300000,
        );
      } finally {
        if (id) await db.delete(trailers).where(eq(trailers.id, id));
        await db.delete(organization).where(eq(organization.id, first));
        await db.delete(organization).where(eq(organization.id, second));
      }
    });
  });
});

import { expect } from "@playwright/test";
import { z } from "zod";

import { withLocalDatabase } from "./database";

import type { BrowserContext } from "@playwright/test";

export async function createTestTrailer(
  context: BrowserContext,
): Promise<string> {
  const response = await context.request.post("/api/inventory", {
    data: {
      vin: `16V1U1110T1${String(Date.now() % 1000000).padStart(6, "0")}`,
      stockNumber: `E2E-${crypto.randomUUID()}`,
      year: 2026,
      make: "Test Maker",
      model: "Test equipment",
      type: "equipment",
      size: "7x14",
      gvwr: 14000,
      axles: 2,
      hitchType: "bumper_pull",
      doorType: "none",
      color: "Black",
      condition: "new",
      lotLocation: "Browser test",
      askingPriceCents: 449900,
      dealerCostCents: 300000,
      status: "in_stock",
      description: "Equipment trailer created only by the local browser test.",
    },
  });
  expect(response.status(), await response.text()).toBe(201);
  return z.object({ id: z.uuid() }).parse(await response.json()).id;
}

export async function removeTestTrailer(id: string): Promise<void> {
  await withLocalDatabase(async (db) => {
    await db.query("BEGIN");
    try {
      const rows = await db.query<{ stock_number: string }>(
        "SELECT stock_number FROM trailers WHERE id=$1 AND dealership_id=$2 FOR UPDATE",
        [id, "ridgeline"],
      );
      if (!rows.rows[0]?.stock_number.startsWith("E2E-"))
        throw new Error(
          "Refusing to remove a trailer not owned by this browser test.",
        );
      await db.query(
        "DELETE FROM deals WHERE trailer_id=$1 AND dealership_id=$2",
        [id, "ridgeline"],
      );
      await db.query(
        "DELETE FROM quotes WHERE trailer_id=$1 AND dealership_id=$2",
        [id, "ridgeline"],
      );
      await db.query(
        "DELETE FROM holds WHERE trailer_id=$1 AND dealership_id=$2",
        [id, "ridgeline"],
      );
      await db.query(
        "DELETE FROM chunks WHERE source_type='trailer' AND source_id=$1 AND dealership_id=$2",
        [id, "ridgeline"],
      );
      await db.query(
        "DELETE FROM photos WHERE trailer_id=$1 AND dealership_id=$2",
        [id, "ridgeline"],
      );
      await db.query("DELETE FROM trailers WHERE id=$1 AND dealership_id=$2", [
        id,
        "ridgeline",
      ]);
      await db.query("COMMIT");
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  });
}

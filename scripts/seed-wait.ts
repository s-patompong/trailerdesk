import { setTimeout } from "node:timers/promises";

import type pg from "pg";

export async function waitForSeedInventory(client: pg.Client): Promise<void> {
  const deadline = Date.now() + 180000;
  for (;;) {
    const result = await client.query<{ count: string }>(
      "SELECT count(DISTINCT source_id)::text AS count FROM chunks WHERE source_type = 'trailer' AND source_id = ANY($1::text[])",
      [
        Array.from(
          { length: 44 },
          (_, index) => `trailer-${String(index + 1)}`,
        ),
      ],
    );
    if (result.rows[0]?.count === "44") return;
    if (Date.now() > deadline)
      throw new Error(
        "Inventory search is still indexing. Check Workers AI quota and failed jobs, then rerun the seed.",
      );
    await setTimeout(1000);
  }
}

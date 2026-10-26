import { expect, it } from "vitest";

import { trailerEdit } from "./inventory.schemas";

it("PATCH parsing preserves omissions instead of applying Zod 4 create defaults", () => {
  expect(trailerEdit.parse({ version: 1, status: "on_order" })).toEqual({
    version: 1,
    status: "on_order",
  });
  expect(trailerEdit.parse({ version: 2, askingPriceCents: 500000 })).toEqual({
    version: 2,
    askingPriceCents: 500000,
  });
  expect(trailerEdit.safeParse({ version: 1 }).success).toBe(false);
});

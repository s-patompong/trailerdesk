import { describe, expect, it } from "vitest";

import { can, requirePermission } from "./permissions";

describe("dealership permissions", () => {
  it("denies cost, deletes, user management and settings to Sales", () => {
    for (const permission of [
      "cost.read",
      "inventory.delete",
      "users.manage",
      "settings.manage",
    ] as const) {
      expect(can("sales", permission)).toBe(false);
      expect(() => {
        requirePermission("sales", permission);
      }).toThrow("permission");
    }
    expect(can("sales", "inventory.status")).toBe(true);
    expect(can("sales", "deals.write")).toBe(true);
  });
  it("reserves settings and billing for the owner", () => {
    expect(can("manager", "users.manage")).toBe(true);
    expect(can("manager", "settings.manage")).toBe(false);
    expect(can("manager", "billing.manage")).toBe(false);
    expect(can("owner", "billing.manage")).toBe(true);
  });
});

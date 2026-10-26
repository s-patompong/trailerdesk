import { describe, expect, it } from "vitest";

import { dollarInput, quoteTotals } from "./money";

describe("integer-cent money", () => {
  it("parses dollars exactly and rejects fractions of a cent", () => {
    expect(dollarInput.parse("8499.95")).toBe(849995);
    expect(dollarInput.safeParse("1.001").success).toBe(false);
    expect(dollarInput.safeParse("-2").success).toBe(false);
  });
  it("rounds tax half up using integer arithmetic", () => {
    expect(
      quoteTotals({
        trailerPriceCents: 101,
        options: [],
        docFeeCents: 0,
        deliveryFeeCents: 0,
        tradeInCents: 0,
        taxBps: 500,
      }),
    ).toMatchObject({ taxCents: 5, totalCents: 106 });
    expect(
      quoteTotals({
        trailerPriceCents: 110,
        options: [],
        docFeeCents: 0,
        deliveryFeeCents: 0,
        tradeInCents: 0,
        taxBps: 500,
      }).taxCents,
    ).toBe(6);
  });
  it("includes options and fees, then deducts the trade-in before tax", () => {
    expect(
      quoteTotals({
        trailerPriceCents: 100000,
        options: [{ priceCents: 10000 }],
        docFeeCents: 5000,
        deliveryFeeCents: 2000,
        tradeInCents: 17000,
        taxBps: 625,
      }),
    ).toMatchObject({
      taxableCents: 100000,
      taxCents: 6250,
      totalCents: 106250,
    });
  });
});

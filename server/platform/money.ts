import { z } from "zod";

import { DomainError } from "./errors";

export const cents = z.number().int().min(0).max(100000000);
export const dollarInput = z
  .string()
  .trim()
  .max(12, "Enter an amount under $1,000,000.")
  .regex(/^\d+(\.\d{1,2})?$/, "Enter dollars and cents, such as 8499.00.")
  .transform((value) => {
    const [dollars = "0", fraction = ""] = value.split(".");
    return Number(BigInt(dollars) * 100n + BigInt(fraction.padEnd(2, "0")));
  })
  .pipe(cents);
export function quoteTotals(input: {
  trailerPriceCents: number;
  options: { priceCents: number }[];
  docFeeCents: number;
  deliveryFeeCents: number;
  tradeInCents: number;
  taxBps: number;
}) {
  const subtotal =
    BigInt(cents.parse(input.trailerPriceCents)) +
    input.options.reduce(
      (sum, option) => sum + BigInt(cents.parse(option.priceCents)),
      0n,
    ) +
    BigInt(cents.parse(input.docFeeCents)) +
    BigInt(cents.parse(input.deliveryFeeCents));
  const taxable = subtotal - BigInt(cents.parse(input.tradeInCents));
  if (taxable < 0n)
    throw new DomainError(
      "invalid",
      "The trade-in allowance cannot exceed the quote subtotal.",
    );
  const rate = z.number().int().min(0).max(2000).parse(input.taxBps);
  const tax = (taxable * BigInt(rate) + 5000n) / 10000n;
  if (taxable + tax > 2147483647n)
    throw new DomainError("invalid", "This quote total is too large.");
  return {
    subtotalCents: Number(subtotal),
    taxableCents: Number(taxable),
    taxCents: Number(tax),
    totalCents: Number(taxable + tax),
  };
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value / 100);
}

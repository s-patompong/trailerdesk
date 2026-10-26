import { z } from "zod";

import { cents, dollarInput } from "../../platform/money";

export const quoteInput = z.object({
  trailerId: z.string().min(1, "Choose a trailer."),
  customerId: z.string().min(1, "Choose a customer."),
  options: z
    .array(
      z.object({ name: z.string().trim().min(1).max(60), priceCents: cents }),
    )
    .max(8),
  docFeeCents: cents,
  deliveryFeeCents: cents,
  tradeInCents: cents,
  taxBps: z.number().int().min(0).max(2000),
});
export const quoteForm = quoteInput.extend({
  options: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Name this add-on.").max(60),
        priceCents: dollarInput,
      }),
    )
    .max(8),
  docFeeCents: dollarInput,
  deliveryFeeCents: dollarInput,
  tradeInCents: dollarInput,
  taxBps: dollarInput.pipe(
    z.number().max(2000, "Enter a tax rate of 20% or less."),
  ),
});
export const quoteSnapshot = z.object({
  storeName: z.string(),
  slug: z.string(),
  address: z.string(),
  phone: z.string(),
  customerName: z.string(),
  customerEmail: z.email(),
  trailer: z.string(),
  vin: z.string(),
  stockNumber: z.string(),
});

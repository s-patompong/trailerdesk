import { z } from "zod";

import { cents, dollarInput } from "../../platform/money";
import { roleSchema } from "../../platform/permissions";

export const profileInput = z.object({
  name: z.string().trim().min(1, "Enter the dealership name.").max(120),
  phone: z.string().trim().min(1, "Enter a phone number.").max(40),
  address: z.string().trim().min(1, "Enter the dealership address.").max(300),
  hours: z.string().trim().min(1, "Enter your business hours.").max(500),
  timezone: z.string().refine((value) => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Choose a valid timezone."),
  publicSite: z.boolean(),
  taxBps: z.number().int().min(0).max(2000),
  docFeeCents: cents,
  deliveryFeeCents: cents,
});
export const profileForm = profileInput.extend({
  taxBps: dollarInput.pipe(
    z.number().max(2000, "Enter a tax rate of 20% or less."),
  ),
  docFeeCents: dollarInput,
  deliveryFeeCents: dollarInput,
});
export const staffInvite = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase().max(254),
  role: roleSchema,
});

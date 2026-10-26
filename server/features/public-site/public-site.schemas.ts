import { z } from "zod";

export const publicFilters = z.object({
  q: z.string().trim().max(100).default(""),
  type: z
    .enum([
      "",
      "utility",
      "enclosed",
      "car_hauler",
      "dump",
      "equipment",
      "gooseneck",
      "horse_livestock",
    ])
    .default(""),
  maxPrice: z
    .string()
    .regex(/^\d{0,7}$/, "Enter a whole dollar amount.")
    .default(""),
  sort: z.enum(["newest", "price_low", "price_high"]).default("newest"),
});
export const inquiryInput = z.object({
  requestId: z.uuid(),
  trailerId: z.string().min(1),
  name: z.string().trim().min(1, "Enter your name.").max(120),
  email: z.email("Enter a valid email address.").trim().toLowerCase().max(254),
  phone: z.string().trim().max(40).default(""),
  intent: z.enum(["availability", "quote"]),
  message: z.string().trim().max(4000).default(""),
  turnstileToken: z
    .string()
    .min(1, "Complete the verification before sending.")
    .max(2048),
});
export const inquiryJob = inquiryInput.omit({ turnstileToken: true }).extend({
  kind: z.literal("inquiry"),
  dealershipId: z.string().min(1),
  submittedAt: z.iso.datetime(),
});

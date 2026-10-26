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
const shopperContact = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(120),
  email: z.email("Enter a valid email address.").trim().toLowerCase().max(254),
  phone: z.string().trim().max(40).default(""),
  message: z.string().trim().max(4000).default(""),
});
const turnstileToken = z
  .string()
  .min(1, "Complete the verification before sending.")
  .max(2048);
export const inquiryInput = shopperContact.extend({
  requestId: z.uuid(),
  trailerId: z.string().min(1),
  intent: z.enum(["availability", "quote"]),
  turnstileToken,
});
export const embedInquiryInput = shopperContact.extend({
  requestId: z.uuid(),
  trailerId: z.string().min(1).optional(),
  intent: z.enum(["general", "availability", "quote"]),
  turnstileToken,
});
export const inquiryJob = shopperContact.extend({
  kind: z.literal("inquiry"),
  requestId: z.uuid(),
  dealershipId: z.string().min(1),
  trailerId: z.string().min(1).nullable(),
  intent: z.enum(["general", "availability", "quote"]),
  submittedAt: z.iso.datetime(),
});

const origin = z.url().transform((value, context) => {
  const url = new URL(value);
  if (url.origin !== value || !["http:", "https:"].includes(url.protocol)) {
    context.addIssue({
      code: "custom",
      message: "Use an HTTP origin without a path.",
    });
    return z.NEVER;
  }
  return url.origin;
});
export const publicFormRecord = z.object({
  id: z.string().min(1),
  dealershipId: z.string().min(1),
  publicKey: z.string().min(12).max(100),
  name: z.string().min(1).max(100),
  heading: z.string().min(1).max(120),
  description: z.string().max(500),
  submitLabel: z.string().min(1).max(60),
  successMessage: z.string().min(1).max(300),
  allowedOrigins: z.array(origin).min(1).max(25),
  enabled: z.boolean(),
  dealershipName: z.string().min(1).max(200),
  phone: z.string().max(40),
});
export const publicFormConfiguration = publicFormRecord.pick({
  publicKey: true,
  name: true,
  heading: true,
  description: true,
  submitLabel: true,
  successMessage: true,
  dealershipName: true,
  phone: true,
});

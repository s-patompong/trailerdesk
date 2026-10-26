import { z } from "zod";

import { dollarInput } from "../../platform/money";

const trailerType = z.enum([
  "utility",
  "enclosed",
  "car_hauler",
  "dump",
  "equipment",
  "gooseneck",
  "horse_livestock",
]);
const trailerStatus = z.enum(["in_stock", "on_hold", "sold", "on_order"]);
export const trailerInput = z.object({
  vin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[A-HJ-NPR-Z0-9]{17}$/,
      "Enter a 17-character VIN without I, O or Q.",
    ),
  stockNumber: z
    .string()
    .trim()
    .min(1, "Enter the stock number.")
    .max(40, "Keep the stock number under 41 characters."),
  year: z.coerce
    .number({ error: "Enter the trailer year." })
    .int("Enter a whole year.")
    .min(1900, "Enter a year from 1900 to 2100.")
    .max(2100, "Enter a year from 1900 to 2100."),
  make: z
    .string()
    .trim()
    .min(1, "Enter the trailer make.")
    .max(80, "Keep the make under 81 characters."),
  model: z
    .string()
    .trim()
    .min(1, "Enter the trailer model.")
    .max(100, "Keep the model under 101 characters."),
  type: trailerType,
  size: z
    .string()
    .trim()
    .min(1, "Enter the size, such as 7x14.")
    .max(30, "Keep the size under 31 characters."),
  gvwr: z.coerce
    .number({ error: "Enter GVWR in pounds." })
    .int("Enter GVWR as whole pounds.")
    .min(1, "Enter GVWR from the trailer plate.")
    .max(100000, "Enter a GVWR of 100,000 pounds or less."),
  axles: z.coerce
    .number({ error: "Enter the number of axles." })
    .int("Enter a whole number of axles.")
    .min(1, "Enter 1 to 8 axles.")
    .max(8, "Enter 1 to 8 axles."),
  hitchType: z.enum(["bumper_pull", "gooseneck", "fifth_wheel"]),
  doorType: z.enum(["ramp", "barn", "none"]),
  color: z
    .string()
    .trim()
    .min(1, "Enter the trailer color.")
    .max(40, "Keep the color under 41 characters."),
  condition: z.enum(["new", "used"]),
  lotLocation: z
    .string()
    .trim()
    .min(1, "Enter the lot location.")
    .max(100, "Keep the location under 101 characters."),
  askingPriceCents: z.coerce.number().int().min(0).max(100000000),
  dealerCostCents: z.coerce.number().int().min(0).max(100000000),
  status: z.enum(["in_stock", "on_order"]).default("in_stock"),
  description: z.string().max(10000).default(""),
});
export const inventoryFilters = z.object({
  q: z.string().trim().max(100).default(""),
  type: z.enum(["", ...trailerType.options]).default(""),
  status: z.enum(["", ...trailerStatus.options]).default(""),
  sort: z
    .enum(["newest", "price_low", "price_high", "oldest"])
    .default("newest"),
  view: z.enum(["cards", "table"]).default("cards"),
});
export const trailerEdit = trailerInput
  .partial()
  .extend({
    version: z.number().int().positive(),
    status: trailerInput.shape.status.unwrap().optional(),
    description: trailerInput.shape.description.unwrap().optional(),
  })
  .refine((patch) => Object.keys(patch).some((key) => key !== "version"), {
    error: "Choose at least one trailer detail to update.",
  });

export const trailerFormSchema = trailerInput.extend({
  askingPriceCents: dollarInput,
  dealerCostCents: dollarInput,
});
export const vinResultSchema = z.object({
  vin: z.string(),
  make: z.string(),
  model: z.string(),
  year: z.string(),
  axles: z.string(),
  gvwr: z.string(),
  warning: z.string().nullable(),
});
export const descriptionResultSchema = z.object({
  description: z.string().min(1).max(10000),
});
export const photoSchema = z
  .file({ error: "Choose a photo to upload." })
  .mime(
    ["image/jpeg", "image/png", "image/webp"],
    "Choose a JPG, PNG or WebP photo.",
  )
  .max(8 * 1024 * 1024, "Choose a photo under 8 MB.");

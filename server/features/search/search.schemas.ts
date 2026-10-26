import { z } from "zod";

export const indexJob = z.object({
  kind: z.literal("index"),
  dealershipId: z.string().min(1),
  sourceType: z.enum(["trailer", "document"]),
  sourceId: z.string().min(1),
  version: z.string().min(1).max(100),
});
export const documentInput = z.object({
  title: z.string().trim().min(1, "Enter a document title.").max(120),
  public: z.boolean(),
});
export const documentFile = z
  .file({ error: "Choose a PDF or Markdown document." })
  .max(10 * 1024 * 1024, "Choose a document under 10 MB.")
  .mime([
    "application/pdf",
    "text/markdown",
    "text/plain",
    "text/x-markdown",
    "application/octet-stream",
  ]);
export const askInput = z.object({
  question: z
    .string()
    .trim()
    .min(3, "Ask a question with at least 3 characters.")
    .max(1000, "Keep the question under 1,000 characters."),
});
export const inventoryToolInput = z.object({
  query: z
    .string()
    .max(100)
    .default("")
    .describe(
      "A short specification term such as enclosed or 7x14; omit price and availability phrases.",
    ),
  maxPriceCents: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe(
      "Maximum asking price in US integer cents: $9,000 is 900000 cents.",
    ),
  minDaysOnLot: z.number().int().min(0).max(10000).optional(),
  doorType: z.enum(["ramp", "barn", "none"]).optional(),
});
const citationSchema = z.object({ title: z.string(), url: z.string() });
export const answerSchema = z.object({
  answer: z.string(),
  citations: z.array(citationSchema),
});

import { z } from "zod";

export const noteInput = z.object({
  body: z.string().trim().min(1, "Write a note before saving.").max(10000),
});

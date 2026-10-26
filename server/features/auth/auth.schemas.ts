import { z } from "zod";

export const signInSchema = z.object({
  email: z
    .email("Enter a valid email address.")
    .trim()
    .max(254, "Use an email address under 255 characters."),
  password: z
    .string()
    .min(8, "Enter at least 8 characters.")
    .max(128, "Use a password under 129 characters."),
});

import { z } from "zod";

import { signInSchema } from "./auth.schemas";

export const resetRequest = signInSchema.pick({ email: true });
export const newPassword = signInSchema
  .pick({ password: true })
  .extend({ confirmation: z.string() })
  .refine((input) => input.password === input.confirmation, {
    path: ["confirmation"],
    message: "The passwords must match.",
  });
export const joinInput = signInSchema.extend({
  name: z.string().trim().min(1, "Enter your name.").max(120),
});

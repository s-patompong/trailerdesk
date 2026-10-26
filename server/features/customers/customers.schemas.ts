import { z } from "zod";

export const customerInput = z.object({
  name: z.string().trim().min(1, "Enter the customer name.").max(120),
  email: z.email("Enter a valid email address.").trim().toLowerCase().max(254),
  phone: z.string().trim().max(40).default(""),
});

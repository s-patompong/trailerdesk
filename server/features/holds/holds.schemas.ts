import { z } from "zod";

export const holdRequest = z.object({ customerId: z.string().min(1) });
export const holdCommand = z.object({
  id: z.uuid(),
  dealershipId: z.string().min(1),
  trailerId: z.string().min(1),
  customerId: z.string().min(1),
  salespersonId: z.string().min(1),
  expiresAt: z.number().int().positive(),
});
export const holdRelease = z.object({
  dealershipId: z.string().min(1),
  trailerId: z.string().min(1),
  holdId: z.string().min(1),
  reason: z.enum(["expired", "released", "sold"]),
  actorId: z.string().min(1).default("system"),
});
export const holdExtend = z.object({
  dealershipId: z.string().min(1),
  trailerId: z.string().min(1),
  holdId: z.string().min(1),
  expiresAt: z.number().int().positive(),
});

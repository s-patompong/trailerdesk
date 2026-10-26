import { z } from "zod";

export const closingParams = z.object({
  dealershipId: z.string().min(1),
  dealId: z.string().min(1),
});
export const soldInput = z.object({ quoteId: z.string().min(1) });

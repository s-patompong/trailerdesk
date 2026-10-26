import { z } from "zod";

export const leadStage = z.enum(["new", "contacted", "quoted", "won", "lost"]);
export const leadUpdate = z.object({
  stage: leadStage,
  assignedTo: z.string().min(1, "Choose a salesperson."),
});
export const leadInput = leadUpdate.extend({
  customerId: z.string().min(1, "Choose a customer."),
  trailerId: z.string().min(1).nullable(),
  message: z.string().trim().max(10000).default(""),
});
export const leadFilters = z.object({
  q: z.string().trim().max(100).default(""),
  view: z.enum(["board", "list"]).default("board"),
});

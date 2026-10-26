import { z } from "zod";

export const emailMessage = z.object({
  recipient: z.email(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1),
  idempotencyKey: z.string().min(1),
  dealershipId: z.string().nullable(),
});
export type EmailMessage = z.infer<typeof emailMessage>;
export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

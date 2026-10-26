import { and, eq, isNull } from "drizzle-orm";

import { sha256 } from "./hash";
import { emailDeliveries } from "./schema/email";
import { dealershipId, tenantWhere } from "./tenant";

import type { Database } from "./db";
import type { EmailMessage } from "./email-message";

function deliveryScope(message: EmailMessage) {
  const key = eq(emailDeliveries.idempotencyKey, message.idempotencyKey);
  return message.dealershipId
    ? tenantWhere(
        emailDeliveries.dealershipId,
        dealershipId(message.dealershipId),
        key,
      )
    : and(isNull(emailDeliveries.dealershipId), key);
}
export async function deliverOnce(
  db: Database,
  message: EmailMessage,
  deliver: () => Promise<string>,
): Promise<void> {
  const contentHash = await sha256(JSON.stringify(message));
  await db
    .insert(emailDeliveries)
    .values({
      idempotencyKey: message.idempotencyKey,
      dealershipId: message.dealershipId,
      contentHash,
    })
    .onConflictDoNothing();
  await db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(emailDeliveries)
      .where(deliveryScope(message))
      .for("update")
      .limit(1);
    const record = rows[0];
    if (!record) throw new Error("This email delivery could not be found.");
    if (record.sentAt) return;
    if (record.contentHash !== contentHash)
      throw new Error(
        "This email changed during a retry. Review it before sending again.",
      );
    // A provider may have accepted mail before a process stopped. Resend retains keys for 24 hours.
    if (Date.now() - record.createdAt.getTime() > 23 * 60 * 60 * 1000)
      throw new Error(
        "This email delivery needs review before another attempt.",
      );
    const providerId = await deliver();
    await tx
      .update(emailDeliveries)
      .set({ sentAt: new Date(), providerId })
      .where(deliveryScope(message));
  });
}

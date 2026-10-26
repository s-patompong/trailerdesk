import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { organization } from "./auth";

export const emailDeliveries = pgTable("email_deliveries", {
  idempotencyKey: text("idempotency_key").primaryKey(),
  dealershipId: text("dealership_id").references(() => organization.id),
  contentHash: text("content_hash").notNull(),
  providerId: text("provider_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { organization, user } from "./auth";
import { trailers } from "./inventory";

const tenant = () =>
  text("dealership_id")
    .notNull()
    .references(() => organization.id);
const created = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
export const customers = pgTable(
  "customers",
  {
    id: text("id").primaryKey(),
    dealershipId: tenant(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull().default(""),
    createdAt: created(),
  },
  (table) => [
    uniqueIndex("customer_tenant_email_idx").on(
      table.dealershipId,
      table.email,
    ),
  ],
);
export const leads = pgTable(
  "leads",
  {
    id: text("id").primaryKey(),
    dealershipId: tenant(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),
    trailerId: text("trailer_id").references(() => trailers.id),
    assignedTo: text("assigned_to").references(() => user.id),
    stage: text("stage").notNull().default("new"),
    message: text("message").notNull().default(""),
    stale: boolean("stale").notNull().default(false),
    sourceKey: text("source_key").notNull(),
    createdAt: created(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("lead_tenant_source_idx").on(
      table.dealershipId,
      table.sourceKey,
    ),
    index("lead_tenant_stage_idx").on(table.dealershipId, table.stage),
  ],
);
export const notes = pgTable("notes", {
  id: text("id").primaryKey(),
  dealershipId: tenant(),
  customerId: text("customer_id").references(() => customers.id),
  leadId: text("lead_id").references(() => leads.id),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id),
  body: text("body").notNull(),
  createdAt: created(),
});
export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  dealershipId: tenant(),
  actorId: text("actor_id"),
  action: text("action").notNull(),
  recordId: text("record_id").notNull(),
  details: text("details").notNull(),
  createdAt: created(),
});
export const devOutbox = pgTable("dev_outbox", {
  id: text("id").primaryKey(),
  dealershipId: text("dealership_id").references(() => organization.id),
  recipient: text("recipient").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  createdAt: created(),
});

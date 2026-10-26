import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { organization } from "./auth";

export const publicForms = pgTable(
  "public_forms",
  {
    id: text("id").primaryKey(),
    dealershipId: text("dealership_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    publicKey: text("public_key").notNull().unique(),
    name: text("name").notNull(),
    heading: text("heading").notNull(),
    description: text("description").notNull(),
    submitLabel: text("submit_label").notNull().default("Send inquiry"),
    successMessage: text("success_message")
      .notNull()
      .default("Thanks! The dealership will be in touch."),
    allowedOrigins: jsonb("allowed_origins").$type<string[]>().notNull(),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("public_forms_tenant_idx").on(table.dealershipId)],
);

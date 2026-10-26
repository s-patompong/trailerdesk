import { sql } from "drizzle-orm";
import {
  check,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { organization, user } from "./auth";
import { customers } from "./crm";
import { trailers } from "./inventory";

const tenant = () =>
  text("dealership_id")
    .notNull()
    .references(() => organization.id);
const time = (name: string) => timestamp(name, { withTimezone: true });
export const holds = pgTable(
  "holds",
  {
    id: text("id").primaryKey(),
    dealershipId: tenant(),
    trailerId: text("trailer_id")
      .notNull()
      .references(() => trailers.id),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),
    salespersonId: text("salesperson_id")
      .notNull()
      .references(() => user.id),
    expiresAt: time("expires_at").notNull(),
    releasedAt: time("released_at"),
    createdAt: time("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("one_active_hold")
      .on(table.trailerId)
      .where(sql`${table.releasedAt} IS NULL`),
  ],
);
export const quotes = pgTable(
  "quotes",
  {
    id: text("id").primaryKey(),
    dealershipId: tenant(),
    trailerId: text("trailer_id")
      .notNull()
      .references(() => trailers.id),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),
    salespersonId: text("salesperson_id")
      .notNull()
      .references(() => user.id),
    trailerPriceCents: integer("trailer_price_cents").notNull(),
    options: jsonb("options")
      .$type<{ name: string; priceCents: number }[]>()
      .notNull(),
    docFeeCents: integer("doc_fee_cents").notNull(),
    deliveryFeeCents: integer("delivery_fee_cents").notNull(),
    tradeInCents: integer("trade_in_cents").notNull(),
    taxBps: integer("tax_bps").notNull(),
    taxCents: integer("tax_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    pdfToken: text("pdf_token").notNull().unique(),
    snapshot: jsonb("snapshot")
      .$type<{
        storeName: string;
        slug: string;
        address: string;
        phone: string;
        customerName: string;
        customerEmail: string;
        trailer: string;
        vin: string;
        stockNumber: string;
      }>()
      .notNull(),
    pdfKey: text("pdf_key"),
    createdAt: time("created_at").notNull().defaultNow(),
  },
  (table) => [check("quote_total_nonnegative", sql`${table.totalCents} >= 0`)],
);
export const deals = pgTable(
  "deals",
  {
    id: text("id").primaryKey(),
    dealershipId: tenant(),
    quoteId: text("quote_id")
      .notNull()
      .references(() => quotes.id),
    trailerId: text("trailer_id")
      .notNull()
      .references(() => trailers.id),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),
    salespersonId: text("salesperson_id")
      .notNull()
      .references(() => user.id),
    totalCents: integer("total_cents").notNull(),
    status: text("status").notNull().default("closing"),
    workflowId: text("workflow_id").notNull(),
    progress: text("progress").notNull().default("Starting"),
    billKey: text("bill_key"),
    closedAt: time("closed_at"),
    createdAt: time("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("deal_quote_once").on(table.dealershipId, table.quoteId),
  ],
);

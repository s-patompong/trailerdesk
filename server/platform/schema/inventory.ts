import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { organization } from "./auth";

export const dealership = pgTable("dealership", {
  dealershipId: text("dealership_id")
    .primaryKey()
    .references(() => organization.id),
  phone: text("phone").notNull().default(""),
  address: text("address").notNull().default(""),
  hours: text("hours").notNull().default(""),
  timezone: text("timezone").notNull().default("America/Chicago"),
  publicSite: boolean("public_site").notNull().default(false),
  taxBps: integer("tax_bps").notNull().default(625),
  docFeeCents: integer("doc_fee_cents").notNull().default(15000),
  deliveryFeeCents: integer("delivery_fee_cents").notNull().default(0),
});
export const trailers = pgTable(
  "trailers",
  {
    id: text("id").primaryKey(),
    dealershipId: text("dealership_id")
      .notNull()
      .references(() => organization.id),
    vin: text("vin").notNull(),
    stockNumber: text("stock_number").notNull(),
    year: integer("year").notNull(),
    make: text("make").notNull(),
    model: text("model").notNull(),
    type: text("type").notNull(),
    size: text("size").notNull(),
    gvwr: integer("gvwr").notNull(),
    axles: integer("axles").notNull(),
    hitchType: text("hitch_type").notNull(),
    doorType: text("door_type").notNull(),
    color: text("color").notNull(),
    condition: text("condition").notNull(),
    lotLocation: text("lot_location").notNull(),
    askingPriceCents: integer("asking_price_cents").notNull(),
    dealerCostCents: integer("dealer_cost_cents").notNull(),
    status: text("status").notNull().default("in_stock"),
    description: text("description").notNull().default(""),
    arrivedAt: timestamp("arrived_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    agingBand: integer("aging_band").notNull().default(0),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("trailer_stock_tenant_idx").on(
      table.dealershipId,
      table.stockNumber,
    ),
    uniqueIndex("trailer_vin_tenant_idx").on(table.dealershipId, table.vin),
    index("trailers_tenant_status_idx").on(table.dealershipId, table.status),
    check(
      "trailer_prices_nonnegative",
      sql`${table.askingPriceCents} >= 0 AND ${table.dealerCostCents} >= 0`,
    ),
  ],
);
export const photos = pgTable(
  "photos",
  {
    id: text("id").primaryKey(),
    dealershipId: text("dealership_id")
      .notNull()
      .references(() => organization.id),
    trailerId: text("trailer_id")
      .notNull()
      .references(() => trailers.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    cover: boolean("cover").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("photos_tenant_trailer_idx").on(table.dealershipId, table.trailerId),
  ],
);

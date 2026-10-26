import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  vector,
} from "drizzle-orm/pg-core";

import { organization } from "./auth";

const tenant = () =>
  text("dealership_id")
    .notNull()
    .references(() => organization.id);
const time = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const tsvector = customType<{ data: string }>({ dataType: () => "tsvector" });
export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  dealershipId: tenant(),
  title: text("title").notNull(),
  key: text("key").notNull(),
  public: boolean("public").notNull().default(false),
  contentHash: text("content_hash").notNull(),
  status: text("status").notNull().default("queued"),
  createdAt: time(),
});
export const chunks = pgTable(
  "chunks",
  {
    id: text("id").primaryKey(),
    dealershipId: tenant(),
    sourceType: text("source_type").notNull(),
    sourceId: text("source_id").notNull(),
    sourceVersion: text("source_version").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    public: boolean("public").notNull(),
    position: integer("position").notNull(),
    embedding: vector("embedding", { dimensions: 768 }).notNull(),
    search: tsvector("search").generatedAlwaysAs(
      sql`to_tsvector('english', content)`,
    ),
    createdAt: time(),
  },
  (table) => [
    uniqueIndex("chunk_source_position").on(
      table.dealershipId,
      table.sourceType,
      table.sourceId,
      table.position,
    ),
    index("chunks_vector_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
    index("chunks_search_idx").using("gin", table.search),
  ],
);
export const failedJobs = pgTable("failed_jobs", {
  id: text("id").primaryKey(),
  dealershipId: tenant(),
  kind: text("kind").notNull(),
  payload: jsonb("payload").$type<unknown>().notNull(),
  error: text("error").notNull(),
  retriedAt: timestamp("retried_at", { withTimezone: true }),
  createdAt: time(),
});
export const processedJobs = pgTable("processed_jobs", {
  id: text("id").primaryKey(),
  dealershipId: tenant(),
  kind: text("kind").notNull(),
  createdAt: time(),
});

import { defineConfig } from "drizzle-kit";

import { databaseEnv } from "./scripts/database-env.ts";

export default defineConfig({
  dialect: "postgresql",
  schema: "./server/platform/schema/*.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseEnv.DATABASE_URL,
  },
  strict: true,
  verbose: true,
});

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const postgresUrl = z
  .url()
  .refine(
    (value) => ["postgres:", "postgresql:"].includes(new URL(value).protocol),
    "Use a Postgres connection URL.",
  );
export const databaseEnv = createEnv({
  server: {
    DATABASE_URL: postgresUrl.default(
      "postgres://trailerdesk:trailerdesk_local@localhost:5440/trailerdesk",
    ),
    TEST_DATABASE_URL: postgresUrl
      .default(
        "postgres://trailerdesk:trailerdesk_local@localhost:5440/trailerdesk_test",
      )
      .refine((value) => {
        const url = new URL(value);
        return (
          ["localhost", "127.0.0.1"].includes(url.hostname) &&
          url.pathname.endsWith("_test")
        );
      }, "Tests must use a local database whose name ends in _test."),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  onValidationError: () => {
    throw new Error(
      "Check DATABASE_URL and TEST_DATABASE_URL. Tests require a separate local test database.",
    );
  },
});

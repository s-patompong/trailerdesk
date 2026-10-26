import { builtinModules } from "node:module";

import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

import { databaseEnv } from "./scripts/database-env.ts";

export default defineConfig({
  plugins: [
    cloudflareTest({
      remoteBindings: false,
      miniflare: {
        compatibilityDate: "2026-10-19",
        compatibilityFlags: ["nodejs_compat"],
        bindings: {
          APP_ENV: "test",
          APP_URL: "http://localhost:5174",
          BETTER_AUTH_SECRET: "test-only-secret-for-isolated-workers-tests",
          EMAIL_FROM: "mail@trailerdesk.test",
          EMAIL_DRIVER: "outbox",
          MAILPIT_URL: "http://127.0.0.1:18025",
          LLM_PROVIDER: "workers-ai",
          DEMO_FAST_TIME: "true",
          TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
          TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
        },
        hyperdrives: {
          DB: databaseEnv.TEST_DATABASE_URL,
        },
      },
    }),
  ],
  test: {
    deps: {
      optimizer: {
        ssr: {
          enabled: true,
          include: ["pg", "resend"],
          rolldownOptions: {
            external: [
              ...builtinModules,
              ...builtinModules.map((name) => `node:${name}`),
            ],
          },
        },
      },
    },
    server: {
      deps: {
        inline: [
          "pg",
          "pg-pool",
          "pg-protocol",
          "pg-types",
          "pg-connection-string",
        ],
      },
    },
    globalSetup: ["./scripts/test-setup.ts"],
    include: ["server/**/*.test.ts"],
    testTimeout: 30000,
  },
});

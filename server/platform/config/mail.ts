import { mailDefaults } from "./defaults";

import type { RuntimeEnv } from "../env";

export function mailConfiguration(env: RuntimeEnv) {
  return {
    driver: env.EMAIL_DRIVER ?? mailDefaults[env.APP_ENV],
    from: env.EMAIL_FROM,
    mailpit: { url: env.MAILPIT_URL },
    mailtrap: {
      token: env.MAILTRAP_API_TOKEN,
      inboxId: env.MAILTRAP_INBOX_ID,
      sandbox: true as const,
    },
    resend: { apiKey: env.RESEND_API_KEY },
  };
}

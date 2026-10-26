import { validateEnv } from "../env";

import { aiConfiguration } from "./ai";
import { featureConfiguration } from "./features";
import { mailConfiguration } from "./mail";

export function configuration(input: unknown) {
  const env = validateEnv(input);
  return {
    app: {
      environment: env.APP_ENV,
      url: env.APP_URL,
      adminUrl: env.ADMIN_APP_URL,
      publicUrl: env.PUBLIC_APP_URL,
      demoFastTime: env.DEMO_FAST_TIME,
    },
    auth: {
      secret: env.BETTER_AUTH_SECRET,
      adminSecret: env.ADMIN_AUTH_SECRET,
      googleClientId: env.GOOGLE_CLIENT_ID,
      googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    turnstile: {
      siteKey: env.TURNSTILE_SITE_KEY,
      secretKey: env.TURNSTILE_SECRET_KEY,
    },
    mail: mailConfiguration(env),
    ai: aiConfiguration(env),
    features: featureConfiguration(env),
  };
}

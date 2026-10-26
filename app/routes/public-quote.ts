import { env } from "cloudflare:workers";

import { readQuotePdf } from "../../server/features/quotes/quotes.service";
import { throwHttpError } from "../../server/platform/errors";

import type { Route } from "./+types/public-quote";

export async function loader({ params }: Route.LoaderArgs) {
  try {
    return await readQuotePdf(env, params.slug, params.token);
  } catch (error) {
    return throwHttpError(error);
  }
}

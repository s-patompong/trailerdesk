import { env } from "cloudflare:workers";

import { readBill } from "../../server/features/deals/deals.service";
import { throwHttpError } from "../../server/platform/errors";

import type { Route } from "./+types/public-bill";

export async function loader({ params }: Route.LoaderArgs) {
  try {
    return await readBill(env, params.slug, params.token);
  } catch (error) {
    return throwHttpError(error);
  }
}

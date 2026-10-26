import { env } from "cloudflare:workers";

import { readPublicDocument } from "../../server/features/search/indexing.service";
import { throwHttpError } from "../../server/platform/errors";

import type { Route } from "./+types/public-document";

export async function loader({ params }: Route.LoaderArgs) {
  try {
    return await readPublicDocument(env, params.slug, params.id);
  } catch (error) {
    return throwHttpError(error);
  }
}

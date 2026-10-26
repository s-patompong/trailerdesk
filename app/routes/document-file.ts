import { env } from "cloudflare:workers";

import { readDocument } from "../../server/features/search/indexing.service";
import { throwHttpError } from "../../server/platform/errors";

import type { Route } from "./+types/document-file";

export async function loader({ request, params }: Route.LoaderArgs) {
  try {
    return await readDocument(request, env, params.id);
  } catch (error) {
    return throwHttpError(error);
  }
}

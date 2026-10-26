import { env } from "cloudflare:workers";

import { completeSocialSignIn } from "../../server/platform/session";

import type { Route } from "./+types/auth-complete";

export function loader({ request }: Route.LoaderArgs) {
  return completeSocialSignIn(request, env);
}

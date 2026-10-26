import { withDatabase } from "./db";
import { createPlatformAuth } from "./platform-auth";

export function platformAuthInfo(request: Request, env: Env) {
  return withDatabase(env.DB, async (db) => {
    const session = await createPlatformAuth(env, db).api.getSession({
      headers: request.headers,
    });
    return { user: session?.user ?? null };
  });
}

export function handlePlatformAuth(request: Request, env: Env) {
  return withDatabase(env.DB, (db) =>
    createPlatformAuth(env, db).handler(request),
  );
}

export function platformSignIn(
  request: Request,
  env: Env,
  credentials: { email: string; password: string },
): Promise<Response> {
  return withDatabase(env.DB, async (db) => {
    const auth = createPlatformAuth(env, db);
    const url = new URL("/api/admin-auth/sign-in/email", request.url);
    const headers = new Headers(request.headers);
    headers.set("Content-Type", "application/json");
    headers.delete("Content-Length");
    const result = await auth.handler(
      new Request(url, {
        method: "POST",
        headers,
        body: JSON.stringify(credentials),
      }),
    );
    if (!result.ok) return result;
    const responseHeaders = new Headers({ Location: "/admin" });
    for (const cookie of result.headers.getSetCookie())
      responseHeaders.append("Set-Cookie", cookie);
    return new Response(null, { status: 302, headers: responseHeaders });
  });
}

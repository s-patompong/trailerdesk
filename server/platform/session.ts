import { createAuth } from "./auth";
import { configuration } from "./config";
import { withDatabase } from "./db";

export function authInfo(request: Request, env: Env) {
  return withDatabase(env.DB, async (db) => {
    const auth = createAuth(env, db);
    const session = await auth.api.getSession({ headers: request.headers });
    const organizations = session
      ? await auth.api.listOrganizations({ headers: request.headers })
      : [];
    const config = configuration(env);
    const membership = session?.session.activeOrganizationId
      ? await auth.api.getActiveMember({ headers: request.headers })
      : null;
    return {
      user: session?.user ?? null,
      role: membership?.role ?? null,
      activeOrganizationId: session?.session.activeOrganizationId ?? null,
      organizations,
      googleEnabled: Boolean(
        config.auth.googleClientId && config.auth.googleClientSecret,
      ),
    };
  });
}

export async function signIn(
  request: Request,
  env: Env,
  credentials: { email: string; password: string },
): Promise<Response> {
  return withDatabase(env.DB, async (db) => {
    const auth = createAuth(env, db);
    // User-submitted credentials must use the handler: auth.api bypasses rate limiting.
    const signInUrl = new URL("/api/auth/sign-in/email", request.url);
    const signInHeaders = new Headers(request.headers);
    signInHeaders.set("Content-Type", "application/json");
    signInHeaders.delete("Content-Length");
    const result = await auth.handler(
      new Request(signInUrl, {
        method: "POST",
        headers: signInHeaders,
        body: JSON.stringify(credentials),
      }),
    );
    if (!result.ok) return result;
    const cookies = result.headers.getSetCookie();
    const headers = new Headers(request.headers);
    headers.set(
      "cookie",
      cookies.map((cookie) => cookie.split(";")[0]).join("; "),
    );
    const organizations = await auth.api.listOrganizations({ headers });
    const first = organizations[0];
    const responseHeaders = new Headers({
      Location: first ? "/inventory" : "/accept-invitation",
    });
    for (const cookie of cookies) responseHeaders.append("Set-Cookie", cookie);
    if (first) {
      const active = await auth.api.setActiveOrganization({
        headers,
        body: { organizationId: first.id },
        asResponse: true,
      });
      if (!active.ok) return active;
      for (const cookie of active.headers.getSetCookie())
        responseHeaders.append("Set-Cookie", cookie);
    }
    return new Response(null, { status: 302, headers: responseHeaders });
  });
}

export function pendingInvitations(request: Request, env: Env) {
  return withDatabase(env.DB, async (db) => {
    const auth = createAuth(env, db);
    const session = await auth.api.getSession({ headers: request.headers });
    return session?.user.emailVerified
      ? auth.api.listUserInvitations({ headers: request.headers })
      : [];
  });
}
export function completeSocialSignIn(request: Request, env: Env) {
  return withDatabase(env.DB, async (db) => {
    const auth = createAuth(env, db);
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session)
      return new Response(null, {
        status: 302,
        headers: { Location: "/login" },
      });
    const stores = await auth.api.listOrganizations({
      headers: request.headers,
    });
    const first = stores[0];
    if (!first)
      return new Response(null, {
        status: 302,
        headers: { Location: "/accept-invitation" },
      });
    const selected = await auth.api.setActiveOrganization({
      headers: request.headers,
      body: { organizationId: first.id },
      asResponse: true,
    });
    if (!selected.ok) return selected;
    const headers = new Headers({ Location: "/inventory" });
    for (const cookie of selected.headers.getSetCookie())
      headers.append("Set-Cookie", cookie);
    return new Response(null, { status: 302, headers });
  });
}

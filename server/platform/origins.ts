import { configuration } from "./config";

type Surface = "admin" | "public" | "shared" | "staff";

const publicPaths = [
  "/d/",
  "/embed/",
  "/embed-demo.html",
  "/api/public/",
  "/api/ask/shopper/",
];
const sharedPaths = [
  "/assets/",
  "/@",
  "/node_modules/",
  "/app/",
  "/__vite",
  "/__manifest",
  "/favicon",
];

export function requestSurface(pathname: string): Surface {
  if (isAdminPath(pathname)) return "admin";
  if (pathname === "/") return "public";
  if (
    publicPaths.some(
      (prefix) =>
        pathname === prefix.slice(0, -1) || pathname.startsWith(prefix),
    )
  )
    return "public";
  return sharedPaths.some((prefix) => pathname.startsWith(prefix))
    ? "shared"
    : "staff";
}

function isAdminPath(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/admin.") ||
    pathname === "/api/admin-auth" ||
    pathname.startsWith("/api/admin-auth/")
  );
}

export function canonicalOriginResponse(
  request: Request,
  env: Env,
): Response | null {
  const config = configuration(env);
  const requestUrl = new URL(request.url);
  const privateRoot = privateRootResponse(request, requestUrl, config.app);
  if (privateRoot) return privateRoot;
  const surface = requestSurface(requestUrl.pathname);
  const acceptedOrigins = [
    config.app.adminUrl,
    config.app.url,
    config.app.publicUrl,
  ].map((url) => new URL(url).origin);
  if (
    isRealmSharedPage(requestUrl.pathname) &&
    [config.app.adminUrl, config.app.url]
      .map((url) => new URL(url).origin)
      .includes(requestUrl.origin)
  )
    return null;
  if (surface === "shared" && acceptedOrigins.includes(requestUrl.origin))
    return null;
  const expectedOrigin =
    surface === "admin"
      ? config.app.adminUrl
      : surface === "public"
        ? config.app.publicUrl
        : config.app.url;
  if (requestUrl.origin === new URL(expectedOrigin).origin) return null;

  if (request.method !== "GET" && request.method !== "HEAD")
    return Response.json(
      {
        error: "Please resend this request from the correct TrailerDesk site.",
      },
      { status: 421 },
    );

  const destination = new URL(expectedOrigin);
  destination.pathname = requestUrl.pathname;
  destination.search = requestUrl.search;
  return temporaryRedirect(destination);
}

function privateRootResponse(
  request: Request,
  requestUrl: URL,
  app: { adminUrl: string; url: string },
): Response | null {
  if (
    requestUrl.pathname !== "/" ||
    (request.method !== "GET" && request.method !== "HEAD")
  )
    return null;
  const privateOrigins = [app.adminUrl, app.url].map(
    (url) => new URL(url).origin,
  );
  if (!privateOrigins.includes(requestUrl.origin)) return null;
  const destination = new URL(requestUrl.origin);
  destination.pathname = "/login";
  return temporaryRedirect(destination);
}

function temporaryRedirect(destination: URL): Response {
  return new Response(null, {
    status: 307,
    headers: {
      "Cache-Control": "no-store",
      Location: destination.href,
    },
  });
}

function isRealmSharedPage(pathname: string): boolean {
  return ["/login", "/reset-password"].some(
    (path) => pathname === path || pathname.startsWith(`${path}.`),
  );
}

export function isAdminOrigin(request: Request, env: Env): boolean {
  return (
    new URL(request.url).origin ===
    new URL(configuration(env).app.adminUrl).origin
  );
}

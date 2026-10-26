import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigation,
} from "react-router";
import { z } from "zod";

import { PageError } from "./components/layout/page-error";
import { Skeleton } from "./components/ui/skeleton";

import type { Route } from "./+types/root";
import "./app.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const navigation = useNavigation();
  return (
    <>
      {navigation.state !== "idle" && (
        <div role="status" className="fixed inset-x-0 top-0 z-50">
          <Skeleton className="h-1 w-full rounded-none bg-primary/60" />
          <span className="sr-only">Loading dealership page…</span>
        </div>
      )}
      <Outlet />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = "We could not open this page";
  let detail =
    "Please refresh and try again. If the problem continues, contact your dealership owner.";
  if (isRouteErrorResponse(error)) {
    title =
      error.status === 404
        ? "This page could not be found"
        : error.status === 403
          ? "You do not have access to this page"
          : title;
    const parsed = z.object({ error: z.string() }).safeParse(error.data);
    detail = parsed.success
      ? parsed.data.error
      : error.status === 404
        ? "Check the link or return to TrailerDesk."
        : detail;
  }
  return <PageError title={title} detail={detail} />;
}

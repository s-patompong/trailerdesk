import { env } from "cloudflare:workers";
import { useEffect } from "react";
import { Link, redirect, useRevalidator } from "react-router";

import { getDocuments } from "../../server/features/search/indexing.service";
import { authInfo } from "../../server/platform/session";
import { DocumentUpload } from "../components/documents/document-upload";
import { StaffShell } from "../components/layout/staff-shell";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import type { Route } from "./+types/documents";

export async function loader({ request }: Route.LoaderArgs) {
  const info = await authInfo(request, env);
  if (!info.user) return redirect("/login");
  return { ...info, documents: await getDocuments(request, env) };
}
export default function Documents({ loaderData }: Route.ComponentProps) {
  const preparing = loaderData.documents.some((doc) => doc.status === "queued");
  const { revalidate } = useRevalidator();
  useEffect(() => {
    if (!preparing) return;
    const timer = setInterval(() => {
      void revalidate();
    }, 3000);
    return () => {
      clearInterval(timer);
    };
  }, [preparing, revalidate]);
  return (
    <StaffShell
      stores={loaderData.organizations}
      activeId={loaderData.activeOrganizationId}
      role={loaderData.role}
    >
      <h1 className="text-3xl font-semibold">Dealership documents</h1>
      <p className="mt-2 mb-6 text-muted-foreground">
        Warranty, financing and delivery information your team can search.
      </p>
      {loaderData.role !== "sales" && <DocumentUpload />}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {loaderData.documents.map((doc) => (
          <Card key={doc.id}>
            <CardHeader>
              <CardTitle>
                <Link
                  to={`/documents/${doc.id}`}
                  className="hover:text-primary"
                >
                  {doc.title}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {doc.public ? "Public" : "Management only"}
              </Badge>
              <Badge variant="outline">
                {doc.status === "ready"
                  ? "Ready to search"
                  : doc.status === "failed"
                    ? "Needs attention"
                    : "Preparing for search"}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
      {!loaderData.documents.length && (
        <p className="mt-8 text-muted-foreground">
          No documents have been uploaded yet.
        </p>
      )}
    </StaffShell>
  );
}

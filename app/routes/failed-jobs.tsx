import { env } from "cloudflare:workers";
import { redirect } from "react-router";

import { getFailedJobs } from "../../server/features/jobs/jobs.service";
import { throwHttpError } from "../../server/platform/errors";
import { authInfo } from "../../server/platform/session";
import { StaffShell } from "../components/layout/staff-shell";
import { RetryJob } from "../components/settings/retry-job";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import type { Route } from "./+types/failed-jobs";

export async function loader({ request }: Route.LoaderArgs) {
  const info = await authInfo(request, env);
  if (!info.user) return redirect("/login");
  try {
    return { ...info, jobs: await getFailedJobs(request, env) };
  } catch (error) {
    return throwHttpError(error);
  }
}
export default function FailedJobs({ loaderData: d }: Route.ComponentProps) {
  return (
    <StaffShell
      stores={d.organizations}
      activeId={d.activeOrganizationId}
      role={d.role}
    >
      <h1 className="text-3xl font-semibold">Failed jobs</h1>
      <p className="mt-2 text-muted-foreground">
        Review background work that needs another attempt.
      </p>
      <div className="mt-6 space-y-4">
        {d.jobs.map((job) => (
          <Card key={job.id} data-job-id={job.id}>
            <CardHeader>
              <CardTitle>
                {job.kind === "index"
                  ? "Prepare document search"
                  : "Process inquiry"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{job.error}</p>
              {job.retriedAt ? (
                <Badge variant="secondary">Sent for another attempt</Badge>
              ) : (
                <RetryJob id={job.id} />
              )}
            </CardContent>
          </Card>
        ))}
        {!d.jobs.length && (
          <Card>
            <CardHeader>
              <CardTitle>Everything is caught up</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              No failed jobs need your attention.
            </CardContent>
          </Card>
        )}
      </div>
    </StaffShell>
  );
}

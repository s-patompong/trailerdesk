import { z } from "zod";

import { withStaff, withSystem } from "../../platform/context";
import { DomainError } from "../../platform/errors";
import { requirePermission } from "../../platform/permissions";
import { markIndexFailure } from "../search/indexing.service";

import {
  findFailedJob,
  insertFailedJob,
  listFailedJobs,
  markRetried,
} from "./jobs.repo";

const envelope = z.object({
  dealershipId: z.string().min(1),
  kind: z.string().min(1).max(50),
});
export async function recordFailedJob(env: Env, id: string, payload: unknown) {
  const message = envelope.parse(payload);
  await withSystem(env, message.dealershipId, (context) =>
    insertFailedJob(context, id, message.kind, payload),
  );
  if (message.kind === "index") await markIndexFailure(env, payload);
}
export function getFailedJobs(request: Request, env: Env) {
  return withStaff(request, env, (context) => {
    requirePermission(context.role, "jobs.manage");
    return listFailedJobs(context);
  });
}
export function retryFailedJob(request: Request, env: Env, id: string) {
  return withStaff(request, env, async (context) => {
    requirePermission(context.role, "jobs.manage");
    const job = await findFailedJob(context, z.string().min(1).parse(id));
    if (!job)
      throw new DomainError("not_found", "That failed job could not be found.");
    if (job.retriedAt)
      throw new DomainError(
        "conflict",
        "This job has already been sent for another attempt.",
      );
    envelope.parse(job.payload);
    await env.JOBS.send(job.payload);
    await markRetried(context, id);
    return { retried: true };
  });
}

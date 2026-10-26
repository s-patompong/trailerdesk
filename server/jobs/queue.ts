import { z } from "zod";

import { recordFailedJob } from "../features/jobs/jobs.service";
import { inquiryJob } from "../features/public-site/public-site.schemas";
import { processInquiry } from "../features/public-site/public-site.service";
import { processIndexJob } from "../features/search/indexing.service";
import { validateEnv } from "../platform/env";
import { logInfo } from "../platform/logging";

export async function queue(batch: MessageBatch, env: Env): Promise<void> {
  validateEnv(env);
  for (const message of batch.messages) {
    try {
      if (batch.queue === "trailerdesk-jobs-dlq")
        await recordFailedJob(env, message.id, message.body);
      else if (
        z.object({ kind: z.string() }).parse(message.body).kind === "index"
      )
        await processIndexJob(env, message.body);
      else await processInquiry(env, inquiryJob.parse(message.body));
      message.ack();
    } catch (error) {
      logInfo(
        JSON.stringify({
          event: "job_retry",
          queue: batch.queue,
          messageId: message.id,
          errorType: error instanceof Error ? error.name : "UnknownError",
        }),
      );
      message.retry();
    }
  }
}

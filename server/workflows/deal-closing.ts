import { WorkflowEntrypoint } from "cloudflare:workers";
import { z } from "zod";

import { closingParams } from "../features/deals/deals.schemas";
import {
  closeStock,
  sendDealMessage,
  writeBill,
} from "../features/deals/deals.service";
import { configuration } from "../platform/config";

import type { WorkflowEvent, WorkflowStep } from "cloudflare:workers";

export class DealClosing extends WorkflowEntrypoint<
  Env,
  z.infer<typeof closingParams>
> {
  override async run(
    event: WorkflowEvent<z.infer<typeof closingParams>>,
    step: WorkflowStep,
  ) {
    const params = closingParams.parse(event.payload);
    const timing = configuration(this.env).features.closing;
    const options = {
      retries: {
        limit: 5,
        delay: "5 seconds" as const,
        backoff: "exponential" as const,
      },
    };
    const closedAt = Date.parse(
      z.iso
        .datetime()
        .parse(
          await step.do("Mark sold and release hold", options, () =>
            closeStock(this.env, params),
          ),
        ),
    );
    await step.do("Prepare bill of sale", options, () =>
      writeBill(this.env, params),
    );
    await step.do("Send bill and thank-you", options, () =>
      sendDealMessage(this.env, params, "thanks"),
    );
    await step.sleepUntil(
      "Wait before checking in",
      closedAt + timing.checkInMs,
    );
    await step.do("Check in with customer", options, () =>
      sendDealMessage(this.env, params, "check-in"),
    );
    await step.sleepUntil(
      "Wait before review request",
      closedAt + timing.reviewMs,
    );
    await step.do("Ask for a review or referral", options, () =>
      sendDealMessage(this.env, params, "review"),
    );
    return { finished: true, dealId: params.dealId };
  }
}

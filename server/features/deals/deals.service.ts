import { configuration } from "../../platform/config";
import { withStaff, withSystem } from "../../platform/context";
import { emailSender } from "../../platform/email";
import { DomainError } from "../../platform/errors";
import { requirePermission } from "../../platform/permissions";
import { holdForClosing } from "../holds/holds.service";
import {
  lockForSale,
  updateAvailability,
} from "../inventory/inventory.service";
import {
  buildQuotePdf,
  quoteForDownload,
  requireQuote,
} from "../quotes/quotes.service";

import {
  closeDealRow,
  dealForQuote,
  dealForTrailer,
  findDeal,
  insertDeal,
  listDeals,
  saveProgress,
} from "./deals.repo";
import { closingParams, soldInput } from "./deals.schemas";

async function ensureClosingWorkflow(env: Env, input: unknown): Promise<void> {
  const params = closingParams.parse(input);
  try {
    await env.DEAL_CLOSING.create({ id: params.dealId, params });
  } catch (error) {
    try {
      const instance = await env.DEAL_CLOSING.get(params.dealId);
      const status = await instance.status();
      if (["errored", "terminated"].includes(status.status))
        await instance.restart();
    } catch {
      throw error;
    }
  }
}
export function markQuoteSold(request: Request, env: Env, input: unknown) {
  const { quoteId } = soldInput.parse(input);
  return withStaff(request, env, async (context) => {
    requirePermission(context.role, "deals.write");
    const quote = await requireQuote(context, quoteId);
    const id = await context.db.transaction(async (tx) => {
      const scoped = { ...context, db: tx };
      const trailer = await lockForSale(scoped, quote.trailerId);
      const existing = await dealForQuote(scoped, quoteId);
      if (existing) return existing.id;
      if (
        trailer.status === "sold" ||
        (await dealForTrailer(scoped, quote.trailerId))
      )
        throw new DomainError(
          "conflict",
          "This trailer already has a sale in progress.",
        );
      const hold = await holdForClosing(scoped, quote.trailerId);
      if (hold && hold.customerId !== quote.customerId)
        throw new DomainError(
          "conflict",
          "This trailer is held for a different customer. Release that hold first.",
        );
      await updateAvailability(scoped, quote.trailerId, "on_hold");
      return insertDeal(scoped, {
        quoteId,
        trailerId: quote.trailerId,
        customerId: quote.customerId,
        totalCents: quote.totalCents,
      });
    });
    await ensureClosingWorkflow(env, {
      dealershipId: context.dealershipId,
      dealId: id,
    });
    return { id };
  });
}
export function getDeals(request: Request, env: Env) {
  return withStaff(request, env, (context) => listDeals(context));
}
export function getDeal(request: Request, env: Env, id: string) {
  return withStaff(request, env, async (context) => {
    const deal = await findDeal(context, id);
    if (!deal)
      throw new DomainError("not_found", "That deal could not be found.");
    let state = "not_started";
    try {
      state = (await (await env.DEAL_CLOSING.get(deal.workflowId)).status())
        .status;
    } catch {
      /* A saved sale may still need its Workflow started. */
    }
    return {
      deal,
      quote: await requireQuote(context, deal.quoteId),
      closing: {
        state,
        needsAttention: ["errored", "terminated", "not_started"].includes(
          state,
        ),
      },
    };
  });
}
export function retryDealClosing(request: Request, env: Env, id: string) {
  return withStaff(request, env, async (context) => {
    requirePermission(context.role, "deals.write");
    const deal = await findDeal(context, id);
    if (!deal)
      throw new DomainError("not_found", "That deal could not be found.");
    await ensureClosingWorkflow(env, {
      dealershipId: context.dealershipId,
      dealId: deal.id,
    });
    return { retried: true };
  });
}
export function closeStock(env: Env, input: unknown) {
  const params = closingParams.parse(input);
  return withSystem(env, params.dealershipId, async (context) => {
    const deal = await findDeal(context, params.dealId);
    if (!deal) throw new Error("The deal could not be found.");
    await context.db.transaction(async (tx) => {
      const scoped = { ...context, db: tx };
      const stock = await lockForSale(scoped, deal.trailerId);
      if (stock.status !== "sold")
        await updateAvailability(scoped, deal.trailerId, "sold");
      await closeDealRow(scoped, deal.id, deal.salespersonId, deal.trailerId);
    });
    const hold = await holdForClosing(context, deal.trailerId);
    if (hold)
      await env.TRAILER_HOLD.getByName(
        `${params.dealershipId}:${deal.trailerId}`,
      ).release({
        dealershipId: params.dealershipId,
        trailerId: deal.trailerId,
        holdId: hold.id,
        reason: "sold",
      });
    const closed = await findDeal(context, deal.id);
    if (!closed?.closedAt) throw new Error("The sale has not closed yet.");
    return closed.closedAt.toISOString();
  });
}
export function writeBill(env: Env, input: unknown) {
  const params = closingParams.parse(input);
  return withSystem(env, params.dealershipId, async (context) => {
    const deal = await findDeal(context, params.dealId);
    if (!deal) throw new Error("The deal could not be found.");
    const quote = await requireQuote(context, deal.quoteId);
    const key = await buildQuotePdf(env, quote, "Bill of sale");
    await saveProgress(context, deal.id, "Bill of sale ready", key);
  });
}
export function sendDealMessage(
  env: Env,
  input: unknown,
  stage: "thanks" | "check-in" | "review",
) {
  const params = closingParams.parse(input);
  return withSystem(env, params.dealershipId, async (context) => {
    const deal = await findDeal(context, params.dealId);
    if (!deal) throw new Error("The deal could not be found.");
    const quote = await requireQuote(context, deal.quoteId);
    const customer = quote.snapshot;
    const messages = {
      thanks: {
        subject: `Thank you from ${customer.storeName}`,
        body: `Thanks for buying your trailer from us, ${customer.customerName}.\n\nYour bill of sale: ${configuration(env).app.url}/d/${customer.slug}/bills/${quote.pdfToken}`,
        progress: "Thank-you sent; check-in scheduled",
      },
      "check-in": {
        subject: "How is your trailer working out?",
        body: `Hi ${customer.customerName}, how is the trailer working out? Reply to let us know if you have any questions.`,
        progress: "Check-in sent; review request scheduled",
      },
      review: {
        subject: "Thanks for being part of our dealership",
        body: `Hi ${customer.customerName}, we hope your trailer is serving you well. We would appreciate a review or a referral to a friend. Call ${customer.phone} if we can help.`,
        progress: "Finished",
      },
    };
    const message = messages[stage];
    await emailSender(env, context.db).send({
      dealershipId: context.dealershipId,
      recipient: customer.customerEmail,
      subject: message.subject,
      body: message.body,
      idempotencyKey: `deal:${deal.id}:${stage}`,
    });
    await saveProgress(context, deal.id, message.progress);
  });
}
export async function readBill(env: Env, slug: string, token: string) {
  const quote = await quoteForDownload(env, slug, token);
  if (!quote)
    throw new DomainError("not_found", "That bill of sale could not be found.");
  return withSystem(env, quote.dealershipId, async (context) => {
    const deal = await dealForQuote(context, quote.id);
    const object = deal?.billKey ? await env.FILES.get(deal.billKey) : null;
    if (!object)
      throw new DomainError("not_found", "That bill of sale is not ready yet.");
    return new Response(object.body, {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  });
}

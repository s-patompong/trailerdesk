import { z } from "zod";

import { configuration } from "../../platform/config";
import { withStaff } from "../../platform/context";
import { emailSender } from "../../platform/email";
import { DomainError } from "../../platform/errors";
import { quoteTotals } from "../../platform/money";
import { salePdf } from "../../platform/pdf";
import { requirePermission } from "../../platform/permissions";
import { withDealership } from "../../platform/tenant-catalog";
import { requireCustomer } from "../customers/customers.service";
import { inventoryForQuote } from "../inventory/inventory.service";

import {
  findQuote,
  insertQuote,
  listQuotes,
  publicQuote,
  quoteSettings,
} from "./quotes.repo";
import { quoteInput, quoteSnapshot } from "./quotes.schemas";

import type { StaffContext } from "../../platform/context";

export function getQuotes(request: Request, env: Env) {
  return withStaff(request, env, (context) => listQuotes(context));
}
export async function requireQuote(context: StaffContext, id: string) {
  const quote = await findQuote(context, z.string().min(1).parse(id));
  if (!quote)
    throw new DomainError("not_found", "That quote could not be found.");
  return quote;
}
export function getQuote(request: Request, env: Env, id: string) {
  return withStaff(request, env, (context) => requireQuote(context, id));
}
export function getQuoteSettings(request: Request, env: Env) {
  return withStaff(request, env, (context) => quoteSettings(context));
}
export function createQuote(request: Request, env: Env, input: unknown) {
  const parsed = quoteInput.parse(input);
  return withStaff(request, env, async (context) => {
    requirePermission(context.role, "deals.write");
    const customer = await requireCustomer(context, parsed.customerId);
    const trailer = await inventoryForQuote(context, parsed.trailerId);
    if (trailer.status === "sold")
      throw new DomainError("conflict", "This trailer has already been sold.");
    const settings = await quoteSettings(context);
    if (!settings)
      throw new DomainError(
        "conflict",
        "Set up the dealership profile before creating a quote.",
      );
    const snapshot = quoteSnapshot.parse({
      ...settings,
      customerName: customer.name,
      customerEmail: customer.email,
      trailer: `${String(trailer.year)} ${trailer.make} ${trailer.model}`,
      vin: trailer.vin,
      stockNumber: trailer.stockNumber,
    });
    const quote = await insertQuote(
      context,
      parsed,
      trailer.askingPriceCents,
      quoteTotals({ ...parsed, trailerPriceCents: trailer.askingPriceCents }),
      snapshot,
    );
    if (!quote) throw new Error("The quote could not be created.");
    await buildQuotePdf(env, quote);
    return { id: quote.id };
  });
}
export async function buildQuotePdf(
  env: Env,
  quote: NonNullable<Awaited<ReturnType<typeof findQuote>>>,
  title = "Quote",
): Promise<string> {
  const snapshot = quoteSnapshot.parse(quote.snapshot);
  const key = `${quote.dealershipId}/${title === "Quote" ? "quotes" : "bills"}/${quote.id}.pdf`;
  if (await env.FILES.head(key)) return key;
  const bytes = await salePdf({
    title,
    store: snapshot.storeName,
    address: snapshot.address,
    phone: snapshot.phone,
    customer: snapshot.customerName,
    reference: quote.id,
    trailer: snapshot.trailer,
    vin: snapshot.vin,
    lines: [
      { label: "Trailer", cents: quote.trailerPriceCents },
      ...quote.options.map((option) => ({
        label: option.name,
        cents: option.priceCents,
      })),
      { label: "Document fee", cents: quote.docFeeCents },
      { label: "Delivery fee", cents: quote.deliveryFeeCents },
      { label: "Trade-in allowance", cents: -quote.tradeInCents },
      {
        label: `Sales tax (${(quote.taxBps / 100).toFixed(2)}%)`,
        cents: quote.taxCents,
      },
    ],
    totalCents: quote.totalCents,
  });
  await env.FILES.put(key, bytes, {
    httpMetadata: { contentType: "application/pdf" },
  });
  return key;
}
export function emailQuote(request: Request, env: Env, id: string) {
  return withStaff(request, env, async (context) => {
    requirePermission(context.role, "deals.write");
    const quote = await requireQuote(context, id);
    const snapshot = quoteSnapshot.parse(quote.snapshot);
    await buildQuotePdf(env, quote);
    await emailSender(env, context.db).send({
      dealershipId: context.dealershipId,
      recipient: snapshot.customerEmail,
      subject: `Your trailer quote from ${snapshot.storeName}`,
      body: `Hi ${snapshot.customerName},\n\nView your quote: ${configuration(env).app.publicUrl}/d/${snapshot.slug}/quotes/${quote.pdfToken}\n\nPlease contact us with any questions.`,
      idempotencyKey: `quote:${quote.id}`,
    });
    return { sent: true };
  });
}
export function readQuotePdf(env: Env, slug: string, token: string) {
  return withDealership(env, slug, false, async (db, id) => {
    const quote = await publicQuote(db, id, z.uuid().parse(token));
    if (!quote)
      throw new DomainError("not_found", "That quote could not be found.");
    const key = await buildQuotePdf(env, quote);
    const object = await env.FILES.get(key);
    if (!object)
      throw new DomainError("not_found", "That PDF could not be found.");
    return new Response(object.body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="quote-${quote.id}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  });
}

export function quoteForDownload(env: Env, slug: string, token: string) {
  return withDealership(env, slug, false, (db, id) =>
    publicQuote(db, id, z.uuid().parse(token)),
  );
}

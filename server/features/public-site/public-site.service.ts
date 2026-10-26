import { z } from "zod";

import { configuration } from "../../platform/config";
import { withSystem } from "../../platform/context";
import { emailSender } from "../../platform/email";
import { DomainError } from "../../platform/errors";
import { withDealership } from "../../platform/tenant-catalog";
import { inventoryForQuote } from "../inventory/inventory.service";

import {
  publicInventory,
  publicPhoto,
  publicPhotos,
  publicProfile,
  saveInquiry,
} from "./public-site.repo";
import { inquiryInput, inquiryJob, publicFilters } from "./public-site.schemas";

export function browseDealership(
  env: Env,
  slug: string,
  filters: unknown,
  trailerId?: string,
) {
  return withDealership(
    env,
    z.string().min(1).max(100).parse(slug),
    true,
    async (db, id, name) => {
      const profile = await publicProfile(db, id);
      if (!profile)
        throw new DomainError(
          "not_found",
          "This dealership site is not available.",
        );
      const inventory = await publicInventory(
        db,
        id,
        publicFilters.parse(filters),
        trailerId,
      );
      if (trailerId && inventory.length === 0)
        throw new DomainError("not_found", "That trailer is no longer listed.");
      return {
        name,
        slug,
        profile,
        inventory,
        photos: trailerId ? await publicPhotos(db, id, trailerId) : [],
      };
    },
  );
}
export async function submitInquiry(
  request: Request,
  env: Env,
  slug: string,
  input: unknown,
) {
  const parsed = inquiryInput.parse(input);
  const config = configuration(env);
  const limit = await env.PUBLIC_RATE_LIMIT.limit({
    key: `inquiry:${slug}:${request.headers.get("cf-connecting-ip") ?? "local"}`,
  });
  if (!limit.success)
    throw new DomainError(
      "rate_limited",
      "Please wait a minute before sending another inquiry.",
    );
  const verification = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: config.turnstile.secretKey,
        response: parsed.turnstileToken,
      }),
      signal: AbortSignal.timeout(10000),
    },
  );
  const result = z
    .object({
      success: z.boolean(),
      hostname: z.string().optional(),
      action: z.string().optional(),
    })
    .parse(await verification.json());
  if (
    !result.success ||
    (config.app.environment === "production" &&
      (result.hostname !== new URL(config.app.url).hostname ||
        result.action !== "inquiry"))
  )
    throw new DomainError(
      "invalid",
      "Verification expired. Please verify again and resend.",
    );
  return withDealership(env, slug, false, async (db, id) => {
    if (!(await publicProfile(db, id)))
      throw new DomainError(
        "not_found",
        "This dealership site is not available.",
      );
    if (
      (await publicInventory(db, id, publicFilters.parse({}), parsed.trailerId))
        .length === 0
    )
      throw new DomainError("not_found", "That trailer is no longer listed.");
    await env.JOBS.send(
      inquiryJob.parse({
        ...parsed,
        kind: "inquiry",
        dealershipId: id,
        submittedAt: new Date().toISOString(),
      }),
    );
    return { accepted: true };
  });
}
export function processInquiry(env: Env, input: unknown) {
  const job = inquiryJob.parse(input);
  return withSystem(env, job.dealershipId, async (context) => {
    await inventoryForQuote(context, job.trailerId);
    const { lead, assigned } = await saveInquiry(
      context.db,
      context.dealershipId,
      job,
    );
    const mail = emailSender(env, context.db);
    const config = configuration(env);
    await mail.send({
      dealershipId: job.dealershipId,
      recipient: assigned.email,
      subject: "A shopper asked about a trailer",
      body: `${job.name} asked about trailer ${job.trailerId}.\n\n${job.message}\n\nOpen the lead: ${config.app.url}/leads/${lead.id}`,
      idempotencyKey: `inquiry-staff:${job.requestId}`,
    });
    await mail.send({
      dealershipId: job.dealershipId,
      recipient: job.email,
      subject: "We received your trailer inquiry",
      body: `Thanks ${job.name}. Our team received your question and will be in touch. This message does not reserve the trailer or guarantee availability.`,
      idempotencyKey: `inquiry-customer:${job.requestId}`,
    });
  });
}
export function readPublicPhoto(env: Env, slug: string, photoId: string) {
  return withDealership(env, slug, true, async (db, id) => {
    if (!(await publicProfile(db, id)))
      throw new DomainError(
        "not_found",
        "This dealership site is not available.",
      );
    const photo = await publicPhoto(db, id, photoId);
    const object = photo ? await env.FILES.get(photo.key) : null;
    if (!object)
      throw new DomainError("not_found", "That photo could not be found.");
    const headers = new Headers({
      "Cache-Control": "public, max-age=60",
      "X-Content-Type-Options": "nosniff",
    });
    object.writeHttpMetadata(headers);
    return new Response(object.body, { headers });
  });
}

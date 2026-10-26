import { z } from "zod";

import { configuration } from "../../platform/config";
import { withSystem } from "../../platform/context";
import { emailSender } from "../../platform/email";
import { DomainError } from "../../platform/errors";
import { dealershipId } from "../../platform/tenant";
import { withDealership, withPublicForm } from "../../platform/tenant-catalog";
import { inventoryForQuote } from "../inventory/inventory.service";

import {
  publicInventory,
  publicPhoto,
  publicPhotos,
  publicProfile,
  saveInquiry,
} from "./public-site.repo";
import {
  embedInquiryInput,
  inquiryInput,
  inquiryJob,
  publicFilters,
  publicFormConfiguration,
  publicFormRecord,
} from "./public-site.schemas";

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
  await verifyTurnstile(config, parsed.turnstileToken, "inquiry");
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
        trailerId: parsed.trailerId,
        submittedAt: new Date().toISOString(),
      }),
    );
    return { accepted: true };
  });
}
export function processInquiry(env: Env, input: unknown) {
  const job = inquiryJob.parse(input);
  return withSystem(env, job.dealershipId, async (context) => {
    if (job.trailerId) await inventoryForQuote(context, job.trailerId);
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
      body: `${job.name} sent ${job.trailerId ? `an inquiry about trailer ${job.trailerId}` : "a website inquiry"}.\n\n${job.message}\n\nOpen the lead: ${config.app.url}/leads/${lead.id}`,
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

export async function readEmbedForm(env: Env, publicKey: string) {
  const form = await loadPublicForm(env, publicKey, true);
  return {
    config: publicFormConfiguration.parse(form),
    frameAncestors: ["'self'", ...form.allowedOrigins].join(" "),
  };
}

export async function submitEmbedInquiry(
  request: Request,
  env: Env,
  publicKey: string,
  input: unknown,
) {
  const parsed = embedInquiryInput.parse(input);
  const limit = await env.PUBLIC_RATE_LIMIT.limit({
    key: `embed:${publicKey}:${request.headers.get("cf-connecting-ip") ?? "local"}`,
  });
  if (!limit.success)
    throw new DomainError(
      "rate_limited",
      "Please wait a minute before sending another inquiry.",
    );
  const config = configuration(env);
  await verifyTurnstile(config, parsed.turnstileToken, "embed-inquiry");
  const form = await loadPublicForm(env, publicKey, false);
  const id = dealershipId(form.dealershipId);
  await withSystem(env, id, async (context) => {
    if (parsed.trailerId) await inventoryForQuote(context, parsed.trailerId);
  });
  await env.JOBS.send(
    inquiryJob.parse({
      ...parsed,
      kind: "inquiry",
      dealershipId: id,
      trailerId: parsed.trailerId ?? null,
      submittedAt: new Date().toISOString(),
    }),
  );
  return {
    accepted: true,
    message: publicFormConfiguration.parse(form).successMessage,
  };
}

async function loadPublicForm(env: Env, publicKey: string, cached: boolean) {
  const key = z.string().min(12).max(100).parse(publicKey);
  return withPublicForm(env, key, cached, (row) => {
    const parsed = publicFormRecord.safeParse(row);
    if (!parsed.success || !parsed.data.enabled)
      throw new DomainError(
        "not_found",
        "This dealership form is not available.",
      );
    return parsed.data;
  });
}

async function verifyTurnstile(
  config: ReturnType<typeof configuration>,
  token: string,
  action: "embed-inquiry" | "inquiry",
): Promise<void> {
  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: config.turnstile.secretKey,
        response: token,
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
    .parse(await response.json());
  if (
    !result.success ||
    (config.app.environment === "production" &&
      (result.hostname !== new URL(config.app.publicUrl).hostname ||
        result.action !== action))
  )
    throw new DomainError(
      "invalid",
      "Verification expired. Please verify again and resend.",
    );
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

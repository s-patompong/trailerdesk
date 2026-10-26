import { z } from "zod";

import { createAuth } from "../../platform/auth";
import { withStaff } from "../../platform/context";
import { DomainError } from "../../platform/errors";
import { verifyImage } from "../../platform/image";
import { requirePermission } from "../../platform/permissions";
import { withDealership } from "../../platform/tenant-catalog";

import {
  findProfile,
  recentAudit,
  saveLogo,
  updateProfile,
} from "./settings.repo";
import { profileInput } from "./settings.schemas";

export function getSettings(request: Request, env: Env) {
  return withStaff(request, env, async (context) => {
    requirePermission(context.role, "settings.manage");
    const settings = await findProfile(context);
    if (!settings)
      throw new DomainError(
        "not_found",
        "The dealership profile could not be found.",
      );
    return { ...settings, audit: await recentAudit(context) };
  });
}
export function saveSettings(request: Request, env: Env, input: unknown) {
  const parsed = profileInput.parse(input);
  return withStaff(request, env, async (context) => {
    requirePermission(context.role, "settings.manage");
    await context.db.transaction(async (db) =>
      updateProfile({ ...context, db }, parsed),
    );
    return { saved: true };
  });
}
export function uploadLogo(request: Request, env: Env, input: File) {
  return withStaff(request, env, async (context) => {
    requirePermission(context.role, "settings.manage");
    const file = z
      .file()
      .min(1)
      .max(2 * 1024 * 1024)
      .mime(["image/jpeg", "image/png", "image/webp"])
      .parse(input);
    await verifyImage(file);
    const key = `${context.dealershipId}/logos/${crypto.randomUUID()}`;
    await env.FILES.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });
    const profile = await findProfile(context);
    if (!profile)
      throw new DomainError(
        "not_found",
        "The dealership profile could not be found.",
      );
    await saveLogo(context, key);
    return { saved: true };
  });
}
export function publicLogo(env: Env, slug: string) {
  return withDealership(env, slug, false, async (db, dealershipId) => {
    const profile = await findProfile({
      db,
      env,
      dealershipId,
      role: "sales",
      userId: "public",
    });
    const key = profile?.profile.publicSite ? profile.logo : null;
    const object = key ? await env.FILES.get(key) : null;
    if (!object)
      throw new DomainError(
        "not_found",
        "This dealership logo could not be found.",
      );
    return new Response(object.body, {
      headers: {
        "Content-Type": object.httpMetadata?.contentType ?? "image/png",
        "Cache-Control": "public, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}
export function getStaff(request: Request, env: Env) {
  return withStaff(request, env, async (context) => {
    requirePermission(context.role, "users.manage");
    const auth = createAuth(env, context.db);
    const [members, invitations] = await Promise.all([
      auth.api.listMembers({
        headers: request.headers,
        query: { organizationId: context.dealershipId },
      }),
      auth.api.listInvitations({
        headers: request.headers,
        query: { organizationId: context.dealershipId },
      }),
    ]);
    return { members: members.members, invitations };
  });
}

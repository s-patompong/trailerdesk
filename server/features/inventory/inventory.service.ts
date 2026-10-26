import { withStaff } from "../../platform/context";
import { DomainError } from "../../platform/errors";
import { verifyImage } from "../../platform/image";
import { requirePermission } from "../../platform/permissions";
import { queueTrailerIndex } from "../search/indexing.service";

import {
  changeTrailer,
  inventoryTimezone,
  lockTrailer,
  setAvailability,
  findTrailer,
  findTrailers,
  insertTrailer,
  recordInventoryAudit,
} from "./inventory.repo";
import {
  inventoryFilters,
  photoSchema,
  trailerEdit,
  trailerInput,
} from "./inventory.schemas";
import {
  coverPhoto,
  findPhoto,
  insertPhoto,
  trailerPhotos,
} from "./photos.repo";

import type { StaffContext } from "../../platform/context";

export function listInventory(request: Request, env: Env, filters: unknown) {
  return withStaff(request, env, (context) =>
    findTrailers(context, inventoryFilters.parse(filters)),
  );
}
export function getInventory(request: Request, env: Env, id: string) {
  return withStaff(request, env, async (context) => {
    const trailer = await findTrailer(context, id);
    if (!trailer)
      throw new DomainError("not_found", "That trailer could not be found.");
    return {
      trailer,
      photos: await trailerPhotos(context, id),
      role: context.role,
      timezone: await inventoryTimezone(context),
    };
  });
}
export function addInventory(request: Request, env: Env, input: unknown) {
  return withStaff(request, env, async (context) => {
    requirePermission(context.role, "inventory.write");
    const id = await insertTrailer(context, trailerInput.parse(input));
    await recordInventoryAudit(
      context,
      id,
      "trailer.created",
      "Trailer added to inventory.",
    );
    await queueTrailerIndex(context, id);
    return { id };
  });
}
export function editInventory(
  request: Request,
  env: Env,
  id: string,
  input: unknown,
) {
  return withStaff(request, env, async (context) => {
    const parsed = trailerEdit.parse(input);
    const { version, ...changes } = parsed;
    const keys = Object.keys(changes);
    requirePermission(
      context.role,
      keys.every((key) => key === "status")
        ? "inventory.status"
        : "inventory.write",
    );
    const existing = await findTrailer(context, id);
    if (!existing)
      throw new DomainError("not_found", "That trailer could not be found.");
    if (existing.status === "sold" || existing.status === "on_hold")
      throw new DomainError(
        "conflict",
        "Release the hold or open the deal before changing this trailer.",
      );
    await context.db.transaction(async (tx) => {
      const scoped = { ...context, db: tx };
      const changed = await changeTrailer(scoped, id, version, changes);
      if (changed.length === 0)
        throw new DomainError(
          "conflict",
          "Someone updated this trailer. Refresh and try again.",
        );
      await recordInventoryAudit(
        scoped,
        id,
        changes.askingPriceCents !== undefined
          ? "trailer.price_changed"
          : changes.status !== undefined
            ? "trailer.status_changed"
            : "trailer.updated",
        JSON.stringify(changes),
      );
    });
    if (
      Object.keys(changes).some((key) =>
        [
          "description",
          "make",
          "model",
          "year",
          "type",
          "size",
          "gvwr",
          "hitchType",
          "doorType",
        ].includes(key),
      )
    )
      await queueTrailerIndex(context, id);
    return { id };
  });
}
export function uploadPhoto(
  request: Request,
  env: Env,
  id: string,
  file: File,
) {
  return withStaff(request, env, async (context) => {
    requirePermission(context.role, "inventory.write");
    if (!(await findTrailer(context, id)))
      throw new DomainError("not_found", "That trailer could not be found.");
    photoSchema.parse(file);
    await verifyImage(file);
    const key = `${context.dealershipId}/trailers/${id}/${crypto.randomUUID()}`;
    await env.FILES.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
    });
    await context.db.transaction(async (db) => {
      const scoped = { ...context, db };
      if (!(await lockTrailer(scoped, id)))
        throw new DomainError("not_found", "That trailer could not be found.");
      await insertPhoto(scoped, id, key);
    });
    return { key };
  });
}

export function readPhoto(request: Request, env: Env, id: string) {
  return withStaff(request, env, async (context) => {
    const photo = await findPhoto(context, id);
    if (!photo)
      throw new DomainError("not_found", "That photo could not be found.");
    const object = await env.FILES.get(photo.key);
    if (!object)
      throw new DomainError("not_found", "That photo could not be found.");
    const headers = new Headers({
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    });
    object.writeHttpMetadata(headers);
    return new Response(object.body, { headers });
  });
}

export async function requireAvailableTrailer(
  context: StaffContext,
  id: string,
) {
  const trailer = await lockTrailer(context, id);
  if (!trailer)
    throw new DomainError("not_found", "That trailer could not be found.");
  if (trailer.status !== "in_stock")
    throw new DomainError(
      "conflict",
      "This trailer is not available for a new hold or sale.",
    );
  return trailer;
}
export async function updateAvailability(
  context: StaffContext,
  id: string,
  status: "in_stock" | "on_hold" | "sold",
  onlyIf?: string,
) {
  return setAvailability(context, id, status, onlyIf);
}
export async function inventoryForQuote(context: StaffContext, id: string) {
  const trailer = await findTrailer(context, id);
  if (!trailer)
    throw new DomainError("not_found", "That trailer could not be found.");
  return trailer;
}

export async function lockForSale(context: StaffContext, id: string) {
  const trailer = await lockTrailer(context, id);
  if (!trailer)
    throw new DomainError("not_found", "That trailer could not be found.");
  return trailer;
}

export function chooseCoverPhoto(
  request: Request,
  env: Env,
  id: string,
  photoId: string,
) {
  return withStaff(request, env, async (context) => {
    requirePermission(context.role, "inventory.write");
    await context.db.transaction(async (db) => {
      const scoped = { ...context, db };
      if (!(await lockTrailer(scoped, id)))
        throw new DomainError("not_found", "That trailer could not be found.");
      const photo = await findPhoto(scoped, photoId);
      if (photo?.trailerId !== id)
        throw new DomainError("not_found", "That photo could not be found.");
      await coverPhoto(scoped, id, photoId);
    });
    return { saved: true };
  });
}

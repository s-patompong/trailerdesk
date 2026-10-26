import { z } from "zod";

import { DomainError } from "./errors";

export function databaseError(error: unknown): unknown {
  const raw = error instanceof Error && error.cause ? error.cause : error;
  const parsed = z.object({ code: z.string() }).safeParse(raw);
  if (!parsed.success) return error;
  if (parsed.data.code === "23505")
    return new DomainError(
      "conflict",
      "That email, VIN or stock number is already used in this dealership. Check the existing record before trying again.",
    );
  if (parsed.data.code === "23503")
    return new DomainError(
      "conflict",
      "This record is linked to other dealership records and cannot be removed.",
    );
  return error;
}

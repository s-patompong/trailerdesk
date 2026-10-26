import { and, eq } from "drizzle-orm";
import { z } from "zod";

import type { SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

const dealershipIdSchema = z.string().min(1).brand<"DealershipId">();
export type DealershipId = z.infer<typeof dealershipIdSchema>;
export function dealershipId(value: unknown): DealershipId {
  return dealershipIdSchema.parse(value);
}
export function tenantWhere(
  column: AnyPgColumn,
  id: DealershipId,
  ...conditions: (SQL | undefined)[]
): SQL {
  // and() cannot be undefined: the mandatory tenant equality is always present.
  const result = and(eq(column, id), ...conditions);
  if (!result) throw new Error("A tenant predicate is required.");
  return result;
}

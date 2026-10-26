import { and, eq } from "drizzle-orm";

import { createAuth } from "./auth";
import { withDatabase } from "./db";
import { DomainError } from "./errors";
import { roleSchema } from "./permissions";
import { member } from "./schema/auth";
import { dealershipId } from "./tenant";

import type { Database } from "./db";
import type { Role } from "./permissions";
import type { DealershipId } from "./tenant";

export interface StaffContext {
  db: Database;
  env: Env;
  dealershipId: DealershipId;
  userId: string;
  role: Role;
}
export async function withStaff<T>(
  request: Request,
  env: Env,
  run: (context: StaffContext) => Promise<T>,
): Promise<T> {
  return withDatabase(env.DB, async (db) => {
    const session = await createAuth(env, db).api.getSession({
      headers: request.headers,
    });
    if (!session)
      throw new DomainError(
        "unauthorized",
        "Please sign in to your dealership.",
      );
    const id = session.session.activeOrganizationId;
    if (!id)
      throw new DomainError("conflict", "Choose a dealership to continue.");
    // Auth membership is global identity infrastructure, not a business repository query.
    const membership = await db
      .select()
      .from(member)
      .where(
        and(eq(member.organizationId, id), eq(member.userId, session.user.id)),
      )
      .limit(1);
    const role = roleSchema.safeParse(membership[0]?.role);
    if (!role.success)
      throw new DomainError(
        "forbidden",
        "You do not belong to this dealership.",
      );
    return run({
      db,
      env,
      dealershipId: dealershipId(id),
      userId: session.user.id,
      role: role.data,
    });
  });
}
export async function handleAuth(
  request: Request,
  env: Env,
): Promise<Response> {
  return withDatabase(env.DB, async (db) => {
    const session = await createAuth(env, db).api.getSession({
      headers: request.headers,
    });
    return createAuth(env, db, session?.user.id ?? null).handler(request);
  });
}

/** Internal jobs/DOs only. Never build this context from an unverified HTTP tenant parameter. */
export function withSystem<T>(
  env: Env,
  id: string,
  run: (context: StaffContext) => Promise<T>,
): Promise<T> {
  return withDatabase(env.DB, (db) =>
    run({
      db,
      env,
      dealershipId: dealershipId(id),
      userId: "system",
      role: "owner",
    }),
  );
}

export function withCachedStaff<T>(
  request: Request,
  env: Env,
  run: (context: StaffContext) => Promise<T>,
): Promise<T> {
  return withStaff(request, env, (context) =>
    withDatabase(env.DB_CACHED, (db) => run({ ...context, db })),
  );
}

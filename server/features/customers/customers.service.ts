import { z } from "zod";

import { withStaff } from "../../platform/context";
import { DomainError } from "../../platform/errors";
import { noteInput } from "../../platform/note-input";
import { requirePermission } from "../../platform/permissions";

import {
  addCustomer,
  addCustomerNote,
  customerHistory,
  findCustomer,
  findCustomers,
} from "./customers.repo";
import { customerInput } from "./customers.schemas";

import type { StaffContext } from "../../platform/context";

export async function requireCustomer(context: StaffContext, id: string) {
  const customer = await findCustomer(context, z.string().min(1).parse(id));
  if (!customer)
    throw new DomainError("not_found", "That customer could not be found.");
  return customer;
}
export function listCustomers(request: Request, env: Env, query: unknown) {
  return withStaff(request, env, (context) =>
    findCustomers(
      context,
      z
        .string()
        .max(100)
        .parse(query ?? ""),
    ),
  );
}
export function getCustomer(request: Request, env: Env, id: string) {
  return withStaff(request, env, async (context) => ({
    customer: await requireCustomer(context, id),
    history: await customerHistory(context, id),
  }));
}
export function createCustomer(request: Request, env: Env, input: unknown) {
  return withStaff(request, env, async (context) => {
    requirePermission(context.role, "leads.write");
    return { id: await addCustomer(context, customerInput.parse(input)) };
  });
}
export function saveCustomerNote(
  request: Request,
  env: Env,
  id: string,
  input: unknown,
) {
  return withStaff(request, env, async (context) => {
    requirePermission(context.role, "leads.write");
    await requireCustomer(context, id);
    await addCustomerNote(context, id, noteInput.parse(input).body);
    return { saved: true };
  });
}

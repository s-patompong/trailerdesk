import { withStaff } from "../../platform/context";
import { DomainError } from "../../platform/errors";
import { noteInput } from "../../platform/note-input";
import { requirePermission } from "../../platform/permissions";
import { requireCustomer } from "../customers/customers.service";
import { inventoryForQuote } from "../inventory/inventory.service";

import {
  addLead,
  addLeadNote,
  findLead,
  findLeads,
  leadNotes,
  staffOptions,
  updateLeadRow,
} from "./leads.repo";
import { leadFilters, leadInput, leadUpdate } from "./leads.schemas";

import type { StaffContext } from "../../platform/context";

async function requireLead(context: StaffContext, id: string) {
  const row = await findLead(context, id);
  if (!row) throw new DomainError("not_found", "That lead could not be found.");
  return row;
}
async function requireAssignee(context: StaffContext, id: string) {
  if (!(await staffOptions(context)).some((person) => person.id === id))
    throw new DomainError(
      "invalid",
      "Choose a salesperson from this dealership.",
    );
}
export function listLeads(request: Request, env: Env, input: unknown) {
  const filters = leadFilters.parse(input);
  return withStaff(request, env, async (context) => ({
    leads: await findLeads(context, filters.q),
    staff: await staffOptions(context),
  }));
}
export function getLead(request: Request, env: Env, id: string) {
  return withStaff(request, env, async (context) => {
    const lead = await requireLead(context, id);
    return {
      lead,
      customer: await requireCustomer(context, lead.customerId),
      notes: await leadNotes(context, id),
      staff: await staffOptions(context),
    };
  });
}
export function changeLead(
  request: Request,
  env: Env,
  id: string,
  input: unknown,
) {
  const parsed = leadUpdate.parse(input);
  return withStaff(request, env, async (context) => {
    requirePermission(context.role, "leads.write");
    await requireLead(context, id);
    await requireAssignee(context, parsed.assignedTo);
    await updateLeadRow(context, id, parsed);
    return { saved: true };
  });
}
export function createLead(request: Request, env: Env, input: unknown) {
  const parsed = leadInput.parse(input);
  return withStaff(request, env, async (context) => {
    requirePermission(context.role, "leads.write");
    await requireCustomer(context, parsed.customerId);
    await requireAssignee(context, parsed.assignedTo);
    if (parsed.trailerId) await inventoryForQuote(context, parsed.trailerId);
    return addLead(context, parsed);
  });
}
export function saveLeadNote(
  request: Request,
  env: Env,
  id: string,
  input: unknown,
) {
  return withStaff(request, env, async (context) => {
    requirePermission(context.role, "leads.write");
    await requireLead(context, id);
    await addLeadNote(context, id, noteInput.parse(input).body);
    return { saved: true };
  });
}

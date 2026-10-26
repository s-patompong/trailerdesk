import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  ownerAc,
} from "better-auth/plugins/organization/access";
import { z } from "zod";

import { DomainError } from "./errors";

export const roleSchema = z.enum(["owner", "manager", "sales"]);
export type Role = z.infer<typeof roleSchema>;
export type Permission =
  | "inventory.read"
  | "inventory.write"
  | "inventory.status"
  | "inventory.delete"
  | "cost.read"
  | "leads.write"
  | "deals.write"
  | "holds.manage"
  | "users.manage"
  | "settings.manage"
  | "billing.manage"
  | "jobs.manage";
const salesPermissions: readonly Permission[] = [
  "inventory.read",
  "inventory.status",
  "leads.write",
  "deals.write",
];
export function can(role: Role, permission: Permission): boolean {
  if (role === "owner") return true;
  if (role === "manager")
    return permission !== "billing.manage" && permission !== "settings.manage";
  return salesPermissions.includes(permission);
}
export function requirePermission(role: Role, permission: Permission): void {
  if (!can(role, permission))
    throw new DomainError(
      "forbidden",
      "You do not have permission to do that.",
    );
}

export const organizationAccess = createAccessControl(defaultStatements);
export const organizationRoles = {
  owner: ownerAc,
  manager: organizationAccess.newRole({
    organization: [],
    member: ["create", "update", "delete"],
    invitation: ["create", "cancel"],
  }),
  sales: organizationAccess.newRole({
    organization: [],
    member: [],
    invitation: [],
  }),
};

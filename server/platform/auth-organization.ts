import { APIError } from "better-auth/api";
import { organization } from "better-auth/plugins";

import { configuration } from "./config";
import { emailSender } from "./email";
import {
  organizationAccess,
  organizationRoles,
  roleSchema,
} from "./permissions";
import { auditLog } from "./schema/crm";

import type { Database } from "./db";

function assertRole(value: string): void {
  if (!roleSchema.safeParse(value).success)
    throw new APIError("BAD_REQUEST", {
      message: "Choose Owner, Manager or Sales.",
    });
}
export function dealershipOrganizations(
  env: Env,
  db: Database,
  actorId: string | null,
) {
  const config = configuration(env);
  return organization({
    allowUserToCreateOrganization: false,
    creatorRole: "owner",
    requireEmailVerificationOnInvitation: true,
    ac: organizationAccess,
    roles: organizationRoles,
    organizationHooks: {
      beforeAddMember: ({ member }) => {
        assertRole(member.role);
        return Promise.resolve();
      },
      beforeUpdateMemberRole: ({ newRole }) => {
        assertRole(newRole);
        return Promise.resolve();
      },
      beforeCreateInvitation: ({ invitation }) => {
        assertRole(invitation.role);
        return Promise.resolve();
      },
      afterCreateInvitation: async ({ invitation, organization, inviter }) => {
        await db.insert(auditLog).values({
          id: crypto.randomUUID(),
          dealershipId: organization.id,
          actorId: inviter.id,
          action: "user.invited",
          recordId: invitation.id,
          details: JSON.stringify({
            email: invitation.email,
            role: invitation.role,
          }),
        });
      },
      afterRemoveMember: async ({ member, organization }) => {
        await db.insert(auditLog).values({
          id: crypto.randomUUID(),
          dealershipId: organization.id,
          actorId,
          action: "user.removed",
          recordId: member.id,
          details: JSON.stringify({ userId: member.userId }),
        });
      },
    },
    sendInvitationEmail: async (data) => {
      await emailSender(env, db).send({
        recipient: data.email,
        subject: `Join ${data.organization.name} on TrailerDesk`,
        body: `Accept your invitation: ${config.app.url}/accept-invitation?id=${encodeURIComponent(data.id)}`,
        idempotencyKey: `invite:${data.id}`,
        dealershipId: data.organization.id,
      });
    },
  });
}

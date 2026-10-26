import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import {
  organizationAccess,
  organizationRoles,
} from "../../server/platform/permissions";

export const authClient = createAuthClient({
  plugins: [
    organizationClient({ ac: organizationAccess, roles: organizationRoles }),
  ],
});

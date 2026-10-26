import { createContext } from "react-router";

import type { StaffIdentity } from "../../server/platform/context";
import type { staffPageAccess } from "../../server/platform/session";

type StaffPageInfo = Awaited<ReturnType<typeof staffPageAccess>>["info"];

export const staffIdentityContext = createContext<StaffIdentity>();
export const staffPageInfoContext = createContext<StaffPageInfo>();

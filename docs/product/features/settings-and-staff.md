# Settings and staff

Keep the dealership profile, defaults and team access up to date.

## User flow

Owners edit business details, hours, timezone, logo, fees, tax and public visibility. Owners and Managers invite staff, change roles and remove access.

## Business rules

Only Owners manage dealership settings. Better Auth handles invitations and verifies the invited email before acceptance. Its owner protections prevent a Manager from granting Owner access or removing the last Owner. Important invitations, removals and inventory/sale changes are audited.

## Code

server/features/settings/; server/platform/permissions.ts; server/platform/auth-organization.ts; app/routes/settings.tsx; app/routes/staff.tsx

See the [Phase 1 tracker](../../phase-1-checklist.md) for verification evidence and remaining work.

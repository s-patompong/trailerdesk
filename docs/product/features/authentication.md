# Sign-in and invitations

Give each staff member their own verified account and dealership access.

## User flow

Sign in with email and password, request a reset, or accept a staff invitation after verifying email. Members of multiple dealerships use the dealership switcher. Google appears when both OAuth credentials are configured.

## Business rules

Better Auth owns password hashing, sessions, verification, reset, organization membership and auth rate limiting. The application owns dealership permissions. Public browsing does not require a staff account. OAuth requires real credentials and live verification during deployment.

## Code

server/platform/auth.ts; server/platform/auth-organization.ts; server/platform/session.ts; app/routes/login.tsx; app/routes/reset-password.tsx; app/routes/accept-invitation.tsx

See the [Phase 1 tracker](../../phase-1-checklist.md) for verification evidence and remaining work.

# Data model

Drizzle schemas are under `server/platform/schema/`; reviewed SQL is under `drizzle/`.
The first migration enables `vector` before creating embedding columns and indexes.

- `auth_user`, `auth_session`, `auth_account`, `auth_verification`, `auth_rate_limit`: identity.
- `organization`, `member`, `invitation`: Better Auth dealership memberships.
- `platform_auth_user`, `platform_auth_session`, `platform_auth_account`,
  `platform_auth_verification`, `platform_auth_rate_limit`: the separate platform-admin
  Better Auth realm. It intentionally has no dealership organization membership.
- `dealership`: profile/settings; its primary key is the organization ID.
- `public_forms`: rotatable public form keys, safe display copy and allowed embed origins.
- `trailers`, `photos`: lot inventory and R2 references.
- `customers`, `leads`, `notes`: shopper relationships and sales pipeline.
- `holds`, `quotes`, `deals`: reservations, priced offers and completed sales.
- `documents`, `chunks`: R2 documents and searchable text/768-dimensional embeddings.
- `audit_log`, `email_deliveries`, `dev_outbox`, `failed_jobs`, `processed_jobs`: operations and retry evidence.

Business tables carry `dealership_id`. Dealership auth identities are global within the
dealership realm, and users can belong to multiple organizations. Platform identities are
stored separately and never establish dealership access. Auth emails may have no dealership
before membership exists.
All business filters must use `tenantWhere`; IDs from a request do not establish tenancy.
Services must validate parent references in the same dealership before inserting child rows.
Composite foreign keys should be considered when extending relationships; ordinary
foreign keys alone do not prove tenant isolation.

Money columns store cents as integers. Sales tax stores basis points. Timestamps use UTC.
The active-hold unique partial index adds a Postgres backstop to Durable Object exclusivity.

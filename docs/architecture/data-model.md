# Data model

Drizzle schemas are under `server/platform/schema/`; reviewed SQL is under `drizzle/`.
The first migration enables `vector` before creating embedding columns and indexes.

- `auth_user`, `auth_session`, `auth_account`, `auth_verification`, `auth_rate_limit`: identity.
- `organization`, `member`, `invitation`: Better Auth dealership memberships.
- `dealership`: profile/settings; its primary key is the organization ID.
- `trailers`, `photos`: lot inventory and R2 references.
- `customers`, `leads`, `notes`: shopper relationships and sales pipeline.
- `holds`, `quotes`, `deals`: reservations, priced offers and completed sales.
- `documents`, `chunks`: R2 documents and searchable text/768-dimensional embeddings.
- `audit_log`, `email_deliveries`, `dev_outbox`, `failed_jobs`, `processed_jobs`: operations and retry evidence.

Business tables carry `dealership_id`. Auth identities are global; users can belong
to multiple organizations. Auth emails may have no dealership before membership exists.
All business filters must use `tenantWhere`; IDs from a request do not establish tenancy.
Services must validate parent references in the same dealership before inserting child rows.
Composite foreign keys should be considered when extending relationships; ordinary
foreign keys alone do not prove tenant isolation.

Money columns store cents as integers. Sales tax stores basis points. Timestamps use UTC.
The active-hold unique partial index adds a Postgres backstop to Durable Object exclusivity.

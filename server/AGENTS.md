# Server rules

Read root `AGENTS.md`. API handlers parse input then call services.
Only repositories and platform infrastructure access the database.
Service entry points enforce permissions; repositories always use the tenant helper.
No cross-feature repository imports. Platform imports no features.
Create and close clients per request/job. Use uncached DB after a mutation.
Validate all job/workflow/DO inputs. Make background effects idempotent.
Never log tokens, passwords, raw customer messages or full environment objects.

PATCH schemas must not inject create defaults. Zod 4 applies defaults inside optional
fields; remove those defaults before partial validation and test omitted-field preservation.

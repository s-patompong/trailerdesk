# UI rules

Read root `AGENTS.md`. Routes call server services in loaders/actions or the API.
Never import repositories, database clients, or schema tables into the UI.
Use accessible controls, meaningful labels, keyboard support and visible focus.
Handle empty, pending and error states. Use plain dealership language.
Render USD and US dates in the dealership timezone; never expose cost to Sales.
Prefer URL filters, framework forms and server validation. Browser validation is supplementary.
Keep shadcn primitives under `components/ui`; feature components under `components/<feature>`.

Use shadcn UI primitives consistently. Use React Hook Form + shared Zod schemas
for client validation, field errors, pending state and accessible error associations.
Revalidate on the server. See `docs/guides/frontend-validation.md`.

The current appearance is an example, not a reusable design mandate. When this repository
is used as a foundation for another product, follow the user's design language and supplied
screenshots, Figma, brand assets or tokens. Retain the route/component boundaries,
accessibility, state coverage and validation behavior. See `docs/guides/adapting-the-ui.md`.

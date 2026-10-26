# Frontend forms and shadcn UI

Use shadcn primitives for all controls, cards, badges and feedback. Keep app-specific
composition under `app/components/<feature>/`; generated primitives live under `ui/`.
The preset uses Radix, Tailwind 4 and locally bundled Geist fonts.

For forms, share a browser-safe Zod schema with the server boundary. Use React Hook
Form with `zodResolver`, `mode: 'onBlur'` and `reValidateMode: 'onChange'`. Prefer
framework POST actions for writes and GET submissions for shareable filters. Never
let credential forms fall back to GET. The server must independently validate input.

Example: `SignInForm` in `app/components/auth/sign-in-form.tsx` uses
`signInSchema` from `server/features/auth/auth.schemas.ts`. The login route parses
the same schema again before calling Better Auth.

- Associate every label with an input ID.
- Set `aria-invalid` and connect errors with `aria-describedby`.
- Render field errors with shadcn `FieldError`, and server failures with `Alert`.
- Keep entered values after errors; never return or log a password.
- Disable submit while a request is pending and provide clear pending text.
- Focus the first invalid field (React Hook Form's default).
- Client validation is for usability; permissions and tenancy are server responsibilities.

Browser tests in `tests/e2e/auth-inventory.spec.ts` verify invalid email/password
feedback, POST login, role projections and mobile photo loading.

Client-only controls must wait until React hydration attaches their handlers. Use
`useHydrated()` to disable the relevant shadcn `FieldSet` or control before then;
`TrailerForm` and `StoreSwitcher` are examples. Keep validation feedback space stable:
`TextField` reserves an error row so an on-blur error cannot move the next button
between pointer-down and click. Do not paper over missed interactions with test sleeps.

The login page forwards user credentials through Better Auth's HTTP handler, which
applies its built-in rate limit. `auth.api` intentionally bypasses that middleware and
must not be used as the entry point for public credential submissions. See the
[official rate-limit guide](https://better-auth.com/docs/concepts/rate-limit) and
`server/platform/session.test.ts` for the regression check.

Separate create defaults from PATCH semantics. Zod 4 applies a default even when its
field is optional. `trailerEdit` removes the create-only status/description defaults
before accepting partial updates, so a status change cannot erase a description or
silently change another field. A schema regression test and a real Sales status-update
browser test protect this behavior. See the [Zod migration guide](https://zod.dev/v4/changelog#defaults-applied-within-optional-fields).

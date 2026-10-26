import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { Form, useNavigation, useSubmit } from "react-router";

import { signInSchema } from "../../../server/features/auth/auth.schemas";
import { useHydrated } from "../../lib/use-hydrated";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

import type { z } from "zod";

export function SignInForm({
  serverError,
}: {
  serverError: string | undefined;
}) {
  const hydrated = useHydrated();
  const submit = useSubmit();
  const pending = useNavigation().state !== "idle";
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "" },
  });
  return (
    <Form
      method="post"
      noValidate
      aria-busy={pending}
      onSubmit={(event) => {
        void form.handleSubmit((values) => {
          void submit(values, { method: "post" });
        })(event);
      }}
      className="space-y-5"
    >
      {(["email", "password"] as const).map((name) => {
        const error = form.formState.errors[name];
        return (
          <Field key={name} data-invalid={Boolean(error)}>
            <FieldLabel htmlFor={`login-${name}`}>
              {name === "email" ? "Email address" : "Password"}
            </FieldLabel>
            <Input
              disabled={!hydrated || pending}
              id={`login-${name}`}
              type={name}
              autoComplete={name === "email" ? "email" : "current-password"}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `login-${name}-error` : undefined}
              {...form.register(name)}
            />
            {error && (
              <FieldError id={`login-${name}-error`}>
                {error.message}
              </FieldError>
            )}
          </Field>
        );
      })}
      {serverError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" className="w-full" disabled={!hydrated || pending}>
        {pending && (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        )}
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </Form>
  );
}

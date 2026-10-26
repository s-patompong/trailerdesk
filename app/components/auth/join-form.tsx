import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { joinInput } from "../../../server/features/auth/account.schemas";
import { authClient } from "../../lib/auth-client";
import { TextField } from "../forms/text-field";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";

import type { z } from "zod";

export function JoinForm({ invitationId }: { invitationId: string }) {
  const [message, setMessage] = useState("");
  const form = useForm<z.infer<typeof joinInput>>({
    resolver: zodResolver(joinInput),
    mode: "onBlur",
    defaultValues: { name: "", email: "", password: "" },
  });
  const submit = form.handleSubmit(async (input) => {
    try {
      const result = await authClient.signUp.email({
        ...input,
        callbackURL: `/accept-invitation?id=${encodeURIComponent(invitationId)}`,
      });
      if (result.error)
        throw new Error(
          result.error.message ?? "Your account could not be created.",
        );
      setMessage(
        "Check your email and verify your address. Then sign in to accept your dealership invitation.",
      );
      form.reset();
    } catch (error) {
      form.setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "Your account could not be created.",
      });
    }
  });
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        void submit(e);
      }}
    >
      <TextField
        label="Your name"
        autoComplete="name"
        registration={form.register("name")}
        error={form.formState.errors.name?.message}
      />
      <TextField
        label="Invited email address"
        type="email"
        autoComplete="email"
        registration={form.register("email")}
        error={form.formState.errors.email?.message}
      />
      <TextField
        label="Password"
        type="password"
        autoComplete="new-password"
        registration={form.register("password")}
        error={form.formState.errors.password?.message}
      />
      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      {form.formState.errors.root && (
        <Alert variant="destructive">
          <AlertDescription>
            {form.formState.errors.root.message}
          </AlertDescription>
        </Alert>
      )}
      <Button disabled={form.formState.isSubmitting || Boolean(message)}>
        {form.formState.isSubmitting
          ? "Creating account…"
          : "Create your staff account"}
      </Button>
    </form>
  );
}

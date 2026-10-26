import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { resetRequest } from "../../../server/features/auth/account.schemas";
import { authClient } from "../../lib/auth-client";
import { TextField } from "../forms/text-field";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";

import type { z } from "zod";

export function ResetRequest() {
  const [message, setMessage] = useState("");
  const form = useForm<z.infer<typeof resetRequest>>({
    resolver: zodResolver(resetRequest),
    mode: "onBlur",
    defaultValues: { email: "" },
  });
  const submit = form.handleSubmit(async (input) => {
    try {
      const result = await authClient.requestPasswordReset({
        ...input,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (result.error)
        throw new Error(
          result.error.message ?? "Please try again in a moment.",
        );
      setMessage(
        "If this email has an account, a password reset link is on its way.",
      );
    } catch (error) {
      form.setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "Please try again in a moment.",
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
        label="Email address"
        type="email"
        autoComplete="email"
        registration={form.register("email")}
        error={form.formState.errors.email?.message}
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
      <Button disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}

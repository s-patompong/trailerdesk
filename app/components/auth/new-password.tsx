import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { newPassword } from "../../../server/features/auth/account.schemas";
import { authClient } from "../../lib/auth-client";
import { TextField } from "../forms/text-field";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";

import type { z } from "zod";

export function NewPassword({ token }: { token: string }) {
  const [message, setMessage] = useState("");
  const form = useForm<z.infer<typeof newPassword>>({
    resolver: zodResolver(newPassword),
    mode: "onBlur",
    defaultValues: { password: "", confirmation: "" },
  });
  const submit = form.handleSubmit(async (input) => {
    try {
      const result = await authClient.resetPassword({
        newPassword: input.password,
        token,
      });
      if (result.error)
        throw new Error(
          result.error.message ??
            "This reset link has expired. Request a new one.",
        );
      form.reset();
      setMessage("Your password has been updated. You can sign in now.");
    } catch (error) {
      form.setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "Your password could not be updated.",
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
        label="New password"
        type="password"
        autoComplete="new-password"
        registration={form.register("password")}
        error={form.formState.errors.password?.message}
      />
      <TextField
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        registration={form.register("confirmation")}
        error={form.formState.errors.confirmation?.message}
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
        {form.formState.isSubmitting ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}

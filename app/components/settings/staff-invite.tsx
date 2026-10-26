import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRevalidator } from "react-router";

import { staffInvite } from "../../../server/features/settings/settings.schemas";
import { authClient } from "../../lib/auth-client";
import { TextField } from "../forms/text-field";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Field, FieldLabel } from "../ui/field";
import { NativeSelect, NativeSelectOption } from "../ui/native-select";

import type { z } from "zod";

export function StaffInvite({ owner }: { owner: boolean }) {
  const [message, setMessage] = useState("");
  const refresh = useRevalidator();
  const form = useForm<z.infer<typeof staffInvite>>({
    resolver: zodResolver(staffInvite),
    mode: "onBlur",
    defaultValues: { email: "", role: "sales" },
  });
  const submit = form.handleSubmit(async (input) => {
    setMessage("");
    try {
      const result = await authClient.organization.inviteMember(input);
      if (result.error)
        throw new Error(
          result.error.message ?? "The invitation could not be sent.",
        );
      form.reset();
      setMessage("The staff invitation has been emailed.");
      await refresh.revalidate();
    } catch (error) {
      form.setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "The invitation could not be sent.",
      });
    }
  });
  return (
    <form
      noValidate
      className="grid items-end gap-4 sm:grid-cols-[1fr_180px_auto]"
      onSubmit={(e) => {
        void submit(e);
      }}
    >
      <TextField
        label="Staff email"
        type="email"
        registration={form.register("email")}
        error={form.formState.errors.email?.message}
      />
      <Field>
        <FieldLabel htmlFor="staff-role">Role</FieldLabel>
        <NativeSelect id="staff-role" {...form.register("role")}>
          <NativeSelectOption value="sales">Sales</NativeSelectOption>
          <NativeSelectOption value="manager">Manager</NativeSelectOption>
          {owner && (
            <NativeSelectOption value="owner">Owner</NativeSelectOption>
          )}
        </NativeSelect>
      </Field>
      <Button disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Sending…" : "Invite staff"}
      </Button>
      {message && (
        <Alert className="sm:col-span-3">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      {form.formState.errors.root && (
        <Alert variant="destructive" className="sm:col-span-3">
          <AlertDescription>
            {form.formState.errors.root.message}
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRevalidator } from "react-router";
import { z } from "zod";

import { profileForm } from "../../../server/features/settings/settings.schemas";
import { jsonBody, requestJson } from "../../lib/request-json";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";

import { ProfileFields } from "./profile-fields";

export function ProfileForm({
  values,
}: {
  values: z.output<typeof profileForm>;
}) {
  const [message, setMessage] = useState("");
  const refresh = useRevalidator();
  const form = useForm<
    z.input<typeof profileForm>,
    unknown,
    z.output<typeof profileForm>
  >({
    resolver: zodResolver(profileForm),
    mode: "onBlur",
    defaultValues: {
      ...values,
      taxBps: (values.taxBps / 100).toFixed(2),
      docFeeCents: (values.docFeeCents / 100).toFixed(2),
      deliveryFeeCents: (values.deliveryFeeCents / 100).toFixed(2),
    },
  });
  const submit = form.handleSubmit(async (input) => {
    setMessage("");
    try {
      await requestJson("/api/settings", z.object({ saved: z.boolean() }), {
        ...jsonBody(input),
        method: "PATCH",
      });
      setMessage("Your dealership profile has been saved.");
      await refresh.revalidate();
    } catch (error) {
      form.setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "The profile could not be saved.",
      });
    }
  });
  return (
    <form
      noValidate
      onSubmit={(e) => {
        void submit(e);
      }}
      className="space-y-5"
    >
      <ProfileFields form={form} />
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
        {form.formState.isSubmitting ? "Saving…" : "Save dealership profile"}
      </Button>
    </form>
  );
}

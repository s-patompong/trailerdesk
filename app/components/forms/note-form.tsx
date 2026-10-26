import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { useRevalidator } from "react-router";
import { z } from "zod";

import { noteInput } from "../../../server/platform/note-input";
import { jsonBody, requestJson } from "../../lib/request-json";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { Textarea } from "../ui/textarea";

export function NoteForm({ endpoint }: { endpoint: string }) {
  const id = useId();
  const refresh = useRevalidator();
  const form = useForm<z.infer<typeof noteInput>>({
    resolver: zodResolver(noteInput),
    mode: "onBlur",
    defaultValues: { body: "" },
  });
  const submit = form.handleSubmit(async (input) => {
    try {
      await requestJson(
        endpoint,
        z.object({ saved: z.boolean() }),
        jsonBody(input),
      );
      form.reset();
      await refresh.revalidate();
    } catch (error) {
      form.setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "The note could not be saved.",
      });
    }
  });
  return (
    <form
      noValidate
      onSubmit={(e) => {
        void submit(e);
      }}
      className="space-y-3"
    >
      <Field data-invalid={Boolean(form.formState.errors.body)}>
        <FieldLabel htmlFor={id}>Add a note</FieldLabel>
        <Textarea
          id={id}
          {...form.register("body")}
          aria-invalid={Boolean(form.formState.errors.body)}
          aria-describedby={`${id}-error`}
        />
        <FieldError id={`${id}-error`}>
          {form.formState.errors.body?.message}
        </FieldError>
      </Field>
      {form.formState.errors.root && (
        <Alert variant="destructive">
          <AlertDescription>
            {form.formState.errors.root.message}
          </AlertDescription>
        </Alert>
      )}
      <Button disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Saving…" : "Save note"}
      </Button>
    </form>
  );
}

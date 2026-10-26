import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRevalidator } from "react-router";
import { z } from "zod";

import { leadUpdate } from "../../../server/features/leads/leads.schemas";
import { jsonBody, requestJson } from "../../lib/request-json";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { NativeSelect, NativeSelectOption } from "../ui/native-select";

function useLeadControls({
  id,
  stage,
  assignedTo,
}: {
  id: string;
  stage: string;
  assignedTo: string | null;
  staff: { id: string; name: string }[];
}) {
  const refresh = useRevalidator();
  const initial = leadUpdate.safeParse({ stage, assignedTo: assignedTo ?? "" });
  const form = useForm<z.infer<typeof leadUpdate>>({
    resolver: zodResolver(leadUpdate),
    mode: "onBlur",
    defaultValues: initial.success
      ? initial.data
      : { stage: "new", assignedTo: "" },
  });
  const submit = form.handleSubmit(async (input) => {
    try {
      await requestJson(`/api/leads/${id}`, z.object({ saved: z.boolean() }), {
        ...jsonBody(input),
        method: "PATCH",
      });
      await refresh.revalidate();
    } catch (error) {
      form.setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "The lead could not be saved.",
      });
    }
  });
  return { form, submit };
}

export function LeadControls({
  id,
  stage,
  assignedTo,
  staff,
}: Parameters<typeof useLeadControls>[0]) {
  const { form, submit } = useLeadControls({ id, stage, assignedTo, staff });
  return (
    <form
      noValidate
      onSubmit={(e) => {
        void submit(e);
      }}
      className="space-y-3"
    >
      <Field>
        <FieldLabel htmlFor={`${id}-stage`}>Stage</FieldLabel>
        <NativeSelect id={`${id}-stage`} {...form.register("stage")}>
          {["new", "contacted", "quoted", "won", "lost"].map((value) => (
            <NativeSelectOption key={value} value={value}>
              {value[0]?.toUpperCase()}
              {value.slice(1)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <FieldError>{form.formState.errors.stage?.message}</FieldError>
      </Field>
      <Field>
        <FieldLabel htmlFor={`${id}-assigned`}>Assigned salesperson</FieldLabel>
        <NativeSelect id={`${id}-assigned`} {...form.register("assignedTo")}>
          <NativeSelectOption value="">Choose a salesperson</NativeSelectOption>
          {staff.map((person) => (
            <NativeSelectOption key={person.id} value={person.id}>
              {person.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <FieldError>{form.formState.errors.assignedTo?.message}</FieldError>
      </Field>
      {form.formState.errors.root && (
        <Alert variant="destructive">
          <AlertDescription>
            {form.formState.errors.root.message}
          </AlertDescription>
        </Alert>
      )}
      <Button size="sm" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Saving…" : "Save lead"}
      </Button>
    </form>
  );
}

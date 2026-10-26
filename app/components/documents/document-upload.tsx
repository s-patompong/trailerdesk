import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRevalidator } from "react-router";
import { z } from "zod";

import {
  documentFile,
  documentInput,
} from "../../../server/features/search/search.schemas";
import { requestJson } from "../../lib/request-json";
import { TextField } from "../forms/text-field";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { NativeSelect, NativeSelectOption } from "../ui/native-select";

const uploadInput = documentInput.extend({
  file: z
    .custom<FileList>(
      (value) => typeof FileList !== "undefined" && value instanceof FileList,
      { error: "Choose a PDF or Markdown document." },
    )
    .transform((files) => files.item(0))
    .pipe(documentFile),
});
export function DocumentUpload() {
  const refresh = useRevalidator();
  const form = useForm<
    z.input<typeof uploadInput>,
    unknown,
    z.output<typeof uploadInput>
  >({
    resolver: zodResolver(uploadInput),
    mode: "onBlur",
    defaultValues: { title: "", public: true },
  });
  const submit = form.handleSubmit(async (input) => {
    try {
      const body = new FormData();
      body.set("title", input.title);
      body.set("public", String(input.public));
      body.set("file", input.file);
      await requestJson("/api/documents", z.object({ id: z.uuid() }), {
        method: "POST",
        body,
      });
      form.reset();
      await refresh.revalidate();
    } catch (error) {
      form.setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "The document could not be uploaded.",
      });
    }
  });
  return (
    <form
      onSubmit={(e) => {
        void submit(e);
      }}
      noValidate
      className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2"
    >
      <TextField
        label="Document title"
        registration={form.register("title")}
        error={form.formState.errors.title?.message}
      />
      <DocumentVisibility
        registration={form.register("public", {
          setValueAs: (value) => value === "true" || value === true,
        })}
      />
      <Field data-invalid={Boolean(form.formState.errors.file)}>
        <FieldLabel htmlFor="document-file">
          PDF or Markdown, up to 10 MB
        </FieldLabel>
        <Input
          id="document-file"
          type="file"
          accept=".pdf,.md,.markdown,.txt"
          {...form.register("file")}
          aria-invalid={Boolean(form.formState.errors.file)}
          aria-describedby="document-file-error"
        />
        <FieldError id="document-file-error">
          {form.formState.errors.file?.message}
        </FieldError>
      </Field>
      <Button className="self-end" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Uploading…" : "Upload document"}
      </Button>
      {form.formState.errors.root && (
        <Alert variant="destructive" className="sm:col-span-2">
          <AlertDescription>
            {form.formState.errors.root.message}
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}

function DocumentVisibility({
  registration,
}: {
  registration: import("react-hook-form").UseFormRegisterReturn;
}) {
  return (
    <Field>
      <FieldLabel htmlFor="document-visibility">Who can read this?</FieldLabel>
      <NativeSelect id="document-visibility" {...registration}>
        <NativeSelectOption value="true">
          Shoppers and all staff
        </NativeSelectOption>
        <NativeSelectOption value="false">
          Owners and Managers only
        </NativeSelectOption>
      </NativeSelect>
    </Field>
  );
}

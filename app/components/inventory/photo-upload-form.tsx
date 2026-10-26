import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Form, useNavigation, useSubmit } from "react-router";
import { z } from "zod";

import { photoSchema } from "../../../server/features/inventory/inventory.schemas";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

const uploadSchema = z.object({ photo: photoSchema });
export function PhotoUploadForm({
  serverError,
}: {
  serverError: string | null | undefined;
}) {
  const submit = useSubmit();
  const pending = useNavigation().state !== "idle";
  const form = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
    mode: "onBlur",
  });
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Trailer photos</CardTitle>
        <CardDescription>
          JPG, PNG or WebP, up to 8 MB. Your first photo becomes the cover.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form
          method="post"
          encType="multipart/form-data"
          noValidate
          className="space-y-4"
          onSubmit={(event) => {
            const element = event.currentTarget;
            void form.handleSubmit(() => {
              void submit(element, {
                method: "post",
                encType: "multipart/form-data",
              });
            })(event);
          }}
        >
          <Controller
            name="photo"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="trailer-photo">Photo</FieldLabel>
                <Input
                  id="trailer-photo"
                  name={field.name}
                  ref={field.ref}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onBlur={field.onBlur}
                  onChange={(event) => {
                    field.onChange(event.target.files?.[0]);
                  }}
                  aria-invalid={fieldState.invalid}
                  aria-describedby={
                    fieldState.error ? "trailer-photo-error" : undefined
                  }
                />
                {fieldState.error && (
                  <FieldError id="trailer-photo-error">
                    {fieldState.error.message}
                  </FieldError>
                )}
              </Field>
            )}
          />
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Uploading…" : "Upload photo"}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, useNavigation, useSubmit } from "react-router";

import { publicFilters } from "../../../server/features/public-site/public-site.schemas";
import { TextField } from "../forms/text-field";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Field, FieldLabel } from "../ui/field";
import { NativeSelect, NativeSelectOption } from "../ui/native-select";

import type { z } from "zod";

const types = publicFilters.shape.type.unwrap().options;
export function PublicFilters({
  values,
}: {
  values: z.output<typeof publicFilters>;
}) {
  const submit = useSubmit();
  const pending = useNavigation().state !== "idle";
  const form = useForm<
    z.input<typeof publicFilters>,
    unknown,
    z.output<typeof publicFilters>
  >({
    resolver: zodResolver(publicFilters),
    mode: "onBlur",
    defaultValues: values,
  });
  return (
    <Card className="mb-6 shadow-none">
      <CardContent>
        <Form
          role="search"
          noValidate
          className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_180px_140px_auto]"
          onSubmit={(event) => {
            void form.handleSubmit((values) => {
              void submit(values, { method: "get" });
            })(event);
          }}
        >
          <TextField
            label="Search trailers"
            registration={form.register("q")}
            error={form.formState.errors.q?.message}
            placeholder="7x14 enclosed"
          />
          <Field>
            <FieldLabel htmlFor="public-type">Trailer type</FieldLabel>
            <NativeSelect id="public-type" {...form.register("type")}>
              {types.map((type) => (
                <NativeSelectOption key={type} value={type}>
                  {type ? type.replaceAll("_", " ") : "All trailer types"}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <TextField
            label="Max price ($)"
            registration={form.register("maxPrice")}
            error={form.formState.errors.maxPrice?.message}
            inputMode="numeric"
            placeholder="9000"
          />
          <Button type="submit" className="mt-6" disabled={pending}>
            {pending ? "Finding…" : "Find trailers"}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}

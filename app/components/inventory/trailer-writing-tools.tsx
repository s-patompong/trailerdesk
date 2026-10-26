import { useFormContext } from "react-hook-form";

import { trailerFormSchema } from "../../../server/features/inventory/inventory.schemas";
import { TextField } from "../forms/text-field";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { Textarea } from "../ui/textarea";

import { useVinLookup, useDescriptionDraft } from "./use-trailer-writing-tools";

import type { z } from "zod";

export function TrailerWritingTools() {
  const form = useFormContext<z.input<typeof trailerFormSchema>>();
  const vin = useVinLookup(form);
  const description = useDescriptionDraft(form);
  const busy = vin.busy || description.busy;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-64 flex-1">
          <TextField
            label="VIN"
            registration={form.register("vin")}
            error={form.formState.errors.vin?.message}
            placeholder="17-character VIN"
            description="Use the VIN plate. Partial VINs can be looked up, but saving requires all 17 characters."
          />
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          className="mt-6"
          onClick={() => {
            void vin.lookup();
          }}
        >
          Look up VIN
        </Button>
      </div>
      <Field data-invalid={Boolean(form.formState.errors.description)}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <FieldLabel htmlFor="description">Listing description</FieldLabel>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => {
              void description.draft();
            }}
          >
            {busy ? "Working…" : "Write listing description"}
          </Button>
        </div>
        <Textarea
          id="description"
          rows={5}
          aria-invalid={Boolean(form.formState.errors.description)}
          aria-describedby="description-error"
          {...form.register("description")}
        />
        {form.formState.errors.description && (
          <FieldError id="description-error">
            {form.formState.errors.description.message}
          </FieldError>
        )}
      </Field>
      {(vin.message || description.message) && (
        <Alert>
          <AlertDescription>
            {description.message || vin.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

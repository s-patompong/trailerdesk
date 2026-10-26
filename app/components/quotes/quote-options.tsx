import { useFieldArray } from "react-hook-form";

import { TextField } from "../forms/text-field";
import { Button } from "../ui/button";

import type { quoteForm } from "../../../server/features/quotes/quotes.schemas";
import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";

export type QuoteFormState = UseFormReturn<
  z.input<typeof quoteForm>,
  unknown,
  z.output<typeof quoteForm>
>;
export function QuoteOptions({ form }: { form: QuoteFormState }) {
  const options = useFieldArray({ control: form.control, name: "options" });
  return (
    <section className="space-y-4">
      <h2 className="font-semibold">Add-on options</h2>
      {options.fields.map((field, index) => (
        <div
          key={field.id}
          className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <TextField
            label={`Add-on ${String(index + 1)}`}
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- React Hook Form uses numeric field indexes.
            registration={form.register(`options.${index}.name`)}
            error={form.formState.errors.options?.[index]?.name?.message}
          />
          <TextField
            label={`Add-on ${String(index + 1)} price ($)`}
            inputMode="decimal"
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- React Hook Form uses numeric field indexes.
            registration={form.register(`options.${index}.priceCents`)}
            error={form.formState.errors.options?.[index]?.priceCents?.message}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              options.remove(index);
            }}
            aria-label={`Remove add-on ${String(index + 1)}`}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        disabled={options.fields.length >= 8}
        onClick={() => {
          options.append({ name: "", priceCents: "0.00" });
        }}
      >
        Add an option
      </Button>
    </section>
  );
}

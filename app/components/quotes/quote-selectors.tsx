import { Field, FieldError, FieldLabel } from "../ui/field";
import { NativeSelect, NativeSelectOption } from "../ui/native-select";

import type { QuoteFormState } from "./quote-options";

export interface QuoteChoices {
  customers: { id: string; name: string }[];
  trailers: {
    id: string;
    year: number;
    make: string;
    model: string;
    askingPriceCents: number;
    status: string;
  }[];
}
export function QuoteSelectors({
  form,
  customers,
  trailers,
}: { form: QuoteFormState } & QuoteChoices) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field>
        <FieldLabel htmlFor="quote-trailer">Trailer</FieldLabel>
        <NativeSelect
          id="quote-trailer"
          {...form.register("trailerId")}
          aria-invalid={Boolean(form.formState.errors.trailerId)}
          aria-describedby="quote-trailer-error"
        >
          <NativeSelectOption value="">Choose a trailer</NativeSelectOption>
          {trailers
            .filter((trailer) => trailer.status !== "sold")
            .map((trailer) => (
              <NativeSelectOption key={trailer.id} value={trailer.id}>
                {trailer.year} {trailer.make} {trailer.model}
              </NativeSelectOption>
            ))}
        </NativeSelect>
        <FieldError id="quote-trailer-error">
          {form.formState.errors.trailerId?.message}
        </FieldError>
      </Field>
      <Field>
        <FieldLabel htmlFor="quote-customer">Customer</FieldLabel>
        <NativeSelect
          id="quote-customer"
          {...form.register("customerId")}
          aria-invalid={Boolean(form.formState.errors.customerId)}
          aria-describedby="quote-customer-error"
        >
          <NativeSelectOption value="">Choose a customer</NativeSelectOption>
          {customers.map((customer) => (
            <NativeSelectOption key={customer.id} value={customer.id}>
              {customer.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <FieldError id="quote-customer-error">
          {form.formState.errors.customerId?.message}
        </FieldError>
      </Field>
    </div>
  );
}

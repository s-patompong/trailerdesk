import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, useNavigation, useSubmit } from "react-router";

import { holdRequest } from "../../../server/features/holds/holds.schemas";
import { Button } from "../ui/button";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { NativeSelect, NativeSelectOption } from "../ui/native-select";

import type { listCustomers } from "../../../server/features/customers/customers.service";
import type { z } from "zod";

export function HoldForm({
  customers,
}: {
  customers: Awaited<ReturnType<typeof listCustomers>>;
}) {
  const submit = useSubmit();
  const pending = useNavigation().state !== "idle";
  const form = useForm<z.infer<typeof holdRequest>>({
    resolver: zodResolver(holdRequest),
    mode: "onBlur",
    defaultValues: { customerId: "" },
  });
  return (
    <Form
      method="post"
      noValidate
      className="space-y-4"
      onSubmit={(event) => {
        void form.handleSubmit((values) => {
          void submit({ ...values, intent: "hold" }, { method: "post" });
        })(event);
      }}
    >
      <Field data-invalid={Boolean(form.formState.errors.customerId)}>
        <FieldLabel htmlFor="hold-customer">Customer</FieldLabel>
        <NativeSelect
          id="hold-customer"
          aria-invalid={Boolean(form.formState.errors.customerId)}
          aria-describedby={
            form.formState.errors.customerId ? "hold-customer-error" : undefined
          }
          {...form.register("customerId")}
        >
          <NativeSelectOption value="">Choose a customer</NativeSelectOption>
          {customers.map((customer) => (
            <NativeSelectOption key={customer.id} value={customer.id}>
              {customer.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        {form.formState.errors.customerId && (
          <FieldError id="hold-customer-error">
            Choose a customer before placing a hold.
          </FieldError>
        )}
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Placing hold…" : "Place hold"}
      </Button>
    </Form>
  );
}

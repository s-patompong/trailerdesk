import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";

import { quoteForm } from "../../../server/features/quotes/quotes.schemas";
import { formatMoney, quoteTotals } from "../../../server/platform/money";
import { jsonBody, requestJson } from "../../lib/request-json";
import { TextField } from "../forms/text-field";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";

import { QuoteOptions } from "./quote-options";
import { QuoteSelectors } from "./quote-selectors";

import type { QuoteFormState } from "./quote-options";
import type { QuoteChoices } from "./quote-selectors";

interface Props extends QuoteChoices {
  trailerId: string;
  customerId: string;
  defaults: { docFeeCents: number; deliveryFeeCents: number; taxBps: number };
}
function useQuoteBuilder({ trailers, trailerId, customerId, defaults }: Props) {
  const navigate = useNavigate();
  const form = useForm<
    z.input<typeof quoteForm>,
    unknown,
    z.output<typeof quoteForm>
  >({
    resolver: zodResolver(quoteForm),
    mode: "onBlur",
    defaultValues: {
      trailerId,
      customerId,
      options: [],
      docFeeCents: (defaults.docFeeCents / 100).toFixed(2),
      deliveryFeeCents: (defaults.deliveryFeeCents / 100).toFixed(2),
      tradeInCents: "0.00",
      taxBps: (defaults.taxBps / 100).toFixed(2),
    },
  });
  const submit = form.handleSubmit(async (input) => {
    try {
      const trailer = trailers.find((row) => row.id === input.trailerId);
      if (trailer)
        quoteTotals({ ...input, trailerPriceCents: trailer.askingPriceCents });
      const quote = await requestJson(
        "/api/quotes",
        z.object({ id: z.uuid() }),
        jsonBody(input),
      );
      await navigate(`/quotes/${quote.id}`);
    } catch (error) {
      form.setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "The quote could not be saved.",
      });
    }
  });
  return { form, submit };
}

export function QuoteBuilder({
  customers,
  trailers,
  trailerId,
  customerId,
  defaults,
}: Props) {
  const { form, submit } = useQuoteBuilder({
    customers,
    trailers,
    trailerId,
    customerId,
    defaults,
  });
  return (
    <form
      noValidate
      onSubmit={(e) => {
        void submit(e);
      }}
      className="mt-6 space-y-6 rounded-xl border bg-card p-5 sm:p-6"
    >
      <QuoteSelectors form={form} customers={customers} trailers={trailers} />
      <QuoteOptions form={form} />
      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            { name: "docFeeCents", label: "Document fee ($)" },
            { name: "deliveryFeeCents", label: "Delivery fee ($)" },
            { name: "tradeInCents", label: "Trade-in allowance ($)" },
            { name: "taxBps", label: "Sales tax rate (%)" },
          ] as const
        ).map((field) => (
          <TextField
            key={field.name}
            label={field.label}
            inputMode="decimal"
            registration={form.register(field.name)}
            error={form.formState.errors[field.name]?.message}
          />
        ))}
      </div>
      <QuotePreview form={form} trailers={trailers} />
      {form.formState.errors.root && (
        <Alert variant="destructive">
          <AlertDescription>
            {form.formState.errors.root.message}
          </AlertDescription>
        </Alert>
      )}
      <Button disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting
          ? "Creating quote and PDF…"
          : "Create quote"}
      </Button>
    </form>
  );
}
function QuotePreview({
  form,
  trailers,
}: {
  form: QuoteFormState;
  trailers: QuoteChoices["trailers"];
}) {
  const values = useWatch({ control: form.control });
  const parsed = quoteForm.safeParse(values);
  const trailer = trailers.find((row) => row.id === values.trailerId);
  let message = "Choose a trailer and enter fees to see the total.";
  if (parsed.success && trailer) {
    try {
      const total = quoteTotals({
        ...parsed.data,
        trailerPriceCents: trailer.askingPriceCents,
      });
      message = `Total ${formatMoney(total.totalCents)}, including ${formatMoney(total.taxCents)} sales tax.`;
    } catch (error) {
      message =
        error instanceof Error ? error.message : "Check the quote amounts.";
    }
  }
  return (
    <p
      className="rounded-lg bg-primary/5 p-4 font-semibold text-primary"
      aria-live="polite"
    >
      {message}
    </p>
  );
}

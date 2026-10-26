import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useRef } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { Form, useNavigation, useSubmit } from "react-router";

import { inquiryInput } from "../../../server/features/public-site/public-site.schemas";
import { TextField } from "../forms/text-field";
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
import { NativeSelect, NativeSelectOption } from "../ui/native-select";
import { Textarea } from "../ui/textarea";

import { Turnstile } from "./turnstile";

import type { z } from "zod";

const formSchema = inquiryInput.omit({ requestId: true });
export function InquiryForm({
  trailerId,
  siteKey,
  error,
  accepted,
  attemptId,
}: {
  trailerId: string;
  siteKey: string;
  error: string | undefined;
  accepted: boolean;
  attemptId: string | undefined;
}) {
  const pending = useNavigation().state !== "idle";
  const { form, onToken, onSubmit } = useInquiryForm(trailerId);
  if (accepted)
    return (
      <Alert className="mt-6">
        <AlertDescription>
          Thanks! The dealership received your inquiry and will be in touch.
          Check your email for a confirmation.
        </AlertDescription>
      </Alert>
    );
  return (
    <FormProvider {...form}>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Find your next trailer</CardTitle>
          <CardDescription>
            Ask a question or request a quote. The dealership will follow up
            with you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form
            method="post"
            noValidate
            className="space-y-5"
            onSubmit={onSubmit}
          >
            <InquiryFields />
            <Turnstile key={attemptId} siteKey={siteKey} onToken={onToken} />
            {form.formState.errors.turnstileToken && (
              <FieldError>
                {form.formState.errors.turnstileToken.message}
              </FieldError>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? "Sending…" : "Send inquiry"}
            </Button>
          </Form>
        </CardContent>
      </Card>
    </FormProvider>
  );
}

function InquiryFields() {
  const form = useFormContext<z.input<typeof formSchema>>();
  return (
    <>
      <input type="hidden" {...form.register("trailerId")} />
      <input type="hidden" {...form.register("turnstileToken")} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Your name"
          registration={form.register("name")}
          error={form.formState.errors.name?.message}
          autoComplete="name"
        />
        <TextField
          label="Email address"
          registration={form.register("email")}
          error={form.formState.errors.email?.message}
          type="email"
          autoComplete="email"
        />
        <TextField
          label="Phone (optional)"
          registration={form.register("phone")}
          error={form.formState.errors.phone?.message}
          type="tel"
          autoComplete="tel"
        />
        <Field>
          <FieldLabel htmlFor="inquiry-intent">How can we help?</FieldLabel>
          <NativeSelect id="inquiry-intent" {...form.register("intent")}>
            <NativeSelectOption value="availability">
              Is this still available?
            </NativeSelectOption>
            <NativeSelectOption value="quote">
              Request a quote
            </NativeSelectOption>
          </NativeSelect>
        </Field>
      </div>
      <Field data-invalid={Boolean(form.formState.errors.message)}>
        <FieldLabel htmlFor="inquiry-message">
          Your question (optional)
        </FieldLabel>
        <Textarea
          id="inquiry-message"
          rows={4}
          aria-invalid={Boolean(form.formState.errors.message)}
          aria-describedby="inquiry-message-error"
          {...form.register("message")}
        />
        {form.formState.errors.message && (
          <FieldError id="inquiry-message-error">
            {form.formState.errors.message.message}
          </FieldError>
        )}
      </Field>
    </>
  );
}

function useInquiryForm(trailerId: string) {
  const submit = useSubmit();
  const requestId = useRef<string | null>(null);
  const form = useForm<
    z.input<typeof formSchema>,
    unknown,
    z.output<typeof formSchema>
  >({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      trailerId,
      name: "",
      email: "",
      phone: "",
      message: "",
      intent: "availability",
      turnstileToken: "",
    },
  });
  const setValue = form.setValue;
  const onToken = useCallback(
    (token: string) => {
      setValue("turnstileToken", token, { shouldValidate: true });
    },
    [setValue],
  );
  function onSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    void form.handleSubmit((values) => {
      requestId.current ??= crypto.randomUUID();
      void submit(
        { ...values, requestId: requestId.current },
        { method: "post" },
      );
    })(event);
  }
  return { form, onToken, onSubmit };
}

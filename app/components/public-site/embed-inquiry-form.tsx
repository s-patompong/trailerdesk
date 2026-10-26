import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { Form, useNavigation, useSubmit } from "react-router";

import { embedInquiryInput } from "../../../server/features/public-site/public-site.schemas";
import { TextField } from "../forms/text-field";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { NativeSelect, NativeSelectOption } from "../ui/native-select";
import { Textarea } from "../ui/textarea";

import { Turnstile } from "./turnstile";

import type { z } from "zod";

const formSchema = embedInquiryInput.omit({ requestId: true });
type FormValues = z.input<typeof formSchema>;

interface EmbedFormCopy {
  heading: string;
  description: string;
  submitLabel: string;
  successMessage: string;
  dealershipName: string;
  phone: string;
}

export function EmbedInquiryForm({
  copy,
  siteKey,
  error,
  accepted,
  attemptId,
}: {
  copy: EmbedFormCopy;
  siteKey: string;
  error: string | undefined;
  accepted: boolean;
  attemptId: string | undefined;
}) {
  useEmbedHeight();
  const pending = useNavigation().state !== "idle";
  const { form, onToken, onSubmit } = useEmbedForm();
  if (accepted)
    return (
      <EmbedFrame>
        <Alert>
          <AlertDescription>{copy.successMessage}</AlertDescription>
        </Alert>
      </EmbedFrame>
    );
  return (
    <EmbedFrame>
      <FormProvider {...form}>
        <EmbedInquiryCard
          copy={copy}
          siteKey={siteKey}
          error={error}
          attemptId={attemptId}
          pending={pending}
          onToken={onToken}
          onSubmit={onSubmit}
        />
      </FormProvider>
    </EmbedFrame>
  );
}

function EmbedInquiryCard({
  copy,
  siteKey,
  error,
  attemptId,
  pending,
  onToken,
  onSubmit,
}: {
  copy: EmbedFormCopy;
  siteKey: string;
  error: string | undefined;
  attemptId: string | undefined;
  pending: boolean;
  onToken: (token: string) => void;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
}) {
  const form = useFormContext<FormValues>();
  return (
    <Card>
      <CardHeader>
        <p className="text-xs font-semibold tracking-widest text-primary uppercase">
          {copy.dealershipName}
        </p>
        <CardTitle>{copy.heading}</CardTitle>
        <p className="text-sm text-muted-foreground">{copy.description}</p>
      </CardHeader>
      <CardContent>
        <Form
          method="post"
          noValidate
          className="space-y-4"
          onSubmit={onSubmit}
        >
          <EmbedContactFields />
          <input type="hidden" {...form.register("turnstileToken")} />
          <Turnstile
            key={attemptId}
            siteKey={siteKey}
            action="embed-inquiry"
            onToken={onToken}
          />
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
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Sending…" : copy.submitLabel}
          </Button>
          {copy.phone && (
            <p className="text-center text-xs text-muted-foreground">
              Prefer to call? {copy.phone}
            </p>
          )}
        </Form>
      </CardContent>
    </Card>
  );
}

function EmbedContactFields() {
  const form = useFormContext<FormValues>();
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
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
          <FieldLabel htmlFor="embed-intent">How can we help?</FieldLabel>
          <NativeSelect id="embed-intent" {...form.register("intent")}>
            <NativeSelectOption value="general">
              Ask a question
            </NativeSelectOption>
            <NativeSelectOption value="availability">
              Check availability
            </NativeSelectOption>
            <NativeSelectOption value="quote">
              Request a quote
            </NativeSelectOption>
          </NativeSelect>
        </Field>
      </div>
      <Field data-invalid={Boolean(form.formState.errors.message)}>
        <FieldLabel htmlFor="embed-message">Your question</FieldLabel>
        <Textarea
          id="embed-message"
          rows={4}
          aria-invalid={Boolean(form.formState.errors.message)}
          aria-describedby="embed-message-error"
          {...form.register("message")}
        />
        {form.formState.errors.message && (
          <FieldError id="embed-message-error">
            {form.formState.errors.message.message}
          </FieldError>
        )}
      </Field>
    </>
  );
}

function EmbedFrame({ children }: { children: React.ReactNode }) {
  return <main className="bg-background p-1 sm:p-3">{children}</main>;
}

function useEmbedForm() {
  const submit = useSubmit();
  const requestId = useRef<string | null>(null);
  const form = useForm<FormValues, unknown, z.output<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
      intent: "general",
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
      const submission: Record<string, string> = {
        requestId: requestId.current,
        name: values.name,
        email: values.email,
        phone: values.phone,
        message: values.message,
        intent: values.intent,
        turnstileToken: values.turnstileToken,
      };
      if (values.trailerId) submission.trailerId = values.trailerId;
      void submit(submission, { method: "post" });
    })(event);
  }
  return { form, onToken, onSubmit };
}

function useEmbedHeight(): void {
  useEffect(() => {
    const report = () => {
      window.parent.postMessage(
        {
          type: "trailerdesk:embed-height",
          height: document.body.scrollHeight,
        },
        "*",
      );
    };
    const observer = new ResizeObserver(report);
    observer.observe(document.body);
    report();
    return () => {
      observer.disconnect();
    };
  }, []);
}

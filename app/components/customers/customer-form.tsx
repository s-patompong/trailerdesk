import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";

import { customerInput } from "../../../server/features/customers/customers.schemas";
import { jsonBody, requestJson } from "../../lib/request-json";
import { TextField } from "../forms/text-field";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";

export function CustomerForm() {
  const navigate = useNavigate();
  const form = useForm<
    z.input<typeof customerInput>,
    unknown,
    z.output<typeof customerInput>
  >({
    resolver: zodResolver(customerInput),
    mode: "onBlur",
    defaultValues: { name: "", email: "", phone: "" },
  });
  const submit = form.handleSubmit(async (input) => {
    try {
      const created = await requestJson(
        "/api/customers",
        z.object({ id: z.uuid() }),
        jsonBody(input),
      );
      await navigate(`/customers/${created.id}`);
    } catch (error) {
      form.setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "The customer could not be saved.",
      });
    }
  });
  return (
    <form
      noValidate
      onSubmit={(e) => {
        void submit(e);
      }}
      className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2"
    >
      <TextField
        label="Customer name"
        registration={form.register("name")}
        error={form.formState.errors.name?.message}
      />
      <TextField
        label="Email address"
        type="email"
        registration={form.register("email")}
        error={form.formState.errors.email?.message}
      />
      <TextField
        label="Phone"
        type="tel"
        registration={form.register("phone")}
        error={form.formState.errors.phone?.message}
      />
      <Button className="self-end" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Saving…" : "Add customer"}
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

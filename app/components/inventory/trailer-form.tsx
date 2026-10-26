import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { Form, Link, useNavigation, useSubmit } from "react-router";

import { trailerFormSchema } from "../../../server/features/inventory/inventory.schemas";
import { useHydrated } from "../../lib/use-hydrated";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { FieldSet } from "../ui/field";
import { Separator } from "../ui/separator";

import { TrailerFormFields } from "./trailer-form-fields";
import { TrailerWritingTools } from "./trailer-writing-tools";

import type { z } from "zod";

export function TrailerForm({
  year,
  serverError,
  initialValues,
  version,
}: {
  initialValues?: z.input<typeof trailerFormSchema>;
  version?: number;
  year: number;
  serverError: string | undefined;
}) {
  const hydrated = useHydrated();
  const submit = useSubmit();
  const pending = useNavigation().state !== "idle";
  const form = useForm<
    z.input<typeof trailerFormSchema>,
    unknown,
    z.output<typeof trailerFormSchema>
  >({
    resolver: zodResolver(trailerFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: initialValues ?? trailerDefaults(year),
  });
  return (
    <FormProvider {...form}>
      <Form
        method="post"
        noValidate
        onSubmit={(event) => {
          const element = event.currentTarget;
          void form.handleSubmit(() => {
            void submit(element, { method: "post" });
          })(event);
        }}
        aria-busy={pending}
      >
        {version !== undefined && (
          <input type="hidden" name="version" value={version} />
        )}
        <FieldSet disabled={!hydrated || pending} className="contents">
          <Card>
            <CardHeader>
              <CardTitle>Trailer details</CardTitle>
              <CardDescription>
                Enter the details from the trailer plate and your stock record.
                Prices are in US dollars.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-7">
              <TrailerFormFields />
              <Separator />
              <TrailerWritingTools />
              {serverError && (
                <Alert variant="destructive">
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}
              <div className="flex justify-end gap-3">
                <Button asChild variant="outline">
                  <Link to="/inventory">Cancel</Link>
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving…" : "Save trailer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </FieldSet>
      </Form>
    </FormProvider>
  );
}

function trailerDefaults(year: number): z.input<typeof trailerFormSchema> {
  return {
    vin: "",
    stockNumber: "",
    year,
    make: "",
    model: "",
    type: "utility",
    size: "",
    gvwr: "",
    axles: 2,
    hitchType: "bumper_pull",
    doorType: "none",
    color: "",
    condition: "new",
    lotLocation: "",
    askingPriceCents: "",
    dealerCostCents: "",
    status: "in_stock",
    description: "",
  };
}

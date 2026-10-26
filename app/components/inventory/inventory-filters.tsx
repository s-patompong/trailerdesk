import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, useNavigation, useSubmit } from "react-router";

import { inventoryFilters } from "../../../server/features/inventory/inventory.schemas";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

import { InventoryFilterSelects } from "./inventory-filter-selects";
import { InventorySearchField } from "./inventory-search-field";

import type { z } from "zod";

export function InventoryFilters({
  values,
}: {
  values: z.output<typeof inventoryFilters>;
}) {
  const submit = useSubmit();
  const pending = useNavigation().state !== "idle";
  const form = useForm<
    z.input<typeof inventoryFilters>,
    unknown,
    z.output<typeof inventoryFilters>
  >({
    resolver: zodResolver(inventoryFilters),
    mode: "onBlur",
    defaultValues: values,
  });
  const error = form.formState.errors.q;
  return (
    <Card className="mt-7 py-4 shadow-none">
      <CardContent>
        <Form
          role="search"
          noValidate
          onSubmit={(event) => {
            void form.handleSubmit((parsed) => {
              const params = Object.fromEntries(
                Object.entries(parsed).filter(([, value]) => value !== ""),
              );
              void submit(params, { method: "get" });
            })(event);
          }}
          className="grid items-start gap-4 md:grid-cols-3 xl:grid-cols-[minmax(0,1fr)_130px_140px_120px_150px_auto]"
        >
          <InventorySearchField register={form.register} error={error} />
          <InventoryFilterSelects register={form.register} />
          <Button variant="secondary" type="submit" disabled={pending}>
            {pending ? "Searching…" : "Search"}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}

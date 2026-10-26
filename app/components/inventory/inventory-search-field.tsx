import { Search } from "lucide-react";

import { Field, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

import type { inventoryFilters } from "../../../server/features/inventory/inventory.schemas";
import type { UseFormRegister, FieldError as FormError } from "react-hook-form";
import type { z } from "zod";
export function InventorySearchField({
  register,
  error,
}: {
  register: UseFormRegister<z.input<typeof inventoryFilters>>;
  error: FormError | undefined;
}) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel className="sr-only" htmlFor="inventory-search">
        Search inventory
      </FieldLabel>
      <div className="relative">
        <Search
          className="absolute top-2.5 left-3 size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id="inventory-search"
          className="pl-9"
          placeholder="Search make, model, VIN or stock number"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "inventory-search-error" : undefined}
          {...register("q")}
        />
      </div>
      {error && (
        <FieldError id="inventory-search-error">{error.message}</FieldError>
      )}
    </Field>
  );
}

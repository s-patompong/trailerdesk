import { inventoryFilters } from "../../../server/features/inventory/inventory.schemas";
import { Field, FieldLabel } from "../ui/field";
import { NativeSelect, NativeSelectOption } from "../ui/native-select";

import type { UseFormRegister } from "react-hook-form";
import type { z } from "zod";

const labels: Record<string, string> = {
  in_stock: "In stock",
  on_hold: "On hold",
  on_order: "On order",
  sold: "Sold",
  newest: "Newest arrivals",
  oldest: "Longest on lot",
  price_low: "Price: low to high",
  price_high: "Price: high to low",
  cards: "Card view",
  table: "Table view",
  utility: "Utility",
  enclosed: "Enclosed cargo",
  car_hauler: "Car hauler",
  dump: "Dump",
  equipment: "Equipment",
  gooseneck: "Gooseneck",
  horse_livestock: "Horse / livestock",
};
export function InventoryFilterSelects({
  register,
}: {
  register: UseFormRegister<z.input<typeof inventoryFilters>>;
}) {
  return (
    <>
      {(
        [
          { name: "status", label: "Availability", empty: "All statuses" },
          { name: "sort", label: "Sort inventory", empty: "" },
          { name: "view", label: "Inventory view", empty: "" },
          { name: "type", label: "Trailer type", empty: "All trailer types" },
        ] as const
      ).map((field) => (
        <Field key={field.name}>
          <FieldLabel className="sr-only" htmlFor={`inventory-${field.name}`}>
            {field.label}
          </FieldLabel>
          <NativeSelect
            id={`inventory-${field.name}`}
            {...register(field.name)}
          >
            {inventoryFilters.shape[field.name]
              .unwrap()
              .options.map((option) => (
                <NativeSelectOption key={option} value={option}>
                  {option ? (labels[option] ?? option) : field.empty}
                </NativeSelectOption>
              ))}
          </NativeSelect>
        </Field>
      ))}
    </>
  );
}

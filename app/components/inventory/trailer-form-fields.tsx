import { useFormContext } from "react-hook-form";

import { TextField } from "../forms/text-field";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { NativeSelect, NativeSelectOption } from "../ui/native-select";

import type { trailerFormSchema } from "../../../server/features/inventory/inventory.schemas";
import type { z } from "zod";

const fields = [
  { name: "stockNumber", label: "Stock number", placeholder: "RT-141" },
  { name: "year", label: "Year", type: "number" },
  { name: "make", label: "Make", placeholder: "Big Tex" },
  { name: "model", label: "Model", placeholder: "70PI" },
  { name: "size", label: "Size", placeholder: "7x14" },
  { name: "gvwr", label: "GVWR (lb)", type: "number" },
  { name: "axles", label: "Number of axles", type: "number" },
  { name: "color", label: "Color", placeholder: "Black" },
  { name: "lotLocation", label: "Lot location", placeholder: "Row A" },
  {
    name: "askingPriceCents",
    label: "Asking price ($)",
    placeholder: "8499.00",
    inputMode: "decimal",
  },
  {
    name: "dealerCostCents",
    label: "Dealer cost ($)",
    placeholder: "6200.00",
    inputMode: "decimal",
  },
] as const;
const choices = [
  {
    name: "type",
    label: "Trailer type",
    options: [
      "utility",
      "enclosed",
      "car_hauler",
      "dump",
      "equipment",
      "gooseneck",
      "horse_livestock",
    ],
  },
  {
    name: "hitchType",
    label: "Hitch type",
    options: ["bumper_pull", "gooseneck", "fifth_wheel"],
  },
  { name: "doorType", label: "Door type", options: ["ramp", "barn", "none"] },
  { name: "condition", label: "Condition", options: ["new", "used"] },
  { name: "status", label: "Availability", options: ["in_stock", "on_order"] },
] as const;
export function TrailerFormFields() {
  const {
    register,
    formState: { errors },
  } = useFormContext<z.input<typeof trailerFormSchema>>();
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {fields.map(({ name, label, ...props }) => (
        <TextField
          key={name}
          label={label}
          registration={register(name)}
          error={errors[name]?.message}
          {...props}
        />
      ))}
      {choices.map(({ name, label, options }) => (
        <Field key={name} data-invalid={Boolean(errors[name])}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <NativeSelect
            id={name}
            aria-invalid={Boolean(errors[name])}
            aria-describedby={errors[name] ? `${name}-error` : undefined}
            {...register(name)}
          >
            {options.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {option.replaceAll("_", " ")}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {errors[name] && (
            <FieldError id={`${name}-error`}>{errors[name].message}</FieldError>
          )}
        </Field>
      ))}
    </div>
  );
}

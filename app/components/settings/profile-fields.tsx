import { TextField } from "../forms/text-field";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { NativeSelect, NativeSelectOption } from "../ui/native-select";

import type { profileForm } from "../../../server/features/settings/settings.schemas";
import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";

export type ProfileFormState = UseFormReturn<
  z.input<typeof profileForm>,
  unknown,
  z.output<typeof profileForm>
>;
const timezones = [
  { value: "America/New_York", label: "Eastern Time" },
  { value: "America/Chicago", label: "Central Time" },
  { value: "America/Denver", label: "Mountain Time" },
  { value: "America/Phoenix", label: "Arizona Time (no daylight saving)" },
  { value: "America/Los_Angeles", label: "Pacific Time" },
  { value: "America/Anchorage", label: "Alaska Time" },
  { value: "Pacific/Honolulu", label: "Hawaii Time" },
];
export function ProfileFields({ form }: { form: ProfileFormState }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            { name: "name", label: "Dealership name" },
            { name: "phone", label: "Phone" },
            { name: "address", label: "Address" },
            { name: "hours", label: "Business hours" },
            { name: "docFeeCents", label: "Default document fee ($)" },
            { name: "deliveryFeeCents", label: "Default delivery fee ($)" },
            { name: "taxBps", label: "Default sales tax rate (%)" },
          ] as const
        ).map((field) => (
          <TextField
            key={field.name}
            label={field.label}
            registration={form.register(field.name)}
            error={form.formState.errors[field.name]?.message}
          />
        ))}
      </div>
      <Field>
        <FieldLabel htmlFor="settings-timezone">Dealership timezone</FieldLabel>
        <NativeSelect id="settings-timezone" {...form.register("timezone")}>
          {timezones.map((zone) => (
            <NativeSelectOption key={zone.value} value={zone.value}>
              {zone.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <FieldError>{form.formState.errors.timezone?.message}</FieldError>
      </Field>
      <Field>
        <FieldLabel htmlFor="settings-public">Public inventory site</FieldLabel>
        <NativeSelect
          id="settings-public"
          {...form.register("publicSite", {
            setValueAs: (value) => value === true || value === "true",
          })}
        >
          <NativeSelectOption value="true">Open to shoppers</NativeSelectOption>
          <NativeSelectOption value="false">Turned off</NativeSelectOption>
        </NativeSelect>
      </Field>
    </>
  );
}

import { Field, FieldDescription, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

import type { ComponentProps } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

type TextFieldProps = {
  label: string;
  registration: UseFormRegisterReturn;
  error: string | undefined;
  description?: string;
} & Omit<ComponentProps<typeof Input>, "name">;
export function TextField({
  label,
  registration,
  error,
  description,
  ...props
}: TextFieldProps) {
  const id = props.id ?? registration.name;
  const describedBy =
    [description ? `${id}-help` : "", error ? `${id}-error` : ""]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        {...props}
        {...registration}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
      />
      {description && (
        <FieldDescription id={`${id}-help`}>{description}</FieldDescription>
      )}
      <div className="min-h-5" aria-live="polite">
        {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
      </div>
    </Field>
  );
}

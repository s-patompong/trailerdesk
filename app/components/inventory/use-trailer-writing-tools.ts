import { useState } from "react";

import {
  descriptionResultSchema,
  trailerFormSchema,
  vinResultSchema,
} from "../../../server/features/inventory/inventory.schemas";

import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";
type TrailerForm = UseFormReturn<z.input<typeof trailerFormSchema>>;
export function useVinLookup(form: TrailerForm) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function lookup() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(
        `/api/vin/${encodeURIComponent(form.getValues("vin"))}`,
      );
      const result = vinResultSchema.safeParse(await response.json());
      if (!response.ok || !result.success) {
        setMessage(
          "VIN lookup could not finish. Enter the details yourself or try again.",
        );
        return;
      }
      const value = result.data;
      if (value.make)
        form.setValue("make", value.make, { shouldValidate: true });
      if (value.model)
        form.setValue("model", value.model, { shouldValidate: true });
      if (value.year)
        form.setValue("year", value.year, { shouldValidate: true });
      if (value.axles)
        form.setValue("axles", value.axles, { shouldValidate: true });
      setMessage(
        value.warning ??
          "VIN details filled in. Check the trailer plate before saving.",
      );
    } catch {
      setMessage(
        "VIN lookup is unavailable. You can still enter the details yourself.",
      );
    } finally {
      setBusy(false);
    }
  }

  return { message, busy, lookup };
}
export function useDescriptionDraft(form: TrailerForm) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function draft() {
    if (!(await form.trigger())) return;
    const parsed = trailerFormSchema.safeParse(form.getValues());
    if (!parsed.success) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/vin/description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result = descriptionResultSchema.safeParse(await response.json());
      if (!response.ok || !result.success) {
        setMessage(
          "We could not write a description. Try again or write your own.",
        );
        return;
      }
      form.setValue("description", result.data.description, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setMessage("Draft ready. Review it before saving.");
    } catch {
      setMessage(
        "We could not write a description. Try again or write your own.",
      );
    } finally {
      setBusy(false);
    }
  }

  return { message, busy, draft };
}

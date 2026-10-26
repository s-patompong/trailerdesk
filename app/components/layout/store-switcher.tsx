import { useId, useState } from "react";
import { z } from "zod";

import { authClient } from "../../lib/auth-client";
import { useHydrated } from "../../lib/use-hydrated";
import { Alert, AlertDescription } from "../ui/alert";
import { Label } from "../ui/label";
import { NativeSelect, NativeSelectOption } from "../ui/native-select";

export function StoreSwitcher({
  stores,
  activeId,
}: {
  stores: { id: string; name: string }[];
  activeId: string | null;
}) {
  const hydrated = useHydrated();
  const fieldId = useId();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function switchStore(value: string) {
    const parsed = z
      .string()
      .min(1)
      .refine((id) => stores.some((store) => store.id === id))
      .safeParse(value);
    if (!parsed.success) {
      setError("Choose a dealership from the list.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const result = await authClient.organization.setActive({
        organizationId: parsed.data,
      });
      if (result.error) {
        setError("We could not switch dealerships. Try again.");
        return;
      }
      window.location.assign("/inventory");
    } catch {
      setError("We could not switch dealerships. Try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId} className="text-xs text-muted-foreground">
        YOUR DEALERSHIP
      </Label>
      <NativeSelect
        id={fieldId}
        className="w-full"
        value={activeId ?? ""}
        disabled={!hydrated || pending}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "store-error" : undefined}
        onChange={(event) => {
          void switchStore(event.target.value);
        }}
      >
        {stores.map((store) => (
          <NativeSelectOption key={store.id} value={store.id}>
            {store.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      {error && (
        <Alert variant="destructive" id="store-error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

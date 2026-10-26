import { useState } from "react";
import { useRevalidator } from "react-router";
import { z } from "zod";

import { jsonBody, requestJson } from "../../lib/request-json";
import { useHydrated } from "../../lib/use-hydrated";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { NativeSelect, NativeSelectOption } from "../ui/native-select";

const manualStatus = z.enum(["in_stock", "on_order"]);
export function StatusControl({
  id,
  status,
  version,
}: {
  id: string;
  status: string;
  version: number;
}) {
  const hydrated = useHydrated();
  const [selected, setSelected] = useState(status);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const refresh = useRevalidator();
  if (!manualStatus.safeParse(status).success) return null;
  async function save() {
    setPending(true);
    try {
      await requestJson(`/api/inventory/${id}`, z.object({ id: z.string() }), {
        ...jsonBody({ status: manualStatus.parse(selected), version }),
        method: "PATCH",
      });
      await refresh.revalidate();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The status could not be saved.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="mt-6 space-y-3 rounded-xl border bg-card p-5">
      <Label htmlFor="trailer-status">Availability</Label>
      <div className="flex flex-wrap gap-3">
        <NativeSelect
          id="trailer-status"
          disabled={!hydrated || pending}
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
          }}
        >
          <NativeSelectOption value="in_stock">In stock</NativeSelectOption>
          <NativeSelectOption value="on_order">On order</NativeSelectOption>
        </NativeSelect>
        <Button
          variant="outline"
          disabled={!hydrated || pending || selected === status}
          onClick={() => {
            void save();
          }}
        >
          {pending ? "Saving…" : "Save availability"}
        </Button>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </section>
  );
}

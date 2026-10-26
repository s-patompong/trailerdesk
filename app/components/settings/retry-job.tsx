import { useState } from "react";
import { useRevalidator } from "react-router";
import { z } from "zod";

import { requestJson } from "../../lib/request-json";
import { Button } from "../ui/button";

export function RetryJob({ id }: { id: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const refresh = useRevalidator();
  async function retry() {
    setPending(true);
    try {
      await requestJson(
        `/api/jobs/${id}/retry`,
        z.object({ retried: z.boolean() }),
        { method: "POST" },
      );
      await refresh.revalidate();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "This job could not be sent for another attempt.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => {
          void retry();
        }}
      >
        {pending ? "Sending…" : "Try again"}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

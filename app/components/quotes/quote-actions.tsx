import { useState } from "react";
import { useNavigate } from "react-router";
import { z } from "zod";

import { jsonBody, requestJson } from "../../lib/request-json";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";

export function QuoteActions({ id, pdfUrl }: { id: string; pdfUrl: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  async function act(sold: boolean) {
    setPending(true);
    setError("");
    try {
      if (sold) {
        const deal = await requestJson(
          "/api/deals",
          z.object({ id: z.uuid() }),
          jsonBody({ quoteId: id }),
        );
        await navigate(`/deals/${deal.id}`);
      } else {
        await requestJson(
          `/api/quotes/${id}/email`,
          z.object({ sent: z.boolean() }),
          { method: "POST" },
        );
        setMessage("The quote has been emailed to the customer.");
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "That could not be completed.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <a href={pdfUrl} target="_blank" rel="noreferrer">
            Open quote PDF
          </a>
        </Button>
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => {
            void act(false);
          }}
        >
          Email quote
        </Button>
        <Button
          disabled={pending}
          onClick={() => {
            void act(true);
          }}
        >
          {pending ? "Working…" : "Mark deal as sold"}
        </Button>
      </div>
      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

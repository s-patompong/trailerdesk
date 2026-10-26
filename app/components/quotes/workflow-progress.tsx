import { useEffect, useState } from "react";
import { useRevalidator } from "react-router";
import { z } from "zod";

import { requestJson } from "../../lib/request-json";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

function useWorkflowProgress(
  id: string,
  progress: string,
  needsAttention: boolean,
) {
  const { revalidate } = useRevalidator();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (progress === "Finished" || needsAttention) return;
    const interval = setInterval(() => {
      void revalidate();
    }, 3000);
    return () => {
      clearInterval(interval);
    };
  }, [progress, needsAttention, revalidate]);
  async function retry() {
    setPending(true);
    setError("");
    try {
      await requestJson(
        `/api/deals/${id}/retry`,
        z.object({ retried: z.boolean() }),
        { method: "POST" },
      );
      await revalidate();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The sale follow-up could not be restarted.",
      );
    } finally {
      setPending(false);
    }
  }
  return { pending, error, retry };
}
export function WorkflowProgress({
  id,
  progress,
  needsAttention,
}: {
  id: string;
  progress: string;
  needsAttention: boolean;
}) {
  const { pending, error, retry } = useWorkflowProgress(
    id,
    progress,
    needsAttention,
  );
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Sale follow-up</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Badge
          variant={
            needsAttention
              ? "destructive"
              : progress === "Finished"
                ? "default"
                : "secondary"
          }
        >
          {needsAttention ? "Needs attention" : progress}
        </Badge>
        <p className="text-sm text-muted-foreground">
          The dealership marks the trailer sold, prepares the bill of sale, and
          sends your customer a thank-you, a check-in and a review request.
        </p>
        {needsAttention && (
          <>
            <p className="text-sm text-muted-foreground">
              The sale is saved. Check the email setup or contact your
              administrator, then try the follow-up again.
            </p>
            <Button
              disabled={pending}
              onClick={() => {
                void retry();
              }}
            >
              {pending ? "Restarting…" : "Try sale follow-up again"}
            </Button>
          </>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

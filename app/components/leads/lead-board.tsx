import { useState } from "react";
import { Link, useRevalidator } from "react-router";
import { z } from "zod";

import { leadStage } from "../../../server/features/leads/leads.schemas";
import { jsonBody, requestJson } from "../../lib/request-json";
import { useHydrated } from "../../lib/use-hydrated";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface Lead {
  id: string;
  customerName: string;
  stage: string;
  assignedTo: string | null;
  stale: boolean;
  message: string;
}
export function LeadBoard({ leads }: { leads: Lead[] }) {
  const hydrated = useHydrated();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const refresh = useRevalidator();
  async function move(id: string, stage: z.infer<typeof leadStage>) {
    const lead = leads.find((row) => row.id === id);
    if (!lead?.assignedTo) {
      setError("Assign a salesperson on the lead before moving it.");
      return;
    }
    setPending(true);
    setError("");
    try {
      await requestJson(`/api/leads/${id}`, z.object({ saved: z.boolean() }), {
        ...jsonBody({ stage, assignedTo: lead.assignedTo }),
        method: "PATCH",
      });
      await refresh.revalidate();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "That lead could not be moved.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="mt-6 space-y-4" aria-busy={pending}>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <p className="text-xs text-muted-foreground">
        Drag a card to change its stage, or open a lead to use the keyboard and
        change its stage.
      </p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {leadStage.options.map((stage) => (
          <LeadColumn
            key={stage}
            stage={stage}
            leads={leads.filter((lead) => lead.stage === stage)}
            pending={!hydrated || pending}
            move={move}
          />
        ))}
      </div>
    </div>
  );
}

function LeadColumn({
  stage,
  leads,
  pending,
  move,
}: {
  stage: z.infer<typeof leadStage>;
  leads: Lead[];
  pending: boolean;
  move: (id: string, stage: z.infer<typeof leadStage>) => Promise<void>;
}) {
  return (
    <section
      aria-label={`${stage} leads`}
      className="min-h-36 rounded-xl border bg-muted/40 p-3"
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (!pending) void move(e.dataTransfer.getData("text/plain"), stage);
      }}
    >
      <h2 className="mb-3 flex items-center justify-between text-sm font-semibold capitalize">
        {stage}
        <Badge variant="secondary">{leads.length}</Badge>
      </h2>
      <div className="space-y-3">
        {leads
          .filter((lead) => lead.stage === stage)
          .map((lead) => (
            <Card
              key={lead.id}
              draggable={!pending}
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", lead.id);
              }}
              className="gap-2 py-4"
            >
              <CardHeader className="px-3">
                <CardTitle className="text-sm">
                  <Link
                    draggable={false}
                    to={`/leads/${lead.id}`}
                    className="hover:text-primary"
                  >
                    {lead.customerName}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-3">
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {lead.message}
                </p>
                {lead.stale && (
                  <Badge variant="outline">Needs a follow-up</Badge>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
    </section>
  );
}

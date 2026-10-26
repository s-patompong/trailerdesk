import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";

import {
  answerSchema,
  askInput,
} from "../../../server/features/search/search.schemas";
import { jsonBody, requestJson } from "../../lib/request-json";
import { TextField } from "../forms/text-field";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

import { AnswerMarkdown } from "./answer-markdown";

import type { z } from "zod";

export function AskPanel({ slug }: { slug?: string }) {
  const [answer, setAnswer] = useState<z.infer<typeof answerSchema> | null>(
    null,
  );
  const [error, setError] = useState("");
  const form = useForm<z.infer<typeof askInput>>({
    resolver: zodResolver(askInput),
    mode: "onBlur",
    defaultValues: { question: "" },
  });
  const submit = form.handleSubmit(async (input) => {
    setError("");
    try {
      setAnswer(
        await requestJson(
          slug
            ? `/api/ask/shopper/${encodeURIComponent(slug)}`
            : "/api/ask/staff",
          answerSchema,
          jsonBody(input),
        ),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Your question could not be answered. Please try again.",
      );
    }
  });
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>
          {slug ? "Ask about our trailers" : "Ask your dealership"}
        </CardTitle>
        <CardDescription>
          {slug
            ? "Find a trailer or ask about our published policies."
            : "Search your inventory, customers and dealership documents. Open the sources to check details."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form
          onSubmit={(e) => {
            void submit(e);
          }}
          noValidate
          className="space-y-3"
        >
          <TextField
            label="Your question"
            registration={form.register("question")}
            error={form.formState.errors.question?.message}
            placeholder="Any 7x14 enclosed trailers with a ramp under $9,000?"
          />
          <Button disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? "Looking through dealership records…"
              : "Ask"}
          </Button>
        </form>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {answer && <AnswerResult answer={answer} shopper={Boolean(slug)} />}
      </CardContent>
    </Card>
  );
}

function AnswerResult({
  answer,
  shopper,
}: {
  answer: z.infer<typeof answerSchema>;
  shopper: boolean;
}) {
  return (
    <div aria-live="polite" className="space-y-4">
      <AnswerMarkdown
        text={answer.answer}
        sourceUrls={answer.citations.map((citation) => citation.url)}
      />
      {answer.citations.length > 0 && (
        <ul className="space-y-2">
          {answer.citations.map((citation) => (
            <li key={citation.url}>
              <Link
                className="text-sm font-medium text-primary underline underline-offset-4"
                to={citation.url}
              >
                {citation.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {shopper && (
        <p className="text-sm text-muted-foreground">
          Ready for a quote? Open a trailer above and send an inquiry to our
          team.
        </p>
      )}
    </div>
  );
}

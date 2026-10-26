import { env } from "cloudflare:workers";
import { Link, redirect } from "react-router";

import { configuration } from "../../server/platform/config";
import { getDevMail } from "../../server/platform/dev-mail";
import { DomainError, throwHttpError } from "../../server/platform/errors";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

export async function loader() {
  try {
    const config = configuration(env);
    if (config.app.environment !== "development")
      throw new DomainError("not_found", "That page could not be found.");
    if (config.mail.driver === "mailpit" && config.mail.mailpit.url)
      return redirect(config.mail.mailpit.url, {
        headers: { "Cache-Control": "private, no-store" },
      });
    return {
      driver: config.mail.driver,
      messages: config.mail.driver === "outbox" ? await getDevMail(env) : [],
    };
  } catch (error) {
    return throwHttpError(error);
  }
}
export function headers() {
  return { "Cache-Control": "private, no-store" };
}
export default function DevMail({
  loaderData,
}: {
  loaderData: {
    driver: "mailpit" | "mailtrap" | "resend" | "outbox";
    messages: Awaited<ReturnType<typeof getDevMail>>;
  };
}) {
  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <Button asChild variant="link" className="px-0">
        <Link to="/inventory">← Back to the dealership</Link>
      </Button>
      <header className="my-7">
        <Badge variant="secondary">Local development only</Badge>
        <h1 className="mt-3 text-3xl font-semibold">Mail preview</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {loaderData.driver === "outbox"
            ? "These messages were saved here instead of being sent. Refresh to see new mail."
            : loaderData.driver === "mailtrap"
              ? "Email is captured in your selected Mailtrap Sandbox inbox."
              : "Resend sends real email to the named recipient. Check its delivery dashboard."}
        </p>
      </header>
      {loaderData.driver !== "outbox" ? (
        <Button asChild>
          <a
            href={
              loaderData.driver === "mailtrap"
                ? "https://mailtrap.io/"
                : "https://resend.com/emails"
            }
          >
            Open {loaderData.driver === "mailtrap" ? "Mailtrap" : "Resend"}
          </a>
        </Button>
      ) : (
        <div className="space-y-4">
          {loaderData.messages.length ? (
            loaderData.messages.map((mail) => (
              <MailMessage key={mail.id} mail={mail} />
            ))
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No mail yet</CardTitle>
                <CardDescription>
                  Submit an inquiry, invite a teammate or request a password
                  reset.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      )}
    </main>
  );
}

function MailMessage({
  mail,
}: {
  mail: Awaited<ReturnType<typeof getDevMail>>[number];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{mail.subject}</CardTitle>
        <CardDescription>
          To: {mail.recipient} ·{" "}
          {new Intl.DateTimeFormat("en-US", {
            dateStyle: "short",
            timeStyle: "short",
            timeZone: "America/Chicago",
          }).format(new Date(mail.createdAt))}{" "}
          Central Time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-wrap">
          {mail.body.split(/(https?:\/\/[^\s]+)/).map((part, index) =>
            part.startsWith("http") ? (
              <a
                key={index}
                href={part}
                className="break-all text-primary underline"
              >
                {part}
              </a>
            ) : (
              part
            ),
          )}
        </p>
      </CardContent>
    </Card>
  );
}

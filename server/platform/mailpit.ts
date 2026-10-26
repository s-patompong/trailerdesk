import { z } from "zod";

import type { EmailMessage } from "./email-message";

export async function sendMailpit(
  baseUrl: string,
  from: string,
  message: EmailMessage,
): Promise<string> {
  const response = await fetch(new URL("/api/v1/send", baseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      From: { Email: from, Name: "TrailerDesk" },
      To: [{ Email: message.recipient }],
      Subject: message.subject,
      Text: message.body,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok)
    throw new Error(
      "Mailpit could not capture this email. Check that the local inbox is running.",
    );
  return z.object({ ID: z.string().min(1) }).parse(await response.json()).ID;
}

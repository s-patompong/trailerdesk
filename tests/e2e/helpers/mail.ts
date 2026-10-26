import { z } from "zod";

import { withLocalDatabase } from "./database";

const capturedMail = z.object({
  ID: z.string(),
  Subject: z.string(),
  Text: z.string(),
  To: z.array(z.object({ Address: z.string() })),
});
export async function deliveredMail(prefix: string) {
  const rows = await withLocalDatabase(
    async (client) =>
      (
        await client.query<{ provider_id: string }>(
          "SELECT provider_id FROM email_deliveries WHERE idempotency_key LIKE $1 AND sent_at IS NOT NULL",
          [`${prefix}%`],
        )
      ).rows,
  );
  return Promise.all(
    rows.map(async (row) => {
      const response = await fetch(
        `http://127.0.0.1:18025/api/v1/message/${encodeURIComponent(row.provider_id)}`,
      );
      if (!response.ok)
        throw new Error("Mailpit did not contain the recorded email.");
      return capturedMail.parse(await response.json());
    }),
  );
}

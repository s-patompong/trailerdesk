import { readFile } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";

import { z } from "zod";

import { withSeedWorker } from "./seed-worker";

const origin = "http://app.localhost:5174";
const cookieJar = new Map<string, string>();
const documentList = z.array(
  z.object({ id: z.string(), title: z.string(), status: z.string() }),
);
async function send(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Origin", origin);
  headers.set("Cookie", Array.from(cookieJar.values()).join("; "));
  const response = await fetch(`${origin}${path}`, { ...init, headers });
  for (const cookie of response.headers.getSetCookie()) {
    const value = cookie.split(";")[0];
    if (value) cookieJar.set(value.split("=")[0] ?? value, value);
  }
  if (!response.ok)
    throw new Error(
      `Search seed request failed (${String(response.status)}): ${path}. Check the local app logs.`,
    );
  return response;
}
async function selectStore(id: string) {
  await send("/api/auth/organization/set-active", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ organizationId: id }),
  });
}
export async function seedSearch(
  waitForInventory: () => Promise<void>,
): Promise<void> {
  await withSeedWorker(async () => {
    await send("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "owner@trailerdesk.test",
        password: "TrailerDesk-Local-2026!",
      }),
    });
    await selectStore("ridgeline");
    const existing = documentList.parse(
      await (await send("/api/documents")).json(),
    );
    for (const name of ["warranty", "financing", "delivery"]) {
      const title = `${name[0]?.toUpperCase() ?? ""}${name.slice(1)} policy (sample)`;
      if (existing.some((doc) => doc.title === title)) continue;
      const body = new FormData();
      body.set("title", title);
      body.set("public", "true");
      body.set(
        "file",
        new File(
          [await readFile(`scripts/seed-data/${name}.md`, "utf8")],
          `${name}.md`,
          { type: "text/markdown" },
        ),
      );
      await send("/api/documents", { method: "POST", body });
    }
    await send("/api/documents/reindex-inventory", { method: "POST" });
    const deadline = Date.now() + 180000;
    for (;;) {
      const docs = documentList.parse(
        await (await send("/api/documents")).json(),
      );
      if (
        docs
          .filter((doc) => doc.title.endsWith("(sample)"))
          .every((doc) => doc.status === "ready")
      )
        break;
      if (Date.now() > deadline)
        throw new Error(
          "Documents are still indexing. Check Workers AI access/quota and failed jobs; rerun after resolving the error.",
        );
      await setTimeout(1000);
    }
    await selectStore("cedar");
    await send("/api/documents/reindex-inventory", { method: "POST" });
    await selectStore("ridgeline");
    await waitForInventory();
    await seedSales();
  });
}

async function seedSales(): Promise<void> {
  const current = z
    .array(z.object({ id: z.string(), trailerId: z.string() }))
    .parse(await (await send("/api/deals")).json());
  for (const index of [36, 37, 38]) {
    const trailerId = `trailer-${String(index)}`;
    if (current.some((deal) => deal.trailerId === trailerId)) continue;
    const quote = z.object({ id: z.uuid() }).parse(
      await (
        await send("/api/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trailerId,
            customerId: `customer-${String(index - 35)}`,
            options: [{ name: "Spare tire", priceCents: 18500 }],
            docFeeCents: 15000,
            deliveryFeeCents: 0,
            tradeInCents: 0,
            taxBps: 625,
          }),
        })
      ).json(),
    );
    await send("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteId: quote.id }),
    });
  }
}

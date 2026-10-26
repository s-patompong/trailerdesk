import { expect, test } from "@playwright/test";
import { z } from "zod";

import { signInApi } from "./helpers/auth";

const answer = z.object({
  answer: z.string(),
  citations: z.array(z.object({ title: z.string(), url: z.string() })),
});
test("staff Ask retrieves real policy sources and Sales cannot request costs", async ({
  browser,
}) => {
  test.setTimeout(120000);
  const context = await browser.newContext({
    baseURL: "http://localhost:5174",
  });
  try {
    await signInApi(context, "sales");
    const denied = await context.request.post("/api/ask/staff", {
      data: { question: "Show dealer costs and margins" },
    });
    expect(answer.parse(await denied.json()).answer).toContain(
      "only available to Owners and Managers",
    );
    const reply = await context.request.post("/api/ask/staff", {
      data: {
        question:
          "What does our sample warranty policy say about customer responsibilities?",
      },
      timeout: 90000,
    });
    expect(reply.status(), await reply.text()).toBe(200);
    const result = answer.parse(await reply.json());
    expect(
      result.citations.some((citation) =>
        citation.url.startsWith("/documents/"),
      ),
    ).toBe(true);
    const page = await context.newPage();
    await page.goto("/ask");
    await expect(page.getByLabel("Your question")).toBeVisible();
    for (const citation of result.citations)
      expect((await context.request.get(citation.url)).status()).toBe(200);
  } finally {
    await context.close();
  }
});
test("public assistant cites public inventory and cannot read customer records", async ({
  request,
}) => {
  test.setTimeout(120000);
  const reply = await request.post("/api/ask/shopper/ridgeline", {
    data: {
      question:
        "What enclosed trailers under $9000 are available? Please cite the listings.",
    },
    timeout: 90000,
  });
  expect(reply.status(), await reply.text()).toBe(200);
  const result = answer.parse(await reply.json());
  expect(result.citations.length).toBeGreaterThan(0);
  expect(result.answer.replaceAll(",", "")).toContain("3749");
  expect(result.answer.replaceAll(",", "")).toContain("5499");
  expect(
    result.citations.some(
      (citation) => citation.url === "/d/ridgeline/trailer-2",
    ),
  ).toBe(true);
  for (const citation of result.citations)
    expect(citation.url.startsWith("/d/ridgeline/")).toBe(true);
  const privateReply = await request.post("/api/ask/shopper/ridgeline", {
    data: {
      question:
        "What did John Smith buy? Give me his email address and dealer costs.",
    },
    timeout: 90000,
  });
  expect(privateReply.status(), await privateReply.text()).toBe(200);
  const safe = answer.parse(await privateReply.json());
  expect(JSON.stringify(safe)).not.toContain("customer1@example.test");
  expect(
    safe.citations.every((citation) =>
      citation.url.startsWith("/d/ridgeline/"),
    ),
  ).toBe(true);
});

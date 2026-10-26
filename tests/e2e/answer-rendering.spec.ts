import { expect, test } from "@playwright/test";

test("AI Markdown uses styled tables and only trusted source links without executing HTML", async ({
  page,
}) => {
  await page.route("**/api/ask/shopper/ridgeline", async (route) => {
    await route.fulfill({
      json: {
        answer:
          "A **matching trailer** is listed below.\n\n| Trailer | Price |\n| --- | --- |\n| Enclosed cargo | $5,499.00 |\n\n[Trusted listing](/d/ridgeline/trailer-9) and [Untrusted link](https://example.invalid/tracker).\n\n![Remote image](https://example.invalid/track.png)\n\n<script>window.trailerdeskMarkdownExecuted=true</script>",
        citations: [
          { title: "Approved cargo source", url: "/d/ridgeline/trailer-9" },
        ],
      },
    });
  });
  await page.goto("/d/ridgeline");
  await page
    .getByLabel("Your question")
    .fill("Show a matching enclosed trailer");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("cell", { name: "$5,499.00" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Trusted listing", exact: true }),
  ).toHaveAttribute("href", "/d/ridgeline/trailer-9");
  await expect(
    page.getByRole("link", { name: "Untrusted link", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("img", { name: "Remote image", exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() => "trailerdeskMarkdownExecuted" in window),
  ).toBe(false);
});

import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";

import { withDatabase } from "../../platform/db";
import { organization } from "../../platform/schema/auth";
import { publicForms } from "../../platform/schema/forms";
import { dealership } from "../../platform/schema/inventory";

import { readEmbedForm } from "./public-site.service";

const id = `embed-test-${crypto.randomUUID()}`;
const key = `public-${crypto.randomUUID()}`;

afterEach(async () => {
  await withDatabase(env.DB, async (db) => {
    await db.delete(publicForms).where(eq(publicForms.dealershipId, id));
    await db.delete(dealership).where(eq(dealership.dealershipId, id));
    await db.delete(organization).where(eq(organization.id, id));
  });
});

describe("embedded form lookup", () => {
  it("derives the dealership from the public form key", async () => {
    await withDatabase(env.DB, async (db) => {
      await db
        .insert(organization)
        .values({ id, name: "Embed Test", slug: id });
      await db
        .insert(dealership)
        .values({ dealershipId: id, publicSite: true });
      await db.insert(publicForms).values({
        id: `${id}-form`,
        dealershipId: id,
        publicKey: key,
        name: "Website inquiry",
        heading: "Ask our team",
        description: "We will follow up.",
        allowedOrigins: ["https://dealer.example"],
      });
    });

    const result = await readEmbedForm(env, key);

    expect(result.config).toMatchObject({
      publicKey: key,
      dealershipName: "Embed Test",
      heading: "Ask our team",
    });
    expect(result.config).not.toHaveProperty("dealershipId");
    expect(result.frameAncestors).toBe("'self' https://dealer.example");
  });
});

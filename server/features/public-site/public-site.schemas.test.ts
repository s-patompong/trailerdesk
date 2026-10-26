import { describe, expect, it } from "vitest";

import {
  embedInquiryInput,
  inquiryJob,
  publicFormRecord,
} from "./public-site.schemas";

describe("embedded inquiry boundaries", () => {
  it("accepts a general inquiry without trusting a dealership identifier", () => {
    const parsed = embedInquiryInput.parse({
      requestId: crypto.randomUUID(),
      name: "Jamie Carter",
      email: "JAMIE@example.com",
      intent: "general",
      turnstileToken: "verified-token",
    });
    expect(parsed.email).toBe("jamie@example.com");
    expect(parsed).not.toHaveProperty("dealershipId");
  });

  it("allows the queued form inquiry to omit trailer context", () => {
    expect(
      inquiryJob.parse({
        kind: "inquiry",
        requestId: crypto.randomUUID(),
        dealershipId: "dealer-a",
        trailerId: null,
        name: "Jamie Carter",
        email: "jamie@example.com",
        intent: "general",
        submittedAt: new Date().toISOString(),
      }).trailerId,
    ).toBeNull();
  });

  it("only accepts exact HTTP origins for iframe policy", () => {
    const record = {
      id: "form-a",
      dealershipId: "dealer-a",
      publicKey: "dealer-a-contact",
      name: "Website inquiry",
      heading: "How can we help?",
      description: "Ask our team.",
      submitLabel: "Send inquiry",
      successMessage: "Thanks!",
      enabled: true,
      dealershipName: "Dealer A",
      phone: "",
    };
    expect(
      publicFormRecord.parse({
        ...record,
        allowedOrigins: ["https://dealer.example"],
      }).allowedOrigins,
    ).toEqual(["https://dealer.example"]);
    expect(() =>
      publicFormRecord.parse({
        ...record,
        allowedOrigins: ["https://dealer.example/forms"],
      }),
    ).toThrow("HTTP origin");
  });
});

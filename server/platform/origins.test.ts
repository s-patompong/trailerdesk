import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { canonicalOriginResponse, requestSurface } from "./origins";

describe("fixed application origins", () => {
  it("maps public pages, embeds and APIs to the public surface", () => {
    expect(requestSurface("/d/ridgeline")).toBe("public");
    expect(requestSurface("/embed/forms/ridgeline-contact-form")).toBe(
      "public",
    );
    expect(requestSurface("/api/public/ridgeline")).toBe("public");
    expect(requestSurface("/login")).toBe("staff");
    expect(requestSurface("/api/auth/sign-in/email")).toBe("staff");
    expect(requestSurface("/api/admin-auth/sign-in/email")).toBe("admin");
    expect(requestSurface("/admin")).toBe("admin");
    expect(requestSurface("/administrator")).toBe("staff");
    expect(requestSurface("/assets/app.js")).toBe("shared");
  });

  it("serves shared login and password recovery pages on either private realm", () => {
    for (const path of ["/login", "/reset-password?token=test-token"])
      expect(
        canonicalOriginResponse(
          new Request(`http://admin.localhost:5174${path}`),
          env,
        ),
      ).toBeNull();
  });

  it("redirects safe requests to the configured local subdomain", () => {
    const response = canonicalOriginResponse(
      new Request("http://app.localhost:5174/d/ridgeline?type=dump"),
      env,
    );
    expect(response?.status).toBe(308);
    expect(response?.headers.get("Location")).toBe(
      "http://localhost:5174/d/ridgeline?type=dump",
    );
  });

  it("does not expose staff authentication mutations on the public host", async () => {
    const response = canonicalOriginResponse(
      new Request("http://localhost:5174/api/auth/sign-in/email", {
        method: "POST",
      }),
      env,
    );
    expect(response?.status).toBe(421);
    expect(response?.headers.has("Set-Cookie")).toBe(false);
    await expect(response?.json()).resolves.toEqual({
      error: "Please resend this request from the correct TrailerDesk site.",
    });
  });

  it("accepts requests already on their configured origin", () => {
    expect(
      canonicalOriginResponse(
        new Request("http://app.localhost:5174/inventory"),
        env,
      ),
    ).toBeNull();
    expect(
      canonicalOriginResponse(
        new Request("http://localhost:5174/d/ridgeline"),
        env,
      ),
    ).toBeNull();
    expect(
      canonicalOriginResponse(
        new Request("http://localhost:5174/assets/app.js"),
        env,
      ),
    ).toBeNull();
  });
});

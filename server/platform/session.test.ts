import { env } from "cloudflare:workers";
import { expect, it } from "vitest";

import { signIn } from "./session";

it("applies Better Auth's built-in limit to credentials submitted through the page action", async () => {
  const prefix = crypto.randomUUID().replaceAll("-", "").slice(0, 8);
  const testIp = `2001:db8:${prefix.slice(0, 4)}:${prefix.slice(4)}::1`;
  const request = new Request("http://app.localhost:5174/login", {
    method: "POST",
    headers: {
      Origin: "http://app.localhost:5174",
      "cf-connecting-ip": testIp,
    },
  });
  const statuses: number[] = [];
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await signIn(request, env, {
      email: "rate-limit-regression@example.test",
      password: crypto.randomUUID(),
    });
    statuses.push(response.status);
  }
  expect(statuses.slice(0, 3)).toEqual([401, 401, 401]);
  expect(statuses[3]).toBe(429);
});

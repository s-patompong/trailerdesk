import { spawn } from "node:child_process";
import { setTimeout } from "node:timers/promises";

import { z } from "zod";

const origin = "http://localhost:5174";
async function running(): Promise<boolean> {
  try {
    const response = await fetch(`${origin}/api/health`, {
      signal: AbortSignal.timeout(1000),
    });
    return z
      .object({ app: z.literal("TrailerDesk") })
      .safeParse(await response.json()).success;
  } catch {
    return false;
  }
}
export async function withSeedWorker(run: () => Promise<void>): Promise<void> {
  if (await running()) return run();
  const child = spawn("pnpm", ["dev"], {
    stdio: "ignore",
    detached: process.platform !== "win32",
  });
  try {
    const deadline = Date.now() + 45000;
    while (!(await running())) {
      if (Date.now() > deadline || child.exitCode !== null)
        throw new Error(
          "Start pnpm dev and finish Cloudflare login, then rerun pnpm db:seed. Search seeding requires real Workers AI.",
        );
      await setTimeout(500);
    }
    await run();
  } finally {
    if (child.pid) {
      if (process.platform === "win32") child.kill("SIGTERM");
      else process.kill(-child.pid, "SIGTERM");
    }
  }
}

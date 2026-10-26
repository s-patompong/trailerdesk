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
async function waitUntilRunning(
  child: ReturnType<typeof spawn>,
): Promise<void> {
  const deadline = Date.now() + 45000;
  while (!(await running())) {
    if (Date.now() > deadline || child.exitCode !== null)
      throw new Error(
        "Start pnpm dev and finish Cloudflare login, then rerun pnpm db:seed. Search seeding requires real Workers AI.",
      );
    await setTimeout(500);
  }
}
function alreadyStopped(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ESRCH";
}
function stop(child: ReturnType<typeof spawn>): void {
  if (!child.pid) return;
  if (process.platform === "win32") {
    child.kill("SIGTERM");
    return;
  }
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch (error) {
    if (!alreadyStopped(error)) throw error;
  }
}
export async function withSeedWorker(run: () => Promise<void>): Promise<void> {
  if (await running()) return run();
  const child = spawn("pnpm", ["dev"], {
    stdio: "inherit",
    detached: process.platform !== "win32",
  });
  try {
    await waitUntilRunning(child);
    await run();
  } finally {
    stop(child);
  }
}

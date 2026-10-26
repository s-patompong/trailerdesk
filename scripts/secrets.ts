import { spawnSync } from "node:child_process";
import { copyFile, lstat, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { z } from "zod";

import { logInfo } from "../server/platform/logging";

const mode = z
  .enum(["files", "staged", "history"])
  .parse(process.argv[2] ?? "files");
const image =
  "ghcr.io/betterleaks/betterleaks:v1.9.0@sha256:e3b95b0db6c2735db17165c009b0ad6d9cef34fb4578659232b98f69d7346cac";
function gitFiles(): string[] {
  const result = spawnSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { encoding: "utf8" },
  );
  if (result.status !== 0)
    throw new Error("Run secret checks from the TrailerDesk Git checkout.");
  return result.stdout.split("\0").filter(Boolean);
}
async function copySource(destination: string): Promise<void> {
  for (const name of gitFiles()) {
    if (!(await lstat(name)).isFile()) continue;
    const target = join(destination, name);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(name, target);
  }
}
const temporary =
  mode === "files"
    ? await mkdtemp(join(tmpdir(), "trailerdesk-secrets-"))
    : null;
try {
  if (temporary) await copySource(temporary);
  const source = temporary ?? process.cwd();
  const args =
    mode === "files"
      ? ["dir", "/repo"]
      : [
          "git",
          "/repo",
          ...(mode === "staged"
            ? ["--pre-commit", "--staged"]
            : ["--log-opts=--all"]),
        ];
  const result = spawnSync(
    "docker",
    [
      "run",
      "--rm",
      "--network=none",
      "--read-only",
      "--mount",
      `type=bind,src=${source},dst=/repo,readonly`,
      "--workdir",
      "/repo",
      "--env",
      "GIT_CONFIG_COUNT=1",
      "--env",
      "GIT_CONFIG_KEY_0=safe.directory",
      "--env",
      "GIT_CONFIG_VALUE_0=/repo",
      image,
      ...args,
      "--redact",
      "--validation=false",
      "--no-banner",
      "--report-format",
      "json",
      "--report-path",
      "-",
    ],
    { stdio: ["ignore", "pipe", "inherit"], encoding: "utf8" },
  );
  if (result.error)
    throw new Error("Start Docker before running the secret scanner.", {
      cause: result.error,
    });
  if (result.stdout.trim()) {
    const findings = z
      .array(
        z.object({
          File: z.string(),
          StartLine: z.number(),
          RuleID: z.string(),
        }),
      )
      .parse(JSON.parse(result.stdout));
    for (const finding of findings)
      logInfo(
        `${finding.File}:${String(finding.StartLine)} (${finding.RuleID})`,
      );
  }
  process.exitCode = result.status ?? 1;
} finally {
  if (temporary) await rm(temporary, { recursive: true, force: true });
}

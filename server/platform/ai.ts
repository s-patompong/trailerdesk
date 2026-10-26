import { createAnthropic } from "@ai-sdk/anthropic";
import { createAI } from "agents/models/ai-sdk";
import { embedMany } from "ai";
import { z } from "zod";

import { configuration } from "./config";

export function languageModel(env: Env) {
  const config = configuration(env).ai;
  if (config.provider === "anthropic") {
    if (!config.anthropicApiKey)
      throw new Error("The assistant is not configured.");
    return createAnthropic({ apiKey: config.anthropicApiKey })(
      config.anthropicModel,
    );
  }
  const options = config.workersAiModel.startsWith("@cf/openai/gpt-oss-")
    ? { reasoningEffort: "low" as const }
    : config.workersAiModel.startsWith("@cf/zai-org/glm-")
      ? { chatTemplateKwargs: { enable_thinking: false } }
      : {};
  return createAI({ binding: env.AI })(config.workersAiModel, options);
}
export async function embedTexts(
  env: Env,
  values: string[],
): Promise<number[][]> {
  const parsed = z
    .array(z.string().min(1).max(12000))
    .min(1)
    .max(100)
    .parse(values);
  const config = configuration(env).ai;
  const result = await embedMany({
    model: createAI({ binding: env.AI }).embeddingModel(config.embeddingModel),
    values: parsed,
  });
  return z
    .array(z.array(z.number()).length(config.embeddingDimensions))
    .length(parsed.length)
    .parse(result.embeddings);
}

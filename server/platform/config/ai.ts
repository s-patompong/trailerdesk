import { modelDefaults } from "./defaults";

import type { RuntimeEnv } from "../env";

export function aiConfiguration(env: RuntimeEnv) {
  return {
    provider: env.LLM_PROVIDER,
    workersAiModel: env.WORKERS_AI_MODEL,
    anthropicModel: env.ANTHROPIC_MODEL,
    anthropicApiKey: env.ANTHROPIC_API_KEY,
    embeddingModel: modelDefaults.embedding,
    embeddingDimensions: modelDefaults.embeddingDimensions,
  };
}

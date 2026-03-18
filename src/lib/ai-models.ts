import { AIModel } from "@/types";

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "openai",
    contextWindow: 128000,
    supportsStreaming: true,
    capabilities: ["completion", "chat", "code", "vision"],
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    contextWindow: 128000,
    supportsStreaming: true,
    capabilities: ["completion", "chat", "code", "vision"],
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "openai",
    contextWindow: 16384,
    supportsStreaming: true,
    capabilities: ["completion", "chat", "code"],
  },
  {
    id: "claude-3-opus-20240229",
    name: "Claude 3 Opus",
    provider: "anthropic",
    contextWindow: 200000,
    supportsStreaming: true,
    capabilities: ["completion", "chat", "code", "vision"],
  },
  {
    id: "claude-3-sonnet-20240229",
    name: "Claude 3 Sonnet",
    provider: "anthropic",
    contextWindow: 200000,
    supportsStreaming: true,
    capabilities: ["completion", "chat", "code", "vision"],
  },
  {
    id: "claude-3-haiku-20240307",
    name: "Claude 3 Haiku",
    provider: "anthropic",
    contextWindow: 200000,
    supportsStreaming: true,
    capabilities: ["completion", "chat", "code"],
  },
];

export function getModelById(id: string): AIModel | undefined {
  return AVAILABLE_MODELS.find((m) => m.id === id);
}

export function getModelsByProvider(provider: string): AIModel[] {
  return AVAILABLE_MODELS.filter((m) => m.provider === provider);
}

export const DEFAULT_MODEL_ID = "gpt-4-turbo";

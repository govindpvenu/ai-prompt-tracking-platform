import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, type LanguageModelUsage } from "ai";

import type { UsageMetadata } from "@/types/promptRuns";

type OpenRouterMessage = {
  role: "user" | "assistant";
  content: string;
};

type JsonSchemaResponseFormat = {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: Record<string, unknown>;
  };
};

type OpenRouterChatRequest = {
  apiKey?: string;
  model: string;
  system?: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: JsonSchemaResponseFormat;
};

type OpenRouterChatResponse = {
  id?: string;
  model?: string;
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

export type OpenRouterCompletion = {
  content: string;
  usage?: UsageMetadata;
  raw: unknown;
};

export function assertOpenRouterModel(modelId: string) {
  if (!modelId || /\s/.test(modelId) || !modelId.includes("/")) {
    throw new Error(`Invalid OpenRouter model id: ${modelId || "empty"}.`);
  }
}

export async function sendOpenRouterChat({
  apiKey: requestApiKey,
  model,
  system,
  messages,
  temperature = 0.2,
  maxTokens = 900,
  responseFormat,
}: OpenRouterChatRequest): Promise<OpenRouterCompletion> {
  const apiKey =
    requestApiKey ||
    process.env.OPENROUTER_API_KEY ||
    process.env.OPEN_ROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OpenRouter API key is not configured.");
  }

  assertOpenRouterModel(model);

  if (!responseFormat) {
    const openrouter = createOpenRouter({
      apiKey,
      appName: process.env.OPENROUTER_SITE_NAME ?? "Prompt Tracker",
      appUrl:
        process.env.OPENROUTER_SITE_URL ??
        process.env.NEXT_PUBLIC_BASE_URL ??
        "http://localhost:3000",
    });
    const result = await generateText({
      maxOutputTokens: maxTokens,
      messages,
      model: openrouter.chat(model),
      system,
      temperature,
    });

    if (!result.text.trim()) {
      throw new Error("OpenRouter returned an empty response.");
    }

    return {
      content: result.text,
      raw: result.response,
      usage: mapLanguageModelUsage(result.usage),
    };
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer":
        process.env.OPENROUTER_SITE_URL ??
        process.env.NEXT_PUBLIC_BASE_URL ??
        "http://localhost:3000",
      "X-OpenRouter-Title":
        process.env.OPENROUTER_SITE_NAME ?? "Prompt Tracker",
    },
    body: JSON.stringify({
      model,
      messages: system
        ? [{ role: "system", content: system }, ...messages]
        : messages,
      temperature,
      max_tokens: maxTokens,
      ...(responseFormat ? { response_format: responseFormat } : {}),
    }),
  });

  const payload = await readOpenRouterPayload(response);

  if (!response.ok) {
    throw new Error(
      `OpenRouter ${response.status}: ${getOpenRouterErrorMessage(payload)}`,
    );
  }

  const completion = payload as OpenRouterChatResponse;
  const content = extractMessageContent(
    completion.choices?.[0]?.message?.content,
  );

  if (!content.trim()) {
    throw new Error("OpenRouter returned an empty response.");
  }

  return {
    content,
    usage: completion.usage
      ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
          raw: completion.usage,
        }
      : undefined,
    raw: completion,
  };
}

function mapLanguageModelUsage(usage: LanguageModelUsage): UsageMetadata {
  return {
    completionTokens: usage.outputTokens,
    promptTokens: usage.inputTokens,
    raw: usage.raw ?? usage,
    totalTokens: usage.totalTokens,
  };
}

async function readOpenRouterPayload(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function getOpenRouterErrorMessage(payload: unknown) {
  if (typeof payload === "string") {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const error = "error" in payload ? payload.error : undefined;

    if (typeof error === "string") {
      return error;
    }

    if (error && typeof error === "object" && "message" in error) {
      return String(error.message);
    }

    if ("message" in payload) {
      return String(payload.message);
    }
  }

  return "request failed";
}

function extractMessageContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if (part && typeof part === "object" && "text" in part) {
          return String(part.text ?? "");
        }

        return "";
      })
      .join("");
  }

  return "";
}

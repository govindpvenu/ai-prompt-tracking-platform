import type { UsageMetadata } from "@/types/promptRuns";

type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
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
  model: string;
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
  raw: OpenRouterChatResponse;
};

export function assertFreeModel(modelId: string) {
  if (!modelId.endsWith(":free")) {
    throw new Error(
      `Paid model blocked: ${modelId}. Only OpenRouter :free models are allowed.`,
    );
  }
}

export async function sendOpenRouterChat({
  model,
  messages,
  temperature = 0.2,
  maxTokens = 900,
  responseFormat,
}: OpenRouterChatRequest): Promise<OpenRouterCompletion> {
  const apiKey = process.env.OPENROUTER_API_KEY ?? process.env.OPEN_ROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OpenRouter API key is not configured.");
  }

  assertFreeModel(model);

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
      messages,
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

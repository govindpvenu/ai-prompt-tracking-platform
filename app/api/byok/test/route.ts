import { z } from "zod";

import { getApiSession } from "@/lib/api-session";
import { getOpenRouterRuntimeSettings } from "@/lib/byok/openrouter-settings";

export const runtime = "nodejs";

const testSettingsSchema = z.object({
  apiKey: z.string().trim().min(1).max(400).optional(),
});

type OpenRouterKeyResponse = {
  data?: {
    limit_remaining?: number | null;
    usage?: number | null;
    is_free_tier?: boolean;
  };
};

export async function POST(request: Request) {
  const session = await getApiSession();

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;

  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = testSettingsSchema.safeParse(json);

  if (!parsed.success) {
    return Response.json(
      {
        error: "Invalid OpenRouter test request",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const settings = await getOpenRouterRuntimeSettings(session.user.id);
  const apiKey = parsed.data.apiKey || settings.apiKey;

  if (!apiKey) {
    return Response.json(
      { error: "No OpenRouter API key configured." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/key", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    const payload = (await readOpenRouterPayload(response)) as
      | OpenRouterKeyResponse
      | string
      | null;

    if (!response.ok) {
      throw new Error(getOpenRouterErrorMessage(payload));
    }

    const key = typeof payload === "object" && payload ? payload.data : null;

    return Response.json({
      ok: true,
      limitRemaining: key?.limit_remaining,
      usage: key?.usage,
      isFreeTier: key?.is_free_tier,
    });
  } catch (error) {
    return Response.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "OpenRouter connection test failed.";
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

  return "OpenRouter key validation failed.";
}

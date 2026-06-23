import { z } from "zod";
import { after } from "next/server";

import { getApiSession } from "@/lib/api-session";
import {
  createQueuedPromptRun,
  processQueuedPromptRunById,
} from "@/lib/prompt-runs/executor";
import {
  listPromptRuns,
  type PromptRunFilters,
} from "@/lib/prompt-runs/repository";
import type { ModelProvider } from "@/types/promptRuns";

export const runtime = "nodejs";

const createPromptRunSchema = z.object({
  prompt: z.string().trim().min(1).max(8000),
  brand: z.string().trim().min(1).max(160),
  brandDomain: z.string().trim().max(240).optional().nullable(),
});

export async function GET(request: Request) {
  const session = await getApiSession();

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const filters: PromptRunFilters = {
    brand: getSearchValue(url, "brand"),
    model: getModelFilter(url.searchParams.get("model")),
    mention: getMentionFilter(url.searchParams.get("mention")),
    dateFrom: parseDateFilter(url.searchParams.get("from")),
    dateTo: parseDateFilter(url.searchParams.get("to"), true),
    limit: getLimit(url.searchParams.get("limit")),
  };

  const runs = await listPromptRuns(session.user.id, filters);

  return Response.json({ runs });
}

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

  const parsed = createPromptRunSchema.safeParse(json);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid prompt run request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const run = await createQueuedPromptRun({
    userId: session.user.id,
    prompt: parsed.data.prompt,
    brand: parsed.data.brand,
    brandDomain: parsed.data.brandDomain,
  });

  after(async () => {
    await processQueuedPromptRunById(run.id);
  });

  return Response.json(
    {
      run,
    },
    { status: 202 },
  );
}

function getSearchValue(url: URL, key: string) {
  const value = url.searchParams.get(key)?.trim();
  return value || undefined;
}

function getModelFilter(value: string | null): ModelProvider | undefined {
  return value === "openai" || value === "gemini" ? value : undefined;
}

function getMentionFilter(value: string | null) {
  if (value === "mentioned" || value === "true" || value === "yes") {
    return "mentioned";
  }

  if (
    value === "not-mentioned" ||
    value === "false" ||
    value === "no"
  ) {
    return "not-mentioned";
  }

  return undefined;
}

function parseDateFilter(value: string | null, endOfDay = false) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    date.setHours(
      endOfDay ? 23 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 999 : 0,
    );
  }

  return date;
}

function getLimit(value: string | null) {
  const limit = Number(value);
  return Number.isFinite(limit) ? limit : undefined;
}

import { randomUUID } from "crypto";

import { z } from "zod";

import { db } from "@/db/drizzle";
import { promptRunResults, promptRuns } from "@/db/schemas";
import { getApiSession } from "@/lib/api-session";
import {
  analyzeModelResponse,
  normalizeDomain,
} from "@/lib/prompt-runs/analyze";
import {
  assertFreeModel,
  sendOpenRouterChat,
} from "@/lib/prompt-runs/openrouter";
import {
  listPromptRuns,
  serializePromptRun,
  type PromptRunFilters,
} from "@/lib/prompt-runs/repository";
import type { ModelProvider } from "@/types/promptRuns";

export const runtime = "nodejs";

const createPromptRunSchema = z.object({
  prompt: z.string().trim().min(1).max(8000),
  brand: z.string().trim().min(1).max(160),
  brandDomain: z.string().trim().max(240).optional().nullable(),
});

type ModelSpec = {
  provider: ModelProvider;
  modelId: string;
};

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

  const { prompt, brand } = parsed.data;
  const brandDomain = normalizeDomain(parsed.data.brandDomain);
  const runId = randomUUID();
  const userId = session.user.id;
  const modelSpecs = getModelSpecs();
  const evaluatorModel = getEvaluatorModel(modelSpecs);

  const [run] = await db
    .insert(promptRuns)
    .values({
      id: runId,
      userId,
      prompt,
      brand,
      brandDomain,
    })
    .returning();

  if (!run) {
    return Response.json(
      { error: "Failed to create prompt run" },
      { status: 500 },
    );
  }

  const resultPromises = modelSpecs.map((modelSpec) =>
    runModelPrompt({
      modelSpec,
      runId,
      userId,
      prompt,
      brand,
      brandDomain,
      evaluatorModel,
    }),
  );
  const resultValues = await Promise.all(resultPromises);
  const results = await db
    .insert(promptRunResults)
    .values(resultValues)
    .returning();

  return Response.json(
    {
      run: serializePromptRun(run, results),
    },
    { status: 201 },
  );
}

async function runModelPrompt({
  modelSpec,
  runId,
  userId,
  prompt,
  brand,
  brandDomain,
  evaluatorModel,
}: {
  modelSpec: ModelSpec;
  runId: string;
  userId: string;
  prompt: string;
  brand: string;
  brandDomain: string | null;
  evaluatorModel: string;
}): Promise<typeof promptRunResults.$inferInsert> {
  const id = randomUUID();

  try {
    const completion = await sendOpenRouterChat({
      model: modelSpec.modelId,
      temperature: 0.2,
      maxTokens: 1100,
      messages: [
        {
          role: "system",
          content:
            "You are a research assistant. Answer the user prompt directly. If you rely on a source and know the URL, include it. Do not fabricate citations.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    const analysis = await analyzeModelResponse({
      response: completion.content,
      brand,
      brandDomain,
      evaluatorModel,
    });

    return {
      id,
      runId,
      userId,
      modelProvider: modelSpec.provider,
      modelId: modelSpec.modelId,
      status: "success",
      rawResponse: completion.content,
      errorMessage: null,
      brandMentioned: analysis.brandMentioned,
      brandCited: analysis.brandCited,
      sentiment: analysis.sentiment,
      mentionHighlights: analysis.mentionHighlights,
      citationEvidence: analysis.citationEvidence,
      usageMetadata: completion.usage,
    };
  } catch (error) {
    return {
      id,
      runId,
      userId,
      modelProvider: modelSpec.provider,
      modelId: modelSpec.modelId,
      status: "error",
      rawResponse: "",
      errorMessage: getErrorMessage(error),
      brandMentioned: false,
      brandCited: false,
      sentiment: "unknown",
      mentionHighlights: [],
      citationEvidence: [],
    };
  }
}

function getModelSpecs(): ModelSpec[] {
  const modelSpecs: ModelSpec[] = [
    {
      provider: "openai",
      modelId:
        process.env.OPENROUTER_OPENAI_MODEL?.trim() ||
        "openai/gpt-oss-20b:free",
    },
    {
      provider: "gemini",
      modelId: getGeminiModel(),
    },
  ];

  for (const modelSpec of modelSpecs) {
    assertFreeModel(modelSpec.modelId);
  }

  return modelSpecs;
}

function getGeminiModel() {
  const configured = process.env.OPENROUTER_GEMINI_MODEL?.trim();

  if (
    !configured ||
    configured === "google/gemini-exp-1114:free" ||
    configured === "google/gemini-2.5-flash-lite"
  ) {
    return "google/gemma-4-26b-a4b-it:free";
  }

  return configured;
}

function getEvaluatorModel(modelSpecs: ModelSpec[]) {
  const evaluatorModel =
    process.env.OPENROUTER_EVALUATOR_MODEL?.trim() ||
    modelSpecs.find((modelSpec) => modelSpec.provider === "openai")?.modelId ||
    "openai/gpt-oss-20b:free";

  assertFreeModel(evaluatorModel);

  return evaluatorModel;
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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown model error";
}

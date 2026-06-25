import { randomUUID } from "crypto";

import { and, asc, eq, inArray, lt } from "drizzle-orm";

import { db } from "@/db/drizzle";
import { promptRunResults, promptRuns } from "@/db/schemas";
import { getOpenRouterRuntimeSettings } from "@/lib/byok/openrouter-settings";
import {
  analyzeModelResponse,
  normalizeDomain,
} from "@/lib/prompt-runs/analyze";
import { sendOpenRouterChat } from "@/lib/prompt-runs/openrouter";
import { serializePromptRun } from "@/lib/prompt-runs/repository";
import type { ModelProvider } from "@/types/promptRuns";

type ModelSpec = {
  provider: ModelProvider;
  modelId: string;
};

export async function createQueuedPromptRun({
  userId,
  scheduleId,
  prompt,
  brand,
  brandDomain,
  scheduledAt,
}: {
  userId: string;
  scheduleId?: string | null;
  prompt: string;
  brand: string;
  brandDomain: string | null | undefined;
  scheduledAt?: Date | null;
}) {
  const runId = randomUUID();
  const normalizedBrandDomain = normalizeDomain(brandDomain);
  const { modelSpecs } = await getOpenRouterRuntimeSettings(userId);

  const [run] = await db
    .insert(promptRuns)
    .values({
      id: runId,
      userId,
      scheduleId,
      prompt,
      brand,
      brandDomain: normalizedBrandDomain,
      status: "pending",
      scheduledAt,
    })
    .returning();

  if (!run) {
    throw new Error("Failed to create prompt run.");
  }

  const results = await db
    .insert(promptRunResults)
    .values(
      modelSpecs.map((modelSpec) => ({
        id: randomUUID(),
        runId,
        userId,
        modelProvider: modelSpec.provider,
        modelId: modelSpec.modelId,
        status: "pending" as const,
        rawResponse: "",
        errorMessage: null,
        brandMentioned: false,
        brandCited: false,
        sentiment: "unknown" as const,
        mentionHighlights: [],
        citationEvidence: [],
      })),
    )
    .returning();

  return serializePromptRun(run, results);
}

export async function processQueuedPromptRuns(limit = 3) {
  await resetStaleRunningRuns();

  const pendingRuns = await db
    .select()
    .from(promptRuns)
    .where(eq(promptRuns.status, "pending"))
    .orderBy(asc(promptRuns.createdAt))
    .limit(Math.min(Math.max(limit, 1), 5));

  const processed: Array<{ id: string; status: "completed" | "failed" }> = [];

  for (const pendingRun of pendingRuns) {
    const [claimedRun] = await db
      .update(promptRuns)
      .set({
        status: "running",
        startedAt: new Date(),
      })
      .where(
        and(eq(promptRuns.id, pendingRun.id), eq(promptRuns.status, "pending")),
      )
      .returning();

    if (!claimedRun) {
      continue;
    }

    const status = await executePromptRun(claimedRun.id);
    processed.push({ id: claimedRun.id, status });
  }

  return processed;
}

export async function processQueuedPromptRunById(runId: string) {
  const [claimedRun] = await db
    .update(promptRuns)
    .set({
      status: "running",
      startedAt: new Date(),
    })
    .where(and(eq(promptRuns.id, runId), eq(promptRuns.status, "pending")))
    .returning();

  if (!claimedRun) {
    return null;
  }

  const status = await executePromptRun(claimedRun.id);
  return { id: claimedRun.id, status };
}

export async function executePromptRun(runId: string) {
  const [run] = await db
    .select()
    .from(promptRuns)
    .where(eq(promptRuns.id, runId))
    .limit(1);

  if (!run) {
    throw new Error("Prompt run not found.");
  }

  const { apiKey, modelSpecs, evaluatorModel } =
    await getOpenRouterRuntimeSettings(run.userId);

  await db
    .update(promptRuns)
    .set({
      status: "running",
      startedAt: run.startedAt ?? new Date(),
    })
    .where(eq(promptRuns.id, runId));

  await Promise.all(
    modelSpecs.map((modelSpec) =>
      executeModelPrompt({
        modelSpec,
        runId,
        userId: run.userId,
        prompt: run.prompt,
        brand: run.brand,
        brandDomain: run.brandDomain,
        apiKey,
        evaluatorModel,
      }),
    ),
  );

  const results = await db
    .select()
    .from(promptRunResults)
    .where(eq(promptRunResults.runId, runId));
  const hasSuccess = results.some((result) => result.status === "success");
  const nextStatus = hasSuccess ? "completed" : "failed";

  await db
    .update(promptRuns)
    .set({
      status: nextStatus,
      completedAt: new Date(),
    })
    .where(eq(promptRuns.id, runId));

  return nextStatus;
}

async function executeModelPrompt({
  modelSpec,
  runId,
  userId,
  prompt,
  brand,
  brandDomain,
  apiKey,
  evaluatorModel,
}: {
  modelSpec: ModelSpec;
  runId: string;
  userId: string;
  prompt: string;
  brand: string;
  brandDomain: string | null;
  apiKey?: string;
  evaluatorModel: string;
}) {
  await db
    .update(promptRunResults)
    .set({
      status: "running",
      modelId: modelSpec.modelId,
      errorMessage: null,
    })
    .where(
      and(
        eq(promptRunResults.runId, runId),
        eq(promptRunResults.modelProvider, modelSpec.provider),
      ),
    );

  try {
    const completion = await sendOpenRouterChat({
      apiKey,
      model: modelSpec.modelId,
      temperature: 0.2,
      maxTokens: 1100,
      system:
        "You are a research assistant. Answer the user prompt directly. If you rely on a source and know the URL, include it. Do not fabricate citations.",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    const analysis = await analyzeModelResponse({
      apiKey,
      response: completion.content,
      brand,
      brandDomain,
      evaluatorModel,
    });

    await db
      .update(promptRunResults)
      .set({
        status: "success",
        rawResponse: completion.content,
        errorMessage: null,
        brandMentioned: analysis.brandMentioned,
        brandCited: analysis.brandCited,
        sentiment: analysis.sentiment,
        mentionHighlights: analysis.mentionHighlights,
        citationEvidence: analysis.citationEvidence,
        usageMetadata: completion.usage,
      })
      .where(
        and(
          eq(promptRunResults.runId, runId),
          eq(promptRunResults.userId, userId),
          eq(promptRunResults.modelProvider, modelSpec.provider),
        ),
      );
  } catch (error) {
    await db
      .update(promptRunResults)
      .set({
        status: "error",
        rawResponse: "",
        errorMessage: getErrorMessage(error),
        brandMentioned: false,
        brandCited: false,
        sentiment: "unknown",
        mentionHighlights: [],
        citationEvidence: [],
        usageMetadata: undefined,
      })
      .where(
        and(
          eq(promptRunResults.runId, runId),
          eq(promptRunResults.userId, userId),
          eq(promptRunResults.modelProvider, modelSpec.provider),
        ),
      );
  }
}

async function resetStaleRunningRuns() {
  const staleBefore = new Date(Date.now() - 1000 * 60 * 20);
  const staleRuns = await db
    .select({ id: promptRuns.id })
    .from(promptRuns)
    .where(
      and(
        eq(promptRuns.status, "running"),
        lt(promptRuns.startedAt, staleBefore),
      ),
    );
  const staleRunIds = staleRuns.map((run) => run.id);

  if (staleRunIds.length === 0) {
    return;
  }

  await db
    .update(promptRuns)
    .set({
      status: "pending",
      startedAt: null,
    })
    .where(inArray(promptRuns.id, staleRunIds));

  await db
    .update(promptRunResults)
    .set({
      status: "pending",
      errorMessage: null,
    })
    .where(inArray(promptRunResults.runId, staleRunIds));
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Prompt run failed.";
}

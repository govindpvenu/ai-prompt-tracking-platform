import { and, desc, eq, gte, ilike, lte, type SQL } from "drizzle-orm";

import { db } from "@/db/drizzle";
import { promptRunResults, promptRuns } from "@/db/schemas";
import type {
  HighlightRange,
  ModelProvider,
  PromptRun,
  PromptRunResult,
  UsageMetadata,
} from "@/types/promptRuns";

type PromptRunRow = typeof promptRuns.$inferSelect;
type PromptRunResultRow = typeof promptRunResults.$inferSelect;

export type PromptRunFilters = {
  brand?: string;
  model?: ModelProvider;
  mention?: "mentioned" | "not-mentioned";
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
};

const providerOrder: Record<ModelProvider, number> = {
  openai: 0,
  gemini: 1,
};

export function serializePromptRun(
  run: PromptRunRow,
  results: PromptRunResultRow[],
): PromptRun {
  return {
    id: run.id,
    prompt: run.prompt,
    brand: run.brand,
    brandDomain: run.brandDomain,
    createdAt: run.createdAt.toISOString(),
    results: results
      .map(serializePromptRunResult)
      .toSorted(
        (a, b) => providerOrder[a.modelProvider] - providerOrder[b.modelProvider],
      ),
  };
}

export function serializePromptRunResult(
  result: PromptRunResultRow,
): PromptRunResult {
  return {
    id: result.id,
    runId: result.runId,
    modelProvider: result.modelProvider,
    modelId: result.modelId,
    status: result.status,
    rawResponse: result.rawResponse,
    errorMessage: result.errorMessage,
    brandMentioned: result.brandMentioned,
    brandCited: result.brandCited,
    sentiment: result.sentiment,
    mentionHighlights: (result.mentionHighlights ?? []) as HighlightRange[],
    citationEvidence: (result.citationEvidence ?? []) as string[],
    usageMetadata: (result.usageMetadata ?? undefined) as
      | UsageMetadata
      | undefined,
    createdAt: result.createdAt.toISOString(),
  };
}

export async function listPromptRuns(
  userId: string,
  filters: PromptRunFilters = {},
) {
  const limit = Math.min(Math.max(filters.limit ?? 50, 1), 100);
  const conditions: SQL[] = [eq(promptRuns.userId, userId)];

  if (filters.brand) {
    conditions.push(ilike(promptRuns.brand, `%${filters.brand}%`));
  }

  if (filters.model) {
    conditions.push(eq(promptRunResults.modelProvider, filters.model));
  }

  if (filters.mention) {
    conditions.push(
      eq(promptRunResults.brandMentioned, filters.mention === "mentioned"),
    );
  }

  if (filters.dateFrom) {
    conditions.push(gte(promptRuns.createdAt, filters.dateFrom));
  }

  if (filters.dateTo) {
    conditions.push(lte(promptRuns.createdAt, filters.dateTo));
  }

  const rows = await db
    .select({
      run: promptRuns,
      result: promptRunResults,
    })
    .from(promptRuns)
    .innerJoin(promptRunResults, eq(promptRunResults.runId, promptRuns.id))
    .where(and(...conditions))
    .orderBy(desc(promptRuns.createdAt))
    .limit(limit * 2);

  return groupPromptRunRows(rows);
}

export async function getPromptRunById(userId: string, runId: string) {
  const rows = await db
    .select({
      run: promptRuns,
      result: promptRunResults,
    })
    .from(promptRuns)
    .innerJoin(promptRunResults, eq(promptRunResults.runId, promptRuns.id))
    .where(and(eq(promptRuns.userId, userId), eq(promptRuns.id, runId)))
    .orderBy(desc(promptRuns.createdAt));

  return groupPromptRunRows(rows)[0] ?? null;
}

function groupPromptRunRows(
  rows: Array<{ run: PromptRunRow; result: PromptRunResultRow }>,
) {
  const grouped = new Map<
    string,
    { run: PromptRunRow; results: PromptRunResultRow[] }
  >();

  for (const row of rows) {
    const existing = grouped.get(row.run.id);

    if (existing) {
      existing.results.push(row.result);
      continue;
    }

    grouped.set(row.run.id, {
      run: row.run,
      results: [row.result],
    });
  }

  return Array.from(grouped.values()).map(({ run, results }) =>
    serializePromptRun(run, results),
  );
}

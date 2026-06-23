import { randomUUID } from "crypto";

import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db/drizzle";
import {
  promptRunResults,
  promptRuns,
  promptSchedules,
} from "@/db/schemas";
import { normalizeDomain } from "@/lib/prompt-runs/analyze";
import { serializePromptRun } from "@/lib/prompt-runs/repository";
import type { ModelProvider, PromptRun } from "@/types/promptRuns";
import type {
  PromptSchedule,
  PromptScheduleCadence,
  PromptScheduleChange,
  PromptScheduleStatus,
} from "@/types/promptSchedules";

type PromptScheduleRow = typeof promptSchedules.$inferSelect;
type PromptRunRow = typeof promptRuns.$inferSelect;
type PromptRunResultRow = typeof promptRunResults.$inferSelect;

export type CreatePromptScheduleInput = {
  userId: string;
  prompt: string;
  brand: string;
  brandDomain?: string | null;
  cadence: PromptScheduleCadence;
  nextRunAt: Date;
};

export async function createPromptSchedule({
  userId,
  prompt,
  brand,
  brandDomain,
  cadence,
  nextRunAt,
}: CreatePromptScheduleInput) {
  const [schedule] = await db
    .insert(promptSchedules)
    .values({
      id: randomUUID(),
      userId,
      prompt,
      brand,
      brandDomain: normalizeDomain(brandDomain),
      cadence,
      nextRunAt,
      status: "active",
    })
    .returning();

  if (!schedule) {
    throw new Error("Failed to create schedule.");
  }

  return serializePromptSchedule(schedule, []);
}

export async function listPromptSchedules(userId: string) {
  const schedules = await db
    .select()
    .from(promptSchedules)
    .where(eq(promptSchedules.userId, userId))
    .orderBy(desc(promptSchedules.createdAt));

  return hydrateSchedules(schedules);
}

export async function getPromptScheduleById(userId: string, scheduleId: string) {
  const [schedule] = await db
    .select()
    .from(promptSchedules)
    .where(
      and(eq(promptSchedules.userId, userId), eq(promptSchedules.id, scheduleId)),
    )
    .limit(1);

  if (!schedule) {
    return null;
  }

  return hydrateSchedules([schedule]).then((schedules) => schedules[0] ?? null);
}

export async function updatePromptScheduleStatus({
  userId,
  scheduleId,
  status,
  nextRunAt,
}: {
  userId: string;
  scheduleId: string;
  status: PromptScheduleStatus;
  nextRunAt?: Date;
}) {
  const [schedule] = await db
    .update(promptSchedules)
    .set({
      status,
      nextRunAt,
      updatedAt: new Date(),
    })
    .where(
      and(eq(promptSchedules.userId, userId), eq(promptSchedules.id, scheduleId)),
    )
    .returning();

  if (!schedule) {
    return null;
  }

  return hydrateSchedules([schedule]).then((schedules) => schedules[0] ?? null);
}

export async function deletePromptSchedule(userId: string, scheduleId: string) {
  const [schedule] = await db
    .delete(promptSchedules)
    .where(
      and(eq(promptSchedules.userId, userId), eq(promptSchedules.id, scheduleId)),
    )
    .returning({ id: promptSchedules.id });

  return Boolean(schedule);
}

async function hydrateSchedules(schedules: PromptScheduleRow[]) {
  if (schedules.length === 0) {
    return [];
  }

  const scheduleIds = schedules.map((schedule) => schedule.id);
  const rows = await db
    .select({
      run: promptRuns,
      result: promptRunResults,
    })
    .from(promptRuns)
    .innerJoin(promptRunResults, eq(promptRunResults.runId, promptRuns.id))
    .where(inArray(promptRuns.scheduleId, scheduleIds))
    .orderBy(desc(promptRuns.createdAt))
    .limit(Math.max(scheduleIds.length * 8, 24));

  const runsBySchedule = groupRunsBySchedule(rows);

  return schedules.map((schedule) =>
    serializePromptSchedule(schedule, runsBySchedule.get(schedule.id) ?? []),
  );
}

function serializePromptSchedule(
  schedule: PromptScheduleRow,
  recentRuns: PromptRun[],
): PromptSchedule {
  return {
    id: schedule.id,
    prompt: schedule.prompt,
    brand: schedule.brand,
    brandDomain: schedule.brandDomain,
    cadence: schedule.cadence,
    status: schedule.status,
    nextRunAt: schedule.nextRunAt.toISOString(),
    lastRunAt: schedule.lastRunAt?.toISOString() ?? null,
    createdAt: schedule.createdAt.toISOString(),
    updatedAt: schedule.updatedAt.toISOString(),
    recentRuns,
    change: getScheduleChange(recentRuns),
  };
}

function groupRunsBySchedule(
  rows: Array<{ run: PromptRunRow; result: PromptRunResultRow }>,
) {
  const groupedRows = new Map<
    string,
    Map<string, { run: PromptRunRow; results: PromptRunResultRow[] }>
  >();

  for (const row of rows) {
    if (!row.run.scheduleId) {
      continue;
    }

    const scheduleRuns =
      groupedRows.get(row.run.scheduleId) ??
      new Map<string, { run: PromptRunRow; results: PromptRunResultRow[] }>();
    const runGroup = scheduleRuns.get(row.run.id);

    if (runGroup) {
      runGroup.results.push(row.result);
    } else {
      scheduleRuns.set(row.run.id, {
        run: row.run,
        results: [row.result],
      });
    }

    groupedRows.set(row.run.scheduleId, scheduleRuns);
  }

  const runsBySchedule = new Map<string, PromptRun[]>();

  for (const [scheduleId, runGroups] of groupedRows) {
    runsBySchedule.set(
      scheduleId,
      Array.from(runGroups.values())
        .map(({ run, results }) => serializePromptRun(run, results))
        .slice(0, 6),
    );
  }

  return runsBySchedule;
}

function getScheduleChange(runs: PromptRun[]): PromptScheduleChange | null {
  const comparableRuns = runs.filter((run) => run.status === "completed");
  const latest = comparableRuns[0];
  const previous = comparableRuns[1];

  if (!latest || !previous) {
    return null;
  }

  const latestMentioned = getMentionedProviders(latest);
  const previousMentioned = getMentionedProviders(previous);

  return {
    mentionedDelta: countMentions(latest) - countMentions(previous),
    citedDelta: countCitations(latest) - countCitations(previous),
    newMentions: difference(latestMentioned, previousMentioned),
    lostMentions: difference(previousMentioned, latestMentioned),
    sentimentChanges: getSentimentChanges(latest, previous),
  };
}

function countMentions(run: PromptRun) {
  return run.results.filter((result) => result.brandMentioned).length;
}

function countCitations(run: PromptRun) {
  return run.results.filter((result) => result.brandCited).length;
}

function getMentionedProviders(run: PromptRun) {
  return run.results
    .filter((result) => result.brandMentioned)
    .map((result) => result.modelProvider);
}

function difference(current: ModelProvider[], previous: ModelProvider[]) {
  const previousSet = new Set(previous);
  return current.filter((provider) => !previousSet.has(provider));
}

function getSentimentChanges(latest: PromptRun, previous: PromptRun) {
  return latest.results.flatMap((result) => {
    const previousResult = previous.results.find(
      (candidate) => candidate.modelProvider === result.modelProvider,
    );

    if (!previousResult || previousResult.sentiment === result.sentiment) {
      return [];
    }

    return [
      {
        modelProvider: result.modelProvider,
        from: previousResult.sentiment,
        to: result.sentiment,
      },
    ];
  });
}

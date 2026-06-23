import { and, asc, eq, lte } from "drizzle-orm";

import { db } from "@/db/drizzle";
import { promptSchedules } from "@/db/schemas";
import { createQueuedPromptRun } from "@/lib/prompt-runs/executor";
import type { PromptScheduleCadence } from "@/types/promptSchedules";

export async function processDuePromptSchedules(limit = 5) {
  const now = new Date();
  const dueSchedules = await db
    .select()
    .from(promptSchedules)
    .where(
      and(
        eq(promptSchedules.status, "active"),
        lte(promptSchedules.nextRunAt, now),
      ),
    )
    .orderBy(asc(promptSchedules.nextRunAt))
    .limit(Math.min(Math.max(limit, 1), 10));

  const queued: Array<{ scheduleId: string; runId: string }> = [];

  for (const schedule of dueSchedules) {
    const scheduledAt = schedule.nextRunAt;
    const nextRunAt = getNextRunAt(schedule.cadence, scheduledAt, now);

    const [claimedSchedule] = await db
      .update(promptSchedules)
      .set({
        lastRunAt: now,
        nextRunAt,
        updatedAt: now,
      })
      .where(
        and(
          eq(promptSchedules.id, schedule.id),
          eq(promptSchedules.status, "active"),
          eq(promptSchedules.nextRunAt, scheduledAt),
        ),
      )
      .returning({ id: promptSchedules.id });

    if (!claimedSchedule) {
      continue;
    }

    const run = await createQueuedPromptRun({
      userId: schedule.userId,
      scheduleId: schedule.id,
      prompt: schedule.prompt,
      brand: schedule.brand,
      brandDomain: schedule.brandDomain,
      scheduledAt,
    });

    queued.push({ scheduleId: schedule.id, runId: run.id });
  }

  return queued;
}

export function getNextRunAt(
  cadence: PromptScheduleCadence,
  from: Date,
  minimum = new Date(),
) {
  const nextRunAt = new Date(from);

  do {
    if (cadence === "weekly") {
      nextRunAt.setDate(nextRunAt.getDate() + 7);
    } else {
      nextRunAt.setDate(nextRunAt.getDate() + 1);
    }
  } while (nextRunAt <= minimum);

  return nextRunAt;
}

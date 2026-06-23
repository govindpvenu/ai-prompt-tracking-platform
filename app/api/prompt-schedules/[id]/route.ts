import { after } from "next/server";
import { z } from "zod";

import { getApiSession } from "@/lib/api-session";
import { processQueuedPromptRuns } from "@/lib/prompt-runs/executor";
import { processDuePromptSchedules } from "@/lib/prompt-schedules/executor";
import {
  deletePromptSchedule,
  getPromptScheduleById,
  updatePromptScheduleStatus,
} from "@/lib/prompt-schedules/repository";

export const runtime = "nodejs";

const updatePromptScheduleSchema = z.object({
  status: z.enum(["active", "paused"]),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getApiSession();

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const schedule = await getPromptScheduleById(session.user.id, id);

  if (!schedule) {
    return Response.json({ error: "Schedule not found" }, { status: 404 });
  }

  return Response.json({ schedule });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const parsed = updatePromptScheduleSchema.safeParse(json);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid schedule update", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id } = await params;
  const schedule = await updatePromptScheduleStatus({
    userId: session.user.id,
    scheduleId: id,
    status: parsed.data.status,
    nextRunAt: parsed.data.status === "active" ? new Date() : undefined,
  });

  if (!schedule) {
    return Response.json({ error: "Schedule not found" }, { status: 404 });
  }

  if (parsed.data.status === "active") {
    after(async () => {
      await processDuePromptSchedules(3);
      await processQueuedPromptRuns(3);
    });
  }

  return Response.json({ schedule });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getApiSession();

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await deletePromptSchedule(session.user.id, id);

  if (!deleted) {
    return Response.json({ error: "Schedule not found" }, { status: 404 });
  }

  return Response.json({ ok: true });
}

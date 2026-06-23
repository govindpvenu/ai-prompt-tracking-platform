import { after } from "next/server";
import { z } from "zod";

import { getApiSession } from "@/lib/api-session";
import { processQueuedPromptRuns } from "@/lib/prompt-runs/executor";
import { processDuePromptSchedules } from "@/lib/prompt-schedules/executor";
import {
  createPromptSchedule,
  listPromptSchedules,
} from "@/lib/prompt-schedules/repository";

export const runtime = "nodejs";

const createPromptScheduleSchema = z.object({
  prompt: z.string().trim().min(1).max(8000),
  brand: z.string().trim().min(1).max(160),
  brandDomain: z.string().trim().max(240).optional().nullable(),
  cadence: z.enum(["daily", "weekly"]),
  nextRunAt: z.string().trim().optional().nullable(),
});

export async function GET() {
  const session = await getApiSession();

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schedules = await listPromptSchedules(session.user.id);

  return Response.json({ schedules });
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

  const parsed = createPromptScheduleSchema.safeParse(json);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid schedule request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const schedule = await createPromptSchedule({
    userId: session.user.id,
    prompt: parsed.data.prompt,
    brand: parsed.data.brand,
    brandDomain: parsed.data.brandDomain,
    cadence: parsed.data.cadence,
    nextRunAt: parseNextRunAt(parsed.data.nextRunAt),
  });

  after(async () => {
    await processDuePromptSchedules(3);
    await processQueuedPromptRuns(3);
  });

  return Response.json({ schedule }, { status: 201 });
}

function parseNextRunAt(value: string | null | undefined) {
  if (!value) {
    return new Date();
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date();
  }

  return date;
}

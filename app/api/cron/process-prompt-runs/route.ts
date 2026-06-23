import { processQueuedPromptRuns } from "@/lib/prompt-runs/executor";
import { processDuePromptSchedules } from "@/lib/prompt-schedules/executor";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const unauthorizedResponse = validateCronRequest(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 3);
  const scheduleLimit = Number(url.searchParams.get("scheduleLimit") ?? 5);
  const scheduled = await processDuePromptSchedules(scheduleLimit);
  const processed = await processQueuedPromptRuns(limit);

  return Response.json({
    scheduled,
    scheduledCount: scheduled.length,
    processed,
    count: processed.length,
  });
}

function validateCronRequest(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return null;
  }

  const authorization = request.headers.get("authorization");

  if (authorization === `Bearer ${cronSecret}`) {
    return null;
  }

  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

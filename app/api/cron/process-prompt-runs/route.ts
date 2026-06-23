import { processQueuedPromptRuns } from "@/lib/prompt-runs/executor";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const unauthorizedResponse = validateCronRequest(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 3);
  const processed = await processQueuedPromptRuns(limit);

  return Response.json({
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

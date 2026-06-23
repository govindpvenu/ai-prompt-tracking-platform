import { after } from "next/server";
import { z } from "zod";

import { getApiSession } from "@/lib/api-session";
import {
  createQueuedPromptRun,
  processQueuedPromptRuns,
} from "@/lib/prompt-runs/executor";

export const runtime = "nodejs";

const maxBatchSize = 5;

const batchPromptRunSchema = z.object({
  prompt: z.string().trim().min(1).max(8000),
  items: z
    .array(
      z.object({
        brand: z.string().trim().min(1).max(160),
        brandDomain: z.string().trim().max(240).optional().nullable(),
      }),
    )
    .min(1)
    .max(maxBatchSize),
});

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

  const parsed = batchPromptRunSchema.safeParse(json);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid batch request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const runs = [];

  for (const item of parsed.data.items) {
    const run = await createQueuedPromptRun({
      userId: session.user.id,
      prompt: parsed.data.prompt,
      brand: item.brand,
      brandDomain: item.brandDomain,
    });

    runs.push(run);
  }

  after(async () => {
    await processQueuedPromptRuns(maxBatchSize);
  });

  return Response.json({ runs }, { status: 202 });
}

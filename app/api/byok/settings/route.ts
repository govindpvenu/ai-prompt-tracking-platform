import { z } from "zod";

import { getApiSession } from "@/lib/api-session";
import {
  getOpenRouterSettingsView,
  resetOpenRouterSettings,
  saveOpenRouterSettings,
} from "@/lib/byok/openrouter-settings";

export const runtime = "nodejs";

const updateSettingsSchema = z.object({
  apiKey: z.string().trim().min(1).max(400).optional().nullable(),
  openaiModel: z.string().trim().min(1).max(180),
  geminiModel: z.string().trim().min(1).max(180),
  evaluatorModel: z.string().trim().max(180).optional().nullable(),
});

export async function GET() {
  const session = await getApiSession();

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getOpenRouterSettingsView(session.user.id);

  return Response.json({ settings });
}

export async function PUT(request: Request) {
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

  const parsed = updateSettingsSchema.safeParse(json);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid OpenRouter settings", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const settings = await saveOpenRouterSettings({
      userId: session.user.id,
      apiKey: parsed.data.apiKey,
      openaiModel: parsed.data.openaiModel,
      geminiModel: parsed.data.geminiModel,
      evaluatorModel: parsed.data.evaluatorModel,
    });

    return Response.json({ settings });
  } catch (error) {
    return Response.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

export async function DELETE() {
  const session = await getApiSession();

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await resetOpenRouterSettings(session.user.id);

  return Response.json({ settings });
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "OpenRouter settings update failed.";
}

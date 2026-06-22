import { getApiSession } from "@/lib/api-session";
import { getPromptRunById } from "@/lib/prompt-runs/repository";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getApiSession();

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const run = await getPromptRunById(session.user.id, id);

  if (!run) {
    return Response.json({ error: "Prompt run not found" }, { status: 404 });
  }

  return Response.json({ run });
}

import { getApiSession } from "@/lib/api-session";

export const runtime = "nodejs";

type OpenRouterModelPayload = {
  data?: unknown;
};

type OpenRouterModelOption = {
  id: string;
  name: string;
  contextLength: number | null;
  isFree: boolean;
};

export async function GET() {
  const session = await getApiSession();

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = await fetch("https://openrouter.ai/api/v1/models", {
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    return Response.json(
      { error: "Could not load OpenRouter models." },
      { status: 502 },
    );
  }

  const payload = (await response.json()) as OpenRouterModelPayload;
  const models = Array.isArray(payload.data)
    ? payload.data.flatMap(normalizeModelOption).slice(0, 500)
    : [];

  return Response.json({ models });
}

function normalizeModelOption(value: unknown): OpenRouterModelOption[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;
  const id = typeof record.id === "string" ? record.id : "";
  const name = typeof record.name === "string" ? record.name : id;
  const architecture =
    record.architecture && typeof record.architecture === "object"
      ? (record.architecture as Record<string, unknown>)
      : null;
  const inputModalities = architecture?.input_modalities;
  const outputModalities = architecture?.output_modalities;

  if (
    !id ||
    !Array.isArray(inputModalities) ||
    !inputModalities.includes("text") ||
    !Array.isArray(outputModalities) ||
    !outputModalities.includes("text")
  ) {
    return [];
  }

  return [
    {
      id,
      name,
      contextLength:
        typeof record.context_length === "number"
          ? record.context_length
          : null,
      isFree: id.endsWith(":free") || hasZeroTokenPricing(record.pricing),
    },
  ];
}

function hasZeroTokenPricing(value: unknown) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const pricing = value as Record<string, unknown>;
  return pricing.prompt === "0" && pricing.completion === "0";
}

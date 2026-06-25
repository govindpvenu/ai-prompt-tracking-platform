import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";

import { eq } from "drizzle-orm";

import { db } from "@/db/drizzle";
import { userOpenRouterSettings } from "@/db/schemas";

export type OpenRouterModelSlot = "openai" | "gemini";

export type OpenRouterModelSpec = {
  provider: OpenRouterModelSlot;
  modelId: string;
};

export type OpenRouterRuntimeSettings = {
  apiKey: string | undefined;
  apiKeySource: "custom" | "environment";
  modelSpecs: OpenRouterModelSpec[];
  evaluatorModel: string;
};

export type OpenRouterSettingsView = {
  apiKeyConfigured: boolean;
  apiKeySource: "custom" | "environment";
  openaiModel: string;
  geminiModel: string;
  evaluatorModel: string;
  defaults: {
    apiKeyConfigured: boolean;
    openaiModel: string;
    geminiModel: string;
    evaluatorModel: string;
  };
  updatedAt: string | null;
};

type OpenRouterSettingsRow = typeof userOpenRouterSettings.$inferSelect;

type SaveOpenRouterSettingsInput = {
  userId: string;
  apiKey?: string | null;
  openaiModel: string;
  geminiModel: string;
  evaluatorModel?: string | null;
};

const encryptedValueVersion = "v1";

export function getDefaultOpenRouterSettings() {
  const openaiModel =
    process.env.OPENROUTER_OPENAI_MODEL?.trim() || "openai/gpt-oss-20b:free";
  const geminiModel =
    process.env.OPENROUTER_GEMINI_MODEL?.trim() ||
    "google/gemma-4-26b-a4b-it:free";
  const evaluatorModel =
    process.env.OPENROUTER_EVALUATOR_MODEL?.trim() || openaiModel;

  return {
    apiKey: getEnvironmentOpenRouterApiKey(),
    openaiModel,
    geminiModel,
    evaluatorModel,
  };
}

export async function getOpenRouterSettingsView(
  userId: string,
): Promise<OpenRouterSettingsView> {
  const row = await getOpenRouterSettingsRow(userId);
  return serializeOpenRouterSettings(row);
}

export async function getOpenRouterRuntimeSettings(
  userId: string,
): Promise<OpenRouterRuntimeSettings> {
  const defaults = getDefaultOpenRouterSettings();
  const row = await getOpenRouterSettingsRow(userId);
  const openaiModel = normalizeModelId(row?.openaiModel) || defaults.openaiModel;
  const geminiModel = normalizeModelId(row?.geminiModel) || defaults.geminiModel;
  const evaluatorModel =
    normalizeModelId(row?.evaluatorModel) ||
    defaults.evaluatorModel ||
    openaiModel;
  const customApiKey = row?.encryptedApiKey
    ? decryptSecret(row.encryptedApiKey)
    : undefined;
  const apiKey = customApiKey || defaults.apiKey;

  assertOpenRouterModel(openaiModel);
  assertOpenRouterModel(geminiModel);
  assertOpenRouterModel(evaluatorModel);

  return {
    apiKey,
    apiKeySource: customApiKey ? "custom" : "environment",
    evaluatorModel,
    modelSpecs: [
      {
        provider: "openai",
        modelId: openaiModel,
      },
      {
        provider: "gemini",
        modelId: geminiModel,
      },
    ],
  };
}

export async function saveOpenRouterSettings({
  userId,
  apiKey,
  openaiModel,
  geminiModel,
  evaluatorModel,
}: SaveOpenRouterSettingsInput) {
  const existing = await getOpenRouterSettingsRow(userId);
  const encryptedApiKey =
    apiKey === undefined
      ? existing?.encryptedApiKey ?? null
      : apiKey
        ? encryptSecret(apiKey)
        : null;
  const normalizedOpenaiModel = normalizeModelId(openaiModel);
  const normalizedGeminiModel = normalizeModelId(geminiModel);
  const normalizedEvaluatorModel = normalizeModelId(evaluatorModel);
  const evaluatorModelValue = normalizedEvaluatorModel || null;

  assertOpenRouterModel(normalizedOpenaiModel);
  assertOpenRouterModel(normalizedGeminiModel);

  if (normalizedEvaluatorModel) {
    assertOpenRouterModel(normalizedEvaluatorModel);
  }

  const [row] = await db
    .insert(userOpenRouterSettings)
    .values({
      userId,
      encryptedApiKey,
      openaiModel: normalizedOpenaiModel,
      geminiModel: normalizedGeminiModel,
      evaluatorModel: evaluatorModelValue,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userOpenRouterSettings.userId,
      set: {
        encryptedApiKey,
        openaiModel: normalizedOpenaiModel,
        geminiModel: normalizedGeminiModel,
        evaluatorModel: evaluatorModelValue,
        updatedAt: new Date(),
      },
    })
    .returning();

  return serializeOpenRouterSettings(row ?? null);
}

export async function resetOpenRouterSettings(userId: string) {
  await db
    .delete(userOpenRouterSettings)
    .where(eq(userOpenRouterSettings.userId, userId));

  return serializeOpenRouterSettings(null);
}

export function assertOpenRouterModel(modelId: string) {
  if (!modelId || /\s/.test(modelId) || !modelId.includes("/")) {
    throw new Error(`Invalid OpenRouter model id: ${modelId || "empty"}.`);
  }
}

function serializeOpenRouterSettings(
  row: OpenRouterSettingsRow | null | undefined,
): OpenRouterSettingsView {
  const defaults = getDefaultOpenRouterSettings();
  const openaiModel = normalizeModelId(row?.openaiModel) || defaults.openaiModel;
  const geminiModel = normalizeModelId(row?.geminiModel) || defaults.geminiModel;
  const evaluatorModel =
    normalizeModelId(row?.evaluatorModel) ||
    defaults.evaluatorModel ||
    openaiModel;

  return {
    apiKeyConfigured: Boolean(row?.encryptedApiKey || defaults.apiKey),
    apiKeySource: row?.encryptedApiKey ? "custom" : "environment",
    openaiModel,
    geminiModel,
    evaluatorModel,
    defaults: {
      apiKeyConfigured: Boolean(defaults.apiKey),
      openaiModel: defaults.openaiModel,
      geminiModel: defaults.geminiModel,
      evaluatorModel: defaults.evaluatorModel,
    },
    updatedAt: row?.updatedAt.toISOString() ?? null,
  };
}

function getOpenRouterSettingsRow(userId: string) {
  return db.query.userOpenRouterSettings.findFirst({
    where: eq(userOpenRouterSettings.userId, userId),
  });
}

function getEnvironmentOpenRouterApiKey() {
  return (
    process.env.OPENROUTER_API_KEY?.trim() ||
    process.env.OPEN_ROUTER_API_KEY?.trim() ||
    undefined
  );
}

function normalizeModelId(value: string | null | undefined) {
  return value?.trim() || "";
}

function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(value.trim(), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    encryptedValueVersion,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");
}

function decryptSecret(value: string) {
  const [version, iv, tag, ciphertext] = value.split(":");

  if (version !== encryptedValueVersion || !iv || !tag || !ciphertext) {
    throw new Error("Stored OpenRouter key is not in a supported format.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(iv, "base64url"),
  );

  decipher.setAuthTag(Buffer.from(tag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function getEncryptionKey() {
  const secret =
    process.env.BYOK_ENCRYPTION_KEY?.trim() ||
    process.env.BETTER_AUTH_SECRET?.trim() ||
    process.env.OPENROUTER_API_KEY?.trim() ||
    "prompt-tracker-local-byok-key";

  return createHash("sha256").update(secret).digest();
}

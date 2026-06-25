"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2Icon,
  Loader2Icon,
  RotateCcwIcon,
  SaveIcon,
  ServerIcon,
  TestTube2Icon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { OpenRouterSettingsView } from "@/lib/byok/openrouter-settings";

type ByokClientProps = {
  initialSettings: OpenRouterSettingsView;
};

type ModelOption = {
  id: string;
  name: string;
  contextLength: number | null;
  isFree: boolean;
};

type SettingsResponse = {
  settings?: OpenRouterSettingsView;
  error?: string;
};

type ModelsResponse = {
  models?: ModelOption[];
  error?: string;
};

type TestResponse = {
  ok?: boolean;
  limitRemaining?: number | null;
  error?: string;
};

const modelDatalistId = "openrouter-model-options";

export function ByokClient({ initialSettings }: ByokClientProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [useCustomKey, setUseCustomKey] = useState(
    initialSettings.apiKeySource === "custom",
  );
  const [apiKey, setApiKey] = useState("");
  const [openaiModel, setOpenaiModel] = useState(initialSettings.openaiModel);
  const [geminiModel, setGeminiModel] = useState(initialSettings.geminiModel);
  const [evaluatorModel, setEvaluatorModel] = useState(
    initialSettings.evaluatorModel,
  );
  const [models, setModels] = useState<ModelOption[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedModels = useMemo(
    () =>
      [
        { label: "Primary", modelId: openaiModel },
        { label: "Comparison", modelId: geminiModel },
        { label: "Evaluator", modelId: evaluatorModel },
      ].filter((model) => model.modelId),
    [evaluatorModel, geminiModel, openaiModel],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadModels() {
      setIsLoadingModels(true);

      try {
        const response = await fetch("/api/byok/models");
        const data = (await response.json()) as ModelsResponse;

        if (!response.ok || !data.models) {
          throw new Error(data.error ?? "Could not load OpenRouter models.");
        }

        if (!cancelled) {
          setModels(data.models);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (!cancelled) {
          setIsLoadingModels(false);
        }
      }
    }

    void loadModels();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (useCustomKey && !settingsHasCustomKey(settings) && !apiKey.trim()) {
      setError("Enter an OpenRouter key or use the environment key.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/byok/settings", {
        body: JSON.stringify({
          apiKey: getApiKeyPayload(),
          openaiModel,
          geminiModel,
          evaluatorModel,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PUT",
      });
      const data = (await response.json()) as SettingsResponse;

      if (!response.ok || !data.settings) {
        throw new Error(data.error ?? "Could not save OpenRouter settings.");
      }

      applySettings(data.settings);
      setApiKey("");
      setMessage("OpenRouter settings saved.");
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTest() {
    setError(null);
    setMessage(null);

    if (useCustomKey && !settingsHasCustomKey(settings) && !apiKey.trim()) {
      setError("Enter an OpenRouter key before testing.");
      return;
    }

    setIsTesting(true);

    try {
      const response = await fetch("/api/byok/test", {
        body: JSON.stringify({
          apiKey: useCustomKey && apiKey.trim() ? apiKey.trim() : undefined,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const data = (await response.json()) as TestResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "OpenRouter test failed.");
      }

      setMessage(getTestSuccessMessage(data));
    } catch (testError) {
      setError(getErrorMessage(testError));
    } finally {
      setIsTesting(false);
    }
  }

  async function handleReset() {
    setError(null);
    setMessage(null);
    setIsResetting(true);

    try {
      const response = await fetch("/api/byok/settings", {
        method: "DELETE",
      });
      const data = (await response.json()) as SettingsResponse;

      if (!response.ok || !data.settings) {
        throw new Error(data.error ?? "Could not reset OpenRouter settings.");
      }

      applySettings(data.settings);
      setApiKey("");
      setMessage("OpenRouter settings reset to environment defaults.");
    } catch (resetError) {
      setError(getErrorMessage(resetError));
    } finally {
      setIsResetting(false);
    }
  }

  function applySettings(nextSettings: OpenRouterSettingsView) {
    setSettings(nextSettings);
    setUseCustomKey(nextSettings.apiKeySource === "custom");
    setOpenaiModel(nextSettings.openaiModel);
    setGeminiModel(nextSettings.geminiModel);
    setEvaluatorModel(nextSettings.evaluatorModel);
  }

  function getApiKeyPayload() {
    if (!useCustomKey) {
      return null;
    }

    return apiKey.trim() || undefined;
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-5 border-t p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-normal">
            OpenRouter Keys
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure the key and models used by prompt research, batch runs,
            and schedules.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={
              settings.apiKeySource === "custom" ? "secondary" : "outline"
            }
          >
            {settings.apiKeySource === "custom"
              ? "Custom key"
              : "Environment key"}
          </Badge>
          {settings.apiKeyConfigured ? (
            <Badge variant="secondary">
              <CheckCircle2Icon />
              Key configured
            </Badge>
          ) : (
            <Badge variant="destructive">Missing key</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(420px,0.9fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Provider settings</CardTitle>
            <CardDescription>
              {settings.updatedAt
                ? `Updated ${formatDateTime(settings.updatedAt)}`
                : "Using project defaults"}
            </CardDescription>
            <CardAction>
              <Button
                disabled={isResetting || isSaving || isTesting}
                onClick={handleReset}
                size="sm"
                type="button"
                variant="outline"
              >
                {isResetting ? (
                  <Loader2Icon data-icon="inline-start" />
                ) : (
                  <RotateCcwIcon data-icon="inline-start" />
                )}
                Reset
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave}>
              <FieldGroup>
                <Field orientation="horizontal">
                  <Checkbox
                    checked={useCustomKey}
                    id="use-custom-openrouter-key"
                    onCheckedChange={(checked) =>
                      setUseCustomKey(Boolean(checked))
                    }
                  />
                  <FieldContent>
                    <FieldLabel htmlFor="use-custom-openrouter-key">
                      Use my OpenRouter key
                    </FieldLabel>
                    <FieldDescription>
                      When disabled, runs use the server environment key.
                    </FieldDescription>
                  </FieldContent>
                </Field>

                <Field data-disabled={!useCustomKey}>
                  <FieldLabel htmlFor="openrouter-api-key">
                    OpenRouter API key
                  </FieldLabel>
                  <Input
                    autoComplete="off"
                    disabled={!useCustomKey || isSaving}
                    id="openrouter-api-key"
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder={
                      settingsHasCustomKey(settings)
                        ? "Leave blank to keep saved key"
                        : "sk-or-v1-..."
                    }
                    type="password"
                    value={apiKey}
                  />
                  <FieldDescription>
                    {settingsHasCustomKey(settings)
                      ? "A custom key is saved for this account."
                      : "The saved key is encrypted before storage."}
                  </FieldDescription>
                </Field>

                <Separator />

                <ModelField
                  id="openrouter-openai-model"
                  isDisabled={isSaving}
                  label="Primary model"
                  models={models}
                  onChange={setOpenaiModel}
                  value={openaiModel}
                />
                <ModelField
                  id="openrouter-gemini-model"
                  isDisabled={isSaving}
                  label="Comparison model"
                  models={models}
                  onChange={setGeminiModel}
                  value={geminiModel}
                />
                <ModelField
                  id="openrouter-evaluator-model"
                  isDisabled={isSaving}
                  label="Evaluator model"
                  models={models}
                  onChange={setEvaluatorModel}
                  value={evaluatorModel}
                />

                {error ? (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}

                {message ? (
                  <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
                    {message}
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button disabled={isSaving || isTesting} type="submit">
                    {isSaving ? (
                      <Loader2Icon data-icon="inline-start" />
                    ) : (
                      <SaveIcon data-icon="inline-start" />
                    )}
                    Save Settings
                  </Button>
                  <Button
                    disabled={isSaving || isTesting}
                    onClick={handleTest}
                    type="button"
                    variant="outline"
                  >
                    {isTesting ? (
                      <Loader2Icon
                        data-icon="inline-start"
                        className="animate-spin"
                      />
                    ) : (
                      <TestTube2Icon data-icon="inline-start" />
                    )}
                    Test Connection
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Runtime selection</CardTitle>
            <CardDescription>
              {isLoadingModels
                ? "Loading OpenRouter models"
                : `${models.length} text models available`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid gap-3 md:grid-cols-3">
              {selectedModels.map((model) => (
                <div
                  className="rounded-lg border bg-muted/20 p-3"
                  key={model.label}
                >
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <ServerIcon />
                    {model.label}
                  </div>
                  <div className="break-all text-sm text-muted-foreground">
                    {model.modelId}
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="grid gap-3 md:grid-cols-2">
              <DefaultValue label="Environment key">
                {settings.defaults.apiKeyConfigured ? "Configured" : "Missing"}
              </DefaultValue>
              <DefaultValue label="Default primary">
                {settings.defaults.openaiModel}
              </DefaultValue>
              <DefaultValue label="Default comparison">
                {settings.defaults.geminiModel}
              </DefaultValue>
              <DefaultValue label="Default evaluator">
                {settings.defaults.evaluatorModel}
              </DefaultValue>
            </div>
          </CardContent>
        </Card>
      </div>

      <datalist id={modelDatalistId}>
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
            {model.isFree ? " (free)" : ""}
          </option>
        ))}
      </datalist>
    </div>
  );
}

function ModelField({
  id,
  isDisabled,
  label,
  models,
  onChange,
  value,
}: {
  id: string;
  isDisabled: boolean;
  label: string;
  models: ModelOption[];
  onChange: (value: string) => void;
  value: string;
}) {
  const model = models.find((candidate) => candidate.id === value);

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        disabled={isDisabled}
        id={id}
        list={modelDatalistId}
        onChange={(event) => onChange(event.target.value)}
        placeholder="provider/model"
        value={value}
      />
      <FieldDescription>
        {model
          ? `${model.name}${model.isFree ? " (free)" : ""}`
          : "Enter any OpenRouter model id."}
      </FieldDescription>
    </Field>
  );
}

function DefaultValue({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <Field>
      <FieldTitle>{label}</FieldTitle>
      <div className="break-all rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
        {children}
      </div>
    </Field>
  );
}

function settingsHasCustomKey(settings: OpenRouterSettingsView) {
  return settings.apiKeySource === "custom";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}

function getTestSuccessMessage(data: TestResponse) {
  const limit =
    typeof data.limitRemaining === "number"
      ? ` ${data.limitRemaining.toLocaleString()} credits remaining.`
      : "";

  return `OpenRouter key is valid.${limit}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

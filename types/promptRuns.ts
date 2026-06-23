export type ModelProvider = "openai" | "gemini";

export type PromptRunStatus = "pending" | "running" | "completed" | "failed";

export type PromptRunResultStatus =
  | "pending"
  | "running"
  | "success"
  | "error";

export type MentionSentiment =
  | "positive"
  | "neutral"
  | "negative"
  | "unknown";

export type HighlightRange = {
  start: number;
  end: number;
  text: string;
};

export type UsageMetadata = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  raw?: unknown;
};

export type PromptRunResult = {
  id: string;
  runId: string;
  modelProvider: ModelProvider;
  modelId: string;
  status: PromptRunResultStatus;
  rawResponse: string;
  errorMessage: string | null;
  brandMentioned: boolean;
  brandCited: boolean;
  sentiment: MentionSentiment;
  mentionHighlights: HighlightRange[];
  citationEvidence: string[];
  usageMetadata?: UsageMetadata;
  createdAt: string;
};

export type PromptRun = {
  id: string;
  scheduleId: string | null;
  prompt: string;
  brand: string;
  brandDomain: string | null;
  status: PromptRunStatus;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  results: PromptRunResult[];
};

export type PromptRunListResponse = {
  runs: PromptRun[];
};

export type PromptRunResponse = {
  run: PromptRun;
};

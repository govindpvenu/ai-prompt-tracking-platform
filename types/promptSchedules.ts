import type { PromptRun } from "@/types/promptRuns";

export type PromptScheduleCadence = "daily" | "weekly";

export type PromptScheduleStatus = "active" | "paused";

export type PromptScheduleChange = {
  mentionedDelta: number;
  citedDelta: number;
  newMentions: string[];
  lostMentions: string[];
  sentimentChanges: Array<{
    modelProvider: string;
    from: string;
    to: string;
  }>;
};

export type PromptSchedule = {
  id: string;
  prompt: string;
  brand: string;
  brandDomain: string | null;
  cadence: PromptScheduleCadence;
  status: PromptScheduleStatus;
  nextRunAt: string;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
  recentRuns: PromptRun[];
  change: PromptScheduleChange | null;
};

export type PromptScheduleListResponse = {
  schedules: PromptSchedule[];
};

export type PromptScheduleResponse = {
  schedule: PromptSchedule;
};

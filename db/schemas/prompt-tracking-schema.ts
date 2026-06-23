import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

export const modelProviderEnum = pgEnum("model_provider", [
  "openai",
  "gemini",
]);

export const promptRunResultStatusEnum = pgEnum("prompt_run_result_status", [
  "pending",
  "running",
  "success",
  "error",
]);

export const promptRunStatusEnum = pgEnum("prompt_run_status", [
  "pending",
  "running",
  "completed",
  "failed",
]);

export const promptScheduleCadenceEnum = pgEnum("prompt_schedule_cadence", [
  "daily",
  "weekly",
]);

export const promptScheduleStatusEnum = pgEnum("prompt_schedule_status", [
  "active",
  "paused",
]);

export const sentimentEnum = pgEnum("mention_sentiment", [
  "positive",
  "neutral",
  "negative",
  "unknown",
]);

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

export const promptSchedules = pgTable(
  "prompt_schedules",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    brand: text("brand").notNull(),
    brandDomain: text("brand_domain"),
    cadence: promptScheduleCadenceEnum("cadence").notNull(),
    status: promptScheduleStatusEnum("status").default("active").notNull(),
    nextRunAt: timestamp("next_run_at").notNull(),
    lastRunAt: timestamp("last_run_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("prompt_schedules_user_status_next_idx").on(
      table.userId,
      table.status,
      table.nextRunAt,
    ),
    index("prompt_schedules_user_created_idx").on(table.userId, table.createdAt),
  ],
);

export const promptRuns = pgTable(
  "prompt_runs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    scheduleId: text("schedule_id").references(() => promptSchedules.id, {
      onDelete: "set null",
    }),
    prompt: text("prompt").notNull(),
    brand: text("brand").notNull(),
    brandDomain: text("brand_domain"),
    status: promptRunStatusEnum("status").default("completed").notNull(),
    scheduledAt: timestamp("scheduled_at"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("prompt_runs_user_created_idx").on(table.userId, table.createdAt),
    index("prompt_runs_brand_idx").on(table.brand),
    index("prompt_runs_schedule_created_idx").on(
      table.scheduleId,
      table.createdAt,
    ),
  ],
);

export const promptRunResults = pgTable(
  "prompt_run_results",
  {
    id: text("id").primaryKey(),
    runId: text("run_id")
      .notNull()
      .references(() => promptRuns.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    modelProvider: modelProviderEnum("model_provider").notNull(),
    modelId: text("model_id").notNull(),
    status: promptRunResultStatusEnum("status").notNull(),
    rawResponse: text("raw_response").notNull().default(""),
    errorMessage: text("error_message"),
    brandMentioned: boolean("brand_mentioned").default(false).notNull(),
    brandCited: boolean("brand_cited").default(false).notNull(),
    sentiment: sentimentEnum("sentiment").default("unknown").notNull(),
    mentionHighlights:
      jsonb("mention_highlights").$type<HighlightRange[]>().default([]),
    citationEvidence:
      jsonb("citation_evidence").$type<string[]>().default([]),
    usageMetadata: jsonb("usage_metadata").$type<UsageMetadata>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("prompt_run_results_run_idx").on(table.runId),
    index("prompt_run_results_user_model_idx").on(
      table.userId,
      table.modelProvider,
    ),
    index("prompt_run_results_user_mentioned_idx").on(
      table.userId,
      table.brandMentioned,
    ),
  ],
);

export const promptRunsRelations = relations(promptRuns, ({ one, many }) => ({
  user: one(user, {
    fields: [promptRuns.userId],
    references: [user.id],
  }),
  schedule: one(promptSchedules, {
    fields: [promptRuns.scheduleId],
    references: [promptSchedules.id],
  }),
  results: many(promptRunResults),
}));

export const promptSchedulesRelations = relations(
  promptSchedules,
  ({ one, many }) => ({
    user: one(user, {
      fields: [promptSchedules.userId],
      references: [user.id],
    }),
    runs: many(promptRuns),
  }),
);

export const promptRunResultsRelations = relations(
  promptRunResults,
  ({ one }) => ({
    run: one(promptRuns, {
      fields: [promptRunResults.runId],
      references: [promptRuns.id],
    }),
    user: one(user, {
      fields: [promptRunResults.userId],
      references: [user.id],
    }),
  }),
);

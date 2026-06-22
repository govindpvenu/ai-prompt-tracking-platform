"use client";

import type * as React from "react";

import { MessageResponse } from "@/components/ai-elements/message";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type {
  HighlightRange,
  MentionSentiment,
  ModelProvider,
  PromptRun,
  PromptRunResult,
  PromptRunResultStatus,
} from "@/types/promptRuns";

export function ModelResultCard({ result }: { result: PromptRunResult }) {
  return (
    <Card className="min-h-[360px]">
      <CardHeader className="border-b">
        <CardTitle className="flex min-w-0 items-center gap-2">
          <span>{formatModelProvider(result.modelProvider)}</span>
          <StatusBadge status={result.status} />
        </CardTitle>
        <CardDescription className="truncate">{result.modelId}</CardDescription>
        <CardAction>
          <SentimentBadge sentiment={result.sentiment} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <BooleanBadge
            active={result.brandMentioned}
            activeLabel="Mentioned"
            inactiveLabel="No mention"
          />
          <BooleanBadge
            active={result.brandCited}
            activeLabel="Cited"
            inactiveLabel="No citation"
          />
        </div>

        {result.errorMessage ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {result.errorMessage}
          </div>
        ) : null}

        {result.rawResponse ? (
          <MessageResponse className="text-sm leading-6">
            {result.rawResponse}
          </MessageResponse>
        ) : (
          <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            No response captured.
          </div>
        )}

        {result.citationEvidence.length > 0 ? (
          <>
            <Separator />
            <div className="flex flex-col gap-2">
              <div className="text-xs font-medium uppercase text-muted-foreground">
                Citation evidence
              </div>
              <ul className="flex flex-col gap-1 text-sm">
                {result.citationEvidence.map((evidence) => (
                  <li className="break-words" key={evidence}>
                    {evidence}
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function RunSummary({
  run,
  active,
  onSelect,
}: {
  run: PromptRun;
  active?: boolean;
  onSelect?: (run: PromptRun) => void;
}) {
  const mentionedCount = run.results.filter((result) => result.brandMentioned)
    .length;
  const citedCount = run.results.filter((result) => result.brandCited).length;

  return (
    <button
      className={cn(
        "flex w-full flex-col gap-2 rounded-lg border bg-background p-3 text-left text-sm transition-colors hover:bg-muted/60",
        active && "border-primary bg-muted",
      )}
      onClick={() => onSelect?.(run)}
      type="button"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{run.brand}</span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatDateTime(run.createdAt)}
        </span>
      </div>
      <p className="line-clamp-2 text-muted-foreground">{run.prompt}</p>
      <div className="flex flex-wrap gap-1.5">
        <Badge variant={mentionedCount > 0 ? "secondary" : "outline"}>
          {mentionedCount}/2 mentioned
        </Badge>
        <Badge variant={citedCount > 0 ? "secondary" : "outline"}>
          {citedCount}/2 cited
        </Badge>
      </div>
    </button>
  );
}

export function HighlightedText({
  text,
  highlights,
}: {
  text: string;
  highlights: HighlightRange[];
}) {
  if (highlights.length === 0) {
    return <div className="whitespace-pre-wrap break-words">{text}</div>;
  }

  const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start);
  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const highlight of sortedHighlights) {
    if (highlight.start > cursor) {
      parts.push(text.slice(cursor, highlight.start));
    }

    parts.push(
      <mark
        className="rounded bg-primary/10 px-0.5 font-medium text-foreground ring-1 ring-primary/15"
        key={`${highlight.start}-${highlight.end}`}
      >
        {text.slice(highlight.start, highlight.end)}
      </mark>,
    );
    cursor = highlight.end;
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return <div className="whitespace-pre-wrap break-words">{parts}</div>;
}

export function TrackingBadges({ run }: { run: PromptRun }) {
  const hasMention = run.results.some((result) => result.brandMentioned);
  const hasCitation = run.results.some((result) => result.brandCited);

  return (
    <div className="flex flex-wrap gap-2">
      <BooleanBadge
        active={hasMention}
        activeLabel="Brand mentioned"
        inactiveLabel="No brand mention"
      />
      <BooleanBadge
        active={hasCitation}
        activeLabel="Brand cited"
        inactiveLabel="No brand citation"
      />
    </div>
  );
}

export function StatusBadge({ status }: { status: PromptRunResultStatus }) {
  return (
    <Badge variant={status === "success" ? "secondary" : "destructive"}>
      {status === "success" ? "Complete" : "Error"}
    </Badge>
  );
}

export function SentimentBadge({
  sentiment,
}: {
  sentiment: MentionSentiment;
}) {
  const variant =
    sentiment === "negative"
      ? "destructive"
      : sentiment === "unknown"
        ? "outline"
        : "secondary";

  return <Badge variant={variant}>{formatSentiment(sentiment)}</Badge>;
}

export function BooleanBadge({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <Badge variant={active ? "secondary" : "outline"}>
      {active ? activeLabel : inactiveLabel}
    </Badge>
  );
}

export function formatModelProvider(provider: ModelProvider) {
  return provider === "openai" ? "OpenAI" : "Gemini";
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatSentiment(sentiment: MentionSentiment) {
  return sentiment.charAt(0).toUpperCase() + sentiment.slice(1);
}

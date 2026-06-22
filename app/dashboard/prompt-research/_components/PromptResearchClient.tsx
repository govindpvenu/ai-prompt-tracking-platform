"use client";

import Link from "next/link";
import type * as React from "react";
import { useCallback, useEffect, useState } from "react";
import {
  HistoryIcon,
  PanelRightOpenIcon,
  RefreshCcwIcon,
  SendIcon,
} from "lucide-react";

import {
  ModelResultCard,
  RunSummary,
  TrackingBadges,
  formatDateTime,
} from "@/components/prompt-runs/run-result-card";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type {
  PromptRun,
  PromptRunListResponse,
  PromptRunResponse,
} from "@/types/promptRuns";

export function PromptResearchClient() {
  const [prompt, setPrompt] = useState("");
  const [brand, setBrand] = useState("");
  const [brandDomain, setBrandDomain] = useState("");
  const [currentRun, setCurrentRun] = useState<PromptRun | null>(null);
  const [recentRuns, setRecentRuns] = useState<PromptRun[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecentRuns = useCallback(async () => {
    setIsLoadingRecent(true);

    try {
      const response = await fetch("/api/prompt-runs?limit=12");

      if (!response.ok) {
        throw new Error("Could not load recent runs.");
      }

      const data = (await response.json()) as PromptRunListResponse;
      setRecentRuns(data.runs);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoadingRecent(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadRecentRuns();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadRecentRuns]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/prompt-runs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          brand,
          brandDomain: brandDomain || null,
        }),
      });
      const data = (await response.json()) as Partial<PromptRunResponse> & {
        error?: string;
      };

      if (!response.ok || !data.run) {
        throw new Error(data.error ?? "Prompt run failed.");
      }

      const run = data.run;
      setCurrentRun(run);
      setRecentRuns((runs) => [
        run,
        ...runs.filter((recentRun) => recentRun.id !== run.id),
      ]);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSelectRun(run: PromptRun) {
    setError(null);

    try {
      const response = await fetch(`/api/prompt-runs/${run.id}`);

      if (!response.ok) {
        throw new Error("Could not load that run.");
      }

      const data = (await response.json()) as PromptRunResponse;
      setCurrentRun(data.run);
    } catch (selectError) {
      setError(getErrorMessage(selectError));
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-[720px] overflow-hidden border-t">
      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-normal">
                Prompt Research
              </h1>
              <p className="text-sm text-muted-foreground">
                Run one prompt against OpenAI and Gemini, then track brand
                mentions, citations, and sentiment.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                <Link href="/dashboard/history">
                  <HistoryIcon data-icon="inline-start" />
                  History
                </Link>
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button className="xl:hidden" variant="outline">
                    <PanelRightOpenIcon data-icon="inline-start" />
                    Recent
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[22rem]">
                  <SheetHeader>
                    <SheetTitle>Recent runs</SheetTitle>
                  </SheetHeader>
                  <RecentRunsPanel
                    activeRunId={currentRun?.id}
                    isLoading={isLoadingRecent}
                    onRefresh={loadRecentRuns}
                    onSelectRun={handleSelectRun}
                    runs={recentRuns}
                  />
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {isSubmitting ? <RunningState /> : null}

          {!isSubmitting && currentRun ? (
            <RunDetail run={currentRun} />
          ) : null}

          {!isSubmitting && !currentRun ? <EmptyState /> : null}
        </div>

        <form
          className="border-t bg-background p-4 md:p-5"
          onSubmit={handleSubmit}
        >
          <FieldGroup className="gap-3">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <Field>
                <FieldLabel htmlFor="brand">Brand or keyword</FieldLabel>
                <Input
                  id="brand"
                  onChange={(event) => setBrand(event.target.value)}
                  placeholder="OpenAI"
                  required
                  value={brand}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="brandDomain">Brand domain</FieldLabel>
                <Input
                  id="brandDomain"
                  onChange={(event) => setBrandDomain(event.target.value)}
                  placeholder="openai.com"
                  value={brandDomain}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="prompt">Prompt</FieldLabel>
              <Textarea
                className="min-h-24"
                id="prompt"
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Which companies are leading in AI coding assistants?"
                required
                value={prompt}
              />
              <FieldDescription>
                The same prompt runs against both models in parallel.
              </FieldDescription>
            </Field>
            <div className="flex justify-end">
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? <Spinner data-icon="inline-start" /> : (
                  <SendIcon data-icon="inline-start" />
                )}
                {isSubmitting ? "Running" : "Run prompt"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </section>

      <aside className="hidden w-[22rem] shrink-0 border-l xl:flex">
        <RecentRunsPanel
          activeRunId={currentRun?.id}
          isLoading={isLoadingRecent}
          onRefresh={loadRecentRuns}
          onSelectRun={handleSelectRun}
          runs={recentRuns}
        />
      </aside>
    </div>
  );
}

function RunDetail({ run }: { run: PromptRun }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium">{run.brand}</div>
            <div className="text-xs text-muted-foreground">
              {formatDateTime(run.createdAt)}
              {run.brandDomain ? ` · ${run.brandDomain}` : ""}
            </div>
          </div>
          <TrackingBadges run={run} />
        </div>
        <p className="whitespace-pre-wrap break-words text-sm">{run.prompt}</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {run.results.map((result) => (
          <ModelResultCard key={result.id} result={result} />
        ))}
      </div>
    </div>
  );
}

function RunningState() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Skeleton className="h-[360px]" />
      <Skeleton className="h-[360px]" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <div className="flex max-w-md flex-col gap-2">
        <h2 className="text-lg font-medium">Run your first tracked prompt</h2>
        <p className="text-sm text-muted-foreground">
          Add a brand and prompt below to compare model responses and save the
          results to history.
        </p>
      </div>
    </div>
  );
}

function RecentRunsPanel({
  runs,
  activeRunId,
  isLoading,
  onRefresh,
  onSelectRun,
}: {
  runs: PromptRun[];
  activeRunId?: string;
  isLoading: boolean;
  onRefresh: () => void;
  onSelectRun: (run: PromptRun) => void;
}) {
  return (
    <div className="flex h-full w-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium">Recent runs</div>
        <Button onClick={onRefresh} size="icon-sm" type="button" variant="ghost">
          <RefreshCcwIcon />
          <span className="sr-only">Refresh recent runs</span>
        </Button>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {isLoading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : null}

        {!isLoading && runs.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No prompt runs yet.
          </div>
        ) : null}

        {!isLoading
          ? runs.map((run) => (
              <RunSummary
                active={run.id === activeRunId}
                key={run.id}
                onSelect={onSelectRun}
                run={run}
              />
            ))
          : null}
      </div>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

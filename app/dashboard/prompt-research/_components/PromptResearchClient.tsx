"use client";

import Link from "next/link";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import {
  BotIcon,
  GlobeIcon,
  HistoryIcon,
  MessageSquareTextIcon,
  PanelRightOpenIcon,
  RefreshCcwIcon,
  SearchCheckIcon,
  SendIcon,
  SparklesIcon,
} from "lucide-react";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
  ModelResultCard,
  RunSummary,
  TrackingBadges,
  formatDateTime,
} from "@/components/prompt-runs/run-result-card";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  PromptRun,
  PromptRunListResponse,
  PromptRunResponse,
} from "@/types/promptRuns";

export function PromptResearchClient() {
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

  async function handleSubmit(message: PromptInputMessage) {
    const nextPrompt = message.text.trim();

    if (!nextPrompt) {
      setError("Enter a prompt before running research.");
      throw new Error("Prompt is required.");
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/prompt-runs", {
        body: JSON.stringify({
          brand,
          brandDomain: brandDomain || null,
          prompt: nextPrompt,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
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
      throw submitError;
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
    <div className="flex h-[calc(100vh-4rem)] min-h-[720px] overflow-hidden border-t bg-background">
      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col ">
          {error ? (
            <div className="mx-3 mt-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive md:mx-4">
              {error}
            </div>
          ) : null}

          <Conversation className="min-h-0 flex-1">
            <ConversationContent className="h-full w-full gap-4 p-3 md:p-4">
              {isSubmitting ? <RunningState brand={brand} /> : null}

              {!isSubmitting && currentRun ? (
                <RunDetail run={currentRun} />
              ) : null}

              {!isSubmitting && !currentRun ? <EmptyState /> : null}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </div>

        <div className="border-t flex justify-center  p-2 shadow-[0_-12px_30px_rgba(0,0,0,0.04)] md:p-4">
          <div className="flex  w-full max-w-4xl flex-col gap-3">
            <FieldGroup className="gap-3">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <Field>
                  <FieldLabel htmlFor="brand">Brand or keyword</FieldLabel>
                  <div className="relative">
                    <SearchCheckIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 " />
                    <Input
                      className="pl-9"
                      disabled={isSubmitting}
                      id="brand"
                      onChange={(event) => setBrand(event.target.value)}
                      placeholder="OpenAI"
                      required
                      value={brand}
                    />
                  </div>
                </Field>
                <Field>
                  <FieldLabel htmlFor="brandDomain">Brand domain</FieldLabel>
                  <div className="relative">
                    <GlobeIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 " />
                    <Input
                      className="pl-9"
                      disabled={isSubmitting}
                      id="brandDomain"
                      onChange={(event) => setBrandDomain(event.target.value)}
                      placeholder="openai.com"
                      value={brandDomain}
                    />
                  </div>
                </Field>
              </div>
            </FieldGroup>

            <PromptInput
              className="rounded-xl    shadow-sm ring-1 ring-border"
              onSubmit={handleSubmit}
            >
              <PromptInputTextarea
                className=" px-4 py-3 text-sm leading-6 md:text-base"
                disabled={isSubmitting}
                placeholder="Which companies are leading in AI coding assistants?"
              />
              <PromptInputFooter className="border-t  p-2">
                <PromptInputTools>
                  <span className="flex items-center gap-1.5 px-2 text-primary text-xs">
                    <BotIcon data-icon="inline-start" />
                    Runs OpenAI and Gemini in parallel
                  </span>
                </PromptInputTools>
                <div className="flex items-center gap-2">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        className="text-primary"
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <PanelRightOpenIcon data-icon="inline-start" />
                        Recent
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[24rem] p-0 sm:max-w-[24rem]">
                      <SheetHeader className="border-b px-4 py-3">
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
                  <PromptInputSubmit
                    disabled={isSubmitting || !brand.trim()}
                    size="sm"
                    status={isSubmitting ? "submitted" : "ready"}
                  >
                    {isSubmitting ? null : (
                      <SendIcon data-icon="inline-start" />
                    )}
                    {isSubmitting ? "Running" : "Run"}
                  </PromptInputSubmit>
                </div>
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      </section>
    </div>
  );
}

function RunDetail({ run }: { run: PromptRun }) {
  return (
    <div className="flex flex-col gap-5">
      <Message from="user">
        <MessageContent className="rounded-xl bg-primary px-4 py-3 text-primary-foreground shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium">{run.brand}</div>
              <div className="text-xs opacity-80">
                {formatDateTime(run.createdAt)}
                {run.brandDomain ? ` · ${run.brandDomain}` : ""}
              </div>
            </div>
          </div>
          <MessageResponse className="text-primary">
            {run.prompt}
          </MessageResponse>
        </MessageContent>
      </Message>

      <div className="flex flex-wrap items-center gap-2">
        <TrackingBadges run={run} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {run.results.map((result) => (
          <ModelResultCard key={result.id} result={result} />
        ))}
      </div>
    </div>
  );
}

function RunningState({ brand }: { brand: string }) {
  return (
    <div className="flex flex-col gap-5">
      <Message from="user">
        <MessageContent className="rounded-xl bg-primary px-4 py-3 text-primary-foreground shadow-sm">
          <div className="text-sm font-medium">{brand}</div>
          <div className="text-sm ">Research request submitted</div>
        </MessageContent>
      </Message>
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-[360px] rounded-xl" />
        <Skeleton className="h-[360px] rounded-xl" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <ConversationEmptyState className="min-h-full flex-1 rounded-xl border border-dashed bg-background/80 p-0">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-10 text-center md:py-14">
        <div className="flex size-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <SparklesIcon className="size-6" />
        </div>
        <div className="flex max-w-xl flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-normal">
            Run a tracked prompt
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Add a brand and ask the question you want to audit. Each run
            compares responses, saves the evidence, and highlights mentions,
            citations, and sentiment.
          </p>
        </div>
        <div className="grid w-full gap-3 text-left md:grid-cols-3">
          <EmptyStateStep
            description="Use a product, company, category, or keyword."
            icon={<SearchCheckIcon />}
            title="Set a target"
          />
          <EmptyStateStep
            description="Ask the market question exactly as a buyer would."
            icon={<MessageSquareTextIcon />}
            title="Write the prompt"
          />
          <EmptyStateStep
            description="Compare model answers and save the research trail."
            icon={<BotIcon />}
            title="Review evidence"
          />
        </div>
      </div>
    </ConversationEmptyState>
  );
}

function EmptyStateStep({
  description,
  icon,
  title,
}: {
  description: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="flex min-h-32 flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-4">
        {icon}
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium">{title}</div>
        <p className="text-sm leading-5 text-muted-foreground">{description}</p>
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
    <div className="flex h-full w-full flex-col gap-3 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium">Recent runs</div>
        <Button
          onClick={onRefresh}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
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
      <div className="border-t pt-3">
        <Button asChild className="w-full justify-start" variant="outline">
          <Link href="/dashboard/history">
            <HistoryIcon data-icon="inline-start" />
            See Full History
          </Link>
        </Button>
      </div>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

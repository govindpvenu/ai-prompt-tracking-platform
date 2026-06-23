"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ClockIcon,
  HistoryIcon,
  Loader2Icon,
  PlayIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchCheckIcon,
  Trash2Icon,
} from "lucide-react";

import {
  BooleanBadge,
  formatDateTime,
} from "@/components/prompt-runs/run-result-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PromptRun, PromptRunResponse } from "@/types/promptRuns";

const maxBatchSize = 5;

type BatchPromptResponse = {
  runs: PromptRun[];
};

type BatchItem = {
  brand: string;
  brandDomain: string | null;
};

type BrandRow = {
  id: string;
  brand: string;
  website: string;
};

const initialBrandRows: BrandRow[] = [
  {
    id: "brand-1",
    brand: "",
    website: "",
  },
];

export function BatchPromptsClient() {
  const [prompt, setPrompt] = useState("");
  const [brandRows, setBrandRows] = useState<BrandRow[]>(initialBrandRows);
  const [runs, setRuns] = useState<PromptRun[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const items = useMemo(() => buildBatchItems(brandRows), [brandRows]);
  const validationMessage = getValidationMessage(prompt, brandRows, items);
  const hasActiveRuns = runs.some(isRunInProgress);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsHydrated(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const refreshRuns = useCallback(async (runIds: string[]) => {
    try {
      const responses = await Promise.all(
        runIds.map(async (runId) => {
          const response = await fetch(`/api/prompt-runs/${runId}`);

          if (!response.ok) {
            throw new Error("Could not refresh batch results.");
          }

          const data = (await response.json()) as PromptRunResponse;
          return data.run;
        }),
      );

      setRuns((currentRuns) =>
        currentRuns.map(
          (currentRun) =>
            responses.find((run) => run.id === currentRun.id) ?? currentRun,
        ),
      );
    } catch (refreshError) {
      setError(getErrorMessage(refreshError));
    }
  }, []);

  useEffect(() => {
    if (!hasActiveRuns) {
      return;
    }

    const activeRunIds = runs.filter(isRunInProgress).map((run) => run.id);
    const intervalId = window.setInterval(() => {
      void refreshRuns(activeRunIds);
    }, 2500);

    return () => window.clearInterval(intervalId);
  }, [hasActiveRuns, refreshRuns, runs]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/prompt-runs/batch", {
        body: JSON.stringify({
          prompt,
          items,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const data = (await response.json()) as Partial<BatchPromptResponse> & {
        error?: string;
      };

      if (!response.ok || !data.runs) {
        throw new Error(data.error ?? "Batch run failed.");
      }

      const nextRuns = data.runs;
      setRuns(nextRuns);
      window.setTimeout(() => {
        void refreshRuns(nextRuns.map((run) => run.id));
      }, 900);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setPrompt("");
    setBrandRows(initialBrandRows);
    setRuns([]);
    setError(null);
  }

  function handleAddBrandRow() {
    setBrandRows((currentRows) => {
      if (currentRows.length >= maxBatchSize) {
        return currentRows;
      }

      return [
        ...currentRows,
        {
          id: crypto.randomUUID(),
          brand: "",
          website: "",
        },
      ];
    });
  }

  function handleRemoveBrandRow(rowId: string) {
    setBrandRows((currentRows) =>
      currentRows.length <= 1
        ? currentRows
        : currentRows.filter((row) => row.id !== rowId),
    );
  }

  function handleUpdateBrandRow(
    rowId: string,
    field: "brand" | "website",
    value: string,
  ) {
    setBrandRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row,
      ),
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-5 border-t p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-normal">
            Batch Prompts
          </h1>
          <p className="text-sm text-muted-foreground">
            Run one prompt across up to five tracked brands.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/history">
            <HistoryIcon data-icon="inline-start" />
            History
          </Link>
        </Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(420px,0.85fr)_minmax(0,1.15fr)]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Batch setup</CardTitle>
            <CardDescription>
              {items.length}/{maxBatchSize} brands ready
            </CardDescription>
            <CardAction>
              <Button
                disabled={
                  isHydrated &&
                  (isSubmitting || brandRows.length >= maxBatchSize)
                }
                onClick={handleAddBrandRow}
                size="sm"
                type="button"
                variant="outline"
              >
                <PlusIcon data-icon="inline-start" />
                Add Brand
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup className="gap-4">
                <Field>
                  <FieldLabel htmlFor="batch-prompt">Prompt</FieldLabel>
                  <Textarea
                    className="min-h-36"
                    disabled={isSubmitting}
                    id="batch-prompt"
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="Which companies are leading in AI prompt monitoring?"
                    value={prompt}
                  />
                </Field>

                <Field>
                  <div className="flex items-center justify-between gap-3">
                    <FieldLabel>Brands</FieldLabel>
                    <span className="text-xs text-muted-foreground">
                      Limit {maxBatchSize}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {brandRows.map((row, index) => (
                      <BrandInputRow
                        canRemove={brandRows.length > 1}
                        disabled={isSubmitting}
                        enforceDisabled={isHydrated}
                        index={index}
                        key={row.id}
                        onRemove={handleRemoveBrandRow}
                        onUpdate={handleUpdateBrandRow}
                        row={row}
                      />
                    ))}
                  </div>
                </Field>

                <Button
                  className="w-full justify-center"
                  disabled={
                    isHydrated &&
                    (isSubmitting || brandRows.length >= maxBatchSize)
                  }
                  onClick={handleAddBrandRow}
                  type="button"
                  variant="outline"
                >
                  <PlusIcon data-icon="inline-start" />
                  Add Another Brand
                </Button>

                {brandRows.length >= maxBatchSize ? (
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                    Batch limit reached. Remove a row to add a different brand.
                  </div>
                ) : null}

                {error ? (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}

                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    disabled={isHydrated && isSubmitting}
                    onClick={handleReset}
                    type="button"
                    variant="outline"
                  >
                    <RotateCcwIcon data-icon="inline-start" />
                    Reset
                  </Button>
                  <Button
                    disabled={
                      isHydrated &&
                      (isSubmitting || Boolean(validationMessage))
                    }
                    type="submit"
                  >
                    {isSubmitting ? (
                      <Loader2Icon
                        className="animate-spin"
                        data-icon="inline-start"
                      />
                    ) : (
                      <PlayIcon data-icon="inline-start" />
                    )}
                    {isSubmitting ? "Queuing" : "Run Batch"}
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <section className="flex min-w-0 flex-col gap-4">
          <BatchSummary runs={runs} />

          {runs.length > 0 ? (
            <div className="grid gap-3">
              {runs.map((run) => (
                <BatchRunCard key={run.id} run={run} />
              ))}
            </div>
          ) : (
            <EmptyBatchState />
          )}
        </section>
      </div>
    </div>
  );
}

function BrandInputRow({
  row,
  index,
  canRemove,
  disabled,
  enforceDisabled,
  onUpdate,
  onRemove,
}: {
  row: BrandRow;
  index: number;
  canRemove: boolean;
  disabled: boolean;
  enforceDisabled: boolean;
  onUpdate: (rowId: string, field: "brand" | "website", value: string) => void;
  onRemove: (rowId: string) => void;
}) {
  const brandInputId = `batch-brand-${row.id}`;
  const websiteInputId = `batch-website-${row.id}`;

  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-medium">Brand {index + 1}</div>
        <Button
          disabled={enforceDisabled && (disabled || !canRemove)}
          onClick={() => onRemove(row.id)}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <Trash2Icon />
          <span className="sr-only">Remove brand {index + 1}</span>
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={brandInputId}>Brand name</FieldLabel>
          <Input
            disabled={disabled}
            id={brandInputId}
            onChange={(event) => onUpdate(row.id, "brand", event.target.value)}
            placeholder="Enter brand name"
            value={row.brand}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={websiteInputId}>Website</FieldLabel>
          <Input
            disabled={disabled}
            id={websiteInputId}
            onChange={(event) =>
              onUpdate(row.id, "website", event.target.value)
            }
            placeholder="Enter website"
            value={row.website}
          />
        </Field>
      </div>
    </div>
  );
}

function BatchSummary({ runs }: { runs: PromptRun[] }) {
  const completed = runs.filter((run) => run.status === "completed").length;
  const active = runs.filter(isRunInProgress).length;
  const failed = runs.filter((run) => run.status === "failed").length;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <SummaryCard label="Queued runs" value={runs.length.toString()} />
      <SummaryCard label="Active" value={active.toString()} />
      <SummaryCard
        label="Finished"
        value={`${completed}${failed ? ` / ${failed} failed` : ""}`}
      />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function BatchRunCard({ run }: { run: PromptRun }) {
  const completedResults = run.results.filter(
    (result) => result.status === "success" || result.status === "error",
  ).length;
  const mentionedCount = run.results.filter(
    (result) => result.brandMentioned,
  ).length;
  const citedCount = run.results.filter((result) => result.brandCited).length;
  const totalResults = Math.max(run.results.length, 1);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex min-w-0 items-center gap-2">
          <RunStatusIcon run={run} />
          <span className="truncate">{run.brand}</span>
        </CardTitle>
        <CardDescription>
          {formatDateTime(run.createdAt)}
          {run.brandDomain ? ` · ${run.brandDomain}` : ""}
        </CardDescription>
        <CardAction>
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/history">
              <SearchCheckIcon data-icon="inline-start" />
              History
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {run.prompt}
        </p>
        <div className="flex flex-wrap gap-2">
          <BooleanBadge
            active={mentionedCount > 0}
            activeLabel={`${mentionedCount}/${totalResults} mentioned`}
            inactiveLabel={`0/${totalResults} mentioned`}
          />
          <BooleanBadge
            active={citedCount > 0}
            activeLabel={`${citedCount}/${totalResults} cited`}
            inactiveLabel={`0/${totalResults} cited`}
          />
          <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
            {completedResults}/{totalResults} models finished
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function RunStatusIcon({ run }: { run: PromptRun }) {
  if (run.status === "completed") {
    return <CheckCircle2Icon className="size-4 text-primary" />;
  }

  if (run.status === "failed") {
    return <AlertCircleIcon className="size-4 text-destructive" />;
  }

  if (run.status === "running") {
    return <Loader2Icon className="size-4 animate-spin text-primary" />;
  }

  return <ClockIcon className="size-4 text-muted-foreground" />;
}

function EmptyBatchState() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed bg-background/80 p-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <SearchCheckIcon className="size-5" />
      </div>
      <div className="mt-4 max-w-md">
        <div className="font-medium">No batch queued</div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Submitted runs will appear here with live background status.
        </p>
      </div>
    </div>
  );
}

function buildBatchItems(rows: BrandRow[]): BatchItem[] {
  const seen = new Set<string>();
  const items: BatchItem[] = [];

  for (const row of rows) {
    const brand = row.brand.trim();

    if (!brand) {
      continue;
    }

    const key = brand.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    items.push({
      brand,
      brandDomain: row.website.trim() || null,
    });
  }

  return items;
}

function getValidationMessage(
  prompt: string,
  rows: BrandRow[],
  items: BatchItem[],
) {
  if (!prompt.trim()) {
    return "Enter a prompt before running a batch.";
  }

  if (items.length === 0) {
    return "Add at least one brand name.";
  }

  if (rows.length > maxBatchSize || items.length > maxBatchSize) {
    return `Batch size is limited to ${maxBatchSize} brands.`;
  }

  return null;
}

function isRunInProgress(run: PromptRun) {
  return run.status === "pending" || run.status === "running";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

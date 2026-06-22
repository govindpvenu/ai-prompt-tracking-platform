"use client";

import type * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { FilterIcon, RotateCcwIcon, SearchIcon } from "lucide-react";

import {
  BooleanBadge,
  ModelResultCard,
  formatDateTime,
  formatModelProvider,
} from "@/components/prompt-runs/run-result-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type {
  PromptRun,
  PromptRunListResponse,
  PromptRunResponse,
} from "@/types/promptRuns";

type HistoryFilters = {
  brand: string;
  model: "all" | "openai" | "gemini";
  mention: "all" | "mentioned" | "not-mentioned";
  from: string;
  to: string;
};

const defaultFilters: HistoryFilters = {
  brand: "",
  model: "all",
  mention: "all",
  from: "",
  to: "",
};

export function HistoryClient() {
  const [filters, setFilters] = useState<HistoryFilters>(defaultFilters);
  const [runs, setRuns] = useState<PromptRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<PromptRun | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRuns = useCallback(async (nextFilters: HistoryFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/prompt-runs?${toQuery(nextFilters)}`);

      if (!response.ok) {
        throw new Error("Could not load prompt history.");
      }

      const data = (await response.json()) as PromptRunListResponse;
      setRuns(data.runs);
      setSelectedRun((current) =>
        current && data.runs.some((run) => run.id === current.id)
          ? current
          : null,
      );
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadRuns(defaultFilters);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadRuns]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadRuns(filters);
  }

  async function handleReset() {
    setFilters(defaultFilters);
    await loadRuns(defaultFilters);
  }

  async function handleSelectRun(run: PromptRun) {
    setIsLoadingDetail(true);
    setError(null);

    try {
      const response = await fetch(`/api/prompt-runs/${run.id}`);

      if (!response.ok) {
        throw new Error("Could not load run details.");
      }

      const data = (await response.json()) as PromptRunResponse;
      setSelectedRun(data.run);
    } catch (selectError) {
      setError(getErrorMessage(selectError));
    } finally {
      setIsLoadingDetail(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-5 border-t p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-normal">History</h1>
          <p className="text-sm text-muted-foreground">
            Browse saved prompt runs and filter by date, brand, model, or
            mention status.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <FilterIcon data-icon="inline-start" />
            Filters
          </CardTitle>
          <CardDescription>
            Filters apply to model result rows. Open a row to view the full run.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup className="gap-3">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <Field>
                  <FieldLabel htmlFor="brand">Brand</FieldLabel>
                  <Input
                    id="brand"
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        brand: event.target.value,
                      }))
                    }
                    placeholder="OpenAI"
                    value={filters.brand}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="model">Model</FieldLabel>
                  <NativeSelect
                    id="model"
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        model: event.target.value as HistoryFilters["model"],
                      }))
                    }
                    value={filters.model}
                  >
                    <option value="all">All models</option>
                    <option value="openai">OpenAI</option>
                    <option value="gemini">Gemini</option>
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="mention">Mention</FieldLabel>
                  <NativeSelect
                    id="mention"
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        mention: event.target
                          .value as HistoryFilters["mention"],
                      }))
                    }
                    value={filters.mention}
                  >
                    <option value="all">All statuses</option>
                    <option value="mentioned">Mentioned</option>
                    <option value="not-mentioned">Not mentioned</option>
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="from">From</FieldLabel>
                  <Input
                    id="from"
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        from: event.target.value,
                      }))
                    }
                    type="date"
                    value={filters.from}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="to">To</FieldLabel>
                  <Input
                    id="to"
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        to: event.target.value,
                      }))
                    }
                    type="date"
                    value={filters.to}
                  />
                </Field>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button onClick={handleReset} type="button" variant="outline">
                  <RotateCcwIcon data-icon="inline-start" />
                  Reset
                </Button>
                <Button type="submit">
                  <SearchIcon data-icon="inline-start" />
                  Apply filters
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.7fr)]">
        <HistoryTable
          isLoading={isLoading}
          onSelectRun={handleSelectRun}
          runs={runs}
          selectedRunId={selectedRun?.id}
        />
        <HistoryDetail isLoading={isLoadingDetail} run={selectedRun} />
      </div>
    </div>
  );
}

function HistoryTable({
  runs,
  selectedRunId,
  isLoading,
  onSelectRun,
}: {
  runs: PromptRun[];
  selectedRunId?: string;
  isLoading: boolean;
  onSelectRun: (run: PromptRun) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No prompt runs match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/70 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Brand</th>
              <th className="px-3 py-2 font-medium">Prompt</th>
              <th className="px-3 py-2 font-medium">Models</th>
              <th className="px-3 py-2 font-medium">Tracking</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr
                className={cn(
                  "bg-background hover:bg-muted/60",
                  run.id === selectedRunId && "bg-muted",
                )}
                key={run.id}
              >
                <td className="whitespace-nowrap px-3 py-3 align-top text-muted-foreground">
                  {formatDateTime(run.createdAt)}
                </td>
                <td className="px-3 py-3 align-top font-medium">
                  <button
                    className="text-left hover:underline"
                    onClick={() => onSelectRun(run)}
                    type="button"
                  >
                    {run.brand}
                  </button>
                  {run.brandDomain ? (
                    <div className="text-xs font-normal text-muted-foreground">
                      {run.brandDomain}
                    </div>
                  ) : null}
                </td>
                <td className="max-w-[22rem] px-3 py-3 align-top text-muted-foreground">
                  <button
                    className="line-clamp-2 text-left hover:text-foreground"
                    onClick={() => onSelectRun(run)}
                    type="button"
                  >
                    {run.prompt}
                  </button>
                </td>
                <td className="px-3 py-3 align-top">
                  <div className="flex flex-col gap-1">
                    {run.results.map((result) => (
                      <span key={result.id}>
                        {formatModelProvider(result.modelProvider)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-3 align-top">
                  <div className="flex flex-wrap gap-1.5">
                    <BooleanBadge
                      active={run.results.some((result) => result.brandMentioned)}
                      activeLabel="Mentioned"
                      inactiveLabel="No mention"
                    />
                    <BooleanBadge
                      active={run.results.some((result) => result.brandCited)}
                      activeLabel="Cited"
                      inactiveLabel="No citation"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HistoryDetail({
  run,
  isLoading,
}: {
  run: PromptRun | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <Skeleton className="min-h-[420px]" />;
  }

  if (!run) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Select a prompt run to inspect both model responses.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex flex-col gap-1">
          <div className="font-medium">{run.brand}</div>
          <div className="text-xs text-muted-foreground">
            {formatDateTime(run.createdAt)}
            {run.brandDomain ? ` · ${run.brandDomain}` : ""}
          </div>
        </div>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm">
          {run.prompt}
        </p>
      </div>
      {run.results.map((result) => (
        <ModelResultCard key={result.id} result={result} />
      ))}
    </div>
  );
}

function toQuery(filters: HistoryFilters) {
  const params = new URLSearchParams({ limit: "80" });

  if (filters.brand.trim()) {
    params.set("brand", filters.brand.trim());
  }

  if (filters.model !== "all") {
    params.set("model", filters.model);
  }

  if (filters.mention !== "all") {
    params.set("mention", filters.mention);
  }

  if (filters.from) {
    params.set("from", filters.from);
  }

  if (filters.to) {
    params.set("to", filters.to);
  }

  return params.toString();
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

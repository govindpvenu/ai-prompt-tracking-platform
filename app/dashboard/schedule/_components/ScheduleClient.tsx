"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircleIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  HistoryIcon,
  Loader2Icon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  RefreshCcwIcon,
  Trash2Icon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";

import {
  BooleanBadge,
  RunSummary,
  formatDateTime,
  formatModelProvider,
} from "@/components/prompt-runs/run-result-card";
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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { PromptRun } from "@/types/promptRuns";
import type {
  PromptSchedule,
  PromptScheduleCadence,
  PromptScheduleListResponse,
  PromptScheduleResponse,
} from "@/types/promptSchedules";

type ScheduleClientProps = {
  initialSchedules: PromptSchedule[];
};

type ScheduleFormState = {
  prompt: string;
  brand: string;
  brandDomain: string;
  cadence: PromptScheduleCadence;
  nextRunAt: string;
};

const initialFormState: ScheduleFormState = {
  prompt: "",
  brand: "",
  brandDomain: "",
  cadence: "daily",
  nextRunAt: "",
};

export function ScheduleClient({ initialSchedules }: ScheduleClientProps) {
  const [form, setForm] = useState<ScheduleFormState>(initialFormState);
  const [schedules, setSchedules] = useState(initialSchedules);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validationMessage = getValidationMessage(form);
  const hasActiveRuns = schedules.some((schedule) =>
    schedule.recentRuns.some(isRunInProgress),
  );

  const summary = useMemo(() => getScheduleSummary(schedules), [schedules]);

  const loadSchedules = useCallback(async () => {
    try {
      const response = await fetch("/api/prompt-schedules");

      if (!response.ok) {
        throw new Error("Could not refresh schedules.");
      }

      const data = (await response.json()) as PromptScheduleListResponse;
      setSchedules(data.schedules);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    }
  }, []);

  useEffect(() => {
    if (!hasActiveRuns) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadSchedules();
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [hasActiveRuns, loadSchedules]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/prompt-schedules", {
        body: JSON.stringify({
          prompt: form.prompt,
          brand: form.brand,
          brandDomain: form.brandDomain || null,
          cadence: form.cadence,
          nextRunAt: form.nextRunAt
            ? new Date(form.nextRunAt).toISOString()
            : null,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const data = (await response.json()) as Partial<PromptScheduleResponse> & {
        error?: string;
      };

      if (!response.ok || !data.schedule) {
        throw new Error(data.error ?? "Could not create schedule.");
      }

      setSchedules((currentSchedules) => [data.schedule!, ...currentSchedules]);
      setForm(initialFormState);
      window.setTimeout(() => {
        void loadSchedules();
      }, 1200);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusChange(schedule: PromptSchedule) {
    const nextStatus = schedule.status === "active" ? "paused" : "active";
    setUpdatingId(schedule.id);
    setError(null);

    try {
      const response = await fetch(`/api/prompt-schedules/${schedule.id}`, {
        body: JSON.stringify({ status: nextStatus }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const data = (await response.json()) as Partial<PromptScheduleResponse> & {
        error?: string;
      };

      if (!response.ok || !data.schedule) {
        throw new Error(data.error ?? "Could not update schedule.");
      }

      setSchedules((currentSchedules) =>
        currentSchedules.map((currentSchedule) =>
          currentSchedule.id === data.schedule!.id
            ? data.schedule!
            : currentSchedule,
        ),
      );

      if (nextStatus === "active") {
        window.setTimeout(() => {
          void loadSchedules();
        }, 1200);
      }
    } catch (updateError) {
      setError(getErrorMessage(updateError));
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(scheduleId: string) {
    setUpdatingId(scheduleId);
    setError(null);

    try {
      const response = await fetch(`/api/prompt-schedules/${scheduleId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Could not delete schedule.");
      }

      setSchedules((currentSchedules) =>
        currentSchedules.filter((schedule) => schedule.id !== scheduleId),
      );
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setUpdatingId(null);
    }
  }

  function updateForm<Field extends keyof ScheduleFormState>(
    field: Field,
    value: ScheduleFormState[Field],
  ) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-5 border-t p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-normal">
            Scheduled Prompts
          </h1>
          <p className="text-sm text-muted-foreground">
            Daily and weekly tracking runs for recurring brand prompts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void loadSchedules()} type="button" variant="outline">
            <RefreshCcwIcon data-icon="inline-start" />
            Refresh
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/history">
              <HistoryIcon data-icon="inline-start" />
              History
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Active schedules" value={summary.active.toString()} />
        <SummaryCard label="Weekly" value={summary.weekly.toString()} />
        <SummaryCard label="Tracked runs" value={summary.runs.toString()} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(380px,0.8fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Create schedule</CardTitle>
            <CardDescription>{formatCadence(form.cadence)} cadence</CardDescription>
            <CardAction>
              <Badge variant="outline">
                {form.nextRunAt ? "Timed" : "Starts now"}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup className="gap-4">
                <Field>
                  <FieldLabel htmlFor="schedule-prompt">Prompt</FieldLabel>
                  <Textarea
                    className="min-h-32"
                    disabled={isSubmitting}
                    id="schedule-prompt"
                    onChange={(event) => updateForm("prompt", event.target.value)}
                    placeholder="Which prompt tracking tools should teams evaluate?"
                    value={form.prompt}
                  />
                </Field>

                <div className="grid gap-3 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="schedule-brand">Brand name</FieldLabel>
                    <Input
                      disabled={isSubmitting}
                      id="schedule-brand"
                      onChange={(event) =>
                        updateForm("brand", event.target.value)
                      }
                      placeholder="PromptWatch"
                      value={form.brand}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="schedule-domain">Website</FieldLabel>
                    <Input
                      disabled={isSubmitting}
                      id="schedule-domain"
                      onChange={(event) =>
                        updateForm("brandDomain", event.target.value)
                      }
                      placeholder="promptwatch.com"
                      value={form.brandDomain}
                    />
                  </Field>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="schedule-cadence">Cadence</FieldLabel>
                    <NativeSelect
                      disabled={isSubmitting}
                      id="schedule-cadence"
                      onChange={(event) =>
                        updateForm(
                          "cadence",
                          event.target.value as PromptScheduleCadence,
                        )
                      }
                      value={form.cadence}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </NativeSelect>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="schedule-next-run">First run</FieldLabel>
                    <Input
                      disabled={isSubmitting}
                      id="schedule-next-run"
                      min={toDateTimeLocalValue(new Date())}
                      onChange={(event) =>
                        updateForm("nextRunAt", event.target.value)
                      }
                      type="datetime-local"
                      value={form.nextRunAt}
                    />
                    <FieldDescription>Leave blank to queue immediately.</FieldDescription>
                  </Field>
                </div>

                {error ? (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}

                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    disabled={isSubmitting}
                    onClick={() => setForm(initialFormState)}
                    type="button"
                    variant="outline"
                  >
                    Reset
                  </Button>
                  <Button
                    disabled={isSubmitting || Boolean(validationMessage)}
                    type="submit"
                  >
                    {isSubmitting ? (
                      <Loader2Icon
                        className="animate-spin"
                        data-icon="inline-start"
                      />
                    ) : (
                      <PlusIcon data-icon="inline-start" />
                    )}
                    {isSubmitting ? "Creating" : "Create Schedule"}
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <section className="flex min-w-0 flex-col gap-4">
          {schedules.length > 0 ? (
            schedules.map((schedule) => (
              <ScheduleCard
                isUpdating={updatingId === schedule.id}
                key={schedule.id}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                schedule={schedule}
              />
            ))
          ) : (
            <EmptyScheduleState />
          )}
        </section>
      </div>
    </div>
  );
}

function ScheduleCard({
  schedule,
  isUpdating,
  onStatusChange,
  onDelete,
}: {
  schedule: PromptSchedule;
  isUpdating: boolean;
  onStatusChange: (schedule: PromptSchedule) => void;
  onDelete: (scheduleId: string) => void;
}) {
  const latestRun = schedule.recentRuns[0];
  const mentionedCount = latestRun
    ? latestRun.results.filter((result) => result.brandMentioned).length
    : 0;
  const citedCount = latestRun
    ? latestRun.results.filter((result) => result.brandCited).length
    : 0;
  const totalResults = Math.max(latestRun?.results.length ?? 0, 1);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex min-w-0 items-center gap-2">
          <ScheduleStatusIcon schedule={schedule} />
          <span className="truncate">{schedule.brand}</span>
        </CardTitle>
        <CardDescription>
          {formatCadence(schedule.cadence)} - next{" "}
          {formatDateTime(schedule.nextRunAt)}
        </CardDescription>
        <CardAction>
          <div className="flex gap-1">
            <Button
              disabled={isUpdating}
              onClick={() => onStatusChange(schedule)}
              size="sm"
              type="button"
              variant="outline"
            >
              {isUpdating ? (
                <Loader2Icon
                  className="animate-spin"
                  data-icon="inline-start"
                />
              ) : schedule.status === "active" ? (
                <PauseIcon data-icon="inline-start" />
              ) : (
                <PlayIcon data-icon="inline-start" />
              )}
              {schedule.status === "active" ? "Pause" : "Resume"}
            </Button>
            <Button
              disabled={isUpdating}
              onClick={() => onDelete(schedule.id)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <Trash2Icon />
              <span className="sr-only">Delete schedule</span>
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {schedule.prompt}
        </p>

        <div className="flex flex-wrap gap-2">
          <Badge variant={schedule.status === "active" ? "secondary" : "outline"}>
            {formatScheduleStatus(schedule.status)}
          </Badge>
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
          {schedule.brandDomain ? (
            <Badge variant="outline">{schedule.brandDomain}</Badge>
          ) : null}
        </div>

        <ChangeSummary schedule={schedule} />

        {schedule.recentRuns.length > 0 ? (
          <div className="flex flex-col gap-2">
            <div className="text-xs font-medium uppercase text-muted-foreground">
              Recent runs
            </div>
            <div className="grid gap-2 lg:grid-cols-2">
              {schedule.recentRuns.slice(0, 4).map((run) => (
                <RunSummary key={run.id} run={run} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            No runs queued yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChangeSummary({ schedule }: { schedule: PromptSchedule }) {
  if (!schedule.change) {
    return (
      <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
        Changes appear after two completed scheduled runs.
      </div>
    );
  }

  const { change } = schedule;
  const changed =
    change.mentionedDelta !== 0 ||
    change.citedDelta !== 0 ||
    change.newMentions.length > 0 ||
    change.lostMentions.length > 0 ||
    change.sentimentChanges.length > 0;

  if (!changed) {
    return (
      <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
        No mention, citation, or sentiment changes since the previous run.
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 md:grid-cols-2">
      <DeltaItem label="Mentions" value={change.mentionedDelta} />
      <DeltaItem label="Citations" value={change.citedDelta} />
      {change.newMentions.length > 0 ? (
        <ChangeList label="New mentions" providers={change.newMentions} />
      ) : null}
      {change.lostMentions.length > 0 ? (
        <ChangeList label="Lost mentions" providers={change.lostMentions} />
      ) : null}
      {change.sentimentChanges.length > 0 ? (
        <div className="flex flex-col gap-1 md:col-span-2">
          <div className="text-xs font-medium uppercase text-muted-foreground">
            Sentiment shifts
          </div>
          <div className="flex flex-wrap gap-2">
            {change.sentimentChanges.map((sentimentChange) => (
              <Badge key={sentimentChange.modelProvider} variant="outline">
                {formatProviderName(sentimentChange.modelProvider)}{" "}
                {sentimentChange.from} to {sentimentChange.to}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DeltaItem({ label, value }: { label: string; value: number }) {
  const Icon = value < 0 ? TrendingDownIcon : TrendingUpIcon;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-background p-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1 text-sm font-medium">
        <Icon data-icon="inline-start" />
        {value > 0 ? `+${value}` : value}
      </span>
    </div>
  );
}

function ChangeList({
  label,
  providers,
}: {
  label: string;
  providers: string[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {providers.map((provider) => (
          <Badge key={provider} variant="secondary">
            {formatProviderName(provider)}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function ScheduleStatusIcon({ schedule }: { schedule: PromptSchedule }) {
  const latestRun = schedule.recentRuns[0];

  if (latestRun && isRunInProgress(latestRun)) {
    return <Loader2Icon className="size-4 animate-spin text-primary" />;
  }

  if (latestRun?.status === "failed") {
    return <AlertCircleIcon className="size-4 text-destructive" />;
  }

  if (schedule.status === "paused") {
    return <PauseIcon className="size-4 text-muted-foreground" />;
  }

  if (latestRun?.status === "completed") {
    return <CheckCircle2Icon className="size-4 text-primary" />;
  }

  return <CalendarClockIcon className="size-4 text-muted-foreground" />;
}

function EmptyScheduleState() {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed bg-background/80 p-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <CalendarClockIcon className="size-5" />
      </div>
      <div className="mt-4 max-w-md">
        <div className="font-medium">No schedules</div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Scheduled runs will appear here with trend changes after repeat runs.
        </p>
      </div>
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

function getValidationMessage(form: ScheduleFormState) {
  if (!form.prompt.trim()) {
    return "Enter a prompt before creating a schedule.";
  }

  if (!form.brand.trim()) {
    return "Enter a brand name.";
  }

  if (form.nextRunAt) {
    const date = new Date(form.nextRunAt);

    if (Number.isNaN(date.getTime())) {
      return "Choose a valid first run date.";
    }
  }

  return null;
}

function getScheduleSummary(schedules: PromptSchedule[]) {
  return schedules.reduce(
    (summary, schedule) => ({
      active: summary.active + (schedule.status === "active" ? 1 : 0),
      weekly: summary.weekly + (schedule.cadence === "weekly" ? 1 : 0),
      runs: summary.runs + schedule.recentRuns.length,
    }),
    { active: 0, weekly: 0, runs: 0 },
  );
}

function isRunInProgress(run: PromptRun) {
  return run.status === "pending" || run.status === "running";
}

function formatCadence(cadence: PromptScheduleCadence) {
  return cadence === "weekly" ? "Weekly" : "Daily";
}

function formatScheduleStatus(status: PromptSchedule["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatProviderName(provider: string) {
  return provider === "openai" || provider === "gemini"
    ? formatModelProvider(provider)
    : provider;
}

function toDateTimeLocalValue(date: Date) {
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

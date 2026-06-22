import { and, eq, gte, sql } from "drizzle-orm";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/db/drizzle";
import { promptRunResults, promptRuns } from "@/db/schemas";
import { requireAuth } from "@/helper/require-auth";

export const runtime = "nodejs";

const trendDays = 14;
const chartWidth = 760;
const chartHeight = 300;
const chartPadding = {
  top: 18,
  right: 20,
  bottom: 36,
  left: 42,
};

type TrendRow = {
  date: string;
  total: number;
  mentions: number;
};

type TrendPoint = TrendRow & {
  label: string;
  value: Date;
};

export default async function Dashboard() {
  const session = await requireAuth();
  const days = getTrendDays();

  const [summaryRows, trendRows] = await Promise.all([
    db
      .select({
        totalRuns: sql<number>`count(distinct ${promptRuns.id})::int`,
        totalResults: sql<number>`count(${promptRunResults.id})::int`,
        totalMentions: sql<number>`
          coalesce(
            count(${promptRunResults.id})
              filter (where ${promptRunResults.brandMentioned}),
            0
          )::int
        `,
        totalCitations: sql<number>`
          coalesce(
            count(${promptRunResults.id})
              filter (where ${promptRunResults.brandCited}),
            0
          )::int
        `,
      })
      .from(promptRuns)
      .leftJoin(promptRunResults, eq(promptRunResults.runId, promptRuns.id))
      .where(eq(promptRuns.userId, session.user.id)),
    db
      .select({
        date: sql<string>`to_char(date_trunc('day', ${promptRunResults.createdAt}), 'YYYY-MM-DD')`,
        total: sql<number>`count(${promptRunResults.id})::int`,
        mentions: sql<number>`
          coalesce(
            count(${promptRunResults.id})
              filter (where ${promptRunResults.brandMentioned}),
            0
          )::int
        `,
      })
      .from(promptRunResults)
      .where(
        and(
          eq(promptRunResults.userId, session.user.id),
          gte(promptRunResults.createdAt, days[0]?.value ?? new Date()),
        ),
      )
      .groupBy(sql`date_trunc('day', ${promptRunResults.createdAt})`)
      .orderBy(sql`date_trunc('day', ${promptRunResults.createdAt})`),
  ]);

  const summary = summaryRows[0] ?? {
    totalRuns: 0,
    totalResults: 0,
    totalMentions: 0,
    totalCitations: 0,
  };
  const chartData = mergeTrendData(days, trendRows);
  const mentionRate =
    summary.totalResults > 0
      ? Math.round((summary.totalMentions / summary.totalResults) * 100)
      : 0;
  const citationRate =
    summary.totalResults > 0
      ? Math.round((summary.totalCitations / summary.totalResults) * 100)
      : 0;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-5 border-t p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Track prompt runs, model responses, and how often your brand is
            mentioned over time.
          </p>
        </div>
        <Badge variant="outline">Last {trendDays} days</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          description="Saved prompt research sessions"
          label="Total runs"
          value={summary.totalRuns.toLocaleString()}
        />
        <MetricCard
          description="Responses across tracked models"
          label="Model responses"
          value={summary.totalResults.toLocaleString()}
        />
        <MetricCard
          description={`${mentionRate}% of model responses`}
          label="Brand mentions"
          value={summary.totalMentions.toLocaleString()}
        />
        <MetricCard
          description={`${citationRate}% of model responses`}
          label="Brand citations"
          value={summary.totalCitations.toLocaleString()}
        />
      </div>

      <Card className="min-w-0 flex-1">
        <CardHeader className="border-b">
          <CardTitle>Mention Trends</CardTitle>
          <CardDescription>
            Daily brand mentions compared with total model responses.
          </CardDescription>
          <CardAction>
            <div className="flex flex-wrap justify-end gap-2">
              <ChartLegend label="Mentions" variant="primary" />
              <ChartLegend label="Responses" variant="muted" />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="min-w-0">
          <MentionTrendChart data={chartData} />
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function MentionTrendChart({ data }: { data: TrendPoint[] }) {
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const maxValue = Math.max(
    1,
    ...data.flatMap((day) => [day.total, day.mentions]),
  );
  const yTicks = getTicks(maxValue);
  const points = data.map((day, index) => {
    const x =
      chartPadding.left +
      (data.length <= 1 ? plotWidth : (index / (data.length - 1)) * plotWidth);
    const mentionY =
      chartPadding.top + plotHeight - (day.mentions / maxValue) * plotHeight;
    const totalY =
      chartPadding.top + plotHeight - (day.total / maxValue) * plotHeight;

    return {
      ...day,
      x,
      mentionY,
      totalY,
    };
  });
  const baselineY = chartPadding.top + plotHeight;
  const mentionPath = toLinePath(
    points.map((point) => [point.x, point.mentionY]),
  );
  const totalPath = toLinePath(points.map((point) => [point.x, point.totalY]));
  const mentionArea = toAreaPath(
    points.map((point) => [point.x, point.mentionY]),
    baselineY,
  );
  const hasData = data.some((day) => day.total > 0 || day.mentions > 0);

  return (
    <div className="relative h-[320px] min-w-0">
      <svg
        aria-label="Mention trends over time"
        className="size-full overflow-visible"
        role="img"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      >
        <defs>
          <linearGradient id="mention-area" x1="0" x2="0" y1="0" y2="1">
            <stop
              className="text-primary"
              offset="0%"
              stopColor="currentColor"
              stopOpacity="0.2"
            />
            <stop
              className="text-primary"
              offset="100%"
              stopColor="currentColor"
              stopOpacity="0.02"
            />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => {
          const y =
            chartPadding.top + plotHeight - (tick / maxValue) * plotHeight;

          return (
            <g key={tick}>
              <line
                className="text-border"
                stroke="currentColor"
                strokeDasharray="4 6"
                strokeWidth="1"
                x1={chartPadding.left}
                x2={chartWidth - chartPadding.right}
                y1={y}
                y2={y}
              />
              <text
                className="fill-muted-foreground text-[11px]"
                textAnchor="end"
                x={chartPadding.left - 12}
                y={y + 4}
              >
                {tick}
              </text>
            </g>
          );
        })}

        <path d={mentionArea} fill="url(#mention-area)" />
        <path
          className="text-muted-foreground"
          d={totalPath}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.45"
          strokeWidth="2"
        />
        <path
          className="text-primary"
          d={mentionPath}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />

        {points.map((point, index) => (
          <g key={point.date}>
            <circle
              className="fill-background text-primary"
              cx={point.x}
              cy={point.mentionY}
              r="3.5"
              stroke="currentColor"
              strokeWidth="2"
            />
            {index === 0 || index === points.length - 1 || index % 3 === 0 ? (
              <text
                className="fill-muted-foreground text-[11px]"
                textAnchor="middle"
                x={point.x}
                y={chartHeight - 10}
              >
                {point.label}
              </text>
            ) : null}
          </g>
        ))}
      </svg>

      {!hasData ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-lg border bg-background px-4 py-2 text-sm text-muted-foreground">
            No prompt runs yet.
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ChartLegend({
  label,
  variant,
}: {
  label: string;
  variant: "primary" | "muted";
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span
        className={
          variant === "primary"
            ? "size-2 rounded-full bg-primary"
            : "size-2 rounded-full bg-muted-foreground/50"
        }
      />
      {label}
    </div>
  );
}

function getTrendDays() {
  const today = startOfDay(new Date());

  return Array.from({ length: trendDays }, (_, index) => {
    const value = new Date(today);
    value.setDate(today.getDate() - (trendDays - 1 - index));

    return {
      date: formatDateKey(value),
      label: new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
      }).format(value),
      value,
      total: 0,
      mentions: 0,
    };
  });
}

function mergeTrendData(days: TrendPoint[], rows: TrendRow[]) {
  const rowByDate = new Map(rows.map((row) => [row.date, row]));

  return days.map((day) => {
    const row = rowByDate.get(day.date);

    return {
      ...day,
      total: row?.total ?? 0,
      mentions: row?.mentions ?? 0,
    };
  });
}

function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTicks(maxValue: number) {
  const step = Math.max(1, Math.ceil(maxValue / 4));
  const ticks = [0, step, step * 2, step * 3, step * 4];
  const lastTick = ticks.at(-1) ?? maxValue;

  return lastTick >= maxValue ? ticks : [...ticks, maxValue];
}

function toLinePath(points: Array<[number, number]>) {
  return points
    .map(
      ([x, y], index) =>
        `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`,
    )
    .join(" ");
}

function toAreaPath(points: Array<[number, number]>, baselineY: number) {
  if (points.length === 0) {
    return "";
  }

  const line = toLinePath(points);
  const [lastX] = points[points.length - 1];
  const [firstX] = points[0];

  return [
    line,
    `L ${lastX.toFixed(2)} ${baselineY.toFixed(2)}`,
    `L ${firstX.toFixed(2)} ${baselineY.toFixed(2)}`,
    "Z",
  ].join(" ");
}

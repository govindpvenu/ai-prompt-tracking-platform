import type {
  HighlightRange,
  MentionSentiment,
} from "@/types/promptRuns";

import { sendOpenRouterChat } from "./openrouter";

export type TrackingAnalysis = {
  brandMentioned: boolean;
  brandCited: boolean;
  sentiment: MentionSentiment;
  mentionHighlights: HighlightRange[];
  citationEvidence: string[];
};

type EvaluatorAnalysis = {
  brandCited?: boolean;
  sentiment?: MentionSentiment;
  citationEvidence?: string[];
};

const positiveTerms = new Set([
  "accurate",
  "best",
  "effective",
  "excellent",
  "fast",
  "good",
  "great",
  "helpful",
  "leading",
  "popular",
  "positive",
  "recommended",
  "reliable",
  "strong",
  "trusted",
]);

const negativeTerms = new Set([
  "bad",
  "concern",
  "controversial",
  "criticism",
  "expensive",
  "issue",
  "limited",
  "negative",
  "poor",
  "problem",
  "risk",
  "slow",
  "weak",
  "worse",
]);

export async function analyzeModelResponse({
  apiKey,
  response,
  brand,
  brandDomain,
  evaluatorModel,
}: {
  apiKey?: string;
  response: string;
  brand: string;
  brandDomain: string | null;
  evaluatorModel: string;
}): Promise<TrackingAnalysis> {
  const deterministic = buildDeterministicAnalysis(response, brand, brandDomain);
  const evaluator = await evaluateWithModel({
    apiKey,
    response,
    brand,
    brandDomain,
    evaluatorModel,
  });

  if (!evaluator) {
    return deterministic;
  }

  return {
    ...deterministic,
    brandCited: deterministic.brandCited || Boolean(evaluator.brandCited),
    sentiment:
      deterministic.brandMentioned && evaluator.sentiment
        ? evaluator.sentiment
        : deterministic.sentiment,
    citationEvidence: uniqueStrings([
      ...deterministic.citationEvidence,
      ...(evaluator.citationEvidence ?? []),
    ]),
  };
}

export function buildDeterministicAnalysis(
  response: string,
  brand: string,
  brandDomain: string | null,
): TrackingAnalysis {
  const mentionHighlights = findMentionHighlights(response, brand);
  const citationEvidence = findCitationEvidence(response, brand, brandDomain);

  return {
    brandMentioned: mentionHighlights.length > 0,
    brandCited: citationEvidence.length > 0,
    sentiment: inferSentiment(response, mentionHighlights),
    mentionHighlights,
    citationEvidence,
  };
}

export function normalizeDomain(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    return cleanDomain(url.hostname);
  } catch {
    return cleanDomain(trimmed.split("/")[0] ?? trimmed);
  }
}

function cleanDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/:\d+$/, "");
}

function findMentionHighlights(response: string, brand: string): HighlightRange[] {
  const escapedBrand = escapeRegExp(brand.trim());

  if (!escapedBrand) {
    return [];
  }

  const ranges: HighlightRange[] = [];
  const matcher = new RegExp(escapedBrand, "gi");
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(response)) !== null) {
    ranges.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
    });
  }

  return ranges;
}

function findCitationEvidence(
  response: string,
  brand: string,
  brandDomain: string | null,
) {
  const evidence = new Set<string>();

  if (brandDomain) {
    for (const url of extractUrls(response)) {
      const domain = normalizeDomain(url);

      if (domainMatches(domain, brandDomain)) {
        evidence.add(url);
      }
    }

    if (response.toLowerCase().includes(brandDomain.toLowerCase())) {
      evidence.add(brandDomain);
    }
  }

  const sourceReference = findExplicitSourceReference(response, brand);

  if (sourceReference) {
    evidence.add(sourceReference);
  }

  return Array.from(evidence);
}

function extractUrls(response: string) {
  return Array.from(response.matchAll(/https?:\/\/[^\s)\]>"']+/gi)).map(
    ([url]) => url.replace(/[.,;:!?]+$/, ""),
  );
}

function domainMatches(candidate: string | null, expected: string) {
  return Boolean(
    candidate &&
      (candidate === expected || candidate.endsWith(`.${expected}`)),
  );
}

function findExplicitSourceReference(response: string, brand: string) {
  const escapedBrand = escapeRegExp(brand);
  const matcher = new RegExp(
    `(?:source|sources|citation|cited|according to|from)[:\\s]+[^.\\n]{0,120}${escapedBrand}[^.\\n]{0,120}`,
    "i",
  );
  const match = response.match(matcher);

  return match?.[0]?.trim() ?? null;
}

function inferSentiment(
  response: string,
  mentionHighlights: HighlightRange[],
): MentionSentiment {
  if (mentionHighlights.length === 0) {
    return "unknown";
  }

  let score = 0;

  for (const range of mentionHighlights) {
    const windowText = response
      .slice(Math.max(0, range.start - 120), range.end + 120)
      .toLowerCase();
    const words = windowText.match(/[a-z][a-z-]+/g) ?? [];

    for (const word of words) {
      if (positiveTerms.has(word)) {
        score += 1;
      }

      if (negativeTerms.has(word)) {
        score -= 1;
      }
    }
  }

  if (score > 0) {
    return "positive";
  }

  if (score < 0) {
    return "negative";
  }

  return "neutral";
}

async function evaluateWithModel({
  apiKey,
  response,
  brand,
  brandDomain,
  evaluatorModel,
}: {
  apiKey?: string;
  response: string;
  brand: string;
  brandDomain: string | null;
  evaluatorModel: string;
}): Promise<EvaluatorAnalysis | null> {
  try {
    const completion = await sendOpenRouterChat({
      apiKey,
      model: evaluatorModel,
      temperature: 0,
      maxTokens: 350,
      system:
        "You classify brand mentions in LLM responses. Return only JSON matching the provided schema.",
      messages: [
        {
          role: "user",
          content: [
            `Brand: ${brand}`,
            `Brand domain: ${brandDomain ?? "not provided"}`,
            "Citation means the response links to, names, or explicitly cites the brand's own website/content as a source. A plain brand mention is not a citation.",
            "Classify sentiment only for the brand mention.",
            "Response:",
            response,
          ].join("\n\n"),
        },
      ],
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: "brand_tracking_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              brandCited: { type: "boolean" },
              sentiment: {
                type: "string",
                enum: ["positive", "neutral", "negative", "unknown"],
              },
              citationEvidence: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["brandCited", "sentiment", "citationEvidence"],
            additionalProperties: false,
          },
        },
      },
    });

    return normalizeEvaluatorAnalysis(parseJsonObject(completion.content));
  } catch {
    return null;
  }
}

function normalizeEvaluatorAnalysis(value: unknown): EvaluatorAnalysis | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const sentiment = record.sentiment;

  return {
    brandCited:
      typeof record.brandCited === "boolean" ? record.brandCited : undefined,
    sentiment: isSentiment(sentiment) ? sentiment : undefined,
    citationEvidence: Array.isArray(record.citationEvidence)
      ? record.citationEvidence.filter(
          (item): item is string => typeof item === "string",
        )
      : undefined,
  };
}

function parseJsonObject(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? (JSON.parse(match[0]) as unknown) : null;
  }
}

function isSentiment(value: unknown): value is MentionSentiment {
  return (
    value === "positive" ||
    value === "neutral" ||
    value === "negative" ||
    value === "unknown"
  );
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

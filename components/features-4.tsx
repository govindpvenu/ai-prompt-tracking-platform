import { Icons } from "@/constants/icons";
import {
  BellRing,
  BookOpenCheck,
  Bot,
  Gauge,
  KeyRound,
  SearchCheck,
} from "lucide-react";

const features = [
  {
    icon: SearchCheck,
    title: "Prompt monitoring",
    description:
      "Track the exact prompts that matter to your brand and compare how answers change over time.",
  },
  {
    icon: KeyRound,
    title: "Bring your own keys",
    description:
      "Connect your own OpenRouter key and keep model access under your control instead of a shared vendor account.",
  },
  {
    icon: BookOpenCheck,
    title: "Citation tracking",
    description:
      "See which sources models cite, which pages they trust, and where your content is missing.",
  },
  {
    icon: BellRing,
    title: "Scheduled checks",
    description:
      "Automate recurring prompt runs so visibility changes are caught before they become surprises.",
  },

  {
    icon: Bot,
    title: "Model comparison",
    description:
      "Run the same research across configurable AI models and compare where answers differ.",
  },
  {
    icon: Icons.github,
    title: "Open source",
    description:
      "Inspect the code, self-host the platform, and adapt the workflow to match your team's research process.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-16 md:py-24">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 md:gap-16">
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col gap-5 text-center">
          <h2 className="text-balance text-4xl font-medium lg:text-5xl">
            Know where your brand stands inside AI answers
          </h2>
          <p className="text-muted-foreground text-balance">
            GetCited gives marketing, product, and SEO teams an open-source,
            BYOK-first way to measure LLM visibility, citations, and response
            quality.
          </p>
        </div>

        <div className="relative mx-auto grid max-w-4xl divide-y overflow-hidden border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3 lg:[&>*:nth-child(n+4)]:border-t">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-3 p-8 md:p-10"
            >
              <div className="flex items-center gap-2">
                <feature.icon className="size-4" aria-hidden />
                <h3 className="text-sm font-medium">{feature.title}</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

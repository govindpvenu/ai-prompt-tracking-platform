import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Sparkle } from "lucide-react";
import { GoogleAuth } from "@/app/(auth)/_components/GoogleAuth";

export default function HeroSection() {
  return (
    <section className="before:bg-muted border-e-foreground relative overflow-hidden before:absolute before:inset-1 before:h-[calc(100%-8rem)] before:rounded-2xl sm:before:inset-2 md:before:rounded-[2rem] lg:before:h-[calc(100%-14rem)]">
      <div className="py-20 md:py-36">
        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <div>
            <Link
              href="#features"
              className="hover:bg-foreground/5 mx-auto flex w-fit items-center justify-center gap-2 rounded-md py-0.5 pl-1 pr-3 transition-colors duration-150"
            >
              <div
                aria-hidden
                className="border-background bg-linear-to-b dark:inset-shadow-2xs to-foreground from-primary relative flex size-5 items-center justify-center rounded border shadow-md shadow-black/20 ring-1 ring-black/10"
              >
                <Sparkle className="size-3 fill-primary stroke-accent drop-shadow" />
              </div>
              <span className="font-medium">AI answer visibility tracking</span>
            </Link>
            <h1 className="mx-auto mt-8 max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">
              Track how AI models mention, cite, and rank your brand
            </h1>
            <p className="text-muted-foreground mx-auto my-6 max-w-2xl text-balance text-xl">
              Prompt Tracker runs repeatable prompts across leading models so
              teams can monitor brand mentions, citations, answer drift, and
              competitive positioning from one dashboard.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/sign-up">
                  <span className="text-nowrap">Start Tracking</span>
                </Link>
              </Button>

              <div className="flex h-9 w-48 items-center justify-center">
                <GoogleAuth lastMethod="email" />
              </div>
            </div>
          </div>
        </div>
        <div id="workflow" className="relative">
          <div className="relative z-10 mx-auto max-w-5xl px-6">
            <div className="mt-12 md:mt-16">
              <div className="bg-background hidden dark:block rounded-(--radius) relative mx-auto overflow-hidden border border-transparent shadow-lg shadow-black/10 ring-1 ring-black/10">
                <Image
                  src="/preview/preview-dark.png"
                  alt="Prompt Tracker dashboard showing AI prompt runs and results"
                  width="2880"
                  height="1842"
                  loading="eager"
                />
              </div>
              <div className="bg-background dark:hidden rounded-(--radius) relative mx-auto overflow-hidden border border-transparent shadow-lg shadow-black/10 ring-1 ring-black/10">
                <Image
                  src="/preview/preview.png"
                  alt="Prompt Tracker dashboard showing AI prompt runs and results"
                  width="2880"
                  loading="eager"
                  height="1842"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

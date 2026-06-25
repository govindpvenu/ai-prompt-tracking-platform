import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { KeyRound, Sparkle } from "lucide-react";
import { GoogleAuth } from "@/app/(auth)/_components/GoogleAuth";
import { Icons } from "@/constants/icons";

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
              <span className="font-medium">
                Open-source AI visibility tracking
              </span>
            </Link>
            <h1 className="mx-auto mt-8 max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">
              Track AI citations of your brand.
            </h1>
            <p className="text-muted-foreground mx-auto my-6 max-w-2xl text-pretty text-xl">
              GetCited is an open-source platform for repeatable prompt
              monitoring, run checks across leading AI models, and see how
              answers mention, cite, and rank your brand.
            </p>

            <div className="text-muted-foreground mx-auto mb-8 flex max-w-2xl flex-col items-center justify-center gap-3 text-sm sm:flex-row">
              <span className="inline-flex items-center gap-2">
                <Icons.github className="size-4" aria-hidden />
                Open source
              </span>
              <span className="hidden h-4 w-px bg-border sm:block" />
              <span className="inline-flex items-center gap-2">
                <KeyRound className="size-4" aria-hidden />
                BYOK for model access
              </span>
            </div>

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
                  alt="GetCited dashboard showing AI prompt runs and results"
                  width="2880"
                  height="1842"
                  loading="eager"
                />
              </div>
              <div className="bg-background dark:hidden rounded-(--radius) relative mx-auto overflow-hidden border border-transparent shadow-lg shadow-black/10 ring-1 ring-black/10">
                <Image
                  src="/preview/preview.png"
                  alt="GetCited dashboard showing AI prompt runs and results"
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

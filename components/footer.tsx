import { LogoIcon } from "@/components/logo";

export default function FooterSection() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col gap-6 py-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex max-w-sm flex-col gap-3">
            <div className="flex size-fit items-center gap-2">
              <LogoIcon />
              <span className="font-medium">GetCited</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Monitor how AI models answer your most important prompts, mention
              your brand, and cite your sources.
            </p>
          </div>

          <div className="text-muted-foreground flex flex-col gap-1 text-sm sm:items-end">
            <span>© 2026 GetCited. All rights reserved.</span>
            <span>
              Made with{" "}
              <a
                href="https://tailark.com"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Tailark
              </a>
              .
            </span>
            <span>
              View the repo on{" "}
              <a
                href="https://github.com/govindpvenu/getcited"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                GitHub
              </a>
              .
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

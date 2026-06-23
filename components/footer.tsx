import { LogoIcon } from "@/components/logo";

export default function FooterSection() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col gap-6 py-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex max-w-sm flex-col gap-3">
            <div className="flex size-fit items-center gap-2">
              <LogoIcon />
              <span className="font-medium">Prompt Tracker</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Monitor how AI models answer your most important prompts, mention
              your brand, and cite your sources.
            </p>
          </div>

          <span className="text-muted-foreground text-sm">
            © 2026 Prompt Tracker. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}

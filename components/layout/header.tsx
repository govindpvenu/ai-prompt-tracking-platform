import Link from "next/link";
import { Profile } from "./Profile";
import ThemeToggle from "./ThemeToggle";
import { GalleryVerticalEnd } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-background sticky top-0 z-50 flex items-center justify-between border-b p-4">
      <div className="flex justify-center gap-2 md:justify-start">
        <Link href="/" className="flex items-center gap-2 font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          AI Prompt Tracker
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Profile />
      </div>
    </header>
  );
}

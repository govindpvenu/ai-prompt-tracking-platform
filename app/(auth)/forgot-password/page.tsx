import { BotMessageSquare, GalleryVerticalEnd } from "lucide-react";
import Link from "next/link";
import ForgotPasswordForm from "../_components/ForgotPasswordForm";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const email = (await searchParams).email || "";

  return (
    <div className="flex min-h-svh flex-col gap-4 p-6 md:p-10">
      <div className="flex justify-center gap-2 md:justify-start">
        <Link href="/" className="flex items-center gap-2 font-medium">
          <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
            {/* <GalleryVerticalEnd className="size-4" /> */}
            <BotMessageSquare className="!size-6" strokeWidth="1.5" />
          </div>
          AI Prompt Tracker
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md">
          <ForgotPasswordForm email={email} />
        </div>
      </div>
    </div>
  );
}

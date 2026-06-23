import Image from "next/image";
import { SignUpForm } from "../_components/SignUpForm";
import { BotMessageSquare, GalleryVerticalEnd } from "lucide-react";
import Link from "next/link";
import MagnetLines from "@/components/react-bits/MagnetLines";

export default function SignUpPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="bg-muted/95 relative hidden lg:block">
        <MagnetLines
          rows={10}
          columns={12}
          containerSize=" 100%"
          lineColor="#efefef"
          lineWidth="3px"
          lineHeight="60px"
          baseAngle={-10}
          style={{ margin: "2rem auto" }}
        />
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-10">
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
          <div className="w-full max-w-sm">
            <SignUpForm />
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import * as z from "zod";

import { zodResolver } from "@/lib/zod-resolver";
import { Button } from "@/components/ui/button";
import { Controller, useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {} from "lucide-react";
import { Stage } from "@/types/authTypes";
import { OTPForm } from "./OTPForm";
import Link from "next/link";
import { GoogleAuth } from "./GoogleAuth";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Password } from "@/components/password";

const formSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
  remember_me: z.boolean().optional(),
});

export function SignInForm() {
  const [stage, setStage] = useState<Stage>({ stage: "sign-in", email: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [lastMethod, setLastMethod] = useState<string | null>(null);
  useEffect(() => {
    // runs only on client, after hydration
    try {
      setLastMethod(authClient.getLastUsedLoginMethod());
    } catch {}
    setMounted(true);
  }, []);

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      email: "test@test.com",
      password: "12345678",
      remember_me: true,
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);

    const { email, password, remember_me } = values;

    const { data, error } = await authClient.signIn.email(
      {
        email, // user email address
        password, // user password -> min 8 characters by default
        callbackURL: "/", // A URL to redirect to after the user verifies their email (optional)
        rememberMe: remember_me || false, //Remember me
      },
      {
        onRequest: (ctx) => {
          //show loading
          setIsLoading(true);
        },
        onSuccess: async (ctx) => {
          //redirect to the dashboard or sign in page
        },

        onError: async (ctx) => {
          setIsLoading(false);
          console.log("CTX:", ctx);
          if (ctx.error.code === "EMAIL_NOT_VERIFIED") {
            console.log("EMAIL_NOT_VERIFIED");
            await authClient.emailOtp.sendVerificationOtp({
              email: email,
              type: "sign-in",
            });
            setStage({ stage: "email-verification", email: email });
          } else {
            toast.error(ctx.error.message);
          }
        },
      },
    );

    console.log("data:", data, "error:", error);
  }

  if (stage.stage === "email-verification") {
    return <OTPForm stage={stage} />;
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your email to sign-in to your account
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Email *</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  type={"email"}
                  placeholder="Enter your Email"
                  autoComplete="off"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

        <div className="grid gap-2">
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex items-center">
                  <FieldLabel htmlFor={field.name}>Password *</FieldLabel>
                  <Link
                    href={`/forgot-password?email=${form.watch("email")}`}
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Password
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="Password"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

        <div className="grid gap-2">
          <Controller
            name="remember_me"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex flex-row items-center gap-2">
                  <Checkbox
                    id={field.name}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <FieldLabel
                    htmlFor={field.name}
                    className="cursor-pointer text-sm font-normal"
                  >
                    Remember me
                  </FieldLabel>
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

        <Button disabled={isLoading} className="relative rounded-lg" size="sm">
          {mounted && lastMethod === "email" && (
            <Badge
              variant="secondary"
              className="absolute top-0 right-0 z-10 -mt-2 -mr-2 leading-none"
            >
              Last used
            </Badge>
          )}
          {isLoading ? <Spinner /> : "Sign In"}
        </Button>

        <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-background text-muted-foreground relative z-10 px-2">
            Or continue with
          </span>
        </div>

        <GoogleAuth lastMethod={lastMethod} />
      </div>
      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="underline underline-offset-4">
          Sign up
        </Link>
      </div>
    </form>
  );
}

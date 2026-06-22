import {
  emailOTPClient,
  lastLoginMethodClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  plugins: [
    emailOTPClient(),
    lastLoginMethodClient(),
    inferAdditionalFields<typeof auth>(),
  ],
});
export type Session = typeof authClient.$Infer.Session;

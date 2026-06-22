import { headers } from "next/headers";

import { auth } from "@/lib/auth";

export async function getApiSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

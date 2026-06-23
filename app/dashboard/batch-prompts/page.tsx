import { requireAuth } from "@/helper/require-auth";

import { BatchPromptsClient } from "./_components/BatchPromptsClient";

export default async function BatchPromptsPage() {
  await requireAuth();

  return <BatchPromptsClient />;
}

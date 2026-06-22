import { requireAuth } from "@/helper/require-auth";

import { PromptResearchClient } from "./_components/PromptResearchClient";

export default async function PromptResearchPage() {
  await requireAuth();

  return <PromptResearchClient />;
}

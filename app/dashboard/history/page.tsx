import { requireAuth } from "@/helper/require-auth";

import { HistoryClient } from "./_components/HistoryClient";

export default async function HistoryPage() {
  await requireAuth();

  return <HistoryClient />;
}

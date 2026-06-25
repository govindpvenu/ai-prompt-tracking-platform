import { requireAuth } from "@/helper/require-auth";
import { getOpenRouterSettingsView } from "@/lib/byok/openrouter-settings";

import { ByokClient } from "./_components/ByokClient";

export default async function ByokPage() {
  const session = await requireAuth();
  const settings = await getOpenRouterSettingsView(session.user.id);

  return <ByokClient initialSettings={settings} />;
}

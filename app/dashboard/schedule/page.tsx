import { requireAuth } from "@/helper/require-auth";
import { listPromptSchedules } from "@/lib/prompt-schedules/repository";

import { ScheduleClient } from "./_components/ScheduleClient";

export default async function SchedulePage() {
  const session = await requireAuth();
  const schedules = await listPromptSchedules(session.user.id);

  return <ScheduleClient initialSchedules={schedules} />;
}

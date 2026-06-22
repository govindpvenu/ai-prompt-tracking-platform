import WorkInProgress from "@/components/work-in-progress";
import { requireAuth } from "@/helper/require-auth";

export default async function ByokPage() {
  await requireAuth();

  return <WorkInProgress />;
}

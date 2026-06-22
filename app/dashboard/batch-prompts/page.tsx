import WorkInProgress from "@/components/work-in-progress";
import { requireAuth } from "@/helper/require-auth";
import { redirect } from "next/navigation";

export default async function SalaryOverviewPage() {
  await requireAuth();

  return <WorkInProgress />;
}

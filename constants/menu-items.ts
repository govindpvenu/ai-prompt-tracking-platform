import {
  Astroid,
  CalendarSync,
  FileStack,
  History,
  LayoutDashboard,
  UserRoundKey,
} from "lucide-react";
export const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Prompt Research",
    url: "/dashboard/prompt-research",
    icon: Astroid,
  },
  {
    title: "History",
    url: "/dashboard/history",
    icon: History,
  },
  {
    title: "Batch Prompts",
    url: "/dashboard/batch-prompts",
    icon: FileStack,
  },
  {
    title: "Schedule",
    url: "/dashboard/schedule",
    icon: CalendarSync,
  },
  {
    title: "BYOK",
    url: "/dashboard/byok",
    icon: UserRoundKey,
  },
];

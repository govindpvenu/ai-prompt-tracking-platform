import {
  Astroid,
  CalendarSync,
  FileStack,
  History,
  LayoutDashboard,
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
    title: "History",
    url: "/dashboard/history",
    icon: History,
  },
];

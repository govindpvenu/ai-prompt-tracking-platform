import { AppBreadcrump } from "@/components/app-breadcrump";
import { AppSidebar } from "@/components/app-sidebar";
import { Profile } from "@/components/layout/Profile";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { Suspense } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex flex-col w-full">
        <header className="flex h-16 px-4 justify-between shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <AppBreadcrump />
          </div>

          <div className="flex items-center gap-3 p-4">
            <ThemeToggle />
            {/* <Suspense fallback={<Skeleton className="h-8 w-8 rounded-full" />}> */}
            <Profile />
            {/* </Suspense> */}
          </div>
        </header>
        <div className="flex flex-col w-full">{children}</div>
      </main>
    </SidebarProvider>
  );
}

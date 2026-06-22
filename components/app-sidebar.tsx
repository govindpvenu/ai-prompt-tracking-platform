"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BotMessageSquare, LogOut } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { items } from "@/constants/menu-items";
import { ConfirmLogOut } from "./layout/ConfirmLogOut";

export function AppSidebar() {
  const pathname = usePathname();
  const activeItem = items
    .filter(
      (item) => pathname === item.url || pathname.startsWith(`${item.url}/`),
    )
    .sort((a, b) => b.url.length - a.url.length)[0];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex justify-center items-start p-2 py-8 group-data-[collapsible=icon]:items-center">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              tooltip="Prompt Tracker"
              className="h-12 gap-3 px-2 group-data-[collapsible=icon]:justify-center"
            >
              <Link href="/dashboard">
                <BotMessageSquare className="!size-6" strokeWidth="1.5" />
                <span className="text-xl font-bold group-data-[collapsible=icon]:hidden">
                  Prompt Tracker
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = activeItem?.url === item.url;
                return (
                  <SidebarMenuItem key={item.title} className="text-lg h-14 ">
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={`h-14 px-4 text-lg gap-4 ${
                        isActive ? "text-primary " : "text-muted-foreground "
                      }`}
                    >
                      <Link href={item.url}>
                        <item.icon className="!size-5" />
                        <span className="text-base font-medium group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent shadow-xs data-[state=open]:text-sidebar-accent-foreground flex items-center justify-center gap-3 rounded-lg py-3 text-lg font-bold group-data-[collapsible=icon]:justify-center"
                >
                  <LogOut className="!size-5" />
                  <span className="text-lg font-medium group-data-[collapsible=icon]:hidden">
                    Log Out
                  </span>
                </SidebarMenuButton>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle> Log Out </AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to log out?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <ConfirmLogOut />
                  <AlertDialogCancel>No</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

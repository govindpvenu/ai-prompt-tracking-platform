"use client";
import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import { items } from "@/constants/menu-items";

// Helper function to format breadcrumb name (e.g., "salary-overview" -> "Salary Overview")
function formatBreadcrumbName(name: string): string {
  // First, try to find a match in menu items
  const menuItem = items.find((item) => item.url === `/${name}`);
  if (menuItem) {
    return menuItem.title;
  }

  // If no match, format the name (capitalize and replace hyphens with spaces)
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function AppBreadcrump() {
  const pathname = usePathname();
  const pathnames = pathname.split("/").filter((item) => item);

  // If we're at root, don't show breadcrumbs or show "Dashboard"
  if (pathname === "/" || pathnames.length === 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  const breadcrumbs = pathnames.map((name, index) => {
    const route = `/${pathnames.slice(0, index + 1).join("/")}`;
    const displayName = formatBreadcrumbName(name);
    return { name: displayName, route };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <React.Fragment key={crumb.route}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.route}>
                    {crumb.name}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

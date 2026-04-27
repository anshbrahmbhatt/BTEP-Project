"use client";

import { IconCirclePlusFilled, type Icon } from "@tabler/icons-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
}) {
  const pathname = usePathname();
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {pathname.startsWith("/admin") && (
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <SidebarMenuButton
                asChild
                tooltip="Quick Create"
                className="min-w-8 rounded-lg bg-primary text-primary-foreground shadow-sm duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
              >
                <Link href="/admin/courses/create">
                  <IconCirclePlusFilled />
                  <span>Quick Create</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} asChild>
                <Link
                  href={item.url}
                  className={cn(
                    "rounded-lg transition-colors",
                    pathname === item.url
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.icon && (
                    <item.icon
                      className={cn(pathname === item.url && "text-primary")}
                    />
                  )}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

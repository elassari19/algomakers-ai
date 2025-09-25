'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, type LucideIcon } from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from '@/components/ui/sidebar';
import { cn } from '../lib/utils';
import React from 'react';

type NavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  hasSubMenu?: boolean;
  items?: NavItem[];
};

function renderNavItems(items: NavItem[], currentPath: string, level = 0) {
  // Helper function to check if path is active
  const isActive = (itemUrl: string) => {
    // Exact match for root paths
    if (itemUrl === '/' || currentPath === '/') {
      return itemUrl === currentPath;
    }
    // For other paths, use startsWith but ensure it's a proper path segment match
    return currentPath === itemUrl || currentPath.startsWith(itemUrl + '/');
  };

  return items.map((item) =>
    item.hasSubMenu ? (
      <Collapsible
        key={item.title}
        asChild
        defaultOpen={isActive(item.url)}
        className="group/collapsible"
      >
        <SidebarMenuItem className="py-2">
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              tooltip={item.title}
              className={
                isActive(item.url)
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/30'
                  : ''
              }
            >
              {item.icon && <item.icon />}
              <span>{item.title}</span>
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items && renderNavItems(item.items, currentPath, level + 1)}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    ) : (
      <SidebarMenuItem key={item.title} className="py-1">
        <SidebarMenuButton
          tooltip={item.title}
          asChild
          className={cn(
            isActive(item.url)
              ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/30'
              : '',
            ' py-4'
          )}
        >
          <Link href={item.url} className="flex items-center w-full py-3">
            {item.icon && (
              <item.icon
                className={
                  isActive(item.url) ? 'text-orange-500' : 'text-white'
                }
              />
            )}
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  );
}

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>{renderNavItems(items, pathname)}</SidebarMenu>
    </SidebarGroup>
  );
}

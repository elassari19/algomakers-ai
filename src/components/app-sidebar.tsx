'use client';

import * as React from 'react';
import Link from 'next/link';
import { LayoutDashboard, PieChart, Receipt, Briefcase, Users, BarChart2, Bell, Mail } from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { UserAvatarMenu } from './auth';

// This is sample data.
const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Portfolio',
      url: '/portfolio',
      icon: Briefcase,
      badge: 'NEW',
    },
    {
      title: 'My Subscriptions',
      url: '/subscriptions',
      icon: PieChart,
      badge: 'PRO',
    },
    {
      title: 'Billing & Invoices',
      url: '/billing',
      icon: Receipt,
    },
  ],
  consoleNav: [
    {
      title: 'Audit Logs',
      url: '/console/1',
      icon: LayoutDashboard,
    },
    {
      title: 'Users Events',
      url: '/console/1/events',
      icon: BarChart2,
    },
    {
      title: 'Backtests',
      url: '/console/1/backtests',
      icon: PieChart,
    },
    {
      title: 'Users',
      url: '/console/1/users',
      icon: Users,
    },
    {
      title: 'Subscriptions',
      url: '/console/1/subscriptions',
      icon: Briefcase,
    },
    {
      title: 'Billing',
      url: '/console/1/billing',
      icon: Receipt,
    },
    {
      title: 'Notifications',
      url: '/console/1/notifications',
      icon: Bell,
    },
    {
      title: 'Email Marketing',
      url: '/console/1/emails',
      icon: Mail,
    },
    { title: 'Affiliate', url: '/console/1/affiliate', icon: Users },
    { title: 'Analytics', url: '/console/1/analytics', icon: BarChart2 },
  ]
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  isAdmin?: boolean;
};

export function AppSidebar({ isAdmin, ...props }: AppSidebarProps) {
  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className="bg-gradient-to-b from-black to-gray-800"
    >
      <SidebarHeader>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 p-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-colors"
        >
          <div className="flex aspect-square h-12 w-full items-center justify-center rounded-lg">
            <img src="/logo.svg" alt="AlgoMakers.AI" className="h-12 w-full" />
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={isAdmin ? data.consoleNav : data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <UserAvatarMenu showName={true} size="default" className="ml-2" />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

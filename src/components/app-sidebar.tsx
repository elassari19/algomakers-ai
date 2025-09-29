'use client';

import * as React from 'react';
import Link from 'next/link';
import { LayoutDashboard, PieChart, Receipt, Briefcase } from 'lucide-react';

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
    // {
    //   title: 'Explore by Symbols',
    //   url: '/explore',
    //   icon: BarChart2,
    //   hasSubMenu: true,
    //   items: [
    //     { title: 'Top 50 Cryptos', url: '/explore/cryptos' },
    //     { title: 'Top 100 Stocks', url: '/explore/stocks' },
    //     { title: 'Top 10 Forex', url: '/explore/forex' },
    //     { title: 'Top 10 Futures', url: '/explore/futures' },
    //   ],
    // },
    // {
    //   title: 'Top Backtests',
    //   url: '/backtests',
    //   icon: BarChart2,
    //   hasSubMenu: true,
    //   items: [
    //     {
    //       title: 'Crypto',
    //       url: '/backtests/crypto',
    //       hasSubMenu: true,
    //       items: [
    //         { title: 'All', url: '/backtests/crypto/all' },
    //         { title: 'Intraday', url: '/backtests/crypto/intraday' },
    //         { title: 'Swing', url: '/backtests/crypto/swing' },
    //         { title: 'Long Term', url: '/backtests/crypto/long-term' },
    //         { title: 'Recent', url: '/backtests/crypto/recent' },
    //       ],
    //     },
    //     {
    //       title: 'Stock',
    //       url: '/backtests/stock',
    //       hasSubMenu: true,
    //       items: [
    //         { title: 'All', url: '/backtests/stock/all' },
    //         { title: 'Intraday', url: '/backtests/stock/intraday' },
    //         { title: 'Swing', url: '/backtests/stock/swing' },
    //         { title: 'Long term', url: '/backtests/stock/long-term' },
    //         { title: 'Recent', url: '/backtests/stock/recent' },
    //       ],
    //     },
    //     {
    //       title: 'Forex',
    //       url: '/backtests/forex',
    //       hasSubMenu: true,
    //       items: [
    //         { title: 'All', url: '/backtests/forex/all' },
    //         { title: 'Intraday', url: '/backtests/forex/intraday' },
    //         { title: 'Swing', url: '/backtests/forex/swing' },
    //         { title: 'Long term', url: '/backtests/forex/long-term' },
    //         { title: 'Recent', url: '/backtests/forex/recent' },
    //       ],
    //     },
    //     {
    //       title: 'Futures',
    //       url: '/backtests/futures',
    //       hasSubMenu: true,
    //       items: [
    //         { title: 'All', url: '/backtests/futures/all' },
    //         { title: 'Intraday', url: '/backtests/futures/intraday' },
    //         { title: 'Swing', url: '/backtests/futures/swing' },
    //         { title: 'Long term', url: '/backtests/futures/long-term' },
    //         { title: 'Recent', url: '/backtests/futures/recent' },
    //       ],
    //     },
    //     {
    //       title: 'Usages',
    //       url: '/backtests/usages',
    //       hasSubMenu: true,
    //       items: [
    //         { title: 'Day Trading', url: '/backtests/usages/day-trading' },
    //         { title: 'Swing Trading', url: '/backtests/usages/swing-trading' },
    //         { title: 'Long Term', url: '/backtests/usages/long-term' },
    //       ],
    //     },
    //   ],
    // },
    // {
    //   title: 'Top Strategies',
    //   url: '/strategies',
    //   icon: LineChart,
    //   badge: 'PREMIUM',
    // },
    // {
    //   title: 'Favorites',
    //   url: '/favorites',
    //   icon: Star,
    // },
    // {
    //   title: 'Help',
    //   url: '/help',
    //   icon: HelpCircle,
    // },
    // {
    //   title: 'Download Extension',
    //   url: '/extension',
    //   icon: Puzzle,
    // },
    // {
    //   title: 'Trade Ideas',
    //   url: '/ideas',
    //   icon: Lightbulb,
    // },
    // {
    //   title: 'Watchlist',
    //   url: '/watchlist',
    //   icon: Pin,
    // },
    // {
    //   title: 'Find my strategy',
    //   url: '/find-strategy',
    //   icon: Search,
    //   highlight: true,
    // },
    // {
    //   title: 'Free Tools',
    //   url: '/tools',
    //   icon: Wrench,
    // },
    // {
    //   title: 'Plans',
    //   url: '/plans',
    //   icon: ArrowUpRight,
    //   highlightGradient: true,
    // },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <UserAvatarMenu showName={true} size="default" className="ml-2" />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

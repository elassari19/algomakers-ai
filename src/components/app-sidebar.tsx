'use client';

import * as React from 'react';
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  LayoutDashboard,
  Map,
  PieChart,
  Puzzle,
  Search,
  Settings2,
  SquareTerminal,
  Star,
  Wrench,
  Lightbulb,
  Pin,
  HelpCircle,
  ArrowUpRight,
  BarChart2,
  LineChart,
} from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';

// This is sample data.
const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: Command,
      plan: 'Free',
    },
  ],
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: 'Explore by Symbols',
      url: '/explore',
      icon: BarChart2,
      hasSubMenu: true,
      items: [
        { title: 'Top 50 Cryptos', url: '/explore/cryptos' },
        { title: 'Top 100 Stocks', url: '/explore/stocks' },
        { title: 'Top 10 Forex', url: '/explore/forex' },
        { title: 'Top 10 Futures', url: '/explore/futures' },
      ],
    },
    {
      title: 'Top Backtests',
      url: '/backtests',
      icon: BarChart2,
      hasSubMenu: true,
      items: [
        {
          title: 'Crypto',
          url: '/backtests/crypto',
          hasSubMenu: true,
          items: [
            { title: 'All', url: '/backtests/crypto/all' },
            { title: 'Intraday', url: '/backtests/crypto/intraday' },
            { title: 'Swing', url: '/backtests/crypto/swing' },
            { title: 'Long Term', url: '/backtests/crypto/long-term' },
            { title: 'Recent', url: '/backtests/crypto/recent' },
          ],
        },
        {
          title: 'Stock',
          url: '/backtests/stock',
          hasSubMenu: true,
          items: [
            { title: 'All', url: '/backtests/stock/all' },
            { title: 'Intraday', url: '/backtests/stock/intraday' },
            { title: 'Swing', url: '/backtests/stock/swing' },
            { title: 'Long term', url: '/backtests/stock/long-term' },
            { title: 'Recent', url: '/backtests/stock/recent' },
          ],
        },
        {
          title: 'Forex',
          url: '/backtests/forex',
          hasSubMenu: true,
          items: [
            { title: 'All', url: '/backtests/forex/all' },
            { title: 'Intraday', url: '/backtests/forex/intraday' },
            { title: 'Swing', url: '/backtests/forex/swing' },
            { title: 'Long term', url: '/backtests/forex/long-term' },
            { title: 'Recent', url: '/backtests/forex/recent' },
          ],
        },
        {
          title: 'Futures',
          url: '/backtests/futures',
          hasSubMenu: true,
          items: [
            { title: 'All', url: '/backtests/futures/all' },
            { title: 'Intraday', url: '/backtests/futures/intraday' },
            { title: 'Swing', url: '/backtests/futures/swing' },
            { title: 'Long term', url: '/backtests/futures/long-term' },
            { title: 'Recent', url: '/backtests/futures/recent' },
          ],
        },
        {
          title: 'Usages',
          url: '/backtests/usages',
          hasSubMenu: true,
          items: [
            { title: 'Day Trading', url: '/backtests/usages/day-trading' },
            { title: 'Swing Trading', url: '/backtests/usages/swing-trading' },
            { title: 'Long Term', url: '/backtests/usages/long-term' },
          ],
        },
      ],
    },
    {
      title: 'Top Strategies',
      url: '/strategies',
      icon: LineChart,
      badge: 'PREMIUM',
    },
    {
      title: 'Favorites',
      url: '/favorites',
      icon: Star,
    },
    {
      title: 'Help',
      url: '/help',
      icon: HelpCircle,
    },
    {
      title: 'Download Extension',
      url: '/extension',
      icon: Puzzle,
    },
    {
      title: 'Trade Ideas',
      url: '/ideas',
      icon: Lightbulb,
    },
    {
      title: 'Watchlist',
      url: '/watchlist',
      icon: Pin,
    },
    {
      title: 'Find my strategy',
      url: '/find-strategy',
      icon: Search,
      highlight: true,
    },
    {
      title: 'Free Tools',
      url: '/tools',
      icon: Wrench,
    },
    {
      title: 'Plans',
      url: '/plans',
      icon: ArrowUpRight,
      highlightGradient: true,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

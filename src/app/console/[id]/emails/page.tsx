'use client';

import React, { useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Card } from '@/components/ui/card';
import { GradientBackground } from '@/components/ui/gradient-background';
import { OverviewSection } from '@/components/dashboard/DashboardStats';
import {
  Send,
  CheckCircle,
  Eye,
  BarChart3,
  Filter,
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { TemplatesTab } from './TemplatesTab';
import { EmailsTab } from './EmailsTab';
import { CampaignsTab } from './CampaignsTab';
import { SearchInput } from '@/components/SearchInput';

interface IStats {
  emailsSent: number;
  emailsFailed: number;
  totalTemplates: number;
  totalCampaigns: number;
}

const EmailMarketingPage = () => {
  const [stats, setStats] = useState<IStats>({
    emailsSent: 0,
    emailsFailed: 0,
    totalTemplates: 0,
    totalCampaigns: 0,
  });

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/emails/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <GradientBackground>
      <Toaster position="top-center" />
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Stats Overview */}
          <OverviewSection
            overviewData={[
              {
                title: 'Total Sent',
                currentValue: stats.emailsSent.toLocaleString(),
                icon: Send,
                description: 'Successfully delivered',
                color: 'text-blue-300',
                bgColor: 'bg-blue-400/20',
              },
              {
                title: 'Total Failed',
                currentValue: stats.emailsFailed.toLocaleString(),
                icon: CheckCircle,
                description: 'Emails Failed',
                color: 'text-green-300',
                bgColor: 'bg-green-400/20',
              },
              {
                title: 'Total Templates',
                currentValue: stats.totalTemplates.toLocaleString(),
                icon: Eye,
                description: 'Emails Templates',
                color: 'text-purple-300',
                bgColor: 'bg-purple-400/20',
              },
              {
                title: 'Total Campaigns',
                currentValue: stats.totalCampaigns.toLocaleString(),
                icon: BarChart3,
                description: 'Emails Campaigns',
                color: 'text-orange-300',
                bgColor: 'bg-orange-400/20',
              },
            ]}
            className="opacity-95"
          />

          {/* Email Filtering */}
          <div className="w-full sm:w-sm flex items-center space-x-4">
            <Filter className='size-5' /> <SearchInput placeholder="Search emails, templates, campaigns..." />
          </div>

          <Card className="bg-white/5 backdrop-blur-md border-white/20 shadow-xl p-4 pt-0">
            {/* Email Management Tabs */}
            <Tabs defaultValue="emails" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-zinc-800/50 border border-zinc-700/60">
                <TabsTrigger value="emails" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-300">
                  Emails
                </TabsTrigger>
                <TabsTrigger value="templates" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-300">
                  Templates
                </TabsTrigger>
                <TabsTrigger value="campaigns" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-300">
                  Campaigns
                </TabsTrigger>
              </TabsList>

              {/* Templates Tab */}
              <TabsContent value="templates" className="space-y-6">
                <TemplatesTab/>
              </TabsContent>

            {/* Emails Tab */}
            <TabsContent value="emails" className="space-y-6">
              <EmailsTab />
            </TabsContent>

              {/* Campaigns Tab */}
              <TabsContent value="campaigns" className="space-y-6">
                <CampaignsTab />
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </GradientBackground>
  );
};

export default EmailMarketingPage;

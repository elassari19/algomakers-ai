'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GradientBackground } from '@/components/ui/gradient-background';
import { SearchInput } from '@/components/SearchInput';
import { OverviewSection } from '@/components/dashboard/DashboardStats';
import {
  Mail,
  Send,
  CheckCircle,
  Plus,
  Upload,
  Eye,
  Edit,
  Trash2,
  BarChart3,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { TemplatesTab } from './TemplatesTab';
import { EmailsTab } from './EmailsTab';
import { CampaignsTab } from './CampaignsTab';
import { FetchInput } from '@/components/ui/fetch-input';
import { Column } from '@/components/ui/reusable-table';
import { EmailCampaign } from '@/generated/prisma';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'MARKETING' | 'TRANSACTIONAL' | 'ANNOUNCEMENT';
  createdAt: string;
}

interface EmailRecord {
  id: string;
  to: string;
  from: string;
  subject: string;
  body: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  attempts: number;
  error?: string;
  sentAt?: string;
  userId?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const EmailMarketingPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const consoleId = params.id as string;
  const searchTerm = searchParams.get('q') || '';

  // States
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [createCampaignDialog, setCreateCampaignDialog] = useState(false);
  const [createTemplateDialog, setCreateTemplateDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  
  // Form states
  const [campaignForm, setCampaignForm] = useState({
    subject: '',
    content: '',
    recipients: '',
    templateId: '',
  });
  
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    content: '',
    type: 'MARKETING' as const,
  });

  console.log('campaignForm', 'campaignForm');
  // Handle create campaign

  const handleCreateCampaign = async () => {
    try {
      console.log('campaign', campaignForm.subject, campaignForm.content, campaignForm.recipients)
      if (!campaignForm.subject || !campaignForm.content || campaignForm.recipients.length === 0) {
        toast.error('Please fill in all required fields and select recipients');
        return;
      }

      const recipients = campaignForm.recipients.split('\n').map(email => email.trim()).filter(email => email);

      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: campaignForm.subject,
          content: campaignForm.content,
          recipients,
          templateId: campaignForm.templateId || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCampaigns(prev => [data.campaign, ...prev]);
        setCreateCampaignDialog(false);
        setCampaignForm({
          subject: '',
          content: '',
          recipients: '',
          templateId: '',
        });
        toast.success(`Email campaign sent to ${recipients.length} recipients`);
      } else {
        toast.error(data.message || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    }
  };

  // Handle create template
  const handleCreateTemplate = async () => {
    try {
      if (!templateForm.name || !templateForm.subject || !templateForm.content) {
        toast.error('Please fill in all required fields');
        return;
      }

      const newTemplate: EmailTemplate = {
        id: `temp-${Date.now()}`,
        name: templateForm.name,
        subject: templateForm.subject,
        content: templateForm.content,
        type: templateForm.type,
        createdAt: new Date().toISOString(),
      };

      setTemplates(prev => [newTemplate, ...prev]);
      setCreateTemplateDialog(false);
      setTemplateForm({
        name: '',
        subject: '',
        content: '',
        type: 'MARKETING',
      });
      
      toast.success('Template created successfully');
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  };

  // Calculate stats
  const totalSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
  const totalDelivered = campaigns.reduce((sum, c) => sum + c.deliveredCount, 0);
  const totalOpened = campaigns.reduce((sum, c) => sum + c.openedCount, 0);
  const totalClicked = campaigns.reduce((sum, c) => sum + c.clickedCount, 0);

  return (
    <GradientBackground>
      <Toaster position="top-center" />
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                Email Marketing
              </h1>
              <p className="text-sm text-white/70">
                Send targeted email campaigns and manage templates
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-64">
                <SearchInput placeholder="Search campaigns..." />
              </div>
              
              <Dialog open={createTemplateDialog} onOpenChange={setCreateTemplateDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Create Email Template
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Template Name</label>
                      <Input
                        value={templateForm.name}
                        onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                        className="bg-zinc-800 border-zinc-600 text-white"
                        placeholder="e.g., Weekly Newsletter"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Type</label>
                      <Select value={templateForm.type} onValueChange={(value) => setTemplateForm({ ...templateForm, type: value as any })}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MARKETING">Marketing</SelectItem>
                          <SelectItem value="TRANSACTIONAL">Transactional</SelectItem>
                          <SelectItem value="ANNOUNCEMENT">Announcement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Subject</label>
                      <Input
                        value={templateForm.subject}
                        onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                        className="bg-zinc-800 border-zinc-600 text-white"
                        placeholder="Use {{variables}} for dynamic content"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Content</label>
                      <Textarea
                        value={templateForm.content}
                        onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                        className="bg-zinc-800 border-zinc-600 text-white"
                        rows={8}
                        placeholder="Email content with {{variables}} for personalization..."
                      />
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setCreateTemplateDialog(false)}
                        className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateTemplate}
                        disabled={!templateForm.name || !templateForm.subject || !templateForm.content}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                      >
                        Create Template
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={createCampaignDialog} onOpenChange={setCreateCampaignDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
                    <Send className="h-4 w-4 mr-2" />
                    New Campaign
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                      <Send className="h-5 w-5" />
                      Create Email Campaign
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Template (Optional)</label>
                      <FetchInput
                        model="emailTemplate"
                        target="name,subject"
                        placeholder="Search templates..."
                        onSelect={(template) => {
                          const t = (Array.isArray(template) ? (template as any[])[0] : template) as EmailTemplate;
                          if (!t) return;
                          setCampaignForm({
                            ...campaignForm,
                            templateId: t.id,
                            subject: t.subject,
                            content: t.content,
                          });
                        }}
                        getLabel={(template) => ((template as EmailTemplate).name)}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Subject Line</label>
                      <Input
                        value={campaignForm.subject}
                        onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                        className="bg-zinc-800 border-zinc-600 text-white"
                        placeholder="Enter email subject..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Email Content</label>
                      <Textarea
                        value={campaignForm.content}
                        onChange={(e) => setCampaignForm({ ...campaignForm, content: e.target.value })}
                        className="bg-zinc-800 border-zinc-600 text-white"
                        rows={6}
                        placeholder="Write your email content here..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Recipients</label>
                      <FetchInput
                        model="user"
                        target="name,email,tradingviewUsername,status,role"
                        placeholder="Search users..."
                        multiple
                        includeSelectAll
                        onSelect={(selectedUsers) => {
                          const emails = (selectedUsers as any[]).map(u => u.email).join('\n');
                          setCampaignForm({ ...campaignForm, recipients: emails });
                        }}
                        getLabel={(user) => user.name || user.email}
                        className="w-full"
                      />
                      <p className="text-xs text-zinc-400">
                        {campaignForm.recipients.split('\n').filter(email => email.trim()).length} recipients
                      </p>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setCreateCampaignDialog(false)}
                        className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateCampaign}
                        disabled={!campaignForm.subject || !campaignForm.content || !campaignForm.recipients}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Campign
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Overview */}
          <OverviewSection
            overviewData={[
              {
                title: 'Total Sent',
                currentValue: totalSent.toLocaleString(),
                icon: Send,
                description: 'Email campaigns sent',
                pastValue: `${campaigns.length} campaigns`,
                color: 'text-blue-300',
                bgColor: 'bg-blue-400/20',
              },
              {
                title: 'Delivered',
                currentValue: totalDelivered.toLocaleString(),
                icon: CheckCircle,
                description: 'Successfully delivered',
                pastValue: `${totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : 0}% delivery rate`,
                color: 'text-green-300',
                bgColor: 'bg-green-400/20',
              },
              {
                title: 'Opened',
                currentValue: totalOpened.toLocaleString(),
                icon: Eye,
                description: 'Emails opened',
                pastValue: `${totalDelivered > 0 ? ((totalOpened / totalDelivered) * 100).toFixed(1) : 0}% open rate`,
                color: 'text-purple-300',
                bgColor: 'bg-purple-400/20',
              },
              {
                title: 'Clicked',
                currentValue: totalClicked.toLocaleString(),
                icon: BarChart3,
                description: 'Link clicks',
                pastValue: `${totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) : 0}% click rate`,
                color: 'text-orange-300',
                bgColor: 'bg-orange-400/20',
              },
            ]}
            className="opacity-95"
          />

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
                <TemplatesTab
                  templates={templates}
                  setTemplates={setTemplates}
                  createTemplateDialog={createTemplateDialog}
                  setCreateTemplateDialog={setCreateTemplateDialog}
                />
              </TabsContent>

            {/* Emails Tab */}
            <TabsContent value="emails" className="space-y-6">
              <EmailsTab />
            </TabsContent>

              {/* Campaigns Tab */}
              <TabsContent value="campaigns" className="space-y-6">
                <CampaignsTab
                  campaigns={campaigns}
                  setCampaigns={setCampaigns}
                  loading={loading}
                />
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </GradientBackground>
  );
};

export default EmailMarketingPage;

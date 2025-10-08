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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ReusableTable, Column } from '@/components/ui/reusable-table';

interface EmailCampaign {
  id: string;
  subject: string;
  content: string;
  recipientCount: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  status: 'DRAFT' | 'SENDING' | 'SENT' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'MARKETING' | 'TRANSACTIONAL' | 'ANNOUNCEMENT';
  createdAt: string;
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
  const [importDialog, setImportDialog] = useState(false);
  
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

  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [recipientList, setRecipientList] = useState<string>('');

  // Generate dummy data
  const generateDummyData = () => {
    const dummyCampaigns: EmailCampaign[] = [
      {
        id: 'camp-1',
        subject: 'New Trading Algorithm Launch 🚀',
        content: 'Discover our latest AI-powered trading algorithm with 95% accuracy rate...',
        recipientCount: 1250,
        sentCount: 1250,
        deliveredCount: 1205,
        openedCount: 845,
        clickedCount: 234,
        bouncedCount: 45,
        status: 'SENT',
        createdAt: '2024-10-05T10:30:00Z',
        updatedAt: '2024-10-05T11:45:00Z',
      },
      {
        id: 'camp-2',
        subject: 'Weekly Market Analysis & Insights',
        content: 'This week market performance and our top picks for next week...',
        recipientCount: 2340,
        sentCount: 2340,
        deliveredCount: 2298,
        openedCount: 1567,
        clickedCount: 445,
        bouncedCount: 42,
        status: 'SENT',
        createdAt: '2024-10-02T09:15:00Z',
        updatedAt: '2024-10-02T10:30:00Z',
      },
      {
        id: 'camp-3',
        subject: 'Premium Features Now Available',
        content: 'Upgrade to premium and get access to advanced trading signals...',
        recipientCount: 890,
        sentCount: 0,
        deliveredCount: 0,
        openedCount: 0,
        clickedCount: 0,
        bouncedCount: 0,
        status: 'DRAFT',
        createdAt: '2024-10-07T16:20:00Z',
        updatedAt: '2024-10-07T16:20:00Z',
      }
    ];

    const dummyTemplates: EmailTemplate[] = [
      {
        id: 'temp-1',
        name: 'Product Launch',
        subject: 'Introducing {{product_name}} - Revolutionary Trading Tool',
        content: 'Dear {{user_name}},\n\nWe are excited to announce the launch of {{product_name}}...',
        type: 'MARKETING',
        createdAt: '2024-09-15T10:00:00Z',
      },
      {
        id: 'temp-2',
        name: 'Weekly Newsletter',
        subject: 'Weekly Market Roundup - {{date}}',
        content: 'Hello {{user_name}},\n\nHere is your weekly market analysis...',
        type: 'MARKETING',
        createdAt: '2024-09-10T14:30:00Z',
      },
      {
        id: 'temp-3',
        name: 'System Maintenance',
        subject: 'Scheduled Maintenance Notice',
        content: 'Dear users,\n\nWe will be performing system maintenance on {{date}}...',
        type: 'ANNOUNCEMENT',
        createdAt: '2024-09-05T11:15:00Z',
      }
    ];

    return { dummyCampaigns, dummyTemplates };
  };

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      // Simulate API calls
      const { dummyCampaigns, dummyTemplates } = generateDummyData();
      setCampaigns(dummyCampaigns);
      setTemplates(dummyTemplates);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load email data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle create campaign
  const handleCreateCampaign = async () => {
    try {
      if (!campaignForm.subject || !campaignForm.content || !campaignForm.recipients) {
        toast.error('Please fill in all required fields');
        return;
      }

      const recipients = campaignForm.recipients.split('\n').filter(email => email.trim());
      
      // Simulate API call
      const newCampaign: EmailCampaign = {
        id: `camp-${Date.now()}`,
        subject: campaignForm.subject,
        content: campaignForm.content,
        recipientCount: recipients.length,
        sentCount: recipients.length,
        deliveredCount: Math.floor(recipients.length * 0.96),
        openedCount: Math.floor(recipients.length * 0.65),
        clickedCount: Math.floor(recipients.length * 0.18),
        bouncedCount: Math.floor(recipients.length * 0.04),
        status: 'SENT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setCampaigns(prev => [newCampaign, ...prev]);
      setCreateCampaignDialog(false);
      setCampaignForm({
        subject: '',
        content: '',
        recipients: '',
        templateId: '',
      });
      
      toast.success(`Email campaign sent to ${recipients.length} recipients`);
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

  // Handle delete campaign
  const handleDeleteCampaign = async () => {
    try {
      if (!selectedCampaign) return;
      
      setCampaigns(prev => prev.filter(c => c.id !== selectedCampaign.id));
      setDeleteDialog(false);
      setSelectedCampaign(null);
      toast.success('Campaign deleted successfully');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    }
  };

  // Handle import recipients
  const handleImportRecipients = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const emails = content.split('\n').map(line => line.trim()).filter(line => line);
      setRecipientList(emails.join('\n'));
      setCampaignForm(prev => ({ ...prev, recipients: emails.join('\n') }));
      toast.success(`Imported ${emails.length} email addresses`);
    };
    reader.readAsText(file);
  };

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Table columns
  const columns: Column[] = [
    {
      key: 'subject',
      header: 'Subject',
      sortable: true,
      render: (value, row) => (
        <div className="max-w-xs">
          <p className="font-medium text-white truncate">{value}</p>
          <p className="text-xs text-zinc-400">
            Created {new Date(row.createdAt).toLocaleDateString()}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value) => (
        <Badge 
          className={
            value === 'SENT' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
            value === 'SENDING' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
            value === 'DRAFT' ? 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' :
            'bg-red-500/20 text-red-400 border-red-500/30'
          }
        >
          {value}
        </Badge>
      ),
    },
    {
      key: 'recipientCount',
      header: 'Recipients',
      sortable: true,
      align: 'center',
      render: (value) => (
        <span className="font-semibold text-white">{value?.toLocaleString()}</span>
      ),
    },
    {
      key: 'deliveredCount',
      header: 'Delivered',
      sortable: true,
      align: 'center',
      render: (value, row) => (
        <div className="text-center">
          <span className="font-semibold text-green-400">{value?.toLocaleString() || 0}</span>
          <p className="text-xs text-zinc-400">
            {row.recipientCount > 0 ? ((value / row.recipientCount) * 100).toFixed(1) : 0}%
          </p>
        </div>
      ),
    },
    {
      key: 'openedCount',
      header: 'Opened',
      sortable: true,
      align: 'center',
      render: (value, row) => (
        <div className="text-center">
          <span className="font-semibold text-blue-400">{value?.toLocaleString() || 0}</span>
          <p className="text-xs text-zinc-400">
            {row.deliveredCount > 0 ? ((value / row.deliveredCount) * 100).toFixed(1) : 0}%
          </p>
        </div>
      ),
    },
    {
      key: 'clickedCount',
      header: 'Clicked',
      sortable: true,
      align: 'center',
      render: (value, row) => (
        <div className="text-center">
          <span className="font-semibold text-purple-400">{value?.toLocaleString() || 0}</span>
          <p className="text-xs text-zinc-400">
            {row.openedCount > 0 ? ((value / row.openedCount) * 100).toFixed(1) : 0}%
          </p>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCampaign(row);
              setPreviewDialog(true);
            }}
            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
            title="Preview"
          >
            <Eye size={16} />
          </Button>
          
          {row.status === 'DRAFT' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // Handle edit
              }}
              className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/20"
              title="Edit"
            >
              <Edit size={16} />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCampaign(row);
              setDeleteDialog(true);
            }}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
            title="Delete"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

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
                      <Select value={campaignForm.templateId} onValueChange={(value) => {
                        setCampaignForm({ ...campaignForm, templateId: value });
                        if (value) {
                          const template = templates.find(t => t.id === value);
                          if (template) {
                            setCampaignForm(prev => ({
                              ...prev,
                              subject: template.subject,
                              content: template.content,
                            }));
                          }
                        }
                      }}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white">
                          <SelectValue placeholder="Choose template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map(template => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-white">Recipients</label>
                        <div className="flex gap-2">
                          <input
                            type="file"
                            accept=".txt,.csv"
                            onChange={handleImportRecipients}
                            className="hidden"
                            id="import-emails"
                          />
                          <label htmlFor="import-emails">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                              asChild
                            >
                              <span>
                                <Upload className="h-4 w-4 mr-1" />
                                Import
                              </span>
                            </Button>
                          </label>
                        </div>
                      </div>
                      <Textarea
                        value={campaignForm.recipients}
                        onChange={(e) => setCampaignForm({ ...campaignForm, recipients: e.target.value })}
                        className="bg-zinc-800 border-zinc-600 text-white"
                        rows={4}
                        placeholder="Enter email addresses (one per line)&#10;example1@email.com&#10;example2@email.com"
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
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send Now
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

          {/* Campaigns Table */}
          <Card className="bg-white/5 backdrop-blur-md border-white/20 shadow-xl">
            <div className="p-6">
              <ReusableTable
                data={filteredCampaigns}
                columns={columns}
                title="Email Campaigns"
                subtitle="Manage and track your email marketing campaigns"
                isLoading={loading}
                itemsPerPage={10}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Campaign Preview</DialogTitle>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-400">Subject:</label>
                <p className="text-white font-medium">{selectedCampaign.subject}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-zinc-400">Content:</label>
                <div className="mt-2 p-4 bg-zinc-800/50 rounded-lg border border-zinc-600/30">
                  <div className="whitespace-pre-wrap text-sm text-zinc-200">
                    {selectedCampaign.content}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-700">
                <div>
                  <p className="text-sm text-zinc-400">Recipients: <span className="text-white font-medium">{selectedCampaign.recipientCount}</span></p>
                  <p className="text-sm text-zinc-400">Status: <span className="text-white font-medium">{selectedCampaign.status}</span></p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Created: <span className="text-white font-medium">{new Date(selectedCampaign.createdAt).toLocaleDateString()}</span></p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              Delete Campaign
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-300">
              Are you sure you want to delete the campaign "{selectedCampaign?.subject}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-700 text-white border-zinc-600 hover:bg-zinc-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCampaign}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GradientBackground>
  );
};

export default EmailMarketingPage;

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Send, Eye, Edit, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

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

interface CampaignsTabProps {
  campaigns: EmailCampaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<EmailCampaign[]>>;
  loading: boolean;
}

export const CampaignsTab: React.FC<CampaignsTabProps> = ({
  campaigns,
  setCampaigns,
  loading,
}) => {
  const [createCampaignDialog, setCreateCampaignDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [importDialog, setImportDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [recipientList, setRecipientList] = useState<string>('');

  const [campaignForm, setCampaignForm] = useState({
    subject: '',
    content: '',
    recipients: '',
    templateId: '',
  });

  // Fetch campaigns on mount
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setCampaigns([]); // Clear existing data
      const response = await fetch('/api/emails?type=campaigns');
      const data = await response.json();

      if (data.success) {
        setCampaigns(data.campaigns);
      } else {
        toast.error('Failed to fetch campaigns');
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to fetch campaigns');
    }
  };

  const handleCreateCampaign = async () => {
    try {
      if (!campaignForm.subject || !campaignForm.content || !campaignForm.recipients) {
        toast.error('Please fill in all required fields');
        return;
      }

      const recipients = campaignForm.recipients.split('\n').filter(email => email.trim());

      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: campaignForm.subject,
          content: campaignForm.content,
          recipients,
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

  const handleDeleteCampaign = async () => {
    try {
      if (!selectedCampaign) return;

      const response = await fetch(`/api/emails/${selectedCampaign.id}?type=campaigns`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setCampaigns(prev => prev.filter(c => c.id !== selectedCampaign.id));
        setDeleteDialog(false);
        setSelectedCampaign(null);
        toast.success('Campaign deleted successfully');
      } else {
        toast.error(data.message || 'Failed to delete campaign');
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    }
  };

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
    campaign.subject.toLowerCase().includes('') ||
    campaign.status.toLowerCase().includes('')
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

  return (
    <>
      {/* Campaigns Table */}
      <div >
        <ReusableTable
          data={filteredCampaigns}
          columns={columns}
          title="Email Campaigns"
          subtitle="Manage and track your email marketing campaigns"
          isLoading={loading}
          itemsPerPage={10}
        />
      </div>

      {/* Create Campaign Dialog */}
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
              <label className="text-sm font-medium text-zinc-300">Campaign Subject</label>
              <Input
                value={campaignForm.subject}
                onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                className="bg-zinc-800 border-zinc-600 text-white"
                placeholder="Enter email subject..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Email Content</label>
              <Textarea
                value={campaignForm.content}
                onChange={(e) => setCampaignForm({ ...campaignForm, content: e.target.value })}
                className="bg-zinc-800 border-zinc-600 text-white"
                rows={6}
                placeholder="Write your email content here..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Recipients</label>
              <Textarea
                value={campaignForm.recipients}
                onChange={(e) => setCampaignForm({ ...campaignForm, recipients: e.target.value })}
                className="bg-zinc-800 border-zinc-600 text-white"
                rows={4}
                placeholder="Enter email addresses (one per line)&#10;example1@email.com&#10;example2@email.com"
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImportDialog(true)}
                  className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>
                <span className="text-xs text-zinc-400">
                  {campaignForm.recipients.split('\n').filter(email => email.trim()).length} recipients
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCreateCampaign}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Campaign
              </Button>
              <Button
                variant="outline"
                onClick={() => setCreateCampaignDialog(false)}
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Recipients Dialog */}
      <Dialog open={importDialog} onOpenChange={setImportDialog}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Recipients
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">CSV File</label>
              <Input
                type="file"
                accept=".csv,.txt"
                onChange={handleImportRecipients}
                className="bg-zinc-800 border-zinc-600 text-white"
              />
              <p className="text-xs text-zinc-400">
                Upload a CSV or TXT file with one email address per line
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
    </>
  );
};
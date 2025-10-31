import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ReusableTable, Column } from '@/components/ui/reusable-table';
import { Eye, Edit, Trash2, SendIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import FetchInput from '@/components/ui/fetch-input';
import { EmailCampaign } from '@/generated/prisma';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'MARKETING' | 'TRANSACTIONAL' | 'ANNOUNCEMENT';
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  inviteStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export const CampaignsTab: React.FC = () => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [createCampaignDialog, setCreateCampaignDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [sending, setSending] = useState(false);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  // Create campaign form state (moved from page.tsx)
  const [campaignForm, setCampaignForm] = useState({
    subject: '',
    content: '',
    recipients: '',
    templateId: '',
  });

  const [editForm, setEditForm] = useState({
    subject: '',
    content: '',
    recipients: '',
  });

  // Fetch campaigns on mount
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setCampaignsLoading(true);
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
    } finally {
      setCampaignsLoading(false);
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

  const handleEditCampaign = (campaign: EmailCampaign) => {
    setSelectedCampaign(campaign);
    setEditForm({
      subject: campaign.subject,
      content: campaign.content,
      recipients: '', // We'll need to fetch recipients separately if needed
    });
    setEditDialog(true);
  };

  const handleUpdateCampaign = async () => {
    try {
      if (!selectedCampaign) return;

      const response = await fetch(`/api/emails/${selectedCampaign.id}?type=campaigns`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: editForm.subject,
          content: editForm.content,
          // recipients: editForm.recipients.split(',').map(email => email.trim()).filter(email => email),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCampaigns(prev => prev.map(c => 
          c.id === selectedCampaign.id ? { ...c, ...data.campaign } : c
        ));
        setEditDialog(false);
        setSelectedCampaign(null);
        toast.success('Campaign updated successfully');
      } else {
        toast.error(data.message || 'Failed to update campaign');
      }
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign');
    }
  };

  // Create campaign handler (moved from page.tsx)
  const handleCreateCampaign = async () => {
    try {
      if (!campaignForm.subject || !campaignForm.content || campaignForm.recipients.length === 0) {
        toast.error('Please fill in all required fields and select recipients');
        return;
      }

      const recipients = campaignForm.recipients
        .split('\n')
        .map(email => email.trim())
        .filter(email => email);

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
        setCampaignForm({ subject: '', content: '', recipients: '', templateId: '' });
        toast.success(`Email campaign created successfully`);
      } else {
        toast.error(data.message || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    }
  };

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.subject.toLowerCase().includes('') ||
    campaign.status.toLowerCase().includes('')
  );

  const handleSendCampaign = async () => {
    try {
      if (!selectedCampaign) return;

      setSending(true);

      const response = await fetch(`/api/emails/${selectedCampaign.id}?type=send`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: selectedCampaign.subject,
          content: selectedCampaign.content,
          recipients: selectedCampaign.recipients
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCampaigns(prev => prev.map(c => 
          c.id === selectedCampaign.id ? { ...c, ...data.campaign } : c
        ));
        setPreviewDialog(false);
        setSelectedCampaign(null);
        toast.success(data.message || 'Campaign sent successfully');
      } else {
        toast.error(data.message || 'Failed to send campaign');
      }
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign');
    } finally {
      setSending(false);
    }
  }

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
      key: 'sentCount',
      header: 'Sent',
      sortable: true,
      align: 'center',
      render: (value) => (
        <span className="font-semibold text-white">{value?.toLocaleString()}</span>
      )
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
      key: 'openedIds',
      header: 'Opened',
      sortable: true,
      align: 'center',
      render: (value: string[], row) => (
        <div className="text-center">
          <span className="font-semibold text-blue-400">{value.length?.toLocaleString() || 0}</span>
          <p className="text-xs text-zinc-400">
            {row.deliveredCount > 0 ? ((value.length / row.deliveredCount) * 100).toFixed(1) : 0}%
          </p>
        </div>
      ),
    },
    {
      key: 'clickedIds',
      header: 'Clicked',
      sortable: true,
      align: 'center',
      render: (value: string[], row) => (
        <div className="text-center">
          <span className="font-semibold text-purple-400">{value?.length?.toLocaleString() || 0}</span>
          <p className="text-xs text-zinc-400">
            {row.openedIds.length > 0 ? ((value.length / row.openedIds.length) * 100).toFixed(1) : 0}%
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
            className="text-pink-200 hover:text-pink-300 hover:bg-pink-500/20"
            title="Preview"
          >
            <SendIcon size={16} />
          </Button>

          {row.status === 'DRAFT' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleEditCampaign(row);
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
        <div className="mb-4 flex justify-between items-center">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white mb-1">
            <SendIcon className="h-5 w-5"/> Email Campaigns
          </h2>
          <Dialog open={createCampaignDialog} onOpenChange={setCreateCampaignDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                <SendIcon className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 text-white">
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <SendIcon className="h-5 w-5" />
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
                      const t = (Array.isArray(template) ? (template as any[])[0] : template) as any;
                      if (!t) return;
                      setCampaignForm(prev => ({
                        ...prev,
                        templateId: t.id,
                        subject: t.subject,
                        content: t.content,
                      }));
                    }}
                    getLabel={(template) => ((template as any).name)}
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
                      setCampaignForm(prev => ({ ...prev, recipients: emails }));
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
                    <SendIcon className="h-4 w-4 mr-2" />
                    Add Campaign
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <ReusableTable
          data={filteredCampaigns}
          columns={columns}
          title="Email Campaigns"
          isLoading={campaignsLoading}
          itemsPerPage={10}
        />
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
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPreviewDialog(false);
              }}
              className="bg-zinc-800/50 border-zinc-600/30 text-zinc-300 hover:bg-zinc-700/50"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSendCampaign()}
              disabled={sending}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <SendIcon className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </DialogFooter>
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

      {/* Edit Campaign Sheet */}
      <Sheet open={editDialog} onOpenChange={setEditDialog}>
        <SheetContent className="sm:max-w-md bg-gradient-to-br from-zinc-900 to-zinc-800 border-l border-zinc-700/60 text-white px-6 flex flex-col">
          <SheetHeader>
            <SheetTitle className="text-white flex items-center gap-2">
              <Edit className="h-5 w-5 text-amber-400" />
              Edit Campaign
            </SheetTitle>
            <SheetDescription className="text-zinc-400">
              Update the campaign details below.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-6 mt-6">
            <div className="space-y-2">
              <Label htmlFor="edit-subject" className="text-zinc-300">Subject</Label>
              <Input
                id="edit-subject"
                value={editForm.subject}
                onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                className="bg-zinc-800/50 border-zinc-600/30 text-white placeholder:text-zinc-500"
                placeholder="Enter campaign subject"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-content" className="text-zinc-300">Content</Label>
              <Textarea
                id="edit-content"
                value={editForm.content}
                onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                className="bg-zinc-800/50 border-zinc-600/30 text-white placeholder:text-zinc-500 min-h-[120px]"
                placeholder="Enter campaign content"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-recipients" className="text-zinc-300">Recipients</Label>
              <FetchInput
                model="user"
                target="email"
                placeholder="Search and select recipients"
                multiple={true}
                onSelect={(selected) => {
                  setEditForm(prev => ({
                    ...prev,
                    selectedRecipients: selected as User[]
                  }));
                }}
                getLabel={(user: any) => `${user.name} (${user.email})`}
                className="w-full"
              />
              {editForm.recipients.length > 0 && (
                <div className="text-sm text-zinc-400">
                  {editForm.recipients.length} recipient{editForm.recipients.length !== 1 ? 's' : ''} selected
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-8 pt-6 border-t border-zinc-700/60">
            <Button
              variant="outline"
              onClick={() => setEditDialog(false)}
              className="flex-1 bg-zinc-800/50 border-zinc-600/30 text-zinc-300 hover:bg-zinc-700/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCampaign}
              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Update Campaign
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
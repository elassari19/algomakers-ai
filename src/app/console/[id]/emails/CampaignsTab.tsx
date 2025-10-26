import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Eye, Edit, Trash2, SendIcon } from 'lucide-react';
import { toast } from 'sonner';

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
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);

  // Template and user states
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectAllUsers, setSelectAllUsers] = useState(false);

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

  // Fetch templates and users when create dialog opens
  useEffect(() => {
    if (createCampaignDialog) {
      fetchTemplates();
      fetchUsers();
    }
  }, [createCampaignDialog]);

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

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/emails?type=templates');
      const data = await response.json();

      if (data.success) {
        setTemplates(data.templates);
      } else {
        toast.error('Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to fetch templates');
    }
  };

  const fetchUsers = async (search = '') => {
    try {
      const response = await fetch(`/api/users?search=${encodeURIComponent(search)}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
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
          title={
            <div className='w-full flex justify-between items-center'>
              <h2 className="flex items-center gap-2 text-2xl font-semibold text-white">
                <SendIcon className="h-5 w-5"/> Email Campaigns
              </h2>
            </div>
            }
          subtitle="Manage and track your email marketing campaigns"
          isLoading={loading}
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
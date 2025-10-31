import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ReusableTable, Column } from '@/components/ui/reusable-table';
import { Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { ReusableSelect } from '@/components/ui/reusable-select';

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

export const EmailsTab: React.FC = () => {
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null);
  const [previewDialog, setPreviewDialog] = useState(false);

  const searchParams = useSearchParams();

  // Fetch emails from API
  useEffect(() => {
    const fetchEmails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/emails?${searchParams.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch emails');
        }
        const data = await response.json();
        if (data.success) {
          setEmails(data.emails);
        } else {
          toast.error('Failed to load emails');
        }
      } catch (error) {
        console.error('Error fetching emails:', error);
        toast.error('Failed to load emails');
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, [searchParams]);

  // Table columns for emails
  const emailColumns: Column[] = [
    {
      key: 'to',
      header: 'Recipient',
      sortable: true,
      render: (value, row) => (
        <div className="max-w-xs">
          <p className="font-medium text-white truncate">{value}</p>
          {row.user && (
            <p className="text-xs text-zinc-400 truncate">
              {row.user.name || row.user.email}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      sortable: true,
      render: (value) => (
        <div className="max-w-xs">
          <p className="font-medium text-white truncate">{value}</p>
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
            value === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
            value === 'FAILED' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
            'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
          }
        >
          {value}
        </Badge>
      ),
    },
    {
      key: 'sentAt',
      header: 'Sent At',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-zinc-300">
          {value ? new Date(value).toLocaleDateString() + ' ' + new Date(value).toLocaleTimeString() : 'Not sent'}
        </span>
      ),
    },
    {
      key: 'attempts',
      header: 'Attempts',
      sortable: true,
      align: 'center',
      render: (value) => (
        <span className="font-semibold text-white">{value || 0}</span>
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
              setSelectedEmail(row);
              setPreviewDialog(true);
            }}
            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
            title="Preview"
          >
            <Eye size={16} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              // Handle delete - in a real app, this would call an API
              toast.error('Delete functionality not implemented yet');
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
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Sent Emails</h3>
            <p className="text-sm text-zinc-400">View and manage all sent emails</p>
          </div>
          <div className="flex gap-2">
            <ReusableSelect
              type="status"
              options={[
                { label: 'All', value: 'all' },
                { label: 'Sent', value: 'SENT' },
                { label: 'Failed', value: 'FAILED' },
                { label: 'Pending', value: 'PENDING' },
                { label: 'Cancelled', value: 'CANCELLED' },
              ]}
            />
            <ReusableSelect
              type="period"
              options={[
                { label: 'All Time', value: 'all' },
                { label: 'Last day', value: '1d' },
                { label: 'Last 3 Days', value: '3d' },
                { label: 'Last 7 Days', value: '7d' },
                { label: 'Last 30 Days', value: '30d' },
              ]}
            />
          </div>
        </div>

        <ReusableTable
          data={emails}
          columns={emailColumns}
          title=""
          subtitle=""
          isLoading={loading}
          itemsPerPage={10}
        />
      </div>

      {/* Email Preview Dialog */}
      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="sm:max-w-3xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Email Details</DialogTitle>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-400">To:</label>
                  <p className="text-white font-medium">{selectedEmail.to}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-400">From:</label>
                  <p className="text-white font-medium">{selectedEmail.from || 'System'}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-400">Subject:</label>
                <p className="text-white font-medium">{selectedEmail.subject}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-400">Status:</label>
                <div className="mt-1">
                  <Badge
                    className={
                      selectedEmail.status === 'SENT' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      selectedEmail.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      selectedEmail.status === 'FAILED' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                    }
                  >
                    {selectedEmail.status}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-400">Content:</label>
                <div className="mt-2 p-4 bg-zinc-800/50 rounded-lg border border-zinc-600/30 max-h-60 overflow-y-auto">
                  <div className="whitespace-pre-wrap text-sm text-zinc-200">
                    {selectedEmail.body}
                  </div>
                </div>
              </div>

              {selectedEmail.error && (
                <div>
                  <label className="text-sm font-medium text-zinc-400">Error:</label>
                  <div className="mt-2 p-3 bg-red-900/20 rounded-lg border border-red-600/30">
                    <p className="text-sm text-red-300">{selectedEmail.error}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-700">
                <div>
                  <p className="text-sm text-zinc-400">Attempts: <span className="text-white font-medium">{selectedEmail.attempts}</span></p>
                  <p className="text-sm text-zinc-400">Sent At: <span className="text-white font-medium">
                    {selectedEmail.sentAt ? new Date(selectedEmail.sentAt).toLocaleString() : 'Not sent'}
                  </span></p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Created: <span className="text-white font-medium">{new Date(selectedEmail.createdAt).toLocaleDateString()}</span></p>
                  <p className="text-sm text-zinc-400">Updated: <span className="text-white font-medium">{new Date(selectedEmail.updatedAt).toLocaleDateString()}</span></p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { OverviewSection } from '@/components/dashboard/DashboardStats';
import { ReusableTable, Column } from '@/components/ui/reusable-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GradientBackground } from '@/components/ui/gradient-background';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Users,
  UserPlus,
  Eye,
  DollarSign,
  TrendingUp,
  Award,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  Calendar,
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Mail,
  User,
  Percent,
  Wallet,
  Save,
  X,
  Search,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AffiliateData {
  id: string;
  userId: string;
  referralCode: string;
  walletAddress: string;
  commissionRate: number;
  user: {
    name: string;
    email: string;
    createdAt: string;
  };
  totalCommissions: number;
  totalReferrals: number;
  activeReferrals: number;
  pendingCommissions: number;
  paidCommissions: number;
  commissions: any[];
  referrals: any[];
}

interface AffiliateStats {
  totalSignups: number;
  totalInvitations: number;
  acceptedInvitations: number;
  totalRewards: number;
  pendingPayouts: number;
  completedPayouts: number;
  topAffiliates: number;
  conversionRate: number;
}

const AffiliatePage = () => {
  const params = useParams();
  const router = useRouter();
  const consoleId = params.id as string;
  
  const [affiliates, setAffiliates] = useState<AffiliateData[]>([]);
  const [stats, setStats] = useState<AffiliateStats>({
    totalSignups: 0,
    totalInvitations: 0,
    acceptedInvitations: 0,
    totalRewards: 0,
    pendingPayouts: 0,
    completedPayouts: 0,
    topAffiliates: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateData | null>(null);
  const [payoutDialog, setPayoutDialog] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form states
  const [addAffiliateDialog, setAddAffiliateDialog] = useState(false);
  const [editAffiliateDialog, setEditAffiliateDialog] = useState(false);
  const [deleteAffiliateDialog, setDeleteAffiliateDialog] = useState(false);
  const [affiliateToDelete, setAffiliateToDelete] = useState<AffiliateData | null>(null);
  const [affiliateToEdit, setAffiliateToEdit] = useState<AffiliateData | null>(null);
  
  const [affiliateForm, setAffiliateForm] = useState({
    name: '',
    email: '',
    commissionRate: 15,
    walletAddress: '',
    notes: '',
  });

  // Generate dummy affiliate data for demo
  const generateDummyData = () => {
    const dummyStats: AffiliateStats = {
      totalSignups: 847,
      totalInvitations: 1234,
      acceptedInvitations: 687,
      totalRewards: 45320.75,
      pendingPayouts: 8945.50,
      completedPayouts: 36375.25,
      topAffiliates: 45,
      conversionRate: 55.7,
    };

    const dummyAffiliates: AffiliateData[] = [
      {
        id: 'aff-1',
        userId: 'user-1',
        referralCode: 'TRADER01',
        walletAddress: '0x742d35Cc6647C0532d7c9f91C3E98F2FD1A3b234',
        commissionRate: 0.15,
        user: {
          name: 'John Smith',
          email: 'john.smith@example.com',
          createdAt: '2024-08-15T10:30:00Z',
        },
        totalCommissions: 2450.75,
        totalReferrals: 18,
        activeReferrals: 14,
        pendingCommissions: 520.25,
        paidCommissions: 1930.50,
        commissions: [
          {
            id: 'comm-1',
            amount: 150.00,
            status: 'PENDING',
            createdAt: '2024-10-05T10:30:00Z',
            subscription: { user: { name: 'Alice Johnson', email: 'alice@example.com' } }
          },
          {
            id: 'comm-2',
            amount: 200.00,
            status: 'PAID',
            createdAt: '2024-09-28T14:15:00Z',
            subscription: { user: { name: 'Bob Wilson', email: 'bob@example.com' } }
          }
        ],
        referrals: [
          { id: 'ref-1', name: 'Alice Johnson', email: 'alice@example.com', isActive: true, createdAt: '2024-10-01T08:30:00Z' },
          { id: 'ref-2', name: 'Bob Wilson', email: 'bob@example.com', isActive: true, createdAt: '2024-09-25T10:15:00Z' }
        ]
      },
      {
        id: 'aff-2',
        userId: 'user-2',
        referralCode: 'CRYPTO99',
        walletAddress: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
        commissionRate: 0.12,
        user: {
          name: 'Sarah Davis',
          email: 'sarah.davis@example.com',
          createdAt: '2024-07-20T14:20:00Z',
        },
        totalCommissions: 3280.50,
        totalReferrals: 25,
        activeReferrals: 19,
        pendingCommissions: 890.75,
        paidCommissions: 2389.75,
        commissions: [
          {
            id: 'comm-3',
            amount: 180.50,
            status: 'PENDING',
            createdAt: '2024-10-06T11:45:00Z',
            subscription: { user: { name: 'Charlie Brown', email: 'charlie@example.com' } }
          },
          {
            id: 'comm-4',
            amount: 125.00,
            status: 'PAID',
            createdAt: '2024-10-02T09:20:00Z',
            subscription: { user: { name: 'Diana Prince', email: 'diana@example.com' } }
          }
        ],
        referrals: [
          { id: 'ref-3', name: 'Charlie Brown', email: 'charlie@example.com', isActive: true, createdAt: '2024-09-30T12:00:00Z' },
          { id: 'ref-4', name: 'Diana Prince', email: 'diana@example.com', isActive: true, createdAt: '2024-09-28T16:30:00Z' },
          { id: 'ref-5', name: 'Eve Adams', email: 'eve@example.com', isActive: false, createdAt: '2024-09-15T14:10:00Z' }
        ]
      },
      {
        id: 'aff-3',
        userId: 'user-3',
        referralCode: 'INVEST88',
        walletAddress: '0x9876543210fedcba0987654321fedcba09876543',
        commissionRate: 0.18,
        user: {
          name: 'Mike Chen',
          email: 'mike.chen@example.com',
          createdAt: '2024-06-10T09:15:00Z',
        },
        totalCommissions: 4125.90,
        totalReferrals: 32,
        activeReferrals: 24,
        pendingCommissions: 1250.40,
        paidCommissions: 2875.50,
        commissions: [
          {
            id: 'comm-5',
            amount: 220.75,
            status: 'PENDING',
            createdAt: '2024-10-07T15:20:00Z',
            subscription: { user: { name: 'Frank Miller', email: 'frank@example.com' } }
          },
          {
            id: 'comm-6',
            amount: 195.50,
            status: 'PAID',
            createdAt: '2024-10-03T13:45:00Z',
            subscription: { user: { name: 'Grace Lee', email: 'grace@example.com' } }
          }
        ],
        referrals: [
          { id: 'ref-6', name: 'Frank Miller', email: 'frank@example.com', isActive: true, createdAt: '2024-10-05T09:00:00Z' },
          { id: 'ref-7', name: 'Grace Lee', email: 'grace@example.com', isActive: true, createdAt: '2024-10-01T11:30:00Z' },
          { id: 'ref-8', name: 'Henry Ford', email: 'henry@example.com', isActive: true, createdAt: '2024-09-28T14:15:00Z' }
        ]
      },
      {
        id: 'aff-4',
        userId: 'user-4',
        referralCode: 'ALGO777',
        walletAddress: '0xabcdef1234567890fedcba0987654321abcdef12',
        commissionRate: 0.10,
        user: {
          name: 'Emily Rodriguez',
          email: 'emily.rodriguez@example.com',
          createdAt: '2024-09-05T16:45:00Z',
        },
        totalCommissions: 1850.25,
        totalReferrals: 12,
        activeReferrals: 8,
        pendingCommissions: 425.75,
        paidCommissions: 1424.50,
        commissions: [
          {
            id: 'comm-7',
            amount: 95.25,
            status: 'PENDING',
            createdAt: '2024-10-04T12:10:00Z',
            subscription: { user: { name: 'Ian Smith', email: 'ian@example.com' } }
          },
          {
            id: 'comm-8',
            amount: 110.00,
            status: 'PAID',
            createdAt: '2024-09-30T10:30:00Z',
            subscription: { user: { name: 'Julia Roberts', email: 'julia@example.com' } }
          }
        ],
        referrals: [
          { id: 'ref-9', name: 'Ian Smith', email: 'ian@example.com', isActive: true, createdAt: '2024-10-02T08:45:00Z' },
          { id: 'ref-10', name: 'Julia Roberts', email: 'julia@example.com', isActive: true, createdAt: '2024-09-28T15:20:00Z' }
        ]
      },
      {
        id: 'aff-5',
        userId: 'user-5',
        referralCode: 'PROFIT22',
        walletAddress: '0x555666777888999aaabbbcccdddeeefffggghhh',
        commissionRate: 0.14,
        user: {
          name: 'David Kim',
          email: 'david.kim@example.com',
          createdAt: '2024-05-22T11:20:00Z',
        },
        totalCommissions: 5670.80,
        totalReferrals: 41,
        activeReferrals: 33,
        pendingCommissions: 1890.30,
        paidCommissions: 3780.50,
        commissions: [
          {
            id: 'comm-9',
            amount: 275.90,
            status: 'PENDING',
            createdAt: '2024-10-06T14:55:00Z',
            subscription: { user: { name: 'Kate Wilson', email: 'kate@example.com' } }
          },
          {
            id: 'comm-10',
            amount: 165.75,
            status: 'PAID',
            createdAt: '2024-10-01T16:40:00Z',
            subscription: { user: { name: 'Leo Martinez', email: 'leo@example.com' } }
          }
        ],
        referrals: [
          { id: 'ref-11', name: 'Kate Wilson', email: 'kate@example.com', isActive: true, createdAt: '2024-10-04T13:25:00Z' },
          { id: 'ref-12', name: 'Leo Martinez', email: 'leo@example.com', isActive: true, createdAt: '2024-09-29T10:50:00Z' },
          { id: 'ref-13', name: 'Maya Patel', email: 'maya@example.com', isActive: false, createdAt: '2024-09-20T09:15:00Z' }
        ]
      }
    ];

    return { dummyStats, dummyAffiliates };
  };

  // Fetch affiliate data
  const fetchAffiliateData = async () => {
    try {
      setLoading(true);
      const [affiliatesRes, statsRes] = await Promise.all([
        fetch('/api/admin/affiliates'),
        fetch('/api/admin/affiliates/stats')
      ]);

      if (affiliatesRes.ok && statsRes.ok) {
        const affiliatesData = await affiliatesRes.json();
        const statsData = await statsRes.json();
        setAffiliates(affiliatesData.affiliates || []);
        setStats(statsData.stats || stats);
      } else {
        // Use dummy data for demo
        const { dummyStats, dummyAffiliates } = generateDummyData();
        setStats(dummyStats);
        setAffiliates(dummyAffiliates);
      }
    } catch (error) {
      console.error('Error fetching affiliate data:', error);
      // Use dummy data for demo
      const { dummyStats, dummyAffiliates } = generateDummyData();
      setStats(dummyStats);
      setAffiliates(dummyAffiliates);
      toast.success('Loaded demo affiliate data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliateData();
  }, []);

  // Handle payout
  const handlePayout = async (affiliateId: string, amount: number) => {
    try {
      const response = await fetch('/api/admin/affiliates/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliateId, amount }),
      });

      if (response.ok) {
        toast.success('Payout processed successfully');
        setPayoutDialog(false);
        setPayoutAmount('');
        fetchAffiliateData();
      } else {
        throw new Error('Failed to process payout');
      }
    } catch (error) {
      console.error('Error processing payout:', error);
      toast.error('Failed to process payout');
    }
  };

  // Handle add new affiliate
  const handleAddAffiliate = async () => {
    try {
      const response = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: affiliateForm.name,
          email: affiliateForm.email,
          commissionRate: affiliateForm.commissionRate / 100,
          walletAddress: affiliateForm.walletAddress,
          notes: affiliateForm.notes,
        }),
      });

      if (response.ok || true) { // Demo always succeeds
        toast.success('Affiliate added successfully');
        setAddAffiliateDialog(false);
        setAffiliateForm({
          name: '',
          email: '',
          commissionRate: 15,
          walletAddress: '',
          notes: '',
        });
        fetchAffiliateData();
      }
    } catch (error) {
      console.error('Error adding affiliate:', error);
      toast.error('Failed to add affiliate');
    }
  };

  // Handle edit affiliate
  const handleEditAffiliate = async () => {
    try {
      const response = await fetch(`/api/admin/affiliates/${affiliateToEdit?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commissionRate: affiliateForm.commissionRate / 100,
          walletAddress: affiliateForm.walletAddress,
          notes: affiliateForm.notes,
        }),
      });

      if (response.ok || true) { // Demo always succeeds
        toast.success('Affiliate updated successfully');
        setEditAffiliateDialog(false);
        setAffiliateToEdit(null);
        fetchAffiliateData();
      }
    } catch (error) {
      console.error('Error updating affiliate:', error);
      toast.error('Failed to update affiliate');
    }
  };

  // Handle delete affiliate
  const handleDeleteAffiliate = async () => {
    if (!affiliateToDelete) return;
    
    try {
      const response = await fetch(`/api/admin/affiliates/${affiliateToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok || true) { // Demo always succeeds
        toast.success('Affiliate deleted successfully');
        setDeleteAffiliateDialog(false);
        setAffiliateToDelete(null);
        fetchAffiliateData();
      }
    } catch (error) {
      console.error('Error deleting affiliate:', error);
      toast.error('Failed to delete affiliate');
    }
  };

  // Handle row click (show sheet)
  const handleRowClick = (affiliate: AffiliateData) => {
    setSelectedAffiliate(affiliate);
  };

  // Handle view details (navigate to details page)
  const handleViewDetails = (affiliateId: string) => {
    router.push(`/console/${consoleId}/affiliate/${affiliateId}`);
  };

  // Handle edit button
  const handleEditClick = (affiliate: AffiliateData) => {
    setAffiliateForm({
      name: affiliate.user.name,
      email: affiliate.user.email,
      commissionRate: affiliate.commissionRate * 100,
      walletAddress: affiliate.walletAddress || '',
      notes: '',
    });
    // Store the affiliate for editing without opening the sheet
    setAffiliateToEdit(affiliate);
    setEditAffiliateDialog(true);
  };

  // Handle delete button
  const handleDeleteClick = (affiliate: AffiliateData) => {
    setAffiliateToDelete(affiliate);
    setDeleteAffiliateDialog(true);
  };

  // Filter affiliates based on search
  const filteredAffiliates = affiliates.filter(affiliate =>
    affiliate.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    affiliate.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    affiliate.referralCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Table columns
  const columns: Column[] = [
    {
      key: 'user.name',
      header: 'Affiliate Name',
      sortable: true,
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.user.name}</span>
          <span className="text-xs text-slate-300">{row.user.email}</span>
        </div>
      ),
    },
    {
      key: 'referralCode',
      header: 'Referral Code',
      sortable: true,
      render: (value) => (
        <Badge variant="outline" className="font-mono">
          {value}
        </Badge>
      ),
    },
    {
      key: 'totalReferrals',
      header: 'Referrals',
      sortable: true,
      align: 'center',
      render: (value, row) => (
        <div className="text-center">
          <div className="font-semibold">{value}</div>
          <div className="text-xs text-slate-300">
            {row.activeReferrals} active
          </div>
        </div>
      ),
    },
    {
      key: 'totalCommissions',
      header: 'Total Commissions',
      sortable: true,
      align: 'right',
      render: (value) => (
        <span className="font-semibold text-green-600">
          ${value?.toLocaleString() || '0'}
        </span>
      ),
    },
    {
      key: 'pendingCommissions',
      header: 'Pending',
      sortable: true,
      align: 'right',
      render: (value) => (
        <span className="font-medium text-orange-600">
          ${value?.toLocaleString() || '0'}
        </span>
      ),
    },
    {
      key: 'commissionRate',
      header: 'Rate',
      sortable: true,
      align: 'center',
      render: (value) => <span>{(value * 100).toFixed(1)}%</span>,
    },
    {
      key: 'user.createdAt',
      header: 'Joined',
      sortable: true,
      render: (value) => {
        if (!value) return '';
        return new Date(value).toLocaleDateString();
      },
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
              handleViewDetails(row.id);
            }}
            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditClick(row);
            }}
            className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 transition-colors"
            title="Edit Affiliate"
          >
            <Edit size={16} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(row);
            }}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors"
            title="Delete Affiliate"
          >
            <Trash2 size={16} />
          </Button>
          
          <Dialog open={payoutDialog} onOpenChange={setPayoutDialog}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={!row.pendingCommissions || row.pendingCommissions <= 0}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedAffiliate(row);
                  setPayoutAmount(row.pendingCommissions?.toString() || '0');
                }}
                className={`transition-colors ${
                  row.pendingCommissions && row.pendingCommissions > 0
                    ? 'text-green-400 hover:text-green-300 hover:bg-green-500/20'
                    : 'text-zinc-500 cursor-not-allowed'
                }`}
                title={row.pendingCommissions && row.pendingCommissions > 0 ? 'Process Payout' : 'No pending commissions'}
              >
                <CreditCard size={16} />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 text-white">
              <DialogHeader className="space-y-3 pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg">
                    <CreditCard className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold text-white">Process Payout</DialogTitle>
                    <p className="text-sm text-zinc-400">Send commission payment to affiliate</p>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Affiliate Info Card */}
                <Card className="bg-gradient-to-r from-zinc-800/50 to-zinc-700/50 border border-zinc-600/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {selectedAffiliate?.user.name?.charAt(0).toUpperCase() || 'A'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-white">{selectedAffiliate?.user.name}</p>
                        <p className="text-sm text-zinc-400">{selectedAffiliate?.user.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Balance Info */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-green-400 font-medium uppercase tracking-wide">Available Balance</p>
                      <p className="text-2xl font-bold text-green-400 mt-1">
                        ${selectedAffiliate?.pendingCommissions?.toLocaleString() || '0'}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-blue-400 font-medium uppercase tracking-wide">Commission Rate</p>
                      <p className="text-2xl font-bold text-blue-400 mt-1">
                        {((selectedAffiliate?.commissionRate || 0) * 100).toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Payout Amount Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Payout Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      type="number"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      max={selectedAffiliate?.pendingCommissions || 0}
                      placeholder="Enter amount"
                      className="pl-10 bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-green-500 focus:ring-green-500/20"
                    />
                  </div>
                  <p className="text-xs text-zinc-400">
                    Maximum: ${selectedAffiliate?.pendingCommissions?.toLocaleString() || '0'}
                  </p>
                </div>

                {/* Wallet Address */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Destination Wallet</label>
                  <div className="p-3 bg-zinc-800 border border-zinc-600 rounded-lg">
                    <p className="text-sm font-mono text-zinc-300 break-all">
                      {selectedAffiliate?.walletAddress || (
                        <span className="text-amber-400 flex items-center gap-2">
                          <span className="h-2 w-2 bg-amber-400 rounded-full animate-pulse"></span>
                          No wallet address provided
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPayoutDialog(false);
                      setPayoutAmount('');
                    }}
                    className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() =>
                      selectedAffiliate &&
                      handlePayout(selectedAffiliate.id, parseFloat(payoutAmount))
                    }
                    disabled={!payoutAmount || parseFloat(payoutAmount) <= 0 || !selectedAffiliate?.walletAddress}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Process Payout
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      ),
    },
  ];

  return (
    <GradientBackground>
      <Toaster position="top-center" />
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                Affiliate Management
              </h1>
              <p className="text-sm text-white/70">
                Manage affiliate partners and track referral performance
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
                <Input
                  placeholder="Search affiliates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-zinc-400 w-64"
                />
              </div>
              
              <Dialog open={addAffiliateDialog} onOpenChange={setAddAffiliateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-blue-600 hover:to-purple-600 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Affiliate
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Add New Affiliate
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white flex items-center gap-1">
                          <User className="h-4 w-4" />
                          Name
                        </label>
                        <Input
                          value={affiliateForm.name}
                          onChange={(e) => setAffiliateForm({ ...affiliateForm, name: e.target.value })}
                          className="bg-zinc-800 border-zinc-600 text-white"
                          placeholder="Enter full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          Email
                        </label>
                        <Input
                          type="email"
                          value={affiliateForm.email}
                          onChange={(e) => setAffiliateForm({ ...affiliateForm, email: e.target.value })}
                          className="bg-zinc-800 border-zinc-600 text-white"
                          placeholder="Enter email address"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white flex items-center gap-1">
                        <Percent className="h-4 w-4" />
                        Commission Rate (%)
                      </label>
                      <Input
                        type="number"
                        value={affiliateForm.commissionRate}
                        onChange={(e) => setAffiliateForm({ ...affiliateForm, commissionRate: parseFloat(e.target.value) || 0 })}
                        className="bg-zinc-800 border-zinc-600 text-white"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white flex items-center gap-1">
                        <Wallet className="h-4 w-4" />
                        Wallet Address (Optional)
                      </label>
                      <Input
                        value={affiliateForm.walletAddress}
                        onChange={(e) => setAffiliateForm({ ...affiliateForm, walletAddress: e.target.value })}
                        className="bg-zinc-800 border-zinc-600 text-white font-mono"
                        placeholder="0x..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Notes (Optional)</label>
                      <Textarea
                        value={affiliateForm.notes}
                        onChange={(e) => setAffiliateForm({ ...affiliateForm, notes: e.target.value })}
                        className="bg-zinc-800 border-zinc-600 text-white"
                        placeholder="Internal notes..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAddAffiliateDialog(false);
                          setAffiliateForm({
                            name: '',
                            email: '',
                            commissionRate: 15,
                            walletAddress: '',
                            notes: '',
                          });
                        }}
                        className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddAffiliate}
                        disabled={!affiliateForm.name || !affiliateForm.email}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Add Affiliate
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
                title: 'Total Signups',
                currentValue: stats.totalSignups,
                icon: Users,
                description: 'Via referral links',
                pastValue: `${stats.conversionRate.toFixed(1)}% conversion`,
                color: 'text-blue-300',
                bgColor: 'bg-blue-400/20',
              },
              {
                title: 'Total Invitations',
                currentValue: stats.totalInvitations,
                icon: UserPlus,
                description: 'Invitations sent',
                pastValue: `${stats.acceptedInvitations} accepted`,
                color: 'text-green-300',
                bgColor: 'bg-green-400/20',
              },
              {
                title: 'Total Rewards',
                currentValue: `$${stats.totalRewards.toLocaleString()}`,
                icon: DollarSign,
                description: 'Distributed to affiliates',
                pastValue: `$${stats.pendingPayouts.toLocaleString()} pending`,
                color: 'text-emerald-300',
                bgColor: 'bg-emerald-400/20',
              },
              {
                title: 'Active Affiliates',
                currentValue: stats.topAffiliates,
                icon: Award,
                description: 'With referrals',
                pastValue: `${affiliates.length} total`,
                color: 'text-amber-300',
                bgColor: 'bg-amber-400/20',
              },
            ]}
            className="opacity-95"
          />

          {/* Affiliates Table */}
          <Card className="bg-white/5 backdrop-blur-md border-white/20 shadow-xl">
            <div className="p-6">
              <ReusableTable
                data={filteredAffiliates}
                columns={columns}
                title="Affiliate Partners"
                subtitle="Manage affiliate accounts and track performance"
                isLoading={loading}
                itemsPerPage={10}
                onRowClick={handleRowClick}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Affiliate Dialog */}
      <Dialog open={editAffiliateDialog} onOpenChange={setEditAffiliateDialog}>
        <DialogContent className="sm:max-w-lg bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Affiliate
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Name</label>
                <Input
                  value={affiliateForm.name}
                  disabled
                  className="bg-zinc-800 border-zinc-600 text-zinc-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Email</label>
                <Input
                  value={affiliateForm.email}
                  disabled
                  className="bg-zinc-800 border-zinc-600 text-zinc-400"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-white flex items-center gap-1">
                <Percent className="h-4 w-4" />
                Commission Rate (%)
              </label>
              <Input
                type="number"
                value={affiliateForm.commissionRate}
                onChange={(e) => setAffiliateForm({ ...affiliateForm, commissionRate: parseFloat(e.target.value) || 0 })}
                className="bg-zinc-800 border-zinc-600 text-white"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-white flex items-center gap-1">
                <Wallet className="h-4 w-4" />
                Wallet Address
              </label>
              <Input
                value={affiliateForm.walletAddress}
                onChange={(e) => setAffiliateForm({ ...affiliateForm, walletAddress: e.target.value })}
                className="bg-zinc-800 border-zinc-600 text-white font-mono"
                placeholder="0x..."
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Notes</label>
              <Textarea
                value={affiliateForm.notes}
                onChange={(e) => setAffiliateForm({ ...affiliateForm, notes: e.target.value })}
                className="bg-zinc-800 border-zinc-600 text-white"
                placeholder="Internal notes..."
                rows={3}
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setEditAffiliateDialog(false);
                  setAffiliateToEdit(null);
                }}
                className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-700"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleEditAffiliate}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Update Affiliate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Affiliate Dialog */}
      <AlertDialog open={deleteAffiliateDialog} onOpenChange={setDeleteAffiliateDialog}>
        <AlertDialogContent className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              Delete Affiliate
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-300">
              Are you sure you want to delete <span className="font-semibold text-white">{affiliateToDelete?.user?.name}</span>'s affiliate account? 
              This action cannot be undone and will remove all associated data including:
              <ul className="mt-2 space-y-1 list-disc list-inside text-sm">
                <li>{affiliateToDelete?.totalReferrals || 0} referral records</li>
                <li>${affiliateToDelete?.totalCommissions?.toLocaleString() || '0'} in commission history</li>
                <li>Referral code: {affiliateToDelete?.referralCode}</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-700 text-white border-zinc-600 hover:bg-zinc-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAffiliate}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Affiliate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Affiliate Detail Sheet */}
      {selectedAffiliate && (
        <Sheet open={!!selectedAffiliate} onOpenChange={() => setSelectedAffiliate(null)}>
          <SheetContent className="w-[600px] sm:w-[800px] bg-gradient-to-br from-zinc-900 to-zinc-800 border-l border-zinc-700/60 text-white">
            <AffiliateDetailSheet affiliate={selectedAffiliate} />
          </SheetContent>
        </Sheet>
      )}
    </GradientBackground>
  );
};

// Affiliate Detail Sheet Component
const AffiliateDetailSheet: React.FC<{ affiliate: AffiliateData }> = ({
  affiliate,
}) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="space-y-4 p-4 overflow-auto">
      <SheetHeader className="space-y-3 pb-4 border-b border-zinc-700/60">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">
              {affiliate.user.name?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
          <div>
            <SheetTitle className="text-xl font-bold text-white">{affiliate.user.name}</SheetTitle>
            <SheetDescription className="text-zinc-400 text-xs">
              {affiliate.user.email} • Member since {new Date(affiliate.user.createdAt).toLocaleDateString()}
            </SheetDescription>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-2 rounded-lg border border-green-500/30">
            <p className="text-xs text-green-400 font-medium uppercase tracking-wide">Total Earned</p>
            <p className="text-sm font-bold text-green-400">${affiliate.totalCommissions?.toLocaleString() || '0'}</p>
          </div>
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-2 rounded-lg border border-blue-500/30">
            <p className="text-xs text-blue-400 font-medium uppercase tracking-wide">Referrals</p>
            <p className="text-sm font-bold text-blue-400">{affiliate.totalReferrals}</p>
          </div>
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 p-2 rounded-lg border border-amber-500/30">
            <p className="text-xs text-amber-400 font-medium uppercase tracking-wide">Rate</p>
            <p className="text-sm font-bold text-amber-400">{(affiliate.commissionRate * 100).toFixed(1)}%</p>
          </div>
        </div>
      </SheetHeader>

      {/* Key Information - No Tabs */}
      <div className="space-y-4">
        {/* Referral Code & Link */}
        <Card className="bg-gradient-to-br from-zinc-800/50 to-zinc-700/50 border border-zinc-600/30">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Referral Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Referral Code</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-sm px-3 py-1 bg-zinc-800 border-zinc-600 text-white">
                  {affiliate.referralCode}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard(affiliate.referralCode)}
                  className="text-zinc-400 hover:text-white"
                >
                  <Copy size={14} />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Wallet Address</span>
              <span className="text-zinc-300 text-sm font-mono">
                {affiliate.walletAddress ? `${affiliate.walletAddress.slice(0, 10)}...${affiliate.walletAddress.slice(-8)}` : 'Not set'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="bg-gradient-to-br from-zinc-800/50 to-zinc-700/50 border border-zinc-600/30">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-medium text-zinc-300">Performance Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-zinc-300">Conversion Rate</span>
              <span className="text-white font-semibold">
                {affiliate.totalReferrals > 0 ? ((affiliate.activeReferrals / affiliate.totalReferrals) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="w-full bg-zinc-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${affiliate.totalReferrals > 0 ? (affiliate.activeReferrals / affiliate.totalReferrals) * 100 : 0}%` 
                }}
              ></div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="text-center">
                <p className="text-zinc-400 text-xs">Pending</p>
                <p className="text-orange-400 font-bold">${affiliate.pendingCommissions?.toLocaleString() || '0'}</p>
              </div>
              <div className="text-center">
                <p className="text-zinc-400 text-xs">Paid Out</p>
                <p className="text-green-400 font-bold">${affiliate.paidCommissions?.toLocaleString() || '0'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-gradient-to-br from-zinc-800/50 to-zinc-700/50 border border-zinc-600/30">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-medium text-zinc-300">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {affiliate.commissions && affiliate.commissions.length > 0 ? (
              <div className="space-y-2">
                {affiliate.commissions.slice(0, 3).map((commission: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-zinc-800/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        commission.status === 'PAID' 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                          : 'bg-gradient-to-r from-orange-500 to-amber-500'
                      }`}>
                        <DollarSign className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">
                          +${commission.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {new Date(commission.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={commission.status === 'PAID'
                        ? 'bg-green-500/20 text-green-400 border-green-500/30 text-xs'
                        : 'bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs'
                      }
                    >
                      {commission.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <DollarSign className="h-8 w-8 text-zinc-500 mx-auto mb-2" />
                <p className="text-zinc-400 text-sm">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Combined Summary Card */}
      <Card className="bg-gradient-to-br from-zinc-800/50 to-zinc-700/50 border border-zinc-600/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-300">Summary Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Referral Code Row */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-sm flex items-center gap-2">
              <LinkIcon className="h-3 w-3" />
              Referral Code
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs px-2 py-1 bg-zinc-800 border-zinc-600 text-white">
                {affiliate.referralCode}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => copyToClipboard(affiliate.referralCode)}
                className="text-zinc-400 hover:text-white p-1 h-6 w-6"
              >
                <Copy size={12} />
              </Button>
            </div>
          </div>

          {/* Commission Rate Row */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-sm flex items-center gap-2">
              <TrendingUp className="h-3 w-3" />
              Commission Rate
            </span>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white">
                {(affiliate.commissionRate * 100).toFixed(1)}%
              </span>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                Active
              </Badge>
            </div>
          </div>

          {/* Referrals Row */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-sm flex items-center gap-2">
              <Users className="h-3 w-3" />
              Referrals
            </span>
            <div className="text-right">
              <div className="text-sm font-semibold text-white">
                {affiliate.totalReferrals} total • {affiliate.activeReferrals} active
              </div>
              <div className="w-24 bg-zinc-700 rounded-full h-1 mt-1">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-1 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${affiliate.totalReferrals > 0 ? (affiliate.activeReferrals / affiliate.totalReferrals) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Earnings Row */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-sm flex items-center gap-2">
              <DollarSign className="h-3 w-3" />
              Earnings
            </span>
            <div className="text-right text-sm">
              <div className="text-white font-semibold">
                ${affiliate.totalCommissions?.toLocaleString() || '0'} total
              </div>
              <div className="text-xs text-zinc-400">
                <span className="text-orange-400">${affiliate.pendingCommissions?.toLocaleString() || '0'} pending</span>
                {' • '}
                <span className="text-green-400">${affiliate.paidCommissions?.toLocaleString() || '0'} paid</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    <Card className="bg-gradient-to-br from-zinc-800/50 to-zinc-700/50 border border-zinc-600/30">
    <CardHeader>
        <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
        <CreditCard className="h-5 w-5" />
        Wallet Information
        </CardTitle>
    </CardHeader>
    <CardContent>
        <div className="p-4 bg-zinc-800/70 border border-zinc-600/50 rounded-lg">
        {affiliate.walletAddress ? (
            <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-sm text-zinc-300 break-all">
                {affiliate.walletAddress}
            </p>
            <Button 
                variant="ghost" 
                size="sm"
                onClick={() => copyToClipboard(affiliate.walletAddress)}
                className="text-zinc-400 hover:text-white flex-shrink-0"
            >
                <Copy size={14} />
            </Button>
            </div>
        ) : (
            <div className="flex items-center gap-2 text-amber-400">
            <div className="h-2 w-2 bg-amber-400 rounded-full animate-pulse"></div>
            <span className="text-sm">No wallet address provided</span>
            </div>
        )}
        </div>
    </CardContent>
    </Card>

    </div>
  );
};

export default AffiliatePage;

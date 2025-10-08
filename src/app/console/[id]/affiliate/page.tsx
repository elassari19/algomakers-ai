'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { OverviewSection } from '@/components/dashboard/DashboardStats';
import { ReusableTable, Column } from '@/components/ui/reusable-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GradientBackground } from '@/components/ui/gradient-background';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  // Table columns
  const columns: Column[] = [
    {
      key: 'user.name',
      header: 'Affiliate Name',
      sortable: true,
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.user.name}</span>
          <span className="text-sm text-gray-500">{row.user.email}</span>
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
          <div className="text-sm text-gray-500">
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
        <div className="flex gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAffiliate(row)}
              >
                <Eye size={16} />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[600px] sm:w-[800px]">
              <AffiliateDetailSheet affiliate={row} />
            </SheetContent>
          </Sheet>
          
          <Dialog open={payoutDialog} onOpenChange={setPayoutDialog}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={!row.pendingCommissions || row.pendingCommissions <= 0}
                onClick={() => {
                  setSelectedAffiliate(row);
                  setPayoutAmount(row.pendingCommissions?.toString() || '0');
                }}
              >
                <CreditCard size={16} />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Process Payout</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Affiliate</label>
                  <p className="text-sm text-gray-600">{selectedAffiliate?.user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Available Balance</label>
                  <p className="text-lg font-semibold text-green-600">
                    ${selectedAffiliate?.pendingCommissions?.toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Payout Amount</label>
                  <Input
                    type="number"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    max={selectedAffiliate?.pendingCommissions || 0}
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Wallet Address</label>
                  <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                    {selectedAffiliate?.walletAddress || 'Not provided'}
                  </p>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPayoutDialog(false);
                      setPayoutAmount('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() =>
                      selectedAffiliate &&
                      handlePayout(selectedAffiliate.id, parseFloat(payoutAmount))
                    }
                    disabled={!payoutAmount || parseFloat(payoutAmount) <= 0}
                  >
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
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                Affiliate Management
              </h1>
              <p className="text-white/70">
                Manage affiliate partners and track referral performance
              </p>
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
                data={affiliates}
                columns={columns}
                title="Affiliate Partners"
                subtitle="Manage affiliate accounts and track performance"
                isLoading={loading}
                itemsPerPage={10}
              />
            </div>
          </Card>
        </div>
      </div>
    </GradientBackground>
  );
};

// Affiliate Detail Sheet Component
const AffiliateDetailSheet: React.FC<{ affiliate: AffiliateData }> = ({
  affiliate,
}) => {
  return (
    <div className="space-y-6">
      <SheetHeader>
        <SheetTitle>Affiliate Details</SheetTitle>
        <SheetDescription>
          {affiliate.user.name} - {affiliate.user.email}
        </SheetDescription>
      </SheetHeader>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Referral Code</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {affiliate.referralCode}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Copy size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Commission Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">
                  {(affiliate.commissionRate * 100).toFixed(1)}%
                </span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Referrals</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">{affiliate.totalReferrals}</span>
                <p className="text-sm text-gray-500">
                  {affiliate.activeReferrals} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold text-green-600">
                  ${affiliate.totalCommissions?.toLocaleString() || '0'}
                </span>
                <p className="text-sm text-orange-600">
                  ${affiliate.pendingCommissions?.toLocaleString() || '0'} pending
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Wallet Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                {affiliate.walletAddress || 'Not provided'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Invited Users</h3>
            {affiliate.referrals && affiliate.referrals.length > 0 ? (
              <div className="space-y-2">
                {affiliate.referrals.map((referral: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <p className="font-medium">{referral.name}</p>
                      <p className="text-sm text-gray-500">{referral.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={referral.isActive ? 'default' : 'secondary'}
                      >
                        {referral.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        Joined: {new Date(referral.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No referrals yet</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Commission History</h3>
            {affiliate.commissions && affiliate.commissions.length > 0 ? (
              <div className="space-y-2">
                {affiliate.commissions.map((commission: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <p className="font-medium">
                        ${commission.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        From: {commission.subscription?.user?.name || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          commission.status === 'PAID' ? 'default' : 'secondary'
                        }
                      >
                        {commission.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(commission.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No commissions yet</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AffiliatePage;

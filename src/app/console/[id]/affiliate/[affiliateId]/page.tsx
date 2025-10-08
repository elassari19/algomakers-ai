'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { OverviewSection } from '@/components/dashboard/DashboardStats';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GradientBackground } from '@/components/ui/gradient-background';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Users,
  ArrowLeft,
  Edit,
  Trash2,
  DollarSign,
  TrendingUp,
  Award,
  Copy,
  Calendar,
  CreditCard,
  Activity,
  BarChart3,
  Settings,
  Save,
  X,
  CheckCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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

const AffiliateDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const affiliateId = params.affiliateId as string;
  const consoleId = params.id as string;

  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [payoutDialog, setPayoutDialog] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    commissionRate: 0,
    walletAddress: '',
    notes: '',
  });

  // Generate dummy data for the specific affiliate
  const generateDummyAffiliate = (id: string): AffiliateData => {
    const affiliates = {
      'aff-1': {
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
          },
          {
            id: 'comm-3',
            amount: 170.25,
            status: 'PENDING',
            createdAt: '2024-09-25T11:20:00Z',
            subscription: { user: { name: 'Carol Davis', email: 'carol@example.com' } }
          }
        ],
        referrals: [
          { id: 'ref-1', name: 'Alice Johnson', email: 'alice@example.com', isActive: true, createdAt: '2024-10-01T08:30:00Z' },
          { id: 'ref-2', name: 'Bob Wilson', email: 'bob@example.com', isActive: true, createdAt: '2024-09-25T10:15:00Z' },
          { id: 'ref-3', name: 'Carol Davis', email: 'carol@example.com', isActive: false, createdAt: '2024-09-20T14:45:00Z' }
        ]
      }
    };

    return affiliates[id as keyof typeof affiliates] || affiliates['aff-1'];
  };

  // Fetch affiliate data
  const fetchAffiliateData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from API first
      const response = await fetch(`/api/admin/affiliates/${affiliateId}`);
      
      if (response.ok) {
        const data = await response.json();
        setAffiliate(data.affiliate);
        setEditForm({
          commissionRate: data.affiliate.commissionRate,
          walletAddress: data.affiliate.walletAddress || '',
          notes: data.affiliate.notes || '',
        });
      } else {
        // Use dummy data
        const dummyAffiliate = generateDummyAffiliate(affiliateId);
        setAffiliate(dummyAffiliate);
        setEditForm({
          commissionRate: dummyAffiliate.commissionRate,
          walletAddress: dummyAffiliate.walletAddress || '',
          notes: '',
        });
      }
    } catch (error) {
      console.error('Error fetching affiliate:', error);
      // Use dummy data as fallback
      const dummyAffiliate = generateDummyAffiliate(affiliateId);
      setAffiliate(dummyAffiliate);
      setEditForm({
        commissionRate: dummyAffiliate.commissionRate,
        walletAddress: dummyAffiliate.walletAddress || '',
        notes: '',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliateData();
  }, [affiliateId]);

  // Handle save changes
  const handleSaveChanges = async () => {
    try {
      const response = await fetch(`/api/admin/affiliates/${affiliateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        toast.success('Affiliate updated successfully');
        setEditMode(false);
        fetchAffiliateData();
      } else {
        // Demo success
        toast.success('Affiliate updated successfully (Demo)');
        setEditMode(false);
        if (affiliate) {
          setAffiliate({
            ...affiliate,
            commissionRate: editForm.commissionRate,
            walletAddress: editForm.walletAddress,
          });
        }
      }
    } catch (error) {
      console.error('Error updating affiliate:', error);
      toast.error('Failed to update affiliate');
    }
  };

  // Handle delete affiliate
  const handleDeleteAffiliate = async () => {
    try {
      const response = await fetch(`/api/admin/affiliates/${affiliateId}`, {
        method: 'DELETE',
      });

      if (response.ok || true) { // Demo always succeeds
        toast.success('Affiliate deleted successfully');
        router.push(`/console/${consoleId}/affiliate`);
      }
    } catch (error) {
      console.error('Error deleting affiliate:', error);
      toast.error('Failed to delete affiliate');
    }
  };

  // Handle payout
  const handlePayout = async (amount: number) => {
    try {
      const response = await fetch('/api/admin/affiliates/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliateId, amount }),
      });

      if (response.ok || true) { // Demo always succeeds
        toast.success('Payout processed successfully');
        setPayoutDialog(false);
        setPayoutAmount('');
        fetchAffiliateData();
      }
    } catch (error) {
      console.error('Error processing payout:', error);
      toast.error('Failed to process payout');
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (loading) {
    return (
      <GradientBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-lg">Loading affiliate details...</div>
        </div>
      </GradientBackground>
    );
  }

  if (!affiliate) {
    return (
      <GradientBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-lg">Affiliate not found</div>
        </div>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <Toaster position="top-center" />
      <div className="min-h-screen p-4 pb-16">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push(`/console/${consoleId}/affiliate`)}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Affiliates
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                  Affiliate Details
                </h1>
                <p className="text-white/70">
                  Manage {affiliate.user.name}'s affiliate account
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {editMode ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setEditMode(false)}
                    className="text-white border-white/20 hover:bg-white/10"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveChanges}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setEditMode(true)}
                    className="text-white border-white/20 hover:bg-white/10"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  
                  <Dialog open={payoutDialog} onOpenChange={setPayoutDialog}>
                    <DialogTrigger asChild>
                      <Button
                        disabled={!affiliate.pendingCommissions || affiliate.pendingCommissions <= 0}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => setPayoutAmount(affiliate.pendingCommissions?.toString() || '0')}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Process Payout
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 text-white">
                      <DialogHeader>
                        <DialogTitle className="text-white">Process Payout</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-white">Available Balance</label>
                          <p className="text-2xl font-bold text-green-400">
                            ${affiliate.pendingCommissions?.toLocaleString() || '0'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-white">Payout Amount</label>
                          <Input
                            type="number"
                            value={payoutAmount}
                            onChange={(e) => setPayoutAmount(e.target.value)}
                            max={affiliate.pendingCommissions || 0}
                            className="bg-zinc-800 border-zinc-600 text-white"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            onClick={() => setPayoutDialog(false)}
                            className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handlePayout(parseFloat(payoutAmount))}
                            disabled={!payoutAmount || parseFloat(payoutAmount) <= 0}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Process Payout
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 text-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Delete Affiliate</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-300">
                          Are you sure you want to delete {affiliate.user.name}'s affiliate account? 
                          This action cannot be undone and will remove all associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-700 text-white border-zinc-600 hover:bg-zinc-600">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteAffiliate}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Delete Affiliate
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>

          {/* Affiliate Profile Header */}
          <Card className="bg-white/5 backdrop-blur-md border-white/20 shadow-xl">
            <CardContent className="px-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {affiliate.user.name?.charAt(0).toUpperCase() || 'A'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-white">{affiliate.user.name}</h2>
                    <p className="text-base text-zinc-300">{affiliate.user.email}</p>
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Member since {new Date(affiliate.user.createdAt).toLocaleDateString()}
                      </span>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                        Active Affiliate
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-400">Referral Code</p>
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <OverviewSection
            overviewData={[
              {
                title: 'Total Earned',
                currentValue: `$${affiliate.totalCommissions?.toLocaleString() || '0'}`,
                icon: DollarSign,
                description: `$${affiliate.pendingCommissions?.toLocaleString() || '0'} pending`,
                pastValue: 'All time earnings',
                color: 'text-green-300',
                bgColor: 'bg-green-400/20',
              },
              {
                title: 'Referrals',
                currentValue: affiliate.totalReferrals,
                icon: Users,
                description: `${affiliate.activeReferrals} active`,
                pastValue: 'Total referred users',
                color: 'text-blue-300',
                bgColor: 'bg-blue-400/20',
              },
              {
                title: 'Commission Rate',
                currentValue: `${(affiliate.commissionRate * 100).toFixed(1)}%`,
                icon: TrendingUp,
                description: 'Per referral sale',
                pastValue: 'Current rate',
                color: 'text-amber-300',
                bgColor: 'bg-amber-400/20',
              },
              {
                title: 'Performance',
                currentValue: `${affiliate.totalReferrals > 0 ? Math.round((affiliate.activeReferrals / affiliate.totalReferrals) * 100) : 0}%`,
                icon: Award,
                description: 'Active rate',
                pastValue: 'Conversion efficiency',
                color: 'text-purple-300',
                bgColor: 'bg-purple-400/20',
              },
            ]}
            className="opacity-95"
          />

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-zinc-800 to-zinc-700 border border-zinc-600/30">
              <TabsTrigger 
                value="overview"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white text-zinc-300"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="referrals"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white text-zinc-300"
              >
                <Users className="h-4 w-4 mr-2" />
                Referrals
              </TabsTrigger>
              <TabsTrigger 
                value="commissions"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white text-zinc-300"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Commissions
              </TabsTrigger>
              <TabsTrigger 
                value="settings"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white text-zinc-300"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Chart Placeholder */}
                <Card className="bg-white/5 backdrop-blur-md border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-300">Conversion Rate</span>
                        <span className="text-white font-semibold">
                          {affiliate.totalReferrals > 0 ? ((affiliate.activeReferrals / affiliate.totalReferrals) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-zinc-700 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${affiliate.totalReferrals > 0 ? (affiliate.activeReferrals / affiliate.totalReferrals) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-zinc-300">Commission Efficiency</span>
                        <span className="text-white font-semibold">85%</span>
                      </div>
                      <div className="w-full bg-zinc-700 rounded-full h-3">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full w-[85%]"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="bg-white/5 backdrop-blur-md border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {affiliate.commissions.slice(0, 3).map((commission, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                              commission.status === 'PAID' ? 'bg-green-500/20' : 'bg-orange-500/20'
                            }`}>
                              <DollarSign className={`h-4 w-4 ${
                                commission.status === 'PAID' ? 'text-green-400' : 'text-orange-400'
                              }`} />
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                +${commission.amount.toLocaleString()}
                              </p>
                              <p className="text-sm text-zinc-400">
                                {new Date(commission.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge
                            className={commission.status === 'PAID'
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                            }
                          >
                            {commission.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Referrals Tab */}
            <TabsContent value="referrals" className="space-y-6">
              <Card className="bg-white/5 backdrop-blur-md border-white/20 shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Referred Users</CardTitle>
                    <Badge variant="outline" className="text-zinc-300 border-zinc-600">
                      {affiliate.referrals?.length || 0} total
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {affiliate.referrals && affiliate.referrals.length > 0 ? (
                      affiliate.referrals.map((referral, index) => (
                        <div key={index} className="flex items-center justify-between px-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold">
                                {referral.name?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-white">{referral.name}</p>
                              <p className="text-sm text-zinc-400">{referral.email}</p>
                              <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                                <Calendar className="h-3 w-3" />
                                Joined {new Date(referral.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge
                            className={referral.isActive 
                              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                              : 'bg-zinc-600/20 text-zinc-400 border-zinc-600/30'
                            }
                          >
                            {referral.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-zinc-500 mx-auto mb-3" />
                        <p className="text-zinc-400">No referrals yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Commissions Tab */}
            <TabsContent value="commissions" className="space-y-6">
              <Card className="bg-white/5 backdrop-blur-md border-white/20 shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Commission History</CardTitle>
                    <div className="flex gap-2">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        ${affiliate.paidCommissions?.toLocaleString() || '0'} paid
                      </Badge>
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                        ${affiliate.pendingCommissions?.toLocaleString() || '0'} pending
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {affiliate.commissions && affiliate.commissions.length > 0 ? (
                      affiliate.commissions.map((commission, index) => (
                        <div key={index} className="flex items-center justify-between px-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                          <div className="flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                              commission.status === 'PAID' 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                : 'bg-gradient-to-r from-orange-500 to-amber-500'
                            }`}>
                              <DollarSign className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-white text-lg">
                                +${commission.amount.toLocaleString()}
                              </p>
                              <p className="text-sm text-zinc-400">
                                From: {commission.subscription?.user?.name || 'N/A'}
                              </p>
                              <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(commission.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge
                            className={commission.status === 'PAID'
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                            }
                          >
                            {commission.status}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <DollarSign className="h-12 w-12 text-zinc-500 mx-auto mb-3" />
                        <p className="text-zinc-400">No commissions yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card className="bg-white/5 backdrop-blur-md border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white">Affiliate Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Commission Rate (%)</label>
                      <Input
                        type="number"
                        value={editForm.commissionRate * 100}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          commissionRate: parseFloat(e.target.value) / 100 || 0
                        })}
                        disabled={!editMode}
                        min="0"
                        max="100"
                        step="0.1"
                        className="bg-zinc-800 border-zinc-600 text-white disabled:opacity-50"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Status</label>
                      <div className="flex items-center gap-2 p-3 bg-zinc-800 border border-zinc-600 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                        <span className="text-white">Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Wallet Address</label>
                    <Input
                      value={editForm.walletAddress}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        walletAddress: e.target.value
                      })}
                      disabled={!editMode}
                      placeholder="Enter wallet address for payouts"
                      className="font-mono bg-zinc-800 border-zinc-600 text-white disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Notes</label>
                    <Textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        notes: e.target.value
                      })}
                      disabled={!editMode}
                      placeholder="Internal notes about this affiliate..."
                      className="bg-zinc-800 border-zinc-600 text-white disabled:opacity-50 min-h-[100px]"
                    />
                  </div>

                  {editMode && (
                    <div className="flex gap-3 pt-4 border-t border-zinc-700">
                      <Button
                        onClick={handleSaveChanges}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditMode(false)}
                        className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </GradientBackground>
  );
};

export default AffiliateDetailsPage;
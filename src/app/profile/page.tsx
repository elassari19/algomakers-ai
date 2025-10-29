'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { User, Settings, Bell, Shield, ArrowLeft, Loader2, Users, DollarSign, Copy, Share2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { GradientBackground } from '@/components/ui/gradient-background';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileForm } from '@/components/auth/ProfileForm';
import { RoleBadge } from '@/components/auth/RoleBadge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

interface UserData {
  id: string;
  name: string;
  email: string;
  image?: string;
  tradingviewUsername?: string;
  role: string;
  emailVerified?: Date | null;
  createdAt?: Date;
}

interface AffiliateData {
  id: string;
  referralCode: string;
  referralLink: string;
  commissionRate: number;
  walletAddress: string;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  totalReferrals: number;
  activeReferrals: number;
  commissions: any[];
  referrals: any[];
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAffiliate, setIsLoadingAffiliate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState('');

  // Fetch user data from API
  const fetchUserData = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user data');
      }

      const data = await response.json();
      setUserData(data.user);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to fetch user data'
      );

      // Fallback to session data if API fails
      if (session?.user) {
        setUserData({
          id: session.user.id,
          name: session.user.name || '',
          email: session.user.email || '',
          image: session.user.image || undefined,
          tradingviewUsername: session.user.tradingviewUsername,
          role: session.user.role || 'USER',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch affiliate data from API
  const fetchAffiliateData = async () => {
    if (!session?.user?.id) return;

    setIsLoadingAffiliate(true);

    try {
      const response = await fetch('/api/affiliate', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAffiliateData(data.affiliate);
        setWalletAddress(data.affiliate.walletAddress || '');
      }
    } catch (error) {
      console.error('Error fetching affiliate data:', error);
    } finally {
      setIsLoadingAffiliate(false);
    }
  };

  // Update wallet address
  const updateWalletAddress = async () => {
    try {
      const response = await fetch('/api/affiliate', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress }),
      });

      if (response.ok) {
        toast.success('Wallet address updated successfully');
        fetchAffiliateData(); // Refresh data
      } else {
        toast.error('Failed to update wallet address');
      }
    } catch (error) {
      console.error('Error updating wallet:', error);
      toast.error('Failed to update wallet address');
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Generate social sharing links
  const shareOnWhatsApp = (referralLink: string) => {
    const message = `🚀 Join AlgoMarkers AI and start trading smarter! Use my referral link to get started: ${referralLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaEmail = (referralLink: string) => {
    const subject = 'Join AlgoMarkers AI - Smart Trading Platform';
    const body = `Hi there!\n\nI've been using AlgoMarkers AI for my trading and it's amazing! 🚀\n\nJoin me and start trading smarter with AI-powered insights.\n\nUse my referral link: ${referralLink}\n\nBest regards!`;
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = emailUrl;
  };

  // Fetch user data when session is available
  useEffect(() => {
    if (session?.user?.id) {
      fetchUserData();
      fetchAffiliateData();
    }
  }, [session?.user?.id]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
          <div className="text-white text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  // Redirect to signin if not authenticated
  if (status === 'unauthenticated' || !session?.user) {
    if (typeof window !== 'undefined') {
      window.location.href = `/signin?callbackUrl=${encodeURIComponent(
        '/profile'
      )}`;
    }
    return null;
  }

  // Show loading state while fetching user data
  if (!userData && isLoading) {
    return (
      <GradientBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <div className="text-white text-lg">Loading profile...</div>
          </div>
        </div>
      </GradientBackground>
    );
  }

  // Use session data as fallback if userData is not available
  const displayUserData = userData || {
    id: session.user.id,
    name: session.user.name || '',
    email: session.user.email || '',
    image: session.user.image || undefined,
    tradingviewUsername: session.user.tradingviewUsername,
    role: session.user.role || 'USER',
  };

  const handleProfileUpdate = async (data: any) => {
    try {
      // Refresh user data from API after successful update
      await fetchUserData();
    } catch (error) {
      console.error('Profile update error:', error);
    }
  };

  const handleRetryFetch = () => {
    setError(null);
    fetchUserData();
  };

  return (
    <GradientBackground>
      <Toaster position="top-center" />
      {/* Header Navigation */}
      <header className="w-[90%] md:w-[70%] lg:w-[75%] lg:max-w-screen-xl top-5 mx-auto sticky backdrop-blur-md border-zinc-600/80 overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600/10 to-pink-400/10 z-40 flex justify-between items-center px-8 py-4 shadow-lg shadow-black/20">
        <Link
          href="/"
          className="font-bold text-lg flex items-center text-white hover:text-pink-400 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Home
        </Link>
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-600 to-purple-400 flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {displayUserData.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-white font-medium">{displayUserData.name}</p>
            <p className="text-zinc-400 text-sm">{displayUserData.email}</p>
          </div>
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
          )}
        </div>
      </header>

      <div className="container mx-auto px-2 md:px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Error Alert */}
          {error && (
            <Alert className="mb-6 bg-red-500/20 border-red-500/50 text-red-300">
              <AlertDescription className="flex items-center justify-between">
                <span>Failed to load profile data: {error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryFetch}
                  className="ml-2 border-red-500/50 text-red-300 hover:bg-red-500/20"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* User Info Card */}
          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 shadow-lg shadow-black/20 mb-8 py-0">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-r from-pink-600 to-purple-400 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl sm:text-3xl">
                    {displayUserData.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="text-center sm:text-left flex-1">
                  <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">
                      {displayUserData.name || 'User'}
                    </h2>
                    {isLoading && (
                      <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                    )}
                  </div>
                  <p className="text-zinc-400 text-lg mb-2">
                    {displayUserData.email}
                  </p>
                  {displayUserData.tradingviewUsername && (
                    <p className="text-pink-400 font-medium">
                      TradingView: @{displayUserData.tradingviewUsername}
                    </p>
                  )}
                  <div className="mt-4">
                    <RoleBadge role={displayUserData.role as any} size="lg" />
                  </div>
                  {userData?.emailVerified && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                        ✓ Email Verified
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="profile" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-gradient-to-r from-zinc-900 to-zinc-800 border border-zinc-700/60 rounded-2xl p-1">
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-600 data-[state=active]:to-purple-400 data-[state=active]:text-white text-zinc-300 rounded-xl transition-all duration-300"
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="affiliate"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-600 data-[state=active]:to-purple-400 data-[state=active]:text-white text-zinc-300 rounded-xl transition-all duration-300"
              >
                <Users className="h-4 w-4 mr-2" />
                Affiliate
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 shadow-lg shadow-black/20">
                <CardHeader className="border-b border-zinc-700/60 bg-gradient-to-r from-pink-600/10 to-purple-400/10">
                  <CardTitle className="text-white text-xl font-bold">
                    Profile Information
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Update your personal information and TradingView settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-2 md:p-6">
                  <ProfileForm
                    user={{
                      id: displayUserData.id,
                      name: displayUserData.name || '',
                      email: displayUserData.email || '',
                      image: displayUserData.image || undefined,
                      tradingviewUsername: displayUserData.tradingviewUsername,
                    }}
                    onSuccess={handleProfileUpdate}
                    onError={(error) => {
                      console.error('Profile error:', error);
                      setError(error);
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="affiliate">
              <div className="space-y-6">
                {/* Affiliate Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 shadow-lg shadow-black/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-zinc-400 text-sm">Total Referrals</p>
                          <p className="text-2xl font-bold text-white">
                            {affiliateData?.totalReferrals || 0}
                          </p>
                          <p className="text-sm text-green-400">
                            {affiliateData?.activeReferrals || 0} active
                          </p>
                        </div>
                        <Users className="h-8 w-8 text-blue-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 shadow-lg shadow-black/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-zinc-400 text-sm">Total Earnings</p>
                          <p className="text-2xl font-bold text-white">
                            ${affiliateData?.totalEarnings?.toLocaleString() || '0'}
                          </p>
                          <p className="text-sm text-orange-400">
                            ${affiliateData?.pendingEarnings?.toLocaleString() || '0'} pending
                          </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 shadow-lg shadow-black/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-zinc-400 text-sm">Commission Rate</p>
                          <p className="text-2xl font-bold text-white">
                            {((affiliateData?.commissionRate || 0) * 100).toFixed(1)}%
                          </p>
                          <p className="text-sm text-blue-400">Per referral</p>
                        </div>
                        <Badge className="bg-gradient-to-r from-pink-600 to-purple-400 text-white">
                          Active
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Referral Link Section */}
                <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 shadow-lg shadow-black/20">
                  <CardHeader className="border-b border-zinc-700/60 bg-gradient-to-r from-pink-600/10 to-purple-400/10">
                    <CardTitle className="text-white text-xl font-bold">
                      Your Referral Link
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Share this link to earn commissions on new signups
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-white mb-2 block">
                          Referral Code
                        </label>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-lg px-4 py-2">
                            {affiliateData?.referralCode || 'Loading...'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(affiliateData?.referralCode || '')}
                            disabled={!affiliateData?.referralCode}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-white mb-2 block">
                          Referral Link
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={affiliateData?.referralLink || 'Loading...'}
                            readOnly
                            className="font-mono bg-zinc-800 border-zinc-600 text-zinc-300"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(affiliateData?.referralLink || '')}
                            disabled={!affiliateData?.referralLink}
                            className="whitespace-nowrap"
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="default"
                          onClick={() => affiliateData?.referralLink && shareOnWhatsApp(affiliateData.referralLink)}
                          disabled={!affiliateData?.referralLink}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          WhatsApp
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => affiliateData?.referralLink && shareViaEmail(affiliateData.referralLink)}
                          disabled={!affiliateData?.referralLink}
                          className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Email
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => affiliateData?.referralLink && window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`🚀 Join AlgoMarkers AI and start trading smarter! ${affiliateData.referralLink}`)}`, '_blank')}
                          disabled={!affiliateData?.referralLink}
                          className="text-blue-400 hover:bg-blue-400/20"
                        >
                          Twitter
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Wallet Settings */}
                <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 shadow-lg shadow-black/20">
                  <CardHeader className="border-b border-zinc-700/60 bg-gradient-to-r from-pink-600/10 to-purple-400/10">
                    <CardTitle className="text-white text-xl font-bold">
                      Payout Settings
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Configure your wallet address for commission payouts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-white mb-2 block">
                          Wallet Address
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={walletAddress}
                            onChange={(e) => setWalletAddress(e.target.value)}
                            placeholder="Enter your crypto wallet address"
                            className="font-mono bg-zinc-800 border-zinc-600 text-zinc-300"
                          />
                          <Button
                            variant="default"
                            onClick={updateWalletAddress}
                            disabled={isLoadingAffiliate}
                            className="bg-gradient-to-r from-pink-600 to-purple-400 hover:from-pink-700 hover:to-purple-500 text-white whitespace-nowrap"
                          >
                            {isLoadingAffiliate ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Update'
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-zinc-400 mt-2">
                          Enter a valid cryptocurrency wallet address to receive your commission payouts
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 shadow-lg shadow-black/20">
                    <CardHeader className="border-b border-zinc-700/60 bg-gradient-to-r from-pink-600/10 to-purple-400/10">
                      <CardTitle className="text-white text-lg font-bold">
                        Recent Referrals
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {affiliateData?.referrals && affiliateData.referrals.length > 0 ? (
                        <div className="space-y-3">
                          {affiliateData.referrals.slice(0, 5).map((referral: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                              <div>
                                <p className="font-medium text-white text-sm">{referral.name}</p>
                                <p className="text-xs text-zinc-400">{referral.email}</p>
                              </div>
                              <div className="text-right">
                                <Badge variant={referral.isActive ? 'default' : 'secondary'} className="text-xs">
                                  {referral.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                                <p className="text-xs text-zinc-400 mt-1">
                                  {new Date(referral.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-zinc-400 italic">No referrals yet</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 shadow-lg shadow-black/20">
                    <CardHeader className="border-b border-zinc-700/60 bg-gradient-to-r from-pink-600/10 to-purple-400/10">
                      <CardTitle className="text-white text-lg font-bold">
                        Recent Commissions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {affiliateData?.commissions && affiliateData.commissions.length > 0 ? (
                        <div className="space-y-3">
                          {affiliateData.commissions.slice(0, 5).map((commission: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                              <div>
                                <p className="font-medium text-green-400 text-sm">
                                  +${commission.amount.toLocaleString()}
                                </p>
                                <p className="text-xs text-zinc-400">
                                  From: {commission.subscription?.user?.name || 'N/A'}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge variant={commission.status === 'PAID' ? 'default' : 'secondary'} className="text-xs">
                                  {commission.status}
                                </Badge>
                                <p className="text-xs text-zinc-400 mt-1">
                                  {new Date(commission.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-zinc-400 italic">No commissions yet</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </GradientBackground>
  );
}

'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { User, Settings, Bell, Shield, ArrowLeft, Loader2 } from 'lucide-react';
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

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch user data when session is available
  useEffect(() => {
    if (session?.user?.id) {
      fetchUserData();
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

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
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
            <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-zinc-900 to-zinc-800 border border-zinc-700/60 rounded-2xl p-1">
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-600 data-[state=active]:to-purple-400 data-[state=active]:text-white text-zinc-300 rounded-xl transition-all duration-300"
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="account"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-600 data-[state=active]:to-purple-400 data-[state=active]:text-white text-zinc-300 rounded-xl transition-all duration-300"
              >
                <Settings className="h-4 w-4 mr-2" />
                Account
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-600 data-[state=active]:to-purple-400 data-[state=active]:text-white text-zinc-300 rounded-xl transition-all duration-300"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
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
                <CardContent className="p-6">
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

            <TabsContent value="account">
              <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 shadow-lg shadow-black/20">
                <CardHeader className="border-b border-zinc-700/60 bg-gradient-to-r from-pink-600/10 to-purple-400/10">
                  <CardTitle className="text-white text-xl font-bold">
                    Account Settings
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Manage your account security and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid gap-6">
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-zinc-800/50 to-zinc-700/50 rounded-xl border border-zinc-600/30">
                      <div>
                        <h3 className="font-semibold text-white text-lg">
                          Account Status
                        </h3>
                        <p className="text-zinc-400">
                          Your account is active and{' '}
                          {userData?.emailVerified
                            ? 'verified'
                            : 'pending verification'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`h-3 w-3 rounded-full animate-pulse ${
                            userData?.emailVerified
                              ? 'bg-green-500'
                              : 'bg-yellow-500'
                          }`}
                        ></div>
                        <span
                          className={`font-medium ${
                            userData?.emailVerified
                              ? 'text-green-400'
                              : 'text-yellow-400'
                          }`}
                        >
                          {userData?.emailVerified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-zinc-800/50 to-zinc-700/50 rounded-xl border border-zinc-600/30">
                      <div>
                        <h3 className="font-semibold text-white text-lg">
                          Two-Factor Authentication
                        </h3>
                        <p className="text-zinc-400">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-zinc-600 text-zinc-300 hover:bg-gradient-to-r hover:from-pink-600/20 hover:to-purple-400/20 hover:border-pink-500"
                      >
                        Enable
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-zinc-800/50 to-zinc-700/50 rounded-xl border border-zinc-600/30">
                      <div>
                        <h3 className="font-semibold text-white text-lg">
                          Login Sessions
                        </h3>
                        <p className="text-zinc-400">
                          Manage your active login sessions
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-zinc-600 text-zinc-300 hover:bg-gradient-to-r hover:from-pink-600/20 hover:to-purple-400/20 hover:border-pink-500"
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 shadow-lg shadow-black/20">
                <CardHeader className="border-b border-zinc-700/60 bg-gradient-to-r from-pink-600/10 to-purple-400/10">
                  <CardTitle className="text-white text-xl font-bold">
                    Notification Preferences
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Choose what notifications you want to receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-zinc-800/50 to-zinc-700/50 rounded-xl border border-zinc-600/30">
                      <div>
                        <h3 className="font-semibold text-white text-lg">
                          Email Notifications
                        </h3>
                        <p className="text-zinc-400">
                          Receive trading updates and account notifications via
                          email
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-zinc-600 text-zinc-300 hover:bg-gradient-to-r hover:from-pink-600/20 hover:to-purple-400/20 hover:border-pink-500"
                      >
                        Configure
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-zinc-800/50 to-zinc-700/50 rounded-xl border border-zinc-600/30">
                      <div>
                        <h3 className="font-semibold text-white text-lg">
                          Trading Alerts
                        </h3>
                        <p className="text-zinc-400">
                          Get instant notifications about trading signals and
                          market opportunities
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-zinc-600 text-zinc-300 hover:bg-gradient-to-r hover:from-pink-600/20 hover:to-purple-400/20 hover:border-pink-500"
                      >
                        Configure
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-zinc-800/50 to-zinc-700/50 rounded-xl border border-zinc-600/30">
                      <div>
                        <h3 className="font-semibold text-white text-lg">
                          Subscription Updates
                        </h3>
                        <p className="text-zinc-400">
                          Important updates about your subscription and billing
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-zinc-600 text-zinc-300 hover:bg-gradient-to-r hover:from-pink-600/20 hover:to-purple-400/20 hover:border-pink-500"
                      >
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </GradientBackground>
  );
}

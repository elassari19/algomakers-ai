'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { User, Settings, Bell, Shield } from 'lucide-react';

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
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  if (!session?.user) {
    return null;
  }

  const handleProfileUpdate = async (data: any) => {
    setIsLoading(true);
    try {
      // Update session
      await update({
        ...session,
        user: {
          ...session.user,
          ...data,
        },
      });
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Profile Settings
                </h1>
                <p className="text-slate-400">
                  Manage your account and preferences
                </p>
              </div>
            </div>

            {/* User Info Card */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {session.user.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        {session.user.name}
                      </h2>
                      <p className="text-slate-400">{session.user.email}</p>
                      {session.user.tradingviewUsername && (
                        <p className="text-sm text-blue-400">
                          TradingView: @{session.user.tradingviewUsername}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <RoleBadge role={session.user.role as any} size="lg" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border-slate-700">
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-blue-600"
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="account"
                className="data-[state=active]:bg-blue-600"
              >
                <Settings className="h-4 w-4 mr-2" />
                Account
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="data-[state=active]:bg-blue-600"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    Profile Information
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Update your personal information and TradingView settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfileForm
                    user={{
                      id: session.user.id,
                      name: session.user.name || '',
                      email: session.user.email || '',
                      image: session.user.image || undefined,
                      tradingViewUsername: session.user.tradingviewUsername,
                    }}
                    onSuccess={handleProfileUpdate}
                    onError={(error) => console.error('Profile error:', error)}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Account Settings</CardTitle>
                  <CardDescription className="text-slate-400">
                    Manage your account security and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-white">
                          Account Status
                        </h3>
                        <p className="text-sm text-slate-400">
                          Your account is active
                        </p>
                      </div>
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-white">
                          Two-Factor Authentication
                        </h3>
                        <p className="text-sm text-slate-400">
                          Add an extra layer of security
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-slate-200"
                      >
                        Enable
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-white">
                          Login Sessions
                        </h3>
                        <p className="text-sm text-slate-400">
                          Manage your active sessions
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-slate-200"
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    Notification Preferences
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Choose what notifications you want to receive
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-white">
                          Email Notifications
                        </h3>
                        <p className="text-sm text-slate-400">
                          Receive updates via email
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-slate-200"
                      >
                        Configure
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-white">
                          Trading Alerts
                        </h3>
                        <p className="text-sm text-slate-400">
                          Get notified about trading signals
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-slate-200"
                      >
                        Configure
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-white">
                          Subscription Updates
                        </h3>
                        <p className="text-sm text-slate-400">
                          Updates about your subscriptions
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-slate-200"
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
    </ProtectedRoute>
  );
}

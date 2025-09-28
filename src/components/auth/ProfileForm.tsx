'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Mail, Eye, EyeOff, Save, X, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TradingViewUsernameField } from './TradingViewUsernameField';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { toast } from 'sonner';
import { Toaster } from '../ui/sonner';

// Individual form schemas
const nameSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const tradingViewSchema = z.object({
  tradingviewUsername: z.string().optional(), // Fixed: changed from tradingViewUsername to tradingviewUsername
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type NameFormData = z.infer<typeof nameSchema>;
type EmailFormData = z.infer<typeof emailSchema>;
type TradingViewFormData = z.infer<typeof tradingViewSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  tradingviewUsername?: string; // Fixed: changed from tradingViewUsername to tradingviewUsername
}

interface ProfileFormProps {
  user: User;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  className?: string;
}

export function ProfileForm({
  user,
  onSuccess,
  onError,
  onCancel,
  className,
}: ProfileFormProps) {
  const [loadingStates, setLoadingStates] = useState({
    name: false,
    email: false,
    tradingView: false,
    password: false,
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Individual forms
  const nameForm = useForm<NameFormData>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: user.name || '' },
  });

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: user.email || '' },
  });

  const tradingViewForm = useForm<TradingViewFormData>({
    resolver: zodResolver(tradingViewSchema),
    defaultValues: { tradingviewUsername: user.tradingviewUsername || '' }, // Fixed: field name
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const watchedNewPassword = passwordForm.watch('newPassword');

  const setLoading = (field: keyof typeof loadingStates, loading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [field]: loading }));
  };

  const handleApiCall = async (data: any) => {
    const response = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update profile');
    }

    return response.json();
  };

  const onSubmitName = async (data: NameFormData) => {
    setLoading('name', true);
    try {
      const result = await handleApiCall({
        action: 'update-name',
        name: data.name,
      });

      onSuccess?.(result);
      toast.success('Name updated successfully', {
        icon: <Check className="h-5 w-5" />,
        duration: 3000,
        style: { backgroundColor: 'green', color: 'white' },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update name';
      onError?.(message);
      toast.error(message, {
        duration: 3000,
        style: { backgroundColor: 'red', color: 'white' },
      });
    } finally {
      setLoading('name', false);
    }
  };

  const onSubmitEmail = async (data: EmailFormData) => {
    setLoading('email', true);
    try {
      const result = await handleApiCall({
        action: 'update-email',
        email: data.email,
      });

      onSuccess?.(result);
      toast.success('Email updated successfully', {
        icon: <Check className="h-5 w-5" />,
        duration: 3000,
        style: { backgroundColor: 'green', color: 'white' },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update email';
      onError?.(message);
      toast.error(message, {
        duration: 3000,
        style: { backgroundColor: 'red', color: 'white' },
      });
    } finally {
      setLoading('email', false);
    }
  };

  const onSubmitTradingView = async (data: TradingViewFormData) => {
    setLoading('tradingView', true);
    try {
      const result = await handleApiCall({
        action: 'update-tradingview',
        tradingviewUsername: data.tradingviewUsername, // Fixed: field name
      });

      onSuccess?.(result);
      toast.success('TradingView username updated successfully', {
        icon: <Check className="h-5 w-5" />,
        duration: 3000,
        style: { backgroundColor: 'green', color: 'white' },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to update TradingView username';
      onError?.(message);
      toast.error(message, {
        duration: 3000,
        style: { backgroundColor: 'red', color: 'white' },
      });
    } finally {
      setLoading('tradingView', false);
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    setLoading('password', true);
    try {
      const result = await handleApiCall({
        action: 'update-password',
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      onSuccess?.(result);
      toast.success('Password updated successfully', {
        icon: <Check className="h-5 w-5" />,
        duration: 3000,
        style: { backgroundColor: 'green', color: 'white' },
      });

      // Reset password form and hide section
      passwordForm.reset();
      setIsChangingPassword(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update password';
      onError?.(message);
      toast.error(message, {
        duration: 3000,
        style: { backgroundColor: 'red', color: 'white' },
      });
    } finally {
      setLoading('password', false);
    }
  };

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    passwordForm.reset();
  };

  return (
    <div className={className}>
      <Toaster toastOptions={{ duration: 3000 }} position="top-center" />

      {/* Profile Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Profile Information</span>
          </CardTitle>
          <CardDescription>
            Update your personal information and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.image} alt={user.name} />
              <AvatarFallback className="text-lg">
                {user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">Profile Picture</h3>
              <p className="text-sm text-muted-foreground">
                Profile pictures are managed through your social login provider.
              </p>
            </div>
          </div>

          <Separator />

          {/* Name Section */}
          <Form {...nameForm}>
            <form
              onSubmit={nameForm.handleSubmit(onSubmitName)}
              className="space-y-4"
            >
              <FormField
                control={nameForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter your full name"
                          {...field}
                          disabled={loadingStates.name}
                          className="flex-1"
                        />
                        <Button
                          type="submit"
                          size="sm"
                          disabled={
                            loadingStates.name || !nameForm.formState.isDirty
                          }
                        >
                          {loadingStates.name ? (
                            'Saving...'
                          ) : (
                            <>
                              <Save className="mr-1 h-3 w-3" />
                              Save
                            </>
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          <Separator />

          {/* Email Section */}
          <Form {...emailForm}>
            <form
              onSubmit={emailForm.handleSubmit(onSubmitEmail)}
              className="space-y-4"
            >
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Enter your email address"
                            className="pl-10"
                            type="email"
                            {...field}
                            disabled={loadingStates.email}
                          />
                        </div>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={
                            loadingStates.email || !emailForm.formState.isDirty
                          }
                        >
                          {loadingStates.email ? (
                            'Saving...'
                          ) : (
                            <>
                              <Save className="mr-1 h-3 w-3" />
                              Save
                            </>
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      This email is used for login and notifications.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          <Separator />

          {/* TradingView Username Section */}
          <Form {...tradingViewForm}>
            <form
              onSubmit={tradingViewForm.handleSubmit(onSubmitTradingView)}
              className="space-y-4"
            >
              <FormField
                control={tradingViewForm.control}
                name="tradingviewUsername" // Fixed: field name
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TradingView Username</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <TradingViewUsernameField
                            {...field}
                            value={field.value || ''} // Fixed: use field.value instead of defaultValue
                            disabled={loadingStates.tradingView}
                          />
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="submit"
                            size="sm"
                            disabled={
                              loadingStates.tradingView ||
                              !tradingViewForm.formState.isDirty
                            }
                          >
                            {loadingStates.tradingView ? (
                              'Saving...'
                            ) : (
                              <>
                                <Save className="mr-1 h-3 w-3" />
                                Save
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Connect your TradingView account to receive personalized
                      alerts.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Password Change Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>Change Password</span>
            </div>
            {!isChangingPassword && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsChangingPassword(true)}
                disabled={loadingStates.password}
              >
                Change Password
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            {isChangingPassword
              ? 'Enter your current password and choose a new one.'
              : 'Keep your account secure with a strong password.'}
          </CardDescription>
        </CardHeader>

        {isChangingPassword && (
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Changing your password will sign you out of all other devices.
              </AlertDescription>
            </Alert>

            <Form {...passwordForm}>
              <form
                onSubmit={passwordForm.handleSubmit(onSubmitPassword)}
                className="space-y-4"
              >
                {/* Current Password */}
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showCurrentPassword ? 'text' : 'password'}
                            placeholder="Enter current password"
                            className="pr-10"
                            {...field}
                            disabled={loadingStates.password}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() =>
                              setShowCurrentPassword(!showCurrentPassword)
                            }
                            disabled={loadingStates.password}
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* New Password */}
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showNewPassword ? 'text' : 'password'}
                            placeholder="Enter new password"
                            className="pr-10"
                            {...field}
                            disabled={loadingStates.password}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            disabled={loadingStates.password}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      {watchedNewPassword && (
                        <PasswordStrengthMeter password={watchedNewPassword} />
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirm Password */}
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm new password"
                            className="pr-10"
                            {...field}
                            disabled={loadingStates.password}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            disabled={loadingStates.password}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-2">
                  <Button type="submit" disabled={loadingStates.password}>
                    {loadingStates.password ? (
                      'Updating...'
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Update Password
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelPasswordChange}
                    disabled={loadingStates.password}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default ProfileForm;

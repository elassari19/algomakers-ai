'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { handleAuthError } from '@/lib/constant-errors';
import { toast } from 'sonner';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenEmail, setTokenEmail] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
  });

  const password = watch('password', '');

  // Verify token on page load
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenValid(false);
        setError(handleAuthError('No reset token provided'));
        return;
      }

      try {
        const response = await fetch(
          `/api/auth/reset-password?token=${encodeURIComponent(token)}`
        );
        const data = await response.json();

        if (response.ok && data.valid) {
          setTokenValid(true);
          setTokenEmail(data.email);
        } else {
          setTokenValid(false);
          setError(
            handleAuthError(data.error || 'Invalid or expired reset token')
          );
        }
      } catch (err) {
        setTokenValid(false);
        setError(handleAuthError('Failed to verify reset token'));
      }
    };

    verifyToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Password reset successful!', {
          description: 'You can now sign in with your new password.',
          duration: 2000,
          style: { backgroundColor: '#22c55e', color: '#fff' },
        });
        setSuccess(true);
        setTimeout(() => {
          router.push('/signin?message=password-reset-success');
        }, 2000);
      } else {
        const userFriendlyError = handleAuthError(error);

        toast.error('Password reset failed', {
          description: userFriendlyError,
          duration: 4000,
          style: { backgroundColor: '#ef4444', color: '#fff' },
        });
        setError(userFriendlyError);
      }
    } catch (err) {
      const userFriendlyError = handleAuthError('An unexpected error occurred');
      toast.error('Password reset failed', {
        description: userFriendlyError,
        duration: 4000,
        style: { backgroundColor: '#ef4444', color: '#fff' },
      });
      setError(userFriendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while verifying token
  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex">
        {/* Left side - Illuminated image */}
        <div className="hidden lg:flex lg:w-[55%] relative rounded-tr-3xl rounded-br-3xl overflow-hidden">
          <Image
            src="/illuminated.png"
            alt="Markets illuminated"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Right side - Loading */}
        <div className="w-full lg:w-[45%] bg-black flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <Card className="w-full max-w-md bg-transparent border-none shadow-none">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-white">
                  Verifying reset token...
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex">
        {/* Left side - Illuminated image */}
        <div className="hidden lg:flex lg:w-[55%] relative rounded-tr-3xl rounded-br-3xl overflow-hidden">
          <Image
            src="/illuminated.png"
            alt="Markets illuminated"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Right side - Error state */}
        <div className="w-full lg:w-[45%] bg-black flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md space-y-8">
            {/* Logo */}
            <div className="text-center">
              <div className="mx-auto h-12 flex items-center justify-center">
                <Image
                  src="/logo.svg"
                  alt="Algo markers"
                  width={24}
                  height={24}
                  className="h-20 w-60 object-contain"
                />
              </div>
            </div>

            <Card className="bg-transparent border-none shadow-none p-0">
              <CardHeader className="text-center px-0">
                <div className="mx-auto w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <CardTitle className="text-xl font-semibold text-white">
                  Invalid Reset Link
                </CardTitle>
                <CardDescription className="text-slate-400">
                  This password reset link is invalid or has expired.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                {error && (
                  <Alert className="mb-4 bg-red-900/20 border-red-500/50 text-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-4">
                  <Button
                    asChild
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Link href="/forgot-password">Request New Reset Link</Link>
                  </Button>
                  <Button
                    variant="outline"
                    asChild
                    className="w-full border-slate-600 text-slate-400 hover:text-white hover:border-slate-500"
                  >
                    <Link href="/signin">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Sign In
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex">
        {/* Left side - Illuminated image */}
        <div className="hidden lg:flex lg:w-[55%] relative rounded-tr-3xl rounded-br-3xl overflow-hidden">
          <Image
            src="/illuminated.png"
            alt="Markets illuminated"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Right side - Success state */}
        <div className="w-full lg:w-[45%] bg-black flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md space-y-8">
            {/* Logo */}
            <div className="text-center">
              <div className="mx-auto h-12 flex items-center justify-center">
                <Image
                  src="/logo.svg"
                  alt="Algo markers"
                  width={24}
                  height={24}
                  className="h-20 w-60 object-contain"
                />
              </div>
            </div>

            <Card className="bg-transparent border-none shadow-none p-0">
              <CardHeader className="text-center px-0">
                <div className="mx-auto w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <CardTitle className="text-xl font-semibold text-white">
                  Password Reset Successful
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Your password has been updated successfully. You will be
                  redirected to the sign-in page shortly.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <Button
                  asChild
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Link href="/signin">Continue to Sign In</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Illuminated image */}
      <div className="hidden lg:flex lg:w-[55%] relative rounded-tr-3xl rounded-br-3xl overflow-hidden">
        <Image
          src="/illuminated.png"
          alt="Markets illuminated"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Right side - Reset password form */}
      <div className="w-full lg:w-[45%] bg-black flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="mx-auto h-12 flex items-center justify-center">
              <Image
                src="/logo.svg"
                alt="Algo markers"
                width={24}
                height={24}
                className="h-20 w-60 object-contain"
              />
            </div>
          </div>

          {/* Reset Password Card */}
          <Card className="bg-transparent border-none shadow-none p-0">
            <CardHeader className="text-center px-0 pb-6">
              <CardTitle className="text-2xl font-bold text-white">
                Reset Your Password
              </CardTitle>
              <CardDescription className="text-slate-400">
                Enter a new password for {tokenEmail}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert className="bg-red-900/20 border-red-500/50 text-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      {...register('password')}
                      className={`bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500 ${
                        errors.password ? 'border-red-500' : ''
                      }`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-slate-400 hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-400">
                      {errors.password.message}
                    </p>
                  )}
                  {password && <PasswordStrengthMeter password={password} />}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      {...register('confirmPassword')}
                      className={`bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500 ${
                        errors.confirmPassword ? 'border-red-500' : ''
                      }`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-slate-400 hover:text-white"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-400">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!isValid || isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Resetting Password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    variant="link"
                    asChild
                    className="text-slate-400 hover:text-white"
                  >
                    <Link href="/signin" className="text-sm">
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Back to Sign In
                    </Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex">
          {/* Left side - Illuminated image */}
          <div className="hidden lg:flex lg:w-[55%] relative rounded-tr-3xl rounded-br-3xl overflow-hidden">
            <Image
              src="/illuminated.png"
              alt="Markets illuminated"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Right side - Loading */}
          <div className="w-full lg:w-[45%] bg-black flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="text-white">Loading...</div>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

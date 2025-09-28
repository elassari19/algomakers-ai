'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

import { AuthForm, AuthRedirect } from '@/components/auth';
import { Toaster } from '@/components/ui/sonner';
import { handleAuthError } from '@/lib/constant-errors';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const message = searchParams.get('message');

  // Show success message for password reset
  useEffect(() => {
    if (message === 'password-reset-success') {
      toast.success('Password reset successful!', {
        description: 'You can now sign in with your new password.',
        duration: 2000,
        style: { backgroundColor: '#22c55e', color: '#fff' },
      });
    }
  }, [message]);

  const handleSuccess = () => {
    toast.success('Welcome back! Redirecting to dashboard...', {
      description: 'You have successfully signed in.',
      duration: 1000,
      style: { backgroundColor: '#22c55e', color: '#fff' },
    });
    setTimeout(() => {
      router.push(callbackUrl);
      router.refresh();
    }, 1000);
  };

  const handleError = (error: string) => {
    const userFriendlyError = handleAuthError(error);
    toast.error('Sign in failed', {
      description: userFriendlyError,
      duration: 4000,
      style: { backgroundColor: '#ef4444', color: '#fff' },
    });
  };

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

      {/* Right side - Sign in form */}
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

          {/* Auth Form */}
          <AuthForm
            mode="login"
            onSuccess={handleSuccess}
            onError={handleError}
            className="bg-transparent border-none shadow-none p-0"
          />

          <div className="text-center">
            <p className="text-slate-400">
              Don't have an account?{' '}
              <Link
                href="/signup"
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <AuthRedirect>
      <Suspense
        fallback={
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
            <div className="text-white">Loading...</div>
          </div>
        }
      >
        <SignInForm />
      </Suspense>
      <Toaster position="top-center" />
    </AuthRedirect>
  );
}

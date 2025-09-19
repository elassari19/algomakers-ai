'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

import { AuthForm } from '@/components/auth/AuthForm';
import { Toaster } from '@/components/ui/sonner';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleSuccess = () => {
    toast.success('Welcome back! Redirecting to dashboard...', {
      description: 'You have successfully signed in.',
    });
    setTimeout(() => {
      router.push(callbackUrl);
      router.refresh();
    }, 1000);
  };

  const handleError = (error: string) => {
    toast.error('Sign in failed', {
      description: error || 'Invalid email or password. Please try again.',
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
            <div className="mx-auto h-12 w-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
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
    <>
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
    </>
  );
}

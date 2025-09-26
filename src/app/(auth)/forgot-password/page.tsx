'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { Toaster } from '@/components/ui/sonner';
import { handleAuthError } from '@/lib/constant-errors';

export default function ForgotPasswordPage() {
  const handleSuccess = (email: string) => {
    toast.success('New password sent!', {
      description: `Check your email at ${email} for your new temporary password.`,
      duration: 3000,
      style: { backgroundColor: '#22c55e', color: '#fff' },
    });
  };

  const handleError = (error: string) => {
    const userFriendlyError = handleAuthError(error);
    toast.error('Failed to send password', {
      description: userFriendlyError,
      duration: 3000,
      style: { backgroundColor: '#ef4444', color: '#fff' },
    });
  };

  const handleBack = () => {
    window.location.href = '/signin';
  };

  return (
    <>
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

        {/* Right side - Forgot password form */}
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

            {/* Forgot Password Form */}
            <ForgotPasswordForm
              onSuccess={handleSuccess}
              onError={handleError}
              onBack={handleBack}
              className="bg-transparent border-none shadow-none p-0"
            />

            <div className="text-center">
              <p className="text-slate-400">
                Remember your password?{' '}
                <Link
                  href="/signin"
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Toaster position="top-center" />
    </>
  );
}

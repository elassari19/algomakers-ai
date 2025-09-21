'use client';

import Image from 'next/image';
import { toast } from 'sonner';
import { AuthForm } from '@/components/auth/AuthForm';
import { Toaster } from '@/components/ui/sonner';
import Link from 'next/link';

export default function SignUpPage() {
  const handleSuccess = () => {
    toast.success('Account created successfully!', {
      description:
        'Please check your email to verify your account, then sign in.',
    });
    setTimeout(() => {
      window.location.href = '/signin';
    }, 2000);
  };

  const handleError = (error: string) => {
    toast.error('Sign up failed', {
      description: error || 'An error occurred while creating your account.',
    });
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

        {/* Right side - Sign up form */}
        <div className="w-full lg:w-[45%] bg-black flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md space-y-2">
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

            <AuthForm
              mode="signup"
              onSuccess={handleSuccess}
              onError={handleError}
              className="bg-transparent border-0 shadow-none m-0"
            />
            <div className="text-center">
              <p className="text-slate-400">
                Create account?{' '}
                <Link
                  href="/signin"
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Sign in
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
